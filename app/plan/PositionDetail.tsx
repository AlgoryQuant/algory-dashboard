'use client';

import { useState } from 'react';
import { SWAP_STOCKS } from './reasons';

export function PositionPrompt() {
  return (
    <section
      id="position-detail"
      data-thesis-panel
      data-ticker=""
      className="rounded-3xl border border-dashed border-white/15 bg-[#050505] p-5 md:p-7"
    >
      <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-zinc-500">Výběr titulu</p>
      <p className="mt-3 text-[15px] leading-7 text-zinc-300">
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
}) {
  const hasPieStats = weight != null || quote != null || pnl != null;
  return (
    <section
      id="position-detail"
      data-thesis-panel
      data-ticker={ticker}
      aria-live="polite"
      className="rounded-3xl border border-white/35 bg-white/[0.05] p-5 md:p-7 shadow-[0_0_0_1px_rgba(255,255,255,0.06)]"
    >
      <div className="flex items-center gap-3">
        <span className="h-10 w-1.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
        <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-zinc-400">Proč je v knize</p>
      </div>
      <p className="mt-4 text-5xl sm:text-6xl font-black tracking-tighter text-white leading-none">{ticker}</p>
      <p className="mt-3 text-base font-bold text-white">{name}</p>
      <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-zinc-400">{sector}</p>
      <p className="mt-3 text-2xl font-black font-mono text-white">{amount}</p>
      {hasPieStats && (
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {weight != null && (
            <div className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3">
              <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Váha</p>
              <p className="mt-1 text-lg font-black font-mono text-white">{weight}</p>
            </div>
          )}
          {quote != null && (
            <div className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3">
              <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Ticker</p>
              <p className="mt-1 text-lg font-black font-mono text-white tracking-tight">{quote}</p>
            </div>
          )}
          {pnl != null && (
            <div className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3">
              <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Zisk / ztráta</p>
              <p className="mt-1 text-lg font-black font-mono text-white">{pnl}</p>
            </div>
          )}
        </div>
      )}
      <p className="mt-4 text-[15px] leading-7 text-zinc-200">{body}</p>
    </section>
  );
}

export function LvmhSwapNote() {
  const [openId, setOpenId] = useState<string | null>(null);
  return (
    <section className="rounded-3xl border border-white/10 bg-[#050505] p-5 md:p-8 flex flex-col gap-5">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-zinc-500">Výměna v alokaci</p>
        <h2 className="mt-2 text-2xl md:text-3xl font-black tracking-tight text-white">Proč LVMH místo Novo Nordisk</h2>
        <p className="mt-3 text-sm text-zinc-400 leading-relaxed max-w-3xl">
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
              className={`text-left rounded-2xl border px-4 py-3 transition-colors ${open ? 'border-white/40 bg-white/[0.06]' : 'border-white/10 hover:border-white/20 bg-black/20'}`}
            >
              <div className="flex items-center gap-3">
                <span className="w-1.5 self-stretch min-h-8 rounded-full shrink-0" style={{ backgroundColor: stock.color }} />
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1">
                    <span className={`font-black text-white tracking-tight ${open ? 'text-2xl leading-none' : 'text-sm'}`}>{stock.id}</span>
                    <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">{stock.role}</span>
                  </div>
                  <span className="block text-sm text-zinc-300 mt-1">{stock.name}</span>
                  {open && (
                    <div className="mt-3 flex flex-col gap-3">
                      <div className="rounded-xl border border-white/10 bg-black/40 px-3 py-2.5">
                        <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">TradingView</p>
                        <p className="mt-1 text-lg font-black font-mono text-white tracking-tight">{stock.tv}</p>
                      </div>
                      <p className="text-[15px] leading-7 text-zinc-300">{stock.body}</p>
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
