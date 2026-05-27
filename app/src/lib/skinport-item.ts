export type SkinportSinglePrice = {
  marketHashName: string;
  minBRL: number | null;
  medianBRL: number | null;
  url: string;
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
      cache: 'no-store',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html',
        'Accept-Language': 'pt-BR,en;q=0.9'
      }
    });
    if (!res.ok) return null;
    const html = await res.text();

    const ldMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
    if (ldMatch) {
      try {
        const ld = JSON.parse(ldMatch[1]);
        const offers = ld?.offers;
        if (offers) {
          const min = Number(offers.lowPrice ?? offers.price ?? null);
          const median = Number(offers.highPrice ?? offers.price ?? null);
          return {
            marketHashName,
            minBRL: Number.isFinite(min) ? min : null,
            medianBRL: Number.isFinite(median) ? median : null,
            url
          };
        }
      } catch {}
    }

    const priceMatch = html.match(/data-cy="item-price"[^>]*>\s*R\$\s*([\d.,]+)/);
    if (priceMatch) {
      const min = Number(priceMatch[1].replace(/\./g, '').replace(',', '.'));
      return { marketHashName, minBRL: min, medianBRL: null, url };
    }
    return null;
  } catch {
    return null;
  }
}
