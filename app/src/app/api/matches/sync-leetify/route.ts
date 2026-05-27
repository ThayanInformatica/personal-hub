import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSavedSteamId } from '@/lib/steam';
import { fetchLeetifyProfile } from '@/lib/leetify';

export const maxDuration = 60;

export async function POST() {
  const steamId = await getSavedSteamId();
  if (!steamId) return NextResponse.json({ error: 'Steam nao conectada' }, { status: 400 });

  const profile = await fetchLeetifyProfile(steamId);
  if (!profile) {
    return NextResponse.json({
      ok: false,
      error: 'Nao consegui dados do Leetify. Verifica se voce ja jogou ao menos uma partida apos criar a conta + ligar o client Leetify.'
    });
  }

  let created = 0;
  let updated = 0;
  for (const m of profile.recentMatches) {
    const existing = await db.match.findUnique({ where: { externalId: m.id } });
    const data = {
      source: 'leetify',
      externalId: m.id,
      playedAt: new Date(m.playedAt),
      map: m.map,
      mode: m.mode,
      side: m.side,
      scoreYou: m.scoreYou,
      scoreEnemy: m.scoreEnemy,
      result: m.result,
      rankBefore: m.rankBefore,
      rankAfter: m.rankAfter,
      rankDelta: m.rankBefore != null && m.rankAfter != null ? m.rankAfter - m.rankBefore : null,
      kills: m.kills,
      deaths: m.deaths,
      assists: m.assists,
      adr: m.adr,
      hsPercent: m.hsPercent,
      kast: m.kast,
      rating: m.rating,
      mvps: m.mvps
    };
    if (existing) {
      await db.match.update({ where: { id: existing.id }, data });
      updated++;
    } else {
      await db.match.create({ data });
      created++;
    }
  }

  return NextResponse.json({
    ok: true,
    profile: { name: profile.name, totalMatches: profile.totalMatches },
    created,
    updated,
    total: profile.recentMatches.length
  });
}
