# 🧠 TorAI — Recuperação de Contexto de Desenvolvimento

Este arquivo foi criado para restaurar o progresso atual do projeto caso você reinicie o computador ou abra uma nova sessão de chat com o assistente de IA. **Por favor, instrua o próximo assistente a ler este arquivo antes de começar.**

---

## 📌 Status do Projeto

TorAI é uma WebExtension (Manifest V2) para o Tor Browser que permite usar modelos de IA locais (Ollama e LM Studio) com privacidade total (sem tráfego de dados externo).

---

## 🛠️ O que já foi Feito (Fase de Modernização)

1. **🎨 Interface do Chat Estilo ChatGPT (Moderno e Clean):**
   - **Mensagens do Assistente:** Fundo quase transparente (`rgba(255, 255, 255, 0.01)`), sem bordas de bolha pesadas e com uma linha divisória inferior extremamente sutil.
   - **Avatares Pulsantes:** O avatar `🧠` à esquerda agora tem uma animação de pulsação suave em tons roxo e lilás neon (`pulse-avatar`).
   - **Mensagens do Usuário:** Bolhas discretas cinza-escuro translúcidas (`rgba(255, 255, 255, 0.06)`) alinhadas à direita.
   - **Input Box Flutuante:** Fundo `#151528` com cantos bem arredondados (`24px`), foco neon roxo e botão de envio embutido (`▲`) que muda de opacidade/cor caso haja texto. Possui auto-expansão dinâmica de altura enquanto o usuário digita.

2. **💭 Suporte Completo a Modelos de Raciocínio (DeepSeek-R1 / Qwen):**
   - Atualizado o interpretador Markdown (`markdownToHtml`) para detectar as tags `<think>...</think>`.
   - O processo de pensamento do modelo agora é exibido em um **bloco retrátil (Accordion/details)** chamado **"Processo de Raciocínio"** com estilo premium. A resposta final aparece normalmente abaixo dele.

3. **⏱️ Seletor de Timeout de Raciocínio Dinâmico:**
   - Adicionado no cabeçalho do chat: **"Espera: 60s / 120s / 300s / Sem Limite"** (Sem Limite mapeia para 3600 segundos).
   - O seletor lê a configuração inicial de `torai_settings` no storage, salva mudanças automaticamente e as injeta no payload de mensagens em tempo real para evitar erros HTTP 500 do Ollama.
   - O slider geral nas configurações do popup também funciona para outras tarefas rápidas (30s a 600s).

4. **✅ Testes e Compilação:**
   - Todos os 74 testes unitários e de integração (Jest) estão passando com sucesso (ajustados em `prompt-builder.test.ts` para bater com os prompts otimizados).

5. **📦 Preparação para o GitHub:**
   - Criado `.gitignore` para evitar envio de `node_modules/`, `dist/`, `.gemini/` e pacotes compilados.
   - Criado o arquivo `push_to_github.bat` interativo e pré-configurado com o repositório correto (`https://github.com/RenanDurval/TorIA.git`).

---

## 🚀 Próximas Etapas (O que fazer ao ligar o PC)

Quando você ligar o computador e iniciar uma nova sessão, siga estes passos para testar e publicar:

1. **Compilar os arquivos e empacotar a extensão localmente:**
   No terminal da pasta `tor-ai-extension`:
   ```powershell
   npm run build
   npm run package
   ```
2. **Atualizar a extensão no Tor Browser:**
   - Vá em `about:debugging` -> **"Este Firefox"** (ou "This Firefox").
   - Clique em **"Recarregar" (Reload)** no card da extensão **TorAI** para ativar a nova versão de chat e o interpretador de raciocínio.
3. **Enviar o código para o seu repositório do GitHub:**
   - Dê dois cliques no arquivo **`push_to_github.bat`** na raiz do projeto.
   - Aperte **Enter** quando perguntar pela URL (ele usará o padrão `https://github.com/RenanDurval/TorIA.git`).
   - O projeto será commitado e enviado automaticamente para a nuvem.
4. **Testar com modelos de raciocínio:**
   - Abra o chat da extensão, selecione um modelo de raciocínio (ex: DeepSeek-R1 ou Qwen-2.5-Coder) e escolha **"Espera: 300s"** ou **"Sem Limite"** no topo.
   - Envie uma pergunta lógica para verificar a renderização do bloco retrátil de raciocínio `💭`.
