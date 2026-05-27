import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

const FIELDS = ['style', 'size', 'thickness', 'gap', 'red', 'green', 'blue', 'alpha', 'dot', 'tStyle', 'outline'] as const;

export async function GET() {
  const items = await db.crosshair.findMany({ orderBy: [{ favorite: 'desc' }, { updatedAt: 'desc' }] });
  return NextResponse.json(items);
}

export async function POST(req: Request) {
  const data = await req.json();
  const visual: Record<string, any> = {};
  for (const k of FIELDS) if (data[k] !== undefined) visual[k] = data[k];
  const item = await db.crosshair.create({
    data: {
      name: data.name,
      code: data.code,
      notes: data.notes ?? null,
      favorite: data.favorite ?? false,
      tags: data.tags ?? [],
      ...visual
    }
  });
  return NextResponse.json(item, { status: 201 });
}
