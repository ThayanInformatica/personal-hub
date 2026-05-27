'use client';

import { useEffect, useState } from 'react';
import { Plus, Trash2, Power, Bell, BellOff, RotateCcw } from 'lucide-react';

type Sub = {
  id: string;
  name: string;
  category: string;
  amount: number;
  currency: string;
  billingCycle: string;
  dueDay: number | null;
  nextDueAt: string | null;
  paymentMethod: string | null;
  active: boolean;
  alertEnabled: boolean;
  alertDaysBefore: number;
  reminderText: string | null;
  notes: string | null;
};

const CYCLES = [
  { id: 'monthly', label: 'Mensal' },
  { id: 'yearly', label: 'Anual' },
  { id: 'weekly', label: 'Semanal' },
  { id: 'quarterly', label: 'Trimestral' },
  { id: 'biannual', label: 'Semestral' }
];

const METHODS = ['Cartão de crédito', 'Cartão de débito', 'PIX', 'Boleto', 'Débito automático', 'Dinheiro', 'Outro'];

function brl(n: number) { return n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }

export function SubscriptionsTab() {
  const [items, setItems] = useState<Sub[]>([]);
  const [cats, setCats] = useState<{ name: string }[]>([]);
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<Sub | null>(null);

  async function load() {
    const [s, c] = await Promise.all([
      fetch('/api/finance/subscriptions').then((r) => r.json()),
      fetch('/api/finance/categories').then((r) => r.json())
    ]);
    setItems(s);
    setCats(c);
  }
  useEffect(() => { load(); }, []);

  async function toggleActive(s: Sub) {
    await fetch(`/api/finance/subscriptions/${s.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !s.active })
    });
    load();
  }

  async function toggleAlert(s: Sub) {
    await fetch(`/api/finance/subscriptions/${s.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ alertEnabled: !s.alertEnabled })
    });
    load();
  }

  async function remove(id: string) {
    if (!confirm('Remover assinatura?')) return;
    await fetch(`/api/finance/subscriptions/${id}`, { method: 'DELETE' });
    load();
  }

  const totalMonthly = items
    .filter((s) => s.active)
    .reduce((sum, s) => sum + (s.billingCycle === 'monthly' ? s.amount : s.billingCycle === 'yearly' ? s.amount / 12 : s.amount), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm">{items.filter((s) => s.active).length} ativas · <span className="font-bold text-blue-400">R$ {brl(totalMonthly)}/mês</span></p>
        </div>
        <button onClick={() => { setEdit(null); setOpen(true); }} className="flex items-center gap-2 rounded-md bg-foreground px-3 py-2 text-sm font-medium text-background hover:opacity-90">
          <Plus className="h-4 w-4" /> Nova assinatura
        </button>
      </div>

      {items.length === 0 ? (
        <div className="rounded-md border border-dashed border-border/40 p-6 text-center text-sm text-muted-foreground">
          Nenhuma assinatura cadastrada. Adicione Netflix, luz, internet, cartão, etc.
        </div>
      ) : (
        <div className="grid gap-2 md:grid-cols-2">
          {items.map((s) => (
            <div key={s.id} className={`rounded-xl border p-3 ${s.active ? 'border-border/60 bg-card/40' : 'border-border/30 bg-muted/10 opacity-60'}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="truncate font-semibold">{s.name}</h3>
                    <span className="rounded bg-accent/40 px-2 py-0.5 text-[10px]">{s.category}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {s.billingCycle} · {s.paymentMethod ?? 'sem método'}
                    {s.dueDay && ` · dia ${s.dueDay}`}
                  </p>
                  {s.nextDueAt && (
                    <p className="text-[10px] text-yellow-400">
                      próximo: {new Date(s.nextDueAt).toLocaleDateString('pt-BR')}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold">R$ {brl(s.amount)}</p>
                  <div className="mt-1 flex gap-1">
                    <button onClick={() => toggleAlert(s)} title={s.alertEnabled ? 'Alerta ativo' : 'Alerta desligado'} className={s.alertEnabled ? 'text-yellow-400' : 'text-muted-foreground'}>
                      {s.alertEnabled ? <Bell className="h-3.5 w-3.5" /> : <BellOff className="h-3.5 w-3.5" />}
                    </button>
                    <button onClick={() => toggleActive(s)} title={s.active ? 'Pausar' : 'Ativar'} className="text-muted-foreground hover:text-foreground">
                      <Power className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => { setEdit(s); setOpen(true); }} className="text-muted-foreground hover:text-foreground">
                      <RotateCcw className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => remove(s.id)} className="text-muted-foreground hover:text-red-400">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {open && <Dialog initial={edit} categories={cats.map((c) => c.name)} onClose={() => { setOpen(false); setEdit(null); load(); }} />}
    </div>
  );
}

function Dialog({ initial, categories, onClose }: { initial: Sub | null; categories: string[]; onClose: () => void }) {
  const [d, setD] = useState({
    name: initial?.name ?? '',
    category: initial?.category ?? (categories[0] ?? 'Outros'),
    amount: initial?.amount ?? 0,
    billingCycle: initial?.billingCycle ?? 'monthly',
    dueDay: initial?.dueDay ?? '',
    nextDueAt: initial?.nextDueAt ? new Date(initial.nextDueAt).toISOString().slice(0, 10) : '',
    paymentMethod: initial?.paymentMethod ?? METHODS[0],
    alertEnabled: initial?.alertEnabled ?? true,
    alertDaysBefore: initial?.alertDaysBefore ?? 3,
    reminderText: initial?.reminderText ?? '',
    notes: initial?.notes ?? ''
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const body = {
      ...d,
      amount: Number(d.amount),
      dueDay: d.dueDay ? Number(d.dueDay) : null,
      nextDueAt: d.nextDueAt || null
    };
    const url = initial ? `/api/finance/subscriptions/${initial.id}` : '/api/finance/subscriptions';
    const method = initial ? 'PATCH' : 'POST';
    await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-4" onClick={onClose}>
      <form onClick={(e) => e.stopPropagation()} onSubmit={submit} className="my-8 w-full max-w-md space-y-3 rounded-xl border border-border/60 bg-card p-5">
        <h3 className="text-lg font-semibold">{initial ? 'Editar' : 'Nova'} assinatura</h3>
        <div className="grid grid-cols-2 gap-2">
          <label className="col-span-2 space-y-1">
            <span className="text-xs font-medium text-muted-foreground">Nome</span>
            <input className="hub-input" value={d.name} onChange={(e) => setD({ ...d, name: e.target.value })} required placeholder="Ex: Netflix" />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-medium text-muted-foreground">Categoria</span>
            <select className="hub-input" value={d.category} onChange={(e) => setD({ ...d, category: e.target.value })}>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-xs font-medium text-muted-foreground">Valor (R$)</span>
            <input type="number" step="0.01" className="hub-input" value={d.amount} onChange={(e) => setD({ ...d, amount: Number(e.target.value) })} required />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-medium text-muted-foreground">Ciclo</span>
            <select className="hub-input" value={d.billingCycle} onChange={(e) => setD({ ...d, billingCycle: e.target.value })}>
              {CYCLES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-xs font-medium text-muted-foreground">Dia do venc.</span>
            <input type="number" min={1} max={31} className="hub-input" value={d.dueDay} onChange={(e) => setD({ ...d, dueDay: e.target.value })} placeholder="1-31" />
          </label>
          <label className="col-span-2 space-y-1">
            <span className="text-xs font-medium text-muted-foreground">Método de pagamento</span>
            <select className="hub-input" value={d.paymentMethod} onChange={(e) => setD({ ...d, paymentMethod: e.target.value })}>
              {METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </label>
          <label className="col-span-2 space-y-1">
            <span className="text-xs font-medium text-muted-foreground">Próximo vencimento (opcional)</span>
            <input type="date" className="hub-input" value={d.nextDueAt} onChange={(e) => setD({ ...d, nextDueAt: e.target.value })} />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={d.alertEnabled} onChange={(e) => setD({ ...d, alertEnabled: e.target.checked })} /> Alerta WhatsApp
          </label>
          <label className="space-y-1">
            <span className="text-xs font-medium text-muted-foreground">Dias antes</span>
            <input type="number" min={0} max={30} className="hub-input" value={d.alertDaysBefore} onChange={(e) => setD({ ...d, alertDaysBefore: Number(e.target.value) })} />
          </label>
          <label className="col-span-2 space-y-1">
            <span className="text-xs font-medium text-muted-foreground">Texto do lembrete (opcional)</span>
            <input className="hub-input" value={d.reminderText} onChange={(e) => setD({ ...d, reminderText: e.target.value })} placeholder="Cartão final 1234, R$ X" />
          </label>
          <label className="col-span-2 space-y-1">
            <span className="text-xs font-medium text-muted-foreground">Notas</span>
            <textarea className="hub-input" rows={2} value={d.notes} onChange={(e) => setD({ ...d, notes: e.target.value })} />
          </label>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="rounded-md border border-border/60 px-3 py-2 text-sm">Cancelar</button>
          <button type="submit" className="rounded-md bg-foreground px-3 py-2 text-sm font-medium text-background">Salvar</button>
        </div>
      </form>
    </div>
  );
}
