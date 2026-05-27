function lastDayOfMonth(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
}

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
