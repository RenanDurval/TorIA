# TorAI — Privacidade e Segurança

**Versão:** 1.0.0  
**Última Atualização:** 2025-06-16

---

## Compromisso de Privacidade

O TorAI foi projetado com um princípio fundamental: **nenhum dado do usuário jamais sai do computador local**. Este documento detalha as medidas técnicas que garantem essa promessa.

---

## 1. Política de Localhost-Only

### Restrição Hardcoded

O código fonte contém uma lista fixa de hosts permitidos que **não pode ser alterada** pela interface do usuário:

```typescript
// src/shared/constants.ts
const ALLOWED_HOSTS = ['127.0.0.1', 'localhost', '::1'];
const ALLOWED_PROTOCOLS = ['http:'];
```

### Validação em Múltiplas Camadas

Toda URL é validada **3 vezes** antes de qualquer requisição HTTP:

1. **`security.ts` → `validateUrl()`:** Verifica protocolo, host e porta
2. **`security.ts` → `buildSafeUrl()`:** Constrói URL segura com validação
3. **`manifest.json` → `permissions`:** Restringe domínios a `http://127.0.0.1/*` e `http://localhost/*`
4. **`manifest.json` → CSP:** `connect-src http://127.0.0.1:* http://localhost:*`

### O que acontece se alguém tentar uma URL externa?

```
Tentativa: http://api.openai.com/v1/chat/completions
Resultado: Error("Host não permitido: api.openai.com")
```

A validação rejeita imediatamente qualquer URL que não resolva para `127.0.0.1`, `localhost` ou `::1`.

---

## 2. Content Security Policy (CSP)

O manifest da extensão declara uma CSP restritiva:

```
script-src 'self'; object-src 'self'; connect-src http://127.0.0.1:* http://localhost:*;
```

Isso significa:
- **Scripts:** Apenas da própria extensão (`'self'`)
- **Objetos embarcados:** Apenas da própria extensão
- **Conexões de rede:** Apenas para localhost

---

## 3. Sanitização de Dados

### Texto da Página (entrada)

Antes de enviar qualquer texto ao modelo de IA, ele passa por sanitização:

```typescript
function sanitizeText(input: string, maxLength = 12000): string {
  // Remove caracteres de controle (exceto newline/tab)
  // Normaliza line breaks
  // Remove linhas em branco excessivas
  // Colapsa espaços múltiplos
  // Trunca no limite de caracteres
}
```

Limites:
- **Texto da página:** máximo 12.000 caracteres
- **Trechos selecionados:** máximo 4.000 caracteres
- **Contexto de chat:** máximo 6.000 caracteres

### Nome do Modelo (validação)

```typescript
function validateModelName(name: string): boolean {
  return /^[a-zA-Z0-9._\-:\/]+$/.test(name) && name.length <= 200;
}
```

### Parâmetros do Modelo (limites)

```typescript
temperature = Math.max(0, Math.min(2, temperature));     // 0-2
maxTokens = Math.max(128, Math.min(8192, maxTokens));     // 128-8192
```

### Resposta do Modelo (validação)

```typescript
function validateAIResponse(text: string): { safe: boolean; warnings: string[] } {
  // Detecta padrões suspeitos:
  // - URLs com parâmetros de exfiltração de dados
  // - javascript: URIs
  // - data:text/html payloads
}
```

---

## 4. Interceptação de Headers

O background script intercepta e modifica headers HTTP para requisições locais:

```typescript
browser.webRequest.onBeforeSendHeaders.addListener(
  (details) => ({
    requestHeaders: details.requestHeaders
      .filter(h => h.name.toLowerCase() !== 'origin')
  }),
  { urls: ['http://127.0.0.1/*', 'http://localhost/*'] },
  ['blocking', 'requestHeaders']
);
```

**Por que?** O Tor Browser aplica políticas CORS estritas que bloqueariam requisições da extensão para Ollama/LMStudio. A remoção do header `Origin` permite que o servidor local aceite a requisição.

**Escopo:** Apenas requisições para `127.0.0.1` e `localhost`. Headers de requisições para outros hosts não são afetados.

---

## 5. Permissões da Extensão

| Permissão | Justificativa |
|---|---|
| `activeTab` | Acessar conteúdo da aba ativa para análise |
| `tabs` | Identificar a aba ativa para enviar mensagens |
| `storage` | Salvar configurações do usuário localmente |
| `webRequest` | Interceptar headers HTTP para bypass CORS |
| `webRequestBlocking` | Modificar headers em tempo real |
| `http://127.0.0.1/*` | Comunicar com Ollama/LMStudio |
| `http://localhost/*` | Comunicar com Ollama/LMStudio |

### Permissões NÃO solicitadas

- ❌ `<all_urls>` para webRequest (apenas localhost)
- ❌ `downloads` — a extensão não baixa arquivos
- ❌ `history` — não acessa histórico de navegação
- ❌ `bookmarks` — não acessa favoritos
- ❌ `cookies` — não lê cookies
- ❌ `geolocation` — não acessa localização

---

## 6. Armazenamento Local

O TorAI armazena dados apenas no `browser.storage.local`:

| Chave | Conteúdo |
|---|---|
| `torai_settings` | Configurações do usuário (provedor, modelo, temperatura, etc.) |
| `torai_target_tab` | Aba temporária alvo (removida após uso) |

**Dados NÃO armazenados:**
- ❌ Conteúdo de páginas visitadas
- ❌ Histórico de conversas (Chat é volátil — perdido ao fechar o sidebar)
- ❌ Resultados de análises
- ❌ Dados pessoais do usuário

---

## 7. Modelo de Ameaças

### Ameaça: Exfiltração de dados via modelo malicioso

**Mitigação:** Toda resposta do modelo é validada contra padrões de exfiltração (URLs com parâmetros, javascript: URIs, data: payloads).

### Ameaça: Extensão comprometida

**Mitigação:** CSP restritiva impede carregamento de scripts externos. Código é 100% auditável.

### Ameaça: CORS bypass usado para atacar outros serviços locais

**Mitigação:** A interceptação de headers está limitada a `127.0.0.1` e `localhost` nas URLs do filtro `webRequest`.

### Ameaça: Injeção de prompt

**Mitigação:** Sanitização de texto remove caracteres de controle e trunca input. System prompt é fixo e não pode ser modificado pelo usuário.

---

## 8. Recomendações de Segurança

1. **Use sempre Tor Browser** — navegadores comuns podem vazar metadados
2. **Mantenha o Ollama/LMStudio atualizado** — patches de segurança
3. **Não exponha portas locais à rede** — mantenha Ollama/LMStudio em `127.0.0.1`
4. **Verifique a integridade da extensão** — compare checksums se baixar de terceiros
5. **Não instale modelos de fontes não confiáveis** — modelos podem gerar conteúdo malicioso
