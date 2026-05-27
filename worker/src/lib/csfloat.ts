const BASE = 'https://csfloat.com/api/v1/listings';

export type CSFloatPrice = {
  marketHashName: string;
  minUSD: number | null;
  medianUSD: number | null;
};

export async function fetchCSFloatPrice(marketHashName: string): Promise<CSFloatPrice | null> {
  const url = `${BASE}?market_hash_name=${encodeURIComponent(marketHashName)}&sort_by=lowest_price&limit=10`;
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json'
      }
    });
    if (!res.ok) return null;
    const data: any = await res.json();
    const listings: any[] = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
    if (listings.length === 0) return null;
    const prices = listings.map((l) => Number(l?.price ?? 0) / 100).filter((p) => p > 0);
    if (prices.length === 0) return null;
    const sorted = [...prices].sort((a, b) => a - b);
    return { marketHashName, minUSD: sorted[0], medianUSD: sorted[Math.floor(sorted.length / 2)] };
  } catch {
    return null;
  }
}
