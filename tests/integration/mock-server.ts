/**
 * TorAI — Servidor mock para testes de integração.
 * 
 * Simula respostas do Ollama e LMStudio para testes
 * sem dependência de serviços reais.
 */

import type { ChatCompletionResponse } from '../../src/shared/types';

// ─── Respostas Mock ──────────────────────────────────────────────

/** Modelo mock padrão */
export const MOCK_MODEL = 'test-model-7b';

/** Resposta mock para /api/tags (Ollama) */
export const MOCK_OLLAMA_TAGS = {
  models: [
    { name: 'llama3.2', size: 4100000000, modified_at: '2024-01-15T10:00:00Z' },
    { name: 'mistral:7b', size: 4200000000, modified_at: '2024-01-14T10:00:00Z' },
    { name: 'codellama', size: 3800000000, modified_at: '2024-01-13T10:00:00Z' },
  ],
};

/** Resposta mock para /v1/models (LMStudio/OpenAI format) */
export const MOCK_LMSTUDIO_MODELS = {
  object: 'list',
  data: [
    { id: 'local-model-7b', object: 'model', created: Date.now() },
    { id: 'local-model-13b', object: 'model', created: Date.now() },
  ],
};

/** Gera resposta mock de chat completion */
export function createMockChatResponse(content: string): ChatCompletionResponse {
  return {
    id: `chatcmpl-mock-${Date.now()}`,
    object: 'chat.completion',
    created: Math.floor(Date.now() / 1000),
    model: MOCK_MODEL,
    choices: [{
      index: 0,
      message: {
        role: 'assistant',
        content,
      },
      finish_reason: 'stop',
    }],
    usage: {
      prompt_tokens: 150,
      completion_tokens: 80,
      total_tokens: 230,
    },
  };
}

// ─── Respostas por tipo de tarefa ────────────────────────────────

export const MOCK_RESPONSES: Record<string, string> = {
  summary_short:
    'Esta página apresenta informações sobre privacidade digital no contexto do navegador Tor. ' +
    'O conteúdo aborda medidas de proteção contra rastreamento e vigilância online.',

  summary_detailed:
    'A página aborda de forma abrangente o tema da privacidade digital, com foco especial no navegador Tor. ' +
    'São apresentados os principais riscos de rastreamento online, incluindo cookies, fingerprinting e análise de tráfego. ' +
    'O texto explica como o roteamento onion funciona para proteger a identidade do usuário. ' +
    'São mencionadas limitações conhecidas do Tor, como velocidade reduzida e incompatibilidade com alguns sites. ' +
    'O autor recomenda práticas complementares de segurança, como uso de VPN e autenticação de dois fatores.',

  translate:
    'This page presents information about digital privacy in the context of the Tor browser. ' +
    'The content covers protection measures against tracking and online surveillance.',

  tips:
    '1. **Verifique o certificado SSL**: Sempre confirme que sites sensíveis usam HTTPS válido.\n' +
    '2. **Evite downloads**: Arquivos baixados pelo Tor podem conter malware que revela seu IP real.\n' +
    '3. **Não maximize a janela**: O tamanho da janela pode ser usado para fingerprinting.\n' +
    '4. **Atualize regularmente**: Mantenha o Tor Browser sempre na versão mais recente.\n' +
    '5. **Leia a política de privacidade**: Antes de inserir dados pessoais em qualquer formulário.',

  entities:
    '**Títulos:** Privacidade Digital no Tor Browser; Como Funciona o Roteamento Onion\n' +
    '**Autores:** Equipe Tor Project\n' +
    '**Datas:** Janeiro 2024; Atualizado em Março 2024\n' +
    '**Links importantes:** https://torproject.org; https://support.torproject.org\n' +
    '**Palavras-chave:** privacidade, Tor, anonimato, criptografia, roteamento onion',

  explain:
    'Imagine que você quer enviar uma carta secreta. Em vez de enviá-la diretamente, você coloca a carta dentro de ' +
    'vários envelopes, um dentro do outro, como uma cebola (por isso o nome "onion"). Cada pessoa que recebe a carta ' +
    'só consegue abrir o envelope de fora e ver para onde enviar o próximo, mas não sabe o que está dentro.\n\n' +
    'É assim que o Tor funciona: seu tráfego de internet passa por vários computadores ao redor do mundo, e cada um ' +
    'só conhece o passo anterior e o próximo, nunca a origem e o destino final ao mesmo tempo.\n\n' +
    'Isso torna muito difícil para alguém saber o que você está acessando na internet.',

  snippet_summary:
    'O trecho selecionado explica que o roteamento onion utiliza múltiplas camadas de criptografia para proteger a privacidade do usuário.',

  snippet_explain:
    'Este trecho fala sobre "roteamento onion" — é como enviar uma carta dentro de vários envelopes. ' +
    'Cada intermediário só vê o envelope de fora, sem saber o conteúdo final.',
};

// ─── Setup de Fetch Mock para Testes ─────────────────────────────

/**
 * Configura o mock global de fetch para simular um provedor de IA.
 * 
 * @param provider - 'ollama' ou 'lmstudio'
 * @param taskType - Tipo de tarefa para a resposta mock
 */
export function setupMockFetch(
  provider: 'ollama' | 'lmstudio' = 'ollama',
  taskType: string = 'summary_short',
): void {
  const mockFetch = globalThis.fetch as jest.Mock;

  mockFetch.mockImplementation((url: string, options: any) => {
    const urlStr = url.toString();

    // Health check / list models
    if (urlStr.includes('/api/tags')) {
      return Promise.resolve(mockHttpResponse(MOCK_OLLAMA_TAGS));
    }
    if (urlStr.includes('/v1/models')) {
      return Promise.resolve(mockHttpResponse(MOCK_LMSTUDIO_MODELS));
    }

    // Chat completion
    if (urlStr.includes('/v1/chat/completions')) {
      const responseText = MOCK_RESPONSES[taskType] || MOCK_RESPONSES.summary_short;
      return Promise.resolve(
        mockHttpResponse(createMockChatResponse(responseText))
      );
    }

    // Fallback
    return Promise.reject(new Error(`Unexpected URL: ${url}`));
  });
}

function mockHttpResponse(body: any, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(JSON.stringify(body)),
    headers: new Headers({ 'content-type': 'application/json' }),
    clone: () => mockHttpResponse(body, status),
  } as any;
}
