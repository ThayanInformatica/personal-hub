import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { captureAndStoreSnapshot } from '@/lib/price-sources';

export const maxDuration = 60;

export async function GET(req: Request) {
  const url = new URL(req.url);
  const name = url.searchParams.get('name');
  if (!name) return NextResponse.json({ error: 'name required' }, { status: 400 });

  const sources = await db.externalPrice.findMany({ where: { marketHashName: name } });
  const stale = sources.length === 0 || sources.every((s) => Date.now() - s.updatedAt.getTime() > 60 * 60 * 1000);

  if (stale) {
    await captureAndStoreSnapshot(name);
  }

  const fresh = await db.externalPrice.findMany({ where: { marketHashName: name } });
  return NextResponse.json({ marketHashName: name, sources: fresh });
}

export async function POST(req: Request) {
  const { marketHashName } = await req.json();
  if (!marketHashName) return NextResponse.json({ error: 'marketHashName required' }, { status: 400 });
  const sources = await captureAndStoreSnapshot(marketHashName);
  return NextResponse.json({ ok: true, sources });
}
