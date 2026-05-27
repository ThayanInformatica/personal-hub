import { db } from './db';
import { XMLParser } from 'fast-xml-parser';

const OPENID_URL = 'https://steamcommunity.com/openid/login';
const COMMUNITY = 'https://steamcommunity.com';
const CS2_APP_ID = 730;

export const STEAM_USER_KEY = 'steam.userId';

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '',
  parseAttributeValue: true,
  parseTagValue: true,
  trimValues: true
});

export function getBaseUrl(req?: Request): string {
  const envDomain = process.env.HUB_DOMAIN;
  if (envDomain && envDomain !== 'localhost') return `https://${envDomain}`;
  if (req) {
    const hdrs = (req as any).headers;
    const host = hdrs.get?.('host') ?? new URL(req.url).host;
    const proto = hdrs.get?.('x-forwarded-proto') ?? 'http';
    return `${proto}://${host}`;
  }
  return 'http://localhost:3000';
}

export function buildLoginUrl(baseUrl: string): string {
  const params = new URLSearchParams({
    'openid.ns': 'http://specs.openid.net/auth/2.0',
    'openid.mode': 'checkid_setup',
    'openid.return_to': `${baseUrl}/api/steam/return`,
    'openid.realm': baseUrl,
    'openid.identity': 'http://specs.openid.net/auth/2.0/identifier_select',
    'openid.claimed_id': 'http://specs.openid.net/auth/2.0/identifier_select'
  });
  return `${OPENID_URL}?${params.toString()}`;
}

export async function verifyReturn(searchParams: URLSearchParams): Promise<string | null> {
  const claimed = searchParams.get('openid.claimed_id');
  if (!claimed) return null;
  const match = claimed.match(/\/openid\/id\/(\d+)$/);
  if (!match) return null;
  const steamId = match[1];

  const body = new URLSearchParams();
  searchParams.forEach((v, k) => body.append(k, v));
  body.set('openid.mode', 'check_authentication');

  const res = await fetch(OPENID_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString()
  });
  const text = await res.text();
  if (!text.includes('is_valid:true')) return null;

  return steamId;
}

async function fetchXml(url: string): Promise<any> {
  const res = await fetch(url, {
    cache: 'no-store',
    headers: { 'User-Agent': 'PersonalHub/1.0' }
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} em ${url}`);
  const text = await res.text();
  if (text.includes('<response><error>')) {
    const m = text.match(/<error>([^<]+)<\/error>/);
    throw new Error(`Steam error: ${m?.[1] ?? 'desconhecido'}`);
  }
  return xmlParser.parse(text);
}

export async function getSavedSteamId(): Promise<string | null> {
  const s = await db.setting.findUnique({ where: { key: STEAM_USER_KEY } });
  return (s?.value as string | undefined) ?? null;
}

export async function saveSteamId(id: string) {
  await db.setting.upsert({
    where: { key: STEAM_USER_KEY },
    create: { key: STEAM_USER_KEY, value: id },
    update: { value: id }
  });
}

export async function clearSteamId() {
  await db.setting.delete({ where: { key: STEAM_USER_KEY } }).catch(() => {});
}

export type SteamProfile = {
  steamId: string;
  personaName: string;
  avatar: string;
  avatarMedium: string;
  avatarFull: string;
  profileUrl: string;
  personaStateLabel: string;
  currentGameName?: string;
  currentGameId?: string;
  location?: string;
  realName?: string;
  memberSince?: string;
  summary?: string;
};

export async function getProfile(steamId: string): Promise<SteamProfile | null> {
  try {
    const data = await fetchXml(`${COMMUNITY}/profiles/${steamId}?xml=1`);
    const p = data?.profile;
    if (!p) return null;
    const state = String(p.onlineState ?? 'offline');
    const stateLabel =
      state === 'online' ? 'Online'
      : state === 'in-game' ? 'Em jogo'
      : state === 'offline' ? 'Offline'
      : 'Desconhecido';
    return {
      steamId: String(p.steamID64),
      personaName: String(p.steamID ?? ''),
      avatar: String(p.avatarIcon ?? ''),
      avatarMedium: String(p.avatarMedium ?? ''),
      avatarFull: String(p.avatarFull ?? ''),
      profileUrl: `https://steamcommunity.com/profiles/${p.steamID64}`,
      personaStateLabel: stateLabel,
      currentGameName: p.inGameInfo?.gameName ? String(p.inGameInfo.gameName) : undefined,
      currentGameId: p.inGameInfo?.gameAppID ? String(p.inGameInfo.gameAppID) : undefined,
      location: p.location ? String(p.location) : undefined,
      realName: p.realname ? String(p.realname) : undefined,
      memberSince: p.memberSince ? String(p.memberSince) : undefined,
      summary: p.summary ? String(p.summary) : undefined
    };
  } catch (e) {
    console.error('[steam] getProfile failed:', (e as Error).message);
    return null;
  }
}

export type CS2Stats = {
  total_kills: number;
  total_deaths: number;
  total_mvps: number;
  total_wins: number;
  total_matches_played: number;
  total_matches_won: number;
  total_rounds_played: number;
  total_kills_headshot: number;
  total_shots_fired: number;
  total_shots_hit: number;
  total_time_played: number;
  total_planted_bombs: number;
  total_defused_bombs: number;
  total_kills_knife: number;
  total_kills_ak47: number;
  total_kills_m4a1: number;
  total_kills_awp: number;
  total_kills_deagle: number;
  kd: number;
  hsPercent: number;
  accuracy: number;
  winRate: number;
  byWeapon: Record<string, number>;
  byMap: Record<string, { rounds: number; wins: number }>;
};

export async function getCS2Stats(steamId: string): Promise<CS2Stats | null> {
  try {
    const data = await fetchXml(`${COMMUNITY}/profiles/${steamId}/stats/${CS2_APP_ID}/?xml=1`);
    const statsList = data?.playerstats?.stats?.stat;
    if (!Array.isArray(statsList) && !statsList) return null;
    const arr = Array.isArray(statsList) ? statsList : [statsList];
    const m = new Map<string, number>();
    for (const s of arr) {
      if (s?.name) m.set(String(s.name), Number(s.value) || 0);
    }
    if (m.size === 0) return null;

    const v = (k: string) => m.get(k) ?? 0;

    const byWeapon: Record<string, number> = {};
    const byMap: Record<string, { rounds: number; wins: number }> = {};
    for (const [k, val] of m.entries()) {
      const wm = k.match(/^total_kills_(.+)$/);
      if (wm) byWeapon[wm[1]] = val;
      if (k.startsWith('total_wins_map_')) {
        const map = k.replace('total_wins_map_', '');
        if (!byMap[map]) byMap[map] = { rounds: 0, wins: 0 };
        byMap[map].wins = val;
      }
      if (k.startsWith('total_rounds_map_')) {
        const map = k.replace('total_rounds_map_', '');
        if (!byMap[map]) byMap[map] = { rounds: 0, wins: 0 };
        byMap[map].rounds = val;
      }
    }

    const kills = v('total_kills');
    const deaths = v('total_deaths');
    const hs = v('total_kills_headshot');
    const shotsFired = v('total_shots_fired');
    const shotsHit = v('total_shots_hit');
    const matches = v('total_matches_played');
    const matchesWon = v('total_matches_won');

    return {
      total_kills: kills,
      total_deaths: deaths,
      total_mvps: v('total_mvps'),
      total_wins: v('total_wins'),
      total_matches_played: matches,
      total_matches_won: matchesWon,
      total_rounds_played: v('total_rounds_played'),
      total_kills_headshot: hs,
      total_shots_fired: shotsFired,
      total_shots_hit: shotsHit,
      total_time_played: v('total_time_played'),
      total_planted_bombs: v('total_planted_bombs'),
      total_defused_bombs: v('total_defused_bombs'),
      total_kills_knife: v('total_kills_knife'),
      total_kills_ak47: v('total_kills_ak47'),
      total_kills_m4a1: v('total_kills_m4a1'),
      total_kills_awp: v('total_kills_awp'),
      total_kills_deagle: v('total_kills_deagle'),
      kd: deaths > 0 ? kills / deaths : kills,
      hsPercent: kills > 0 ? (hs / kills) * 100 : 0,
      accuracy: shotsFired > 0 ? (shotsHit / shotsFired) * 100 : 0,
      winRate: matches > 0 ? (matchesWon / matches) * 100 : 0,
      byWeapon,
      byMap
    };
  } catch (e) {
    console.error('[steam] getCS2Stats failed:', (e as Error).message);
    return null;
  }
}

export type RecentGame = {
  appId: number;
  name: string;
  hoursOnRecord: number;
  hoursLast2Weeks?: number;
  logoUrl?: string;
};

export async function getRecentlyPlayed(steamId: string): Promise<RecentGame[]> {
  try {
    const data = await fetchXml(`${COMMUNITY}/profiles/${steamId}/games/?tab=recent&xml=1`);
    const games = data?.gamesList?.games?.game;
    const arr = Array.isArray(games) ? games : games ? [games] : [];
    return arr.map((g: any) => ({
      appId: Number(g.appID),
      name: String(g.name),
      hoursOnRecord: Number(g.hoursOnRecord ?? 0),
      hoursLast2Weeks: g.hoursLast2Weeks ? Number(g.hoursLast2Weeks) : undefined,
      logoUrl: g.logo ? String(g.logo) : undefined
    }));
  } catch (e) {
    console.error('[steam] getRecentlyPlayed failed:', (e as Error).message);
    return [];
  }
}

export type CS2Item = {
  classId: string;
  name: string;
  marketName: string;
  rarity?: string;
  type?: string;
  iconUrl?: string;
  tradable: boolean;
  marketable: boolean;
};

export async function getCS2Inventory(steamId: string): Promise<CS2Item[]> {
  try {
    const res = await fetch(`${COMMUNITY}/inventory/${steamId}/${CS2_APP_ID}/2?l=english&count=500`, {
      cache: 'no-store',
      headers: { 'User-Agent': 'PersonalHub/1.0' }
    });
    if (!res.ok) return [];
    const data = await res.json();
    if (!data?.descriptions) return [];

    const items: CS2Item[] = data.descriptions
      .filter((d: any) => d.marketable || d.tradable)
      .map((d: any) => ({
        classId: String(d.classid),
        name: String(d.market_name ?? d.name ?? d.market_hash_name ?? ''),
        marketName: String(d.market_hash_name ?? ''),
        rarity: d.tags?.find((t: any) => t.category === 'Rarity')?.localized_tag_name,
        type: d.tags?.find((t: any) => t.category === 'Type')?.localized_tag_name,
        iconUrl: d.icon_url ? `https://community.cloudflare.steamstatic.com/economy/image/${d.icon_url}` : undefined,
        tradable: !!d.tradable,
        marketable: !!d.marketable
      }));

    const map = new Map<string, CS2Item>();
    for (const i of items) if (!map.has(i.classId)) map.set(i.classId, i);
    return Array.from(map.values());
  } catch (e) {
    console.error('[steam] inventory failed:', (e as Error).message);
    return [];
  }
}
