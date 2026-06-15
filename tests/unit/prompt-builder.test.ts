/**
 * TorAI — Testes unitários do construtor de prompts.
 */

import { buildPrompt, estimateTokenCount, contentFitsLimit } from '../../src/background/prompt-builder';
import type { TaskType } from '../../src/shared/types';

// ─── buildPrompt ─────────────────────────────────────────────────

describe('buildPrompt', () => {
  const sampleContent = 'Este é um texto de exemplo para testes do construtor de prompts.';

  test('gera prompt de resumo curto', () => {
    const messages = buildPrompt('summary_short', sampleContent);

    expect(messages).toHaveLength(2);
    expect(messages[0].role).toBe('system');
    expect(messages[1].role).toBe('user');
    expect(messages[1].content).toContain('CURTO');
    expect(messages[1].content).toContain('3 a 4 frases');
    expect(messages[1].content).toContain(sampleContent);
  });

  test('gera prompt de resumo detalhado', () => {
    const messages = buildPrompt('summary_detailed', sampleContent);

    expect(messages[1].content).toContain('detalhado');
    expect(messages[1].content).toContain('4 a 6 tópicos');
  });

  test('gera prompt de tradução com idioma alvo', () => {
    const messages = buildPrompt('translate', sampleContent, {
      targetLanguage: 'en',
    });

    expect(messages[1].content).toContain('en');
    expect(messages[1].content).toContain('Traduza');
    expect(messages[1].content).toContain(sampleContent);
  });

  test('gera prompt de dicas', () => {
    const messages = buildPrompt('tips', sampleContent);

    expect(messages[1].content).toContain('dicas');
    expect(messages[1].content).toContain('segurança');
    expect(messages[1].content).toContain('usabilidade');
    expect(messages[1].content).toContain('até 5');
  });

  test('gera prompt de entidades', () => {
    const messages = buildPrompt('entities', sampleContent);

    expect(messages[1].content).toContain('Títulos');
    expect(messages[1].content).toContain('Autores');
    expect(messages[1].content).toContain('Datas');
    expect(messages[1].content).toContain('Links');
    expect(messages[1].content).toContain('Palavras-chave');
  });

  test('gera prompt de explicação simples', () => {
    const messages = buildPrompt('explain', sampleContent);

    expect(messages[1].content).toContain('simples');
    expect(messages[1].content).toContain('jargões');
    expect(messages[1].content).toContain('analogias');
  });

  test('gera prompt de snippet (resumo)', () => {
    const messages = buildPrompt('snippet_summary', 'Trecho selecionado');

    expect(messages[1].content).toContain('Resuma');
    expect(messages[1].content).toContain('Trecho selecionado');
  });

  test('gera prompt de snippet (explicação)', () => {
    const messages = buildPrompt('snippet_explain', 'Trecho técnico');

    expect(messages[1].content).toContain('Explique');
    expect(messages[1].content).toContain('Trecho técnico');
  });

  test('gera prompt de snippet (tradução)', () => {
    const messages = buildPrompt('snippet_translate', 'Text to translate', {
      targetLanguage: 'es',
    });

    expect(messages[1].content).toContain('Traduza');
    expect(messages[1].content).toContain('es');
  });

  test('lança erro para tipo desconhecido', () => {
    expect(() => buildPrompt('unknown_type' as TaskType, sampleContent))
      .toThrow('Tipo de tarefa desconhecido');
  });

  test('system prompt inclui regras de privacidade', () => {
    const messages = buildPrompt('summary_short', sampleContent);
    const systemPrompt = messages[0].content;

    expect(systemPrompt).toContain('Tor');
    expect(systemPrompt).toContain('privacidade');
    expect(systemPrompt).toContain('conciso');
  });

  test('todos os tipos de tarefa geram exatamente 2 mensagens', () => {
    const taskTypes: TaskType[] = [
      'summary_short', 'summary_detailed', 'translate', 'tips',
      'entities', 'explain', 'snippet_summary', 'snippet_explain', 'snippet_translate',
    ];

    for (const type of taskTypes) {
      const messages = buildPrompt(type, sampleContent, { targetLanguage: 'en' });
      expect(messages).toHaveLength(2);
      expect(messages[0].role).toBe('system');
      expect(messages[1].role).toBe('user');
    }
  });
});

// ─── estimateTokenCount ──────────────────────────────────────────

describe('estimateTokenCount', () => {
  test('estima tokens com base em ~4 chars/token', () => {
    expect(estimateTokenCount('abcd')).toBe(1);
    expect(estimateTokenCount('a'.repeat(100))).toBe(25);
    expect(estimateTokenCount('')).toBe(0);
  });
});

// ─── contentFitsLimit ────────────────────────────────────────────

describe('contentFitsLimit', () => {
  test('retorna true para conteúdo curto', () => {
    expect(contentFitsLimit('Texto curto', 4096)).toBe(true);
  });

  test('retorna false para conteúdo muito longo', () => {
    const longContent = 'a'.repeat(50000);
    expect(contentFitsLimit(longContent, 4096)).toBe(false);
  });

  test('considera reserva para resposta', () => {
    // 4000 chars ≈ 1000 tokens, com reserva de 1024 → precisa de 2024 tokens
    const content = 'a'.repeat(4000);
    expect(contentFitsLimit(content, 2048, 1024)).toBe(true);
    expect(contentFitsLimit(content, 1500, 1024)).toBe(false);
  });
});
