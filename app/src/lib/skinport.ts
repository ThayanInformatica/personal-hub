const ENDPOINT = 'https://api.skinport.com/v1/items';
const CS2_APP_ID = 730;

export type SkinportItem = {
  market_hash_name: string;
  currency: string;
  suggested_price: number | null;
  item_page: string;
  market_page: string;
  min_price: number | null;
  max_price: number | null;
  mean_price: number | null;
  median_price: number | null;
  quantity: number;
  created_at: number;
  updated_at: number;
};

export async function fetchSkinportItems(currency = 'BRL', tradable = false): Promise<SkinportItem[]> {
  const url = `${ENDPOINT}?app_id=${CS2_APP_ID}&currency=${currency}&tradable=${tradable ? 1 : 0}`;
  const res = await fetch(url, {
    headers: {
      'Accept-Encoding': 'br, gzip',
      'User-Agent': 'PersonalHub/1.0'
    },
    cache: 'no-store'
  });
  if (!res.ok) {
    throw new Error(`Skinport ${res.status}: ${await res.text().catch(() => '')}`);
  }
  return res.json();
}
