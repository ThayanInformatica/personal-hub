export type SkinportSinglePrice = {
  marketHashName: string;
  minBRL: number | null;
  medianBRL: number | null;
};

function slugify(name: string): string {
  return name
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/™/g, '')
    .replace(/\s*\|\s*/g, '-')
    .replace(/\(([^)]+)\)/g, '$1')
    .replace(/[^a-zA-Z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
}

export async function fetchSkinportItem(marketHashName: string): Promise<SkinportSinglePrice | null> {
  const slug = slugify(marketHashName);
  const url = `https://skinport.com/item/${slug}?cat=730`;
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html'
      }
    });
    if (!res.ok) return null;
    const html = await res.text();
    const ldMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
    if (ldMatch) {
      try {
        const ld: any = JSON.parse(ldMatch[1]);
        const offers = ld?.offers;
        if (offers) {
          const min = Number(offers.lowPrice ?? offers.price ?? null);
          const median = Number(offers.highPrice ?? offers.price ?? null);
          return {
            marketHashName,
            minBRL: Number.isFinite(min) ? min : null,
            medianBRL: Number.isFinite(median) ? median : null
          };
        }
      } catch {}
    }
    return null;
  } catch {
    return null;
  }
}
