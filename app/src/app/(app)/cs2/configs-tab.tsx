'use client';

import { useState } from 'react';
import { Plus, Trash2, Copy } from 'lucide-react';

type ConfigKind = 'AUTOEXEC' | 'VIDEO' | 'VIEWMODEL' | 'LAUNCH' | 'BINDS';

type GameConfig = {
  id: string;
  kind: ConfigKind;
  name: string;
  body: string;
  active: boolean;
};

const KINDS: ConfigKind[] = ['AUTOEXEC', 'VIDEO', 'VIEWMODEL', 'LAUNCH', 'BINDS'];

export function ConfigsTab({ items }: { items: GameConfig[] }) {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<ConfigKind | 'ALL'>('ALL');

  const filtered = filter === 'ALL' ? items : items.filter((c) => c.kind === filter);

  async function remove(id: string) {
    if (!confirm('Remover config?')) return;
    await fetch(`/api/configs/${id}`, { method: 'DELETE' });
    location.reload();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex gap-1">
          {(['ALL', ...KINDS] as const).map((k) => (
            <button
              key={k}
              onClick={() => setFilter(k)}
              className={`rounded-md px-2 py-1 text-xs ${
                filter === k ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:bg-accent/40'
              }`}
            >
              {k}
            </button>
          ))}
        </div>
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 rounded-md bg-foreground px-3 py-2 text-sm font-medium text-background hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> Nova config
        </button>
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhuma config</p>
      ) : (
        <div className="space-y-3">
          {filtered.map((c) => (
            <div key={c.id} className="rounded-xl border border-border/60 bg-card/40 p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-accent/40 px-2 py-0.5 text-xs">{c.kind}</span>
                    <h3 className="font-semibold">{c.name}</h3>
                    {c.active && <span className="rounded bg-green-500/20 px-2 py-0.5 text-xs text-green-400">ativa</span>}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => navigator.clipboard.writeText(c.body)}
                    className="rounded-md border border-border/40 p-1 hover:bg-accent/40"
                    title="Copiar"
                  >
                    <Copy className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => remove(c.id)}
                    className="rounded-md border border-border/40 p-1 hover:bg-red-500/20 hover:text-red-400"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
              <pre className="mt-3 max-h-48 overflow-auto rounded bg-muted/40 p-3 text-xs">{c.body}</pre>
            </div>
          ))}
        </div>
      )}

      {open && <NewDialog onClose={() => setOpen(false)} />}
    </div>
  );
}

function NewDialog({ onClose }: { onClose: () => void }) {
  const [kind, setKind] = useState<ConfigKind>('AUTOEXEC');
  const [name, setName] = useState('');
  const [body, setBody] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    await fetch('/api/configs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kind, name, body })
    });
    location.reload();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
        className="w-full max-w-2xl space-y-3 rounded-xl border border-border/60 bg-card p-6"
      >
        <h2 className="text-lg font-semibold">Nova config</h2>
        <div className="grid grid-cols-2 gap-3">
          <label className="space-y-1">
            <span className="text-xs font-medium text-muted-foreground">Tipo</span>
            <select className="hub-input" value={kind} onChange={(e) => setKind(e.target.value as ConfigKind)}>
              {KINDS.map((k) => (
                <option key={k} value={k}>{k}</option>
              ))}
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-xs font-medium text-muted-foreground">Nome</span>
            <input className="hub-input" value={name} onChange={(e) => setName(e.target.value)} required />
          </label>
        </div>
        <label className="space-y-1">
          <span className="text-xs font-medium text-muted-foreground">Conteudo</span>
          <textarea className="hub-input font-mono text-xs" rows={12} value={body} onChange={(e) => setBody(e.target.value)} required />
        </label>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="rounded-md border border-border/60 px-3 py-2 text-sm">
            Cancelar
          </button>
          <button type="submit" className="rounded-md bg-foreground px-3 py-2 text-sm font-medium text-background">
            Salvar
          </button>
        </div>
      </form>
    </div>
  );
}
