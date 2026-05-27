# Deploy no Dokploy + PWA no iPhone

Guia completo pra rodar o Personal Hub na sua máquina remota com Dokploy e ter ele como app no iPhone.

## Visão geral

```
iPhone (Safari → Add to Home Screen)
   │ HTTPS
   ▼
Dokploy Traefik (sua máquina)
   ├─ hub.seudominio.com  → app (Next.js)
   └─ evo.seudominio.com  → evolution (WhatsApp)
            │
            ▼
   Internal Docker network "hub":
     ├─ db (Postgres)
     ├─ redis
     ├─ worker (cron)
```

---

## Parte 1 — Deploy no Dokploy

### Pré-requisitos

- Dokploy instalado e rodando na sua máquina (`http://maquina:3000` ou similar)
- Domínio com DNS apontando pra IP público da máquina (registros A):
  - `hub.seudominio.com` → IP da máquina
  - `evo.seudominio.com` → mesmo IP (opcional, só se quiser acessar Evolution Manager fora)
- Repositório Git com o código (GitHub/GitLab privado funciona)

### Passo 1 — Subir código pra um repo

Na sua máquina local:

```bash
cd /Users/thayan/Projetos/personal-hub
git init
git add .
git commit -m "Personal Hub initial"
# crie um repo privado no GitHub e:
git remote add origin git@github.com:seu-user/personal-hub.git
git branch -M main
git push -u origin main
```

> ⚠️ O `.env` está no `.gitignore` — segredos NÃO vão pro repo. Você vai configurar via Dokploy UI.

### Passo 2 — Criar projeto no Dokploy

1. Abre Dokploy → **+ Create Project** → nome `personal-hub`
2. Dentro do projeto → **+ Create Service** → tipo **Compose**
3. **Source**: Git → cola URL do repo + branch `main`
4. **Compose Path**: `docker-compose.dokploy.yml`
5. **Compose Type**: `docker-compose`

### Passo 3 — Configurar Environment

Em **Environment** do serviço Compose, cola (ajustando valores):

```env
POSTGRES_USER=hub
POSTGRES_PASSWORD=use-openssl-rand-hex-24
POSTGRES_DB=hub

HUB_PASSWORD=sua-senha-de-login
NEXTAUTH_SECRET=use-openssl-rand-base64-32

EVOLUTION_API_KEY=use-openssl-rand-hex-24
EVOLUTION_INSTANCE=hub
WHATSAPP_TO=5561999999999

ANTHROPIC_API_KEY=sk-ant-api03-...
EXA_API_KEY=...

HUB_DOMAIN=hub.seudominio.com
COMPOSE_PROJECT_NAME=hub
```

> 💡 Gera segredos: `openssl rand -base64 32` e `openssl rand -hex 24`.

### Passo 4 — Configurar Domínios (Traefik)

Em **Domains** do serviço Compose, adiciona:

| Service | Host | Port | HTTPS |
|---|---|---|---|
| `app` | `hub.seudominio.com` | 3000 | ✓ (Let's Encrypt) |
| `evolution` (opcional) | `evo.seudominio.com` | 8080 | ✓ |

> Os labels Traefik no compose já estão configurados, mas o Dokploy também permite via UI. Use uma das duas formas.

### Passo 5 — Deploy

1. Salva tudo
2. Clica **Deploy**
3. Acompanha os logs em **Logs**

Primeira build demora ~3-5 min (Next.js + Prisma + worker). Próximas: ~1-2 min.

### Passo 6 — Verificar

- Abre `https://hub.seudominio.com` → tela de login do hub
- Login com a `HUB_PASSWORD` do .env

Se der erro:
- **502 Bad Gateway**: app ainda buildando. Espera mais 1-2 min.
- **Cert error**: DNS ainda propagando. Espera 5 min + Force HTTPS no Dokploy.
- **App não conecta no banco**: check logs do app pra ver erro de Prisma.

---

## Parte 2 — Parear WhatsApp via Evolution

1. Abre `https://evo.seudominio.com/manager` (ou usa subpath se configurou)
2. Login com a `EVOLUTION_API_KEY`
3. Cria instância com nome `hub`
4. Pega QR code → escaneia com WhatsApp do celular
5. Confere status `open` (conectado)
6. Volta no app → Settings → testa envio

---

## Parte 3 — Instalar como app no iPhone (PWA)

**Importante:** precisa ser **Safari** no iOS. Chrome não suporta "Add to Home Screen" como PWA real.

### Passos

1. No iPhone, abre **Safari**
2. Acessa `https://hub.seudominio.com`
3. Faz login com sua `HUB_PASSWORD`
4. Toca no ícone de **Compartilhar** (quadrado com seta pra cima, no rodapé)
5. Rola até **Adicionar à Tela de Início** / **Add to Home Screen**
6. Edita o nome se quiser (sai como "Hub" por default)
7. **Adicionar**

Ícone aparece na tela inicial do iPhone. Toca pra abrir → abre **fullscreen sem barra do Safari**, igual app nativo.

### O que funciona como PWA

✅ **Funciona:**
- Login persistente (cookie httpOnly)
- Todas as features do hub
- Microfone (Web Speech API) → chat por voz
- Síntese de voz → IA responde falando
- Notificações in-app
- Layout mobile responsivo (chat voice-first)
- Offline cache parcial dos assets

⚠️ **Limitações no iOS:**
- Push notifications nativas precisam iOS 16.4+ e config extra (não habilitado por padrão)
- App reseta após ~7 dias sem uso (iOS purge agressivo)
- Sem acesso a câmera nativa do iOS (Web API tem, mas com UX inferior)

---

## Parte 4 — Atualizações futuras

Quando mudar o código:

```bash
cd personal-hub
git add .
git commit -m "feat: nova feature X"
git push
```

No Dokploy: **Redeploy** (botão) ou configura **auto-deploy on push** em Settings do projeto.

---

## Troubleshooting

### "Cert não emite"
- Confirma DNS: `dig hub.seudominio.com` deve retornar IP da máquina
- Portas 80 e 443 abertas no firewall da máquina
- Dokploy → Traefik → status: deve estar `OK`

### "Worker não dispara WhatsApp"
- `docker compose logs worker` na máquina (via Dokploy Logs do serviço)
- Verifica que Evolution está pareada
- Verifica que `WHATSAPP_TO` tá no .env com formato `5561999999999` (DDI+DDD+número, só dígitos)

### "Chat IA falando que tá em stub mode"
- `ANTHROPIC_API_KEY` não foi carregada
- Em Dokploy → Environment, confirma que tá lá → Save → Redeploy

### "PWA não atualiza"
- Service worker faz cache. Pra forçar update:
  - No iPhone: deleta o ícone da home, abre Safari novamente, adiciona de novo
  - Ou: aumenta `CACHE` em `app/public/sw.js` antes do próximo deploy

### "Acessar Evolution sem expor domínio público"
- Comenta os labels de Traefik do serviço `evolution` no compose
- Acessa via SSH tunnel: `ssh -L 8080:localhost:8080 user@maquina` e abre `localhost:8080/manager`

---

## Backup e restore

### Backup Postgres

```bash
docker exec -t $(docker ps -qf "name=db") pg_dump -U hub hub | gzip > backup-$(date +%Y%m%d).sql.gz
```

### Restore

```bash
gunzip -c backup-X.sql.gz | docker exec -i $(docker ps -qf "name=db") psql -U hub hub
```

Pode automatizar criando um cron no host que roda isso 1x/dia e manda pra um S3/Backblaze/etc.
