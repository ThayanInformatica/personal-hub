# Personal Hub

Hub pessoal rodando localmente em Docker. Inclui:

- **Dashboard** — visao geral
- **CS2** — miras e configs
- **Lembretes** — avisos via WhatsApp (Evolution API)
- **Cofre** — links, snippets, notas

Stack: Next.js 15, Prisma, Postgres, Redis, Evolution API, worker Node + node-cron.

## Setup

```bash
cp .env.example .env
# Edite .env: HUB_PASSWORD (senha do site), NEXTAUTH_SECRET (openssl rand -base64 32),
# WHATSAPP_TO (seu numero: 5511999999999), EVOLUTION_API_KEY (gera qualquer string forte)

docker compose up -d --build
```

Serviços:
- App: <http://localhost:3000>
- Evolution Manager: <http://localhost:8080/manager>
- Postgres: localhost:5433

## Parear WhatsApp (Evolution API)

1. Abra <http://localhost:8080/manager> e cole sua `EVOLUTION_API_KEY` quando pedir.
2. Crie a instância (caso ainda não exista) com o nome definido em `EVOLUTION_INSTANCE` (padrão: `hub`):

   ```bash
   curl -X POST http://localhost:8080/instance/create \
     -H "apikey: $EVOLUTION_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{"instanceName":"hub","integration":"WHATSAPP-BAILEYS","qrcode":true}'
   ```

3. Pegue o QR code:

   ```bash
   curl http://localhost:8080/instance/connect/hub -H "apikey: $EVOLUTION_API_KEY"
   ```

   Ou use a UI do manager. Escaneie com o WhatsApp do celular.

4. Teste o envio (opcional):

   ```bash
   curl -X POST http://localhost:8080/message/sendText/hub \
     -H "apikey: $EVOLUTION_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{"number":"5511999999999","text":"ping"}'
   ```

## Primeiro acesso

1. Abra <http://localhost:3000> — entra na tela de login.
2. Digite a `HUB_PASSWORD` definida no `.env`.
3. Vá em **Lembretes → Novo lembrete**.
4. Crie um para `dueAt` daqui 2 minutos. O worker checa a cada minuto e dispara.
5. Para recorrência, marque "Recorrente" e use cron:
   - `0 9 5 * *` — todo dia 5 às 9h (pagamento mensal)
   - `0 10 * * 1` — toda segunda às 10h
   - `30 8 * * 1-5` — dias úteis 8h30

Também tem botão **Testar envio** em cada lembrete para validar a integração.

## Estrutura

```
personal-hub/
├── app/          # Next.js (UI + API)
├── worker/       # Node-cron que envia lembretes
├── db/init/      # SQL inicial (cria DB do Evolution)
├── docker-compose.yml
└── .env.example
```

Schema Prisma é compartilhado por cópia entre `app/prisma/schema.prisma` e `worker/prisma/schema.prisma`. Se mudar um, atualize o outro.

## Comandos uteis

```bash
# Logs
docker compose logs -f app worker

# Reiniciar so o worker
docker compose restart worker

# Rebuild apos mudar schema
docker compose up -d --build app worker

# Conectar no banco
docker compose exec db psql -U hub -d hub
```
