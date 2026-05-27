'use client';

import { useEffect, useState } from 'react';
import { RefreshCw, Power, Smartphone, Copy, Save, AlertCircle, CheckCircle2 } from 'lucide-react';

type Status = {
  config: { instance: string; targetNumber: string; baseUrl: string };
  exists: boolean;
  state: string | null;
};

const CRON_PRESETS: { label: string; expr: string; description: string }[] = [
  { label: 'Todo dia 5 às 9h', expr: '0 9 5 * *', description: 'Boletos mensais que vencem dia 5' },
  { label: 'Todo dia 10 às 9h', expr: '0 9 10 * *', description: 'Cartão de crédito típico' },
  { label: 'Toda segunda 10h', expr: '0 10 * * 1', description: 'Review semanal' },
  { label: 'Dias úteis 8h30', expr: '30 8 * * 1-5', description: 'Bom dia trabalho' },
  { label: 'Todo dia 22h', expr: '0 22 * * *', description: 'Daily diário' },
  { label: 'Todo domingo 20h', expr: '0 20 * * 0', description: 'Planejamento da semana' },
  { label: 'A cada 30 min', expr: '*/30 * * * *', description: 'Lembretes frequentes' }
];

export function SettingsClient({
  initialTemplate
}: {
  initialTemplate: { prefix?: string; signature?: string } | null;
}) {
  const [tab, setTab] = useState<'whatsapp' | 'cron' | 'templates' | 'system'>('whatsapp');
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 border-b border-border/60">
        {[
          { id: 'whatsapp', label: 'WhatsApp' },
          { id: 'cron', label: 'Presets de cron' },
          { id: 'templates', label: 'Templates de mensagem' },
          { id: 'system', label: 'Sistema' }
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as any)}
            className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
              tab === t.id ? 'border-foreground text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
            data-testid={`settings-tab-${t.id}`}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tab === 'whatsapp' && <WhatsappPanel />}
      {tab === 'cron' && <CronPanel />}
      {tab === 'templates' && <TemplatesPanel initial={initialTemplate} />}
      {tab === 'system' && <SystemPanel />}
    </div>
  );
}

function WhatsappPanel() {
  const [status, setStatus] = useState<Status | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  async function refresh() {
    setLoading(true);
    setMsg(null);
    const r = await fetch('/api/settings/evolution/status').then((r) => r.json()).catch(() => null);
    setStatus(r);
    setLoading(false);
  }

  async function fetchQr() {
    setBusy('qr');
    setMsg(null);
    const r = await fetch('/api/settings/evolution/qr').then((r) => r.json()).catch(() => null);
    setBusy(null);
    if (r?.code) {
      setQr(r.code);
    } else {
      setMsg({ kind: 'err', text: 'Não consegui pegar o QR. Tente criar a instância primeiro.' });
    }
  }

  async function createInstance() {
    setBusy('create');
    setMsg(null);
    const r = await fetch('/api/settings/evolution/instance', { method: 'POST' });
    setBusy(null);
    if (r.ok) {
      setMsg({ kind: 'ok', text: 'Instância criada. Clique em "Gerar QR".' });
      refresh();
    } else {
      const body = await r.json().catch(() => ({}));
      setMsg({ kind: 'err', text: `Falha: ${body?.message ?? body?.error ?? JSON.stringify(body)}` });
    }
  }

  async function logout() {
    if (!confirm('Desconectar WhatsApp?')) return;
    setBusy('logout');
    await fetch('/api/settings/evolution/logout', { method: 'POST' });
    setBusy(null);
    setQr(null);
    refresh();
  }

  async function testSend() {
    setBusy('test');
    setMsg(null);
    const r = await fetch('/api/settings/evolution/test', { method: 'POST' }).then((r) => r.json()).catch(() => null);
    setBusy(null);
    setMsg({ kind: r?.ok ? 'ok' : 'err', text: r?.ok ? 'Mensagem enviada!' : `Falha: ${r?.error ?? 'erro'}` });
  }

  useEffect(() => { refresh(); }, []);

  const state = status?.state;
  const connected = state === 'open';

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border/60 bg-card/40 p-5" data-testid="whatsapp-panel">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Smartphone className="h-4 w-4" />
              <h2 className="font-semibold">Conexão WhatsApp</h2>
            </div>
            <div className="mt-3 space-y-1 text-sm">
              <Row label="Instância">{status?.config.instance ?? '...'}</Row>
              <Row label="Número alvo">{status?.config.targetNumber || <em className="text-muted-foreground">não configurado</em>}</Row>
              <Row label="Status">
                <span
                  className={
                    connected ? 'text-green-400' : state ? 'text-yellow-400' : 'text-muted-foreground'
                  }
                  data-testid="wa-state"
                >
                  {loading ? '...' : connected ? 'conectado' : state ?? (status?.exists ? 'aguardando QR' : 'instância não criada')}
                </span>
              </Row>
            </div>
          </div>
          <button onClick={refresh} className="rounded-md border border-border/40 p-2 hover:bg-accent/40" title="Atualizar">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {msg && (
          <div
            className={`mt-3 flex items-center gap-2 rounded-md p-2 text-xs ${
              msg.kind === 'ok' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
            }`}
          >
            {msg.kind === 'ok' ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
            {msg.text}
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          {!status?.exists && (
            <button
              onClick={createInstance}
              disabled={busy === 'create'}
              className="rounded-md bg-foreground px-3 py-2 text-sm font-medium text-background disabled:opacity-50"
              data-testid="wa-create"
            >
              {busy === 'create' ? 'Criando...' : 'Criar instância'}
            </button>
          )}
          {status?.exists && !connected && (
            <button
              onClick={fetchQr}
              disabled={busy === 'qr'}
              className="rounded-md bg-foreground px-3 py-2 text-sm font-medium text-background disabled:opacity-50"
              data-testid="wa-qr"
            >
              {busy === 'qr' ? 'Gerando...' : qr ? 'Atualizar QR' : 'Gerar QR'}
            </button>
          )}
          {connected && (
            <>
              <button
                onClick={testSend}
                disabled={busy === 'test'}
                className="rounded-md bg-foreground px-3 py-2 text-sm font-medium text-background disabled:opacity-50"
              >
                {busy === 'test' ? 'Enviando...' : 'Testar envio'}
              </button>
              <button
                onClick={logout}
                disabled={busy === 'logout'}
                className="flex items-center gap-1 rounded-md border border-border/60 px-3 py-2 text-sm hover:bg-red-500/10 hover:text-red-400"
              >
                <Power className="h-3 w-3" /> Desconectar
              </button>
            </>
          )}
        </div>
      </div>

      {qr && !connected && (
        <div className="rounded-xl border border-border/60 bg-card/40 p-5">
          <h3 className="mb-3 font-semibold">Escaneie o QR com o WhatsApp</h3>
          <div className="flex flex-col items-start gap-3 md:flex-row">
            <img
              src={qr.startsWith('data:') ? qr : `data:image/png;base64,${qr}`}
              alt="QR Code"
              className="h-64 w-64 rounded-md border border-border/40 bg-white p-2"
              data-testid="wa-qr-img"
            />
            <ol className="list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
              <li>Abra o WhatsApp no celular</li>
              <li>Vá em <strong>Aparelhos conectados</strong></li>
              <li>Toque em <strong>Conectar um aparelho</strong></li>
              <li>Escaneie este QR</li>
              <li>Volte aqui e clique em <strong>Atualizar</strong></li>
            </ol>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right">{children}</span>
    </div>
  );
}

function CronPanel() {
  const [copied, setCopied] = useState<string | null>(null);
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border/60 bg-card/40 p-5">
        <h2 className="mb-2 font-semibold">Como funciona</h2>
        <p className="text-sm text-muted-foreground">
          Lembretes recorrentes usam expressões cron com 5 campos:{' '}
          <code className="rounded bg-muted/40 px-1">minuto hora dia-mês mês dia-semana</code>.
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Dia-semana: 0=domingo, 1=segunda, ..., 6=sábado. Use <code>*</code> para "qualquer".
        </p>
      </div>

      <div className="rounded-xl border border-border/60 bg-card/40 p-5">
        <h2 className="mb-3 font-semibold">Presets prontos</h2>
        <div className="grid gap-2 md:grid-cols-2">
          {CRON_PRESETS.map((p) => (
            <div key={p.expr} className="flex items-center justify-between rounded-md border border-border/40 p-3">
              <div>
                <p className="text-sm font-medium">{p.label}</p>
                <p className="text-xs text-muted-foreground">{p.description}</p>
                <code className="mt-1 inline-block rounded bg-muted/40 px-2 py-0.5 text-xs">{p.expr}</code>
              </div>
              <button
                onClick={() => { navigator.clipboard.writeText(p.expr); setCopied(p.expr); setTimeout(() => setCopied(null), 1500); }}
                className="rounded-md border border-border/40 p-2 hover:bg-accent/40"
                title="Copiar"
              >
                {copied === p.expr ? <CheckCircle2 className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TemplatesPanel({ initial }: { initial: { prefix?: string; signature?: string } | null }) {
  const [prefix, setPrefix] = useState(initial?.prefix ?? '🔔');
  const [signature, setSignature] = useState(initial?.signature ?? '');
  const [saved, setSaved] = useState(false);

  async function save() {
    await fetch('/api/settings/reminderTemplate', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prefix, signature })
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="rounded-xl border border-border/60 bg-card/40 p-5">
      <h2 className="mb-3 font-semibold">Template de mensagem</h2>
      <p className="mb-4 text-sm text-muted-foreground">
        Personalize como os lembretes aparecem no WhatsApp. O texto final fica: <code>prefixo título · corpo · assinatura</code>.
      </p>
      <div className="space-y-3">
        <label className="block space-y-1">
          <span className="text-xs font-medium text-muted-foreground">Prefixo (emoji)</span>
          <input className="hub-input" value={prefix} onChange={(e) => setPrefix(e.target.value)} maxLength={4} />
        </label>
        <label className="block space-y-1">
          <span className="text-xs font-medium text-muted-foreground">Assinatura (opcional)</span>
          <input className="hub-input" value={signature} onChange={(e) => setSignature(e.target.value)} placeholder="— Personal Hub" />
        </label>
        <div className="rounded-md border border-border/40 bg-muted/20 p-3 text-xs">
          <p className="mb-1 font-medium text-muted-foreground">Preview:</p>
          <pre className="whitespace-pre-wrap">{`${prefix} Pagamento Netflix\n\nVence hoje, R$ 39,90${signature ? `\n\n${signature}` : ''}`}</pre>
        </div>
        <button
          onClick={save}
          className="flex items-center gap-2 rounded-md bg-foreground px-3 py-2 text-sm font-medium text-background"
          data-testid="save-template"
        >
          <Save className="h-3 w-3" /> {saved ? 'Salvo!' : 'Salvar'}
        </button>
      </div>
    </div>
  );
}

function SystemPanel() {
  const [info, setInfo] = useState<Status | null>(null);
  useEffect(() => {
    fetch('/api/settings/evolution/status').then((r) => r.json()).then(setInfo).catch(() => {});
  }, []);
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border/60 bg-card/40 p-5">
        <h2 className="mb-3 font-semibold">Variáveis ativas</h2>
        <div className="space-y-2 text-sm">
          <Row label="Evolution URL">{info?.config.baseUrl ?? '...'}</Row>
          <Row label="Instância">{info?.config.instance ?? '...'}</Row>
          <Row label="Número WhatsApp">{info?.config.targetNumber ?? '...'}</Row>
          <Row label="Worker">a cada minuto (node-cron)</Row>
        </div>
      </div>
      <div className="rounded-xl border border-border/60 bg-card/40 p-5">
        <h2 className="mb-2 font-semibold">Logs do worker</h2>
        <p className="text-sm text-muted-foreground">
          Para ver no terminal: <code className="rounded bg-muted/40 px-1">docker compose logs -f worker</code>
        </p>
      </div>
    </div>
  );
}
