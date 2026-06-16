# Protocolo de Segurança: Prevenção de Vazamento de Dados

Este documento estabelece as diretrizes e procedimentos para garantir que nenhum dado sensível, sigiloso ou configuração pessoal seja acidentalmente vazado ao enviar o projeto TorAI para o GitHub ou outros repositórios públicos.

## 1. Dados Sensíveis a Serem Protegidos

**Nunca** inclua os seguintes tipos de informações no código-fonte do repositório:
- **Chaves de API** (ex: OpenAI, Anthropic, etc).
- **Senhas** de banco de dados ou painéis administrativos.
- **Tokens de Autenticação** ou JWTs.
- **Caminhos Locais Específicos** que revelem informações do seu sistema operacional (ex: `C:\Users\renan\Desktop\...`).
- **Arquivos `.env`** com variáveis de ambiente reais.
- **Arquivos de Configuração** contendo dados reais de produção (`config.json`, `secrets.json`).
- **Logs** locais que podem conter trechos de dados de usuários ou do terminal.
- **Configurações Específicas do Tor** que revelem IPs ou informações de nós.

## 2. Configuração do `.gitignore`

O arquivo `.gitignore` já está configurado na raiz do projeto para bloquear automaticamente o envio de arquivos sensíveis. Ele inclui regras para ignorar:
- Arquivos de ambiente (`.env`, `.env.*`)
- Logs de depuração (`npm-debug.log`, `yarn-error.log`)
- Pastas de bibliotecas (`node_modules/`)
- Diretórios de compilação (`dist/`, `releases/`)
- Pastas de IDE e caches locais (`.vscode/`, `.idea/`, `.gemini/`)
- Padrões de arquivos de chaves e certificados (`*.key`, `*.pem`, `*.cert`)
- Arquivos de configuração sensíveis (`config.json`, `secrets.*`)

**Regra de Ouro:** Se um arquivo contém dados que só funcionam ou só devem existir na sua máquina, garanta que ele esteja listado no `.gitignore`.

## 3. Checklist Antes de Subir para o GitHub (Pre-Commit)

Sempre que for usar o script `push_to_github.bat` ou rodar comandos do Git, siga este checklist mental:

- [ ] **Revisão de Código (Diff):** Eu verifiquei as alterações (ex: `git diff`) e confirmei que não deixei nenhuma chave de API ou caminho local no código?
- [ ] **Variáveis de Ambiente:** Eu usei variáveis de ambiente (via process.env no Node, ou mock de variáveis) em vez de escrever as credenciais direto no arquivo?
- [ ] **Arquivos Novos:** Algum arquivo novo contendo senhas foi adicionado por engano? (Se sim, adicione a extensão ou o nome dele no `.gitignore` antes de fazer o commit).

## 4. O que Fazer em Caso de Vazamento Acidental

Se você perceber que subiu um arquivo contendo dados sensíveis para o GitHub:

1. **Não entre em pânico, mas aja rápido:**
2. **Remova o arquivo do rastreamento do Git** (mantendo-o localmente):
   ```bash
   git rm --cached nome_do_arquivo_sensivel
   ```
3. **Adicione o arquivo ao `.gitignore`** (se ainda não estiver).
4. **Faça um commit com a remoção:**
   ```bash
   git commit -m "chore: remove arquivo sensível rastreado acidentalmente"
   ```
5. **Suba para o GitHub:**
   ```bash
   git push origin main
   ```
6. **Invalide (Revogue) a credencial:** Remover do Git não apaga o histórico! Se foi uma chave de API ou senha de servidor vazada, você **deve** ir ao painel do serviço (ex: OpenAI) e **excluir/revogar** a chave imediatamente, gerando uma nova.

## 5. Boas Práticas Adicionais

- **Exemplos Seguros:** Se precisar mostrar como um arquivo de configuração deve ser estruturado, crie um arquivo com sufixo de exemplo, como `.env.example` ou `config.example.json`, contendo apenas dados fictícios (ex: `API_KEY=sua_chave_aqui`).
- **Mantenha o Ollama Seguro:** O Ollama roda localmente (localhost:11434). Embora não precise de chaves de API por padrão, garanta que suas requisições fetch apontem apenas para endereços genéricos de loopback (`127.0.0.1` ou `localhost`), sem expor sua rede local à internet sem necessidade.
