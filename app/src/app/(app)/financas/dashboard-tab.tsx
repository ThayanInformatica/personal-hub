'use client';

import { useEffect, useState } from 'react';
import { Repeat, Wallet, TrendingDown, Target, Bell, ArrowRight, Calendar } from 'lucide-react';

type Summary = {
  month: string;
  monthlyRecurring: number;
  yearlyRecurring: number;
  monthExpenseTotal: number;
  totalThisMonth: number;
  activeSubsCount: number;
  expenseCount: number;
  totalSaved: number;
  byCategory: Record<string, { spent: number; budget: number | null }>;
  monthlyHistory: { month: string; total: number }[];
  goals: { id: string; name: string; current: number; target: number; pct: number; deadline: string | null }[];
  topSubs: { id: string; name: string; category: string; amount: number; monthly: number; billingCycle: string; nextDueAt: string | null }[];
  dueSoon: { id: string; name: string; amount: number; nextDueAt: string; category: string }[];
};

function brl(n: number): string {
  return n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function DashboardTab() {
  const [s, setS] = useState<Summary | null>(null);
  useEffect(() => {
    fetch('/api/finance/summary').then((r) => r.json()).then(setS).catch(() => {});
  }, []);

  if (!s) return <p className="text-sm text-muted-foreground">Carregando...</p>;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <BigCard
          icon={<Wallet className="h-4 w-4" />}
          label="Total mês"
          value={`R$ ${brl(s.totalThisMonth)}`}
          accent
        />
        <BigCard
          icon={<Repeat className="h-4 w-4" />}
          label="Recorrentes/mês"
          value={`R$ ${brl(s.monthlyRecurring)}`}
          sub={`${s.activeSubsCount} ativas · R$ ${brl(s.yearlyRecurring)}/ano`}
        />
        <BigCard
          icon={<TrendingDown className="h-4 w-4" />}
          label="Gastos avulsos"
          value={`R$ ${brl(s.monthExpenseTotal)}`}
          sub={`${s.expenseCount} compras`}
        />
        <BigCard
          icon={<Target className="h-4 w-4" />}
          label="Economizado"
          value={`R$ ${brl(s.totalSaved)}`}
          sub={`${s.goals.length} meta(s)`}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <CategoryBreakdown byCategory={s.byCategory} />
        <DueSoonList items={s.dueSoon} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <MonthlyHistory items={s.monthlyHistory} />
        <TopSubs items={s.topSubs} />
      </div>

      {s.goals.length > 0 && <GoalsBlock goals={s.goals} />}
    </div>
  );
}

function BigCard({ icon, label, value, sub, accent }: { icon: React.ReactNode; label: string; value: string; sub?: string; accent?: boolean }) {
  return (
    <div className={`rounded-xl border border-border/60 bg-card/40 p-4 ${accent ? 'ring-1 ring-blue-500/40' : ''}`}>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{label}</span>
        {icon}
      </div>
      <p className={`mt-2 text-2xl font-bold ${accent ? 'text-blue-400' : ''}`}>{value}</p>
      {sub && <p className="mt-1 text-[10px] text-muted-foreground">{sub}</p>}
    </div>
  );
}

function CategoryBreakdown({ byCategory }: { byCategory: Summary['byCategory'] }) {
  const items = Object.entries(byCategory)
    .filter(([, v]) => v.spent > 0)
    .sort((a, b) => b[1].spent - a[1].spent);
  const total = items.reduce((s, [, v]) => s + v.spent, 0);
  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-border/60 bg-card/40 p-4">
        <h3 className="mb-2 text-sm font-semibold">Por categoria</h3>
        <p className="text-xs text-muted-foreground">Sem gastos no mês.</p>
      </div>
    );
  }
  return (
    <div className="rounded-xl border border-border/60 bg-card/40 p-4">
      <h3 className="mb-3 text-sm font-semibold">Gastos por categoria</h3>
      <div className="space-y-2">
        {items.slice(0, 8).map(([name, v]) => {
          const pct = total > 0 ? (v.spent / total) * 100 : 0;
          const overBudget = v.budget != null && v.spent > v.budget;
          return (
            <div key={name}>
              <div className="mb-1 flex justify-between text-xs">
                <span className="font-medium">{name}</span>
                <span className={overBudget ? 'text-red-400' : 'text-muted-foreground'}>
                  R$ {brl(v.spent)}{v.budget ? ` / R$ ${brl(v.budget)}` : ''} · {pct.toFixed(0)}%
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded bg-muted/30">
                <div
                  className={`h-full ${overBudget ? 'bg-red-500' : 'bg-blue-500'}`}
                  style={{ width: `${Math.min(pct, 100)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DueSoonList({ items }: { items: Summary['dueSoon'] }) {
  return (
    <div className="rounded-xl border border-border/60 bg-card/40 p-4">
      <div className="mb-3 flex items-center gap-2">
        <Bell className="h-4 w-4 text-yellow-400" />
        <h3 className="text-sm font-semibold">Vencem em 7 dias</h3>
      </div>
      {items.length === 0 ? (
        <p className="text-xs text-muted-foreground">Nada pra pagar nos próximos 7 dias 🎉</p>
      ) : (
        <div className="space-y-2">
          {items.map((s) => {
            const date = new Date(s.nextDueAt);
            const days = Math.ceil((date.getTime() - Date.now()) / (24 * 60 * 60 * 1000));
            return (
              <div key={s.id} className="flex items-center gap-3 rounded-md border border-border/40 p-2">
                <div className="cs2-cut-sm flex h-10 w-10 shrink-0 flex-col items-center justify-center bg-yellow-500/10 text-yellow-400">
                  <span className="text-[10px]">{days === 0 ? 'HOJE' : days < 0 ? 'ATRAS' : `${days}D`}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{s.name}</p>
                  <p className="text-[10px] text-muted-foreground">{s.category}</p>
                </div>
                <p className="font-bold">R$ {brl(s.amount)}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function MonthlyHistory({ items }: { items: Summary['monthlyHistory'] }) {
  const max = Math.max(...items.map((i) => i.total), 1);
  return (
    <div className="rounded-xl border border-border/60 bg-card/40 p-4">
      <div className="mb-3 flex items-center gap-2">
        <Calendar className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold">Últimos 6 meses</h3>
      </div>
      <div className="flex items-end justify-between gap-2" style={{ height: 120 }}>
        {items.map((m) => {
          const h = max > 0 ? (m.total / max) * 100 : 0;
          return (
            <div key={m.month} className="flex flex-1 flex-col items-center justify-end gap-1">
              <span className="text-[10px] font-bold text-blue-400">R$ {(m.total / 1000).toFixed(1)}k</span>
              <div className="w-full rounded-t bg-gradient-to-t from-blue-500/60 to-blue-500/20" style={{ height: `${h}%`, minHeight: 2 }} />
              <span className="text-[10px] text-muted-foreground">{m.month.slice(5)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TopSubs({ items }: { items: Summary['topSubs'] }) {
  return (
    <div className="rounded-xl border border-border/60 bg-card/40 p-4">
      <h3 className="mb-3 text-sm font-semibold">Top 5 assinaturas</h3>
      {items.length === 0 ? (
        <p className="text-xs text-muted-foreground">Sem assinaturas cadastradas.</p>
      ) : (
        <div className="space-y-2">
          {items.map((s) => (
            <div key={s.id} className="flex items-center justify-between text-sm">
              <div>
                <p className="font-medium">{s.name}</p>
                <p className="text-[10px] text-muted-foreground">{s.category} · {s.billingCycle}</p>
              </div>
              <div className="text-right">
                <p className="font-bold">R$ {brl(s.amount)}</p>
                <p className="text-[10px] text-muted-foreground">~R$ {brl(s.monthly)}/mês</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function GoalsBlock({ goals }: { goals: Summary['goals'] }) {
  return (
    <div className="rounded-xl border border-border/60 bg-card/40 p-4">
      <div className="mb-3 flex items-center gap-2">
        <Target className="h-4 w-4 text-green-400" />
        <h3 className="text-sm font-semibold">Metas de economia</h3>
      </div>
      <div className="space-y-3">
        {goals.map((g) => (
          <div key={g.id}>
            <div className="mb-1 flex justify-between text-sm">
              <span className="font-medium">{g.name}</span>
              <span className="text-muted-foreground">
                R$ {brl(g.current)} / R$ {brl(g.target)} · <span className="font-bold text-green-400">{g.pct.toFixed(0)}%</span>
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded bg-muted/30">
              <div className="h-full bg-gradient-to-r from-green-500 to-emerald-400" style={{ width: `${Math.min(g.pct, 100)}%` }} />
            </div>
            {g.deadline && (
              <p className="mt-1 text-[10px] text-muted-foreground">
                Prazo: {new Date(g.deadline).toLocaleDateString('pt-BR')}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
