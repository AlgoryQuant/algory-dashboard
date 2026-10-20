'use client';

import { useState } from 'react';
import PositionPriceChart from './PositionPriceChart';
import { SWAP_STOCKS } from './reasons';

export function PositionPrompt() {
  return (
    <section
      id="position-detail"
      data-thesis-panel
      data-ticker=""
      className="rounded-3xl border border-dashed border-foreground/15 bg-surface p-5 md:p-7"
    >
      <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-muted">Výběr titulu</p>
      <p className="mt-3 text-[15px] leading-7 text-foreground/80">
        Klikněte na výsek nebo řádek. Objeví se ticker, čísla pozice a důvod, proč titul v knize je.
      </p>
    </section>
  );
}

export function PositionDetail({
  ticker,
  name,
  amount,
  sector,
  color,
  body,
  weight,
  quote,
  pnl,
  chartSymbol,
}: {
  ticker: string;
  name: string;
  amount: string;
  sector: string;
  color: string;
  body: string;
  weight?: string;
  /** Google Finance style, e.g. "NYSE: PFE". */
  quote?: string;
  pnl?: string;
  /** Yahoo Finance symbol for the live price chart. */
  chartSymbol?: string;
}) {
  const hasPieStats = weight != null || quote != null || pnl != null;
  return (
    <section
      id="position-detail"
      data-thesis-panel
      data-ticker={ticker}
      aria-live="polite"
      className="rounded-3xl border border-foreground/35 bg-foreground/[0.05] p-5 md:p-7 shadow-[0_0_0_1px_color-mix(in_oklab,var(--foreground)_6%,transparent)]"
    >
      <div className="flex items-center gap-3">
        <span className="h-10 w-1.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
        <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-muted">Proč je v knize</p>
      </div>
      <p className="mt-4 text-5xl sm:text-6xl font-black tracking-tighter text-foreground leading-none">{ticker}</p>
      <p className="mt-3 text-base font-bold text-foreground">{name}</p>
      <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-muted">{sector}</p>
      <p className="mt-3 text-2xl font-black font-mono text-foreground">{amount}</p>
      {hasPieStats && (
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {weight != null && (
            <div className="rounded-2xl border border-edge bg-foreground/[0.04] px-4 py-3">
              <p className="text-[10px] uppercase tracking-widest text-muted font-bold">Váha</p>
              <p className="mt-1 text-lg font-black font-mono text-foreground">{weight}</p>
            </div>
          )}
          {quote != null && (
            <div className="rounded-2xl border border-edge bg-foreground/[0.04] px-4 py-3">
              <p className="text-[10px] uppercase tracking-widest text-muted font-bold">Ticker</p>
              <p className="mt-1 text-lg font-black font-mono text-foreground tracking-tight">{quote}</p>
            </div>
          )}
          {pnl != null && (
            <div className="rounded-2xl border border-edge bg-foreground/[0.04] px-4 py-3">
              <p className="text-[10px] uppercase tracking-widest text-muted font-bold">Zisk / ztráta</p>
              <p className="mt-1 text-lg font-black font-mono text-foreground">{pnl}</p>
            </div>
          )}
        </div>
      )}
      {chartSymbol && <PositionPriceChart symbol={chartSymbol} color={color} />}
      <p className="mt-4 text-[15px] leading-7 text-foreground/90">{body}</p>
    </section>
  );
}

export function LvmhSwapNote() {
  const [openId, setOpenId] = useState<string | null>(null);
  return (
    <section className="rounded-3xl border border-edge bg-surface p-5 md:p-8 flex flex-col gap-5">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-muted">Výměna v alokaci</p>
        <h2 className="mt-2 text-2xl md:text-3xl font-black tracking-tight text-foreground">Proč LVMH místo Novo Nordisk</h2>
        <p className="mt-3 text-sm text-muted leading-relaxed max-w-3xl">
          Klikněte na titul. Objeví se TradingView symbol a český důvod, proč v téhle výměně figuruje.
        </p>
      </div>
      <div className="flex flex-col gap-2">
        {SWAP_STOCKS.map((stock) => {
          const open = openId === stock.id;
          return (
            <button
              key={stock.id}
              type="button"
              aria-expanded={open}
              onClick={() => setOpenId(open ? null : stock.id)}
              className={`text-left rounded-2xl border px-4 py-3 transition-colors ${open ? 'border-foreground/45 bg-row-selected' : 'border-edge hover:border-foreground/25 bg-row-hover'}`}
            >
              <div className="flex items-center gap-3">
                <span className="w-1.5 self-stretch min-h-8 rounded-full shrink-0" style={{ backgroundColor: stock.color }} />
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1">
                    <span className={`font-black text-foreground tracking-tight ${open ? 'text-2xl leading-none' : 'text-sm'}`}>{stock.id}</span>
                    <span className="text-[10px] uppercase tracking-widest text-muted font-bold">{stock.role}</span>
                  </div>
                  <span className="block text-sm text-foreground/80 mt-1">{stock.name}</span>
                  {open && (
                    <div className="mt-3 flex flex-col gap-3">
                      <div className="rounded-xl border border-edge bg-foreground/[0.04] px-3 py-2.5">
                        <p className="text-[10px] uppercase tracking-widest text-muted font-bold">TradingView</p>
                        <p className="mt-1 text-lg font-black font-mono text-foreground tracking-tight">{stock.tv}</p>
                      </div>
                      <p className="text-[15px] leading-7 text-foreground/80">{stock.body}</p>
                    </div>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
