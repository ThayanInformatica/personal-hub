import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const month = url.searchParams.get('month');
  const category = url.searchParams.get('category');
  const where: any = {};
  if (category) where.category = category;
  if (month) {
    const start = new Date(month + '-01T00:00:00');
    const end = new Date(start);
    end.setMonth(end.getMonth() + 1);
    where.paidAt = { gte: start, lt: end };
  }
  return NextResponse.json(await db.expense.findMany({ where, orderBy: { paidAt: 'desc' }, take: 500 }));
}

export async function POST(req: Request) {
  const d = await req.json();
  if (!d.description || d.amount == null) return NextResponse.json({ error: 'description e amount obrigatorios' }, { status: 400 });
  const item = await db.expense.create({
    data: {
      description: d.description,
      category: d.category ?? 'Outros',
      amount: Number(d.amount),
      currency: d.currency ?? 'BRL',
      paidAt: d.paidAt ? new Date(d.paidAt) : new Date(),
      paymentMethod: d.paymentMethod ?? null,
      notes: d.notes ?? null
    }
  });
  return NextResponse.json(item, { status: 201 });
}
