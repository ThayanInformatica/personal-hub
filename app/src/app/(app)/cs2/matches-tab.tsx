'use client';

import { useEffect, useMemo, useState } from 'react';
import { Plus, Trash2, RefreshCw, TrendingUp, TrendingDown, Trophy, Map as MapIcon, Calendar, Flame, Download } from 'lucide-react';

type Match = {
  id: string;
  source: string;
  playedAt: string;
  map: string;
  mode: string | null;
  side: string | null;
  scoreYou: number;
  scoreEnemy: number;
  result: string;
  rankBefore: number | null;
  rankAfter: number | null;
  rankDelta: number | null;
  kills: number;
  deaths: number;
  assists: number;
  adr: number | null;
  hsPercent: number | null;
  kast: number | null;
  rating: number | null;
  mvps: number;
  notes: string | null;
};

type Summary = {
  total: number;
  wins: number;
  losses: number;
  ties: number;
  winRate: number;
  avgKD: number;
  streak: { kind: 'win' | 'loss' | null; count: number };
  byMap: { map: string; matches: number; wins: number; winRate: number; avgKD: number }[];
  bySide: { CT: { matches: number; wr: number }; T: { matches: number; wr: number } };
  rankPoints: { playedAt: string; rank: number }[];
  monthlyKD: { month: string; matches: number; kd: number }[];
};

const MAPS = ['mirage', 'inferno', 'dust2', 'nuke', 'anubis', 'ancient', 'train', 'overpass', 'vertigo'];

export function MatchesTab() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);

  async function load() {
    setLoading(true);
    const [m, s] = await Promise.all([
      fetch('/api/matches?limit=200').then((r) => r.json()),
      fetch('/api/matches/summary').then((r) => r.json())
    ]);
    setMatches(m);
    setSummary(s);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function syncLeetify() {
    setSyncing(true);
    const res = await fetch('/api/matches/sync-leetify', { method: 'POST' });
    const data = await res.json();
    setSyncing(false);
    if (data.ok) {
      alert(`Leetify sync: ${data.created} novas, ${data.updated} atualizadas de ${data.total}`);
      load();
    } else {
      alert(data.error ?? 'Falha no sync');
    }
  }

  async function remove(id: string) {
    if (!confirm('Remover partida?')) return;
    await fetch(`/api/matches/${id}`, { method: 'DELETE' });
    load();
  }

  if (loading) {
    return (
      <div className="cs2-card p-8 text-center">
        <div className="mx-auto h-1 w-32 animate-pulse bg-[hsl(var(--cs2-amber))]" />
        <p className="cs2-stencil mt-4 text-xs text-muted-foreground">CARREGANDO MATCHES...</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <Trophy className="h-4 w-4 text-[hsl(var(--cs2-amber))]" />
        <h3 className="cs2-stencil text-sm">HISTÓRICO DE PARTIDAS</h3>
        <div className="flex-1 border-t border-dashed border-[hsl(var(--cs2-border))]" />
        <button onClick={syncLeetify} disabled={syncing} className="cs2-btn">
          <Download className={`h-3 w-3 ${syncing ? 'animate-pulse' : ''}`} />
          {syncing ? 'Sincronizando...' : 'Sync Leetify'}
        </button>
        <button onClick={() => setOpen(true)} className="cs2-btn-primary">
          <Plus className="h-3 w-3" /> Nova partida
        </button>
      </div>

      {summary && summary.total > 0 ? (
        <>
          <SummaryRow summary={summary} />
          <div className="grid gap-4 lg:grid-cols-2">
            <MapsChart byMap={summary.byMap} />
            <SidesChart bySide={summary.bySide} />
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <RankChart points={summary.rankPoints} />
            <MonthlyKDChart points={summary.monthlyKD} />
          </div>
        </>
      ) : (
        <EmptyState onCreate={() => setOpen(true)} onSync={syncLeetify} syncing={syncing} />
      )}

      {matches.length > 0 && <MatchesList matches={matches} onRemove={remove} />}

      {open && <NewMatchDialog onClose={() => { setOpen(false); load(); }} />}
    </div>
  );
}

function SummaryRow({ summary }: { summary: Summary }) {
  const streakColor = summary.streak.kind === 'win' ? 'text-green-400' : summary.streak.kind === 'loss' ? 'text-red-400' : 'text-muted-foreground';
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      <Stat label="Partidas" value={String(summary.total)} icon={<Calendar className="h-3 w-3" />} />
      <Stat label="Win Rate" value={`${summary.winRate.toFixed(1)}%`} valueClass="text-[hsl(var(--cs2-amber))]" />
      <Stat label="K/D Médio" value={summary.avgKD.toFixed(2)} valueClass="text-[hsl(var(--cs2-amber))]" />
      <Stat
        label={summary.streak.kind === 'win' ? 'Vitórias seguidas' : 'Derrotas seguidas'}
        value={`${summary.streak.count}`}
        icon={summary.streak.kind === 'win' ? <Flame className="h-3 w-3 text-orange-400" /> : <TrendingDown className="h-3 w-3 text-red-400" />}
        valueClass={streakColor}
      />
    </div>
  );
}

function Stat({ label, value, icon, valueClass }: { label: string; value: string; icon?: React.ReactNode; valueClass?: string }) {
  return (
    <div className="cs2-stat-card rarity-default">
      {icon && <div className="mb-1 text-muted-foreground">{icon}</div>}
      <p className={`cs2-stat-value ${valueClass ?? ''}`}>{value}</p>
      <p className="cs2-stat-label">{label}</p>
    </div>
  );
}

function MapsChart({ byMap }: { byMap: Summary['byMap'] }) {
  const top = byMap.slice(0, 8);
  return (
    <div className="cs2-card cs2-cut-sm p-4">
      <div className="mb-3 flex items-center gap-2">
        <MapIcon className="h-3.5 w-3.5 text-[hsl(var(--cs2-amber))]" />
        <h4 className="cs2-stencil text-xs">WIN RATE POR MAPA</h4>
      </div>
      {top.length === 0 ? (
        <p className="text-xs text-muted-foreground">Sem dados ainda</p>
      ) : (
        <div className="space-y-2">
          {top.map((m) => (
            <div key={m.map} className="relative">
              <div className="cs2-cut-sm relative h-7 overflow-hidden border border-[hsl(var(--cs2-border))] bg-[hsl(var(--cs2-bg))]">
                <div
                  className="absolute left-0 top-0 h-full bg-gradient-to-r from-[hsl(var(--cs2-amber))]/40 to-[hsl(var(--cs2-amber))]/10"
                  style={{ width: `${m.winRate}%` }}
                />
                <div className="relative flex h-full items-center justify-between px-2 text-xs">
                  <span className="cs2-stencil capitalize">{m.map}</span>
                  <span className="text-muted-foreground">
                    {m.wins}W / {m.matches}M · <span className="font-bold text-[hsl(var(--cs2-amber))]">{m.winRate.toFixed(0)}%</span> · KD {m.avgKD.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SidesChart({ bySide }: { bySide: Summary['bySide'] }) {
  const sides = [
    { id: 'CT', label: 'CT', color: 'border-cyan-500/40 bg-cyan-500/5', barColor: 'from-cyan-500/50 to-cyan-500/10', data: bySide.CT },
    { id: 'T', label: 'TERRORISTAS', color: 'border-orange-500/40 bg-orange-500/5', barColor: 'from-orange-500/50 to-orange-500/10', data: bySide.T }
  ];
  return (
    <div className="cs2-card cs2-cut-sm p-4">
      <div className="mb-3 flex items-center gap-2">
        <h4 className="cs2-stencil text-xs">CT vs T</h4>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {sides.map((s) => (
          <div key={s.id} className={`cs2-cut-sm border ${s.color} p-3`}>
            <p className="cs2-stencil text-[10px] text-muted-foreground">{s.label}</p>
            <p className="my-1 text-2xl font-bold">{s.data.wr.toFixed(1)}%</p>
            <p className="text-[10px] text-muted-foreground">{s.data.matches} partidas</p>
            <div className="mt-2 h-1.5 overflow-hidden rounded bg-[hsl(var(--cs2-bg))]">
              <div className={`h-full bg-gradient-to-r ${s.barColor}`} style={{ width: `${s.data.wr}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RankChart({ points }: { points: Summary['rankPoints'] }) {
  if (points.length < 2) {
    return (
      <div className="cs2-card cs2-cut-sm p-4">
        <h4 className="cs2-stencil mb-3 text-xs">EVOLUÇÃO DO RANK</h4>
        <p className="text-xs text-muted-foreground">Precisa de 2+ partidas com rank registrado.</p>
      </div>
    );
  }
  const w = 400, h = 100;
  const values = points.map((p) => p.rank);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const step = w / (points.length - 1);
  const path = points.map((p, i) => {
    const x = i * step;
    const y = h - ((p.rank - min) / range) * h;
    return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
  }).join(' ');
  const last = points[points.length - 1].rank;
  const first = points[0].rank;
  const delta = last - first;
  return (
    <div className="cs2-card cs2-cut-sm p-4">
      <div className="mb-3 flex items-center justify-between">
        <h4 className="cs2-stencil text-xs">EVOLUÇÃO DO RANK</h4>
        <span className={`text-xs font-bold ${delta >= 0 ? 'text-green-400' : 'text-red-400'}`}>
          {delta >= 0 ? '+' : ''}{delta}
        </span>
      </div>
      <svg width="100%" viewBox={`0 0 ${w} ${h}`}>
        <text x="0" y="10" fontSize="9" fill="#888">{max}</text>
        <text x="0" y={h} fontSize="9" fill="#888">{min}</text>
        <path d={path} fill="none" stroke="hsl(var(--cs2-amber))" strokeWidth="2" />
      </svg>
      <p className="mt-2 text-[10px] text-muted-foreground">
        {first} → {last} em {points.length} partidas
      </p>
    </div>
  );
}

function MonthlyKDChart({ points }: { points: Summary['monthlyKD'] }) {
  if (points.length === 0) {
    return (
      <div className="cs2-card cs2-cut-sm p-4">
        <h4 className="cs2-stencil mb-3 text-xs">K/D POR MÊS</h4>
        <p className="text-xs text-muted-foreground">Sem dados ainda.</p>
      </div>
    );
  }
  return (
    <div className="cs2-card cs2-cut-sm p-4">
      <h4 className="cs2-stencil mb-3 text-xs">K/D POR MÊS</h4>
      <div className="space-y-2">
        {points.slice(-6).map((p) => (
          <div key={p.month} className="flex items-center gap-2">
            <span className="cs2-stencil w-16 text-[10px]">{p.month}</span>
            <div className="cs2-cut-sm relative h-5 flex-1 overflow-hidden border border-[hsl(var(--cs2-border))] bg-[hsl(var(--cs2-bg))]">
              <div
                className={`absolute left-0 top-0 h-full ${p.kd >= 1 ? 'bg-green-500/30' : 'bg-red-500/30'}`}
                style={{ width: `${Math.min((p.kd / 2) * 100, 100)}%` }}
              />
              <div className="relative flex h-full items-center justify-between px-2 text-[10px]">
                <span className="text-muted-foreground">{p.matches}p</span>
                <span className="font-bold">{p.kd.toFixed(2)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function EmptyState({ onCreate, onSync, syncing }: { onCreate: () => void; onSync: () => void; syncing: boolean }) {
  return (
    <div className="cs2-card p-8 text-center">
      <Trophy className="mx-auto mb-3 h-10 w-10 text-[hsl(var(--cs2-amber))]" />
      <h3 className="cs2-title mb-1 text-xl">SEM PARTIDAS REGISTRADAS</h3>
      <p className="mb-4 text-sm text-muted-foreground">
        Adicione manualmente ou sincronize com sua conta Leetify (se já tiver).
      </p>
      <div className="flex justify-center gap-2">
        <button onClick={onSync} disabled={syncing} className="cs2-btn">
          <Download className={`h-3 w-3 ${syncing ? 'animate-pulse' : ''}`} /> Sync Leetify
        </button>
        <button onClick={onCreate} className="cs2-btn-primary">
          <Plus className="h-3 w-3" /> Adicionar manual
        </button>
      </div>
    </div>
  );
}

function MatchesList({ matches, onRemove }: { matches: Match[]; onRemove: (id: string) => void }) {
  return (
    <div>
      <h4 className="cs2-stencil mb-3 text-xs">PARTIDAS ({matches.length})</h4>
      <div className="space-y-2">
        {matches.map((m) => {
          const kd = m.deaths > 0 ? (m.kills / m.deaths).toFixed(2) : m.kills.toString();
          return (
            <div key={m.id} className="cs2-card cs2-cut-sm flex flex-wrap items-center gap-3 p-3">
              <div className={`cs2-cut-sm flex h-12 w-12 shrink-0 flex-col items-center justify-center border text-xs font-bold ${
                m.result === 'win' ? 'border-green-500/40 bg-green-500/10 text-green-400'
                : m.result === 'loss' ? 'border-red-500/40 bg-red-500/10 text-red-400'
                : 'border-yellow-500/40 bg-yellow-500/10 text-yellow-400'
              }`}>
                <span>{m.scoreYou}</span>
                <span className="text-[8px]">{m.scoreEnemy}</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="cs2-stencil text-sm capitalize">{m.map}</p>
                <p className="text-[10px] text-muted-foreground">
                  {new Date(m.playedAt).toLocaleDateString('pt-BR')} · {m.mode}
                  {m.side && ` · ${m.side}`}
                  {m.source === 'leetify' && ' · leetify'}
                </p>
              </div>
              <div className="text-right text-xs">
                <p className="font-bold">{m.kills}/{m.deaths}/{m.assists}</p>
                <p className="text-muted-foreground">KD {kd}{m.adr ? ` · ADR ${m.adr.toFixed(0)}` : ''}</p>
              </div>
              {m.rankDelta != null && (
                <div className={`text-right text-xs ${m.rankDelta >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {m.rankDelta >= 0 ? <TrendingUp className="inline h-3 w-3" /> : <TrendingDown className="inline h-3 w-3" />}
                  {m.rankDelta >= 0 ? '+' : ''}{m.rankDelta}
                </div>
              )}
              <button onClick={() => onRemove(m.id)} className="text-muted-foreground hover:text-red-400">
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function NewMatchDialog({ onClose }: { onClose: () => void }) {
  const [data, setData] = useState({
    map: 'mirage',
    mode: 'premier',
    side: '',
    scoreYou: 13,
    scoreEnemy: 16,
    kills: 0,
    deaths: 0,
    assists: 0,
    mvps: 0,
    adr: '',
    rankBefore: '',
    rankAfter: '',
    notes: '',
    playedAt: new Date().toISOString().slice(0, 16)
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    await fetch('/api/matches', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...data,
        side: data.side || null,
        adr: data.adr ? Number(data.adr) : null,
        rankBefore: data.rankBefore ? Number(data.rankBefore) : null,
        rankAfter: data.rankAfter ? Number(data.rankAfter) : null,
        playedAt: new Date(data.playedAt).toISOString()
      })
    });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-4" onClick={onClose}>
      <form onClick={(e) => e.stopPropagation()} onSubmit={submit} className="my-8 w-full max-w-md space-y-3 cs2-card p-5">
        <h3 className="cs2-title text-lg">NOVA PARTIDA</h3>
        <div className="grid grid-cols-2 gap-2">
          <label className="space-y-1">
            <span className="cs2-stat-label">Mapa</span>
            <select className="hub-input" value={data.map} onChange={(e) => setData({ ...data, map: e.target.value })}>
              {MAPS.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </label>
          <label className="space-y-1">
            <span className="cs2-stat-label">Modo</span>
            <select className="hub-input" value={data.mode} onChange={(e) => setData({ ...data, mode: e.target.value })}>
              <option value="premier">Premier</option>
              <option value="competitive">Competitive</option>
              <option value="wingman">Wingman</option>
              <option value="dm">DM</option>
            </select>
          </label>
          <label className="space-y-1">
            <span className="cs2-stat-label">Score você</span>
            <input type="number" className="hub-input" value={data.scoreYou} onChange={(e) => setData({ ...data, scoreYou: Number(e.target.value) })} />
          </label>
          <label className="space-y-1">
            <span className="cs2-stat-label">Score inimigo</span>
            <input type="number" className="hub-input" value={data.scoreEnemy} onChange={(e) => setData({ ...data, scoreEnemy: Number(e.target.value) })} />
          </label>
          <label className="space-y-1">
            <span className="cs2-stat-label">Lado</span>
            <select className="hub-input" value={data.side} onChange={(e) => setData({ ...data, side: e.target.value })}>
              <option value="">—</option>
              <option value="CT">CT</option>
              <option value="T">T</option>
              <option value="both">Ambos</option>
            </select>
          </label>
          <label className="space-y-1">
            <span className="cs2-stat-label">Data/hora</span>
            <input type="datetime-local" className="hub-input" value={data.playedAt} onChange={(e) => setData({ ...data, playedAt: e.target.value })} />
          </label>
          <label className="space-y-1">
            <span className="cs2-stat-label">Kills</span>
            <input type="number" className="hub-input" value={data.kills} onChange={(e) => setData({ ...data, kills: Number(e.target.value) })} />
          </label>
          <label className="space-y-1">
            <span className="cs2-stat-label">Deaths</span>
            <input type="number" className="hub-input" value={data.deaths} onChange={(e) => setData({ ...data, deaths: Number(e.target.value) })} />
          </label>
          <label className="space-y-1">
            <span className="cs2-stat-label">Assists</span>
            <input type="number" className="hub-input" value={data.assists} onChange={(e) => setData({ ...data, assists: Number(e.target.value) })} />
          </label>
          <label className="space-y-1">
            <span className="cs2-stat-label">MVPs</span>
            <input type="number" className="hub-input" value={data.mvps} onChange={(e) => setData({ ...data, mvps: Number(e.target.value) })} />
          </label>
          <label className="space-y-1">
            <span className="cs2-stat-label">ADR (opcional)</span>
            <input type="number" className="hub-input" value={data.adr} onChange={(e) => setData({ ...data, adr: e.target.value })} />
          </label>
          <label className="space-y-1">
            <span className="cs2-stat-label">Rank antes</span>
            <input type="number" className="hub-input" value={data.rankBefore} onChange={(e) => setData({ ...data, rankBefore: e.target.value })} placeholder="ex: 15000" />
          </label>
          <label className="col-span-2 space-y-1">
            <span className="cs2-stat-label">Rank depois</span>
            <input type="number" className="hub-input" value={data.rankAfter} onChange={(e) => setData({ ...data, rankAfter: e.target.value })} placeholder="ex: 15280" />
          </label>
          <label className="col-span-2 space-y-1">
            <span className="cs2-stat-label">Notas</span>
            <textarea className="hub-input" rows={2} value={data.notes} onChange={(e) => setData({ ...data, notes: e.target.value })} />
          </label>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="cs2-btn">Cancelar</button>
          <button type="submit" className="cs2-btn-primary">Salvar</button>
        </div>
      </form>
    </div>
  );
}
