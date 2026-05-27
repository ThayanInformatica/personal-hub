import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCS2Inventory, getSavedSteamId } from '@/lib/steam';

export async function GET() {
  const id = await getSavedSteamId();
  if (!id) return NextResponse.json({ error: 'not connected' }, { status: 404 });
  const items = await getCS2Inventory(id);

  const names = items.map((i) => i.marketName).filter(Boolean);
  const prices = names.length > 0
    ? await db.skinPrice.findMany({ where: { marketHashName: { in: names } } })
    : [];
  const priceMap = new Map(prices.map((p) => [p.marketHashName, p]));

  const enriched = items.map((i) => {
    const p = priceMap.get(i.marketName);
    return {
      ...i,
      price: p
        ? {
            currency: p.currency,
            suggested: p.suggested,
            min: p.min,
            median: p.median,
            max: p.max,
            quantity: p.quantity,
            marketPageUrl: p.marketPageUrl,
            updatedAt: p.updatedAt
          }
        : null
    };
  });

  const total = enriched.reduce((sum, it) => sum + (it.price?.median ?? it.price?.min ?? 0), 0);
  const lastUpdate = prices.length > 0
    ? prices.reduce((max, p) => p.updatedAt > max ? p.updatedAt : max, prices[0].updatedAt)
    : null;

  return NextResponse.json({ items: enriched, total, lastUpdate, priced: enriched.filter((i) => i.price).length });
}
