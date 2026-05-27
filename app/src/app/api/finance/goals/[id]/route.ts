import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await req.json();
  if (data.deadline) data.deadline = new Date(data.deadline);
  if (data.target != null) data.target = Number(data.target);
  if (data.current != null) data.current = Number(data.current);
  return NextResponse.json(await db.savingGoal.update({ where: { id }, data }));
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await db.savingGoal.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
