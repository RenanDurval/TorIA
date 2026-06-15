# 💻 Guia do Desenvolvedor — TorAI

Este documento serve como guia técnico para desenvolvedores que desejam compilar, estender, depurar ou rodar a suíte de testes da extensão **TorAI**.

---

## 1. Estrutura de Diretórios do Código-Fonte

O projeto adota uma separação rígida de responsabilidades:

```
tor-ai-extension/
├── documentacao/           # Relatórios, manuais e arquitetura do projeto
├── scripts/                # Scripts de compilação e empacotamento
│   ├── build.js            # Build script utilizando esbuild
│   └── package.js          # Utilitário para empacotamento em formato .xpi
├── src/                    # Código-fonte principal da extensão
│   ├── background/         # Scripts de ciclo de vida (AI Client, segurança, prompts)
│   ├── content/            # Script injetado para ler o DOM das páginas visitadas
│   ├── popup/              # Interface do painel superior de configurações
│   ├── sidebar/            # Interface principal em abas do painel lateral
│   ├── shared/             # Tipos, constantes, mensagens e internacionalização
│   └── manifest.json       # Manifesto WebExtension Manifest V2
├── tests/                  # Suíte de testes automatizados com Jest
│   ├── setup.ts            # Mocks globais para APIs do Firefox/Tor
│   ├── unit/               # Testes unitários (segurança, client de IA, DOM)
│   └── integration/        # Testes de integração de fluxo de mensagens
├── package.json            # Manifesto do Node.js (dependências e scripts de automação)
└── tsconfig.json           # Configuração de compilação do compilador TypeScript
```

---

## 2. Sistema de Compilação (`scripts/build.js`)

A compilação converte os arquivos TypeScript (`.ts`) localizados na pasta `src/` em arquivos JavaScript (`.js`) otimizados em formato IIFE (Immediately Invoked Function Expression) que o navegador consegue carregar.

O script [build.js](file:///c:/Users/renan/Desktop/Extencao%20Tor/tor-ai-extension/scripts/build.js) executa as seguintes tarefas:
1. **Limpeza**: Apaga a pasta `dist/` anterior usando o utilitário `rimraf`.
2. **Resolução de Bundles**: Configura quatro pontos de entrada independentes do `esbuild`:
   - `background.ts` ➔ `dist/background.js`
   - `content-script.ts` ➔ `dist/content-script.js`
   - `popup.ts` ➔ `dist/popup.js`
   - `sidebar.ts` ➔ `dist/sidebar.js`
3. **Cópia de Recursos**: Copia os arquivos `.html` e `.css` das pastas `popup` e `sidebar`, além do `manifest.json`, diretamente para os caminhos correspondentes em `dist/`.
4. **Placeholder de Ícones**: Se a pasta `dist/icons/` não contiver os arquivos PNG, o script gera automaticamente ícones SVG temporários baseados em um logo minimalista para garantir que a extensão inicialize sem quebras visuais.

### Comandos de Compilação:
Execute estes comandos na raiz do projeto:

```bash
# Executa uma compilação única de produção
npm run build

# Executa em modo watch (recompila instantaneamente ao alterar qualquer arquivo)
npm run build:watch
```

---

## 3. Empacotamento de Lançamento (`scripts/package.js`)

Para distribuir a extensão como um arquivo instalável permanentemente no navegador Tor, ela deve ser empacotada em formato `.xpi` (que é estruturalmente um arquivo `.zip` com a extensão modificada).

O script [package.js](file:///c:/Users/renan/Desktop/Extencao%20Tor/tor-ai-extension/scripts/package.js) realiza o empacotamento:
1. Cria a pasta `releases/` se ela não existir.
2. Utiliza ferramentas nativas do Windows PowerShell (`Compress-Archive`) ou utilitários Zip para compactar todo o conteúdo da pasta `dist/` gerando o arquivo `releases/tor-ai-extension.xpi`.

### Comando de Empacotamento:
```bash
npm run package
```

---

## 4. Testes Automatizados

O framework de testes adotado é o **Jest** configurado com suporte para TypeScript via `ts-jest` e simulação de árvore de elementos DOM com `jsdom`.

### Arquivo de Configuração de Mocks (`tests/setup.ts`)
Como o código da extensão utiliza a API global `browser.*` (nativa do Firefox/Tor Browser), o arquivo [setup.ts](file:///c:/Users/renan/Desktop/Extencao%20Tor/tor-ai-extension/tests/setup.ts) simula todo o comportamento destas APIs (envio de mensagens, armazenamento em storage, consultas a abas) para que os testes rodem em ambiente de terminal puro Node.js sem disparar erros.

### Servidor de Mock de IA (`tests/integration/mock-server.ts`)
Para rodar os testes de integração sem depender de uma instância física instalada do Ollama ou LM Studio, criamos um servidor HTTP fictício em [mock-server.ts](file:///c:/Users/renan/Desktop/Extencao%20Tor/tor-ai-extension/tests/integration/mock-server.ts). Ele intercepta as chamadas locais de fetch e responde imediatamente com textos estruturados simulando resumos, traduções e análises de entidades.

### Comandos de Testes:
```bash
# Executa todos os testes da aplicação
npm test

# Executa testes em modo de observação contínua (watch)
npm run test:watch

# Gera relatório de cobertura de linhas do código analisado
npm run test:coverage
```
