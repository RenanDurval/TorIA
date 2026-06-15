/**
 * TorAI — Script de empacotamento .xpi.
 * 
 * Empacota o conteúdo de dist/ em um arquivo .xpi
 * que pode ser instalado no Tor Browser.
 * 
 * Uso: node scripts/package.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const DIST_DIR = path.join(__dirname, '..', 'dist');
const OUTPUT_DIR = path.join(__dirname, '..', 'releases');
const MANIFEST_PATH = path.join(DIST_DIR, 'manifest.json');

function packageExtension() {
  console.log('📦 Empacotando extensão TorAI...\n');

  // Verificar se dist/ existe
  if (!fs.existsSync(DIST_DIR)) {
    console.error('❌ Diretório dist/ não encontrado. Execute "npm run build" primeiro.');
    process.exit(1);
  }

  // Verificar manifest
  if (!fs.existsSync(MANIFEST_PATH)) {
    console.error('❌ manifest.json não encontrado em dist/');
    process.exit(1);
  }

  // Ler versão do manifest
  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf-8'));
  const version = manifest.version || '0.0.0';
  const name = 'torai';

  // Criar diretório de releases
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const xpiFilename = `${name}-v${version}.xpi`;
  const xpiPath = path.join(OUTPUT_DIR, xpiFilename);

  // Remover arquivo anterior se existir
  if (fs.existsSync(xpiPath)) {
    fs.unlinkSync(xpiPath);
  }

  const zipFilename = `${name}-v${version}.zip`;
  const zipPath = path.join(OUTPUT_DIR, zipFilename);

  // Criar ZIP (.xpi é apenas um .zip renomeado)
  try {
    // Remover arquivos anteriores se existirem
    if (fs.existsSync(zipPath)) {
      fs.unlinkSync(zipPath);
    }

    // Tentar com PowerShell (Windows)
    const distContents = path.join(DIST_DIR, '*');
    execSync(
      `Compress-Archive -Path "${distContents}" -DestinationPath "${zipPath}" -Force`,
      { shell: 'powershell.exe', stdio: 'pipe' }
    );

    // Renomear o .zip para .xpi
    fs.renameSync(zipPath, xpiPath);

    const stats = fs.statSync(xpiPath);
    const sizeKB = (stats.size / 1024).toFixed(1);

    console.log(`✅ Extensão empacotada com sucesso!`);
    console.log(`   📁 ${xpiPath}`);
    console.log(`   📊 Tamanho: ${sizeKB} KB`);
    console.log(`   🏷️  Versão: ${version}`);
    console.log(`\n📋 Para instalar no Tor Browser:`);
    console.log(`   1. Abra about:debugging`);
    console.log(`   2. Clique em "This Firefox"`);
    console.log(`   3. Clique em "Load Temporary Add-on"`);
    console.log(`   4. Selecione o arquivo manifest.json em dist/`);
    console.log(`   (Ou instale o .xpi diretamente via about:addons)\n`);
  } catch (error) {
    console.error('❌ Erro ao empacotar:', error.message);
    console.log('\n💡 Alternativa manual:');
    console.log(`   1. Navegue até ${DIST_DIR}`);
    console.log('   2. Selecione todos os arquivos');
    console.log('   3. Compacte como .zip');
    console.log(`   4. Renomeie para ${xpiFilename}`);
    process.exit(1);
  }
}

packageExtension();
