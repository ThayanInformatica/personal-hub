export type CategoryPreset = {
  name: string;
  icon: string;
  color: string;
};

export const PRESET_CATEGORIES: CategoryPreset[] = [
  { name: 'Moradia', icon: 'Home', color: '#f59e0b' },
  { name: 'Utilidades', icon: 'Zap', color: '#facc15' },
  { name: 'Streaming', icon: 'Tv', color: '#ef4444' },
  { name: 'Alimentação', icon: 'UtensilsCrossed', color: '#f97316' },
  { name: 'Transporte', icon: 'Car', color: '#3b82f6' },
  { name: 'Saúde', icon: 'HeartPulse', color: '#10b981' },
  { name: 'Entretenimento', icon: 'Gamepad2', color: '#a855f7' },
  { name: 'Educação', icon: 'BookOpen', color: '#06b6d4' },
  { name: 'Financeiro', icon: 'CreditCard', color: '#ec4899' },
  { name: 'Compras', icon: 'ShoppingBag', color: '#8b5cf6' },
  { name: 'Trabalho', icon: 'Briefcase', color: '#64748b' },
  { name: 'Pets', icon: 'Dog', color: '#f43f5e' },
  { name: 'Família', icon: 'Users', color: '#22c55e' },
  { name: 'Presentes', icon: 'Gift', color: '#d946ef' },
  { name: 'Viagem', icon: 'Plane', color: '#0ea5e9' },
  { name: 'Outros', icon: 'Package', color: '#71717a' }
];

export const PAYMENT_METHODS = [
  'Cartão de crédito',
  'Cartão de débito',
  'PIX',
  'Boleto',
  'Débito automático',
  'Dinheiro',
  'Transferência',
  'Outro'
];

export const BILLING_CYCLES = [
  { id: 'monthly', label: 'Mensal', days: 30 },
  { id: 'yearly', label: 'Anual', days: 365 },
  { id: 'weekly', label: 'Semanal', days: 7 },
  { id: 'quarterly', label: 'Trimestral', days: 90 },
  { id: 'biannual', label: 'Semestral', days: 182 }
];

export function computeNextDueAt(current: Date, cycle: string, dueDay?: number | null): Date {
  const d = new Date(current);
  switch (cycle) {
    case 'weekly': d.setDate(d.getDate() + 7); break;
    case 'monthly':
      d.setMonth(d.getMonth() + 1);
      if (dueDay) d.setDate(Math.min(dueDay, lastDayOfMonth(d)));
      break;
    case 'quarterly': d.setMonth(d.getMonth() + 3); break;
    case 'biannual': d.setMonth(d.getMonth() + 6); break;
    case 'yearly':
    default: d.setFullYear(d.getFullYear() + 1);
  }
  return d;
}

export function nextDueFromDay(dueDay: number, from: Date = new Date()): Date {
  const now = new Date(from);
  const next = new Date(now.getFullYear(), now.getMonth(), Math.min(dueDay, lastDayOfMonth(now)), 9, 0, 0);
  if (next < now) {
    next.setMonth(next.getMonth() + 1);
    next.setDate(Math.min(dueDay, lastDayOfMonth(next)));
  }
  return next;
}

function lastDayOfMonth(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
}

export function brl(n: number | null | undefined): string {
  if (n == null) return '—';
  return n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function monthlyEquivalent(amount: number, cycle: string): number {
  const map: Record<string, number> = {
    weekly: amount * 52 / 12,
    monthly: amount,
    quarterly: amount / 3,
    biannual: amount / 6,
    yearly: amount / 12
  };
  return map[cycle] ?? amount;
}
