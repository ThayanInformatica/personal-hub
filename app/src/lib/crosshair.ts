import { decodeCrosshairShareCode, encodeCrosshair, type Crosshair as LibCrosshair } from 'csgo-sharecode';

export type CrosshairParams = {
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
};

export const DEFAULT_PARAMS: CrosshairParams = {
  style: 4,
  size: 2.5,
  thickness: 1.0,
  gap: -2,
  red: 0,
  green: 255,
  blue: 0,
  alpha: 255,
  dot: false,
  tStyle: false,
  outline: 0
};

export function decodeShareCode(raw: string): CrosshairParams | null {
  try {
    const trimmed = raw.trim();
    if (!/^CSGO-/i.test(trimmed)) return null;
    const ch = decodeCrosshairShareCode(trimmed);
    return {
      style: ch.style,
      size: ch.length,
      thickness: ch.thickness,
      gap: ch.gap,
      red: ch.red,
      green: ch.green,
      blue: ch.blue,
      alpha: ch.alpha,
      dot: ch.centerDotEnabled,
      tStyle: ch.tStyleEnabled,
      outline: ch.outlineEnabled ? ch.outline : 0
    };
  } catch {
    return null;
  }
}

export function encodeShareCode(p: CrosshairParams): string {
  const ch: LibCrosshair = {
    gap: p.gap,
    outline: p.outline > 0 ? p.outline : 1,
    red: p.red,
    green: p.green,
    blue: p.blue,
    alpha: p.alpha,
    splitDistance: 3,
    fixedCrosshairGap: p.gap,
    color: 5,
    outlineEnabled: p.outline > 0,
    innerSplitAlpha: 1,
    outerSplitAlpha: 0.5,
    splitSizeRatio: 0,
    thickness: p.thickness,
    centerDotEnabled: p.dot,
    deployedWeaponGapEnabled: false,
    alphaEnabled: true,
    tStyleEnabled: p.tStyle,
    style: p.style,
    length: p.size,
    followRecoil: false
  };
  return encodeCrosshair(ch);
}

export function paramsToCfg(p: CrosshairParams): string {
  const lines = [
    `cl_crosshairstyle ${p.style}`,
    `cl_crosshairsize ${p.size.toFixed(1)}`,
    `cl_crosshairthickness ${p.thickness.toFixed(1)}`,
    `cl_crosshairgap ${p.gap.toFixed(1)}`,
    `cl_crosshaircolor 5`,
    `cl_crosshaircolor_r ${p.red}`,
    `cl_crosshaircolor_g ${p.green}`,
    `cl_crosshaircolor_b ${p.blue}`,
    `cl_crosshairalpha ${p.alpha}`,
    `cl_crosshairdot ${p.dot ? 1 : 0}`,
    `cl_crosshair_t ${p.tStyle ? 1 : 0}`,
    `cl_crosshair_drawoutline ${p.outline > 0 ? 1 : 0}`,
    `cl_crosshair_outlinethickness ${p.outline.toFixed(1)}`
  ];
  return lines.join('\n');
}
