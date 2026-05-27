const BASE = 'https://steamcommunity.com/market/priceoverview/';
const CS2_APP_ID = 730;
const BRL_CURRENCY = 23;

export type SteamPriceOverview = {
  success: boolean;
  lowest_price?: string;
  volume?: string;
  median_price?: string;
};

export type SteamPrice = {
  marketHashName: string;
  min: number | null;
  median: number | null;
  volume: number;
};

function parsePriceBRL(raw?: string): number | null {
  if (!raw) return null;
  const cleaned = raw.replace(/[^\d,.]/g, '').replace(',', '.');
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

export async function fetchSteamMarketPrice(marketHashName: string): Promise<SteamPrice | null> {
  const url = `${BASE}?country=BR&currency=${BRL_CURRENCY}&appid=${CS2_APP_ID}&market_hash_name=${encodeURIComponent(marketHashName)}`;
  try {
    const res = await fetch(url, {
      cache: 'no-store',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json'
      }
    });
    if (!res.ok) return null;
    const data: SteamPriceOverview = await res.json();
    if (!data.success) return null;
    return {
      marketHashName,
      min: parsePriceBRL(data.lowest_price),
      median: parsePriceBRL(data.median_price),
      volume: data.volume ? Number(data.volume.replace(/,/g, '')) || 0 : 0
    };
  } catch {
    return null;
  }
}

export async function fetchSteamMarketPrices(
  names: string[],
  delayMs = 1100
): Promise<Map<string, SteamPrice>> {
  const out = new Map<string, SteamPrice>();
  for (const name of names) {
    const p = await fetchSteamMarketPrice(name);
    if (p) out.set(name, p);
    if (delayMs > 0) await new Promise((r) => setTimeout(r, delayMs));
  }
  return out;
}
