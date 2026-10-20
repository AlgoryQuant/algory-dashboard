'use client';

type Candle = {
  x: number;
  open: number;
  close: number;
  high: number;
  low: number;
};

/** Deterministic pseudo-walk so SSR and client match. */
function buildCandles(count: number, startX: number, gap: number, base: number): Candle[] {
  const candles: Candle[] = [];
  let price = base;
  for (let i = 0; i < count; i++) {
    const drift = Math.sin(i * 0.37) * 18 + Math.cos(i * 0.19) * 10;
    const open = price;
    const close = open + drift + (i % 3 === 0 ? -8 : 6);
    const high = Math.max(open, close) + 10 + (i % 5) * 2;
    const low = Math.min(open, close) - 8 - (i % 4) * 2;
    candles.push({ x: startX + i * gap, open, close, high, low });
    price = close;
  }
  return candles;
}

const SERIES = buildCandles(48, 24, 24, 260);

/**
 * Quiet chart-print / terminal bleed — ink only, no glow wallpaper.
 */
export function CandlestickBackdrop() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden animate-[hubFade_0.9s_ease_both]"
    >
      <svg
        className="absolute -right-[8%] top-[12%] h-[78%] w-[92%] text-foreground opacity-[0.08] dark:opacity-[0.13] sm:w-[75%] lg:w-[62%]"
        viewBox="0 0 1200 520"
        preserveAspectRatio="xMaxYMid meet"
      >
        {SERIES.map((c, i) => {
          const up = c.close >= c.open;
          const top = Math.min(c.open, c.close);
          const height = Math.max(1.5, Math.abs(c.close - c.open));
          const mid = c.x + 4;
          const bodyWidth = 8;
          return (
            <g key={i} opacity={up ? 0.9 : 0.4}>
              <line
                x1={mid}
                y1={c.high}
                x2={mid}
                y2={c.low}
                stroke="currentColor"
                strokeWidth={0.75}
              />
              <rect
                x={c.x}
                y={top}
                width={bodyWidth}
                height={height}
                fill={up ? 'none' : 'currentColor'}
                stroke="currentColor"
                strokeWidth={0.75}
              />
            </g>
          );
        })}
      </svg>

      {/* Soft paper wash so type stays primary */}
      <div className="absolute inset-0 bg-gradient-to-r from-background via-background/85 to-transparent sm:via-background/70" />
      <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-background to-transparent" />
      <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-background to-transparent" />
    </div>
  );
}
