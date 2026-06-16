# Guia de Contribuição - TorAI

Obrigado pelo seu interesse em contribuir para o **TorAI**! Toda ajuda é muito bem-vinda para tornar esta extensão mais segura, eficiente e amigável para todos.

Abaixo estão as diretrizes principais para manter o projeto organizado e seguro.

## 1. Regras de Ouro de Segurança 🔒

Como esta é uma extensão focada em privacidade e para o ecossistema Tor, segurança é nossa prioridade máxima.

Antes de qualquer contribuição:
1. Leia o nosso [Protocolo de Segurança](documentacao/protocolo-seguranca.md).
2. **NUNCA** faça commit de:
   - Caminhos e diretórios locais da sua máquina.
   - Chaves de API, arquivos `.env` ou configurações de ambiente (`config.json`).
   - IPs ou informações de nós do Tor.
3. O código **nunca** deve fazer requisições externas para a internet, apenas para `localhost` / `127.0.0.1` (comunicação com a LLM local).

## 2. Configurando o Ambiente de Desenvolvimento

### Pré-requisitos
- Node.js (18+ recomendado)
- npm

### Passos
1. Faça um Fork deste repositório.
2. Clone para sua máquina:
   ```bash
   git clone https://github.com/SEU-USUARIO/tor-ai-extension.git
   ```
3. Instale as dependências:
   ```bash
   npm install
   ```
4. Gere o build de desenvolvimento:
   ```bash
   npm run build
   ```
   *(Os arquivos gerados irão para a pasta `dist/`)*.

## 3. Estrutura do Projeto

- `/src/background/`: Lógica principal, requisições seguras para a LLM e orquestração.
- `/src/sidebar/` e `/src/popup/`: Interfaces de usuário. O código manipula o DOM puramente usando Vanilla JS / TypeScript, com IIFEs geradas pelo esbuild.
- `/documentacao/`: Documentações de arquitetura, relatórios de correção e histórico de desenvolvimento.

## 4. Fazendo Commits

Se você estiver em um ambiente Windows, recomendamos usar o script nativo para empacotar suas mudanças de forma padronizada.

- Basta rodar o arquivo `push_to_github.bat` para automatizar a verificação, criação do commit com mensagem semântica e push.
- Se preferir usar o Git manualmente, certifique-se de seguir as [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) (ex: `feat: adiciona botão de atalho`, `fix: corrige timeout no ollama`).

## 5. Como Enviar um Pull Request (PR)

1. Crie uma branch com o nome da sua feature ou correção (`git checkout -b feature/minha-feature`).
2. Faça os commits seguindo as regras acima.
3. Envie a branch para o seu fork (`git push origin feature/minha-feature`).
4. Abra um Pull Request no repositório oficial.
5. Na descrição do seu PR, explique detalhadamente o que foi alterado e como foi testado.

## 6. Reportando Bugs ou Sugerindo Funcionalidades

Use a aba de **Issues** no GitHub. Por favor, forneça o máximo de informações possível:
- Qual sistema operacional e versão do Tor Browser.
- Se estava usando Ollama ou LM Studio.
- O modelo em uso.
- Passos para reproduzir o erro.

---

Agradecemos imensamente o seu tempo e dedicação para contribuir com código aberto e com a privacidade dos usuários!
