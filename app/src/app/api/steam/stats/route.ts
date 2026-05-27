import { NextResponse } from 'next/server';
import { getCS2Stats, getSavedSteamId } from '@/lib/steam';

export async function GET() {
  const id = await getSavedSteamId();
  if (!id) return NextResponse.json({ error: 'not connected' }, { status: 404 });
  const stats = await getCS2Stats(id);
  if (!stats) return NextResponse.json({ error: 'no stats (perfil privado ou nunca jogou CS2)' }, { status: 404 });
  return NextResponse.json(stats);
}
