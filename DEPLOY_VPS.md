# 🚀 Como Fazer o Deploy do JusCore AI na VPS

Siga este guia simples para colocar seu sistema no ar usando os arquivos Docker que acabamos de criar.

## 1. Acesse sua VPS

Abra o seu terminal (Prompt de Comando ou PowerShell) e conecte-se à sua hospedagem (VPS):

```bash
ssh root@SEU_IP_DA_VPS
```

> Substitua `SEU_IP_DA_VPS` pelo IP da máquina no painel.

## 2. Instale o Docker (se ainda não tiver)

Execute os comandos abaixo na sua VPS Ubuntu/Debian para garantir tudo instalado:

```bash
# Atualize os pacotes do sistema
apt-get update && apt-get upgrade -y

# Instale o script oficial do Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Instale o pacote oficial Docker Compose
apt-get install docker-compose-plugin -y
```

## 3. Envie os arquivos para a VPS

Você precisa copiar toda a pasta do projeto `v1.6.5_anty` para a VPS. Você pode usar ferramentas como `FileZilla` (via SFTP com senha/chave root), ou via terminal com `scp`.
Certifique-se de que a pasta foi copiada e tem o arquivo `backend/.env` configurado.

## 4. Suba o Servidor

No terminal da VPS, navegue até a raiz do seu projeto (onde está o arquivo `docker-compose.yml` que eu criei para você):

```bash
cd /caminho/do/seu/projeto/v1.6.5_anty
```

Inicie os containers com este comando:

```bash
docker compose up -d --build
```

**O que este comando faz?**
Ele constrói a versão de produção do backend instalando todos os módulos (Node.js). Em seguida, ele compila todo o Frontend (Vite) e coloca em um servidor Nginx hyper-rápido.
A primeira vez poderá demorar vários minutos para concluir todos os donwloads e a compilação.

## 5. Verifique a Saúde

Para confirmar quais containers estão rodando online, digite:

```bash
docker compose ps
```

Se estiver como `Up`, deu certo! A aplicação deve estar acessível pelo navegador pelo seu IP `http://SEU_IP_DA_VPS` (na porta 80).

### Lidando com erros

Se algo da errado e for preciso ver o log do Servidor Backend para saber o porquê:

```bash
docker compose logs -f backend
```

Se o Nginx do Frontend apresentar algum erro ao carregar:

```bash
docker compose logs -f frontend
```
