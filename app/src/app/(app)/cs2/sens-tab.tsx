'use client';

import { useMemo, useState } from 'react';
import { Copy } from 'lucide-react';

type Game = 'cs2' | 'valorant' | 'apex' | 'quake' | 'fortnite' | 'overwatch';

const YAW: Record<Game, number> = {
  cs2: 0.022,
  valorant: 0.07,
  apex: 0.022,
  quake: 0.022,
  fortnite: 0.5715,
  overwatch: 0.0066
};

const LABEL: Record<Game, string> = {
  cs2: 'CS2 / CSGO',
  valorant: 'Valorant',
  apex: 'Apex Legends',
  quake: 'Quake / Source',
  fortnite: 'Fortnite',
  overwatch: 'Overwatch'
};

function cm360(sens: number, dpi: number, yaw: number) {
  if (sens <= 0 || dpi <= 0) return 0;
  return (360 / (sens * yaw)) / (dpi / 2.54);
}

function sensFromCm360(cm: number, dpi: number, yaw: number) {
  if (cm <= 0 || dpi <= 0) return 0;
  return 360 / (cm * (dpi / 2.54) * yaw);
}

export function SensTab() {
  const [game, setGame] = useState<Game>('cs2');
  const [sens, setSens] = useState(1.0);
  const [dpi, setDpi] = useState(800);

  const cm = useMemo(() => cm360(sens, dpi, YAW[game]), [sens, dpi, game]);

  const others = (Object.keys(YAW) as Game[]).filter((g) => g !== game);

  async function copySens(value: number) {
    await navigator.clipboard.writeText(value.toFixed(4));
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Coloca sua sens atual em CS2 (ou outro jogo) e o DPI do mouse. Veja a equivalente em cm/360 e em todos os jogos.
      </p>

      <div className="grid gap-3 md:grid-cols-3">
        <label className="space-y-1">
          <span className="text-xs font-medium text-muted-foreground">Jogo de origem</span>
          <select className="hub-input" value={game} onChange={(e) => setGame(e.target.value as Game)}>
            {(Object.keys(LABEL) as Game[]).map((g) => (
              <option key={g} value={g}>{LABEL[g]}</option>
            ))}
          </select>
        </label>
        <label className="space-y-1">
          <span className="text-xs font-medium text-muted-foreground">Sensibilidade</span>
          <input
            type="number"
            step={0.01}
            min={0}
            className="hub-input"
            value={sens}
            onChange={(e) => setSens(Number(e.target.value))}
          />
        </label>
        <label className="space-y-1">
          <span className="text-xs font-medium text-muted-foreground">DPI do mouse</span>
          <input
            type="number"
            min={100}
            max={20000}
            step={100}
            className="hub-input"
            value={dpi}
            onChange={(e) => setDpi(Number(e.target.value))}
          />
        </label>
      </div>

      <div className="rounded-xl border border-border/60 bg-card p-5 text-center">
        <p className="text-xs text-muted-foreground">cm para girar 360°</p>
        <p className="mt-1 text-3xl font-bold">{cm.toFixed(2)} cm</p>
        <p className="mt-1 text-xs text-muted-foreground">
          eDPI: {(sens * dpi).toFixed(0)}
        </p>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-semibold">Equivalente em outros jogos</h3>
        <div className="grid gap-2 md:grid-cols-2">
          {others.map((g) => {
            const equivSens = sensFromCm360(cm, dpi, YAW[g]);
            return (
              <div key={g} className="flex items-center justify-between rounded-md border border-border/40 p-3">
                <div>
                  <p className="text-sm font-medium">{LABEL[g]}</p>
                  <p className="text-xs text-muted-foreground">sens: {equivSens.toFixed(4)}</p>
                </div>
                <button
                  onClick={() => copySens(equivSens)}
                  className="rounded-md border border-border/40 p-1.5 hover:bg-accent/40"
                  title="Copiar"
                >
                  <Copy className="h-3 w-3" />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
