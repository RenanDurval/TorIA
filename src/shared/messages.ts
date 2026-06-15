/**
 * TorAI — Protocolo de mensagens entre componentes da extensão.
 * 
 * Define todas as mensagens que fluem entre content script,
 * background script, popup e sidebar via browser.runtime.sendMessage.
 */

import type { AIRequest, AIResponse, PageContent, ProviderInfo, UserSettings } from './types';

// ─── Tipos de Ações ──────────────────────────────────────────────

export type MessageAction =
  // Content Script → Background
  | 'PAGE_CONTENT_READY'
  | 'SELECTION_CHANGED'
  // Background → Content Script
  | 'EXTRACT_PAGE_TEXT'
  | 'EXTRACT_SELECTION'
  | 'GET_PAGE_INFO'
  // Popup/Sidebar → Background
  | 'CONNECT_PROVIDER'
  | 'DISCONNECT_PROVIDER'
  | 'GET_STATUS'
  | 'GET_SETTINGS'
  | 'SAVE_SETTINGS'
  | 'LIST_MODELS'
  | 'PROCESS_AI_REQUEST'
  | 'CANCEL_REQUEST'
  // Background → Popup/Sidebar
  | 'STATUS_UPDATE'
  | 'AI_RESPONSE'
  | 'AI_STREAMING_CHUNK'
  | 'ERROR';

// ─── Mensagens Tipadas ───────────────────────────────────────────

/** Mensagem base com ação obrigatória */
export interface BaseMessage {
  action: MessageAction;
  requestId?: string;
}

// ── Content Script Messages ──

export interface ExtractPageTextMessage extends BaseMessage {
  action: 'EXTRACT_PAGE_TEXT';
}

export interface ExtractSelectionMessage extends BaseMessage {
  action: 'EXTRACT_SELECTION';
}

export interface GetPageInfoMessage extends BaseMessage {
  action: 'GET_PAGE_INFO';
}

export interface PageContentReadyMessage extends BaseMessage {
  action: 'PAGE_CONTENT_READY';
  data: PageContent;
}

export interface SelectionChangedMessage extends BaseMessage {
  action: 'SELECTION_CHANGED';
  data: { selectedText: string };
}

// ── Provider Messages ──

export interface ConnectProviderMessage extends BaseMessage {
  action: 'CONNECT_PROVIDER';
  data?: { provider?: string; url?: string };
}

export interface DisconnectProviderMessage extends BaseMessage {
  action: 'DISCONNECT_PROVIDER';
}

export interface GetStatusMessage extends BaseMessage {
  action: 'GET_STATUS';
}

export interface StatusUpdateMessage extends BaseMessage {
  action: 'STATUS_UPDATE';
  data: ProviderInfo;
}

// ── Settings Messages ──

export interface GetSettingsMessage extends BaseMessage {
  action: 'GET_SETTINGS';
}

export interface SaveSettingsMessage extends BaseMessage {
  action: 'SAVE_SETTINGS';
  data: Partial<UserSettings>;
}

// ── AI Processing Messages ──

export interface ListModelsMessage extends BaseMessage {
  action: 'LIST_MODELS';
}

export interface ProcessAIRequestMessage extends BaseMessage {
  action: 'PROCESS_AI_REQUEST';
  data: AIRequest;
}

export interface CancelRequestMessage extends BaseMessage {
  action: 'CANCEL_REQUEST';
  data: { requestId: string };
}

export interface AIResponseMessage extends BaseMessage {
  action: 'AI_RESPONSE';
  data: AIResponse;
}

export interface ErrorMessage extends BaseMessage {
  action: 'ERROR';
  data: { code: string; message: string; details?: string };
}

// ─── Union Type de Todas as Mensagens ────────────────────────────

export type ExtensionMessage =
  | ExtractPageTextMessage
  | ExtractSelectionMessage
  | GetPageInfoMessage
  | PageContentReadyMessage
  | SelectionChangedMessage
  | ConnectProviderMessage
  | DisconnectProviderMessage
  | GetStatusMessage
  | StatusUpdateMessage
  | GetSettingsMessage
  | SaveSettingsMessage
  | ListModelsMessage
  | ProcessAIRequestMessage
  | CancelRequestMessage
  | AIResponseMessage
  | ErrorMessage;

// ─── Helpers ─────────────────────────────────────────────────────

/** Gera um ID único para rastrear requisições */
export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/** Cria mensagem tipada de forma segura */
export function createMessage<T extends ExtensionMessage>(msg: T): T {
  return { ...msg, requestId: msg.requestId || generateRequestId() };
}
