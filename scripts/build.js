/**
 * TorAI — Build script usando esbuild.
 * 
 * Compila TypeScript para JavaScript, copia assets estáticos
 * (HTML, CSS, manifest, icons) para dist/.
 * 
 * Uso:
 *   node scripts/build.js          # Build de produção
 *   node scripts/build.js --watch  # Build com watch mode
 */

const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(__dirname, '..', 'src');
const DIST_DIR = path.join(__dirname, '..', 'dist');
const isWatch = process.argv.includes('--watch');

// ─── Configuração dos Entry Points ──────────────────────────────

const entryPoints = [
  { in: path.join(SRC_DIR, 'background', 'background.ts'), out: 'background' },
  { in: path.join(SRC_DIR, 'content', 'content-script.ts'), out: 'content-script' },
  { in: path.join(SRC_DIR, 'popup', 'popup.ts'), out: 'popup/popup' },
  { in: path.join(SRC_DIR, 'sidebar', 'sidebar.ts'), out: 'sidebar/sidebar' },
];

// ─── Arquivos estáticos para copiar ──────────────────────────────

const staticFiles = [
  // Manifest
  { from: path.join(SRC_DIR, 'manifest.json'), to: 'manifest.json' },

  // Popup
  { from: path.join(SRC_DIR, 'popup', 'popup.html'), to: 'popup/popup.html' },
  { from: path.join(SRC_DIR, 'popup', 'popup.css'), to: 'popup/popup.css' },

  // Sidebar
  { from: path.join(SRC_DIR, 'sidebar', 'sidebar.html'), to: 'sidebar/sidebar.html' },
  { from: path.join(SRC_DIR, 'sidebar', 'sidebar.css'), to: 'sidebar/sidebar.css' },
];

// ─── Funções Auxiliares ──────────────────────────────────────────

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function copyFile(from, toRelative) {
  const toAbsolute = path.join(DIST_DIR, toRelative);
  ensureDir(path.dirname(toAbsolute));
  fs.copyFileSync(from, toAbsolute);
  console.log(`  📄 ${toRelative}`);
}

function copyDir(from, toRelative) {
  const toAbsolute = path.join(DIST_DIR, toRelative);
  ensureDir(toAbsolute);

  if (!fs.existsSync(from)) {
    console.warn(`  ⚠️  Diretório não encontrado: ${from}`);
    return;
  }

  const entries = fs.readdirSync(from);
  for (const entry of entries) {
    const fromPath = path.join(from, entry);
    const toPath = path.join(toRelative, entry);
    const stat = fs.statSync(fromPath);

    if (stat.isFile()) {
      copyFile(fromPath, toPath);
    } else if (stat.isDirectory()) {
      copyDir(fromPath, toPath);
    }
  }
}

function copyStaticFiles() {
  console.log('\n📦 Copiando arquivos estáticos...');

  for (const file of staticFiles) {
    if (fs.existsSync(file.from)) {
      copyFile(file.from, file.to);
    } else {
      console.warn(`  ⚠️  Arquivo não encontrado: ${file.from}`);
    }
  }

  // Copiar ícones
  const iconsDir = path.join(SRC_DIR, 'icons');
  if (fs.existsSync(iconsDir)) {
    copyDir(iconsDir, 'icons');
  } else {
    console.warn('  ⚠️  Diretório de ícones não encontrado, gerando placeholders...');
    generatePlaceholderIcons();
  }
}

/** Gera ícones placeholder SVG se não existirem */
function generatePlaceholderIcons() {
  const sizes = [16, 32, 48, 128];
  const iconsOut = path.join(DIST_DIR, 'icons');
  ensureDir(iconsOut);

  for (const size of sizes) {
    // Criar um PNG simples com canvas (placeholder roxo)
    // Para produção, substitua por ícones reais
    const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#7B2FBE;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#9B59D0;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${Math.round(size * 0.2)}" fill="url(#grad)"/>
  <text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" 
        fill="white" font-family="sans-serif" font-weight="bold" 
        font-size="${Math.round(size * 0.5)}">AI</text>
</svg>`;

    // Salvar como SVG (navegadores suportam SVG como ícone)
    const svgPath = path.join(iconsOut, `icon-${size}.svg`);
    fs.writeFileSync(svgPath, svgContent);

    // Copiar SVG como PNG placeholder (mesma extensão esperada pelo manifest)
    // NOTA: Para produção, converta SVG→PNG com sharp ou similar
    const pngPath = path.join(iconsOut, `icon-${size}.png`);
    fs.writeFileSync(pngPath, svgContent);
    console.log(`  🎨 icons/icon-${size}.png (placeholder SVG)`);
  }
}

// ─── Build ───────────────────────────────────────────────────────

async function build() {
  console.log('🔨 TorAI Build\n');

  // Limpar dist/
  if (fs.existsSync(DIST_DIR)) {
    fs.rmSync(DIST_DIR, { recursive: true });
  }
  ensureDir(DIST_DIR);

  // Compilar TypeScript com esbuild
  console.log('⚡ Compilando TypeScript...');

  const buildOptions = {
    entryPoints: entryPoints.map(ep => ({
      in: ep.in,
      out: ep.out,
    })),
    bundle: true,
    outdir: DIST_DIR,
    format: 'iife',
    target: ['firefox102'],
    minify: !isWatch,
    sourcemap: isWatch ? 'inline' : false,
    logLevel: 'info',
    define: {
      'process.env.NODE_ENV': isWatch ? '"development"' : '"production"',
    },
  };

  if (isWatch) {
    const ctx = await esbuild.context(buildOptions);
    await ctx.watch();
    console.log('\n👀 Watch mode ativo. Aguardando mudanças...\n');

    // Copiar estáticos na primeira build
    copyStaticFiles();
  } else {
    await esbuild.build(buildOptions);
    copyStaticFiles();
    console.log('\n✅ Build completo! Saída em dist/\n');
  }
}

build().catch((error) => {
  console.error('❌ Erro no build:', error);
  process.exit(1);
});
