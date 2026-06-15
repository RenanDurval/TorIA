/**
 * TorAI — Strings de interface (i18n).
 * 
 * Idioma padrão: Português (Brasil).
 * Estruturado para suportar múltiplos idiomas no futuro.
 */

export interface I18nStrings {
  // ── Geral ──
  extensionName: string;
  extensionDescription: string;
  loading: string;
  cancel: string;
  copy: string;
  copied: string;
  close: string;
  save: string;
  reset: string;
  error: string;
  success: string;
  retry: string;

  // ── Conexão ──
  connected: string;
  disconnected: string;
  connecting: string;
  connectionError: string;
  connect: string;
  disconnect: string;
  autoDetecting: string;
  providerNotFound: string;

  // ── Provedor ──
  selectProvider: string;
  ollamaLabel: string;
  lmstudioLabel: string;
  customUrl: string;
  selectModel: string;
  noModelsFound: string;
  loadingModels: string;

  // ── Parâmetros ──
  temperature: string;
  temperatureHint: string;
  maxTokens: string;
  maxTokensHint: string;
  settings: string;

  // ── Abas do Sidebar ──
  tabSummary: string;
  tabTranslation: string;
  tabTips: string;
  tabEntities: string;
  tabSnippet: string;

  // ── Resumo ──
  summaryShort: string;
  summaryDetailed: string;
  generateSummary: string;
  summaryPlaceholder: string;

  // ── Tradução ──
  translateTo: string;
  translatePage: string;
  translationPlaceholder: string;

  // ── Dicas ──
  generateTips: string;
  tipsPlaceholder: string;

  // ── Entidades ──
  extractEntities: string;
  entitiesPlaceholder: string;
  titles: string;
  authors: string;
  dates: string;
  importantLinks: string;
  keywords: string;

  // ── Trecho ──
  selectedText: string;
  noTextSelected: string;
  snippetSummarize: string;
  snippetExplain: string;
  snippetTranslate: string;

  // ── Explicação ──
  explainSimple: string;

  // ── Erros ──
  errorNoProvider: string;
  errorNoModel: string;
  errorTimeout: string;
  errorNetwork: string;
  errorPageEmpty: string;
  errorSnippetEmpty: string;

  // ── Status ──
  processingTime: string;
  modelUsed: string;
  characterCount: string;

  // ── Instruções de Instalação ──
  installTitle: string;
  installOllamaSteps: string;
  installLMStudioSteps: string;

  // ── Privacidade ──
  privacyNotice: string;
  privacyLocalOnly: string;
  contentDisclaimer: string;

  // ── Atalhos ──
  shortcutSummary: string;
  shortcutTranslate: string;
  shortcutSidebar: string;
}

/** Strings em Português (Brasil) — idioma padrão */
export const ptBR: I18nStrings = {
  // ── Geral ──
  extensionName: 'TorAI — IA Local Privada',
  extensionDescription: 'Conecte modelos de IA locais ao Tor Browser com privacidade total.',
  loading: 'Processando...',
  cancel: 'Cancelar',
  copy: 'Copiar',
  copied: 'Copiado!',
  close: 'Fechar',
  save: 'Salvar',
  reset: 'Restaurar padrão',
  error: 'Erro',
  success: 'Sucesso',
  retry: 'Tentar novamente',

  // ── Conexão ──
  connected: 'Conectado',
  disconnected: 'Desconectado',
  connecting: 'Conectando...',
  connectionError: 'Erro de conexão',
  connect: 'Conectar',
  disconnect: 'Desconectar',
  autoDetecting: 'Detectando automaticamente...',
  providerNotFound: 'Nenhum provedor de IA local encontrado',

  // ── Provedor ──
  selectProvider: 'Selecionar provedor',
  ollamaLabel: 'Ollama',
  lmstudioLabel: 'LM Studio',
  customUrl: 'URL personalizada',
  selectModel: 'Selecionar modelo',
  noModelsFound: 'Nenhum modelo encontrado. Baixe um modelo primeiro.',
  loadingModels: 'Carregando modelos...',

  // ── Parâmetros ──
  temperature: 'Temperatura',
  temperatureHint: 'Controla a criatividade. Valores baixos = mais preciso, altos = mais criativo.',
  maxTokens: 'Tokens máximos',
  maxTokensHint: 'Limite de tamanho da resposta gerada.',
  settings: 'Configurações',

  // ── Abas do Sidebar ──
  tabSummary: '📝 Resumo',
  tabTranslation: '🌐 Tradução',
  tabTips: '💡 Dicas',
  tabEntities: '🏷️ Entidades',
  tabSnippet: '✂️ Trecho',

  // ── Resumo ──
  summaryShort: 'Resumo curto',
  summaryDetailed: 'Resumo detalhado',
  generateSummary: 'Gerar resumo',
  summaryPlaceholder: 'Clique em "Gerar resumo" para analisar a página atual.',

  // ── Tradução ──
  translateTo: 'Traduzir para:',
  translatePage: 'Traduzir página',
  translationPlaceholder: 'Selecione o idioma e clique em "Traduzir página".',

  // ── Dicas ──
  generateTips: 'Gerar dicas',
  tipsPlaceholder: 'Clique para gerar dicas de usabilidade, segurança e leitura.',

  // ── Entidades ──
  extractEntities: 'Extrair entidades',
  entitiesPlaceholder: 'Clique para extrair títulos, autores, datas e links importantes.',
  titles: 'Títulos',
  authors: 'Autores',
  dates: 'Datas',
  importantLinks: 'Links importantes',
  keywords: 'Palavras-chave',

  // ── Trecho ──
  selectedText: 'Texto selecionado',
  noTextSelected: 'Selecione um trecho de texto na página para analisar.',
  snippetSummarize: 'Resumir trecho',
  snippetExplain: 'Explicar trecho',
  snippetTranslate: 'Traduzir trecho',

  // ── Explicação ──
  explainSimple: 'Explicar para iniciantes',

  // ── Erros ──
  errorNoProvider: 'Nenhum provedor de IA local está ativo. Inicie o Ollama ou LM Studio.',
  errorNoModel: 'Nenhum modelo selecionado. Selecione um modelo nas configurações.',
  errorTimeout: 'A requisição expirou. O modelo pode estar sobrecarregado.',
  errorNetwork: 'Erro de rede ao conectar com o modelo local.',
  errorPageEmpty: 'Não foi possível extrair texto desta página.',
  errorSnippetEmpty: 'Selecione um trecho de texto na página primeiro.',

  // ── Status ──
  processingTime: 'Tempo de processamento',
  modelUsed: 'Modelo utilizado',
  characterCount: 'caracteres',

  // ── Instruções de Instalação ──
  installTitle: 'Como instalar um provedor de IA local',
  installOllamaSteps:
    '1. Acesse https://ollama.com e baixe o Ollama\n' +
    '2. Instale e execute: ollama serve\n' +
    '3. Baixe um modelo: ollama pull llama3.2\n' +
    '4. Clique em "Conectar" nesta extensão',
  installLMStudioSteps:
    '1. Acesse https://lmstudio.ai e baixe o LM Studio\n' +
    '2. Abra e baixe um modelo na aba "Discover"\n' +
    '3. Vá em "Server" e clique "Start Server"\n' +
    '4. Clique em "Conectar" nesta extensão',

  // ── Privacidade ──
  privacyNotice: '🔒 Privacidade total',
  privacyLocalOnly: 'Todos os dados são processados localmente. Nenhuma informação sai do seu computador.',
  contentDisclaimer:
    '⚠️ O conteúdo gerado por IA pode conter erros. ' +
    'Verifique informações importantes. ' +
    'Respeite direitos autorais ao usar traduções e resumos.',

  // ── Atalhos ──
  shortcutSummary: 'Ctrl+Shift+S — Gerar resumo',
  shortcutTranslate: 'Ctrl+Shift+T — Traduzir página',
  shortcutSidebar: 'Ctrl+Shift+A — Abrir painel',
};

/** Obter strings do idioma atual (por ora, sempre pt-BR) */
export function getStrings(): I18nStrings {
  return ptBR;
}
