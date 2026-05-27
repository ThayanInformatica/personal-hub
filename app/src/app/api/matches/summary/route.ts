import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  const all = await db.match.findMany({ orderBy: { playedAt: 'asc' } });

  const total = all.length;
  if (total === 0) {
    return NextResponse.json({
      total: 0,
      wins: 0,
      losses: 0,
      ties: 0,
      winRate: 0,
      avgKD: 0,
      streak: { kind: null, count: 0 },
      byMap: [],
      bySide: { CT: { matches: 0, wr: 0 }, T: { matches: 0, wr: 0 } },
      rankPoints: [],
      monthlyKD: []
    });
  }

  const wins = all.filter((m) => m.result === 'win').length;
  const losses = all.filter((m) => m.result === 'loss').length;
  const ties = all.filter((m) => m.result === 'tie').length;
  const winRate = (wins / total) * 100;

  const totalKills = all.reduce((s, m) => s + m.kills, 0);
  const totalDeaths = all.reduce((s, m) => s + m.deaths, 0);
  const avgKD = totalDeaths > 0 ? totalKills / totalDeaths : totalKills;

  let streakKind: 'win' | 'loss' | null = null;
  let streakCount = 0;
  for (let i = all.length - 1; i >= 0; i--) {
    const r = all[i].result;
    if (r === 'tie') continue;
    if (streakKind === null) {
      streakKind = r as 'win' | 'loss';
      streakCount = 1;
    } else if (r === streakKind) {
      streakCount++;
    } else {
      break;
    }
  }

  const mapAgg: Record<string, { matches: number; wins: number; kd: number; kdCount: number }> = {};
  for (const m of all) {
    if (!mapAgg[m.map]) mapAgg[m.map] = { matches: 0, wins: 0, kd: 0, kdCount: 0 };
    mapAgg[m.map].matches++;
    if (m.result === 'win') mapAgg[m.map].wins++;
    if (m.deaths > 0) {
      mapAgg[m.map].kd += m.kills / m.deaths;
      mapAgg[m.map].kdCount++;
    }
  }
  const byMap = Object.entries(mapAgg).map(([map, v]) => ({
    map,
    matches: v.matches,
    wins: v.wins,
    winRate: v.matches > 0 ? (v.wins / v.matches) * 100 : 0,
    avgKD: v.kdCount > 0 ? v.kd / v.kdCount : 0
  })).sort((a, b) => b.matches - a.matches);

  const sideAgg: Record<string, { matches: number; wins: number }> = { CT: { matches: 0, wins: 0 }, T: { matches: 0, wins: 0 } };
  for (const m of all) {
    if (m.side === 'CT' || m.side === 'T') {
      sideAgg[m.side].matches++;
      if (m.result === 'win') sideAgg[m.side].wins++;
    }
  }
  const bySide = {
    CT: { matches: sideAgg.CT.matches, wr: sideAgg.CT.matches > 0 ? (sideAgg.CT.wins / sideAgg.CT.matches) * 100 : 0 },
    T: { matches: sideAgg.T.matches, wr: sideAgg.T.matches > 0 ? (sideAgg.T.wins / sideAgg.T.matches) * 100 : 0 }
  };

  const rankPoints = all
    .filter((m) => m.rankAfter != null)
    .map((m) => ({ playedAt: m.playedAt.toISOString(), rank: m.rankAfter as number }));

  const monthAgg: Record<string, { kills: number; deaths: number; matches: number }> = {};
  for (const m of all) {
    const key = m.playedAt.toISOString().slice(0, 7);
    if (!monthAgg[key]) monthAgg[key] = { kills: 0, deaths: 0, matches: 0 };
    monthAgg[key].kills += m.kills;
    monthAgg[key].deaths += m.deaths;
    monthAgg[key].matches++;
  }
  const monthlyKD = Object.entries(monthAgg).map(([month, v]) => ({
    month,
    matches: v.matches,
    kd: v.deaths > 0 ? v.kills / v.deaths : v.kills
  })).sort((a, b) => a.month.localeCompare(b.month));

  return NextResponse.json({
    total,
    wins,
    losses,
    ties,
    winRate,
    avgKD,
    streak: { kind: streakKind, count: streakCount },
    byMap,
    bySide,
    rankPoints,
    monthlyKD
  });
}
