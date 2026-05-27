import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const limit = Number(url.searchParams.get('limit') ?? 100);
  const map = url.searchParams.get('map');
  const result = url.searchParams.get('result');

  const where: any = {};
  if (map) where.map = map;
  if (result) where.result = result;

  const items = await db.match.findMany({
    where,
    orderBy: { playedAt: 'desc' },
    take: limit
  });

  return NextResponse.json(items);
}

export async function POST(req: Request) {
  const data = await req.json();
  if (!data.map || !data.playedAt) {
    return NextResponse.json({ error: 'map e playedAt obrigatorios' }, { status: 400 });
  }

  const scoreYou = Number(data.scoreYou ?? 0);
  const scoreEnemy = Number(data.scoreEnemy ?? 0);
  const result =
    data.result ??
    (scoreYou > scoreEnemy ? 'win' : scoreYou < scoreEnemy ? 'loss' : 'tie');

  const item = await db.match.create({
    data: {
      source: data.source ?? 'manual',
      externalId: data.externalId ?? null,
      playedAt: new Date(data.playedAt),
      map: data.map,
      mode: data.mode ?? 'premier',
      side: data.side ?? null,
      scoreYou,
      scoreEnemy,
      result,
      rankBefore: data.rankBefore ?? null,
      rankAfter: data.rankAfter ?? null,
      rankDelta: data.rankDelta ?? (data.rankAfter != null && data.rankBefore != null ? data.rankAfter - data.rankBefore : null),
      kills: Number(data.kills ?? 0),
      deaths: Number(data.deaths ?? 0),
      assists: Number(data.assists ?? 0),
      adr: data.adr != null ? Number(data.adr) : null,
      hsPercent: data.hsPercent != null ? Number(data.hsPercent) : null,
      kast: data.kast != null ? Number(data.kast) : null,
      rating: data.rating != null ? Number(data.rating) : null,
      mvps: Number(data.mvps ?? 0),
      notes: data.notes ?? null
    }
  });

  return NextResponse.json(item, { status: 201 });
}
