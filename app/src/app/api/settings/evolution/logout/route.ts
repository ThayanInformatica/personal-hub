import { NextResponse } from 'next/server';
import { logoutInstance } from '@/lib/evolution-admin';

export async function POST() {
  const r = await logoutInstance();
  return NextResponse.json(r.data, { status: r.ok ? 200 : r.status || 500 });
}
