type EvoFetch = { ok: boolean; status: number; data: any };

function env() {
  const base = process.env.EVOLUTION_BASE_URL;
  const key = process.env.EVOLUTION_API_KEY;
  const instance = process.env.EVOLUTION_INSTANCE ?? 'hub';
  return { base, key, instance };
}

async function call(path: string, init?: RequestInit): Promise<EvoFetch> {
  const { base, key } = env();
  if (!base || !key) return { ok: false, status: 500, data: { error: 'Missing Evolution env vars' } };
  try {
    const res = await fetch(`${base}${path}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', apikey: key, ...(init?.headers ?? {}) },
      cache: 'no-store'
    });
    const text = await res.text();
    let data: any = text;
    try { data = JSON.parse(text); } catch {}
    return { ok: res.ok, status: res.status, data };
  } catch (e) {
    return { ok: false, status: 0, data: { error: (e as Error).message } };
  }
}

export async function getInstanceState() {
  const { instance } = env();
  return call(`/instance/connectionState/${instance}`);
}

export async function fetchInstances() {
  return call(`/instance/fetchInstances`);
}

export async function createInstance() {
  const { instance } = env();
  return call(`/instance/create`, {
    method: 'POST',
    body: JSON.stringify({ instanceName: instance, integration: 'WHATSAPP-BAILEYS', qrcode: true })
  });
}

export async function connectInstance() {
  const { instance } = env();
  return call(`/instance/connect/${instance}`, { method: 'GET' });
}

export async function logoutInstance() {
  const { instance } = env();
  return call(`/instance/logout/${instance}`, { method: 'DELETE' });
}

export async function deleteInstance() {
  const { instance } = env();
  return call(`/instance/delete/${instance}`, { method: 'DELETE' });
}

export function getConfig() {
  const { instance } = env();
  return {
    instance,
    targetNumber: process.env.WHATSAPP_TO ?? '',
    baseUrl: process.env.EVOLUTION_BASE_URL ?? ''
  };
}
