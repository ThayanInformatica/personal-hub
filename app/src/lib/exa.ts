const EXA_ENDPOINT = 'https://api.exa.ai/contents';

export type ExaFetchResult = {
  url: string;
  text: string;
  title?: string;
};

export function isExaConfigured(): boolean {
  return !!process.env.EXA_API_KEY;
}

export async function fetchViaExa(url: string): Promise<ExaFetchResult | null> {
  const key = process.env.EXA_API_KEY;
  if (!key) return null;
  try {
    const res = await fetch(EXA_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': key
      },
      body: JSON.stringify({
        urls: [url],
        text: { includeHtmlTags: true, maxCharacters: 50000 }
      })
    });
    if (!res.ok) {
      console.error('[exa] HTTP', res.status, await res.text().catch(() => ''));
      return null;
    }
    const data = await res.json();
    const result = data?.results?.[0];
    if (!result) return null;
    return {
      url: result.url ?? url,
      text: result.text ?? '',
      title: result.title
    };
  } catch (e) {
    console.error('[exa] fetch failed:', (e as Error).message);
    return null;
  }
}
