export type ProScrapedData = {
  name: string;
  team: string | null;
  role: string | null;
  country: string | null;
  styleLabel: string | null;
  style: number;
  size: number;
  thickness: number;
  gap: number;
  red: number;
  green: number;
  blue: number;
  alpha: number;
  dot: boolean;
  tStyle: boolean;
  outline: number;
  splitDistance: number;
  fixedGap: number;
  innerSplitAlpha: number;
  outerSplitAlpha: number;
  followRecoil: boolean;
};

const STYLE_MAP: Record<string, number> = {
  'default': 0,
  'default static': 1,
  'classic': 2,
  'classic dynamic': 2,
  'classic static': 4,
  'classic 1': 3,
  'classic style': 4
};

function findTable(html: string, sectionTitle: string): Map<string, string> | null {
  const m = new Map<string, string>();
  const headerRegex = new RegExp(`<h[1-6][^>]*>\\s*${sectionTitle}\\s*</h[1-6]>`, 'i');
  const headerMatch = headerRegex.exec(html);
  let idx = headerMatch ? headerMatch.index + headerMatch[0].length : -1;
  if (idx < 0) {
    const fallback = new RegExp(`>${sectionTitle}<`, 'i').exec(html);
    idx = fallback ? fallback.index : html.indexOf(sectionTitle);
  }
  if (idx < 0) return null;
  const tableStart = html.indexOf('<table', idx);
  const tableEnd = html.indexOf('</table>', tableStart);
  if (tableStart < 0 || tableEnd < 0) return null;
  const table = html.slice(tableStart, tableEnd);
  const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/g;
  let row: RegExpExecArray | null;
  while ((row = rowRegex.exec(table)) !== null) {
    const cells = Array.from(row[1].matchAll(/<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/g)).map((c) =>
      c[1].replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').trim()
    );
    if (cells.length >= 2) m.set(cells[0].toLowerCase(), cells[1]);
  }
  return m.size > 0 ? m : null;
}

function num(s: string | undefined, fallback = 0): number {
  if (!s) return fallback;
  const n = Number(s.replace(/[^0-9.\-]/g, ''));
  return Number.isFinite(n) ? n : fallback;
}

function yesNo(s: string | undefined): boolean {
  if (!s) return false;
  return /^(yes|sim|true|enabled|1)$/i.test(s.trim());
}

function styleFromLabel(label: string | undefined): { id: number; label: string } {
  if (!label) return { id: 4, label: 'Classic Static' };
  const key = label.toLowerCase().trim();
  return { id: STYLE_MAP[key] ?? 4, label };
}

async function fetchHtmlDirect(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      cache: 'no-store',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html'
      },
      signal: AbortSignal.timeout(8000)
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

export async function fetchProSettings(slug: string): Promise<ProScrapedData | null> {
  const url = `https://prosettings.net/players/${slug}/`;
  let html = await fetchHtmlDirect(url);
  let source = 'direct';
  if (!html || html.length < 2000) {
    const { fetchViaExa } = await import('./exa');
    const exa = await fetchViaExa(url);
    if (exa?.text && exa.text.length > 1000) {
      html = exa.text;
      source = 'exa';
    }
  }
  if (!html) {
    console.log(`[prosettings] ${slug}: no html`);
    return null;
  }
  console.log(`[prosettings] ${slug} via ${source} (${html.length} chars)`);
  try {
    const headerTable = findTable(html, 'Name');
    const cross = findTable(html, 'Crosshair') ?? findTable(html, 'Style');
    if (!cross) return null;

    const styleInfo = styleFromLabel(cross.get('style'));

    const name = headerTable?.get('name') ?? slug;
    const team = headerTable?.get('team') ?? null;
    const country = headerTable?.get('country') ?? null;

    const roleMatch = html.match(/playing for [^<]+ as (?:an? )?([^.<\n]+)/i);
    const role = roleMatch ? roleMatch[1].trim().replace(/\.$/, '') : null;

    return {
      name,
      team,
      role,
      country,
      styleLabel: styleInfo.label,
      style: styleInfo.id,
      size: num(cross.get('length'), 2.5),
      thickness: num(cross.get('thickness'), 1),
      gap: num(cross.get('gap'), -2),
      outline: yesNo(cross.get('outline')) ? num(cross.get('outlinethickness'), 1) : 0,
      red: num(cross.get('red'), 0),
      green: num(cross.get('green'), 255),
      blue: num(cross.get('blue'), 0),
      alpha: yesNo(cross.get('alpha')) ? num(cross.get('alpha value'), 255) : 255,
      dot: yesNo(cross.get('dot')),
      tStyle: yesNo(cross.get('t style')),
      splitDistance: num(cross.get('split distance'), 3),
      fixedGap: num(cross.get('fixed gap'), 3),
      innerSplitAlpha: num(cross.get('inner split alpha'), 0),
      outerSplitAlpha: num(cross.get('outer split alpha'), 1),
      followRecoil: yesNo(cross.get('follow recoil'))
    };
  } catch (e) {
    console.error('[prosettings] fetch failed:', slug, (e as Error).message);
    return null;
  }
}

export function paramsToShareCode(p: ProScrapedData): string | null {
  try {
    const { encodeCrosshair } = require('csgo-sharecode');
    return encodeCrosshair({
      gap: p.gap,
      outline: p.outline > 0 ? p.outline : 1,
      red: p.red,
      green: p.green,
      blue: p.blue,
      alpha: p.alpha,
      splitDistance: p.splitDistance,
      fixedCrosshairGap: p.fixedGap,
      color: 5,
      outlineEnabled: p.outline > 0,
      innerSplitAlpha: p.innerSplitAlpha,
      outerSplitAlpha: p.outerSplitAlpha,
      splitSizeRatio: 1,
      thickness: p.thickness,
      centerDotEnabled: p.dot,
      deployedWeaponGapEnabled: false,
      alphaEnabled: true,
      tStyleEnabled: p.tStyle,
      style: p.style,
      length: p.size,
      followRecoil: p.followRecoil
    });
  } catch (e) {
    console.error('[prosettings] encode failed:', (e as Error).message);
    return null;
  }
}

export const KNOWN_PROS = [
  { slug: 'donk', team: 'Team Spirit', role: 'Rifler' },
  { slug: 'zywoo', team: 'Team Vitality', role: 'AWPer' },
  { slug: 's1mple', team: 'BC.Game', role: 'AWPer' },
  { slug: 'm0nesy', team: 'Falcons Esports', role: 'AWPer' },
  { slug: 'niko', team: 'Falcons Esports', role: 'Rifler' },
  { slug: 'sh1ro', team: 'Team Spirit', role: 'AWPer' },
  { slug: 'b1t', team: 'Natus Vincere', role: 'Rifler' },
  { slug: 'ropz', team: 'Team Vitality', role: 'Rifler' },
  { slug: 'broky', team: 'FaZe Clan', role: 'AWPer' },
  { slug: 'jl', team: 'MOUZ', role: 'Rifler' }
];
