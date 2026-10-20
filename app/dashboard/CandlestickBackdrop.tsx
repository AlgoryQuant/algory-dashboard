'use client';

import { motion } from 'framer-motion';

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

const SERIES_A = buildCandles(42, 40, 28, 220);
const SERIES_B = buildCandles(28, 80, 36, 380);

function CandleGroup({
  candles,
  bodyWidth,
  upClass,
  downClass,
}: {
  candles: Candle[];
  bodyWidth: number;
  upClass: string;
  downClass: string;
}) {
  return (
    <g>
      {candles.map((c, i) => {
        const up = c.close >= c.open;
        const top = Math.min(c.open, c.close);
        const height = Math.max(2, Math.abs(c.close - c.open));
        const mid = c.x + bodyWidth / 2;
        return (
          <g key={i} className={up ? upClass : downClass}>
            <line x1={mid} y1={c.high} x2={mid} y2={c.low} stroke="currentColor" strokeWidth={1} />
            <rect
              x={c.x}
              y={top}
              width={bodyWidth}
              height={height}
              fill="currentColor"
              stroke="currentColor"
              strokeWidth={0.5}
            />
          </g>
        );
      })}
    </g>
  );
}

/**
 * Atmospheric FX/crypto candlestick field — low opacity, non-interactive.
 * Theme tokens via currentColor / Tailwind dark: variants.
 */
export function CandlestickBackdrop() {
  return (
    <motion.div
      aria-hidden
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
    >
      {/* Soft depth — zinc/emerald only, no purple */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_20%,rgba(16,185,129,0.07),transparent_55%)] dark:bg-[radial-gradient(ellipse_at_70%_20%,rgba(16,185,129,0.08),transparent_55%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_80%,rgba(9,9,11,0.04),transparent_50%)] dark:bg-[radial-gradient(ellipse_at_20%_80%,rgba(255,255,255,0.03),transparent_50%)]" />

      <svg
        className="absolute inset-0 h-full w-full opacity-[0.38] dark:opacity-[0.42]"
        viewBox="0 0 1200 700"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <linearGradient id="hubCandleFade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="white" stopOpacity="0.15" />
            <stop offset="45%" stopColor="white" stopOpacity="1" />
            <stop offset="100%" stopColor="white" stopOpacity="0.05" />
          </linearGradient>
          <mask id="hubCandleMask">
            <rect width="1200" height="700" fill="url(#hubCandleFade)" />
          </mask>
        </defs>

        <g mask="url(#hubCandleMask)">
          {/* Primary series — mid field */}
          <g transform="translate(0 40) scale(1 1.05)">
            <CandleGroup
              candles={SERIES_A}
              bodyWidth={10}
              upClass="text-emerald-700/80 dark:text-emerald-500/70"
              downClass="text-zinc-600/70 dark:text-zinc-500/55"
            />
          </g>
          {/* Secondary deeper series — parallax feel */}
          <g transform="translate(120 120) scale(0.92 0.85)" className="opacity-50">
            <CandleGroup
              candles={SERIES_B}
              bodyWidth={12}
              upClass="text-emerald-800/60 dark:text-emerald-400/40"
              downClass="text-zinc-700/50 dark:text-zinc-600/40"
            />
          </g>
          {/* Thin volume stubs under primary */}
          <g className="text-zinc-500/30 dark:text-zinc-600/25" transform="translate(40 520)">
            {SERIES_A.map((c, i) => {
              const h = 8 + ((i * 17) % 28);
              return (
                <rect
                  key={i}
                  x={c.x}
                  y={40 - h}
                  width={8}
                  height={h}
                  fill="currentColor"
                />
              );
            })}
          </g>
        </g>
      </svg>

      {/* Soft vignette — keep candles readable at mid-field, clear brand zone */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,var(--background)_0%,transparent_42%,var(--background)_88%)]" />
      <div className="absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-background to-transparent" />
      <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-background to-transparent" />
    </motion.div>
  );
}
