import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { monthlyEquivalent } from '@/lib/finance';

export async function GET() {
  const now = new Date();
  const startMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const startSixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const [subs, expensesMonth, expensesLast6, goals, categories, dueSoon] = await Promise.all([
    db.subscription.findMany({ where: { active: true } }),
    db.expense.findMany({ where: { paidAt: { gte: startMonth, lt: startNextMonth } } }),
    db.expense.findMany({ where: { paidAt: { gte: startSixMonthsAgo, lt: startNextMonth } } }),
    db.savingGoal.findMany({ where: { active: true } }),
    db.financeCategory.findMany(),
    db.subscription.findMany({
      where: { active: true, alertEnabled: true, nextDueAt: { gte: now, lte: in7Days } },
      orderBy: { nextDueAt: 'asc' }
    })
  ]);

  const monthlyRecurring = subs.reduce((s, sub) => s + monthlyEquivalent(sub.amount, sub.billingCycle), 0);
  const yearlyRecurring = monthlyRecurring * 12;
  const monthExpenseTotal = expensesMonth.reduce((s, e) => s + e.amount, 0);
  const totalThisMonth = monthExpenseTotal + monthlyRecurring;

  const budgetMap = new Map(categories.filter((c) => c.monthlyBudget != null).map((c) => [c.name, c.monthlyBudget!]));

  const byCategory: Record<string, { spent: number; budget: number | null }> = {};
  for (const c of categories) byCategory[c.name] = { spent: 0, budget: c.monthlyBudget };
  for (const sub of subs) {
    if (!byCategory[sub.category]) byCategory[sub.category] = { spent: 0, budget: budgetMap.get(sub.category) ?? null };
    byCategory[sub.category].spent += monthlyEquivalent(sub.amount, sub.billingCycle);
  }
  for (const e of expensesMonth) {
    if (!byCategory[e.category]) byCategory[e.category] = { spent: 0, budget: budgetMap.get(e.category) ?? null };
    byCategory[e.category].spent += e.amount;
  }

  const monthlyHistory: { month: string; total: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const m = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const mNext = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    const key = `${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, '0')}`;
    const total = expensesLast6.filter((e) => e.paidAt >= m && e.paidAt < mNext).reduce((s, e) => s + e.amount, 0);
    monthlyHistory.push({ month: key, total: total + monthlyRecurring });
  }

  const goalsProgress = goals.map((g) => ({
    id: g.id,
    name: g.name,
    current: g.current,
    target: g.target,
    pct: g.target > 0 ? (g.current / g.target) * 100 : 0,
    deadline: g.deadline?.toISOString() ?? null
  }));
  const totalSaved = goals.reduce((s, g) => s + g.current, 0);

  const topSubs = [...subs]
    .map((s) => ({
      id: s.id,
      name: s.name,
      category: s.category,
      amount: s.amount,
      monthly: monthlyEquivalent(s.amount, s.billingCycle),
      billingCycle: s.billingCycle,
      nextDueAt: s.nextDueAt?.toISOString() ?? null
    }))
    .sort((a, b) => b.monthly - a.monthly)
    .slice(0, 5);

  return NextResponse.json({
    month: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
    monthlyRecurring,
    yearlyRecurring,
    monthExpenseTotal,
    totalThisMonth,
    activeSubsCount: subs.length,
    expenseCount: expensesMonth.length,
    totalSaved,
    byCategory,
    monthlyHistory,
    goals: goalsProgress,
    topSubs,
    dueSoon: dueSoon.map((s) => ({
      id: s.id,
      name: s.name,
      amount: s.amount,
      nextDueAt: s.nextDueAt!.toISOString(),
      category: s.category
    }))
  });
}
