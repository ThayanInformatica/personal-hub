'use client';

import { useState } from 'react';
import { Plus, Trash2, Copy, Star, Server, Check } from 'lucide-react';

type GameServer = {
  id: string;
  name: string;
  address: string;
  kind: string;
  password: string | null;
  notes: string | null;
  tags: string[];
  favorite: boolean;
};

const KINDS = ['dm', 'retake', 'wingman', 'community', 'surf', 'kz', 'aim', 'practice'];

export function ServersTab({ items }: { items: GameServer[] }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('ALL');

  const filtered = filter === 'ALL' ? items : items.filter((s) => s.kind === filter);

  async function copyConnect(s: GameServer) {
    const cmd = s.password
      ? `connect ${s.address}; password ${s.password}`
      : `connect ${s.address}`;
    await navigator.clipboard.writeText(cmd);
    setCopied(s.id);
    setTimeout(() => setCopied(null), 1500);
  }

  async function toggleFav(s: GameServer) {
    await fetch(`/api/servers/${s.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ favorite: !s.favorite })
    });
    location.reload();
  }

  async function remove(id: string) {
    if (!confirm('Remover servidor?')) return;
    await fetch(`/api/servers/${id}`, { method: 'DELETE' });
    location.reload();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1">
          {['ALL', ...KINDS].map((k) => (
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
          <Plus className="h-4 w-4" /> Novo servidor
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-md border border-dashed border-border/40 p-6 text-center text-sm text-muted-foreground">
          <Server className="mx-auto mb-2 h-6 w-6" />
          Nenhum servidor cadastrado. Adicione DM, retake, surf...
        </div>
      ) : (
        <div className="grid gap-2 md:grid-cols-2">
          {filtered.map((s) => (
            <div key={s.id} className="rounded-xl border border-border/60 bg-card/40 p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-accent/40 px-2 py-0.5 text-xs">{s.kind}</span>
                    <h3 className="truncate font-semibold">{s.name}</h3>
                  </div>
                  <code className="mt-1 block truncate text-xs text-muted-foreground">{s.address}</code>
                  {s.notes && <p className="mt-1 text-xs text-muted-foreground">{s.notes}</p>}
                  {s.tags.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {s.tags.map((t) => (
                        <span key={t} className="rounded bg-accent/40 px-1.5 py-0.5 text-[10px]">{t}</span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-1">
                  <button onClick={() => toggleFav(s)} title="Favorito">
                    <Star className={`h-4 w-4 ${s.favorite ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`} />
                  </button>
                  <button onClick={() => copyConnect(s)} className="text-muted-foreground hover:text-foreground" title="Copiar comando connect">
                    {copied === s.id ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                  <button onClick={() => remove(s.id)} className="text-muted-foreground hover:text-red-400">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {open && <NewDialog onClose={() => setOpen(false)} />}
    </div>
  );
}

function NewDialog({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [kind, setKind] = useState('community');
  const [password, setPassword] = useState('');
  const [notes, setNotes] = useState('');
  const [tags, setTags] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    await fetch('/api/servers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        address,
        kind,
        password: password || null,
        notes: notes || null,
        tags: tags.split(',').map((t) => t.trim()).filter(Boolean)
      })
    });
    location.reload();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <form onClick={(e) => e.stopPropagation()} onSubmit={submit} className="w-full max-w-md space-y-3 rounded-xl border border-border/60 bg-card p-6">
        <h2 className="text-lg font-semibold">Novo servidor</h2>
        <label className="block space-y-1">
          <span className="text-xs font-medium text-muted-foreground">Nome</span>
          <input className="hub-input" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Ex: FastCup DM" />
        </label>
        <label className="block space-y-1">
          <span className="text-xs font-medium text-muted-foreground">Endereço (IP:porta)</span>
          <input className="hub-input font-mono" value={address} onChange={(e) => setAddress(e.target.value)} required placeholder="Ex: 168.234.234.10:27015" />
        </label>
        <label className="block space-y-1">
          <span className="text-xs font-medium text-muted-foreground">Tipo</span>
          <select className="hub-input" value={kind} onChange={(e) => setKind(e.target.value)}>
            {KINDS.map((k) => (<option key={k} value={k}>{k}</option>))}
          </select>
        </label>
        <label className="block space-y-1">
          <span className="text-xs font-medium text-muted-foreground">Senha (opcional)</span>
          <input className="hub-input" value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        <label className="block space-y-1">
          <span className="text-xs font-medium text-muted-foreground">Notas</span>
          <textarea className="hub-input" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </label>
        <label className="block space-y-1">
          <span className="text-xs font-medium text-muted-foreground">Tags (vírgula)</span>
          <input className="hub-input" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="brasil, sp, 128 tick" />
        </label>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="rounded-md border border-border/60 px-3 py-2 text-sm">Cancelar</button>
          <button type="submit" className="rounded-md bg-foreground px-3 py-2 text-sm font-medium text-background">Salvar</button>
        </div>
      </form>
    </div>
  );
}
