import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const name = url.searchParams.get('name');
  if (!name) return NextResponse.json({ error: 'name required' }, { status: 400 });
  const days = Number(url.searchParams.get('days') ?? 90);
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const snapshots = await db.skinSnapshot.findMany({
    where: { marketHashName: name, capturedAt: { gte: since } },
    orderBy: { capturedAt: 'asc' }
  });

  const bySource: Record<string, { date: string; min: number | null; median: number | null }[]> = {};
  for (const s of snapshots) {
    if (!bySource[s.source]) bySource[s.source] = [];
    bySource[s.source].push({
      date: s.capturedAt.toISOString(),
      min: s.min,
      median: s.median
    });
  }

  return NextResponse.json({ marketHashName: name, days, bySource });
}
