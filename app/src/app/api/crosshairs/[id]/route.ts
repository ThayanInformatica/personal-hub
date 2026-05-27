import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

const ALLOWED = new Set([
  'name', 'code', 'notes', 'favorite', 'tags',
  'style', 'size', 'thickness', 'gap', 'red', 'green', 'blue', 'alpha', 'dot', 'tStyle', 'outline'
]);

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await req.json();
  const clean: Record<string, any> = {};
  for (const k of Object.keys(data)) if (ALLOWED.has(k)) clean[k] = data[k];
  const item = await db.crosshair.update({ where: { id }, data: clean });
  return NextResponse.json(item);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await db.crosshair.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
