/**
 * TorAI — Módulo de segurança e validação.
 * 
 * Garante que a extensão NUNCA conecta a servidores externos.
 * Todas as URLs são validadas antes de qualquer requisição.
 * Dados temporários são limpos após cada operação.
 */

import { ALLOWED_HOSTS, ALLOWED_PROTOCOLS, MAX_PAGE_TEXT_LENGTH, MAX_SNIPPET_LENGTH } from '../shared/constants';

// ─── Validação de URL ────────────────────────────────────────────

/**
 * Valida se uma URL aponta exclusivamente para localhost.
 * REJEITA qualquer URL que não seja 127.0.0.1, localhost ou ::1.
 * 
 * @param url - URL a ser validada
 * @returns true se a URL é segura (localhost apenas)
 * @throws Error se a URL é inválida ou aponta para servidor externo
 */
export function validateLocalUrl(url: string): boolean {
  let parsed: URL;

  try {
    parsed = new URL(url);
  } catch {
    // Se a análise falhar, verifica se o motivo foi uma porta fora de alcance (ex: 99999)
    const portMatch = url.match(/:(\d+)(?:\/|$)/);
    if (portMatch) {
      const portVal = parseInt(portMatch[1], 10);
      if (portVal < 1 || portVal > 65535) {
        throw new Error(`Porta inválida: ${portMatch[1]}. Deve ser um número entre 1 e 65535.`);
      }
    }
    throw new Error(`URL inválida: ${url}`);
  }

  // Verificar protocolo (apenas HTTP, não HTTPS — localhost não precisa)
  if (!ALLOWED_PROTOCOLS.includes(parsed.protocol as any)) {
    throw new Error(
      `Protocolo não permitido: ${parsed.protocol}. ` +
      `Apenas ${ALLOWED_PROTOCOLS.join(', ')} são aceitos para conexões locais.`
    );
  }

  // Verificar host (apenas localhost)
  const hostname = parsed.hostname;
  if (!ALLOWED_HOSTS.includes(hostname as any)) {
    throw new Error(
      `Host não permitido: ${hostname}. ` +
      `Por segurança, apenas conexões locais são aceitas: ${ALLOWED_HOSTS.join(', ')}.`
    );
  }

  // Verificar porta (deve existir e ser numérica)
  const port = parseInt(parsed.port, 10);
  if (isNaN(port) || port < 1 || port > 65535) {
    throw new Error(`Porta inválida: ${parsed.port}. Deve ser um número entre 1 e 65535.`);
  }

  return true;
}

/**
 * Constrói URL segura apenas para localhost.
 * 
 * @param baseUrl - URL base do provedor
 * @param endpoint - Caminho do endpoint
 * @returns URL completa validada
 */
export function buildSafeUrl(baseUrl: string, endpoint: string): string {
  // Remover barra final do baseUrl e inicial do endpoint
  const cleanBase = baseUrl.replace(/\/+$/, '');
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const fullUrl = `${cleanBase}${cleanEndpoint}`;

  // Validar antes de retornar
  validateLocalUrl(fullUrl);

  return fullUrl;
}

// ─── Sanitização de Texto ────────────────────────────────────────

/**
 * Sanitiza texto antes de enviar ao modelo de IA.
 * Remove caracteres de controle, limita tamanho, e normaliza whitespace.
 * 
 * @param text - Texto bruto da página
 * @param maxLength - Tamanho máximo permitido
 * @returns Texto sanitizado
 */
export function sanitizeText(text: string, maxLength: number = MAX_PAGE_TEXT_LENGTH): string {
  if (!text || typeof text !== 'string') {
    return '';
  }

  let sanitized = text
    // Remover caracteres de controle (exceto newlines e tabs)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    // Normalizar quebras de linha
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    // Colapsar múltiplas linhas vazias em uma
    .replace(/\n{3,}/g, '\n\n')
    // Colapsar múltiplos espaços em um
    .replace(/[ \t]+/g, ' ')
    // Remover espaços no início/fim de cada linha
    .split('\n')
    .map(line => line.trim())
    .join('\n')
    // Trim final
    .trim();

  // Truncar se exceder limite
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
    // Tentar cortar em um limite de palavra
    const lastSpace = sanitized.lastIndexOf(' ');
    if (lastSpace > maxLength * 0.8) {
      sanitized = sanitized.substring(0, lastSpace);
    }
    sanitized += '\n\n[... texto truncado por limite de segurança ...]';
  }

  return sanitized;
}

/**
 * Sanitiza trecho selecionado pelo usuário.
 */
export function sanitizeSnippet(text: string): string {
  return sanitizeText(text, MAX_SNIPPET_LENGTH);
}

// ─── Validação de Configurações ──────────────────────────────────

/**
 * Valida e normaliza parâmetros do modelo.
 */
export function validateModelParams(params: {
  temperature?: number;
  maxTokens?: number;
}): { temperature: number; maxTokens: number } {
  let temperature = params.temperature ?? 0.7;
  let maxTokens = params.maxTokens ?? 2048;

  // Clampar temperatura entre 0 e 2
  temperature = Math.max(0, Math.min(2, temperature));

  // Clampar tokens entre 128 e 8192
  maxTokens = Math.max(128, Math.min(8192, Math.round(maxTokens)));

  return { temperature, maxTokens };
}

/**
 * Valida que o nome do modelo não contém caracteres perigosos.
 */
export function validateModelName(model: string): boolean {
  if (!model || typeof model !== 'string') {
    return false;
  }

  // Modelo deve ser alfanumérico com separadores comuns
  const validPattern = /^[a-zA-Z0-9._\-:\/]+$/;
  return validPattern.test(model) && model.length <= 200;
}

// ─── Limpeza de Cache ────────────────────────────────────────────

/**
 * Limpa dados temporários do storage local.
 * Chamado após cada operação para não reter dados sensíveis.
 */
export async function clearTemporaryData(): Promise<void> {
  try {
    if (typeof browser !== 'undefined' && browser.storage?.local) {
      await browser.storage.local.remove('torai_cache');
    }
  } catch (error) {
    // Falha silenciosa — limpeza é best-effort
    console.warn('[TorAI] Falha ao limpar cache temporário:', error);
  }
}

/**
 * Limpa todos os dados da extensão (reset completo).
 */
export async function clearAllData(): Promise<void> {
  try {
    if (typeof browser !== 'undefined' && browser.storage?.local) {
      await browser.storage.local.clear();
    }
  } catch (error) {
    console.warn('[TorAI] Falha ao limpar todos os dados:', error);
  }
}

// ─── Validação de Resposta da IA ─────────────────────────────────

/**
 * Verifica se a resposta do modelo não contém URLs externas
 * que poderiam ser usadas para exfiltração de dados.
 * (Verificação informativa, não bloqueia a resposta.)
 */
export function checkResponseSafety(response: string): {
  safe: boolean;
  warnings: string[];
} {
  const warnings: string[] = [];

  // Verificar se contém URLs que parecem tracking pixels ou exfiltração
  const suspiciousPatterns = [
    /https?:\/\/[^\/]*\.(php|asp|cgi)\?.*=[^&]*data/gi,
    /javascript:/gi,
    /data:text\/html/gi,
  ];

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(response)) {
      warnings.push(`Padrão suspeito detectado na resposta do modelo: ${pattern.source}`);
    }
  }

  return {
    safe: warnings.length === 0,
    warnings,
  };
}
