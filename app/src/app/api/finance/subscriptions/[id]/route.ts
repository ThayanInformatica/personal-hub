import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await req.json();
  if (data.nextDueAt) data.nextDueAt = new Date(data.nextDueAt);
  if (data.startedAt) data.startedAt = new Date(data.startedAt);
  return NextResponse.json(await db.subscription.update({ where: { id }, data }));
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await db.subscription.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
