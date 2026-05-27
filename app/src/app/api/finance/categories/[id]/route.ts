import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await req.json();
  if (data.monthlyBudget != null) data.monthlyBudget = Number(data.monthlyBudget);
  return NextResponse.json(await db.financeCategory.update({ where: { id }, data }));
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const c = await db.financeCategory.findUnique({ where: { id } });
  if (c?.builtin) return NextResponse.json({ error: 'Nao pode remover categoria preset' }, { status: 400 });
  await db.financeCategory.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
