const BASE = 'https://api.leetify.com';

export type LeetifyMatch = {
  id: string;
  playedAt: string;
  map: string;
  mode: string;
  scoreYou: number;
  scoreEnemy: number;
  side: string | null;
  result: 'win' | 'loss' | 'tie';
  kills: number;
  deaths: number;
  assists: number;
  adr: number | null;
  hsPercent: number | null;
  kast: number | null;
  rating: number | null;
  mvps: number;
  rankBefore: number | null;
  rankAfter: number | null;
};

export type LeetifyProfile = {
  steamId: string;
  name: string;
  totalMatches: number;
  winRate: number;
  avgKD: number;
  recentMatches: LeetifyMatch[];
};

function pickSide(stats: any, steamId: string): string | null {
  const player = stats?.players?.find((p: any) => p.steam64_id === steamId || p.steam_id === steamId);
  if (!player) return null;
  const ct = Number(player.ct_rounds ?? 0);
  const t = Number(player.t_rounds ?? 0);
  if (ct > 0 && t === 0) return 'CT';
  if (t > 0 && ct === 0) return 'T';
  return 'both';
}

function pickStat(player: any, fields: string[]): number | null {
  for (const f of fields) {
    const v = player?.[f];
    if (v != null && !Number.isNaN(Number(v))) return Number(v);
  }
  return null;
}

export async function fetchLeetifyProfile(steamId: string): Promise<LeetifyProfile | null> {
  try {
    const url = `${BASE}/api/profile/${steamId}`;
    const res = await fetch(url, {
      cache: 'no-store',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; PersonalHub/1.0)',
        'Accept': 'application/json'
      }
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data || (typeof data === 'object' && Object.keys(data).length === 0)) return null;

    const games: any[] = Array.isArray(data?.games) ? data.games : Array.isArray(data?.recent_games) ? data.recent_games : [];

    const recentMatches: LeetifyMatch[] = games
      .filter((g: any) => g?.id || g?.match_id)
      .slice(0, 50)
      .map((g: any) => {
        const id = String(g.id ?? g.match_id);
        const player = g.players?.find((p: any) => p.steam64_id === steamId || p.steam_id === steamId) ?? g.user_stats ?? g;
        const scoreYou = Number(g.score_you ?? g.t_score ?? g.team_score ?? 0);
        const scoreEnemy = Number(g.score_enemy ?? g.ct_score ?? g.enemy_score ?? 0);

        const result: 'win' | 'loss' | 'tie' =
          g.result === 'win' || (typeof g.team_score === 'number' && typeof g.enemy_score === 'number' && g.team_score > g.enemy_score)
            ? 'win'
            : g.result === 'loss' || (typeof g.team_score === 'number' && typeof g.enemy_score === 'number' && g.team_score < g.enemy_score)
            ? 'loss'
            : 'tie';

        return {
          id,
          playedAt: g.played_at ?? g.created_at ?? new Date().toISOString(),
          map: String(g.map_name ?? g.map ?? 'unknown').replace(/^de_/, ''),
          mode: String(g.game_mode ?? g.mode ?? 'premier'),
          scoreYou,
          scoreEnemy,
          side: pickSide(g, steamId),
          result,
          kills: Number(player?.total_kills ?? player?.kills ?? 0),
          deaths: Number(player?.total_deaths ?? player?.deaths ?? 0),
          assists: Number(player?.total_assists ?? player?.assists ?? 0),
          adr: pickStat(player, ['dpr', 'adr', 'avg_damage']),
          hsPercent: pickStat(player, ['hs_percentage', 'headshot_percentage', 'hs_pct']),
          kast: pickStat(player, ['kast', 'kast_percentage']),
          rating: pickStat(player, ['leetify_rating', 'rating', 'hltv_rating']),
          mvps: Number(player?.mvps ?? 0),
          rankBefore: g.skill_level_before ?? g.rank_before ?? null,
          rankAfter: g.skill_level_after ?? g.rank_after ?? null
        };
      });

    return {
      steamId,
      name: String(data?.name ?? data?.username ?? 'Unknown'),
      totalMatches: Number(data?.total_matches ?? recentMatches.length),
      winRate: Number(data?.win_rate ?? data?.winrate ?? 0),
      avgKD: Number(data?.avg_kd ?? 0),
      recentMatches
    };
  } catch (e) {
    console.error('[leetify] fetch failed:', (e as Error).message);
    return null;
  }
}
