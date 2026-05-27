import { db } from './db';
import { fetchSteamMarketPrice } from './steam-market';
import { fetchCSFloatPrice } from './csfloat';
import { fetchSkinportItem } from './skinport-item';
import { getUsdToBrl } from './forex';

export type SourcePrice = {
  source: 'steam' | 'csfloat' | 'skinport';
  currency: 'BRL';
  min: number | null;
  median: number | null;
  url?: string;
  capturedAt: Date;
};

export async function fetchAllSources(marketHashName: string): Promise<SourcePrice[]> {
  const out: SourcePrice[] = [];
  const now = new Date();

  const steam = await fetchSteamMarketPrice(marketHashName).catch(() => null);
  if (steam) {
    out.push({
      source: 'steam',
      currency: 'BRL',
      min: steam.min,
      median: steam.median,
      url: `https://steamcommunity.com/market/listings/730/${encodeURIComponent(marketHashName)}`,
      capturedAt: now
    });
  }

  const cf = await fetchCSFloatPrice(marketHashName).catch(() => null);
  if (cf) {
    const rate = await getUsdToBrl();
    out.push({
      source: 'csfloat',
      currency: 'BRL',
      min: cf.minUSD != null ? cf.minUSD * rate : null,
      median: cf.medianUSD != null ? cf.medianUSD * rate : null,
      url: cf.url,
      capturedAt: now
    });
  }

  const sp = await fetchSkinportItem(marketHashName).catch(() => null);
  if (sp) {
    out.push({
      source: 'skinport',
      currency: 'BRL',
      min: sp.minBRL,
      median: sp.medianBRL,
      url: sp.url,
      capturedAt: now
    });
  }

  return out;
}

export async function captureAndStoreSnapshot(marketHashName: string): Promise<SourcePrice[]> {
  const prices = await fetchAllSources(marketHashName);
  for (const p of prices) {
    await db.skinSnapshot.create({
      data: {
        marketHashName,
        source: p.source,
        currency: p.currency,
        min: p.min,
        median: p.median,
        capturedAt: p.capturedAt
      }
    });
    await db.externalPrice.upsert({
      where: { marketHashName_source: { marketHashName, source: p.source } },
      create: {
        marketHashName,
        source: p.source,
        currency: p.currency,
        min: p.min,
        median: p.median,
        url: p.url ?? null
      },
      update: {
        currency: p.currency,
        min: p.min,
        median: p.median,
        url: p.url ?? null
      }
    });
  }
  if (prices.length === 0) return prices;
  const steamPrice = prices.find((p) => p.source === 'steam');
  if (steamPrice) {
    await db.skinPrice.upsert({
      where: { marketHashName },
      create: {
        marketHashName,
        currency: 'BRL',
        min: steamPrice.min,
        median: steamPrice.median
      },
      update: {
        currency: 'BRL',
        min: steamPrice.min,
        median: steamPrice.median
      }
    });
  }
  return prices;
}
