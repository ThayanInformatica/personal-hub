import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = url.searchParams.get('q')?.toLowerCase();
  const limit = Number(url.searchParams.get('limit') ?? 100);

  const where = q
    ? { marketHashName: { contains: q, mode: 'insensitive' as const } }
    : undefined;

  const items = await db.skinPrice.findMany({
    where,
    orderBy: { median: 'desc' },
    take: limit
  });

  const meta = await db.skinPrice.aggregate({ _max: { updatedAt: true }, _count: true });

  return NextResponse.json({
    items,
    total: meta._count,
    lastUpdate: meta._max.updatedAt
  });
}
