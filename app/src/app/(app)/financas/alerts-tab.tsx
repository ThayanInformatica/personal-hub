'use client';

import { useEffect, useState } from 'react';
import { Bell, BellOff, Check, X } from 'lucide-react';

type Sub = {
  id: string;
  name: string;
  category: string;
  amount: number;
  billingCycle: string;
  nextDueAt: string | null;
  alertEnabled: boolean;
  alertDaysBefore: number;
  active: boolean;
};

function brl(n: number) { return n.toLocaleString('pt-BR', { minimumFractionDigits: 2 }); }

export function AlertsTab() {
  const [items, setItems] = useState<Sub[]>([]);

  async function load() {
    setItems(await fetch('/api/finance/subscriptions').then((r) => r.json()));
  }
  useEffect(() => { load(); }, []);

  async function toggle(s: Sub) {
    await fetch(`/api/finance/subscriptions/${s.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ alertEnabled: !s.alertEnabled })
    });
    load();
  }

  async function setDays(s: Sub, days: number) {
    await fetch(`/api/finance/subscriptions/${s.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ alertDaysBefore: days })
    });
    load();
  }

  async function bulkToggle(enable: boolean) {
    await Promise.all(items.map((s) =>
      fetch(`/api/finance/subscriptions/${s.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alertEnabled: enable })
      })
    ));
    load();
  }

  const activeAlerts = items.filter((i) => i.alertEnabled).length;

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/5 p-4">
        <div className="flex items-start gap-3">
          <Bell className="mt-0.5 h-4 w-4 text-yellow-400" />
          <div className="flex-1">
            <p className="text-sm font-semibold">Alertas via WhatsApp</p>
            <p className="mt-1 text-xs text-muted-foreground">
              O worker checa as assinaturas todo dia às 9h. Se alguma vencer dentro do prazo de alerta,
              você recebe uma mensagem no WhatsApp configurado em Settings. Cooldown de 22h por assinatura.
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm">
          <span className="font-bold text-yellow-400">{activeAlerts}</span> de {items.length} com alerta ativo
        </p>
        <div className="flex gap-1">
          <button onClick={() => bulkToggle(true)} className="rounded-md border border-border/40 px-2 py-1 text-xs hover:bg-accent/40">
            <Check className="mr-1 inline h-3 w-3" /> Ligar todos
          </button>
          <button onClick={() => bulkToggle(false)} className="rounded-md border border-border/40 px-2 py-1 text-xs hover:bg-accent/40">
            <X className="mr-1 inline h-3 w-3" /> Desligar todos
          </button>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="rounded-md border border-dashed border-border/40 p-6 text-center text-sm text-muted-foreground">
          Cadastra assinaturas pra configurar alertas.
        </div>
      ) : (
        <div className="space-y-1">
          {items.map((s) => (
            <div key={s.id} className={`flex flex-wrap items-center gap-3 rounded-md border p-3 ${s.active ? 'border-border/40' : 'border-border/20 opacity-60'}`}>
              <button onClick={() => toggle(s)} className={s.alertEnabled ? 'text-yellow-400' : 'text-muted-foreground'}>
                {s.alertEnabled ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
              </button>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{s.name}</p>
                <p className="text-[10px] text-muted-foreground">
                  R$ {brl(s.amount)} · {s.billingCycle}
                  {s.nextDueAt && ` · vence ${new Date(s.nextDueAt).toLocaleDateString('pt-BR')}`}
                </p>
              </div>
              <label className="flex items-center gap-1 text-xs">
                <span className="text-muted-foreground">Avisar</span>
                <select
                  value={s.alertDaysBefore}
                  onChange={(e) => setDays(s, Number(e.target.value))}
                  disabled={!s.alertEnabled}
                  className="hub-input w-32 disabled:opacity-50"
                >
                  <option value={0}>no dia</option>
                  <option value={1}>1 dia antes</option>
                  <option value={2}>2 dias antes</option>
                  <option value={3}>3 dias antes</option>
                  <option value={5}>5 dias antes</option>
                  <option value={7}>1 semana antes</option>
                </select>
              </label>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
