import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { nextDueFromDay } from '@/lib/finance';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const active = url.searchParams.get('active');
  const where: any = {};
  if (active === 'true') where.active = true;
  if (active === 'false') where.active = false;
  return NextResponse.json(await db.subscription.findMany({ where, orderBy: [{ active: 'desc' }, { nextDueAt: 'asc' }] }));
}

export async function POST(req: Request) {
  const d = await req.json();
  if (!d.name || d.amount == null) return NextResponse.json({ error: 'name e amount obrigatorios' }, { status: 400 });

  let nextDueAt: Date | null = d.nextDueAt ? new Date(d.nextDueAt) : null;
  if (!nextDueAt && d.dueDay && d.billingCycle !== 'yearly') {
    nextDueAt = nextDueFromDay(Number(d.dueDay));
  }

  const item = await db.subscription.create({
    data: {
      name: d.name,
      category: d.category ?? 'Outros',
      amount: Number(d.amount),
      currency: d.currency ?? 'BRL',
      billingCycle: d.billingCycle ?? 'monthly',
      dueDay: d.dueDay != null ? Number(d.dueDay) : null,
      nextDueAt,
      paymentMethod: d.paymentMethod ?? null,
      active: d.active ?? true,
      alertEnabled: d.alertEnabled ?? true,
      alertDaysBefore: Number(d.alertDaysBefore ?? 3),
      reminderText: d.reminderText ?? null,
      notes: d.notes ?? null,
      startedAt: d.startedAt ? new Date(d.startedAt) : null
    }
  });
  return NextResponse.json(item, { status: 201 });
}
