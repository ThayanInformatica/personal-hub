'use client';

import { useEffect, useState } from 'react';
import { Plus, Trash2, Target, TrendingUp } from 'lucide-react';

type Goal = {
  id: string;
  name: string;
  target: number;
  current: number;
  deadline: string | null;
  notes: string | null;
  active: boolean;
};

function brl(n: number) { return n.toLocaleString('pt-BR', { minimumFractionDigits: 2 }); }

export function GoalsTab() {
  const [items, setItems] = useState<Goal[]>([]);
  const [open, setOpen] = useState(false);

  async function load() {
    setItems(await fetch('/api/finance/goals').then((r) => r.json()));
  }
  useEffect(() => { load(); }, []);

  async function addCurrent(g: Goal, delta: number) {
    await fetch(`/api/finance/goals/${g.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ current: Math.max(0, g.current + delta) })
    });
    load();
  }

  async function remove(id: string) {
    if (!confirm('Remover meta?')) return;
    await fetch(`/api/finance/goals/${id}`, { method: 'DELETE' });
    load();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{items.length} meta(s)</p>
        <button onClick={() => setOpen(true)} className="flex items-center gap-2 rounded-md bg-foreground px-3 py-2 text-sm font-medium text-background">
          <Plus className="h-4 w-4" /> Nova meta
        </button>
      </div>

      {items.length === 0 ? (
        <div className="rounded-md border border-dashed border-border/40 p-6 text-center text-sm text-muted-foreground">
          <Target className="mx-auto mb-2 h-6 w-6" />
          Defina metas: viagem, reserva de emergência, comprar X, etc.
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {items.map((g) => {
            const pct = g.target > 0 ? (g.current / g.target) * 100 : 0;
            const remaining = g.target - g.current;
            return (
              <div key={g.id} className="rounded-xl border border-border/60 bg-card/40 p-4">
                <div className="mb-2 flex items-start justify-between">
                  <h3 className="font-semibold">{g.name}</h3>
                  <button onClick={() => remove(g.id)} className="text-muted-foreground hover:text-red-400">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                <p className="text-sm">
                  <span className="font-bold text-green-400">R$ {brl(g.current)}</span>
                  <span className="text-muted-foreground"> / R$ {brl(g.target)}</span>
                </p>
                <div className="my-2 h-3 overflow-hidden rounded bg-muted/30">
                  <div className="h-full bg-gradient-to-r from-green-500 to-emerald-400" style={{ width: `${Math.min(pct, 100)}%` }} />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{pct.toFixed(0)}% concluído</span>
                  {remaining > 0 && <span>Faltam R$ {brl(remaining)}</span>}
                </div>
                {g.deadline && (
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    Prazo: {new Date(g.deadline).toLocaleDateString('pt-BR')}
                  </p>
                )}
                <div className="mt-3 flex gap-1">
                  <button onClick={() => addCurrent(g, 50)} className="flex-1 rounded-md border border-border/40 px-2 py-1 text-xs hover:bg-accent/40">+R$ 50</button>
                  <button onClick={() => addCurrent(g, 100)} className="flex-1 rounded-md border border-border/40 px-2 py-1 text-xs hover:bg-accent/40">+R$ 100</button>
                  <button onClick={() => {
                    const v = prompt('Quanto adicionar?', '100');
                    if (v) addCurrent(g, Number(v));
                  }} className="flex-1 rounded-md border border-border/40 px-2 py-1 text-xs hover:bg-accent/40">
                    <TrendingUp className="inline h-3 w-3" /> Custom
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {open && <Dialog onClose={() => { setOpen(false); load(); }} />}
    </div>
  );
}

function Dialog({ onClose }: { onClose: () => void }) {
  const [d, setD] = useState({ name: '', target: 1000, current: 0, deadline: '', notes: '' });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    await fetch('/api/finance/goals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...d, target: Number(d.target), current: Number(d.current), deadline: d.deadline || null })
    });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <form onClick={(e) => e.stopPropagation()} onSubmit={submit} className="w-full max-w-md space-y-3 rounded-xl border border-border/60 bg-card p-5">
        <h3 className="text-lg font-semibold">Nova meta</h3>
        <label className="block space-y-1">
          <span className="text-xs text-muted-foreground">Nome</span>
          <input className="hub-input" value={d.name} onChange={(e) => setD({ ...d, name: e.target.value })} required placeholder="Ex: Reserva emergência" />
        </label>
        <div className="grid grid-cols-2 gap-2">
          <label className="space-y-1">
            <span className="text-xs text-muted-foreground">Meta (R$)</span>
            <input type="number" step="0.01" className="hub-input" value={d.target} onChange={(e) => setD({ ...d, target: Number(e.target.value) })} required />
          </label>
          <label className="space-y-1">
            <span className="text-xs text-muted-foreground">Atual (R$)</span>
            <input type="number" step="0.01" className="hub-input" value={d.current} onChange={(e) => setD({ ...d, current: Number(e.target.value) })} />
          </label>
        </div>
        <label className="block space-y-1">
          <span className="text-xs text-muted-foreground">Prazo (opcional)</span>
          <input type="date" className="hub-input" value={d.deadline} onChange={(e) => setD({ ...d, deadline: e.target.value })} />
        </label>
        <label className="block space-y-1">
          <span className="text-xs text-muted-foreground">Notas</span>
          <textarea className="hub-input" rows={2} value={d.notes} onChange={(e) => setD({ ...d, notes: e.target.value })} />
        </label>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-md border border-border/60 px-3 py-2 text-sm">Cancelar</button>
          <button type="submit" className="rounded-md bg-foreground px-3 py-2 text-sm font-medium text-background">Criar</button>
        </div>
      </form>
    </div>
  );
}
