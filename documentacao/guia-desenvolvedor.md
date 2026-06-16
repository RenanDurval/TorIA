# TorAI — Guia do Desenvolvedor

**Versão:** 1.0.0  
**Última Atualização:** 2025-06-16

---

## Pré-requisitos

- **Node.js** 18+ (recomendado: 20 LTS)
- **npm** 9+
- **Tor Browser** ou Firefox 102+ para testes
- **Ollama** ou **LMStudio** instalado localmente

---

## Setup Inicial

```bash
# 1. Clonar o projeto
cd "Extencao Tor/tor-ai-extension"

# 2. Instalar dependências
npm install

# 3. Compilar o projeto
npm run build

# 4. (Opcional) Build com watch mode para desenvolvimento
npm run build:watch
```

---

## Comandos Disponíveis

| Comando | Descrição |
|---|---|
| `npm run build` | Compila TypeScript e copia assets para `dist/` |
| `npm run build:watch` | Build com auto-reload ao salvar |
| `npm test` | Executa testes unitários e de integração |
| `npm run test:coverage` | Testes com relatório de cobertura |
| `npm run package` | Gera arquivo `.xpi` para distribuição |

---

## Como Testar no Tor Browser

### Carregar a extensão em modo de desenvolvimento:

1. Execute `npm run build` para gerar a pasta `dist/`
2. Abra o Tor Browser
3. Navegue para `about:debugging#/runtime/this-firefox`
4. Clique em **"Carregar extensão temporária..."**
5. Selecione o arquivo `dist/manifest.json`

### Verificar que está funcionando:

1. O ícone 🧠 aparecerá na toolbar
2. Clique no ícone para abrir o popup
3. Certifique-se que Ollama ou LMStudio esteja rodando
4. Clique "Conectar"
5. Use `Ctrl+Shift+A` para abrir o sidebar

---

## Estrutura dos Módulos

### background.ts — Orquestrador

Responsável por:
- Gerenciar o ciclo de vida da conexão com o provedor de IA
- Interceptar e modificar headers HTTP (CORS bypass)
- Rotear mensagens entre componentes
- Processar requisições de IA (chamar prompt-builder + ai-client)

**Funções principais:**
- `handleMessage()` — dispatcher principal de mensagens
- `processAIRequest()` — pipeline completo: sanitizar → prompt → fetch → validar
- `forwardToContentScript()` — encaminha mensagens ao content script

### ai-client.ts — Cliente HTTP

Responsável por:
- Manter estado da conexão (conectado/desconectado/erro)
- Auto-detecção de provedores (`autoDetect()`)
- Listar modelos disponíveis
- Enviar requisições ao endpoint `/v1/chat/completions`
- Retry com backoff exponencial
- Controle de timeout e abort

**Funções principais:**
- `connect()` — conecta ao provedor e lista modelos
- `sendChatCompletion()` — envia requisição com retry
- `fetchWithRetry()` — fetch com 3 tentativas e backoff
- `cancelRequest()` — aborta requisição em andamento

### prompt-builder.ts — Construtor de Prompts

Converte o tipo de tarefa em um array de mensagens `{role, content}` compatível com a API OpenAI.

**Tipos de tarefa suportados:**

| TaskType | Prompt |
|---|---|
| `summary_short` | Resumo em 3-4 frases |
| `summary_detailed` | Resumo estruturado com pontos-chave |
| `translate` | Tradução para idioma alvo |
| `tips` | Dicas de segurança e usabilidade |
| `entities` | Extração de entidades nomeadas |
| `explain` | Explicação simplificada |
| `snippet_summary` | Resumo de trecho selecionado |
| `snippet_explain` | Explicação de trecho selecionado |
| `snippet_translate` | Tradução de trecho selecionado |
| `chat` | Chat livre com contexto opcional |

### security.ts — Módulo de Segurança

Funções de validação e sanitização:

- `validateUrl()` — verifica host, protocolo e porta
- `buildSafeUrl()` — concatena base URL + path com validação
- `sanitizeText()` — limpa texto de caracteres perigosos
- `sanitizeSnippet()` — versão para trechos (limite menor)
- `sanitizeModelParams()` — limita temperature e maxTokens
- `validateModelName()` — regex para nomes de modelo
- `validateAIResponse()` — detecta padrões suspeitos na resposta

---

## Fluxo de Build

O build utiliza **esbuild** para compilação rápida de TypeScript:

```
src/*.ts  →  esbuild (bundle + minify)  →  dist/*.js
src/*.html  →  copy  →  dist/*.html
src/*.css   →  copy  →  dist/*.css
src/icons/  →  copy  →  dist/icons/
```

Configurações do esbuild:
- **Format:** IIFE (compatível com contexto de extensão)
- **Target:** Firefox 102 (ES2019+)
- **Bundle:** true (resolve imports)
- **Minify:** true em produção, false em watch

---

## Testes

### Executar todos os testes:

```bash
npm test
```

### Estrutura de testes:

```
tests/
├── setup.ts                    # Mocks globais (browser.*, fetch, AbortController)
├── unit/
│   ├── ai-client.test.ts       # Testes do cliente HTTP
│   ├── content-script.test.ts  # Testes de extração DOM
│   ├── prompt-builder.test.ts  # Testes de construção de prompts
│   └── security.test.ts        # Testes de validação e sanitização
└── integration/
    ├── background-flow.test.ts # Testes do fluxo completo
    └── mock-server.ts          # Servidor mock para testes
```

### Mocks disponíveis (setup.ts):

- `browser.runtime.sendMessage` — mensagens entre componentes
- `browser.tabs.query` — consulta de abas
- `browser.storage.local.*` — armazenamento local
- `browser.sidebarAction.*` — controle do sidebar
- `fetch` — requisições HTTP
- `AbortController` — controle de cancelamento

---

## Dicas de Desenvolvimento

### 1. Provedores de IA Locais

**Ollama** (padrão, porta 11434):
```bash
# Instalar
curl -fsSL https://ollama.ai/install.sh | sh

# Baixar modelo
ollama pull llama3.2

# Iniciar servidor (automático na instalação)
ollama serve
```

**LMStudio** (porta 1234):
1. Baixe em https://lmstudio.ai
2. Abra e baixe um modelo (ex: Llama 3.2)
3. Inicie o servidor local (aba "Local Server")

### 2. Debug da Extensão

- Use `about:debugging` para ver logs do background script
- Use DevTools do popup/sidebar para debug da interface
- Filtro útil no console: `[TorAI]`

### 3. Convenções de Código

- Prefixo de log: `[TorAI Background]`, `[TorAI Popup]`, `[TorAI Sidebar]`
- Mensagens em português brasileiro para UI
- Comentários de código em português
- TypeScript strict mode ativado
- Sem dependências externas em runtime (zero dependencies na extensão final)
