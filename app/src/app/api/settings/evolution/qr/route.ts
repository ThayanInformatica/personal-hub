import { NextResponse } from 'next/server';
import { connectInstance } from '@/lib/evolution-admin';

export async function GET() {
  const r = await connectInstance();
  const code = r.data?.base64 ?? r.data?.qrcode?.base64 ?? r.data?.code ?? null;
  return NextResponse.json({ ok: r.ok, code, raw: r.data }, { status: r.ok ? 200 : r.status || 500 });
}
