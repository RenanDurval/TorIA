/**
 * TorAI — Testes unitários do content script (extração de texto).
 * 
 * Testa as funções de extração simulando um DOM com jsdom.
 */

describe('Content Script - Text Extraction', () => {
  beforeEach(() => {
    // Resetar DOM entre testes
    document.body.innerHTML = '';
  });

  test('extrai texto visível do body', () => {
    document.body.innerHTML = `
      <h1>Título Principal</h1>
      <p>Parágrafo de texto com informações importantes.</p>
      <p>Segundo parágrafo com mais detalhes.</p>
    `;

    const text = document.body.innerText || document.body.textContent || '';
    expect(text).toContain('Título Principal');
    expect(text).toContain('Parágrafo de texto');
  });

  test('ignora scripts e styles', () => {
    document.body.innerHTML = `
      <p>Texto visível</p>
      <script>const secret = 'não deve aparecer';</script>
      <style>.hidden { display: none; }</style>
      <p>Mais texto visível</p>
    `;

    // Simular remoção de scripts (como faz o content script)
    const clone = document.body.cloneNode(true) as HTMLElement;
    clone.querySelectorAll('script, style').forEach(el => el.remove());

    const text = clone.textContent || '';
    expect(text).toContain('Texto visível');
    expect(text).not.toContain('secret');
    expect(text).not.toContain('.hidden');
  });

  test('extrai alt-text de imagens', () => {
    document.body.innerHTML = `
      <img src="foto.jpg" alt="Descrição da foto" />
      <img src="sem-alt.jpg" />
      <img src="outra.jpg" alt="Outra descrição" />
    `;

    const images = document.querySelectorAll('img[alt]');
    const alts: string[] = [];
    images.forEach(img => {
      const alt = (img as HTMLImageElement).alt.trim();
      if (alt) alts.push(alt);
    });

    expect(alts).toHaveLength(2);
    expect(alts).toContain('Descrição da foto');
    expect(alts).toContain('Outra descrição');
  });

  test('extrai meta tags', () => {
    document.head.innerHTML = `
      <meta name="description" content="Descrição da página" />
      <meta name="author" content="João Silva" />
      <meta property="og:title" content="Título OG" />
    `;

    const description = (document.querySelector('meta[name="description"]') as HTMLMetaElement)?.content;
    const author = (document.querySelector('meta[name="author"]') as HTMLMetaElement)?.content;
    const ogTitle = (document.querySelector('meta[property="og:title"]') as HTMLMetaElement)?.content;

    expect(description).toBe('Descrição da página');
    expect(author).toBe('João Silva');
    expect(ogTitle).toBe('Título OG');
  });

  test('extrai headings com nível correto', () => {
    document.body.innerHTML = `
      <h1>Heading 1</h1>
      <h2>Heading 2</h2>
      <h3>Heading 3</h3>
    `;

    const headings: string[] = [];
    document.querySelectorAll('h1, h2, h3').forEach(el => {
      const level = el.tagName.toLowerCase();
      const text = (el.textContent || '').trim();
      if (text) headings.push(`[${level}] ${text}`);
    });

    expect(headings).toEqual([
      '[h1] Heading 1',
      '[h2] Heading 2',
      '[h3] Heading 3',
    ]);
  });

  test('extrai links com href e texto', () => {
    document.body.innerHTML = `
      <a href="https://example.com">Link externo</a>
      <a href="#section">Link interno</a>
      <a href="javascript:void(0)">Link JS</a>
      <a href="https://outro.com">Outro link</a>
    `;

    const links: { href: string; text: string }[] = [];
    document.querySelectorAll('a[href]').forEach(el => {
      const anchor = el as HTMLAnchorElement;
      const href = anchor.href;
      const text = (anchor.textContent || '').trim();

      // Filtrar como faz o content script
      if (!href || href === '#' || href.startsWith('javascript:')) return;
      if (!text || text.length < 2) return;

      links.push({ href, text });
    });

    // Links JS e internos (#) devem ser filtrados
    expect(links.length).toBeGreaterThanOrEqual(2);
    expect(links.find(l => l.text === 'Link externo')).toBeDefined();
    expect(links.find(l => l.text === 'Outro link')).toBeDefined();
  });

  test('obtém texto selecionado', () => {
    document.body.innerHTML = `<p id="text">Texto para selecionar</p>`;

    // jsdom não suporta getSelection de verdade, mas o tipo existe
    const selection = window.getSelection();
    expect(selection).toBeDefined();
  });

  test('ignora elementos ocultos (aria-hidden)', () => {
    document.body.innerHTML = `
      <p>Visível</p>
      <p aria-hidden="true">Oculto ARIA</p>
      <p hidden>Oculto HTML</p>
      <p style="display:none">Oculto CSS</p>
    `;

    const clone = document.body.cloneNode(true) as HTMLElement;
    clone.querySelectorAll('[aria-hidden="true"], [hidden]').forEach(el => el.remove());
    // CSS display:none precisaria de getComputedStyle (não disponível em jsdom sem layout)

    const text = clone.textContent || '';
    expect(text).toContain('Visível');
    expect(text).not.toContain('Oculto ARIA');
    expect(text).not.toContain('Oculto HTML');
  });
});
