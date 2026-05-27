import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCS2Inventory, getSavedSteamId } from '@/lib/steam';
import { fetchSteamMarketPrice } from '@/lib/steam-market';

export const maxDuration = 300;

export async function POST() {
  const id = await getSavedSteamId();
  if (!id) return NextResponse.json({ ok: false, error: 'Steam nao conectada' }, { status: 400 });

  const items = await getCS2Inventory(id);
  const names = Array.from(new Set(items.map((i) => i.marketName).filter(Boolean)));

  let updated = 0;
  let failed = 0;
  for (const name of names) {
    const p = await fetchSteamMarketPrice(name);
    if (p) {
      await db.skinPrice.upsert({
        where: { marketHashName: name },
        create: {
          marketHashName: name,
          currency: 'BRL',
          min: p.min,
          median: p.median,
          quantity: p.volume
        },
        update: {
          currency: 'BRL',
          min: p.min,
          median: p.median,
          quantity: p.volume
        }
      });
      updated++;
    } else {
      failed++;
    }
    await new Promise((r) => setTimeout(r, 1100));
  }

  return NextResponse.json({ ok: true, total: names.length, updated, failed });
}
