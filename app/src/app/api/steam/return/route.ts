import { NextResponse } from 'next/server';
import { verifyReturn, saveSteamId, getBaseUrl } from '@/lib/steam';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const base = getBaseUrl(req);
  const steamId = await verifyReturn(url.searchParams);
  if (!steamId) {
    return NextResponse.redirect(`${base}/cs2?steam=fail#steam`);
  }
  await saveSteamId(steamId);
  return NextResponse.redirect(`${base}/cs2?steam=ok#steam`);
}
