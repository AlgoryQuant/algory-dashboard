'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { PositionDetail, PositionPrompt } from './PositionDetail';
import { PARENT_REASON } from './reasons';

const NET_DEPOSITS = 10_000;
const OVERVIEW_VALUE = 10_336.88;
const WEEK_CHANGE = 124.44;
const WEEK_RETURN = 1.2;
const HOLDINGS_VALUE = 10_434.73;
const HOLDINGS_PNL = 541.1;
const HOLDINGS_RETURN = 5.47;

type Position = {
  id: string;
  name: string;
  target: number;
  actual: number;
  value: number;
  pnl: number;
  pnlPct: number;
  color: string;
  sector: string;
};

const POSITIONS: Position[] = [
  { id: 'TGT', name: 'Target', target: 25, actual: 23.65, value: 2468.32, pnl: 29.78, pnlPct: 1.22, color: '#ff4d4d', sector: 'Retail' },
  { id: 'V', name: 'Visa', target: 25, actual: 26.56, value: 2771.93, pnl: 267.25, pnlPct: 10.67, color: '#3b82f6', sector: 'Payments' },
  { id: 'PFE', name: 'Pfizer', target: 20, actual: 19.83, value: 2069.59, pnl: 156.71, pnlPct: 8.19, color: '#22d3ee', sector: 'Healthcare' },
  { id: 'LMT', name: 'Lockheed Martin', target: 15, actual: 15.49, value: 1616.77, pnl: 89.9, pnlPct: 5.89, color: '#a855f7', sector: 'Aerospace' },
  { id: 'MC', name: 'LVMH Moet Hennessy Louis Vuitton', target: 15, actual: 14.45, value: 1508.12, pnl: -2.54, pnlPct: 0.17, color: '#d4d4d8', sector: 'Luxury' },
];

const SCENARIOS = [
  {
    id: 'up',
    title: 'Optimistický',
    label: '+12 % až +15 %',
    low: 0.12,
    high: 0.15,
    tone: 'emerald',
    copy: 'Po volbách strach opadne a přijde nákupní vlna. Santa rally vytáhne retail i růstová jména.',
  },
  {
    id: 'base',
    title: 'Reálný',
    label: '+7 % až +10 %',
    low: 0.07,
    high: 0.1,
    tone: 'yellow',
    copy: 'Běžný předvánoční růst s krátkou korekcí hned po volbách. Fundament pěti titulů drží.',
  },
  {
    id: 'down',
    title: 'Pesimistický',
    label: '−2 % až −5 %',
    low: -0.05,
    high: -0.02,
    tone: 'red',
    copy: 'Makrošok. Defenzivní pozice fungují jako tlumič, takže ztráta má strop, ne volný pád.',
  },
];

const toneClass: Record<string, string> = {
  emerald: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/30',
  yellow: 'text-yellow-300 bg-yellow-500/10 border-yellow-500/30',
  red: 'text-red-300 bg-red-500/10 border-red-500/30',
};

function czk(value: number, digits = 2) {
  return `${new Intl.NumberFormat('cs-CZ', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value)} Kč`;
}

function signedCzk(value: number, digits = 2) {
  const core = czk(Math.abs(value), digits);
  if (value > 0) return `+${core}`;
  if (value < 0) return `−${core}`;
  return core;
}

function pct(value: number, digits = 2) {
  return `${new Intl.NumberFormat('cs-CZ', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value)} %`;
}

function SliceTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload?: Position }>;
}) {
  const row = payload?.[0]?.payload;
  if (!active || !row) return null;
  return (
    <div className="bg-[#0a0a0a] border border-white/10 px-3 py-2.5 rounded-xl shadow-2xl">
      <p className="text-white font-bold text-xs tracking-wide flex items-center gap-2">
        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: row.color }} />
        {row.name}
      </p>
      <p className="text-zinc-400 text-[10px] mt-1">{row.sector}</p>
      <p className="text-white text-xs font-mono font-bold mt-2">
        {pct(row.actual)} · {czk(row.value)}
      </p>
    </div>
  );
}

export default function ParentsPie({ onOpenPlan }: { onOpenPlan?: () => void }) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [pinnedIndex, setPinnedIndex] = useState<number | null>(null);
  const activeIndex = hoverIndex ?? pinnedIndex;
  const active = activeIndex != null ? POSITIONS[activeIndex] : null;
  const pinned = pinnedIndex != null ? POSITIONS[pinnedIndex] : null;

  useEffect(() => {
    if (pinnedIndex == null) return;
    document.getElementById('position-detail')?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [pinnedIndex]);

  return (
    <div className="flex flex-col gap-12">
      <section className="flex flex-col gap-8">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="max-w-3xl">
            <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-blue-300 mb-4">
              Pie Parents · rodice@seznam.cz
            </p>
            <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-white leading-[0.95]">
              Koláč rodičů
            </h1>
            <p className="mt-5 text-sm md:text-base text-zinc-400 max-w-2xl leading-relaxed">
              Účet rodice@seznam.cz drží pie Parents. Vklad {czk(NET_DEPOSITS, 0)} je v pěti titulech: Target, Visa, Pfizer, Lockheed Martin a LVMH.
            </p>
          </div>
          {onOpenPlan ? (
            <button
              type="button"
              onClick={onOpenPlan}
              className="shrink-0 text-left border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] rounded-2xl px-5 py-4 transition-colors"
            >
              <span className="block text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Širší plán</span>
              <span className="block text-white font-bold mt-1">Master plán · 40 000 Kč</span>
              <span className="block text-xs text-zinc-500 mt-1">Harmonogram, fáze a scénáře.</span>
            </button>
          ) : (
            <Link
              href="/plan"
              className="shrink-0 text-left border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] rounded-2xl px-5 py-4 transition-colors"
            >
              <span className="block text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Širší plán</span>
              <span className="block text-white font-bold mt-1">Master plán · 40 000 Kč</span>
              <span className="block text-xs text-zinc-500 mt-1">Harmonogram, fáze a scénáře.</span>
            </Link>
          )}
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Stat label="Vklad" value={czk(NET_DEPOSITS, 0)} hint="Čistý vklad" />
          <Stat label="Hodnota" value={czk(HOLDINGS_VALUE)} hint="Pozice v pie" />
          <Stat label="Týden" value={signedCzk(WEEK_CHANGE)} hint={`${pct(WEEK_RETURN, 1)} · přehled ${czk(OVERVIEW_VALUE)}`} />
          <Stat label="Zisk" value={signedCzk(HOLDINGS_PNL)} hint={pct(HOLDINGS_RETURN)} />
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center border border-white/10 rounded-3xl bg-[#050505] p-5 md:p-8">
        <div className="lg:col-span-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Složení pie</p>
            <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">
              {signedCzk(HOLDINGS_PNL)} · {pct(HOLDINGS_RETURN)}
            </span>
          </div>
          <div className="relative h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={POSITIONS}
                  cx="50%"
                  cy="50%"
                  innerRadius={88}
                  outerRadius={124}
                  paddingAngle={4}
                  dataKey="value"
                  stroke="none"
                  onMouseEnter={(_entry, index) => setHoverIndex(index)}
                  onMouseLeave={() => setHoverIndex(null)}
                  onClick={(_entry, index) => setPinnedIndex(index)}
                >
                  {POSITIONS.map((position, index) => {
                    const selected = pinnedIndex === index;
                    const lit = activeIndex === null || activeIndex === index || selected;
                    return (
                    <Cell
                      key={position.id}
                      fill={position.color}
                      fillOpacity={lit ? 1 : 0.22}
                      stroke={selected ? '#ffffff' : 'none'}
                      strokeWidth={selected ? 2 : 0}
                      style={{ cursor: 'pointer' }}
                    />
                    );
                  })}
                </Pie>
                <Tooltip content={<SliceTooltip />} cursor={{ fill: 'transparent' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div data-pie-center className="w-[9.5rem] text-center">
                <span className="block text-[10px] uppercase tracking-[0.22em] text-zinc-500 font-bold">
                  {active ? active.id : 'Parents'}
                </span>
                <span className="block text-sm font-bold text-white mt-1 leading-tight">{active ? active.name : 'Celá pie'}</span>
                <span className="block text-lg font-black text-white font-mono mt-1">
                  {czk(active ? active.value : HOLDINGS_VALUE)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-7 flex flex-col gap-2">
          {POSITIONS.map((position, index) => {
            const on = activeIndex === index;
            const up = position.pnl >= 0;
            return (
              <button
                key={position.id}
                type="button"
                aria-pressed={pinnedIndex === index}
                onMouseEnter={() => setHoverIndex(index)}
                onMouseLeave={() => setHoverIndex(null)}
                onClick={() => setPinnedIndex(index)}
                className={`text-left rounded-2xl border px-4 py-3 transition-colors ${pinnedIndex === index ? 'border-white/70 bg-white/[0.08] shadow-[0_0_0_1px_rgba(255,255,255,0.28)]' : on ? 'border-white/20 bg-white/[0.03]' : 'border-white/5 hover:border-white/15'}`}
              >
                <div className="flex items-center gap-4">
                  <span className="w-1.5 self-stretch rounded-full shrink-0" style={{ backgroundColor: pinnedIndex === index || on || activeIndex === null ? position.color : '#3f3f46' }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1">
                      <span className="text-sm font-bold text-white">{position.name}</span>
                      <span className="text-sm font-mono font-bold text-white">{czk(position.value)}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mt-1">
                      <span className={`uppercase tracking-widest font-bold ${pinnedIndex === index ? 'text-xl text-white tracking-tight' : 'text-[10px] text-zinc-400'}`}>
                        {pinnedIndex === index ? position.id : `${position.id} · ${position.sector}`}
                      </span>
                      {pinnedIndex === index && (
                        <span className="text-[10px] uppercase tracking-widest text-emerald-300 font-bold">{position.sector} · Vybráno</span>
                      )}
                      <span className={`text-[10px] font-mono font-bold ${up ? 'text-emerald-400' : 'text-red-400'}`}>
                        {signedCzk(position.pnl)} ({pct(position.pnlPct)})
                      </span>
                    </div>
                    <span className="block text-[10px] font-mono text-zinc-500 mt-1">
                      cíl {pct(position.target, 0)} · skutečně {pct(position.actual)}
                    </span>
                    <span className="mt-2 block h-1 rounded-full bg-white/5 overflow-hidden">
                      <span className="block h-full rounded-full" style={{ width: `${Math.min(position.actual, 100)}%`, backgroundColor: position.color }} />
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {pinned ? (
        <PositionDetail
          ticker={pinned.id}
          name={pinned.name}
          amount={czk(pinned.value)}
          sector={pinned.sector}
          color={pinned.color}
          body={PARENT_REASON[pinned.id]}
        />
      ) : (
        <PositionPrompt />
      )}

      <section className="flex flex-col gap-5">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-white">Tři scénáře do prosince</h2>
          <p className="text-xs uppercase tracking-widest text-zinc-500 font-bold mt-2">Na vkladu {czk(NET_DEPOSITS, 0)}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {SCENARIOS.map((scenario) => {
            const low = NET_DEPOSITS * scenario.low;
            const high = NET_DEPOSITS * scenario.high;
            const [from, to] = low < high ? [low, high] : [high, low];
            return (
              <article key={scenario.id} className="rounded-3xl border border-white/10 bg-[#050505] p-5 flex flex-col gap-4">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-white font-bold">{scenario.title}</h3>
                  <span className={`text-[10px] font-mono font-bold uppercase tracking-widest px-2 py-1 rounded-full border ${toneClass[scenario.tone]}`}>
                    {scenario.label}
                  </span>
                </div>
                <p className="text-lg font-black text-white font-mono">{signedCzk(from, 0)} až {signedCzk(to, 0)}</p>
                <p className="text-xs text-zinc-400 leading-relaxed">{scenario.copy}</p>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#050505] px-4 py-4">
      <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">{label}</p>
      <p className="text-lg md:text-xl font-black text-white font-mono mt-2">{value}</p>
      {hint && <p className="text-[11px] text-zinc-500 mt-1">{hint}</p>}
    </div>
  );
}
