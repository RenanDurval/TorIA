/**
 * TorAI — Popup script.
 * 
 * Gerencia a UI do popup: conexão, seleção de modelo,
 * parâmetros, ações rápidas e instruções de instalação.
 */

import type { ProviderInfo, UserSettings, Provider } from '../shared/types';

// ─── Elementos DOM ───────────────────────────────────────────────

const $ = (id: string) => document.getElementById(id)!;

const $ = (id: string) => document.getElementById(id)!;

// Elementos DOM — inicializados no DOMContentLoaded
let statusDot: HTMLElement;
let statusText: HTMLElement;
let btnOllama: HTMLButtonElement;
let btnLmstudio: HTMLButtonElement;
let urlGroup: HTMLElement;
let customUrl: HTMLInputElement;
let btnConnect: HTMLButtonElement;
let btnConnectText: HTMLElement;
let connectionError: HTMLElement;
let sectionModel: HTMLElement;
let sectionActions: HTMLElement;
let sectionInstall: HTMLElement;
let modelSelect: HTMLSelectElement;
let temperatureSlider: HTMLInputElement;
let temperatureValue: HTMLElement;
let tokensSlider: HTMLInputElement;
let tokensValue: HTMLElement;
let timeoutSlider: HTMLInputElement;
let timeoutValue: HTMLElement;
let latencyValue: HTMLElement;
let activeModelName: HTMLElement;
let tabInstallOllama: HTMLButtonElement;
let tabInstallLmstudio: HTMLButtonElement;
let installOllama: HTMLElement;
let installLmstudio: HTMLElement;

// ─── Estado Local ────────────────────────────────────────────────

let selectedProvider: Provider = 'ollama';
let isConnected = false;
let currentSettings: UserSettings | null = null;

// ─── Inicialização ───────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', async () => {
  // Inicializar referências DOM
  initDomReferences();

  // Carregar configurações e status
  await loadInitialState();

  // Registrar event listeners
  registerEventListeners();
});

async function loadInitialState(): Promise<void> {
  try {
    // Obter status atual
    const status = await browser.runtime.sendMessage({ action: 'GET_STATUS' }) as ProviderInfo;
    updateStatusUI(status);

    // Obter configurações
    const settings = await browser.runtime.sendMessage({ action: 'GET_SETTINGS' }) as UserSettings;
    currentSettings = settings;
    applySettings(settings);
  } catch (error) {
    console.error('[TorAI Popup] Erro ao carregar estado:', error);
    showDisconnectedState();
  }
}

// ─── Event Listeners ─────────────────────────────────────────────

function registerEventListeners(): void {
  // Provider toggle
  btnOllama.addEventListener('click', () => selectProvider('ollama'));
  btnLmstudio.addEventListener('click', () => selectProvider('lmstudio'));

  // Connect button
  btnConnect.addEventListener('click', handleConnect);

  // Model select
  modelSelect.addEventListener('change', handleModelChange);

  // Parameter sliders
  temperatureSlider.addEventListener('input', () => {
    temperatureValue.textContent = temperatureSlider.value;
  });
  temperatureSlider.addEventListener('change', saveCurrentSettings);

  tokensSlider.addEventListener('input', () => {
    tokensValue.textContent = tokensSlider.value;
  });
  tokensSlider.addEventListener('change', saveCurrentSettings);

  timeoutSlider.addEventListener('input', () => {
    timeoutValue.textContent = `${timeoutSlider.value}s`;
  });
  timeoutSlider.addEventListener('change', saveCurrentSettings);

  // Quick action buttons
  $('btn-summary')?.addEventListener('click', () => {
    executeQuickAction('summary_short');
    openSidebarToTab('summary');
  });
  $('btn-translate')?.addEventListener('click', () => {
    executeQuickAction('translate');
    openSidebarToTab('translation');
  });
  $('btn-tips')?.addEventListener('click', () => {
    executeQuickAction('tips');
    openSidebarToTab('tips');
  });
  $('btn-chat')?.addEventListener('click', () => {
    openSidebarToTab('chat');
  });

  // Install tabs
  tabInstallOllama.addEventListener('click', () => switchInstallTab('ollama'));
  tabInstallLmstudio.addEventListener('click', () => switchInstallTab('lmstudio'));

  // Custom URL toggle (double-click provider to show custom URL)
  btnOllama.addEventListener('dblclick', () => toggleCustomUrl());
  btnLmstudio.addEventListener('dblclick', () => toggleCustomUrl());
}

// ─── Provider Selection ──────────────────────────────────────────

function selectProvider(provider: Provider): void {
  selectedProvider = provider;

  btnOllama.classList.toggle('active', provider === 'ollama');
  btnLmstudio.classList.toggle('active', provider === 'lmstudio');

  btnOllama.setAttribute('aria-checked', String(provider === 'ollama'));
  btnLmstudio.setAttribute('aria-checked', String(provider === 'lmstudio'));

  // Atualizar URL customizada se visível
  if (urlGroup.style.display !== 'none') {
    customUrl.value = provider === 'ollama'
      ? 'http://127.0.0.1:11434'
      : 'http://127.0.0.1:1234';
  }
}

function toggleCustomUrl(): void {
  const isVisible = urlGroup.style.display !== 'none';
  urlGroup.style.display = isVisible ? 'none' : 'block';
  if (!isVisible) {
    customUrl.value = selectedProvider === 'ollama'
      ? 'http://127.0.0.1:11434'
      : 'http://127.0.0.1:1234';
    customUrl.focus();
  }
}

// ─── Connection ──────────────────────────────────────────────────

async function handleConnect(): Promise<void> {
  if (isConnected) {
    // Desconectar
    await browser.runtime.sendMessage({ action: 'DISCONNECT_PROVIDER' });
    showDisconnectedState();
    return;
  }

  // Conectar
  btnConnect.disabled = true;
  btnConnectText.textContent = 'Conectando...';
  statusDot.className = 'status-dot connecting';
  statusText.textContent = 'Conectando...';
  connectionError.classList.add('hidden');
  connectionError.textContent = '';

  try {
    const data: Record<string, string> = { provider: selectedProvider };
    if (urlGroup.style.display !== 'none' && customUrl.value) {
      data.url = customUrl.value;
    }

    const result = await browser.runtime.sendMessage({
      action: 'CONNECT_PROVIDER',
      data,
    }) as any;

    if (result && result.action === 'ERROR') {
      throw new Error(result.data?.message || 'Erro de conexão na extensão');
    }

    updateStatusUI(result);

    // Salvar provider selecionado
    await saveCurrentSettings();
  } catch (error: any) {
    console.error('[TorAI Popup] Erro ao conectar:', error);
    connectionError.textContent = error.message || 'Falha ao conectar ao provedor local';
    connectionError.classList.remove('hidden');
    showDisconnectedState();
    showInstallInstructions();
  } finally {
    btnConnect.disabled = false;
  }
}

// ─── UI Updates ──────────────────────────────────────────────────

function updateStatusUI(info: ProviderInfo): void {
  if (info.status === 'connected') {
    showConnectedState(info);
  } else if (info.status === 'connecting') {
    statusDot.className = 'status-dot connecting';
    statusText.textContent = 'Conectando...';
  } else {
    showDisconnectedState();
  }
}

function showConnectedState(info: ProviderInfo): void {
  isConnected = true;

  // Status
  statusDot.className = 'status-dot connected';
  statusText.textContent = 'Conectado';

  // Button
  btnConnectText.textContent = 'Desconectar';
  btnConnect.classList.remove('btn-primary');
  btnConnect.style.background = 'var(--color-bg-tertiary)';
  btnConnect.style.color = 'var(--color-text-secondary)';

  // Model section
  sectionModel.classList.remove('hidden');
  sectionActions.classList.remove('hidden');
  sectionInstall.classList.add('hidden');

  // Populate models
  populateModels(info.models, info.activeModel);

  // Latency
  if (info.latencyMs !== null) {
    latencyValue.textContent = `${info.latencyMs}ms`;
  }

  // Active model
  activeModelName.textContent = info.activeModel || 'Nenhum';

  // Select provider
  selectProvider(info.provider);
}

function showDisconnectedState(): void {
  isConnected = false;

  statusDot.className = 'status-dot';
  statusText.textContent = 'Offline';

  btnConnectText.textContent = 'Conectar';
  btnConnect.classList.add('btn-primary');
  btnConnect.style.background = '';
  btnConnect.style.color = '';

  sectionModel.classList.add('hidden');
  sectionActions.classList.add('hidden');

  latencyValue.textContent = '—';
  activeModelName.textContent = 'Nenhum';
}

function showInstallInstructions(): void {
  sectionInstall.classList.remove('hidden');
}

function populateModels(models: string[], activeModel: string | null): void {
  modelSelect.innerHTML = '';

  if (models.length === 0) {
    const opt = document.createElement('option');
    opt.value = '';
    opt.textContent = 'Nenhum modelo encontrado';
    modelSelect.appendChild(opt);
    return;
  }

  for (const model of models) {
    const opt = document.createElement('option');
    opt.value = model;
    opt.textContent = model;
    if (model === activeModel) {
      opt.selected = true;
    }
    modelSelect.appendChild(opt);
  }
}

// ─── Model Change ────────────────────────────────────────────────

async function handleModelChange(): Promise<void> {
  const model = modelSelect.value;
  if (model) {
    activeModelName.textContent = model;
    await saveCurrentSettings();
  }
}

// ─── Settings ────────────────────────────────────────────────────

function applySettings(settings: UserSettings): void {
  selectedProvider = settings.provider;
  selectProvider(settings.provider);

  temperatureSlider.value = String(settings.temperature);
  temperatureValue.textContent = String(settings.temperature);

  tokensSlider.value = String(settings.maxTokens);
  tokensValue.textContent = String(settings.maxTokens);

  timeoutSlider.value = String(settings.requestTimeout || 120);
  timeoutValue.textContent = `${settings.requestTimeout || 120}s`;
}

async function saveCurrentSettings(): Promise<void> {
  const settings: Partial<UserSettings> = {
    provider: selectedProvider,
    temperature: parseFloat(temperatureSlider.value),
    maxTokens: parseInt(tokensSlider.value, 10),
    requestTimeout: parseInt(timeoutSlider.value, 10),
  };

  if (modelSelect.value) {
    settings.model = modelSelect.value;
  }

  try {
    await browser.runtime.sendMessage({
      action: 'SAVE_SETTINGS',
      data: settings,
    });
  } catch (error) {
    console.error('[TorAI Popup] Erro ao salvar configurações:', error);
  }
}

// ─── Quick Actions ───────────────────────────────────────────────

async function executeQuickAction(taskType: string): Promise<void> {
  try {
    // Extrair texto da página via background
    const pageContent = await browser.runtime.sendMessage({
      action: 'EXTRACT_PAGE_TEXT',
    });

    if (!pageContent?.text) {
      console.warn('[TorAI Popup] Página sem conteúdo');
      return;
    }

    // Enviar requisição
    await browser.runtime.sendMessage({
      action: 'PROCESS_AI_REQUEST',
      data: {
        type: taskType,
        content: pageContent.text,
      },
    });
  } catch (error) {
    console.error('[TorAI Popup] Erro na ação rápida:', error);
  }
}

async function openSidebarToTab(tabName: string): Promise<void> {
  try {
    // Guardar a intenção de aba no storage
    await browser.storage.local.set({ torai_target_tab: tabName });
    
    // Tentar avisar a sidebar caso já esteja aberta
    try {
      await browser.runtime.sendMessage({
        action: 'SWITCH_TAB',
        data: { tab: tabName }
      });
    } catch {
      // Ignorar erro se a sidebar não estiver aberta
    }

    // Abrir sidebar
    await openSidebar();
  } catch (error) {
    console.error('[TorAI Popup] Erro ao direcionar aba da sidebar:', error);
  }
}

async function openSidebar(): Promise<void> {
  try {
    await browser.sidebarAction.open();
  } catch {
    try {
      await browser.sidebarAction.toggle();
    } catch (error) {
      console.error('[TorAI Popup] Erro ao abrir sidebar:', error);
    }
  }
}

// ─── Install Tabs ────────────────────────────────────────────────

function switchInstallTab(tab: 'ollama' | 'lmstudio'): void {
  tabInstallOllama.classList.toggle('active', tab === 'ollama');
  tabInstallLmstudio.classList.toggle('active', tab === 'lmstudio');

  tabInstallOllama.setAttribute('aria-selected', String(tab === 'ollama'));
  tabInstallLmstudio.setAttribute('aria-selected', String(tab === 'lmstudio'));

  installOllama.classList.toggle('hidden', tab !== 'ollama');
  installLmstudio.classList.toggle('hidden', tab !== 'lmstudio');
}

/** Inicializa todas as referências DOM — chamado no DOMContentLoaded */
function initDomReferences(): void {
  statusDot = $('status-dot') as HTMLElement;
  statusText = $('status-text') as HTMLElement;
  btnOllama = $('btn-ollama') as HTMLButtonElement;
  btnLmstudio = $('btn-lmstudio') as HTMLButtonElement;
  urlGroup = $('url-group') as HTMLElement;
  customUrl = $('custom-url') as HTMLInputElement;
  btnConnect = $('btn-connect') as HTMLButtonElement;
  btnConnectText = $('btn-connect-text') as HTMLElement;
  connectionError = $('connection-error') as HTMLElement;
  sectionModel = $('section-model') as HTMLElement;
  sectionActions = $('section-actions') as HTMLElement;
  sectionInstall = $('section-install') as HTMLElement;
  modelSelect = $('model-select') as HTMLSelectElement;
  temperatureSlider = $('temperature-slider') as HTMLInputElement;
  temperatureValue = $('temperature-value') as HTMLElement;
  tokensSlider = $('tokens-slider') as HTMLInputElement;
  tokensValue = $('tokens-value') as HTMLElement;
  timeoutSlider = $('timeout-slider') as HTMLInputElement;
  timeoutValue = $('timeout-value') as HTMLElement;
  latencyValue = $('latency-value') as HTMLElement;
  activeModelName = $('active-model-name') as HTMLElement;
  tabInstallOllama = $('tab-install-ollama') as HTMLButtonElement;
  tabInstallLmstudio = $('tab-install-lmstudio') as HTMLButtonElement;
  installOllama = $('install-ollama') as HTMLElement;
  installLmstudio = $('install-lmstudio') as HTMLElement;
}
