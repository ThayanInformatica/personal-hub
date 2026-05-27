'use client';

import { useMemo, useState } from 'react';
import { Copy, Check } from 'lucide-react';

type Flag = { key: string; label: string; description: string; default?: boolean; recommended?: boolean };

const FLAGS: Flag[] = [
  { key: '-novid', label: '-novid', description: 'Pula o vídeo de intro da Valve', default: true, recommended: true },
  { key: '-high', label: '-high', description: 'Prioridade alta de CPU (cuidado em PCs fracos)' },
  { key: '-tickrate 128', label: '-tickrate 128', description: 'Servidor local de prática em 128 tick' },
  { key: '-allow_third_party_software', label: '-allow_third_party_software', description: 'Permite overlays (NVIDIA, Discord) sem aviso' },
  { key: '-language english', label: '-language english', description: 'Força UI em inglês' },
  { key: '-nojoy', label: '-nojoy', description: 'Desativa suporte a joystick (ganha alguns MB de RAM)' },
  { key: '-no-browser', label: '-no-browser', description: 'Desativa o browser interno (motd, MOTDs)' },
  { key: '+fps_max 0', label: '+fps_max 0', description: 'Remove cap de FPS' },
  { key: '+exec autoexec.cfg', label: '+exec autoexec.cfg', description: 'Carrega autoexec na inicialização' },
  { key: '-fullscreen', label: '-fullscreen', description: 'Força fullscreen exclusivo' },
  { key: '-windowed -noborder', label: '-windowed -noborder', description: 'Windowed sem borda (alt-tab rápido)' }
];

export function LaunchTab() {
  const [active, setActive] = useState<Set<string>>(() => new Set(FLAGS.filter((f) => f.default).map((f) => f.key)));
  const [threads, setThreads] = useState<number | null>(null);
  const [refresh, setRefresh] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  const result = useMemo(() => {
    const parts = [...active];
    if (threads && threads > 0) parts.push(`-threads ${threads}`);
    if (refresh && refresh > 0) parts.push(`-refresh ${refresh}`);
    return parts.join(' ');
  }, [active, threads, refresh]);

  function toggle(key: string) {
    setActive((s) => {
      const next = new Set(s);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  async function copy() {
    await navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Marque o que você quer e copie. No Steam: <strong>botão direito em CS2 → Propriedades → Opções de inicialização</strong>.
      </p>

      <div className="grid gap-2 md:grid-cols-2">
        {FLAGS.map((f) => {
          const on = active.has(f.key);
          return (
            <label
              key={f.key}
              className={`flex cursor-pointer items-start gap-3 rounded-md border p-3 text-sm transition-colors ${
                on ? 'border-foreground bg-accent/20' : 'border-border/40 hover:bg-accent/20'
              }`}
            >
              <input type="checkbox" checked={on} onChange={() => toggle(f.key)} className="mt-0.5" />
              <div className="flex-1">
                <code className="text-xs font-semibold">{f.label}</code>
                {f.recommended && <span className="ml-2 rounded bg-green-500/20 px-1.5 py-0.5 text-[10px] text-green-400">recomendado</span>}
                <p className="mt-0.5 text-xs text-muted-foreground">{f.description}</p>
              </div>
            </label>
          );
        })}
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <label className="space-y-1">
          <span className="text-xs font-medium text-muted-foreground">-threads N (núcleos lógicos disponíveis; 0 = nada)</span>
          <input
            type="number"
            min={0}
            max={32}
            className="hub-input"
            value={threads ?? ''}
            onChange={(e) => setThreads(e.target.value ? Number(e.target.value) : null)}
            placeholder="ex: 8"
          />
        </label>
        <label className="space-y-1">
          <span className="text-xs font-medium text-muted-foreground">-refresh N (taxa do monitor; 0 = nada)</span>
          <input
            type="number"
            min={0}
            max={500}
            className="hub-input"
            value={refresh ?? ''}
            onChange={(e) => setRefresh(e.target.value ? Number(e.target.value) : null)}
            placeholder="ex: 240"
          />
        </label>
      </div>

      <div className="rounded-xl border border-border/60 bg-card p-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">Resultado:</span>
          <button
            onClick={copy}
            className="flex items-center gap-1 rounded-md border border-border/40 px-2 py-1 text-xs hover:bg-accent/40"
          >
            {copied ? <><Check className="h-3 w-3 text-green-400" /> Copiado</> : <><Copy className="h-3 w-3" /> Copiar</>}
          </button>
        </div>
        <code className="block break-all rounded bg-muted/40 p-3 text-xs">{result || '(nada selecionado)'}</code>
      </div>
    </div>
  );
}
