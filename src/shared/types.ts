/**
 * TorAI — Tipos TypeScript compartilhados entre todos os componentes.
 * 
 * Este módulo define a interface de dados que flui entre
 * content script, background, popup e sidebar.
 */

// ─── Provedores de IA ────────────────────────────────────────────

/** Provedores de IA local suportados */
export type Provider = 'ollama' | 'lmstudio';

/** Status de conexão com o provedor */
export type ConnectionStatus = 'connected' | 'disconnected' | 'connecting' | 'error';

/** Informações sobre o provedor conectado */
export interface ProviderInfo {
  provider: Provider;
  baseUrl: string;
  status: ConnectionStatus;
  models: string[];
  activeModel: string | null;
  latencyMs: number | null;
}

// ─── Tarefas de IA ───────────────────────────────────────────────

/** Tipos de tarefas que o modelo pode executar */
export type TaskType =
  | 'summary_short'       // Resumo curto (2-3 frases)
  | 'summary_detailed'    // Resumo detalhado (5-8 frases)
  | 'translate'           // Tradução para idioma escolhido
  | 'tips'                // Dicas de usabilidade/segurança (até 5)
  | 'entities'            // Extração de entidades (títulos, autores, datas, links)
  | 'explain'             // Explicação simplificada para iniciantes
  | 'snippet_summary'     // Resumo de trecho selecionado
  | 'snippet_explain'     // Explicação de trecho selecionado
  | 'snippet_translate'   // Tradução de trecho selecionado
  | 'chat';               // Chat livre com o modelo (com contexto da página)

// ─── Configurações do Usuário ────────────────────────────────────

/** Configurações persistidas no storage local */
export interface UserSettings {
  provider: Provider;
  ollamaUrl: string;
  lmstudioUrl: string;
  model: string;
  temperature: number;
  maxTokens: number;
  targetLanguage: string;
  autoDetectProvider: boolean;
  requestTimeout: number;
}

/** Valores padrão para novas instalações */
export const DEFAULT_SETTINGS: UserSettings = {
  provider: 'ollama',
  ollamaUrl: 'http://127.0.0.1:11434',
  lmstudioUrl: 'http://127.0.0.1:1234',
  model: 'llama3.2',
  temperature: 0.7,
  maxTokens: 2048,
  targetLanguage: 'pt-BR',
  autoDetectProvider: true,
  requestTimeout: 120,
};

// ─── Conteúdo da Página ──────────────────────────────────────────

/** Dados extraídos de uma página pelo content script */
export interface PageContent {
  title: string;
  url: string;
  text: string;
  images: ImageInfo[];
  metas: Record<string, string>;
  headings: string[];
  links: LinkInfo[];
}

/** Informações de uma imagem na página */
export interface ImageInfo {
  src: string;
  alt: string;
}

/** Informações de um link na página */
export interface LinkInfo {
  href: string;
  text: string;
}

// ─── Requisição e Resposta da IA ─────────────────────────────────

/** Requisição enviada ao background para processamento IA */
export interface AIRequest {
  type: TaskType;
  content: string;
  targetLanguage?: string;
  pageText?: string;
  options?: Partial<UserSettings>;
}

/** Resposta do modelo de IA processada */
export interface AIResponse {
  success: boolean;
  result?: string;
  error?: string;
  latencyMs: number;
  model: string;
  provider: Provider;
}

// ─── Entidades Extraídas ─────────────────────────────────────────

/** Entidades extraídas de uma página (parseadas do resultado IA) */
export interface ExtractedEntities {
  titles: string[];
  authors: string[];
  dates: string[];
  importantLinks: LinkInfo[];
  keywords: string[];
}

// ─── Chat Messages (OpenAI format) ──────────────────────────────

/** Papel da mensagem no protocolo OpenAI */
export type ChatRole = 'system' | 'user' | 'assistant';

/** Mensagem no formato OpenAI Chat Completions */
export interface ChatMessage {
  role: ChatRole;
  content: string;
}

/** Corpo da requisição para /v1/chat/completions */
export interface ChatCompletionRequest {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
  timeoutMs?: number;
}

/** Resposta do /v1/chat/completions (sem streaming) */
export interface ChatCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    message: ChatMessage;
    finish_reason: string;
  }[];
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/** Modelo disponível retornado pela API */
export interface ModelInfo {
  id: string;
  name: string;
  size?: number;
  modified_at?: string;
}
