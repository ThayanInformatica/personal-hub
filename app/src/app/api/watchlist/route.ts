import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  const items = await db.watchlist.findMany({ orderBy: { createdAt: 'desc' } });
  const names = items.map((w) => w.marketHashName);
  const [prices, alerts, latestSnapshots] = await Promise.all([
    db.skinPrice.findMany({ where: { marketHashName: { in: names } } }),
    db.priceAlert.findMany({ where: { marketHashName: { in: names }, active: true } }),
    db.skinSnapshot.findMany({
      where: { marketHashName: { in: names }, source: 'steam' },
      orderBy: { capturedAt: 'desc' },
      take: 200
    })
  ]);

  const priceMap = new Map(prices.map((p) => [p.marketHashName, p]));
  const alertMap = new Map<string, typeof alerts>();
  for (const a of alerts) {
    const arr = alertMap.get(a.marketHashName) ?? [];
    arr.push(a);
    alertMap.set(a.marketHashName, arr);
  }
  const sparkMap = new Map<string, number[]>();
  for (const s of latestSnapshots) {
    const arr = sparkMap.get(s.marketHashName) ?? [];
    if (arr.length < 30) arr.push(s.median ?? s.min ?? 0);
    sparkMap.set(s.marketHashName, arr);
  }

  return NextResponse.json(
    items.map((w) => ({
      ...w,
      currentPrice: priceMap.get(w.marketHashName) ?? null,
      alerts: alertMap.get(w.marketHashName) ?? [],
      sparkline: (sparkMap.get(w.marketHashName) ?? []).reverse()
    }))
  );
}

export async function POST(req: Request) {
  const data = await req.json();
  if (!data.marketHashName) return NextResponse.json({ error: 'marketHashName required' }, { status: 400 });
  try {
    const item = await db.watchlist.create({
      data: {
        marketHashName: data.marketHashName,
        displayName: data.displayName ?? null,
        iconUrl: data.iconUrl ?? null,
        notes: data.notes ?? null
      }
    });
    return NextResponse.json(item, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: 'ja esta na watchlist' }, { status: 409 });
  }
}
