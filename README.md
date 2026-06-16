# 🧠 TorAI — Extensão de IA Local para Tor Browser

> **Privacidade total**: Conecte modelos de IA locais (Ollama/LMStudio) ao Tor Browser. Nenhum dado sai do seu computador.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Manifest V2](https://img.shields.io/badge/Manifest-V2-blue.svg)]()
[![Tor Browser](https://img.shields.io/badge/Tor%20Browser-Compatible-7D4698.svg)]()

---

## 📋 Índice

- [O que é](#o-que-é)
- [Funcionalidades](#funcionalidades)
- [Requisitos](#requisitos)
- [Instalação](#instalação)
- [Configuração do Modelo Local](#configuração-do-modelo-local)
- [Uso](#uso)
- [Atalhos de Teclado](#atalhos-de-teclado)
- [Modelos Recomendados](#modelos-recomendados)
- [Privacidade e Segurança](#privacidade-e-segurança)
- [Desenvolvimento](#desenvolvimento)
- [Avisos Legais](#avisos-legais)

---

## O que é

**TorAI** é uma extensão para o Tor Browser que permite usar modelos de inteligência artificial executados **localmente no seu computador**, via [Ollama](https://ollama.com) ou [LM Studio](https://lmstudio.ai).

Diferente de serviços de IA na nuvem, **nenhum dado da página é enviado para servidores externos**. Todo o processamento acontece no seu computador.

---

## Funcionalidades

| Funcionalidade | Descrição |
|---|---|
| 📝 **Resumo** | Resumo curto (3-4 frases) ou detalhado (tópicos ricos) da página |
| 🌐 **Tradução** | Traduz a página para 11 idiomas diferentes |
| 💡 **Dicas** | Dicas de segurança, usabilidade e leitura (até 5 itens) |
| 🏷️ **Entidades** | Extrai títulos, autores, datas, links e palavras-chave |
| 🎓 **Explicação** | Explica o conteúdo de forma simples para iniciantes |
| ✂️ **Trecho** | Analisa apenas o trecho selecionado pelo usuário |
| 💬 **Chat Modernizado** | Chat estilo ChatGPT/Claude com avatares, auto-expansão e histórico |
| 💭 **Processo de Raciocínio** | Bloco retrátil (accordion) para exibir pensamentos de modelos como DeepSeek-R1 (`<think>`) |
| ⏱️ **Espera Inteligente** | Seletor de tempo máximo (60s a sem limite) para evitar erros de timeout em hardware local |

---

## Requisitos

### Obrigatórios
- **Tor Browser** 12.0+ (baseado em Firefox ESR 102+)
- Um dos provedores de IA local:
  - [Ollama](https://ollama.com) — recomendado para iniciantes
  - [LM Studio](https://lmstudio.ai)

### Hardware Recomendado
- **RAM**: Mínimo 8 GB (16 GB recomendado)
- **GPU**: Opcional, mas acelera significativamente
- **Disco**: ~4-10 GB para o modelo (depende do tamanho)

---

## Instalação

### 1. Instalar a extensão no Tor Browser

```bash
# Clonar o repositório
git clone https://github.com/torai-extension/tor-ai-extension.git
cd tor-ai-extension

# Instalar dependências
npm install

# Compilar
npm run build
```

### 2. Carregar no Tor Browser

1. Abra o Tor Browser
2. Digite `about:debugging` na barra de endereço
3. Clique em **"Este Firefox"** (ou "This Firefox")
4. Clique em **"Carregar extensão temporária"**
5. Navegue até a pasta `dist/` e selecione o arquivo `manifest.json`

### 3. Empacotamento (opcional)

```bash
npm run package
```

O arquivo `.xpi` será gerado em `releases/`. Pode ser instalado diretamente via `about:addons`.

---

## Configuração do Modelo Local

### Opção A: Ollama (Recomendado)

```bash
# 1. Instalar o Ollama
# Acesse https://ollama.com e siga as instruções

# 2. Baixar um modelo
ollama pull llama3.2

# 3. Iniciar o servidor (geralmente automático)
ollama serve

# 4. Verificar se está rodando
curl http://localhost:11434/api/tags
```

### Opção B: LM Studio

1. Baixe em [lmstudio.ai](https://lmstudio.ai)
2. Abra e vá na aba **"Discover"** para baixar um modelo
3. Vá na aba **"Server"** (ícone de plugue)
4. Clique em **"Start Server"**
5. Confirme que aparece `http://localhost:1234`

### 3. Conectar na extensão

1. Clique no ícone **TorAI** na barra de extensões
2. Selecione o provedor (Ollama ou LM Studio)
3. Clique em **"Conectar"**
4. Escolha o modelo no dropdown
5. Pronto! Abra o painel lateral para usar

---

## Uso

### Popup (Configuração Rápida)
- Clique no ícone TorAI → configura provedor, modelo e parâmetros
- Botões rápidos para Resumir, Traduzir, Dicas

### Painel Lateral (Sidebar)
- Pressione `Ctrl+Shift+A` ou clique em "Painel" no popup
- 5 abas: Resumo, Tradução, Dicas, Entidades, Trecho
- Cada aba tem botão de ação e área de resultado com "Copiar"

### Análise de Trecho
1. Selecione um trecho de texto na página
2. Abra o painel lateral, aba "Trecho"
3. O texto selecionado aparecerá automaticamente
4. Escolha: Resumir, Explicar ou Traduzir

---

## Atalhos de Teclado

| Atalho | Ação |
|---|---|
| `Ctrl+Shift+S` | Gerar resumo da página |
| `Ctrl+Shift+T` | Traduzir página |
| `Ctrl+Shift+A` | Abrir/fechar painel lateral |

---

## Modelos Recomendados

| Modelo | Tamanho | RAM | Uso Recomendado |
|---|---|---|---|
| `llama3.2` | ~2 GB | 8 GB | Uso geral, resumos e tradução |
| `llama3.2:3b` | ~2 GB | 8 GB | Respostas rápidas, hardware limitado |
| `mistral:7b` | ~4 GB | 8 GB | Qualidade equilibrada |
| `phi-3` | ~2.3 GB | 8 GB | Rápido, bom para explicações |
| `llama3.1:8b` | ~4.7 GB | 16 GB | Alta qualidade, mais lento |
| `gemma2:9b` | ~5.4 GB | 16 GB | Excelente para tradução |
| `codellama` | ~3.8 GB | 8 GB | Análise de código |

### Configurar modelo no Ollama

```bash
# Baixar o modelo desejado
ollama pull llama3.2

# Verificar modelos disponíveis
ollama list
```

---

## Privacidade e Segurança

### 🔒 Garantias de Privacidade

1. **Zero dados externos**: A extensão NUNCA envia dados para servidores na internet
2. **Somente localhost**: Todas as conexões são restritas a `127.0.0.1` e `localhost`
3. **Sem telemetria**: Não coleta analytics, métricas ou logs remotos
4. **Cache temporário**: Dados são limpos após cada operação
5. **Código aberto**: Todo o código é auditável

### 🛡️ Permissões Utilizadas

| Permissão | Motivo |
|---|---|
| `activeTab` | Ler conteúdo da aba quando o usuário clica na extensão |
| `tabs` | Obter título e URL da aba para contextualizar prompts |
| `storage` | Salvar configurações localmente (provedor, modelo, temperatura) |

### ⚠️ Aviso sobre Fingerprinting

Instalar extensões adicionais no Tor Browser pode criar uma impressão digital única do seu navegador. Esta extensão foi projetada para operar inteiramente offline, mas seu uso aumenta marginalmente a superfície de fingerprinting.

Para mais detalhes, consulte [PRIVACY.md](PRIVACY.md).

---

## Contribuindo

Quer ajudar a melhorar o TorAI? Este projeto é de código aberto e todas as contribuições são bem-vindas! Sinta-se à vontade para enviar *Pull Requests* ou abrir *Issues* relatando bugs e sugestões.

Antes de começar, por favor, leia o nosso [Guia de Contribuição](CONTRIBUTING.md) e o rigoroso [Protocolo de Segurança](documentacao/protocolo-seguranca.md) para saber como preparar o seu ambiente e submeter suas alterações com segurança e sem vazamento de dados locais.

---

## Desenvolvimento

### Pré-requisitos

- Node.js 18+
- npm

### Comandos

```bash
# Instalar dependências
npm install

# Build de desenvolvimento (com source maps)
npm run build

# Build com watch mode
npm run build:watch

# Executar testes
npm test

# Testes com cobertura
npm run test:coverage

# Verificar tipos TypeScript
npm run lint

# Empacotar .xpi
npm run package

# Limpar build
npm run clean
```

### Estrutura do Projeto

```
src/
├── background/        # Script de fundo (orquestrador, AI client, prompts, segurança)
├── content/           # Content script (extração de texto da página)
├── popup/             # Popup de configuração (HTML + CSS + TS)
├── sidebar/           # Painel lateral principal (HTML + CSS + TS)
├── shared/            # Tipos, constantes, mensagens, i18n
├── icons/             # Ícones da extensão
└── manifest.json      # Manifesto WebExtension V2

tests/
├── unit/              # Testes unitários
└── integration/       # Testes de integração com mock server
```

---

## Avisos Legais

### Responsabilidade sobre Conteúdo Gerado

O conteúdo gerado por modelos de IA pode conter erros, imprecisões ou informações desatualizadas. **Sempre verifique informações importantes** de forma independente.

### Direitos Autorais

Resumos e traduções gerados pela extensão são derivados do conteúdo original das páginas. Respeite os direitos autorais dos autores originais ao usar ou redistribuir este conteúdo.

### Conformidade com o Tor Project

Esta extensão foi projetada para respeitar as políticas do Tor Browser:
- Não faz requisições de rede externas
- Não coleta dados de navegação
- Não modifica o tráfego do Tor
- Opera inteiramente no contexto local

---

## Licença

MIT License — veja [LICENSE](LICENSE) para detalhes.
