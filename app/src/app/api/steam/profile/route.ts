import { NextResponse } from 'next/server';
import { getProfile, getSavedSteamId } from '@/lib/steam';

export async function GET() {
  const id = await getSavedSteamId();
  if (!id) return NextResponse.json({ connected: false });
  const profile = await getProfile(id).catch(() => null);
  return NextResponse.json({ connected: true, steamId: id, profile });
}
