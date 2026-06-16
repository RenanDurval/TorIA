/**
 * TorAI — Sidebar script (painel principal).
 * 
 * Gerencia as 5 abas do sidebar: Resumo, Tradução, Dicas, 
 * Entidades e Trecho. Comunica com o background para processamento.
 */

import type { AIResponse, ProviderInfo, TaskType } from '../shared/types';

// ─── Elementos DOM ───────────────────────────────────────────────

const $ = (id: string) => document.getElementById(id)!;

// Declarações — inicializadas no DOMContentLoaded
let statusDot: HTMLElement;
let statusLabel: HTMLElement;
let tabButtons: NodeListOf<HTMLButtonElement>;
let panels: NodeListOf<HTMLElement>;
let btnSummaryShort: HTMLButtonElement;
let btnSummaryDetailed: HTMLButtonElement;
let btnGenerateSummary: HTMLButtonElement;
let btnExplainSimple: HTMLButtonElement;
let resultSummary: HTMLElement;
let languageSelect: HTMLSelectElement;
let btnTranslate: HTMLButtonElement;
let resultTranslation: HTMLElement;
let btnGenerateTips: HTMLButtonElement;
let resultTips: HTMLElement;
let btnExtractEntities: HTMLButtonElement;
let resultEntities: HTMLElement;
let snippetText: HTMLElement;
let btnSnippetSummary: HTMLButtonElement;
let btnSnippetExplain: HTMLButtonElement;
let btnSnippetTranslate: HTMLButtonElement;
let resultSnippet: HTMLElement;
let chatMessages: HTMLElement;
let chatInput: HTMLTextAreaElement;
let btnSendChat: HTMLButtonElement;
let chatContextToggle: HTMLInputElement;
let chatTimeoutSelect: HTMLSelectElement;
let btnClearChat: HTMLButtonElement;
let processingBar: HTMLElement;
let processingText: HTMLElement;
let btnCancel: HTMLButtonElement;
let footerModel: HTMLElement;
let footerLatency: HTMLElement;

// ─── Estado ──────────────────────────────────────────────────────

let summaryMode: 'short' | 'detailed' = 'short';
let currentSelectedText = '';
let isProcessing = false;
let cachedPageText: string | null = null;

// ─── Inicialização ───────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', async () => {
  // Inicializar referências DOM
  initDomReferences();
  registerEventListeners();
  await refreshStatus();

  // Inicializar o timeout no dropdown a partir das configurações salvas
  try {
    const result = await browser.storage.local.get('torai_settings');
    const settings = result.torai_settings;
    if (settings && settings.requestTimeout && chatTimeoutSelect) {
      const val = String(settings.requestTimeout);
      if (['60', '120', '300', '3600'].includes(val)) {
        chatTimeoutSelect.value = val;
      } else {
        // Se for um valor personalizado do slider no popup, tratar apropriadamente
        const optionValues = Array.from(chatTimeoutSelect.options).map(o => parseInt(o.value, 10));
        if (optionValues.includes(settings.requestTimeout)) {
          chatTimeoutSelect.value = val;
        } else if (settings.requestTimeout > 300) {
          chatTimeoutSelect.value = '3600';
        } else {
          // Criar opção temporária para manter o valor exato
          const opt = document.createElement('option');
          opt.value = val;
          opt.textContent = `Espera: ${val}s`;
          opt.selected = true;
          chatTimeoutSelect.appendChild(opt);
        }
      }
    }
  } catch (err) {
    console.warn('[TorAI Sidebar] Erro ao inicializar timeout de chat:', err);
  }

  // Verificar se há uma aba alvo definida pelo popup
  try {
    const result = await browser.storage.local.get('torai_target_tab');
    if (result.torai_target_tab) {
      const targetTabBtn = $(`tab-${result.torai_target_tab}`) as HTMLButtonElement;
      if (targetTabBtn) {
        switchTab(targetTabBtn);
      }
      await browser.storage.local.remove('torai_target_tab');
    }
  } catch (err) {
    console.warn('[TorAI Sidebar] Erro ao ler aba alvo inicial:', err);
  }

  // Listener de mensagens do background (ex: seleção mudou)
  browser.runtime.onMessage.addListener(handleIncomingMessage);
});

// ─── Event Listeners ─────────────────────────────────────────────

function registerEventListeners(): void {
  // Tab navigation
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn));
    btn.addEventListener('keydown', (e) => handleTabKeyboard(e, btn));
  });

  // Summary
  btnSummaryShort.addEventListener('click', () => {
    summaryMode = 'short';
    btnSummaryShort.classList.add('active');
    btnSummaryDetailed.classList.remove('active');
    btnSummaryShort.setAttribute('aria-checked', 'true');
    btnSummaryDetailed.setAttribute('aria-checked', 'false');
  });
  btnSummaryDetailed.addEventListener('click', () => {
    summaryMode = 'detailed';
    btnSummaryDetailed.classList.add('active');
    btnSummaryShort.classList.remove('active');
    btnSummaryDetailed.setAttribute('aria-checked', 'true');
    btnSummaryShort.setAttribute('aria-checked', 'false');
  });
  btnGenerateSummary.addEventListener('click', () => handleAction(
    summaryMode === 'short' ? 'summary_short' : 'summary_detailed',
    resultSummary
  ));
  btnExplainSimple.addEventListener('click', () => handleAction('explain', resultSummary));

  // Translation
  btnTranslate.addEventListener('click', () => handleAction('translate', resultTranslation));

  // Tips
  btnGenerateTips.addEventListener('click', () => handleAction('tips', resultTips));

  // Entities
  btnExtractEntities.addEventListener('click', () => handleAction('entities', resultEntities));

  // Snippet
  btnSnippetSummary.addEventListener('click', () => handleSnippetAction('snippet_summary'));
  btnSnippetExplain.addEventListener('click', () => handleSnippetAction('snippet_explain'));
  btnSnippetTranslate.addEventListener('click', () => handleSnippetAction('snippet_translate'));

  // Chat
  btnSendChat.addEventListener('click', handleSendChat);
  chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (chatInput.value.trim() && !isProcessing) {
        handleSendChat();
      }
    }
  });
  chatInput.addEventListener('input', () => {
    // Auto-expandir altura do input
    chatInput.style.height = 'auto';
    chatInput.style.height = `${chatInput.scrollHeight}px`;
    
    // Habilitar/desabilitar botão enviar
    btnSendChat.disabled = !chatInput.value.trim();
  });
  btnClearChat.addEventListener('click', () => {
    chatMessages.innerHTML = `
      <div class="chat-message assistant">
        <div class="chat-avatar">🧠</div>
        <div class="chat-bubble assistant">
          Conversa reiniciada. Como posso te ajudar hoje?
        </div>
      </div>
    `;
    chatInput.value = '';
    chatInput.style.height = 'auto';
    btnSendChat.disabled = true;
  });

  if (chatTimeoutSelect) {
    chatTimeoutSelect.addEventListener('change', async () => {
      try {
        const result = await browser.storage.local.get('torai_settings');
        const settings = result.torai_settings || {};
        settings.requestTimeout = parseInt(chatTimeoutSelect.value, 10);
        await browser.storage.local.set({ torai_settings: settings });
        console.log('[TorAI Sidebar] Timeout do chat atualizado para:', settings.requestTimeout);
      } catch (err) {
        console.warn('[TorAI Sidebar] Erro ao salvar configuração de timeout:', err);
      }
    });
  }

  // Cancel
  btnCancel.addEventListener('click', cancelProcessing);
}

// ─── Tab Switching ───────────────────────────────────────────────

function switchTab(clickedTab: HTMLButtonElement): void {
  // Deactivate all tabs
  tabButtons.forEach(btn => {
    btn.classList.remove('active');
    btn.setAttribute('aria-selected', 'false');
    btn.setAttribute('tabindex', '-1');
  });

  // Activate clicked tab
  clickedTab.classList.add('active');
  clickedTab.setAttribute('aria-selected', 'true');
  clickedTab.setAttribute('tabindex', '0');

  // Show corresponding panel
  const panelId = clickedTab.getAttribute('aria-controls');
  panels.forEach(panel => {
    panel.classList.toggle('active', panel.id === panelId);
  });
}

function handleTabKeyboard(e: KeyboardEvent, currentTab: HTMLButtonElement): void {
  const tabs = Array.from(tabButtons);
  const currentIndex = tabs.indexOf(currentTab);
  let newIndex = currentIndex;

  if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
    e.preventDefault();
    newIndex = (currentIndex + 1) % tabs.length;
  } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
    e.preventDefault();
    newIndex = (currentIndex - 1 + tabs.length) % tabs.length;
  } else if (e.key === 'Home') {
    e.preventDefault();
    newIndex = 0;
  } else if (e.key === 'End') {
    e.preventDefault();
    newIndex = tabs.length - 1;
  } else {
    return;
  }

  tabs[newIndex].focus();
  switchTab(tabs[newIndex]);
}

// ─── Incoming Messages ───────────────────────────────────────────

function handleIncomingMessage(message: any): void {
  if (message.action === 'SELECTION_CHANGED' && message.data?.selectedText) {
    updateSnippet(message.data.selectedText);
  } else if (message.action === 'SWITCH_TAB' && message.data?.tab) {
    const targetTabBtn = $(`tab-${message.data.tab}`) as HTMLButtonElement;
    if (targetTabBtn) {
      switchTab(targetTabBtn);
    }
  }
}

function updateSnippet(text: string): void {
  currentSelectedText = text;

  // Mostrar preview (truncado)
  const displayText = text.length > 200 
    ? text.substring(0, 200) + '...' 
    : text;
  snippetText.textContent = displayText;
  snippetText.classList.add('has-text');

  // Habilitar botões
  btnSnippetSummary.disabled = false;
  btnSnippetExplain.disabled = false;
  btnSnippetTranslate.disabled = false;
}

// ─── Page Text Extraction ────────────────────────────────────────

async function getPageText(): Promise<string> {
  if (cachedPageText) {
    return cachedPageText;
  }

  try {
    const result = await browser.runtime.sendMessage({
      action: 'EXTRACT_PAGE_TEXT',
    });

    if (result?.text) {
      cachedPageText = result.text;
      // Invalidar cache após 30 segundos (conteúdo dinâmico)
      setTimeout(() => { cachedPageText = null; }, 30000);
      return result.text;
    }

    throw new Error('Página sem conteúdo de texto');
  } catch (error: any) {
    throw new Error(`Falha ao extrair texto: ${error.message}`);
  }
}

// ─── Action Handlers ─────────────────────────────────────────────

async function handleAction(taskType: TaskType, resultContainer: HTMLElement): Promise<void> {
  if (isProcessing) return;

  try {
    showProcessing(`Processando ${getTaskLabel(taskType)}...`);
    showSkeleton(resultContainer);

    const text = await getPageText();

    const response = await browser.runtime.sendMessage({
      action: 'PROCESS_AI_REQUEST',
      data: {
        type: taskType,
        content: text,
        targetLanguage: taskType === 'translate' ? languageSelect.value : undefined,
      },
    }) as AIResponse;

    if (response.success && response.result) {
      showResult(resultContainer, response.result, response);
    } else {
      showError(resultContainer, response.error || 'Erro desconhecido');
    }
  } catch (error: any) {
    showError(resultContainer, error.message);
  } finally {
    hideProcessing();
  }
}

async function handleSnippetAction(taskType: TaskType): Promise<void> {
  if (isProcessing || !currentSelectedText) return;

  try {
    showProcessing('Analisando trecho...');
    showSkeleton(resultSnippet);

    const response = await browser.runtime.sendMessage({
      action: 'PROCESS_AI_REQUEST',
      data: {
        type: taskType,
        content: currentSelectedText,
        targetLanguage: taskType === 'snippet_translate' ? languageSelect.value : undefined,
      },
    }) as AIResponse;

    if (response.success && response.result) {
      showResult(resultSnippet, response.result, response);
    } else {
      showError(resultSnippet, response.error || 'Erro desconhecido');
    }
  } catch (error: any) {
    showError(resultSnippet, error.message);
  } finally {
    hideProcessing();
  }
}

// ─── Result Display ──────────────────────────────────────────────

function showResult(container: HTMLElement, text: string, response: AIResponse): void {
  // Converter Markdown básico para HTML
  const html = markdownToHtml(text);

  container.innerHTML = `
    <div class="result-content">${html}</div>
    <div class="result-actions">
      <button class="btn-copy" data-text="${escapeAttr(text)}" tabindex="0">📋 Copiar</button>
    </div>
  `;

  // Registrar botão copiar
  const copyBtn = container.querySelector('.btn-copy') as HTMLButtonElement;
  if (copyBtn) {
    copyBtn.addEventListener('click', () => copyToClipboard(copyBtn, text));
  }

  // Atualizar footer
  footerModel.textContent = `🤖 ${response.model}`;
  footerLatency.textContent = `⏱️ ${response.latencyMs}ms`;
}

function showError(container: HTMLElement, message: string): void {
  container.innerHTML = `
    <div class="error-message">
      <p class="error-title">❌ Erro</p>
      <p>${escapeHtml(message)}</p>
    </div>
  `;
}

function showSkeleton(container: HTMLElement): void {
  container.innerHTML = `
    <div class="skeleton">
      <div class="skeleton-line"></div>
      <div class="skeleton-line"></div>
      <div class="skeleton-line"></div>
      <div class="skeleton-line"></div>
      <div class="skeleton-line"></div>
    </div>
  `;
}

// ─── Processing Bar ──────────────────────────────────────────────

function showProcessing(text: string): void {
  isProcessing = true;
  processingText.textContent = text;
  processingBar.classList.remove('hidden');

  // Desabilitar botões de ação
  document.querySelectorAll('.btn-action').forEach(btn => {
    (btn as HTMLButtonElement).disabled = true;
  });
}

function hideProcessing(): void {
  isProcessing = false;
  processingBar.classList.add('hidden');

  // Reabilitar botões de ação
  document.querySelectorAll('.btn-action').forEach(btn => {
    (btn as HTMLButtonElement).disabled = false;
  });

  // Manter snippet buttons desabilitados se sem texto
  if (!currentSelectedText) {
    btnSnippetSummary.disabled = true;
    btnSnippetExplain.disabled = true;
    btnSnippetTranslate.disabled = true;
  }
}

async function cancelProcessing(): Promise<void> {
  try {
    await browser.runtime.sendMessage({ action: 'CANCEL_REQUEST' });
  } catch {
    // Falha silenciosa
  }
  hideProcessing();
}

// ─── Status ──────────────────────────────────────────────────────

async function refreshStatus(): Promise<void> {
  try {
    const info = await browser.runtime.sendMessage({ action: 'GET_STATUS' }) as ProviderInfo;

    if (info.status === 'connected') {
      statusDot.classList.add('connected');
      statusLabel.textContent = info.activeModel || 'Conectado';
      footerModel.textContent = `🤖 ${info.activeModel || '—'}`;
    } else {
      statusDot.classList.remove('connected');
      statusLabel.textContent = 'Offline';
    }
  } catch {
    statusDot.classList.remove('connected');
    statusLabel.textContent = 'Erro';
  }
}

// ─── Utilities ───────────────────────────────────────────────────

function getTaskLabel(taskType: TaskType): string {
  const labels: Record<TaskType, string> = {
    summary_short: 'resumo curto',
    summary_detailed: 'resumo detalhado',
    translate: 'tradução',
    tips: 'dicas',
    entities: 'entidades',
    explain: 'explicação',
    snippet_summary: 'resumo do trecho',
    snippet_explain: 'explicação do trecho',
    snippet_translate: 'tradução do trecho',
    chat: 'chat',
  };
  return labels[taskType] || taskType;
}

/** Inicializa todas as referências DOM — chamado no DOMContentLoaded */
function initDomReferences(): void {
  statusDot = $('sidebar-status-dot');
  statusLabel = $('sidebar-status-label');
  tabButtons = document.querySelectorAll('.tab-btn') as NodeListOf<HTMLButtonElement>;
  panels = document.querySelectorAll('.panel') as NodeListOf<HTMLElement>;
  btnSummaryShort = $('btn-summary-short') as HTMLButtonElement;
  btnSummaryDetailed = $('btn-summary-detailed') as HTMLButtonElement;
  btnGenerateSummary = $('btn-generate-summary') as HTMLButtonElement;
  btnExplainSimple = $('btn-explain-simple') as HTMLButtonElement;
  resultSummary = $('result-summary');
  languageSelect = $('language-select') as HTMLSelectElement;
  btnTranslate = $('btn-translate') as HTMLButtonElement;
  resultTranslation = $('result-translation');
  btnGenerateTips = $('btn-generate-tips') as HTMLButtonElement;
  resultTips = $('result-tips');
  btnExtractEntities = $('btn-extract-entities') as HTMLButtonElement;
  resultEntities = $('result-entities');
  snippetText = $('snippet-text');
  btnSnippetSummary = $('btn-snippet-summary') as HTMLButtonElement;
  btnSnippetExplain = $('btn-snippet-explain') as HTMLButtonElement;
  btnSnippetTranslate = $('btn-snippet-translate') as HTMLButtonElement;
  resultSnippet = $('result-snippet');
  chatMessages = $('chat-messages');
  chatInput = $('chat-input') as HTMLTextAreaElement;
  btnSendChat = $('btn-send-chat') as HTMLButtonElement;
  chatContextToggle = $('chat-context-toggle') as HTMLInputElement;
  chatTimeoutSelect = $('chat-timeout-select') as HTMLSelectElement;
  btnClearChat = $('btn-clear-chat') as HTMLButtonElement;
  processingBar = $('processing-bar');
  processingText = $('processing-text');
  btnCancel = $('btn-cancel') as HTMLButtonElement;
  footerModel = $('footer-model');
  footerLatency = $('footer-latency');
}

async function copyToClipboard(btn: HTMLButtonElement, text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
    const originalText = btn.textContent;
    btn.textContent = '✅ Copiado!';
    btn.classList.add('copied');
    setTimeout(() => {
      btn.textContent = originalText;
      btn.classList.remove('copied');
    }, 2000);
  } catch {
    // Fallback: textarea trick
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);

    btn.textContent = '✅ Copiado!';
    btn.classList.add('copied');
    setTimeout(() => {
      btn.textContent = '📋 Copiar';
      btn.classList.remove('copied');
    }, 2000);
  }
}

/** Converte Markdown básico para HTML (sem dependências) */
function markdownToHtml(md: string): string {
  let thinkingHtml = '';
  let finalMd = md;

  // Extrair tag <think> de raciocínio (comum em modelos de raciocínio como DeepSeek-R1)
  const thinkRegex = /<think>([\s\S]*?)<\/think>/i;
  const match = finalMd.match(thinkRegex);
  if (match) {
    const thinkingContent = match[1].trim();
    // Remover o bloco <think> do markdown principal
    finalMd = finalMd.replace(thinkRegex, '').trim();
    
    if (thinkingContent) {
      const thinkingParsed = parseMarkdownBasic(thinkingContent);
      thinkingHtml = `
        <details class="chat-thinking-block" open>
          <summary class="chat-thinking-summary">
            <span class="thinking-summary-icon">💭</span>
            <span class="thinking-summary-text">Processo de Raciocínio</span>
          </summary>
          <div class="chat-thinking-content">${thinkingParsed}</div>
        </details>
      `;
    }
  }

  const finalHtml = parseMarkdownBasic(finalMd);
  return thinkingHtml + finalHtml;
}

/** Função auxiliar para o parsing de markdown básico */
function parseMarkdownBasic(md: string): string {
  let html = escapeHtml(md);

  // Bold: **text**
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

  // Italic: *text*
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

  // Inline code: `code`
  html = html.replace(/`(.+?)`/g, '<code>$1</code>');

  // Headers: # ## ###
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');

  // Numbered lists: 1. item
  html = html.replace(/^\d+\.\s+(.+)$/gm, '<li>$1</li>');

  // Bullet lists: - item
  html = html.replace(/^[-*]\s+(.+)$/gm, '<li>$1</li>');

  // Wrap consecutive <li> in <ul>
  html = html.replace(/((?:<li>.+<\/li>\n?)+)/g, '<ul>$1</ul>');

  // Paragraphs: double newlines
  html = html.replace(/\n\n+/g, '</p><p>');
  html = `<p>${html}</p>`;

  // Single newlines within paragraphs
  html = html.replace(/\n/g, '<br>');

  // Clean empty paragraphs
  html = html.replace(/<p>\s*<\/p>/g, '');

  return html;
}

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, c => map[c] || c);
}

function escapeAttr(text: string): string {
  return text.replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

// ─── Chat Panel Logic ────────────────────────────────────────────

async function handleSendChat(): Promise<void> {
  const query = chatInput.value.trim();
  if (!query || isProcessing) return;

  // Limpar input
  chatInput.value = '';
  chatInput.style.height = 'auto';
  btnSendChat.disabled = true;

  // Adicionar bolha do usuário
  appendChatBubble('user', query);
  
  // Mostrar bolha de carregamento do assistente
  const assistantBubble = appendChatBubble('assistant', '...', true);

  try {
    isProcessing = true;
    
    // Tentar obter o texto da página atual silenciosamente para contexto se o toggle estiver ativo
    let pageText: string | undefined = undefined;
    if (chatContextToggle && chatContextToggle.checked) {
      try {
        pageText = await getPageText();
        if (pageText && pageText.length > 6000) {
          pageText = pageText.substring(0, 6000) + '\n\n[... texto truncado para otimização de velocidade ...]';
        }
      } catch {
        // Silencioso se estiver em página de sistema/privilegiada
      }
    }

    const timeoutVal = chatTimeoutSelect ? parseInt(chatTimeoutSelect.value, 10) : undefined;
    const response = await browser.runtime.sendMessage({
      action: 'PROCESS_AI_REQUEST',
      data: {
        type: 'chat',
        content: query,
        pageText: pageText,
        options: timeoutVal ? { requestTimeout: timeoutVal } : undefined,
      },
    }) as AIResponse;

    if (response.success && response.result) {
      // Substituir conteúdo
      assistantBubble.innerHTML = markdownToHtml(response.result);
      assistantBubble.classList.remove('loading-bubble');
      
      // Atualizar footer
      footerModel.textContent = `🤖 ${response.model}`;
      footerLatency.textContent = `⏱️ ${response.latencyMs}ms`;
    } else {
      assistantBubble.innerHTML = `<span style="color: var(--color-error)">❌ Erro: ${escapeHtml(response.error || 'Erro ao processar resposta')}</span>`;
      assistantBubble.classList.remove('loading-bubble');
    }
  } catch (error: any) {
    assistantBubble.innerHTML = `<span style="color: var(--color-error)">❌ Erro: ${escapeHtml(error.message)}</span>`;
    assistantBubble.classList.remove('loading-bubble');
  } finally {
    isProcessing = false;
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }
}

function appendChatBubble(role: 'user' | 'assistant', text: string, isLoading = false): HTMLElement {
  const messageContainer = document.createElement('div');
  messageContainer.className = `chat-message ${role}`;

  if (role === 'assistant') {
    const avatar = document.createElement('div');
    avatar.className = 'chat-avatar';
    avatar.textContent = '🧠';
    messageContainer.appendChild(avatar);
  }

  const bubble = document.createElement('div');
  bubble.className = `chat-bubble ${role}`;
  if (isLoading) {
    bubble.classList.add('loading-bubble');
  }
  
  if (role === 'user') {
    bubble.textContent = text;
  } else {
    bubble.innerHTML = isLoading 
      ? '<div class="typing-indicator"><span></span><span></span><span></span></div>' 
      : markdownToHtml(text);
  }
  
  messageContainer.appendChild(bubble);
  chatMessages.appendChild(messageContainer);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  return bubble;
}
