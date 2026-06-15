/**
 * TorAI — Testes unitários do módulo de segurança.
 */

import {
  validateLocalUrl,
  buildSafeUrl,
  sanitizeText,
  sanitizeSnippet,
  validateModelParams,
  validateModelName,
  checkResponseSafety,
  clearTemporaryData,
} from '../../src/background/security';

// ─── validateLocalUrl ────────────────────────────────────────────

describe('validateLocalUrl', () => {
  test('aceita localhost com porta válida', () => {
    expect(validateLocalUrl('http://localhost:11434')).toBe(true);
    expect(validateLocalUrl('http://127.0.0.1:11434')).toBe(true);
    expect(validateLocalUrl('http://127.0.0.1:1234')).toBe(true);
    expect(validateLocalUrl('http://localhost:8080')).toBe(true);
  });

  test('rejeita hosts externos', () => {
    expect(() => validateLocalUrl('http://google.com:11434')).toThrow('Host não permitido');
    expect(() => validateLocalUrl('http://192.168.1.1:11434')).toThrow('Host não permitido');
    expect(() => validateLocalUrl('http://10.0.0.1:11434')).toThrow('Host não permitido');
    expect(() => validateLocalUrl('http://example.com:1234')).toThrow('Host não permitido');
  });

  test('rejeita HTTPS (desnecessário para localhost)', () => {
    expect(() => validateLocalUrl('https://localhost:11434')).toThrow('Protocolo não permitido');
  });

  test('rejeita URLs inválidas', () => {
    expect(() => validateLocalUrl('not-a-url')).toThrow('URL inválida');
    expect(() => validateLocalUrl('')).toThrow('URL inválida');
    expect(() => validateLocalUrl('ftp://localhost:11434')).toThrow('Protocolo não permitido');
  });

  test('rejeita portas inválidas', () => {
    expect(() => validateLocalUrl('http://localhost')).toThrow('Porta inválida');
    expect(() => validateLocalUrl('http://localhost:0')).toThrow('Porta inválida');
    expect(() => validateLocalUrl('http://localhost:99999')).toThrow('Porta inválida');
  });
});

// ─── buildSafeUrl ────────────────────────────────────────────────

describe('buildSafeUrl', () => {
  test('constrói URL corretamente', () => {
    expect(buildSafeUrl('http://127.0.0.1:11434', '/api/tags'))
      .toBe('http://127.0.0.1:11434/api/tags');
  });

  test('remove barras duplicadas', () => {
    expect(buildSafeUrl('http://127.0.0.1:11434/', '/api/tags'))
      .toBe('http://127.0.0.1:11434/api/tags');
  });

  test('lança erro para hosts externos', () => {
    expect(() => buildSafeUrl('http://evil.com:11434', '/api/tags'))
      .toThrow('Host não permitido');
  });
});

// ─── sanitizeText ────────────────────────────────────────────────

describe('sanitizeText', () => {
  test('remove caracteres de controle', () => {
    expect(sanitizeText('Hello\x00World\x01!')).toBe('HelloWorld!');
  });

  test('normaliza whitespace', () => {
    expect(sanitizeText('Hello   World')).toBe('Hello World');
    expect(sanitizeText('Hello\t\tWorld')).toBe('Hello World');
  });

  test('colapsa múltiplas linhas vazias', () => {
    expect(sanitizeText('A\n\n\n\n\nB')).toBe('A\n\nB');
  });

  test('trunca texto muito longo', () => {
    const longText = 'A'.repeat(20000);
    const result = sanitizeText(longText, 100);
    expect(result.length).toBeLessThanOrEqual(200); // + mensagem de truncamento
    expect(result).toContain('[... texto truncado');
  });

  test('retorna vazio para entrada nula/vazia', () => {
    expect(sanitizeText('')).toBe('');
    expect(sanitizeText(null as any)).toBe('');
    expect(sanitizeText(undefined as any)).toBe('');
  });

  test('preserva newlines normais', () => {
    expect(sanitizeText('Linha 1\nLinha 2')).toBe('Linha 1\nLinha 2');
  });
});

// ─── sanitizeSnippet ─────────────────────────────────────────────

describe('sanitizeSnippet', () => {
  test('aplica limite de snippet (4000 chars)', () => {
    const longText = 'B'.repeat(5000);
    const result = sanitizeSnippet(longText);
    expect(result.length).toBeLessThan(5000);
  });
});

// ─── validateModelParams ─────────────────────────────────────────

describe('validateModelParams', () => {
  test('retorna valores padrão quando não especificado', () => {
    const result = validateModelParams({});
    expect(result.temperature).toBe(0.7);
    expect(result.maxTokens).toBe(2048);
  });

  test('clampa temperatura entre 0 e 2', () => {
    expect(validateModelParams({ temperature: -1 }).temperature).toBe(0);
    expect(validateModelParams({ temperature: 5 }).temperature).toBe(2);
    expect(validateModelParams({ temperature: 0.5 }).temperature).toBe(0.5);
  });

  test('clampa tokens entre 128 e 8192', () => {
    expect(validateModelParams({ maxTokens: 10 }).maxTokens).toBe(128);
    expect(validateModelParams({ maxTokens: 100000 }).maxTokens).toBe(8192);
    expect(validateModelParams({ maxTokens: 2048 }).maxTokens).toBe(2048);
  });

  test('arredonda tokens para inteiro', () => {
    expect(validateModelParams({ maxTokens: 2048.7 }).maxTokens).toBe(2049);
  });
});

// ─── validateModelName ───────────────────────────────────────────

describe('validateModelName', () => {
  test('aceita nomes válidos', () => {
    expect(validateModelName('llama3.2')).toBe(true);
    expect(validateModelName('mistral:7b-instruct')).toBe(true);
    expect(validateModelName('codellama/CodeLlama-7b')).toBe(true);
    expect(validateModelName('phi-3')).toBe(true);
  });

  test('rejeita nomes inválidos', () => {
    expect(validateModelName('')).toBe(false);
    expect(validateModelName(null as any)).toBe(false);
    expect(validateModelName('model with spaces')).toBe(false);
    expect(validateModelName('model;rm -rf /')).toBe(false);
  });

  test('rejeita nomes muito longos', () => {
    expect(validateModelName('a'.repeat(201))).toBe(false);
  });
});

// ─── checkResponseSafety ─────────────────────────────────────────

describe('checkResponseSafety', () => {
  test('resposta normal é segura', () => {
    const result = checkResponseSafety('Este é um resumo normal do texto.');
    expect(result.safe).toBe(true);
    expect(result.warnings).toHaveLength(0);
  });

  test('detecta javascript: protocol', () => {
    const result = checkResponseSafety('Clique em javascript:alert(1)');
    expect(result.safe).toBe(false);
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  test('detecta data:text/html', () => {
    const result = checkResponseSafety('Use data:text/html,<script>...');
    expect(result.safe).toBe(false);
  });
});

// ─── clearTemporaryData ──────────────────────────────────────────

describe('clearTemporaryData', () => {
  test('chama storage.local.remove', async () => {
    await clearTemporaryData();
    expect((globalThis as any).browser.storage.local.remove).toHaveBeenCalledWith('torai_cache');
  });
});
