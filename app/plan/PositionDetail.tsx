import { SWAP_PARAGRAPHS } from './reasons';

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
        Klikněte na výsek nebo řádek. Objeví se ticker, částka v korunách a důvod, proč titul v knize je.
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
}: {
  ticker: string;
  name: string;
  amount: string;
  sector: string;
  color: string;
  body: string;
}) {
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
      <p className="mt-4 text-[15px] leading-7 text-zinc-200">{body}</p>
    </section>
  );
}

export function LvmhSwapNote() {
  return (
    <section className="rounded-3xl border border-white/10 bg-[#050505] p-5 md:p-8 flex flex-col gap-4">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-zinc-500">Výměna v alokaci</p>
        <h2 className="mt-2 text-2xl md:text-3xl font-black tracking-tight text-white">Proč LVMH místo Novo Nordisk</h2>
      </div>
      {SWAP_PARAGRAPHS.map((paragraph) => (
        <p key={paragraph.slice(0, 32)} className="text-[15px] leading-7 text-zinc-300">
          {paragraph}
        </p>
      ))}
    </section>
  );
}
