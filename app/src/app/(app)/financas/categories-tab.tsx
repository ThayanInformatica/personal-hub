'use client';

import { useEffect, useState } from 'react';
import { Save, Trash2, Plus } from 'lucide-react';

type Cat = {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
  monthlyBudget: number | null;
  builtin: boolean;
};

function brl(n: number) { return n.toLocaleString('pt-BR', { minimumFractionDigits: 2 }); }

export function CategoriesTab() {
  const [items, setItems] = useState<Cat[]>([]);
  const [editing, setEditing] = useState<Record<string, string>>({});
  const [newName, setNewName] = useState('');

  async function load() {
    setItems(await fetch('/api/finance/categories').then((r) => r.json()));
  }
  useEffect(() => { load(); }, []);

  async function saveBudget(c: Cat, budgetStr: string) {
    const monthlyBudget = budgetStr === '' ? null : Number(budgetStr);
    await fetch(`/api/finance/categories/${c.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ monthlyBudget })
    });
    setEditing((e) => { const n = { ...e }; delete n[c.id]; return n; });
    load();
  }

  async function remove(c: Cat) {
    if (c.builtin) return;
    if (!confirm(`Remover categoria "${c.name}"?`)) return;
    await fetch(`/api/finance/categories/${c.id}`, { method: 'DELETE' });
    load();
  }

  async function add() {
    if (!newName.trim()) return;
    await fetch('/api/finance/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName.trim() })
    });
    setNewName('');
    load();
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Defina orçamento mensal por categoria. O dashboard mostra um alerta quando você ultrapassa.
      </p>

      <div className="flex gap-2">
        <input
          className="hub-input"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Nome da nova categoria"
        />
        <button onClick={add} className="flex items-center gap-1 rounded-md bg-foreground px-3 py-2 text-sm font-medium text-background">
          <Plus className="h-3 w-3" /> Adicionar
        </button>
      </div>

      <div className="space-y-1">
        {items.map((c) => {
          const isEditing = c.id in editing;
          const currentValue = isEditing ? editing[c.id] : (c.monthlyBudget?.toString() ?? '');
          return (
            <div key={c.id} className="flex items-center gap-3 rounded-md border border-border/40 p-2">
              <div className="h-4 w-4 rounded" style={{ background: c.color ?? '#888' }} />
              <span className="flex-1 text-sm font-medium">
                {c.name} {c.builtin && <span className="text-[10px] text-muted-foreground">(preset)</span>}
              </span>
              <div className="flex items-center gap-1">
                <span className="text-xs text-muted-foreground">R$</span>
                <input
                  type="number"
                  step="0.01"
                  value={currentValue}
                  onChange={(e) => setEditing({ ...editing, [c.id]: e.target.value })}
                  className="hub-input w-28 text-right"
                  placeholder="orçamento"
                />
                <button onClick={() => saveBudget(c, currentValue)} className="rounded-md border border-border/40 p-1.5 hover:bg-accent/40" title="Salvar">
                  <Save className="h-3 w-3" />
                </button>
                {!c.builtin && (
                  <button onClick={() => remove(c)} className="text-muted-foreground hover:text-red-400">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
