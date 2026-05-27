import { NextResponse } from 'next/server';
import { buildLoginUrl, getBaseUrl } from '@/lib/steam';

export async function GET(req: Request) {
  const url = buildLoginUrl(getBaseUrl(req));
  return NextResponse.redirect(url);
}
