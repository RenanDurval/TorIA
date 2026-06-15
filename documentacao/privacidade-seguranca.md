# 🔒 Relatório de Privacidade e Segurança — TorAI

Este documento descreve as premissas e mecanismos de segurança adotados no desenvolvimento da extensão **TorAI** para mitigar riscos de vazamento de dados, fingerprinting e injeção de código, garantindo total conformidade com as diretrizes de privacidade do navegador Tor.

---

## 1. Localhost Only: Restrição de Conexão Física

O maior vetor de risco em extensões que processam dados de páginas visitadas é o envio dessas informações (logs, textos de páginas protegidas por login, etc.) para servidores externos na nuvem.

### Mecanismo de Prevenção:
No arquivo [security.ts](file:///c:/Users/renan/Desktop/Extencao%20Tor/tor-ai-extension/src/background/security.ts), a função `validateLocalUrl` age como um *gatekeeper* ativo antes de qualquer requisição HTTP ou WebSocket ser disparada:

1. **Rejeição de Hosts Externos**: Qualquer URL cujo host de destino não seja explicitamente `127.0.0.1`, `localhost` ou `::1` é bloqueada imediatamente, gerando uma exceção de runtime.
2. **Validação de Protocolo**: Apenas conexões do tipo `http:` são permitidas para conexões com a API local. Protocolos externos ou obscuros são descartados.
3. **Assinatura de Porta**: A porta da URL deve estar no intervalo válido de portas de rede TCP (1 a 65535).

---

## 2. Sandbox CSP no Manifesto

O navegador Tor impõe restrições severas de segurança por padrão. Para evitar o desvio malicioso da lógica da extensão por injeção na página, configuramos a **Content Security Policy (CSP)** no [manifest.json](file:///c:/Users/renan/Desktop/Extencao%20Tor/tor-ai-extension/src/manifest.json) de maneira extremamente rígida:

```json
"content_security_policy": "script-src 'self'; object-src 'self'; connect-src http://127.0.0.1:* http://localhost:*;"
```

### O que isso garante?
- **`script-src 'self'`**: O navegador recusa a execução de qualquer código JavaScript que não esteja presente no pacote estático empacotado da extensão. Isso impede vetores de ataque do tipo XSS (cross-site scripting) onde scripts injetados de fora poderiam ler os dados do popup ou sidebar.
- **`connect-src http://127.0.0.1:* http://localhost:*`**: O navegador bloqueia ativamente, a nível de engine web, qualquer tentativa de executar um `fetch()`, `XMLHttpRequest` ou conexão WebSocket para qualquer domínio externo à máquina local. Mesmo se um atacante conseguisse alterar as configurações de URL da extensão para apontar para `http://seu-servidor.com`, o navegador abortaria a requisição antes que qualquer bit de dado saísse do computador do usuário.

---

## 3. Gestão Volátil de Cache e Storage

A extensão utiliza a API `browser.storage.local` apenas para salvar as preferências do usuário (provedor preferencial, porta de escuta, temperatura do modelo, e idioma alvo para traduções).

- **Limpeza Sistemática**: A função `clearTemporaryData` no módulo de segurança é invocada a cada alteração de aba ativa ou quando o processador de tarefas encerra sua execução. Isso garante que nenhum dado sensível das páginas analisadas permaneça armazenado permanentemente no disco da máquina através de arquivos de cache do navegador.
- **Opção de Hard Reset**: A interface do Popup disponibiliza um botão de "Reset de Dados" que chama `clearAllData`, apagando instantaneamente todas as preferências e dados locais, deixando a extensão em estado virgem.

---

## 4. O Risco de Fingerprinting no Tor Browser

O Tor Project desaconselha fortemente a instalação de extensões customizadas no navegador. Isso se deve ao fato de que extensões extras podem ser detectadas por técnicas de **fingerprinting** (impressão digital), distinguindo o navegador do usuário da massa geral de usuários comuns do Tor Browser.

### Como a extensão TorAI lida com isso?
1. **Instalação Temporária Recomendada**: No guia de uso, orientamos os usuários a carregar a extensão temporariamente via `about:debugging` para sessões específicas, evitando a persistência da assinatura da extensão no perfil global.
2. **Zero Modificações no User-Agent**: A extensão não altera nenhuma propriedade do cabeçalho de navegação, nem modifica cabeçalhos HTTP que saem para a rede Tor.
3. **Execução Local**: Toda comunicação com a API da IA local ocorre na interface de loopback (`localhost`), o que não altera o fluxo nem a assinatura de pacotes que viajam pela rede Tor.
