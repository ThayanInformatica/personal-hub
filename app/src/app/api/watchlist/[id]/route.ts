import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await db.watchlist.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
