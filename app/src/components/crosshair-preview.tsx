import type { CrosshairParams } from '@/lib/crosshair';

type Props = {
  params: CrosshairParams;
  bg?: 'dark' | 'map';
  size?: number;
};

const LEN_SCALE = 5;
const THICK_SCALE = 2;
const GAP_SCALE = 5;
const CS2_GAP_OFFSET = 4;

export function CrosshairPreview({ params, bg = 'dark', size = 160 }: Props) {
  const { size: s, thickness, gap, red, green, blue, alpha, dot, tStyle, outline } = params;

  const c = size / 2;
  const lineLen = Math.max(s, 0.3) * LEN_SCALE;
  const lineWidth = Math.max(thickness, 0.3) * THICK_SCALE;
  const innerGap = Math.max((gap + CS2_GAP_OFFSET) * GAP_SCALE, 0);
  const outlinePx = outline * THICK_SCALE;

  const color = `rgba(${red},${green},${blue},${(alpha / 255).toFixed(3)})`;

  const lines: { x: number; y: number; w: number; h: number }[] = [];

  if (!tStyle) {
    lines.push({ x: c - lineWidth / 2, y: c - innerGap - lineLen, w: lineWidth, h: lineLen });
  }
  lines.push({ x: c - lineWidth / 2, y: c + innerGap, w: lineWidth, h: lineLen });
  lines.push({ x: c - innerGap - lineLen, y: c - lineWidth / 2, w: lineLen, h: lineWidth });
  lines.push({ x: c + innerGap, y: c - lineWidth / 2, w: lineLen, h: lineWidth });

  const bgClass = bg === 'map'
    ? 'bg-gradient-to-br from-stone-700 via-stone-500 to-stone-700'
    : 'bg-neutral-900';

  return (
    <div className={`relative inline-block overflow-hidden rounded-md ${bgClass}`} style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-label="preview da mira">
        {outline > 0 && lines.map((l, i) => (
          <rect
            key={`o${i}`}
            x={l.x - outlinePx}
            y={l.y - outlinePx}
            width={l.w + outlinePx * 2}
            height={l.h + outlinePx * 2}
            fill="black"
            opacity={0.85}
          />
        ))}
        {lines.map((l, i) => (
          <rect key={i} x={l.x} y={l.y} width={l.w} height={l.h} fill={color} />
        ))}
        {dot && (
          <>
            {outline > 0 && (
              <rect
                x={c - lineWidth / 2 - outlinePx}
                y={c - lineWidth / 2 - outlinePx}
                width={lineWidth + outlinePx * 2}
                height={lineWidth + outlinePx * 2}
                fill="black"
                opacity={0.85}
              />
            )}
            <rect x={c - lineWidth / 2} y={c - lineWidth / 2} width={lineWidth} height={lineWidth} fill={color} />
          </>
        )}
      </svg>
    </div>
  );
}
