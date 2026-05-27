'use client';

import { useEffect, useState } from 'react';
import { LogIn, RefreshCw, ExternalLink, Clock, AlertCircle, Package, DollarSign, BellPlus, Check, Crosshair, Target, Trophy, Zap } from 'lucide-react';
import { rarityClass } from '@/lib/cs2-rarity';

type Profile = {
  steamId: string;
  personaName: string;
  avatarFull: string;
  profileUrl: string;
  personaStateLabel: string;
  currentGameName?: string;
  location?: string;
  memberSince?: string;
};

type Stats = {
  total_kills: number; total_deaths: number; total_mvps: number; total_wins: number;
  total_matches_played: number; total_matches_won: number; total_rounds_played: number;
  total_kills_headshot: number; total_time_played: number;
  total_planted_bombs: number; total_defused_bombs: number;
  total_kills_knife: number; total_kills_ak47: number; total_kills_m4a1: number;
  total_kills_awp: number; total_kills_deagle: number;
  kd: number; hsPercent: number; accuracy: number; winRate: number;
  byMap: Record<string, { rounds: number; wins: number }>;
};

type Recent = {
  appId: number; name: string;
  hoursOnRecord: number; hoursLast2Weeks?: number;
  logoUrl?: string;
};

type Item = {
  classId: string;
  name: string;
  marketName: string;
  rarity?: string;
  type?: string;
  iconUrl?: string;
  price?: {
    currency: string;
    suggested: number | null;
    min: number | null;
    median: number | null;
    max: number | null;
    quantity: number;
    marketPageUrl: string | null;
    updatedAt: string;
  } | null;
};

type InventoryResponse = {
  items: Item[];
  total: number;
  lastUpdate: string | null;
  priced: number;
};

function brl(n: number | null | undefined): string {
  if (n == null) return '—';
  return n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function SteamTab() {
  const [profileData, setProfileData] = useState<{ connected: boolean; profile?: Profile | null } | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [recent, setRecent] = useState<Recent[]>([]);
  const [inventory, setInventory] = useState<InventoryResponse>({ items: [], total: 0, lastUpdate: null, priced: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshingPrices, setRefreshingPrices] = useState(false);
  const [watched, setWatched] = useState<Set<string>>(new Set());

  async function loadAll() {
    setLoading(true);
    const prof = await fetch('/api/steam/profile').then((r) => r.json()).catch(() => null);
    setProfileData(prof);
    if (prof?.connected) {
      const [s, r, inv] = await Promise.all([
        fetch('/api/steam/stats').then((r) => r.ok ? r.json() : null).catch(() => null),
        fetch('/api/steam/recent').then((r) => r.ok ? r.json() : []).catch(() => []),
        fetch('/api/steam/inventory').then((r) => r.ok ? r.json() : { items: [], total: 0, lastUpdate: null, priced: 0 }).catch(() => ({ items: [], total: 0, lastUpdate: null, priced: 0 }))
      ]);
      setStats(s);
      setRecent(r);
      setInventory(inv);
      const wl = await fetch('/api/watchlist').then((r) => r.json()).catch(() => []);
      setWatched(new Set((wl as any[]).map((w) => w.marketHashName)));
    }
    setLoading(false);
  }

  useEffect(() => { loadAll(); }, []);

  async function addToWatchlist(item: Item) {
    const res = await fetch('/api/watchlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        marketHashName: item.marketName,
        displayName: item.name,
        iconUrl: item.iconUrl ?? null
      })
    });
    if (res.ok || res.status === 409) {
      setWatched((s) => new Set(s).add(item.marketName));
    }
  }

  async function refreshPrices() {
    setRefreshingPrices(true);
    const res = await fetch('/api/skin-prices/refresh', { method: 'POST' });
    const data = await res.json();
    setRefreshingPrices(false);
    if (data.ok) {
      alert(`${data.updated} preços atualizados`);
      loadAll();
    } else {
      alert(`Erro: ${data.error}`);
    }
  }

  async function disconnect() {
    if (!confirm('Desconectar Steam?')) return;
    await fetch('/api/steam/disconnect', { method: 'POST' });
    location.reload();
  }

  if (loading) {
    return (
      <div className="cs2-card p-8 text-center">
        <div className="mx-auto h-1 w-32 animate-pulse bg-[hsl(var(--cs2-amber))]" />
        <p className="cs2-stencil mt-4 text-xs text-muted-foreground">CARREGANDO...</p>
      </div>
    );
  }

  if (!profileData?.connected) {
    return (
      <div className="cs2-card mx-auto max-w-2xl p-8 text-center">
        <Crosshair className="mx-auto mb-4 h-10 w-10 text-[hsl(var(--cs2-amber))]" />
        <h3 className="cs2-title mb-2 text-xl">CONECTE SUA STEAM</h3>
        <p className="mb-6 text-sm text-muted-foreground">
          Login via OpenID. Sem API key. Lemos só dados públicos.
        </p>
        <a href="/api/steam/login" className="cs2-btn-primary">
          <LogIn className="h-4 w-4" /> ENTRAR COM STEAM
        </a>
        <div className="mt-6 cs2-cut-sm border border-yellow-500/30 bg-yellow-500/5 p-3 text-left text-xs text-muted-foreground">
          <p className="cs2-stencil mb-1 text-yellow-400">PRÉ-REQUISITOS</p>
          <ol className="list-decimal space-y-0.5 pl-5">
            <li>Perfil Steam público</li>
            <li>"Detalhes do jogo" público pra ver stats</li>
            <li>"Inventário" público pra ver skins</li>
          </ol>
        </div>
      </div>
    );
  }

  const p = profileData.profile;
  if (!p) {
    return (
      <div className="cs2-card border-yellow-500/40 bg-yellow-500/5 p-4 text-sm">
        <AlertCircle className="mb-2 inline h-4 w-4" /> Perfil privado. Vai em{' '}
        <a href="https://steamcommunity.com/my/edit/settings" target="_blank" rel="noopener noreferrer" className="underline">
          Privacidade da Steam
        </a>{' '}
        e marca "Meu perfil" como Público.{' '}
        <button onClick={loadAll} className="underline">Tentar novamente</button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <ProfileCard profile={p} onRefresh={loadAll} onDisconnect={disconnect} />

      {stats ? <StatsBlock stats={stats} /> : (
        <div className="cs2-card border-yellow-500/30 bg-yellow-500/5 p-4 text-xs text-muted-foreground">
          Stats CS2 não vieram. Habilita "Detalhes do jogo" público em{' '}
          <a href="https://steamcommunity.com/my/edit/settings" target="_blank" rel="noopener noreferrer" className="underline">
            Privacidade da Steam
          </a>.
        </div>
      )}

      {inventory.items.length > 0 && (
        <InventoryBlock
          inventory={inventory}
          watched={watched}
          onWatch={addToWatchlist}
          refreshing={refreshingPrices}
          onRefreshPrices={refreshPrices}
        />
      )}

      {recent.length > 0 && <RecentBlock items={recent} />}
    </div>
  );
}

function ProfileCard({ profile, onRefresh, onDisconnect }: { profile: Profile; onRefresh: () => void; onDisconnect: () => void }) {
  const online = profile.personaStateLabel === 'Online' || profile.personaStateLabel === 'Em jogo';
  return (
    <div className="cs2-card cs2-card-hover relative overflow-hidden p-5">
      <div className="cs2-rarity-glow absolute inset-0 opacity-30" />
      <div className="relative flex flex-wrap items-center gap-4">
        <div className="relative">
          <img src={profile.avatarFull} alt={profile.personaName} className="cs2-cut-sm h-20 w-20" />
          <span className={`absolute -bottom-1 -right-1 h-3 w-3 rounded-full ${online ? 'bg-green-400 shadow-[0_0_8px_rgb(74,222,128)]' : 'bg-muted'}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="cs2-title text-2xl text-[hsl(var(--cs2-text))]">{profile.personaName}</h2>
            <span className={`cs2-chip ${online ? 'border-green-500/40 text-green-400' : 'text-muted-foreground'}`}>
              {profile.personaStateLabel}
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">ID: {profile.steamId}</p>
          {profile.location && <p className="text-xs text-muted-foreground">📍 {profile.location}</p>}
          {profile.currentGameName && (
            <p className="mt-1 text-sm font-semibold text-[hsl(var(--cs2-amber))]">► {profile.currentGameName}</p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <a href={profile.profileUrl} target="_blank" rel="noopener noreferrer" className="cs2-btn">
            <ExternalLink className="h-3 w-3" /> Perfil
          </a>
          <button onClick={onRefresh} className="cs2-btn">
            <RefreshCw className="h-3 w-3" /> Atualizar
          </button>
          <button onClick={onDisconnect} className="cs2-btn hover:border-red-500 hover:text-red-400">
            Sair
          </button>
        </div>
      </div>
    </div>
  );
}

function StatsBlock({ stats }: { stats: Stats }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Target className="h-4 w-4 text-[hsl(var(--cs2-amber))]" />
        <h3 className="cs2-stencil text-sm">STATS VITALÍCIOS</h3>
        <div className="flex-1 border-t border-dashed border-[hsl(var(--cs2-border))]" />
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatBig label="K/D" value={stats.kd.toFixed(2)} icon={<Crosshair className="h-4 w-4" />} accent />
        <StatBig label="HS%" value={`${stats.hsPercent.toFixed(1)}%`} accent />
        <StatBig label="Win Rate" value={`${stats.winRate.toFixed(1)}%`} />
        <StatBig label="Accuracy" value={`${stats.accuracy.toFixed(1)}%`} />
      </div>

      <div className="grid grid-cols-2 gap-2 md:grid-cols-4 xl:grid-cols-8">
        <StatSm label="Kills" value={stats.total_kills.toLocaleString('pt-BR')} />
        <StatSm label="Deaths" value={stats.total_deaths.toLocaleString('pt-BR')} />
        <StatSm label="MVPs" value={stats.total_mvps.toLocaleString('pt-BR')} />
        <StatSm label="Matches" value={stats.total_matches_played.toLocaleString('pt-BR')} />
        <StatSm label="Rounds" value={stats.total_rounds_played.toLocaleString('pt-BR')} />
        <StatSm label="Tempo" value={`${Math.round(stats.total_time_played / 3600)}h`} />
        <StatSm label="Plants" value={stats.total_planted_bombs.toLocaleString('pt-BR')} />
        <StatSm label="Defuses" value={stats.total_defused_bombs.toLocaleString('pt-BR')} />
      </div>

      <div className="cs2-card cs2-cut-sm p-4">
        <div className="mb-3 flex items-center gap-2">
          <Trophy className="h-3.5 w-3.5 text-[hsl(var(--cs2-amber))]" />
          <h4 className="cs2-stencil text-xs">KILLS POR ARMA</h4>
        </div>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
          <WeaponStat label="AK-47" value={stats.total_kills_ak47} />
          <WeaponStat label="M4A1" value={stats.total_kills_m4a1} />
          <WeaponStat label="AWP" value={stats.total_kills_awp} />
          <WeaponStat label="Deagle" value={stats.total_kills_deagle} />
          <WeaponStat label="Knife" value={stats.total_kills_knife} />
        </div>
      </div>

      {Object.keys(stats.byMap).length > 0 && (
        <div className="cs2-card cs2-cut-sm p-4">
          <div className="mb-3 flex items-center gap-2">
            <span className="cs2-stencil text-xs">MAPAS MAIS JOGADOS</span>
          </div>
          <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
            {Object.entries(stats.byMap)
              .filter(([, v]) => v.rounds > 0)
              .sort(([, a], [, b]) => b.rounds - a.rounds)
              .slice(0, 8)
              .map(([map, v]) => {
                const wr = v.rounds > 0 ? (v.wins / v.rounds) * 100 : 0;
                return (
                  <div key={map} className="cs2-cut-sm relative overflow-hidden border border-[hsl(var(--cs2-border))] bg-[hsl(var(--cs2-surface-2))] p-3">
                    <div
                      className="absolute left-0 top-0 h-full bg-[hsl(var(--cs2-amber))]/10"
                      style={{ width: `${wr}%` }}
                    />
                    <div className="relative flex items-center justify-between">
                      <span className="cs2-stencil text-xs capitalize">{map.replace(/^de_/, '')}</span>
                      <span className="text-xs text-muted-foreground">
                        {v.wins}W / {v.rounds}R · {wr.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}

function StatBig({ label, value, icon, accent }: { label: string; value: string; icon?: React.ReactNode; accent?: boolean }) {
  return (
    <div className="cs2-stat-card rarity-default text-center">
      {icon && <div className="mb-1 flex justify-center text-[hsl(var(--cs2-amber))]">{icon}</div>}
      <p className={`cs2-stat-value ${accent ? 'text-[hsl(var(--cs2-amber))]' : ''}`}>{value}</p>
      <p className="cs2-stat-label">{label}</p>
    </div>
  );
}

function StatSm({ label, value }: { label: string; value: string }) {
  return (
    <div className="cs2-cut-sm border border-[hsl(var(--cs2-border))] bg-[hsl(var(--cs2-surface))] p-2 text-center">
      <p className="text-sm font-bold">{value}</p>
      <p className="cs2-stat-label">{label}</p>
    </div>
  );
}

function WeaponStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="cs2-cut-sm border border-[hsl(var(--cs2-border))] bg-[hsl(var(--cs2-bg))] p-2 text-center">
      <p className="text-base font-bold">{value.toLocaleString('pt-BR')}</p>
      <p className="cs2-stat-label">{label}</p>
    </div>
  );
}

function InventoryBlock({ inventory, watched, onWatch, refreshing, onRefreshPrices }: {
  inventory: InventoryResponse;
  watched: Set<string>;
  onWatch: (i: Item) => void;
  refreshing: boolean;
  onRefreshPrices: () => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Package className="h-4 w-4 text-[hsl(var(--cs2-amber))]" />
        <h3 className="cs2-stencil text-sm">INVENTÁRIO</h3>
        <span className="cs2-chip">{inventory.items.length} itens</span>
        <div className="flex-1 border-t border-dashed border-[hsl(var(--cs2-border))]" />
        <div className="cs2-cut-sm flex items-center gap-2 border border-green-500/40 bg-green-500/10 px-3 py-1.5 text-xs text-green-400">
          <DollarSign className="h-3 w-3" />
          <span className="cs2-stencil">TOTAL</span>
          <span className="font-bold">R$ {brl(inventory.total)}</span>
        </div>
        <button onClick={onRefreshPrices} disabled={refreshing} className="cs2-btn">
          <RefreshCw className={`h-3 w-3 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Atualizando...' : 'Atualizar preços'}
        </button>
      </div>

      {inventory.lastUpdate && (
        <p className="text-[10px] text-muted-foreground">
          {inventory.priced} de {inventory.items.length} com preço · última atualização: {new Date(inventory.lastUpdate).toLocaleString('pt-BR')}
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {inventory.items
          .slice()
          .sort((a, b) => (b.price?.median ?? b.price?.min ?? 0) - (a.price?.median ?? a.price?.min ?? 0))
          .map((it) => (
            <SkinCard key={it.classId} item={it} isWatched={watched.has(it.marketName)} onWatch={onWatch} />
          ))}
      </div>
    </div>
  );
}

function SkinCard({ item, isWatched, onWatch }: { item: Item; isWatched: boolean; onWatch: (i: Item) => void }) {
  const rc = rarityClass(item.rarity);
  const p = item.price;
  const display = p?.median ?? p?.min ?? null;

  return (
    <div className={`cs2-card cs2-card-hover ${rc} group relative overflow-hidden`}>
      <div className="cs2-rarity-glow absolute inset-x-0 bottom-0 h-1/2 opacity-50" />
      <div className="relative p-4">
        <div className="flex items-start gap-3">
          {item.iconUrl && (
            <div className="cs2-cut-sm relative shrink-0 border border-[hsl(var(--cs2-border))] bg-gradient-to-br from-[hsl(var(--cs2-surface-2))] to-[hsl(var(--cs2-bg))] p-1">
              <img src={item.iconUrl} alt={item.name} className="h-16 w-16 object-contain" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="cs2-stencil text-[10px]" style={{ color: 'rgb(var(--rarity-color))' }}>
              {item.rarity ?? 'COMUM'}
            </p>
            <p className="mt-0.5 line-clamp-2 text-sm font-semibold leading-tight">{item.name}</p>
            {item.type && <p className="mt-1 text-[10px] text-muted-foreground">{item.type}</p>}
          </div>
          <button
            onClick={() => onWatch(item)}
            className={`shrink-0 cs2-cut-sm border p-1.5 transition-all ${
              isWatched
                ? 'border-yellow-500/60 bg-yellow-500/20 text-yellow-400'
                : 'border-[hsl(var(--cs2-border))] text-muted-foreground opacity-0 group-hover:opacity-100 hover:border-yellow-500 hover:text-yellow-400'
            }`}
            title={isWatched ? 'Na watchlist' : 'Adicionar à watchlist'}
          >
            {isWatched ? <Check className="h-3 w-3" /> : <BellPlus className="h-3 w-3" />}
          </button>
        </div>

        <div className="mt-3 flex items-end justify-between border-t border-[hsl(var(--cs2-border))]/50 pt-2">
          <div>
            <p className="cs2-stat-label">Preço Steam</p>
            <p className={`text-xl font-bold ${display ? 'text-green-400' : 'text-muted-foreground'}`}>
              R$ {brl(display)}
            </p>
            {p?.min !== null && p?.median !== null && p && (
              <p className="text-[10px] text-muted-foreground">
                min R$ {brl(p.min)}
              </p>
            )}
          </div>
          {p?.marketPageUrl && (
            <a href={p.marketPageUrl} target="_blank" rel="noopener noreferrer" className="cs2-btn text-[10px]">
              <ExternalLink className="h-3 w-3" /> Steam
            </a>
          )}
        </div>
      </div>
      <div className="cs2-rarity-bar" />
    </div>
  );
}

function RecentBlock({ items }: { items: Recent[] }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Clock className="h-4 w-4 text-[hsl(var(--cs2-amber))]" />
        <h3 className="cs2-stencil text-sm">JOGOS RECENTES</h3>
        <div className="flex-1 border-t border-dashed border-[hsl(var(--cs2-border))]" />
      </div>
      <div className="grid gap-2 md:grid-cols-2">
        {items.map((g) => (
          <div key={g.appId} className="cs2-card cs2-cut-sm flex items-center gap-3 p-3">
            {g.logoUrl && <img src={g.logoUrl} alt={g.name} className="cs2-cut-sm h-8 w-20 object-cover" />}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{g.name}</p>
            </div>
            <div className="text-right text-xs">
              {g.hoursLast2Weeks !== undefined && <p className="font-bold text-[hsl(var(--cs2-amber))]">{g.hoursLast2Weeks}h</p>}
              <p className="text-muted-foreground">total {g.hoursOnRecord}h</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
