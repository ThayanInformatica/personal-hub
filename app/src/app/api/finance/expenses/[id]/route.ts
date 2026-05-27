import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await req.json();
  if (data.paidAt) data.paidAt = new Date(data.paidAt);
  return NextResponse.json(await db.expense.update({ where: { id }, data }));
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await db.expense.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
