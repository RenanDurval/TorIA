/**
 * TorAI — Cliente HTTP para comunicação com Ollama e LMStudio.
 * 
 * Módulo central que gerencia conexão, detecção automática de provedor,
 * listagem de modelos e envio de requisições chat ao modelo local.
 * 
 * SEGURANÇA: Todas as URLs são validadas via security.ts.
 * Apenas conexões para 127.0.0.1/localhost são permitidas.
 */

import type {
  Provider,
  ConnectionStatus,
  ProviderInfo,
  ChatCompletionRequest,
  ChatCompletionResponse,
  ModelInfo,
  UserSettings,
} from '../shared/types';

import {
  OLLAMA_DEFAULT_URL,
  LMSTUDIO_DEFAULT_URL,
  OLLAMA_HEALTH_ENDPOINT,
  LMSTUDIO_HEALTH_ENDPOINT,
  OLLAMA_MODELS_ENDPOINT,
  LMSTUDIO_MODELS_ENDPOINT,
  CHAT_COMPLETIONS_ENDPOINT,
  MAX_RETRIES,
  RETRY_BASE_DELAY_MS,
  RETRY_MAX_DELAY_MS,
  REQUEST_TIMEOUT_MS,
  HEALTH_CHECK_TIMEOUT_MS,
} from '../shared/constants';

import { validateLocalUrl, buildSafeUrl, validateModelName } from './security';

// ─── Estado do Cliente ───────────────────────────────────────────

let currentProvider: Provider | null = null;
let currentBaseUrl: string | null = null;
let currentStatus: ConnectionStatus = 'disconnected';
let availableModels: string[] = [];
let activeModel: string | null = null;
let lastLatency: number | null = null;
let activeAbortController: AbortController | null = null;

// ─── Getters de Estado ───────────────────────────────────────────

/** Retorna informações atuais do provedor */
export function getProviderInfo(): ProviderInfo {
  return {
    provider: currentProvider || 'ollama',
    baseUrl: currentBaseUrl || '',
    status: currentStatus,
    models: [...availableModels],
    activeModel,
    latencyMs: lastLatency,
  };
}

/** Retorna o status de conexão atual */
export function getConnectionStatus(): ConnectionStatus {
  return currentStatus;
}

// ─── Detecção Automática de Provedor ─────────────────────────────

/**
 * Detecta automaticamente qual provedor (Ollama ou LMStudio) está disponível.
 * Tenta Ollama primeiro, depois LMStudio.
 * 
 * @returns Provider detectado ou null se nenhum estiver disponível
 */
export async function autoDetectProvider(): Promise<{
  provider: Provider;
  url: string;
} | null> {
  // Tentar Ollama primeiro
  try {
    const ollamaUrl = buildSafeUrl(OLLAMA_DEFAULT_URL, OLLAMA_HEALTH_ENDPOINT);
    const response = await fetchWithTimeout(ollamaUrl, {
      method: 'GET',
      timeout: HEALTH_CHECK_TIMEOUT_MS,
    });
    if (response.ok) {
      return { provider: 'ollama', url: OLLAMA_DEFAULT_URL };
    }
  } catch {
    // Ollama não disponível, tentar LMStudio
  }

  // Tentar LMStudio
  try {
    const lmstudioUrl = buildSafeUrl(LMSTUDIO_DEFAULT_URL, LMSTUDIO_HEALTH_ENDPOINT);
    const response = await fetchWithTimeout(lmstudioUrl, {
      method: 'GET',
      timeout: HEALTH_CHECK_TIMEOUT_MS,
    });
    if (response.ok) {
      return { provider: 'lmstudio', url: LMSTUDIO_DEFAULT_URL };
    }
  } catch {
    // LMStudio também não disponível
  }

  return null;
}

// ─── Conexão e Desconexão ────────────────────────────────────────

/**
 * Conecta ao provedor de IA especificado.
 * Valida URL, verifica saúde e carrega lista de modelos.
 */
export async function connect(
  provider: Provider,
  baseUrl: string,
  model?: string,
): Promise<ProviderInfo> {
  // Validar URL antes de qualquer conexão
  validateLocalUrl(baseUrl);

  currentStatus = 'connecting';
  currentProvider = provider;
  currentBaseUrl = baseUrl;

  try {
    // Verificar saúde do provedor
    const healthEndpoint = provider === 'ollama'
      ? OLLAMA_HEALTH_ENDPOINT
      : LMSTUDIO_HEALTH_ENDPOINT;

    const healthUrl = buildSafeUrl(baseUrl, healthEndpoint);
    const startTime = Date.now();
    const response = await fetchWithTimeout(healthUrl, {
      method: 'GET',
      timeout: HEALTH_CHECK_TIMEOUT_MS,
    });

    if (!response.ok) {
      throw new Error(`Provedor retornou status ${response.status}`);
    }

    lastLatency = Date.now() - startTime;

    // Carregar lista de modelos
    availableModels = await listModels(provider, baseUrl);

    // Selecionar modelo
    if (model && validateModelName(model) && availableModels.includes(model)) {
      activeModel = model;
    } else if (availableModels.length > 0) {
      activeModel = availableModels[0];
    } else {
      activeModel = null;
    }

    currentStatus = 'connected';
  } catch (error) {
    currentStatus = 'error';
    availableModels = [];
    activeModel = null;
    lastLatency = null;
    throw error;
  }

  return getProviderInfo();
}

/**
 * Desconecta do provedor atual e limpa estado.
 */
export function disconnect(): void {
  cancelActiveRequest();
  currentStatus = 'disconnected';
  currentProvider = null;
  currentBaseUrl = null;
  availableModels = [];
  activeModel = null;
  lastLatency = null;
}

/**
 * Atualiza o modelo ativo.
 */
export function setActiveModel(model: string): boolean {
  if (validateModelName(model) && availableModels.includes(model)) {
    activeModel = model;
    return true;
  }
  return false;
}

// ─── Listagem de Modelos ─────────────────────────────────────────

/**
 * Lista os modelos disponíveis no provedor.
 */
export async function listModels(
  provider?: Provider,
  baseUrl?: string,
): Promise<string[]> {
  const prov = provider || currentProvider;
  const url = baseUrl || currentBaseUrl;

  if (!prov || !url) {
    return [];
  }

  try {
    if (prov === 'ollama') {
      return await listOllamaModels(url);
    } else {
      return await listLMStudioModels(url);
    }
  } catch {
    return [];
  }
}

/** Lista modelos do Ollama via /api/tags */
async function listOllamaModels(baseUrl: string): Promise<string[]> {
  const url = buildSafeUrl(baseUrl, OLLAMA_MODELS_ENDPOINT);
  const response = await fetchWithTimeout(url, {
    method: 'GET',
    timeout: HEALTH_CHECK_TIMEOUT_MS,
  });

  if (!response.ok) {
    return [];
  }

  const data = await response.json() as { models?: Array<{ name: string }> };
  return (data.models || []).map(m => m.name);
}

/** Lista modelos do LMStudio via /v1/models (formato OpenAI) */
async function listLMStudioModels(baseUrl: string): Promise<string[]> {
  const url = buildSafeUrl(baseUrl, LMSTUDIO_MODELS_ENDPOINT);
  const response = await fetchWithTimeout(url, {
    method: 'GET',
    timeout: HEALTH_CHECK_TIMEOUT_MS,
  });

  if (!response.ok) {
    return [];
  }

  const data = await response.json() as { data?: Array<{ id: string }> };
  return (data.data || []).map(m => m.id);
}

// ─── Envio de Chat Completion ────────────────────────────────────

/**
 * Envia uma requisição de chat completion ao modelo local.
 * Usa o formato OpenAI-compatible que ambos provedores suportam.
 * 
 * @param request - Corpo da requisição (model, messages, params)
 * @returns Resposta do modelo
 */
export async function sendChatCompletion(
  request: ChatCompletionRequest,
): Promise<ChatCompletionResponse> {
  if (currentStatus !== 'connected' || !currentBaseUrl) {
    throw new Error('Não conectado a nenhum provedor de IA local.');
  }

  if (!request.model && activeModel) {
    request.model = activeModel;
  }

  if (!validateModelName(request.model)) {
    throw new Error(`Nome de modelo inválido: ${request.model}`);
  }

  // Garantir streaming desabilitado (simplifica parsing)
  request.stream = false;

  const url = buildSafeUrl(currentBaseUrl, CHAT_COMPLETIONS_ENDPOINT);

  const startTime = Date.now();

  const response = await fetchWithRetry(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
    timeout: request.timeoutMs || REQUEST_TIMEOUT_MS,
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => 'Sem detalhes');
    throw new Error(
      `Erro do modelo (HTTP ${response.status}): ${errorBody}`
    );
  }

  const result = await response.json() as ChatCompletionResponse;
  lastLatency = Date.now() - startTime;

  return result;
}

/**
 * Cancela a requisição ativa, se houver.
 */
export function cancelActiveRequest(): void {
  if (activeAbortController) {
    activeAbortController.abort();
    activeAbortController = null;
  }
}

// ─── Fetch com Timeout ───────────────────────────────────────────

interface FetchOptions extends RequestInit {
  timeout?: number;
}

/**
 * Fetch com timeout configurável e AbortController.
 */
async function fetchWithTimeout(
  url: string,
  options: FetchOptions = {},
): Promise<Response> {
  const { timeout = REQUEST_TIMEOUT_MS, ...fetchOptions } = options;

  // Cancelar requisição anterior se existir
  cancelActiveRequest();

  const controller = new AbortController();
  activeAbortController = controller;

  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
    });
    return response;
  } catch (error: any) {
    if (error.name === 'AbortError') {
      throw new Error(`Requisição expirou após ${timeout}ms`);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
    if (activeAbortController === controller) {
      activeAbortController = null;
    }
  }
}

// ─── Fetch com Retry (Exponential Backoff) ───────────────────────

/**
 * Fetch com retry automático e exponential backoff.
 * Tenta até MAX_RETRIES vezes com delay crescente entre tentativas.
 */
async function fetchWithRetry(
  url: string,
  options: FetchOptions = {},
): Promise<Response> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetchWithTimeout(url, options);

      // Retry apenas para erros de servidor (5xx), não para erros de cliente (4xx)
      if (response.status >= 500 && attempt < MAX_RETRIES) {
        throw new Error(`Erro do servidor: ${response.status}`);
      }

      return response;
    } catch (error: any) {
      lastError = error;

      // Não fazer retry se foi cancelado intencionalmente
      if (error.message?.includes('expirou') || error.name === 'AbortError') {
        throw error;
      }

      // Calcular delay com exponential backoff + jitter
      if (attempt < MAX_RETRIES) {
        const baseDelay = RETRY_BASE_DELAY_MS * Math.pow(2, attempt);
        const jitter = Math.random() * RETRY_BASE_DELAY_MS;
        const delay = Math.min(baseDelay + jitter, RETRY_MAX_DELAY_MS);

        await sleep(delay);
      }
    }
  }

  throw lastError || new Error('Falha após todas as tentativas de conexão');
}

/** Utilidade de sleep para backoff */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ─── Reset para Testes ───────────────────────────────────────────

/** Reset do estado interno (uso em testes apenas) */
export function _resetForTesting(): void {
  disconnect();
}
