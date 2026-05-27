import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { fetchProSettings, paramsToShareCode, KNOWN_PROS } from '@/lib/prosettings';
import { PROS_SEED } from '@/lib/pros-seed';

export const maxDuration = 300;

export async function POST(req: Request) {
  const url = new URL(req.url);
  const single = url.searchParams.get('slug');
  const forceSeed = url.searchParams.get('seed') === '1';

  const targets = single
    ? [{ slug: single, team: null as string | null, role: null as string | null }]
    : KNOWN_PROS;

  const results: { slug: string; ok: boolean; source: string; error?: string; name?: string }[] = [];

  for (const t of targets) {
    let data = forceSeed ? null : await fetchProSettings(t.slug);
    let source = 'prosettings';

    if (!data) {
      const seed = PROS_SEED.find((p) => p.slug === t.slug);
      if (seed) {
        data = seed;
        source = 'seed';
      }
    }

    if (!data) {
      await db.proPlayer.upsert({
        where: { slug: t.slug },
        create: { slug: t.slug, name: t.slug, fetchError: 'no data (scrape blocked, no seed)', lastFetchedAt: new Date() },
        update: { fetchError: 'no data (scrape blocked, no seed)', lastFetchedAt: new Date() }
      });
      results.push({ slug: t.slug, ok: false, source: 'none', error: 'no data' });
      continue;
    }

    const code = paramsToShareCode(data);
    const upsertData: any = {
      name: data.name,
      team: data.team ?? t.team ?? null,
      role: data.role ?? t.role ?? null,
      country: data.country ?? null,
      code,
      styleLabel: data.styleLabel,
      style: data.style,
      size: data.size,
      thickness: data.thickness,
      gap: data.gap,
      red: data.red,
      green: data.green,
      blue: data.blue,
      alpha: data.alpha,
      dot: data.dot,
      tStyle: data.tStyle,
      outline: data.outline,
      splitDistance: data.splitDistance,
      fixedGap: data.fixedGap,
      innerSplitAlpha: data.innerSplitAlpha,
      outerSplitAlpha: data.outerSplitAlpha,
      followRecoil: data.followRecoil,
      lastFetchedAt: new Date(),
      fetchError: null
    };
    await db.proPlayer.upsert({
      where: { slug: t.slug },
      create: { slug: t.slug, ...upsertData },
      update: upsertData
    });
    results.push({ slug: t.slug, ok: true, source, name: data.name });
    if (source === 'prosettings') await new Promise((r) => setTimeout(r, 800));
  }

  return NextResponse.json({
    ok: true,
    total: results.length,
    succeeded: results.filter((r) => r.ok).length,
    fromScrape: results.filter((r) => r.source === 'prosettings').length,
    fromSeed: results.filter((r) => r.source === 'seed').length,
    results
  });
}
