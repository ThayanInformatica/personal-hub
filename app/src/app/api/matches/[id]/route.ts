import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const match = await db.match.findUnique({ where: { id } });
  if (!match) return NextResponse.json({ error: 'not found' }, { status: 404 });
  return NextResponse.json(match);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await req.json();
  if (data.playedAt) data.playedAt = new Date(data.playedAt);
  const item = await db.match.update({ where: { id }, data });
  return NextResponse.json(item);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await db.match.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
