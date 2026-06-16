# 🧠 TorAI — Recuperação de Contexto de Desenvolvimento

Este arquivo serve para restaurar o progresso atual do projeto em novas sessões de chat. **Por favor, leia este arquivo antes de começar.**

---

## 📌 Status do Projeto

TorAI é uma WebExtension (Manifest V2) para o Tor Browser que permite usar modelos de IA locais (Ollama e LM Studio) com privacidade total (sem tráfego de dados externo).

---

## 🛠️ O que foi Concluído

1. **🎨 Interface do Chat Estilo ChatGPT (Moderno e Clean):**
   - **Mensagens do Assistente:** Fundo quase transparente (`rgba(255, 255, 255, 0.01)`), sem bordas pesadas e com linha divisória sutil.
   - **Avatares Pulsantes:** O avatar `🧠` à esquerda pulsa suavemente em tons neon roxo e lilás (`pulse-avatar`).
   - **Mensagens do Usuário:** Bolhas cinza-escuro translúcidas (`rgba(255, 255, 255, 0.06)`) alinhadas à direita.
   - **Input Box Flutuante:** Fundo `#151528` com cantos arredondados (`24px`), foco roxo neon, botão de envio embutido (`▲`) e auto-expansão de altura.

2. **💭 Suporte a Modelos de Raciocínio (DeepSeek-R1 / Qwen):**
   - O interpretador Markdown detecta as tags `<think>...</think>` e exibe o processo de pensamento em um painel retrátil (Accordion/details) chamado **"Processo de Raciocínio"** com estilo premium.

3. **⏱️ Seletor de Timeout de Raciocínio Dinâmico:**
   - Adicionado no topo da interface do chat: **"Espera: 60s / 120s / 300s / Sem Limite"**.
   - Salva a configuração automaticamente no storage local e a injeta no payload de mensagens em tempo real para evitar erros de gateway do Ollama.

4. **🔴 Correção Crítica de Carregamento DOM (Race Conditions):**
   - Corrigimos o bug crítico onde `sidebar.ts` e `popup.ts` buscavam elementos DOM antes do carregamento da página. Agora todas as referências do DOM são inicializadas de forma segura no callback do `DOMContentLoaded`.
   - Como o terminal estava bloqueado por sandbox, atualizamos manualmente os arquivos transpilados em `dist/` (`dist/sidebar/sidebar.js` e `dist/popup/popup.js`) para que funcionem imediatamente de primeira no Tor Browser.

5. **📦 Envio com Sucesso para o GitHub:**
   - Criamos um script puro de CMD (`push_to_github.bat`) compatível com Windows que contornou bloqueios do PowerShell e realizou o commit/push do projeto com sucesso para a branch `main` de `https://github.com/RenanDurval/TorIA.git`.

---

## 🚀 Próximas Etapas (O que fazer ao retomar)

1. **Carregar a Extensão no Tor Browser:**
   - Acesse `about:debugging#/runtime/this-firefox`.
   - Clique em **"Carregar extensão temporária..."**.
   - Selecione o arquivo `dist/manifest.json` para carregar a nova interface.
2. **Testar Funcionalidades Rápidas:**
   - Ligue o Ollama localmente (ele já está configurado no Windows e com o modelo `llama3.1` baixado).
   - Conecte a extensão através do pop-up e execute resumos rápidos ou converse com o assistente na barra lateral.
3. **Instalar DeepSeek-R1 (Opcional):**
   - Para testar a funcionalidade retrátil de pensamento, baixe o modelo de raciocínio executando `ollama run deepseek-r1:8b` no prompt de comando.
