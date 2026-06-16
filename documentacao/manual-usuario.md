# TorAI — Manual do Usuário

**Versão:** 1.0.0  
**Última Atualização:** 2025-06-16

---

## O que é o TorAI?

O TorAI é uma extensão para o **Tor Browser** que conecta modelos de inteligência artificial locais ao navegador. Com ele, você pode:

- 📝 **Resumir** páginas web automaticamente
- 🌐 **Traduzir** páginas para qualquer idioma
- 💡 **Receber dicas** de segurança e usabilidade
- 🏷️ **Extrair entidades** (títulos, autores, datas)
- ✂️ **Analisar trechos** de texto selecionados
- 💬 **Conversar** com a IA sobre o conteúdo da página

> **Importante:** Nenhum dado sai do seu computador. Todo o processamento é feito localmente, garantindo privacidade total.

---

## Instalação

### Passo 1: Instalar um Provedor de IA Local

Você precisa de **um** dos seguintes programas instalados:

#### Opção A: Ollama (Recomendado)

1. Acesse https://ollama.ai e baixe o instalador
2. Instale normalmente
3. Abra o terminal e execute:
   ```
   ollama pull llama3.2
   ```
4. O Ollama inicia automaticamente na porta **11434**

#### Opção B: LMStudio

1. Acesse https://lmstudio.ai e baixe o instalador
2. Abra o LMStudio e baixe um modelo (ex: Llama 3.2)
3. Vá para a aba **"Local Server"** e clique em **"Start Server"**
4. O servidor inicia na porta **1234**

### Passo 2: Instalar a Extensão

1. Baixe o arquivo da extensão (`.xpi`)
2. No Tor Browser, arraste o arquivo `.xpi` para a janela do navegador
3. Confirme a instalação quando solicitado

---

## Como Usar

### Conectar à IA

1. Clique no ícone 🧠 na barra de ferramentas
2. O popup de configuração abrirá
3. Selecione o provedor (**Ollama** ou **LMStudio**)
4. Clique em **"Conectar"**
5. Se a conexão for bem-sucedida, o status mudará para **"Conectado"** (verde)

### Abrir o Painel Lateral

Use o atalho **Ctrl+Shift+A** ou clique no botão correspondente no popup.

### Gerar um Resumo

1. Navegue para qualquer página web
2. Abra o painel lateral (Ctrl+Shift+A)
3. Na aba **📝 Resumo**, escolha entre:
   - **Curto** (2-3 frases)
   - **Detalhado** (5-8 frases)
4. Clique em **"Gerar resumo"**
5. Aguarde o resultado (pode levar de 5 a 60 segundos dependendo do modelo)

### Traduzir uma Página

1. Abra o painel lateral
2. Vá para a aba **🌐 Tradução**
3. Selecione o idioma desejado
4. Clique em **"Traduzir página"**

### Usar o Chat

1. Abra o painel lateral
2. Vá para a aba **💬 Chat**
3. O checkbox **"Contexto da página"** permite que a IA leia o conteúdo da página para responder melhor
4. Digite sua pergunta e pressione Enter

### Analisar Texto Selecionado

1. Selecione um trecho de texto na página
2. Abra o painel lateral
3. Vá para a aba **✂️ Trecho**
4. O texto selecionado aparecerá automaticamente
5. Escolha uma ação: **Resumir**, **Explicar** ou **Traduzir**

---

## Configurações

No popup (clique no ícone 🧠), você pode ajustar:

| Configuração | Descrição | Padrão |
|---|---|---|
| **Provedor** | Ollama ou LMStudio | Ollama |
| **Modelo** | Modelo de IA a usar | Primeiro disponível |
| **Temperatura** | Criatividade da resposta (0-2) | 0.7 |
| **Tokens máximos** | Tamanho máximo da resposta | 2048 |
| **Timeout** | Tempo máximo de espera | 120s |

### Temperatura

- **0.0 - 0.3:** Respostas muito precisas e conservadoras
- **0.4 - 0.7:** Equilíbrio entre precisão e criatividade (recomendado)
- **0.8 - 1.5:** Respostas mais criativas e variadas
- **1.6 - 2.0:** Muito criativo, pode ser incoerente

---

## Atalhos de Teclado

| Atalho | Ação |
|---|---|
| `Ctrl+Shift+A` | Abrir/fechar painel lateral |
| `Ctrl+Shift+S` | Gerar resumo rápido da página |
| `Ctrl+Shift+T` | Traduzir página |

---

## Resolução de Problemas

### "Não foi possível conectar"

1. Verifique se o Ollama ou LMStudio está rodando
2. Confirme que o servidor está acessível em `http://127.0.0.1:11434` (Ollama) ou `http://127.0.0.1:1234` (LMStudio)
3. Teste no terminal: `curl http://127.0.0.1:11434/api/tags`

### "Nenhum modelo encontrado"

1. No Ollama: execute `ollama pull llama3.2` no terminal
2. No LMStudio: baixe um modelo pela interface gráfica

### Resposta muito lenta

1. Aumente o timeout nas configurações (slider no popup)
2. Use um modelo menor (ex: `llama3.2:1b` em vez de `llama3.2`)
3. Reduza o número de tokens máximos

### Extensão não carrega

1. Verifique se está usando **Tor Browser** (baseado em Firefox)
2. Acesse `about:debugging` e verifique erros no console
3. Reconstrua a extensão: `npm run build`

---

## Privacidade e Segurança

- ✅ **Zero dados enviados para a internet** — todo processamento é local
- ✅ **Apenas conexões localhost** — restrição hardcoded no código
- ✅ **Sem tracking, analytics ou telemetria**
- ✅ **Código aberto** — auditável por qualquer pessoa
- ✅ **CSP restritiva** — bloqueia scripts e conexões externas
- ✅ **Sanitização de entrada** — protege contra injeção de código
- ✅ **Validação de resposta** — detecta padrões suspeitos

Para mais detalhes, consulte o documento [Privacidade e Segurança](privacidade-seguranca.md).
