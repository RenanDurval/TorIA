# Script para automatizar o envio do TorAI para o GitHub
# Criado pelo assistente Antigravity da Google DeepMind
# UTF-8 Encoding

$OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "===================================================" -ForegroundColor Purple
Write-Host "  🧠 TorAI — Envio Automático para o GitHub" -ForegroundColor Purple
Write-Host "===================================================" -ForegroundColor Purple
Write-Host ""

# Verificar se Git está instalado
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Host "[ERRO] O Git não está instalado no PATH do seu computador." -ForegroundColor Red
    Write-Host "Por favor, instale o Git e tente novamente." -ForegroundColor Red
    Read-Host "Pressione Enter para sair..."
    exit
}

# Inicializar Git se necessário
if (-not (Test-Path .git)) {
    Write-Host "[INFO] Inicializando repositório Git local..." -ForegroundColor Cyan
    git init
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERRO] Falha ao inicializar o Git." -ForegroundColor Red
        Read-Host "Pressione Enter para sair..."
        exit
    }
} else {
    Write-Host "[INFO] Repositório Git local já inicializado." -ForegroundColor Green
}

# Configurar branch main
git branch -M main

# Adicionar arquivos
Write-Host "[INFO] Adicionando arquivos ao commit..." -ForegroundColor Cyan
git add .

# Criar commit
Write-Host "[INFO] Criando commit local..." -ForegroundColor Cyan
git commit -m "feat: modernização visual estilo ChatGPT, seletor de timeout e bloco collapsible de raciocínio"
if ($LASTEXITCODE -ne 0) {
    Write-Host "[INFO] Nenhum arquivo novo para commitar ou commit já existente." -ForegroundColor Yellow
} else {
    Write-Host "[INFO] Commit criado com sucesso!" -ForegroundColor Green
}

# Configurar Remote
$hasOrigin = git remote | Select-String "^origin$"
$defaultUrl = "https://github.com/RenanDurval/TorIA.git"

if ($hasOrigin) {
    Write-Host "[INFO] Remote 'origin' já configurado." -ForegroundColor Green
    git remote -v
    Write-Host ""
    $alterar = Read-Host "Deseja alterar a URL do repositório remoto? (s/N)"
    if ($alterar -eq 's' -or $alterar -eq 'S') {
        $repoUrl = Read-Host "Digite a nova URL do repositório no GitHub"
        if (-not [string]::IsNullOrWhiteSpace($repoUrl)) {
            git remote remove origin
            git remote add origin $repoUrl
        }
    }
} else {
    Write-Host "[Atenção] O repositório remoto (remote origin) não está configurado." -ForegroundColor Yellow
    $repoUrl = Read-Host "Digite a URL do repositório do GitHub [Padrão: $defaultUrl]"
    if ([string]::IsNullOrWhiteSpace($repoUrl)) {
        $repoUrl = $defaultUrl
    }
    git remote add origin $repoUrl
}

# Enviar
Write-Host ""
Write-Host "[INFO] Enviando arquivos para o GitHub (branch: main)..." -ForegroundColor Cyan
Write-Host "Digite suas credenciais do GitHub se solicitado na tela." -ForegroundColor Yellow
Write-Host ""

git push -u origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "===================================================" -ForegroundColor Green
    Write-Host "  🎉 Sucesso! Seu projeto está no GitHub!" -ForegroundColor Green
    Write-Host "  Link: https://github.com/RenanDurval/TorIA" -ForegroundColor Green
    Write-Host "===================================================" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "[AVISO] Falha ao enviar automaticamente." -ForegroundColor Yellow
    Write-Host "Isso pode acontecer caso o repositório precise de autenticação." -ForegroundColor Yellow
    Write-Host "Se necessário, execute no terminal: git push -u origin main" -ForegroundColor Yellow
}

Write-Host ""
Read-Host "Pressione Enter para fechar..."
