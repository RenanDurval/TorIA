/**
 * TorAI — Construtor de prompts para cada funcionalidade.
 * 
 * Gera prompts otimizados para modelos locais, com instruções
 * claras e formato de resposta esperado.
 */

import type { ChatMessage, TaskType } from '../shared/types';

// ─── System Prompt Base ──────────────────────────────────────────

const SYSTEM_PROMPT = `Você é um assistente de IA integrado ao navegador Tor. Sua função é ajudar o usuário a entender o conteúdo de páginas web. Regras:
- Responda SEMPRE no idioma solicitado.
- Seja conciso e direto.
- Não inclua informações que não estejam no texto fornecido.
- Não faça suposições sobre a identidade do usuário.
- Não sugira ações que comprometam a privacidade.`;

// ─── Builders de Prompt ──────────────────────────────────────────

/**
 * Constrói mensagens de chat para o tipo de tarefa especificado.
 * 
 * @param taskType - Tipo da tarefa (summary, translate, etc.)
 * @param content - Texto da página ou trecho
 * @param options - Opções adicionais (idioma alvo, etc.)
 * @returns Array de ChatMessage para enviar ao modelo
 */
export function buildPrompt(
  taskType: TaskType,
  content: string,
  options: PromptOptions = {},
): ChatMessage[] {
  switch (taskType) {
    case 'summary_short':
      return buildSummaryPrompt(content, 'short');
    case 'summary_detailed':
      return buildSummaryPrompt(content, 'detailed');
    case 'translate':
      return buildTranslationPrompt(content, options.targetLanguage || 'pt-BR');
    case 'tips':
      return buildTipsPrompt(content);
    case 'entities':
      return buildEntitiesPrompt(content);
    case 'explain':
      return buildExplainPrompt(content);
    case 'snippet_summary':
      return buildSnippetPrompt(content, 'summary');
    case 'snippet_explain':
      return buildSnippetPrompt(content, 'explain');
    case 'snippet_translate':
      return buildTranslationPrompt(content, options.targetLanguage || 'pt-BR');
    case 'chat':
      return buildChatPrompt(content, options.pageText);
    default:
      throw new Error(`Tipo de tarefa desconhecido: ${taskType}`);
  }
}

/** Opções adicionais para construção de prompts */
export interface PromptOptions {
  targetLanguage?: string;
  pageTitle?: string;
  pageUrl?: string;
  pageText?: string;
}

// ─── Resumo ──────────────────────────────────────────────────────

function buildSummaryPrompt(
  content: string,
  mode: 'short' | 'detailed',
): ChatMessage[] {
  const instruction = mode === 'short'
    ? `Gere um resumo CURTO, substancial e objetivo do texto abaixo em 3 a 4 frases completas. Foque nos fatos principais e na conclusão geral.`
    : `Gere um resumo completo, rico e estruturado do texto abaixo exatamente neste formato:
1. **Introdução:** Um parágrafo explicativo (3-4 frases) apresentando o tema principal e a tese central do texto.
2. **Pontos-Chave:** Uma lista com 4 a 6 tópicos (bullet points) detalhados, cada um explicando um argumento, descoberta ou fato essencial do texto.

Garanta que o resumo seja aprofundado, detalhado e muito informativo.`;

  return [
    { role: 'system', content: SYSTEM_PROMPT },
    {
      role: 'user',
      content: `${instruction}

TEXTO DA PÁGINA:
---
${content}
---

RESUMO:`,
    },
  ];
}

// ─── Tradução ────────────────────────────────────────────────────

function buildTranslationPrompt(
  content: string,
  targetLanguage: string,
): ChatMessage[] {
  return [
    { role: 'system', content: SYSTEM_PROMPT },
    {
      role: 'user',
      content: `Traduza o texto abaixo para ${targetLanguage}. 
Mantenha a formatação original (parágrafos, listas, etc.).
Não adicione explicações ou comentários — apenas a tradução.

TEXTO ORIGINAL:
---
${content}
---

TRADUÇÃO:`,
    },
  ];
}

// ─── Dicas de Usabilidade e Segurança ────────────────────────────

function buildTipsPrompt(content: string): ChatMessage[] {
  return [
    { role: 'system', content: SYSTEM_PROMPT },
    {
      role: 'user',
      content: `Analise o texto da página abaixo e gere uma lista de até 5 dicas úteis. Inclua:
- Dicas de segurança (links suspeitos, formulários de dados, etc.)
- Dicas de usabilidade (navegação, acessibilidade)
- Sugestões de leitura adicional (temas relacionados)

Formato: lista numerada, cada item com no máximo 2 frases.

TEXTO DA PÁGINA:
---
${content}
---

DICAS:`,
    },
  ];
}

// ─── Extração de Entidades ───────────────────────────────────────

function buildEntitiesPrompt(content: string): ChatMessage[] {
  return [
    { role: 'system', content: SYSTEM_PROMPT },
    {
      role: 'user',
      content: `Extraia as entidades principais do texto abaixo. Retorne no seguinte formato:

**Títulos:** [títulos e subtítulos encontrados]
**Autores:** [nomes de autores ou organizações mencionados]
**Datas:** [datas mencionadas no texto]
**Links importantes:** [URLs ou referências relevantes mencionadas]
**Palavras-chave:** [5 palavras-chave que resumem o conteúdo]

Se alguma categoria não tiver informação, escreva "Não encontrado".

TEXTO DA PÁGINA:
---
${content}
---

ENTIDADES:`,
    },
  ];
}

// ─── Explicação Simplificada ─────────────────────────────────────

function buildExplainPrompt(content: string): ChatMessage[] {
  return [
    { role: 'system', content: SYSTEM_PROMPT },
    {
      role: 'user',
      content: `Explique o conteúdo abaixo de forma simples, como se estivesse explicando para alguém que não tem conhecimento técnico sobre o assunto.

Regras:
- Use linguagem acessível e evite jargões.
- Se houver termos técnicos, explique-os entre parênteses.
- Use analogias quando apropriado.
- Mantenha a explicação em 3 a 5 parágrafos curtos.

TEXTO DA PÁGINA:
---
${content}
---

EXPLICAÇÃO SIMPLIFICADA:`,
    },
  ];
}

// ─── Análise de Trecho ───────────────────────────────────────────

function buildSnippetPrompt(
  snippet: string,
  action: 'summary' | 'explain',
): ChatMessage[] {
  const instruction = action === 'summary'
    ? `Resuma o trecho selecionado abaixo em 2 a 3 frases.`
    : `Explique o trecho selecionado abaixo de forma simples e acessível. Se houver termos técnicos, defina-os.`;

  return [
    { role: 'system', content: SYSTEM_PROMPT },
    {
      role: 'user',
      content: `${instruction}

TRECHO SELECIONADO:
---
${snippet}
---

RESPOSTA:`,
    },
  ];
}

// ─── Utilidade: Estimar Tokens ───────────────────────────────────

/**
 * Estimativa grosseira do número de tokens em um texto.
 * Regra prática: ~4 caracteres por token em português.
 */
export function estimateTokenCount(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Verifica se o conteúdo cabe no limite de tokens do modelo.
 */
export function contentFitsLimit(
  content: string,
  maxTokens: number,
  reserveForResponse: number = 1024,
): boolean {
  const estimatedTokens = estimateTokenCount(content);
  return estimatedTokens + reserveForResponse <= maxTokens;
}

// ─── Chat Livre ──────────────────────────────────────────────────

function buildChatPrompt(query: string, pageText?: string): ChatMessage[] {
  const contextInstruction = pageText
    ? `CONTEÚDO DA PÁGINA WEB PARA REFERÊNCIA:
---
${pageText}
---
Por favor, utilize as informações da página web acima para responder à pergunta do usuário caso seja relevante. Se a pergunta for sobre outro assunto, responda normalmente.`
    : 'Responda à pergunta do usuário de forma útil e direta.';

  return [
    { role: 'system', content: SYSTEM_PROMPT },
    {
      role: 'user',
      content: `${contextInstruction}

PERGUNTA DO USUÁRIO:
${query}

RESPOSTA:`,
    },
  ];
}
