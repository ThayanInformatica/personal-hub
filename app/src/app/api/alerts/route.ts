import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  return NextResponse.json(await db.priceAlert.findMany({ orderBy: { createdAt: 'desc' } }));
}

export async function POST(req: Request) {
  const data = await req.json();
  if (!data.marketHashName || !data.kind || data.threshold == null) {
    return NextResponse.json({ error: 'marketHashName, kind, threshold required' }, { status: 400 });
  }
  if (!['below', 'above', 'drop_pct', 'rise_pct'].includes(data.kind)) {
    return NextResponse.json({ error: 'kind invalido' }, { status: 400 });
  }
  const item = await db.priceAlert.create({
    data: {
      marketHashName: data.marketHashName,
      kind: data.kind,
      threshold: Number(data.threshold),
      windowDays: data.windowDays ?? null,
      notes: data.notes ?? null,
      active: true
    }
  });
  return NextResponse.json(item, { status: 201 });
}
