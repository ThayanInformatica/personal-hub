import { NextResponse } from 'next/server';
import { getRecentlyPlayed, getSavedSteamId } from '@/lib/steam';

export async function GET() {
  const id = await getSavedSteamId();
  if (!id) return NextResponse.json({ error: 'not connected' }, { status: 404 });
  const games = await getRecentlyPlayed(id);
  return NextResponse.json(games);
}
