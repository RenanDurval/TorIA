@echo off
title TorAI - Envio para o GitHub
echo ===================================================
echo   🧠 TorAI - Envio para o GitHub
echo ===================================================
echo.

:: Verificar se Git está instalado
git --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERRO] O Git nao esta instalado ou nao foi encontrado no seu sistema.
    echo Por favor, baixe e instale o Git de: https://git-scm.com
    echo Depois de instalar, feche esta janela e abra novamente.
    goto end
)

:: Garantir que estamos na pasta correta
cd /d "%~dp0"

echo [INFO] Verificando repositorio Git local...
if not exist .git (
    echo [INFO] Inicializando novo repositorio Git...
    git init
) else (
    echo [INFO] Repositorio Git ja existe localmente.
)

echo.
echo [INFO] Adicionando arquivos...
git add .

echo.
echo [INFO] Criando commit...
git commit -m "feat: modernizacao visual estilo ChatGPT, seletor de timeout e bloco collapsible de raciocinio"

echo.
echo [INFO] Configurando link do GitHub (remote)...
:: Tenta remover o remote se já existir para evitar conflito, depois adiciona o correto
git remote remove origin >nul 2>&1
git remote add origin https://github.com/RenanDurval/TorIA.git

echo.
echo [INFO] Enviando atualizacoes para o GitHub...
echo (Caso seja a primeira vez, uma janela de login do GitHub pode abrir)
echo.
git push -u origin main

if %errorlevel% EQU 0 (
    echo.
    echo ===================================================
    echo   🎉 SUcesso! Seu projeto foi atualizado no GitHub!
    echo   Link: https://github.com/RenanDurval/TorIA
    echo ===================================================
) else (
    echo.
    echo [AVISO] Falha ao enviar para o GitHub.
    echo Verifique sua conexao e se voce tem permissao de escrita no repositorio.
)

:end
echo.
echo Pressione qualquer tecla para fechar esta janela...
pause >nul
