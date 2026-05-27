'use client';

import { useEffect, useState } from 'react';
import { Bell, BellPlus, Trash2, TrendingUp, RefreshCw, ExternalLink, AlertCircle } from 'lucide-react';
import { Sparkline } from '@/components/sparkline';

type WatchItem = {
  id: string;
  marketHashName: string;
  displayName: string | null;
  iconUrl: string | null;
  notes: string | null;
  currentPrice: { min: number | null; median: number | null; updatedAt: string } | null;
  alerts: { id: string; kind: string; threshold: number; windowDays: number | null; active: boolean }[];
  sparkline: number[];
};

type SourcePrice = {
  source: string;
  currency: string;
  min: number | null;
  median: number | null;
  url: string | null;
  updatedAt: string;
};

type HistorySeries = Record<string, { date: string; min: number | null; median: number | null }[]>;

function brl(n: number | null | undefined): string {
  if (n == null) return '—';
  return n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const SOURCE_LABEL: Record<string, string> = {
  steam: 'Steam Market',
  csfloat: 'CSFloat',
  skinport: 'Skinport'
};

const SOURCE_COLOR: Record<string, string> = {
  steam: 'border-blue-500/40 bg-blue-500/5',
  csfloat: 'border-purple-500/40 bg-purple-500/5',
  skinport: 'border-orange-500/40 bg-orange-500/5'
};

export function WatchlistTab() {
  const [items, setItems] = useState<WatchItem[]>([]);
  const [selected, setSelected] = useState<WatchItem | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const data = await fetch('/api/watchlist').then((r) => r.json()).catch(() => []);
    setItems(data);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function remove(id: string) {
    if (!confirm('Remover da watchlist?')) return;
    await fetch(`/api/watchlist/${id}`, { method: 'DELETE' });
    load();
  }

  if (loading) return <p className="text-sm text-muted-foreground">Carregando...</p>;

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border/60 p-8 text-center">
        <Bell className="mx-auto mb-2 h-6 w-6 text-muted-foreground" />
        <h3 className="font-semibold">Sua watchlist está vazia</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Vai em <strong>Steam → Inventário</strong> e clica no sininho ao lado de qualquer skin.
          <br />Ou pede pra IA: <em>"adiciona AK-47 | Redline na watchlist"</em>
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{items.length} skin(s) monitorada(s)</p>
        <button onClick={load} className="flex items-center gap-1 rounded-md border border-border/40 px-2 py-1 text-xs hover:bg-accent/40">
          <RefreshCw className="h-3 w-3" /> Atualizar
        </button>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {items.map((it) => {
          const price = it.currentPrice?.median ?? it.currentPrice?.min ?? null;
          return (
            <div key={it.id} className="rounded-xl border border-border/60 bg-card/40 p-3">
              <div className="flex items-start gap-3">
                {it.iconUrl && <img src={it.iconUrl} alt={it.displayName ?? ''} className="h-12 w-12 rounded bg-muted" />}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{it.displayName ?? it.marketHashName}</p>
                  <p className="truncate text-[10px] text-muted-foreground">{it.marketHashName}</p>
                  <div className="mt-1 flex items-center justify-between gap-2">
                    <p className={`text-lg font-bold ${price ? 'text-green-400' : 'text-muted-foreground'}`}>
                      R$ {brl(price)}
                    </p>
                    <Sparkline values={it.sparkline} width={80} height={24} />
                  </div>
                  {it.alerts.length > 0 && (
                    <p className="mt-1 text-[10px] text-yellow-400">
                      <Bell className="mr-0.5 inline h-2.5 w-2.5" />
                      {it.alerts.length} alerta(s) ativo(s)
                    </p>
                  )}
                </div>
                <div className="flex flex-col gap-1">
                  <button onClick={() => setSelected(it)} className="rounded-md border border-border/40 p-1 text-muted-foreground hover:text-foreground" title="Detalhes">
                    <TrendingUp className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => remove(it.id)} className="rounded-md border border-border/40 p-1 text-muted-foreground hover:text-red-400" title="Remover">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {selected && <DetailDialog item={selected} onClose={() => { setSelected(null); load(); }} />}
    </div>
  );
}

function DetailDialog({ item, onClose }: { item: WatchItem; onClose: () => void }) {
  const [sources, setSources] = useState<SourcePrice[]>([]);
  const [history, setHistory] = useState<HistorySeries>({});
  const [loading, setLoading] = useState(true);
  const [showAlert, setShowAlert] = useState(false);

  async function loadDetails() {
    setLoading(true);
    const [cmp, hist] = await Promise.all([
      fetch(`/api/skin-compare?name=${encodeURIComponent(item.marketHashName)}`).then((r) => r.json()).catch(() => ({ sources: [] })),
      fetch(`/api/skin-history?name=${encodeURIComponent(item.marketHashName)}&days=90`).then((r) => r.json()).catch(() => ({ bySource: {} }))
    ]);
    setSources(cmp.sources ?? []);
    setHistory(hist.bySource ?? {});
    setLoading(false);
  }

  useEffect(() => { loadDetails(); }, [item.marketHashName]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="my-8 w-full max-w-3xl space-y-4 rounded-xl border border-border/60 bg-card p-6">
        <div className="flex items-start gap-3 border-b border-border/60 pb-3">
          {item.iconUrl && <img src={item.iconUrl} alt="" className="h-14 w-14 rounded bg-muted" />}
          <div className="flex-1">
            <h2 className="text-lg font-bold">{item.displayName ?? item.marketHashName}</h2>
            <p className="text-xs text-muted-foreground">{item.marketHashName}</p>
          </div>
          <button onClick={onClose} className="text-sm text-muted-foreground hover:text-foreground">Fechar</button>
        </div>

        <div>
          <h3 className="mb-2 font-semibold">Comparativo entre mercados</h3>
          {loading ? (
            <p className="text-sm text-muted-foreground">Buscando...</p>
          ) : sources.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum dado ainda.</p>
          ) : (
            <div className="grid gap-2 md:grid-cols-3">
              {(['steam', 'csfloat', 'skinport'] as const).map((src) => {
                const s = sources.find((x) => x.source === src);
                if (!s) {
                  return (
                    <div key={src} className="rounded-md border border-dashed border-border/40 p-3">
                      <p className="text-xs font-semibold">{SOURCE_LABEL[src]}</p>
                      <p className="mt-1 text-xs text-muted-foreground">Sem dados</p>
                    </div>
                  );
                }
                return (
                  <div key={src} className={`rounded-md border p-3 ${SOURCE_COLOR[src]}`}>
                    <div className="mb-1 flex items-center justify-between">
                      <p className="text-xs font-semibold">{SOURCE_LABEL[src]}</p>
                      {s.url && (
                        <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground">
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                    <p className="text-lg font-bold">R$ {brl(s.median ?? s.min)}</p>
                    {s.min !== null && s.median !== null && (
                      <p className="text-[10px] text-muted-foreground">min R$ {brl(s.min)} · med R$ {brl(s.median)}</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <HistoryChart bySource={history} />

        <div>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="font-semibold">Alertas ativos</h3>
            <button onClick={() => setShowAlert(true)} className="flex items-center gap-1 rounded-md bg-foreground px-2 py-1 text-xs text-background">
              <BellPlus className="h-3 w-3" /> Novo alerta
            </button>
          </div>
          {item.alerts.length === 0 ? (
            <p className="text-xs text-muted-foreground">Nenhum alerta. Crie um pra receber WhatsApp quando atingir.</p>
          ) : (
            <div className="space-y-1">
              {item.alerts.map((a) => (
                <AlertRow key={a.id} alert={a} onChange={loadDetails} />
              ))}
            </div>
          )}
        </div>

        {showAlert && <NewAlertForm marketHashName={item.marketHashName} onClose={() => { setShowAlert(false); loadDetails(); }} />}
      </div>
    </div>
  );
}

function AlertRow({ alert, onChange }: { alert: any; onChange: () => void }) {
  async function remove() {
    if (!confirm('Remover alerta?')) return;
    await fetch(`/api/alerts/${alert.id}`, { method: 'DELETE' });
    onChange();
  }
  const desc =
    alert.kind === 'below' ? `Avisar quando ≤ R$ ${brl(alert.threshold)}`
    : alert.kind === 'above' ? `Avisar quando ≥ R$ ${brl(alert.threshold)}`
    : alert.kind === 'drop_pct' ? `Cair ${alert.threshold}% em ${alert.windowDays ?? 7}d`
    : `Subir ${alert.threshold}% em ${alert.windowDays ?? 7}d`;
  return (
    <div className="flex items-center justify-between rounded-md border border-border/40 p-2 text-sm">
      <span>{desc}</span>
      <button onClick={remove} className="text-muted-foreground hover:text-red-400">
        <Trash2 className="h-3 w-3" />
      </button>
    </div>
  );
}

function NewAlertForm({ marketHashName, onClose }: { marketHashName: string; onClose: () => void }) {
  const [kind, setKind] = useState<'below' | 'above' | 'drop_pct' | 'rise_pct'>('below');
  const [threshold, setThreshold] = useState(0);
  const [windowDays, setWindowDays] = useState(7);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    await fetch('/api/alerts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        marketHashName,
        kind,
        threshold,
        windowDays: kind.endsWith('pct') ? windowDays : null
      })
    });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <form onClick={(e) => e.stopPropagation()} onSubmit={submit} className="w-full max-w-md space-y-3 rounded-xl border border-border/60 bg-card p-5">
        <h3 className="font-semibold">Novo alerta</h3>
        <label className="block space-y-1">
          <span className="text-xs text-muted-foreground">Tipo</span>
          <select className="hub-input" value={kind} onChange={(e) => setKind(e.target.value as any)}>
            <option value="below">Preço caiu para ≤ X (R$)</option>
            <option value="above">Preço subiu para ≥ X (R$)</option>
            <option value="drop_pct">Caiu X% em N dias</option>
            <option value="rise_pct">Subiu X% em N dias</option>
          </select>
        </label>
        <label className="block space-y-1">
          <span className="text-xs text-muted-foreground">{kind.endsWith('pct') ? 'Percentual (%)' : 'Valor (R$)'}</span>
          <input type="number" step={kind.endsWith('pct') ? 1 : 0.01} className="hub-input" value={threshold} onChange={(e) => setThreshold(Number(e.target.value))} required />
        </label>
        {kind.endsWith('pct') && (
          <label className="block space-y-1">
            <span className="text-xs text-muted-foreground">Janela em dias</span>
            <input type="number" min={1} max={90} className="hub-input" value={windowDays} onChange={(e) => setWindowDays(Number(e.target.value))} />
          </label>
        )}
        <div className="rounded-md border border-yellow-500/30 bg-yellow-500/5 p-2 text-xs text-muted-foreground">
          <AlertCircle className="mr-1 inline h-3 w-3" />
          Quando bater, manda WhatsApp pro número configurado. Cooldown de 12h por alerta.
        </div>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-md border border-border/60 px-3 py-2 text-sm">Cancelar</button>
          <button type="submit" className="rounded-md bg-foreground px-3 py-2 text-sm text-background">Criar</button>
        </div>
      </form>
    </div>
  );
}

function HistoryChart({ bySource }: { bySource: HistorySeries }) {
  const allPoints = Object.values(bySource).flat();
  if (allPoints.length === 0) {
    return (
      <div className="rounded-xl border border-border/40 p-4 text-sm text-muted-foreground">
        Histórico ainda vazio. O worker captura snapshot 1x/dia. Use o comparativo acima pra forçar a primeira leitura.
      </div>
    );
  }

  const allValues = allPoints.map((p) => p.median ?? p.min ?? 0).filter((v) => v > 0);
  const min = Math.min(...allValues);
  const max = Math.max(...allValues);
  const range = max - min || 1;
  const width = 600;
  const height = 160;

  const sourceColors: Record<string, string> = {
    steam: '#3b82f6',
    csfloat: '#a855f7',
    skinport: '#f97316'
  };

  const allDates = Array.from(new Set(allPoints.map((p) => p.date))).sort();
  const dateToX = (d: string) => {
    const idx = allDates.indexOf(d);
    return (idx / Math.max(allDates.length - 1, 1)) * width;
  };

  return (
    <div className="rounded-xl border border-border/40 p-4">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="font-semibold">Histórico (90 dias)</h3>
        <div className="flex gap-2 text-[10px]">
          {Object.keys(bySource).map((s) => (
            <span key={s} className="flex items-center gap-1">
              <span className="h-2 w-2 rounded" style={{ background: sourceColors[s] ?? '#999' }} />
              {SOURCE_LABEL[s] ?? s}
            </span>
          ))}
        </div>
      </div>
      <svg width="100%" viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
        <text x="0" y="10" fontSize="9" fill="#888">R$ {brl(max)}</text>
        <text x="0" y={height} fontSize="9" fill="#888">R$ {brl(min)}</text>
        {Object.entries(bySource).map(([src, points]) => {
          const sorted = points.filter((p) => (p.median ?? p.min ?? 0) > 0).sort((a, b) => a.date.localeCompare(b.date));
          if (sorted.length < 2) return null;
          const path = sorted.map((p, i) => {
            const v = p.median ?? p.min ?? 0;
            const x = dateToX(p.date);
            const y = height - ((v - min) / range) * height;
            return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
          }).join(' ');
          return <path key={src} d={path} fill="none" stroke={sourceColors[src] ?? '#999'} strokeWidth="2" />;
        })}
      </svg>
    </div>
  );
}
