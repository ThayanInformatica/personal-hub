import { NextResponse } from 'next/server';
import { clearSteamId } from '@/lib/steam';

export async function POST() {
  await clearSteamId();
  return NextResponse.json({ ok: true });
}
