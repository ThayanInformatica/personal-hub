'use client';

import { useEffect, useState } from 'react';
import { Download, Check, Star, RefreshCw, AlertCircle } from 'lucide-react';
import { CrosshairPreview } from '@/components/crosshair-preview';
import type { CrosshairParams } from '@/lib/crosshair';

type ProPlayer = {
  id: string;
  slug: string;
  name: string;
  team: string | null;
  role: string | null;
  country: string | null;
  code: string | null;
  styleLabel: string | null;
  style: number;
  size: number;
  thickness: number;
  gap: number;
  red: number;
  green: number;
  blue: number;
  alpha: number;
  dot: boolean;
  tStyle: boolean;
  outline: number;
  lastFetchedAt: string | null;
  fetchError: string | null;
};

export function ProsTab() {
  const [items, setItems] = useState<ProPlayer[]>([]);
  const [imported, setImported] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    setItems(await fetch('/api/cs2/pros').then((r) => r.json()));
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function syncAll() {
    setSyncing(true);
    const res = await fetch('/api/cs2/pros/sync', { method: 'POST' });
    const data = await res.json();
    setSyncing(false);
    alert(`Sincronizados: ${data.succeeded}/${data.total} do ProSettings`);
    load();
  }

  async function syncOne(slug: string) {
    setBusy(`sync-${slug}`);
    await fetch(`/api/cs2/pros/sync?slug=${slug}`, { method: 'POST' });
    setBusy(null);
    load();
  }

  async function importPro(pro: ProPlayer) {
    setBusy(pro.slug);
    const body = {
      name: `${pro.name}${pro.team ? ` (${pro.team})` : ''}`,
      code: pro.code ?? `PROSETTINGS-${pro.slug.toUpperCase()}`,
      notes: pro.styleLabel ?? null,
      tags: ['pro', pro.role?.toLowerCase() ?? 'rifler'],
      style: pro.style,
      size: pro.size,
      thickness: pro.thickness,
      gap: pro.gap,
      red: pro.red,
      green: pro.green,
      blue: pro.blue,
      alpha: pro.alpha,
      dot: pro.dot,
      tStyle: pro.tStyle,
      outline: pro.outline
    };
    const res = await fetch('/api/crosshairs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    setBusy(null);
    if (res.ok) setImported((s) => new Set(s).add(pro.slug));
    else alert('Erro ao importar');
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">Carregando...</p>;
  }

  if (items.length === 0) {
    return (
      <div className="cs2-card p-8 text-center">
        <Star className="mx-auto mb-3 h-10 w-10 text-[hsl(var(--cs2-amber))]" />
        <h3 className="cs2-title mb-2">PRO LOADOUTS</h3>
        <p className="mb-4 text-sm text-muted-foreground">
          Sincronize com o ProSettings.net pra puxar miras atualizadas (donk, ZywOo, s1mple, m0NESY, NiKo, sh1ro, b1t, ropz, broky, jL, ...)
        </p>
        <button onClick={syncAll} disabled={syncing} className="cs2-btn-primary">
          <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
          {syncing ? 'Sincronizando...' : 'Sincronizar agora (~15s)'}
        </button>
        <p className="mt-3 text-[10px] text-muted-foreground">
          Cada player demora ~1s. Total ~15s pros 14 jogadores.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Star className="h-4 w-4 text-[hsl(var(--cs2-amber))]" />
        <h3 className="cs2-stencil text-sm">PRO PLAYER LOADOUTS</h3>
        <div className="flex-1 border-t border-dashed border-[hsl(var(--cs2-border))]" />
        <button onClick={syncAll} disabled={syncing} className="cs2-btn">
          <RefreshCw className={`h-3 w-3 ${syncing ? 'animate-spin' : ''}`} />
          {syncing ? 'Sincronizando...' : 'Sync all'}
        </button>
      </div>

      <p className="text-xs text-muted-foreground">
        Dados extraídos automaticamente do <a href="https://prosettings.net" target="_blank" rel="noopener noreferrer" className="underline">ProSettings.net</a>.
        Codes Valve gerados localmente (encode). Atualize quando os pros mudarem setup.
      </p>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {items.map((p) => {
          const params: CrosshairParams = {
            style: p.style, size: p.size, thickness: p.thickness, gap: p.gap,
            red: p.red, green: p.green, blue: p.blue, alpha: p.alpha,
            dot: p.dot, tStyle: p.tStyle, outline: p.outline
          };
          const isImported = imported.has(p.slug);
          const hasError = p.fetchError != null;
          return (
            <div key={p.id} className="cs2-card cs2-card-hover rarity-rare group relative overflow-hidden">
              <div className="cs2-rarity-glow absolute inset-x-0 bottom-0 h-2/3 opacity-40" />
              <div className="relative p-4">
                <div className="mb-2 flex items-start justify-between">
                  <div>
                    <p className="cs2-stencil text-[10px] text-[hsl(var(--cs2-amber))]">PRO PLAYER</p>
                    <h3 className="cs2-title text-xl">{p.name}</h3>
                    <p className="text-[10px] text-muted-foreground">
                      {p.team ?? '—'} · {p.role ?? '—'}{p.country && ` · ${p.country}`}
                    </p>
                  </div>
                  {hasError ? (
                    <button onClick={() => syncOne(p.slug)} disabled={busy === `sync-${p.slug}`} className="cs2-btn text-red-400">
                      <AlertCircle className="h-3 w-3" /> Falha — retry
                    </button>
                  ) : (
                    <button
                      onClick={() => importPro(p)}
                      disabled={busy === p.slug || isImported}
                      className={isImported ? 'cs2-btn border-green-500/40 text-green-400' : 'cs2-btn-primary'}
                    >
                      {isImported ? <><Check className="h-3 w-3" /> Importado</> : <><Download className="h-3 w-3" /> Importar</>}
                    </button>
                  )}
                </div>

                <div className="my-3 flex justify-center">
                  <CrosshairPreview params={params} bg="map" size={140} />
                </div>

                {p.styleLabel && (
                  <p className="text-[10px] text-muted-foreground">
                    Style: <span className="font-semibold text-foreground">{p.styleLabel}</span> · L {p.size} · T {p.thickness} · G {p.gap}
                  </p>
                )}
                {p.code && (
                  <code className="mt-2 block break-all rounded bg-[hsl(var(--cs2-bg))] p-2 text-[10px] text-[hsl(var(--cs2-amber))]">
                    {p.code}
                  </code>
                )}
                {p.lastFetchedAt && (
                  <p className="mt-1 text-[9px] text-muted-foreground">
                    Atualizado: {new Date(p.lastFetchedAt).toLocaleDateString('pt-BR')}
                  </p>
                )}
              </div>
              <div className="cs2-rarity-bar" />
            </div>
          );
        })}
      </div>
    </div>
  );
}
