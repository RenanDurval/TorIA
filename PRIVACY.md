# 🔒 Política de Privacidade — TorAI

**Última atualização:** Janeiro 2025

---

## Resumo

A extensão TorAI opera **inteiramente no seu computador**. Nenhum dado é enviado para servidores externos. Todos os processamentos de IA acontecem localmente via Ollama ou LM Studio.

---

## Coleta de Dados

### ❌ Dados que NÃO coletamos

- Conteúdo de páginas visitadas
- Histórico de navegação
- Dados pessoais
- Endereços IP
- Cookies ou tokens de sessão
- Informações do dispositivo
- Métricas de uso ou telemetria
- Qualquer dado que identifique o usuário

### ✅ Dados armazenados localmente

Os seguintes dados são armazenados **exclusivamente no seu computador** via `browser.storage.local`:

| Dado | Finalidade | Retenção |
|---|---|---|
| Provedor selecionado (Ollama/LMStudio) | Reconectar automaticamente | Até o usuário alterar |
| URL do provedor local | Configuração de conexão | Até o usuário alterar |
| Modelo selecionado | Preferência do usuário | Até o usuário alterar |
| Temperatura e max tokens | Parâmetros do modelo | Até o usuário alterar |
| Idioma de tradução | Preferência do usuário | Até o usuário alterar |

**Nenhum** conteúdo de páginas, resultados de IA ou dados de navegação é armazenado permanentemente.

---

## Conexões de Rede

### Conexões realizadas pela extensão

| Destino | Propósito | Dados enviados |
|---|---|---|
| `http://127.0.0.1:11434` | Comunicação com Ollama | Texto da página (local) |
| `http://127.0.0.1:1234` | Comunicação com LM Studio | Texto da página (local) |

**Importante:**
- Ambas as conexões são para `localhost` (seu próprio computador)
- Nenhuma conexão com servidores na internet é realizada
- A Content Security Policy (CSP) no manifesto **bloqueia** qualquer tentativa de conexão externa
- O código valida que todas as URLs apontam exclusivamente para `127.0.0.1`, `localhost` ou `::1`

### Conexões NÃO realizadas

- ❌ Servidores de IA na nuvem (OpenAI, Anthropic, Google, etc.)
- ❌ Servidores de analytics (Google Analytics, Mixpanel, etc.)
- ❌ CDNs ou servidores de conteúdo
- ❌ Qualquer domínio que não seja localhost

---

## Processamento de Dados

1. **Extração de texto**: O content script extrai o texto visível da página ativa. Este texto permanece no navegador.

2. **Envio ao modelo local**: O texto é enviado via HTTP para `localhost` (Ollama ou LMStudio). A comunicação ocorre inteiramente dentro do seu computador.

3. **Recepção da resposta**: A resposta do modelo é exibida no painel da extensão.

4. **Limpeza**: Após cada operação, dados temporários são removidos do storage local.

---

## Permissões do Manifesto

| Permissão | Justificativa |
|---|---|
| `activeTab` | Necessária para ler o conteúdo da aba quando o usuário ativa a extensão. Sem esta permissão, não é possível extrair o texto para análise. |
| `tabs` | Usada para obter o título e URL da aba ativa para contextualizar os prompts enviados ao modelo. Não acessa histórico. |
| `storage` | Armazena configurações do usuário (provedor, modelo, parâmetros) localmente. Nenhum dado é sincronizado com servidores. |

---

## Aviso sobre o Tor Browser

O Tor Project **desaconselha a instalação de extensões adicionais** no Tor Browser, pois cada extensão pode criar uma impressão digital (fingerprint) única que distingue o usuário de outros usuários do Tor.

### Riscos de fingerprinting

- A presença desta extensão pode ser detectável por scripts em páginas web
- APIs específicas da extensão podem ser enumeráveis
- O comportamento do navegador pode diferir de outros usuários Tor

### Mitigações implementadas

- A extensão não injeta elementos visuais na página (exceto content script para extração)
- Não modifica headers HTTP ou tráfego de rede
- Não adiciona APIs detectáveis ao contexto da página
- Não altera o User-Agent ou outras características do navegador

---

## Responsabilidade

### Conteúdo gerado por IA

O conteúdo gerado por modelos de IA locais pode:
- Conter erros factuais ou imprecisões
- Gerar traduções imperfeitas
- Produzir resumos que omitam informações importantes
- Refletir vieses presentes nos dados de treinamento do modelo

**Sempre verifique informações importantes de forma independente.**

### Direitos autorais

Ao usar as funcionalidades de tradução e resumo, respeite os direitos autorais do conteúdo original. A responsabilidade pelo uso adequado do conteúdo gerado é do usuário.

---

## Contato

Para questões sobre privacidade, abra uma issue no repositório do projeto.

---

## Alterações nesta política

Quaisquer alterações nesta política serão documentadas neste arquivo com a data de atualização. Recomendamos verificar periodicamente.
