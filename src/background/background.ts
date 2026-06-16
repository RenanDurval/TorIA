/**
 * TorAI — Background script (orquestrador central).
 * 
 * Ponto central da extensão que:
 * - Recebe mensagens de popup, sidebar e content script
 * - Gerencia conexão com provedor de IA local
 * - Roteia requisições para o ai-client
 * - Processa atalhos de teclado
 * - Persiste e carrega configurações
 * - Limpa dados temporários após cada operação
 */

import type {
  UserSettings,
  AIRequest,
  AIResponse,
  PageContent,
  ChatCompletionRequest,
  Provider,
} from '../shared/types';

import { DEFAULT_SETTINGS } from '../shared/types';

import {
  STORAGE_KEY_SETTINGS,
} from '../shared/constants';

import type { ExtensionMessage } from '../shared/messages';

import {
  autoDetectProvider,
  connect,
  disconnect,
  getProviderInfo,
  sendChatCompletion,
  listModels,
  setActiveModel,
  cancelActiveRequest,
} from './ai-client';

import { buildPrompt } from './prompt-builder';
import {
  sanitizeText,
  sanitizeSnippet,
  clearTemporaryData,
  validateModelParams,
  checkResponseSafety,
} from './security';

// ─── Estado ──────────────────────────────────────────────────────

let currentSettings: UserSettings = { ...DEFAULT_SETTINGS };

// ─── Inicialização ───────────────────────────────────────────────

/**
 * Inicializa a extensão: carrega configurações e tenta conectar.
 */
async function initialize(): Promise<void> {
  console.log('[TorAI] Inicializando extensão...');

  // Carregar configurações salvas
  await loadSettings();

  // Tentar auto-detectar provedor se configurado
  if (currentSettings.autoDetectProvider) {
    try {
      const detected = await autoDetectProvider();
      if (detected) {
        await connect(detected.provider, detected.url, currentSettings.model);
        console.log(`[TorAI] Conectado automaticamente ao ${detected.provider}`);
      } else {
        console.log('[TorAI] Nenhum provedor de IA local detectado');
      }
    } catch (error) {
      console.warn('[TorAI] Falha na auto-detecção:', error);
    }
  }

  console.log('[TorAI] Extensão inicializada');
}

// ─── Listener de Mensagens ───────────────────────────────────────

/**
 * Handler principal de mensagens.
 * Recebe mensagens de popup, sidebar e content script.
 */
function handleMessage(
  message: ExtensionMessage,
  sender: any,
  sendResponse: (response: any) => void,
): boolean {
  // Processar assincronamente
  handleMessageAsync(message, sender)
    .then(sendResponse)
    .catch(error => {
      console.error('[TorAI] Erro ao processar mensagem:', error);
      sendResponse({
        action: 'ERROR',
        data: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Erro interno da extensão',
        },
      });
    });

  // Retornar true para indicar resposta assíncrona
  return true;
}

async function handleMessageAsync(
  message: ExtensionMessage,
  _sender: any,
): Promise<any> {
  switch (message.action) {
    // ── Status e Conexão ──
    case 'GET_STATUS':
      return getProviderInfo();

    case 'CONNECT_PROVIDER': {
      const data = (message as any).data || {};
      const provider = (data.provider || currentSettings.provider) as Provider;
      const url = data.url || (
        provider === 'ollama' ? currentSettings.ollamaUrl : currentSettings.lmstudioUrl
      );
      return await connect(provider, url, currentSettings.model);
    }

    case 'DISCONNECT_PROVIDER':
      disconnect();
      return { success: true };

    // ── Configurações ──
    case 'GET_SETTINGS':
      return { ...currentSettings };

    case 'SAVE_SETTINGS': {
      const newSettings = (message as any).data as Partial<UserSettings>;
      await saveSettings(newSettings);
      return { success: true, settings: { ...currentSettings } };
    }

    // ── Modelos ──
    case 'LIST_MODELS': {
      const models = await listModels();
      return { models };
    }

    // ── Processamento IA ──
    case 'PROCESS_AI_REQUEST': {
      const request = (message as any).data as AIRequest;
      return await processAIRequest(request);
    }

    case 'CANCEL_REQUEST':
      cancelActiveRequest();
      return { success: true };

    // ── Content Script ──
    case 'EXTRACT_PAGE_TEXT':
    case 'EXTRACT_SELECTION':
    case 'GET_PAGE_INFO':
      // Estas mensagens são enviadas PARA o content script, não para o background
      return await forwardToContentScript(message);

    default:
      console.warn(`[TorAI] Ação desconhecida: ${(message as any).action}`);
      return { error: 'Ação desconhecida' };
  }
}

// ─── Processamento de Requisição IA ──────────────────────────────

/**
 * Processa uma requisição de IA completa:
 * 1. Sanitiza o conteúdo
 * 2. Constrói o prompt
 * 3. Envia ao modelo
 * 4. Limpa dados temporários
 */
async function processAIRequest(request: AIRequest): Promise<AIResponse> {
  const startTime = Date.now();
  const info = getProviderInfo();

  try {
    // Verificar conexão
    if (info.status !== 'connected') {
      throw new Error('Não conectado a nenhum provedor de IA local.');
    }

    if (!info.activeModel) {
      throw new Error('Nenhum modelo selecionado.');
    }

    // Sanitizar conteúdo
    const isSnippet = request.type.startsWith('snippet_');
    const sanitizedContent = isSnippet
      ? sanitizeSnippet(request.content)
      : sanitizeText(request.content);

    if (!sanitizedContent) {
      throw new Error('Conteúdo vazio após sanitização.');
    }

    // Construir prompt
    const messages = buildPrompt(request.type, sanitizedContent, {
      targetLanguage: request.targetLanguage || currentSettings.targetLanguage,
      pageText: request.pageText,
    });

    // Validar parâmetros do modelo
    const params = validateModelParams({
      temperature: request.options?.temperature ?? currentSettings.temperature,
      maxTokens: request.options?.maxTokens ?? currentSettings.maxTokens,
    });

    const timeoutSec = request.options?.requestTimeout ?? currentSettings.requestTimeout;

    // Construir requisição
    const chatRequest: ChatCompletionRequest = {
      model: info.activeModel,
      messages,
      temperature: params.temperature,
      max_tokens: params.maxTokens,
      stream: false,
      timeoutMs: timeoutSec * 1000,
    };

    // Enviar ao modelo
    const response = await sendChatCompletion(chatRequest);

    // Extrair texto da resposta
    const resultText = response.choices?.[0]?.message?.content || '';

    // Verificar segurança da resposta (informativo)
    const safety = checkResponseSafety(resultText);
    if (!safety.safe) {
      console.warn('[TorAI] Avisos de segurança na resposta:', safety.warnings);
    }

    // Limpar dados temporários
    await clearTemporaryData();

    return {
      success: true,
      result: resultText,
      latencyMs: Date.now() - startTime,
      model: info.activeModel,
      provider: info.provider,
    };
  } catch (error: any) {
    // Limpar dados temporários mesmo em caso de erro
    await clearTemporaryData();

    return {
      success: false,
      error: error.message || 'Erro desconhecido',
      latencyMs: Date.now() - startTime,
      model: info.activeModel || 'unknown',
      provider: info.provider,
    };
  }
}

// ─── Forward para Content Script ─────────────────────────────────

/**
 * Encaminha mensagem para o content script da aba ativa.
 */
async function forwardToContentScript(message: ExtensionMessage): Promise<any> {
  try {
    const tabs = await browser.tabs.query({ active: true, currentWindow: true });
    if (tabs.length === 0 || !tabs[0].id) {
      throw new Error('Nenhuma aba ativa encontrada.');
    }

    return await browser.tabs.sendMessage(tabs[0].id, message);
  } catch (error: any) {
    throw new Error(`Falha ao comunicar com a página: ${error.message}`);
  }
}

// ─── Persistência de Configurações ───────────────────────────────

/** Carrega configurações do storage local */
async function loadSettings(): Promise<void> {
  try {
    const result = await browser.storage.local.get(STORAGE_KEY_SETTINGS) as any;
    if (result[STORAGE_KEY_SETTINGS]) {
      currentSettings = {
        ...DEFAULT_SETTINGS,
        ...result[STORAGE_KEY_SETTINGS],
      };
    }
  } catch (error) {
    console.warn('[TorAI] Falha ao carregar configurações:', error);
    currentSettings = { ...DEFAULT_SETTINGS };
  }
}

/** Salva configurações no storage local */
async function saveSettings(updates: Partial<UserSettings>): Promise<void> {
  currentSettings = {
    ...currentSettings,
    ...updates,
  };

  // Atualizar modelo ativo se mudou
  if (updates.model) {
    setActiveModel(updates.model);
  }

  try {
    await browser.storage.local.set({
      [STORAGE_KEY_SETTINGS]: currentSettings,
    });
  } catch (error) {
    console.warn('[TorAI] Falha ao salvar configurações:', error);
  }
}

// ─── Atalhos de Teclado ──────────────────────────────────────────

/**
 * Handler para atalhos de teclado definidos no manifest.
 */
function handleCommand(command: string): void {
  switch (command) {
    case 'generate-summary':
      executeSummaryShortcut();
      break;
    case 'translate-page':
      executeTranslateShortcut();
      break;
    case 'open-sidebar':
      toggleSidebar();
      break;
  }
}

/** Executa resumo rápido via atalho */
async function executeSummaryShortcut(): Promise<void> {
  try {
    // Extrair texto da página ativa
    const pageContent = await forwardToContentScript({
      action: 'EXTRACT_PAGE_TEXT',
    } as ExtensionMessage);

    if (pageContent?.text) {
      const result = await processAIRequest({
        type: 'summary_short',
        content: pageContent.text,
      });

      // Mostrar notificação com resultado (simplificado)
      if (result.success && result.result) {
        // Abrir sidebar com resultado
        await browser.sidebarAction.open();
      }
    }
  } catch (error) {
    console.error('[TorAI] Erro no atalho de resumo:', error);
  }
}

/** Executa tradução rápida via atalho */
async function executeTranslateShortcut(): Promise<void> {
  try {
    const pageContent = await forwardToContentScript({
      action: 'EXTRACT_PAGE_TEXT',
    } as ExtensionMessage);

    if (pageContent?.text) {
      await processAIRequest({
        type: 'translate',
        content: pageContent.text,
        targetLanguage: currentSettings.targetLanguage,
      });

      await browser.sidebarAction.open();
    }
  } catch (error) {
    console.error('[TorAI] Erro no atalho de tradução:', error);
  }
}

/** Abre/fecha o sidebar */
async function toggleSidebar(): Promise<void> {
  try {
    await browser.sidebarAction.toggle();
  } catch {
    // toggle pode não estar disponível em todas as versões
    try {
      await browser.sidebarAction.open();
    } catch (error) {
      console.error('[TorAI] Erro ao alternar sidebar:', error);
    }
  }
}

// ─── Registrar Listeners ─────────────────────────────────────────

// Interceptar requisições de saída para remover o cabeçalho 'Origin'
// Isso evita que o Ollama e o LM Studio retornem HTTP 403 Forbidden (CORS)
if (browser.webRequest?.onBeforeSendHeaders) {
  browser.webRequest.onBeforeSendHeaders.addListener(
    (details) => {
      const headers = details.requestHeaders || [];
      // Filtrar o cabeçalho Origin para contornar checagem CORS local
      const filteredHeaders = headers.filter(
        h => h.name.toLowerCase() !== 'origin'
      );
      return { requestHeaders: filteredHeaders };
    },
    { urls: ["http://127.0.0.1/*", "http://localhost/*"] },
    ["blocking", "requestHeaders"]
  );
}

// Listener de mensagens
browser.runtime.onMessage.addListener(handleMessage);

// Listener de atalhos de teclado
if (browser.commands?.onCommand) {
  browser.commands.onCommand.addListener(handleCommand);
}

// Inicializar ao carregar
initialize().catch(error => {
  console.error('[TorAI] Falha na inicialização:', error);
});
