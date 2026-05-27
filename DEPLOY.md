# Deploy em VPS

Guia pra rodar o Personal Hub em uma VPS própria com HTTPS automático.

## Pré-requisitos

- VPS Linux (Ubuntu/Debian) com IP público
- Domínio que você controla (ex: `seudominio.com`)
- Subdomínio criado apontando pro IP da VPS — registro A:
  ```
  hub.seudominio.com.   A   1.2.3.4
  ```
- 2GB RAM mínimo (Postgres + Evolution + app + worker + caddy)

## 1. Provisionar a VPS

```bash
ssh root@<IP-DA-VPS>

# Atualiza sistema
apt update && apt upgrade -y

# Instala Docker
curl -fsSL https://get.docker.com | sh
systemctl enable --now docker

# Firewall basico (libera 22/80/443)
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
```

## 2. Clonar e configurar

```bash
git clone <url-do-seu-repo> /opt/personal-hub
cd /opt/personal-hub

cp .env.example .env
nano .env
```

Edite o `.env` colocando valores reais:

```
POSTGRES_USER=hub
POSTGRES_PASSWORD=<senha forte aleatoria>
POSTGRES_DB=hub

HUB_PASSWORD=<sua senha de login>
NEXTAUTH_SECRET=<openssl rand -base64 32>

EVOLUTION_API_KEY=<senha forte aleatoria>
EVOLUTION_INSTANCE=hub
WHATSAPP_TO=5511999999999

ANTHROPIC_API_KEY=sk-ant-...

# Producao
HUB_DOMAIN=hub.seudominio.com
CADDY_EMAIL=voce@email.com
```

> 💡 Gerar segredos rapidamente:
> ```bash
> openssl rand -base64 32   # NEXTAUTH_SECRET
> openssl rand -hex 24      # POSTGRES_PASSWORD, EVOLUTION_API_KEY
> ```

## 3. Subir com HTTPS automático

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

O `docker-compose.prod.yml` adiciona o **Caddy** como reverse proxy e **remove as portas expostas** do app/db/evolution (eles passam a ser acessíveis só pela rede interna do compose, via Caddy).

Caddy automaticamente:
- Pede certificado Let's Encrypt na primeira request
- Renova sozinho
- Redireciona HTTP → HTTPS
- Aplica HTTP/3

## 4. Verificar

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml ps
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs -f caddy
```

Abre `https://hub.seudominio.com` no navegador — login com `HUB_PASSWORD`.

Evolution Manager fica em `https://hub.seudominio.com/manager`.

## 5. Instalar como PWA no iPhone

1. Abre `https://hub.seudominio.com` no **Safari** (não funciona no Chrome iOS).
2. Faz login.
3. Toca no botão de Compartilhar (quadrado com seta).
4. **Adicionar à Tela de Início**.
5. Ícone aparece na home — abre fullscreen, parece app nativo.

A página padrão da PWA é `/chat` (voice-first em mobile).

## 6. Atalho do Siri / Apple Watch

Cria uma Shortcut no iPhone:

1. App Atalhos → Novo Atalho
2. Adiciona ação **"Pedir entrada"** → Tipo: Texto → Pergunta: "Como posso ajudar?"
3. Adiciona ação **"Obter conteúdo de URL"**:
   - URL: `https://hub.seudominio.com/api/chat`
   - Método: POST
   - Headers:
     - `Content-Type: application/json`
     - `Cookie: hub_session=<copia-da-cookie-do-Safari-apos-login>`
   - Corpo do request (JSON):
     ```json
     {"content": "<Texto fornecido>"}
     ```
4. Adiciona **"Obter valor do dicionário"** → Chave: `message.content`
5. Adiciona **"Falar"** com o valor anterior
6. Renomeia o atalho pra "Hub IA"

Pronto: *"Ei Siri, Hub IA"* funciona no iPhone E no Apple Watch (a Shortcut sincroniza).

Pra pegar a cookie: faz login no Safari, abre o **Inspetor Web** (Mac conectado via cabo), pega o valor do cookie `hub_session`.

## Comandos uteis

```bash
# Logs ao vivo
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs -f

# Reiniciar so o app
docker compose -f docker-compose.yml -f docker-compose.prod.yml restart app

# Rebuild apos pull
git pull
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build

# Backup do banco
docker compose exec db pg_dump -U hub hub > backup-$(date +%Y%m%d).sql

# Restore
cat backup-X.sql | docker compose exec -T db psql -U hub hub

# Renovar cert manualmente (raro)
docker compose -f docker-compose.yml -f docker-compose.prod.yml exec caddy caddy reload --config /etc/caddy/Caddyfile
```

## Troubleshooting

**Cert não emite:**
- Confirma que `hub.seudominio.com` resolve pro IP da VPS: `dig hub.seudominio.com`
- Portas 80 e 443 estão abertas no firewall e não bloqueadas pelo provedor.
- Olha logs do Caddy: `docker compose logs caddy`.

**Login funciona mas chat fala "modo stub":**
- Verifica `docker compose exec app sh -c 'echo $ANTHROPIC_API_KEY | head -c 20'`.
- Se vier vazio, conferir o `.env` e reiniciar: `docker compose up -d --force-recreate app`.

**WhatsApp não envia:**
- Sessão Evolution caiu — abre `/settings` no app, gera novo QR.

**PWA não atualiza versão nova:**
- iOS guarda agressivo. Limpa cache do Safari ou aumenta versão do `CACHE` em `app/public/sw.js`.
