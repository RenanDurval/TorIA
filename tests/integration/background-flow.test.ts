/**
 * TorAI — Testes de integração do fluxo background.
 * 
 * Testa o fluxo completo: detecção → conexão → extração → prompt → resposta.
 */

import {
  autoDetectProvider,
  connect,
  disconnect,
  getProviderInfo,
  sendChatCompletion,
  _resetForTesting,
} from '../../src/background/ai-client';

import { buildPrompt } from '../../src/background/prompt-builder';
import { sanitizeText, validateLocalUrl } from '../../src/background/security';

import {
  setupMockFetch,
  MOCK_RESPONSES,
  createMockChatResponse,
} from './mock-server';

import type { ChatCompletionRequest } from '../../src/shared/types';

const mockFetch = globalThis.fetch as jest.Mock;

beforeEach(() => {
  _resetForTesting();
  mockFetch.mockReset();
});

// ─── Fluxo Completo ──────────────────────────────────────────────

describe('Fluxo completo: Detecção → Conexão → Processamento', () => {
  test('detecta Ollama, conecta e gera resumo', async () => {
    setupMockFetch('ollama', 'summary_short');

    // 1. Auto-detectar provedor
    const detected = await autoDetectProvider();
    expect(detected).not.toBeNull();
    expect(detected!.provider).toBe('ollama');

    // 2. Conectar
    const info = await connect(detected!.provider, detected!.url);
    expect(info.status).toBe('connected');
    expect(info.models.length).toBeGreaterThan(0);

    // 3. Simular conteúdo da página
    const rawPageText = `
      Título da Página: Privacidade Digital
      
      A privacidade digital é fundamental no mundo moderno.
      O navegador Tor oferece proteção contra rastreamento.
      Roteamento onion criptografa múltiplas camadas de dados.
    `;

    // 4. Sanitizar texto
    const cleanText = sanitizeText(rawPageText);
    expect(cleanText.length).toBeGreaterThan(0);
    expect(cleanText).not.toContain('\x00');

    // 5. Construir prompt
    const messages = buildPrompt('summary_short', cleanText);
    expect(messages).toHaveLength(2);

    // 6. Enviar ao modelo
    const request: ChatCompletionRequest = {
      model: info.activeModel!,
      messages,
      temperature: 0.7,
      max_tokens: 2048,
      stream: false,
    };

    const response = await sendChatCompletion(request);

    // 7. Verificar resposta
    expect(response.choices).toHaveLength(1);
    expect(response.choices[0].message.content).toBeTruthy();
    expect(response.choices[0].message.content.length).toBeGreaterThan(10);
  });

  test('fluxo completo de tradução', async () => {
    setupMockFetch('ollama', 'translate');

    await connect('ollama', 'http://127.0.0.1:11434');
    const info = getProviderInfo();

    const text = 'Texto em português para traduzir.';
    const messages = buildPrompt('translate', text, { targetLanguage: 'en' });

    const response = await sendChatCompletion({
      model: info.activeModel!,
      messages,
      temperature: 0.3,
      max_tokens: 4096,
      stream: false,
    });

    expect(response.choices[0].message.content).toContain('privacy');
  });

  test('fluxo completo de extração de entidades', async () => {
    setupMockFetch('ollama', 'entities');

    await connect('ollama', 'http://127.0.0.1:11434');
    const info = getProviderInfo();

    const text = 'Artigo por João Silva, publicado em 2024.';
    const messages = buildPrompt('entities', text);

    const response = await sendChatCompletion({
      model: info.activeModel!,
      messages,
      stream: false,
    });

    const result = response.choices[0].message.content;
    expect(result).toContain('Títulos');
    expect(result).toContain('Autores');
    expect(result).toContain('Datas');
  });
});

// ─── Segurança End-to-End ────────────────────────────────────────

describe('Segurança end-to-end', () => {
  test('rejeita conexão a hosts externos em qualquer ponto', async () => {
    expect(() => validateLocalUrl('http://evil.com:11434')).toThrow();
    await expect(connect('ollama', 'http://evil.com:11434')).rejects.toThrow();
  });

  test('sanitiza conteúdo com caracteres maliciosos', () => {
    const malicious = 'Normal text\x00\x01\x02<script>alert("xss")</script>';
    const clean = sanitizeText(malicious);

    expect(clean).not.toContain('\x00');
    expect(clean).not.toContain('\x01');
    // Nota: sanitizeText remove controle chars mas não HTML — o modelo é local
    expect(clean).toContain('Normal text');
  });

  test('todas as URLs geradas apontam para localhost', async () => {
    setupMockFetch('ollama');

    await connect('ollama', 'http://127.0.0.1:11434');

    // Verificar que todas as chamadas fetch foram para localhost
    for (const call of mockFetch.mock.calls) {
      const url = call[0] as string;
      expect(url).toMatch(/^http:\/\/(127\.0\.0\.1|localhost)/);
    }
  });
});

// ─── Resiliência ─────────────────────────────────────────────────

describe('Resiliência e recuperação de erros', () => {
  test('recupera de timeout graciosamente', async () => {
    mockFetch.mockImplementation(() =>
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout')), 100)
      )
    );

    const detected = await autoDetectProvider();
    expect(detected).toBeNull(); // Deve retornar null, não crashar
  });

  test('desconexão limpa estado completamente', async () => {
    setupMockFetch('ollama');
    await connect('ollama', 'http://127.0.0.1:11434');

    expect(getProviderInfo().status).toBe('connected');

    disconnect();

    expect(getProviderInfo().status).toBe('disconnected');
    expect(getProviderInfo().models).toHaveLength(0);
    expect(getProviderInfo().activeModel).toBeNull();
  });
});
