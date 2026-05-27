import { NextResponse } from 'next/server';
import { SESSION_COOKIE, SESSION_MAX_AGE, signCookie } from '@/lib/auth';

export async function POST(req: Request) {
  const { password } = await req.json().catch(() => ({}));
  const expected = process.env.HUB_PASSWORD;
  if (!expected || password !== expected) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, await signCookie(), {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE
  });
  return res;
}
