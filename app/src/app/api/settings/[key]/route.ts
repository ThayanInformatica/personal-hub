import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(_req: Request, { params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  const s = await db.setting.findUnique({ where: { key } });
  return NextResponse.json(s?.value ?? null);
}

export async function PUT(req: Request, { params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  const value = await req.json();
  const s = await db.setting.upsert({
    where: { key },
    create: { key, value },
    update: { value }
  });
  return NextResponse.json(s.value);
}
