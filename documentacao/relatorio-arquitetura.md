# TorAI — Arquitetura Técnica

**Versão:** 1.0.0  
**Última Atualização:** 2025-06-16

---

## Visão Geral

TorAI é uma extensão para Tor Browser (Firefox/Gecko) que integra modelos de IA locais (Ollama, LMStudio) diretamente no navegador, sem enviar nenhum dado para a internet. Toda a comunicação ocorre exclusivamente via `localhost`.

```
┌─────────────────────────────────────────────────────────────────┐
│                      TOR BROWSER                                │
│                                                                 │
│  ┌──────────┐    ┌───────────┐    ┌──────────────────────────┐ │
│  │  Popup    │───▶│ Background│◀──▶│ Ollama / LMStudio       │ │
│  │ (popup/) │    │ (bg.js)   │    │ (http://127.0.0.1:port)  │ │
│  └──────────┘    └─────┬─────┘    └──────────────────────────┘ │
│                        │                                        │
│  ┌──────────┐    ┌─────▼─────┐                                 │
│  │ Sidebar  │───▶│ Content   │                                 │
│  │(sidebar/)│    │ Script    │                                 │
│  └──────────┘    └───────────┘                                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Componentes

### 1. Background Script (`src/background/`)

O background script é o **orquestrador central** da extensão. Ele:

- **Gerencia conexões** com Ollama/LMStudio via `ai-client.ts`
- **Intercepta headers HTTP** para remover `Origin` e evitar erros CORS
- **Roteia mensagens** entre popup, sidebar e content script
- **Processa requisições de IA** (resumo, tradução, chat, etc.)
- **Armazena configurações** no `browser.storage.local`

| Módulo | Responsabilidade |
|---|---|
| `background.ts` | Orquestrador: listeners, roteamento, processamento |
| `ai-client.ts` | Cliente HTTP: conexão, retry, timeout, abort |
| `prompt-builder.ts` | Construtor de prompts: sistema + contexto + tarefa |
| `security.ts` | Validação: URLs, hosts, sanitização de texto |

**Ponto importante:** O background script deve ser **persistente** (`"persistent": true` no manifest) porque utiliza `webRequestBlocking` para interceptar headers HTTP em tempo real. Background scripts não-persistentes (event pages) perdem os listeners de `webRequest` quando são descarregados pelo browser.

### 2. Popup (`src/popup/`)

A interface de configuração rápida, acessível pelo ícone na toolbar:

- Seleção de provedor (Ollama / LMStudio)
- Conexão/desconexão
- Seleção de modelo
- Ajuste de parâmetros (temperatura, tokens, timeout)
- Ações rápidas (resumo, tradução, dicas)
- Instruções de instalação para iniciantes

### 3. Sidebar (`src/sidebar/`)

O painel lateral principal com **6 abas**:

| Aba | Tipo de Tarefa | Descrição |
|---|---|---|
| 📝 Resumo | `summary_short`, `summary_detailed`, `explain` | Resume a página atual |
| 🌐 Tradução | `translate` | Traduz a página para o idioma selecionado |
| 💡 Dicas | `tips` | Gera dicas de segurança e usabilidade |
| 🏷️ Entidades | `entities` | Extrai títulos, autores, datas, links |
| ✂️ Trecho | `snippet_*` | Analisa texto selecionado na página |
| 💬 Chat | `chat` | Chat livre com contexto da página |

### 4. Content Script (`src/content/`)

Script injetado em todas as páginas que:

- Extrai texto limpo da página (ignorando scripts, styles, etc.)
- Detecta texto selecionado pelo usuário
- Comunica com o background via `browser.runtime.onMessage`

### 5. Shared (`src/shared/`)

Módulos compartilhados entre todos os componentes:

| Módulo | Conteúdo |
|---|---|
| `types.ts` | Interfaces TypeScript (AIRequest, AIResponse, etc.) |
| `constants.ts` | URLs padrão, limites, valores default |
| `messages.ts` | Definição de tipos de mensagem |
| `i18n.ts` | Strings de internacionalização |

---

## Fluxo de Dados

### Fluxo: Resumo de Página

```
1. Usuário clica "Gerar Resumo" no sidebar
2. sidebar.ts → envia EXTRACT_PAGE_TEXT ao background
3. background.ts → encaminha ao content-script da aba ativa
4. content-script.ts → extrai texto do DOM → retorna ao background
5. background.ts → retorna texto ao sidebar
6. sidebar.ts → envia PROCESS_AI_REQUEST (type: summary_short)
7. background.ts → sanitiza texto (security.ts)
8. background.ts → constrói prompt (prompt-builder.ts)
9. background.ts → envia ao Ollama/LMStudio (ai-client.ts)
10. ai-client.ts → POST /v1/chat/completions → resposta JSON
11. background.ts → valida resposta (security.ts)
12. background.ts → retorna AIResponse ao sidebar
13. sidebar.ts → renderiza resultado com markdownToHtml()
```

### Fluxo: Chat com Contexto

```
1. Usuário digita pergunta no chat
2. sidebar.ts → extrai texto da página (se toggle ativo)
3. sidebar.ts → envia PROCESS_AI_REQUEST (type: chat, pageText: ...)
4. background.ts → constrói prompt com contexto (prompt-builder.ts)
5. background.ts → envia ao modelo local
6. Resposta → renderizada com suporte a <think> tags (DeepSeek)
```

---

## Protocolo de Comunicação

Todas as mensagens seguem o formato:

```typescript
interface ExtensionMessage {
  action: string;         // Ex: 'PROCESS_AI_REQUEST', 'GET_STATUS'
  data?: any;             // Dados específicos da ação
}
```

### Ações suportadas pelo Background:

| Ação | Origem | Descrição |
|---|---|---|
| `GET_STATUS` | popup, sidebar | Retorna estado da conexão |
| `CONNECT_PROVIDER` | popup | Conecta ao provedor |
| `DISCONNECT_PROVIDER` | popup | Desconecta |
| `GET_SETTINGS` | popup | Retorna configurações |
| `SAVE_SETTINGS` | popup | Salva configurações |
| `LIST_MODELS` | popup | Lista modelos disponíveis |
| `PROCESS_AI_REQUEST` | sidebar, popup | Processa requisição de IA |
| `CANCEL_REQUEST` | sidebar | Cancela requisição em andamento |
| `EXTRACT_PAGE_TEXT` | sidebar, background | Extrai texto da página |
| `EXTRACT_SELECTION` | sidebar | Obtém texto selecionado |

---

## Segurança

### Política de Localhost-Only

```typescript
const ALLOWED_HOSTS = ['127.0.0.1', 'localhost', '::1'];
const ALLOWED_PROTOCOLS = ['http:'];
```

- Toda URL é validada antes de qualquer `fetch`
- Apenas protocolo `http:` é aceito (sem HTTPS para localhost)
- Apenas hosts locais são permitidos
- Nomes de modelo são validados por regex: `/^[a-zA-Z0-9._\-:\/]+$/`

### Sanitização de Entrada

- Texto da página é limpo de caracteres de controle
- Limitado a 12.000 caracteres (6.000 para snippets)
- Respostas do modelo são verificadas contra padrões suspeitos

### Content Security Policy

```
script-src 'self'; object-src 'self'; connect-src http://127.0.0.1:* http://localhost:*;
```

---

## Stack Tecnológica

| Componente | Tecnologia |
|---|---|
| Linguagem | TypeScript 5.x |
| Build | esbuild (compilação rápida) |
| Formato de saída | IIFE (browser-compatible) |
| Target | Firefox 102+ (Tor Browser) |
| API de extensão | WebExtensions (Manifest V2) |
| Testes | Jest + ts-jest + jsdom |
| API de IA | OpenAI-compatible (`/v1/chat/completions`) |

---

## Estrutura de Diretórios

```
tor-ai-extension/
├── dist/                    # Build de produção (gerado)
│   ├── background.js
│   ├── content-script.js
│   ├── manifest.json
│   ├── icons/
│   ├── popup/
│   │   ├── popup.html
│   │   ├── popup.css
│   │   └── popup.js
│   └── sidebar/
│       ├── sidebar.html
│       ├── sidebar.css
│       └── sidebar.js
├── src/                     # Código fonte
│   ├── background/
│   │   ├── background.ts    # Orquestrador central
│   │   ├── ai-client.ts     # Cliente HTTP para IA
│   │   ├── prompt-builder.ts # Construtor de prompts
│   │   └── security.ts      # Validação e sanitização
│   ├── content/
│   │   └── content-script.ts # Extração de dados do DOM
│   ├── popup/
│   │   ├── popup.html
│   │   ├── popup.css
│   │   └── popup.ts
│   ├── sidebar/
│   │   ├── sidebar.html
│   │   ├── sidebar.css
│   │   └── sidebar.ts
│   ├── shared/
│   │   ├── types.ts
│   │   ├── constants.ts
│   │   ├── messages.ts
│   │   └── i18n.ts
│   ├── icons/
│   │   └── icon-*.png
│   └── manifest.json
├── scripts/
│   ├── build.js             # Script de build com esbuild
│   ├── copy-icon.js         # Copia ícone gerado
│   └── package.js           # Empacota extensão em .xpi
├── tests/
│   ├── setup.ts             # Mocks do browser API
│   ├── unit/
│   │   ├── ai-client.test.ts
│   │   ├── content-script.test.ts
│   │   ├── prompt-builder.test.ts
│   │   └── security.test.ts
│   └── integration/
│       ├── background-flow.test.ts
│       └── mock-server.ts
├── documentacao/            # Documentação do projeto
├── package.json
├── tsconfig.json
└── jest.config.ts
```
