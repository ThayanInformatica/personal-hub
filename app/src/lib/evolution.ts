type SendResult = { ok: boolean; error?: string; data?: unknown };

export async function sendWhatsapp(text: string): Promise<SendResult> {
  const base = process.env.EVOLUTION_BASE_URL;
  const key = process.env.EVOLUTION_API_KEY;
  const instance = process.env.EVOLUTION_INSTANCE;
  const number = process.env.WHATSAPP_TO;

  if (!base || !key || !instance || !number) {
    return { ok: false, error: 'Missing Evolution env vars' };
  }

  try {
    const res = await fetch(`${base}/message/sendText/${instance}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: key },
      body: JSON.stringify({ number, text })
    });
    if (!res.ok) {
      const body = await res.text();
      return { ok: false, error: `HTTP ${res.status}: ${body}` };
    }
    const data = await res.json().catch(() => ({}));
    return { ok: true, data };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
