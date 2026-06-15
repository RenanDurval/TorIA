/**
 * TorAI — Testes unitários do AI client.
 */

import {
  autoDetectProvider,
  connect,
  disconnect,
  getProviderInfo,
  sendChatCompletion,
  listModels,
  setActiveModel,
  _resetForTesting,
} from '../../src/background/ai-client';

import type { ChatCompletionRequest, ChatCompletionResponse } from '../../src/shared/types';

// Mock de fetch global
const mockFetch = globalThis.fetch as jest.Mock;

beforeEach(() => {
  _resetForTesting();
  mockFetch.mockReset();
});

// ─── Helper: Criar mock response ─────────────────────────────────

function mockResponse(body: any, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(JSON.stringify(body)),
    headers: new Headers(),
  } as any;
}

// ─── autoDetectProvider ──────────────────────────────────────────

describe('autoDetectProvider', () => {
  test('detecta Ollama se disponível', async () => {
    mockFetch.mockResolvedValueOnce(
      mockResponse({ models: [{ name: 'llama3.2' }] })
    );

    const result = await autoDetectProvider();
    expect(result).toEqual({
      provider: 'ollama',
      url: 'http://127.0.0.1:11434',
    });
  });

  test('detecta LMStudio se Ollama não disponível', async () => {
    // Ollama falha
    mockFetch.mockRejectedValueOnce(new Error('Connection refused'));
    // LMStudio responde
    mockFetch.mockResolvedValueOnce(
      mockResponse({ data: [{ id: 'model-1' }] })
    );

    const result = await autoDetectProvider();
    expect(result).toEqual({
      provider: 'lmstudio',
      url: 'http://127.0.0.1:1234',
    });
  });

  test('retorna null se nenhum provedor disponível', async () => {
    mockFetch.mockRejectedValue(new Error('Connection refused'));

    const result = await autoDetectProvider();
    expect(result).toBeNull();
  });
});

// ─── connect ─────────────────────────────────────────────────────

describe('connect', () => {
  test('conecta ao Ollama com sucesso', async () => {
    // Health check
    mockFetch.mockResolvedValueOnce(
      mockResponse({ models: [{ name: 'llama3.2' }] })
    );
    // List models
    mockFetch.mockResolvedValueOnce(
      mockResponse({ models: [{ name: 'llama3.2' }, { name: 'mistral' }] })
    );

    const info = await connect('ollama', 'http://127.0.0.1:11434');

    expect(info.status).toBe('connected');
    expect(info.provider).toBe('ollama');
    expect(info.models).toContain('llama3.2');
    expect(info.activeModel).toBe('llama3.2');
  });

  test('conecta ao LMStudio com sucesso', async () => {
    // Health check
    mockFetch.mockResolvedValueOnce(
      mockResponse({ data: [{ id: 'local-model' }] })
    );
    // List models
    mockFetch.mockResolvedValueOnce(
      mockResponse({ data: [{ id: 'local-model' }] })
    );

    const info = await connect('lmstudio', 'http://127.0.0.1:1234');

    expect(info.status).toBe('connected');
    expect(info.provider).toBe('lmstudio');
  });

  test('rejeita URLs externas', async () => {
    await expect(connect('ollama', 'http://evil.com:11434'))
      .rejects.toThrow('Host não permitido');
  });

  test('define status error quando falha', async () => {
    mockFetch.mockRejectedValue(new Error('Connection refused'));

    await expect(connect('ollama', 'http://127.0.0.1:11434'))
      .rejects.toThrow();

    expect(getProviderInfo().status).toBe('error');
  });

  test('seleciona modelo especificado se disponível', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({}));
    mockFetch.mockResolvedValueOnce(
      mockResponse({ models: [{ name: 'llama3.2' }, { name: 'mistral' }] })
    );

    const info = await connect('ollama', 'http://127.0.0.1:11434', 'mistral');
    expect(info.activeModel).toBe('mistral');
  });
});

// ─── disconnect ──────────────────────────────────────────────────

describe('disconnect', () => {
  test('limpa estado ao desconectar', async () => {
    // Conectar primeiro
    mockFetch.mockResolvedValueOnce(mockResponse({}));
    mockFetch.mockResolvedValueOnce(
      mockResponse({ models: [{ name: 'test' }] })
    );
    await connect('ollama', 'http://127.0.0.1:11434');

    disconnect();

    const info = getProviderInfo();
    expect(info.status).toBe('disconnected');
    expect(info.models).toHaveLength(0);
    expect(info.activeModel).toBeNull();
  });
});

// ─── sendChatCompletion ──────────────────────────────────────────

describe('sendChatCompletion', () => {
  const sampleRequest: ChatCompletionRequest = {
    model: 'llama3.2',
    messages: [
      { role: 'system', content: 'You are helpful.' },
      { role: 'user', content: 'Hello' },
    ],
  };

  const sampleResponse: ChatCompletionResponse = {
    id: 'chatcmpl-123',
    object: 'chat.completion',
    created: Date.now(),
    model: 'llama3.2',
    choices: [{
      index: 0,
      message: { role: 'assistant', content: 'Hello! How can I help?' },
      finish_reason: 'stop',
    }],
  };

  beforeEach(async () => {
    // Setup: conectar
    mockFetch.mockResolvedValueOnce(mockResponse({}));
    mockFetch.mockResolvedValueOnce(
      mockResponse({ models: [{ name: 'llama3.2' }] })
    );
    await connect('ollama', 'http://127.0.0.1:11434');
    mockFetch.mockReset();
  });

  test('envia requisição e retorna resposta', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse(sampleResponse));

    const result = await sendChatCompletion(sampleRequest);

    expect(result.choices[0].message.content).toBe('Hello! How can I help?');
    expect(mockFetch).toHaveBeenCalledTimes(1);

    // Verificar que a URL é localhost
    const callUrl = mockFetch.mock.calls[0][0];
    expect(callUrl).toContain('127.0.0.1');
    expect(callUrl).toContain('/v1/chat/completions');
  });

  test('lança erro quando não conectado', async () => {
    disconnect();

    await expect(sendChatCompletion(sampleRequest))
      .rejects.toThrow('Não conectado');
  });

  test('lança erro para resposta HTTP não-ok', async () => {
    mockFetch.mockResolvedValue(mockResponse({ error: 'Model not found' }, 404));

    await expect(sendChatCompletion(sampleRequest))
      .rejects.toThrow('Erro do modelo');
  });

  test('força stream: false', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse(sampleResponse));

    await sendChatCompletion({ ...sampleRequest, stream: true });

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.stream).toBe(false);
  });
});

// ─── setActiveModel ──────────────────────────────────────────────

describe('setActiveModel', () => {
  beforeEach(async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({}));
    mockFetch.mockResolvedValueOnce(
      mockResponse({ models: [{ name: 'llama3.2' }, { name: 'mistral' }] })
    );
    await connect('ollama', 'http://127.0.0.1:11434');
  });

  test('muda modelo ativo se disponível', () => {
    expect(setActiveModel('mistral')).toBe(true);
    expect(getProviderInfo().activeModel).toBe('mistral');
  });

  test('rejeita modelo não disponível', () => {
    expect(setActiveModel('nonexistent')).toBe(false);
  });

  test('rejeita nome de modelo inválido', () => {
    expect(setActiveModel('')).toBe(false);
    expect(setActiveModel('model;evil')).toBe(false);
  });
});
