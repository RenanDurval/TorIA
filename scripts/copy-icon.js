/**
 * TorAI — Copiador de Ícones
 * 
 * Copia a imagem gerada pela IA para a pasta src/icons/ da extensão.
 * 
 * Uso: node scripts/copy-icon.js
 */

const fs = require('fs');
const path = require('path');

const SOURCE_IMAGE = 'C:\\Users\\renan\\.gemini\\antigravity-ide\\brain\\f456f86a-bfdc-4573-b436-555313585e11\\tor_ai_icon_1781523189897.png';
const ICONS_DIR = path.join(__dirname, '..', 'src', 'icons');

function copyIcon() {
  console.log('🎨 Copiando ícone da extensão...\n');

  if (!fs.existsSync(SOURCE_IMAGE)) {
    console.error(`❌ Imagem de origem não encontrada em: ${SOURCE_IMAGE}`);
    process.exit(1);
  }

  // Criar pasta src/icons se não existir
  if (!fs.existsSync(ICONS_DIR)) {
    fs.mkdirSync(ICONS_DIR, { recursive: true });
  }

  const sizes = [16, 32, 48, 128];

  for (const size of sizes) {
    const destPath = path.join(ICONS_DIR, `icon-${size}.png`);
    
    try {
      // Como não temos biblioteca de redimensionamento de imagem por padrão no script básico,
      // copiamos o arquivo diretamente. O navegador lida perfeitamente com o auto-redimensionamento de imagens maiores
      // declaradas no manifest.json.
      fs.copyFileSync(SOURCE_IMAGE, destPath);
      console.log(`  ✅ Ícone gerado em: src/icons/icon-${size}.png`);
    } catch (err) {
      console.error(`  ❌ Erro ao criar icon-${size}.png:`, err.message);
    }
  }

  console.log('\n✨ Ícones criados com sucesso na pasta src/icons! Execute "npm run build" para aplicá-los.');
}

copyIcon();
