# 🚀 Deploy no Coolify (Painel da VPS)

Existem duas formas de colocar o seu projeto (`docker-compose.yml`) no Coolify: a recomendada (usando o GitHub) ou a manual (usando "Docker Compose Empty").

Como o nosso projeto compila imagens locais (`build: ./frontend` e `build: ./backend`), **o método 1 é altamente recomendado**, pois o Coolify cuida de todo o download e atualização do código.

---

## Métódo 1: Via GitHub (Recomendado 🌟)

Esta é a opção **"Private Repository (with GitHub App)"** que aparece na sua tela.

1. Suba todo o seu código para um repositório Privado no seu GitHub.
2. No painel do Coolify, clique em **Private Repository (with GitHub App)**.
3. Autorize o aplicativo do Coolify no seu GitHub e selecione o seu repositório.
4. O Coolify vai ler automaticamente o arquivo `docker-compose.yml` que acabamos de criar na raiz.
   - _Atenção:_ Em "Environment Variables" dentro do serviço `juscore_backend` no Coolify, adicione todas as suas chaves do arquivo `.env` para o banco de dados e Asaas!
5. Clique em **Deploy**!
   - _Vantagem:_ Toda vez que você fizer alterações no seu PC e mandar pro GitHub (`git push`), o Coolify vai atualizar o servidor sozinho!

---

## Método 2: Via "Docker Compose Empty" (Manual)

Se você não quer usar o GitHub e já transferiu a pasta `v1.6.5_anty - Copia` inteira para a VPS via terminal, você terá que referenciar essas pastas manualmente.

1. No painel, clique em **Docker Compose Empty**.
2. Cole todo o contéudo do arquivo `docker-compose.yml`.
3. **Problema:** O Coolify não vai achar as pastas `./backend` e `./frontend` se os arquivos do projeto não estiverem na pasta raiz do serviço gerado pelo Coolify.
4. **Solução:** Pelo terminal da sua VPS, você terá que copiar as pastas `backend` e `frontend` para a pasta de dados do Coolify recém-gerada (algo como `/data/coolify/services/xxxxx`), e só então apertar **Deploy** no painel do Coolify.

---

### Redes e Portas no Coolify

Eu **atualizei** o `docker-compose.yml` removendo as portas manuais (`80:80` e `3000:3000`). Isso foi fundamental porque o Coolify já tem um gerenciador de tráfego embutido (chamado Traefik) rodando na porta 80 e 443.

Agora, bastará ir nas configurações do serviço `juscore_frontend` gerado lá no painel do Coolify e preencher a caixa **Domains** com o seu site (ex: `http://juscore.net`). O próprio painel roteará qualquer acesso milagrosamente para o container Docker sem gerar erro de "porta ocupada".
