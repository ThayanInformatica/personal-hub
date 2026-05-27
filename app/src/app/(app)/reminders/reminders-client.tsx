'use client';

import { useState } from 'react';
import { Plus, Trash2, Power, Send } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type Reminder = {
  id: string;
  title: string;
  message: string;
  dueAt: string;
  cronExpr: string | null;
  leadMinutes: number;
  recurring: boolean;
  active: boolean;
  lastSentAt: string | null;
  lastLog: { status: string; error: string | null; sentAt: string } | null;
};

export function RemindersClient({ items }: { items: Reminder[] }) {
  const [open, setOpen] = useState(false);

  async function toggleActive(id: string, active: boolean) {
    await fetch(`/api/reminders/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !active })
    });
    location.reload();
  }

  async function remove(id: string) {
    if (!confirm('Remover lembrete?')) return;
    await fetch(`/api/reminders/${id}`, { method: 'DELETE' });
    location.reload();
  }

  async function testSend(id: string) {
    const res = await fetch(`/api/reminders/${id}/test`, { method: 'POST' });
    const data = await res.json();
    alert(data.ok ? 'Enviado!' : `Falhou: ${data.error}`);
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 rounded-md bg-foreground px-3 py-2 text-sm font-medium text-background hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> Novo lembrete
        </button>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum lembrete cadastrado</p>
      ) : (
        <div className="space-y-2">
          {items.map((r) => (
            <div key={r.id} className="rounded-xl border border-border/60 bg-card/40 p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{r.title}</h3>
                    {!r.active && <span className="rounded bg-muted/40 px-2 py-0.5 text-xs">pausado</span>}
                    {r.recurring && <span className="rounded bg-blue-500/20 px-2 py-0.5 text-xs text-blue-400">recorrente</span>}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{r.message}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Proximo: {format(new Date(r.dueAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    {r.cronExpr && ` · ${r.cronExpr}`}
                    {r.leadMinutes > 0 && ` · ${r.leadMinutes}min antes`}
                  </p>
                  {r.lastLog && (
                    <p className="mt-1 text-xs">
                      <span className={r.lastLog.status === 'SUCCESS' ? 'text-green-400' : 'text-red-400'}>
                        Ultimo envio: {r.lastLog.status}
                      </span>
                      <span className="text-muted-foreground"> em {format(new Date(r.lastLog.sentAt), 'dd/MM HH:mm')}</span>
                      {r.lastLog.error && <span className="text-red-400"> — {r.lastLog.error}</span>}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => testSend(r.id)}
                    className="rounded-md border border-border/40 p-1.5 hover:bg-accent/40"
                    title="Testar envio"
                  >
                    <Send className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => toggleActive(r.id, r.active)}
                    className="rounded-md border border-border/40 p-1.5 hover:bg-accent/40"
                    title={r.active ? 'Pausar' : 'Ativar'}
                  >
                    <Power className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => remove(r.id)}
                    className="rounded-md border border-border/40 p-1.5 hover:bg-red-500/20 hover:text-red-400"
                  >
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
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [dueAt, setDueAt] = useState('');
  const [recurring, setRecurring] = useState(false);
  const [cronExpr, setCronExpr] = useState('0 9 5 * *');
  const [leadMinutes, setLeadMinutes] = useState(0);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch('/api/reminders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        message,
        dueAt: new Date(dueAt).toISOString(),
        recurring,
        cronExpr: recurring ? cronExpr : null,
        leadMinutes
      })
    });
    if (res.ok) location.reload();
    else alert('Erro ao salvar');
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <form onClick={(e) => e.stopPropagation()} onSubmit={submit} className="w-full max-w-md space-y-3 rounded-xl border border-border/60 bg-card p-6">
        <h2 className="text-lg font-semibold">Novo lembrete</h2>
        <Field label="Titulo">
          <input className="hub-input" value={title} onChange={(e) => setTitle(e.target.value)} required />
        </Field>
        <Field label="Mensagem (vai pro WhatsApp)">
          <textarea className="hub-input" rows={3} value={message} onChange={(e) => setMessage(e.target.value)} required />
        </Field>
        <Field label="Data/hora do proximo envio">
          <input type="datetime-local" className="hub-input" value={dueAt} onChange={(e) => setDueAt(e.target.value)} required />
        </Field>
        <Field label="Avisar X minutos antes">
          <input type="number" min={0} className="hub-input" value={leadMinutes} onChange={(e) => setLeadMinutes(Number(e.target.value))} />
        </Field>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={recurring} onChange={(e) => setRecurring(e.target.checked)} />
          Recorrente
        </label>
        {recurring && (
          <Field label="Expressao cron (min hora dia mes dia-semana)">
            <input className="hub-input font-mono" value={cronExpr} onChange={(e) => setCronExpr(e.target.value)} />
            <span className="block text-xs text-muted-foreground">Ex: <code>0 9 5 * *</code> = todo dia 5 as 9h. <code>0 10 * * 1</code> = toda segunda 10h.</span>
          </Field>
        )}
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
