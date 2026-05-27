import { PrismaClient } from '@prisma/client';

const TTL_MS = 24 * 60 * 60 * 1000;
const FALLBACK = 5.4;

export async function getUsdToBrl(db: PrismaClient): Promise<number> {
  const cached = await db.forexRate.findUnique({ where: { pair: 'USD_BRL' } });
  if (cached && Date.now() - cached.updatedAt.getTime() < TTL_MS) {
    return cached.rate;
  }
  try {
    const res = await fetch('https://open.er-api.com/v6/latest/USD');
    if (res.ok) {
      const data: any = await res.json();
      const rate = Number(data?.rates?.BRL);
      if (rate > 0) {
        await db.forexRate.upsert({
          where: { pair: 'USD_BRL' },
          create: { pair: 'USD_BRL', rate },
          update: { rate }
        });
        return rate;
      }
    }
  } catch {}
  return cached?.rate ?? FALLBACK;
}
