'use client';

import { useState } from 'react';
import { Map as MapIcon } from 'lucide-react';
import { MAPS, type CS2Map, type CalloutArea } from '@/lib/cs2-callouts';

const AREA_ORDER: CalloutArea[] = ['A', 'B', 'Mid', 'Conector', 'T Spawn', 'CT Spawn'];
const AREA_COLOR: Record<CalloutArea, string> = {
  A: 'border-red-500/40 bg-red-500/5',
  B: 'border-blue-500/40 bg-blue-500/5',
  Mid: 'border-purple-500/40 bg-purple-500/5',
  Conector: 'border-yellow-500/40 bg-yellow-500/5',
  'T Spawn': 'border-orange-500/40 bg-orange-500/5',
  'CT Spawn': 'border-cyan-500/40 bg-cyan-500/5'
};

export function CalloutsTab() {
  const [mapId, setMapId] = useState<string>(MAPS[0].id);
  const [filter, setFilter] = useState<'active' | 'all'>('active');
  const [search, setSearch] = useState('');

  const visibleMaps = filter === 'active' ? MAPS.filter((m) => m.pool === 'active') : MAPS;
  const current = MAPS.find((m) => m.id === mapId) ?? MAPS[0];

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Callouts por mapa em PT-BR. Útil pra calar e ditar posições no microfone sem trava.
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex gap-1">
          {(['active', 'all'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-md px-2 py-1 text-xs ${
                filter === f ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:bg-accent/40'
              }`}
            >
              {f === 'active' ? 'Active duty' : 'Todos'}
            </button>
          ))}
        </div>
        <input
          type="text"
          placeholder="Buscar callout..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="hub-input max-w-xs"
        />
      </div>

      <div className="grid gap-2 md:grid-cols-4">
        {visibleMaps.map((m) => (
          <button
            key={m.id}
            onClick={() => setMapId(m.id)}
            className={`flex items-center gap-2 rounded-md border p-3 text-left text-sm transition-colors ${
              m.id === mapId ? 'border-foreground bg-accent' : 'border-border/40 hover:border-border/80'
            }`}
          >
            <MapIcon className="h-4 w-4" />
            <div>
              <p className="font-semibold">{m.name}</p>
              <p className="text-[10px] text-muted-foreground">{m.pool}</p>
            </div>
          </button>
        ))}
      </div>

      <MapView map={current} search={search} />
    </div>
  );
}

function MapView({ map, search }: { map: CS2Map; search: string }) {
  const q = search.trim().toLowerCase();

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border/60 bg-card/40 p-4">
        <h3 className="text-lg font-bold">{map.name}</h3>
        <p className="text-sm text-muted-foreground">{map.description}</p>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {AREA_ORDER.map((area) => {
          const callouts = map.areas[area] ?? [];
          const filtered = q
            ? callouts.filter((c) =>
                c.name.toLowerCase().includes(q) ||
                (c.alias ?? []).some((a) => a.toLowerCase().includes(q)) ||
                (c.notes ?? '').toLowerCase().includes(q)
              )
            : callouts;
          if (filtered.length === 0) return null;
          return (
            <div key={area} className={`rounded-xl border p-4 ${AREA_COLOR[area]}`}>
              <h4 className="mb-2 text-sm font-bold uppercase tracking-wider">{area}</h4>
              <ul className="space-y-2">
                {filtered.map((c) => (
                  <li key={c.name} className="text-sm">
                    <p className="font-medium">{c.name}</p>
                    {c.alias && c.alias.length > 0 && (
                      <p className="text-xs text-muted-foreground">também: {c.alias.join(', ')}</p>
                    )}
                    {c.notes && <p className="text-xs text-muted-foreground italic">{c.notes}</p>}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
