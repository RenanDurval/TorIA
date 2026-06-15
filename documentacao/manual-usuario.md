# 📖 Manual do Usuário — TorAI

Este manual orienta você no processo de configuração do seu provedor de inteligência artificial local (Ollama ou LM Studio) e na utilização de todas as funcionalidades da extensão **TorAI** com segurança e privacidade total.

---

## 1. Configurando o Provedor de IA Local

A extensão TorAI não possui um modelo de linguagem integrado por padrão. Ela precisa se comunicar com uma ferramenta que execute o modelo no seu computador. Escolha uma das duas opções abaixo:

### Opção A: Ollama (Recomendada pela facilidade)
O Ollama é uma ferramenta leve executada em plano de fundo no sistema operacional.

1. Acesse [ollama.com](https://ollama.com) e faça o download para Windows.
2. Execute o instalador baixado. O Ollama rodará silenciosamente no canto da barra de tarefas (ícone de uma lhama).
3. Abra o seu Prompt de Comando (cmd) ou PowerShell e baixe um modelo leve e otimizado (ex: Llama 3.2 de 3 bilhões de parâmetros):
   ```bash
   ollama run llama3.2
   ```
4. Após o término do download, você pode digitar perguntas no terminal para testar, ou fechar o terminal (o serviço continuará rodando).

> [!IMPORTANT]
> **Configurando CORS no Windows (Essencial para Extensões)**:
> Por padrão, o Ollama pode recusar conexões vindas de extensões de navegadores devido a políticas de CORS.
> 1. No Windows, clique com o botão direito no ícone do Ollama na barra de tarefas e selecione **Quit Ollama**.
> 2. Abra o menu iniciar do Windows, pesquise por "Variáveis de Ambiente" e clique em "Editar as variáveis de ambiente do sistema".
> 3. Na janela que abrir, clique no botão **Variáveis de Ambiente**.
> 4. Na seção "Variáveis de Usuário", clique em **Novo...**.
> 5. Defina o Nome da variável como `OLLAMA_ORIGINS` e o Valor da variável como `*`.
> 6. Clique em OK em todas as janelas.
> 7. Abra o aplicativo Ollama novamente pelo menu iniciar para recarregar com as novas configurações.

---

### Opção B: LM Studio (Recomendado para quem quer interface gráfica)
O LM Studio oferece uma interface visual rica para baixar e catalogar diversos modelos da comunidade.

1. Baixe a versão para Windows em [lmstudio.ai](https://lmstudio.ai).
2. Execute o instalador e abra o aplicativo.
3. No painel de pesquisa do LM Studio (ícone de lupa), pesquise por um modelo recomendado (exemplo: `Llama 3.2 3B Instruct`) e faça o download do arquivo `.gguf`.
4. Vá para a aba de **Servidor Local** (ícone de tomada / plugue na barra lateral esquerda).
5. No topo, selecione o modelo baixado no dropdown.
6. Na barra lateral direita, confirme se a porta está configurada para `1234`.
7. Clique em **Start Server** (Iniciar Servidor). A caixa de logs mostrará que o servidor está escutando em `http://localhost:1234`.

---

## 2. Instalando a Extensão no Tor Browser

Para carregar a extensão e começar a utilizá-la de forma privada:

1. Abra o **Tor Browser**.
2. Na barra de endereço, digite `about:debugging` e pressione Enter.
3. No menu lateral esquerdo, clique em **Este Firefox** (ou *This Firefox*).
4. Clique no botão **Carregar extensão temporária...** (ou *Load Temporary Add-on...*).
5. Navegue até a pasta onde salvou o projeto, entre na pasta `dist/` (ou onde os arquivos finais foram gerados) e selecione o arquivo **`manifest.json`**.
6. O ícone do **TorAI** aparecerá no canto superior direito do navegador.

---

## 3. Como Utilizar a Extensão

### 3.1 Conexão Inicial
1. Clique no ícone do **TorAI** para abrir o popup.
2. Selecione se deseja usar o **Ollama** ou **LM Studio**.
3. Clique em **Conectar**. O indicador no topo mudará de vermelho (Desconectado) para verde (Conectado).
4. No dropdown de modelos, selecione o modelo de IA que você deseja utilizar.
5. Se desejar, ajuste os parâmetros avançados (Temperatura: maior = mais criativa; Max Tokens: limite do tamanho da resposta).

### 3.2 Usando o Painel Lateral (Sidebar)
O painel lateral é o local principal de trabalho. Você pode abri-lo pressionando a combinação de teclas **`Ctrl+Shift+A`** ou clicando no botão **Abrir Painel** dentro do popup da extensão.

O painel é dividido em 5 abas principais:
1. **📝 Resumo**: Clique para gerar o resumo da página. Use o interruptor no topo para alterar entre Resumo Curto (ideal para leitura rápida de 2-3 frases) ou Resumo Detalhado (5-8 frases com marcadores).
2. **🌐 Tradução**: Selecione um dos 11 idiomas disponíveis (Português, Inglês, Espanhol, Francês, Alemão, Italiano, Mandarim, Japonês, Coreano, Russo ou Árabe) e clique em Traduzir.
3. **💡 Dicas**: Receba uma análise da página web contendo até 5 dicas rápidas divididas em: Dicas de Usabilidade, Dicas de Segurança Offline e Recomendações de Leitura.
4. **🏷️ Entidades**: Extrai do conteúdo da página metadados chave como: Autores da página, Título do Documento, Links Importantes, Datas e Palavras-chave.
5. **✂️ Trecho**: Selecione um parágrafo ou frase da página atual com o mouse. Abra esta aba para ver o texto selecionado e escolha uma ação específica (Resumir Trecho, Traduzir Trecho ou Explicar Trecho).

---

## 4. Resolução de Problemas Comuns

### "Não foi possível conectar ao provedor"
- **Para Ollama**: Certifique-se de ter configurado a variável de ambiente `OLLAMA_ORIGINS` como `*` e reiniciado o Ollama. Caso contrário, a segurança do navegador impedirá a requisição.
- **Para LM Studio**: Verifique se o botão "Start Server" foi pressionado e a luz de status está verde.
- Verifique se a porta configurada no popup condiz com o padrão do seu servidor (`11434` para Ollama e `1234` para LM Studio).

### "Resposta lenta / Travando"
- Modelos maiores que 7 bilhões de parâmetros (ex: Llama-3 8B, Gemma-2 9B) exigem pelo menos 16 GB de RAM e uma GPU dedicada. Caso sua máquina possua 8 GB de RAM ou menos, utilize o modelo **Llama 3.2 1B ou 3B** ou **Qwen 2.5 1.5B/3B**, que rodam de forma muito mais rápida.
