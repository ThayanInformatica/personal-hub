export function Sparkline({ values, width = 100, height = 28, color = '#22c55e' }: {
  values: number[];
  width?: number;
  height?: number;
  color?: string;
}) {
  if (!values || values.length < 2) {
    return <div style={{ width, height }} className="text-[10px] text-muted-foreground">—</div>;
  }
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const step = width / (values.length - 1);
  const points = values.map((v, i) => {
    const x = i * step;
    const y = height - ((v - min) / range) * height;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
  const last = values[values.length - 1];
  const first = values[0];
  const trendColor = last >= first ? '#22c55e' : '#ef4444';
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <polyline fill="none" stroke={trendColor} strokeWidth="1.5" points={points} />
    </svg>
  );
}
