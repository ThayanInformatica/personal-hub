'use client';

import { useEffect, useState } from 'react';
import { DashboardTab } from './dashboard-tab';
import { SubscriptionsTab } from './subscriptions-tab';
import { ExpensesTab } from './expenses-tab';
import { CategoriesTab } from './categories-tab';
import { GoalsTab } from './goals-tab';
import { AlertsTab } from './alerts-tab';

type Tab = 'dashboard' | 'subscriptions' | 'expenses' | 'categories' | 'goals' | 'alerts';

const TABS: { id: Tab; label: string }[] = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'subscriptions', label: 'Assinaturas' },
  { id: 'expenses', label: 'Gastos' },
  { id: 'categories', label: 'Categorias' },
  { id: 'goals', label: 'Economias' },
  { id: 'alerts', label: 'Alertas' }
];

export function FinanceClient() {
  const [tab, setTab] = useState<Tab>('dashboard');
  useEffect(() => {
    const h = window.location.hash.replace('#', '') as Tab;
    if (TABS.some((t) => t.id === h)) setTab(h);
  }, []);
  useEffect(() => { window.location.hash = tab; }, [tab]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-1 border-b border-border/60">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
              tab === t.id ? 'border-foreground text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'dashboard' && <DashboardTab />}
      {tab === 'subscriptions' && <SubscriptionsTab />}
      {tab === 'expenses' && <ExpensesTab />}
      {tab === 'categories' && <CategoriesTab />}
      {tab === 'goals' && <GoalsTab />}
      {tab === 'alerts' && <AlertsTab />}
    </div>
  );
}
