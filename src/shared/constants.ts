/**
 * TorAI — Constantes globais da extensão.
 * 
 * Todas as URLs, limites e valores padrão centralizados aqui
 * para facilitar manutenção e auditoria de segurança.
 */

// ─── URLs dos Provedores ─────────────────────────────────────────

/** URL padrão do Ollama (localhost apenas, nunca remoto) */
export const OLLAMA_DEFAULT_URL = 'http://127.0.0.1:11434';

/** URL padrão do LMStudio (localhost apenas, nunca remoto) */
export const LMSTUDIO_DEFAULT_URL = 'http://127.0.0.1:1234';

// ─── Endpoints da API ────────────────────────────────────────────

/** Endpoint para verificar saúde do Ollama (lista modelos) */
export const OLLAMA_HEALTH_ENDPOINT = '/api/tags';

/** Endpoint para verificar saúde do LMStudio (lista modelos) */
export const LMSTUDIO_HEALTH_ENDPOINT = '/v1/models';

/** Endpoint unificado OpenAI-compatible (ambos suportam) */
export const CHAT_COMPLETIONS_ENDPOINT = '/v1/chat/completions';

/** Endpoint de modelos do Ollama (formato nativo) */
export const OLLAMA_MODELS_ENDPOINT = '/api/tags';

/** Endpoint de modelos do LMStudio (formato OpenAI) */
export const LMSTUDIO_MODELS_ENDPOINT = '/v1/models';

// ─── Retry e Timeout ─────────────────────────────────────────────

/** Número máximo de tentativas para requisições */
export const MAX_RETRIES = 3;

/** Delay base para exponential backoff (ms) */
export const RETRY_BASE_DELAY_MS = 500;

/** Delay máximo para exponential backoff (ms) */
export const RETRY_MAX_DELAY_MS = 5000;

/** Timeout padrão para requisições HTTP (ms) — 5 minutos para suportar modelos pesados */
export const REQUEST_TIMEOUT_MS = 300000;

/** Timeout para health check (ms) — curto pois é só verificação */
export const HEALTH_CHECK_TIMEOUT_MS = 5000;

// ─── Limites de Conteúdo ─────────────────────────────────────────

/** Tamanho máximo de texto da página enviado ao modelo (caracteres) */
export const MAX_PAGE_TEXT_LENGTH = 12000;

/** Tamanho máximo de trecho selecionado (caracteres) */
export const MAX_SNIPPET_LENGTH = 4000;

/** Número máximo de imagens cujo alt-text será extraído */
export const MAX_IMAGES_EXTRACT = 50;

/** Número máximo de links extraídos */
export const MAX_LINKS_EXTRACT = 100;

/** Número máximo de headings extraídos */
export const MAX_HEADINGS_EXTRACT = 50;

// ─── Parâmetros do Modelo ────────────────────────────────────────

/** Temperatura padrão do modelo */
export const DEFAULT_TEMPERATURE = 0.7;

/** Tokens máximos padrão na resposta */
export const DEFAULT_MAX_TOKENS = 2048;

/** Temperatura mínima permitida */
export const MIN_TEMPERATURE = 0.0;

/** Temperatura máxima permitida */
export const MAX_TEMPERATURE = 2.0;

/** Tokens mínimos na resposta */
export const MIN_MAX_TOKENS = 128;

/** Tokens máximos na resposta */
export const MAX_MAX_TOKENS = 8192;

// ─── Storage Keys ────────────────────────────────────────────────

/** Chave no storage local para configurações do usuário */
export const STORAGE_KEY_SETTINGS = 'torai_settings';

/** Chave no storage local para cache temporário */
export const STORAGE_KEY_CACHE = 'torai_cache';

// ─── Idiomas Suportados para Tradução ────────────────────────────

export const SUPPORTED_LANGUAGES = [
  { code: 'pt-BR', name: 'Português (Brasil)' },
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Español' },
  { code: 'fr', name: 'Français' },
  { code: 'de', name: 'Deutsch' },
  { code: 'it', name: 'Italiano' },
  { code: 'ja', name: '日本語' },
  { code: 'ko', name: '한국어' },
  { code: 'zh', name: '中文' },
  { code: 'ru', name: 'Русский' },
  { code: 'ar', name: 'العربية' },
] as const;

// ─── Hosts Permitidos (Segurança) ────────────────────────────────

/** Hosts permitidos para conexão — APENAS localhost */
export const ALLOWED_HOSTS = ['127.0.0.1', 'localhost', '::1'] as const;

/** Protocolos permitidos */
export const ALLOWED_PROTOCOLS = ['http:'] as const;

// ─── Versão e Metadados ──────────────────────────────────────────

export const EXTENSION_NAME = 'TorAI';
export const EXTENSION_VERSION = '1.0.0';
