'use client';

import { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';

type Expense = {
  id: string;
  description: string;
  category: string;
  amount: number;
  paidAt: string;
  paymentMethod: string | null;
  notes: string | null;
};

const METHODS = ['Cartão de crédito', 'Cartão de débito', 'PIX', 'Boleto', 'Dinheiro', 'Outro'];

function brl(n: number) { return n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }

export function ExpensesTab() {
  const [items, setItems] = useState<Expense[]>([]);
  const [cats, setCats] = useState<{ name: string }[]>([]);
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));

  async function load() {
    const [e, c] = await Promise.all([
      fetch(`/api/finance/expenses?month=${month}`).then((r) => r.json()),
      fetch('/api/finance/categories').then((r) => r.json())
    ]);
    setItems(e);
    setCats(c);
  }
  useEffect(() => { load(); }, [month]);

  async function remove(id: string) {
    if (!confirm('Remover?')) return;
    await fetch(`/api/finance/expenses/${id}`, { method: 'DELETE' });
    load();
  }

  const total = items.reduce((s, i) => s + i.amount, 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <input type="month" className="hub-input max-w-[180px]" value={month} onChange={(e) => setMonth(e.target.value)} />
          <span className="text-sm text-muted-foreground">Total: <span className="font-bold text-blue-400">R$ {brl(total)}</span></span>
        </div>
        <button onClick={() => setOpen(true)} className="flex items-center gap-2 rounded-md bg-foreground px-3 py-2 text-sm font-medium text-background">
          <Plus className="h-4 w-4" /> Novo gasto
        </button>
      </div>

      {items.length === 0 ? (
        <div className="rounded-md border border-dashed border-border/40 p-6 text-center text-sm text-muted-foreground">
          Nenhum gasto em {month}.
        </div>
      ) : (
        <div className="space-y-1">
          {items.map((e) => (
            <div key={e.id} className="flex items-center gap-3 rounded-md border border-border/40 p-2">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{e.description}</p>
                <p className="text-[10px] text-muted-foreground">
                  {new Date(e.paidAt).toLocaleDateString('pt-BR')} · {e.category}
                  {e.paymentMethod && ` · ${e.paymentMethod}`}
                </p>
              </div>
              <p className="font-bold">R$ {brl(e.amount)}</p>
              <button onClick={() => remove(e.id)} className="text-muted-foreground hover:text-red-400">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {open && <Dialog cats={cats.map((c) => c.name)} onClose={() => { setOpen(false); load(); }} />}
    </div>
  );
}

function Dialog({ cats, onClose }: { cats: string[]; onClose: () => void }) {
  const [d, setD] = useState({
    description: '',
    category: cats[0] ?? 'Outros',
    amount: 0,
    paidAt: new Date().toISOString().slice(0, 10),
    paymentMethod: METHODS[0],
    notes: ''
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    await fetch('/api/finance/expenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...d, amount: Number(d.amount), paidAt: new Date(d.paidAt).toISOString() })
    });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <form onClick={(e) => e.stopPropagation()} onSubmit={submit} className="w-full max-w-md space-y-3 rounded-xl border border-border/60 bg-card p-5">
        <h3 className="text-lg font-semibold">Novo gasto</h3>
        <label className="block space-y-1">
          <span className="text-xs text-muted-foreground">Descrição</span>
          <input className="hub-input" value={d.description} onChange={(e) => setD({ ...d, description: e.target.value })} required />
        </label>
        <div className="grid grid-cols-2 gap-2">
          <label className="space-y-1">
            <span className="text-xs text-muted-foreground">Valor</span>
            <input type="number" step="0.01" className="hub-input" value={d.amount} onChange={(e) => setD({ ...d, amount: Number(e.target.value) })} required />
          </label>
          <label className="space-y-1">
            <span className="text-xs text-muted-foreground">Data</span>
            <input type="date" className="hub-input" value={d.paidAt} onChange={(e) => setD({ ...d, paidAt: e.target.value })} />
          </label>
          <label className="space-y-1">
            <span className="text-xs text-muted-foreground">Categoria</span>
            <select className="hub-input" value={d.category} onChange={(e) => setD({ ...d, category: e.target.value })}>
              {cats.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-xs text-muted-foreground">Método</span>
            <select className="hub-input" value={d.paymentMethod} onChange={(e) => setD({ ...d, paymentMethod: e.target.value })}>
              {METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </label>
        </div>
        <label className="block space-y-1">
          <span className="text-xs text-muted-foreground">Notas</span>
          <input className="hub-input" value={d.notes} onChange={(e) => setD({ ...d, notes: e.target.value })} />
        </label>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-md border border-border/60 px-3 py-2 text-sm">Cancelar</button>
          <button type="submit" className="rounded-md bg-foreground px-3 py-2 text-sm font-medium text-background">Salvar</button>
        </div>
      </form>
    </div>
  );
}
