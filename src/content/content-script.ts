/**
 * TorAI — Content Script.
 * 
 * Injetado em cada página para extrair texto, imagens,
 * metadados e seleção do usuário. Opera no contexto da página
 * mas comunica apenas com o background script via mensagens.
 * 
 * SEGURANÇA: Não faz requisições de rede. Apenas lê o DOM
 * e responde mensagens do background/sidebar.
 */

import type { PageContent, ImageInfo, LinkInfo } from '../shared/types';
import type { ExtensionMessage } from '../shared/messages';
import {
  MAX_PAGE_TEXT_LENGTH,
  MAX_IMAGES_EXTRACT,
  MAX_LINKS_EXTRACT,
  MAX_HEADINGS_EXTRACT,
} from '../shared/constants';

// ─── Listener de Mensagens ───────────────────────────────────────

browser.runtime.onMessage.addListener(
  (message: ExtensionMessage, _sender: any, sendResponse: (r: any) => void) => {
    try {
      switch (message.action) {
        case 'EXTRACT_PAGE_TEXT':
          sendResponse(extractPageContent());
          break;

        case 'EXTRACT_SELECTION':
          sendResponse({ selectedText: getSelectedText() });
          break;

        case 'GET_PAGE_INFO':
          sendResponse({
            title: document.title,
            url: window.location.href,
          });
          break;

        default:
          sendResponse({ error: `Ação desconhecida: ${message.action}` });
      }
    } catch (error: any) {
      sendResponse({ error: error.message || 'Erro na extração de conteúdo' });
    }

    return false; // Resposta síncrona
  }
);

// ─── Extração de Conteúdo da Página ──────────────────────────────

/**
 * Extrai todo o conteúdo relevante da página atual.
 */
function extractPageContent(): PageContent {
  return {
    title: document.title || '',
    url: window.location.href,
    text: extractVisibleText(),
    images: extractImageInfo(),
    metas: extractMetaTags(),
    headings: extractHeadings(),
    links: extractImportantLinks(),
  };
}

// ─── Texto Visível ───────────────────────────────────────────────

/**
 * Extrai o texto visível da página, excluindo scripts,
 * estilos, e elementos ocultos.
 */
function extractVisibleText(): string {
  // Clonar body para não modificar a página
  const bodyClone = document.body.cloneNode(true) as HTMLElement;

  // Remover elementos não-textuais
  const tagsToRemove = ['script', 'style', 'noscript', 'svg', 'canvas', 'video', 'audio', 'iframe'];
  for (const tag of tagsToRemove) {
    const elements = bodyClone.querySelectorAll(tag);
    elements.forEach(el => el.remove());
  }

  // Remover elementos ocultos
  const allElements = bodyClone.querySelectorAll('*');
  allElements.forEach(el => {
    const htmlEl = el as HTMLElement;
    if (htmlEl.getAttribute('aria-hidden') === 'true' ||
        htmlEl.getAttribute('hidden') !== null ||
        htmlEl.style.display === 'none' ||
        htmlEl.style.visibility === 'hidden') {
      htmlEl.remove();
    }
  });

  // Extrair texto
  let text = bodyClone.innerText || bodyClone.textContent || '';

  // Limpar whitespace excessivo
  text = text
    .replace(/\t+/g, ' ')
    .replace(/[ ]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  // Truncar se muito longo
  if (text.length > MAX_PAGE_TEXT_LENGTH) {
    text = text.substring(0, MAX_PAGE_TEXT_LENGTH);
    const lastSentence = text.lastIndexOf('.');
    if (lastSentence > MAX_PAGE_TEXT_LENGTH * 0.8) {
      text = text.substring(0, lastSentence + 1);
    }
    text += '\n[... conteúdo truncado ...]';
  }

  return text;
}

// ─── Imagens ─────────────────────────────────────────────────────

/**
 * Extrai informações de imagens com texto alternativo.
 */
function extractImageInfo(): ImageInfo[] {
  const images = document.querySelectorAll('img[alt]');
  const result: ImageInfo[] = [];

  for (let i = 0; i < Math.min(images.length, MAX_IMAGES_EXTRACT); i++) {
    const img = images[i] as HTMLImageElement;
    const alt = (img.alt || '').trim();
    if (alt && alt.length > 0) {
      result.push({
        src: img.src || '',
        alt,
      });
    }
  }

  return result;
}

// ─── Meta Tags ───────────────────────────────────────────────────

/**
 * Extrai meta tags relevantes (description, author, keywords, etc.).
 */
function extractMetaTags(): Record<string, string> {
  const metas: Record<string, string> = {};

  // Meta tags padrão
  const metaNames = ['description', 'author', 'keywords', 'robots'];
  for (const name of metaNames) {
    const el = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement;
    if (el?.content) {
      metas[name] = el.content.trim();
    }
  }

  // Open Graph tags
  const ogTags = ['og:title', 'og:description', 'og:type', 'og:site_name'];
  for (const property of ogTags) {
    const el = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement;
    if (el?.content) {
      metas[property] = el.content.trim();
    }
  }

  // Article-specific tags
  const articleTags = ['article:author', 'article:published_time', 'article:modified_time'];
  for (const property of articleTags) {
    const el = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement;
    if (el?.content) {
      metas[property] = el.content.trim();
    }
  }

  return metas;
}

// ─── Headings ────────────────────────────────────────────────────

/**
 * Extrai todos os headings (h1-h6) da página.
 */
function extractHeadings(): string[] {
  const headings: string[] = [];
  const elements = document.querySelectorAll('h1, h2, h3, h4, h5, h6');

  for (let i = 0; i < Math.min(elements.length, MAX_HEADINGS_EXTRACT); i++) {
    const text = (elements[i].textContent || '').trim();
    if (text) {
      const level = elements[i].tagName.toLowerCase();
      headings.push(`[${level}] ${text}`);
    }
  }

  return headings;
}

// ─── Links ───────────────────────────────────────────────────────

/**
 * Extrai links importantes da página (exclui links de navegação internos triviais).
 */
function extractImportantLinks(): LinkInfo[] {
  const links: LinkInfo[] = [];
  const elements = document.querySelectorAll('a[href]');
  const seen = new Set<string>();

  for (let i = 0; i < elements.length && links.length < MAX_LINKS_EXTRACT; i++) {
    const anchor = elements[i] as HTMLAnchorElement;
    const href = anchor.href;
    const text = (anchor.textContent || '').trim();

    // Filtrar links triviais
    if (!href || href === '#' || href.startsWith('javascript:')) continue;
    if (!text || text.length < 2) continue;
    if (seen.has(href)) continue;

    seen.add(href);
    links.push({ href, text });
  }

  return links;
}

// ─── Seleção de Texto ────────────────────────────────────────────

/**
 * Retorna o texto atualmente selecionado pelo usuário na página.
 */
function getSelectedText(): string {
  const selection = window.getSelection();
  return selection ? selection.toString().trim() : '';
}

// ─── Listener de Seleção ─────────────────────────────────────────

/**
 * Monitora mudanças na seleção de texto e notifica o background/sidebar.
 */
let selectionDebounceTimer: ReturnType<typeof setTimeout> | null = null;

document.addEventListener('selectionchange', () => {
  if (selectionDebounceTimer) {
    clearTimeout(selectionDebounceTimer);
  }

  selectionDebounceTimer = setTimeout(() => {
    const selectedText = getSelectedText();
    if (selectedText.length > 0) {
      browser.runtime.sendMessage({
        action: 'SELECTION_CHANGED',
        data: { selectedText },
      }).catch(() => {
        // Falha silenciosa — sidebar pode não estar aberto
      });
    }
  }, 300); // Debounce 300ms
});

// ─── Log de Inicialização ────────────────────────────────────────

console.log('[TorAI] Content script carregado');
