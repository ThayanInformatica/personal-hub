const COOKIE_NAME = 'hub_session';
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

function getSecret(): string {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error('NEXTAUTH_SECRET not set');
  return secret;
}

function toHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function hmac(payload: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(getSecret()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(payload));
  return toHex(sig);
}

function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function signCookie(): Promise<string> {
  const ts = Date.now().toString();
  const payload = `ok.${ts}`;
  return `${payload}.${await hmac(payload)}`;
}

export async function verifyCookie(value: string | undefined | null): Promise<boolean> {
  if (!value) return false;
  const parts = value.split('.');
  if (parts.length !== 3) return false;
  const [prefix, ts, sig] = parts;
  if (prefix !== 'ok') return false;
  const payload = `${prefix}.${ts}`;
  const expected = await hmac(payload);
  if (!timingSafeEqualHex(sig, expected)) return false;
  const issued = Number(ts);
  if (!Number.isFinite(issued)) return false;
  if (Date.now() - issued > MAX_AGE_SECONDS * 1000) return false;
  return true;
}

export const SESSION_COOKIE = COOKIE_NAME;
export const SESSION_MAX_AGE = MAX_AGE_SECONDS;
