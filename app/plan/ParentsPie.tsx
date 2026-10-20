'use client';

import { memo, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { PositionDetail, PositionPrompt } from './PositionDetail';
import { displayTicker, financeQuote, formatMoney, formatPercent, formatSignedMoney, pieStatusLabel, yahooSymbol, type ParentsPieModel, type ParentsPosition } from './parentsModel';
import { PARENT_REASON } from './reasons';
import { useParentsPie } from './useParentsPie';

type Position = ParentsPosition;

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

const PIE_INITIAL = { width: 360, height: 320 } as const;

function moneyDigits(value: number) {
  return Number.isInteger(value) ? 0 : 2;
}

function SliceTooltip({
  active,
  payload,
  currency,
}: {
  active?: boolean;
  payload?: ReadonlyArray<{ payload?: Position }>;
  currency: string;
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
        {formatPercent(row.actual)} · {formatMoney(row.value, currency)}
      </p>
    </div>
  );
}

/** Isolated Recharts tree — avoids remounting when unrelated ParentsPie state updates. */
const ParentsDonut = memo(function ParentsDonut({
  positions,
  currency,
  holdingsValue,
  pieName,
  activeIndex,
  pinnedIndex,
  onHover,
  onSelect,
}: {
  positions: Position[];
  currency: string;
  holdingsValue: number;
  pieName: string;
  activeIndex: number | null;
  pinnedIndex: number | null;
  onHover: (index: number | null) => void;
  onSelect: (index: number) => void;
}) {
  const active = activeIndex != null ? positions[activeIndex] : null;
  const tooltipContent = useCallback(
    (props: { active?: boolean; payload?: ReadonlyArray<{ payload?: Position }> }) => (
      <SliceTooltip active={props.active} payload={props.payload} currency={currency} />
    ),
    [currency],
  );

  return (
    <div className="relative h-[320px] w-full">
      <ResponsiveContainer width="100%" height={320} debounce={120} initialDimension={PIE_INITIAL}>
        <PieChart>
          <Pie
            data={positions}
            cx="50%"
            cy="50%"
            innerRadius={88}
            outerRadius={124}
            paddingAngle={4}
            dataKey="value"
            stroke="none"
            isAnimationActive={false}
            onMouseEnter={(_entry, index) => onHover(index)}
            onMouseLeave={() => onHover(null)}
            onClick={(_entry, index) => onSelect(index)}
          >
            {positions.map((position, index) => {
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
          <Tooltip content={tooltipContent} cursor={{ fill: 'transparent' }} />
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div data-pie-center className="w-[9.5rem] text-center">
          <span className="block text-[10px] uppercase tracking-[0.22em] text-zinc-500 font-bold">
            {active ? active.id : pieName}
          </span>
          <span className="block text-sm font-bold text-white mt-1 leading-tight">{active ? active.name : 'Celá pie'}</span>
          <span data-holdings-value className="block text-lg font-black text-white font-mono mt-1">
            {formatMoney(active ? active.value : holdingsValue, currency)}
          </span>
        </div>
      </div>
    </div>
  );
});

export default function ParentsPie({
  onOpenPlan,
  model: modelProp,
  ready: readyProp,
}: {
  onOpenPlan?: () => void;
  model?: ParentsPieModel;
  ready?: boolean;
}) {
  const fetched = useParentsPie(modelProp == null);
  const model = modelProp ?? fetched.model;
  const ready = modelProp == null ? fetched.ready : (readyProp ?? true);
  const positions = model.positions;
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [pinnedIndex, setPinnedIndex] = useState<number | null>(null);
  const activeIndex = hoverIndex ?? pinnedIndex;
  const pinned = pinnedIndex != null ? positions[pinnedIndex] : null;
  const depositDigits = moneyDigits(model.deposits);
  const weekKnown = model.weekChange != null && model.weekReturn != null;

  const onHover = useCallback((index: number | null) => setHoverIndex(index), []);
  const onSelect = useCallback((index: number) => setPinnedIndex(index), []);

  useEffect(() => {
    if (pinnedIndex == null) return;
    document.getElementById('position-detail')?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [pinnedIndex]);

  return (
    <div className="flex flex-col gap-12" data-pie-source={ready ? model.source : 'loading'} data-pie-name={model.pieName}>
      <section className="flex flex-col gap-8">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="max-w-3xl">
            <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-blue-300 mb-4">
              Pie {model.pieName} · rodice@seznam.cz
            </p>
            <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-white leading-[0.95]">
              Koláč rodičů
            </h1>
            <p data-pie-status data-pie-fallback={ready ? model.fallback : 'loading'} className={`mt-3 text-xs font-bold tracking-wide ${ready && model.source !== 'snapshot' ? 'text-emerald-300' : 'text-zinc-400'}`}>
              {ready ? pieStatusLabel(model) : 'Načítám pie…'}
            </p>
            <p className="mt-5 text-sm md:text-base text-zinc-400 max-w-2xl leading-relaxed">
              Účet rodice@seznam.cz drží pie {model.pieName}. Vklad {formatMoney(model.deposits, model.currency, depositDigits)} je v pěti titulech: Target, Visa, Pfizer, Lockheed Martin a LVMH.
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
          <Stat label="Vklad" value={formatMoney(model.deposits, model.currency, depositDigits)} hint={model.depositHint} />
          <Stat label="Hodnota" value={formatMoney(model.holdingsValue, model.currency)} hint={model.source === 'snapshot' ? 'Pozice v pie' : `Pozice v pie · ${model.currency}`} />
          {weekKnown ? (
            <Stat label="Týden" value={formatSignedMoney(model.weekChange ?? 0, model.currency)} hint={`${formatPercent(model.weekReturn ?? 0, 1)} · přehled ${formatMoney(model.overviewValue, model.currency)}`} />
          ) : (
            <Stat
              label="Účet"
              value={formatMoney(model.overviewValue, model.currency)}
              hint={model.cashAvailable != null ? `hotovost ${formatMoney(model.cashAvailable, model.currency, moneyDigits(model.cashAvailable))} · ${model.currency}` : model.currency}
            />
          )}
          <Stat label="Zisk" value={formatSignedMoney(model.holdingsPnl, model.currency)} hint={formatPercent(model.holdingsReturn)} />
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center border border-white/10 rounded-3xl bg-[#050505] p-5 md:p-8">
        <div className="lg:col-span-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Složení pie</p>
            <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">
              {formatSignedMoney(model.holdingsPnl, model.currency)} · {formatPercent(model.holdingsReturn)}
            </span>
          </div>
          <ParentsDonut
            positions={positions}
            currency={model.currency}
            holdingsValue={model.holdingsValue}
            pieName={model.pieName}
            activeIndex={activeIndex}
            pinnedIndex={pinnedIndex}
            onHover={onHover}
            onSelect={onSelect}
          />
        </div>

        <div className="lg:col-span-7 flex flex-col gap-2">
          {positions.map((position, index) => {
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
                      <span className="text-sm font-mono font-bold text-white">{formatMoney(position.value, model.currency)}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mt-1">
                      <span className={`uppercase tracking-widest font-bold ${pinnedIndex === index ? 'text-xl text-white tracking-tight' : 'text-[10px] text-zinc-400'}`}>
                        {pinnedIndex === index ? position.id : `${position.id} · ${position.sector}`}
                      </span>
                      {pinnedIndex === index && (
                        <span className="text-[10px] uppercase tracking-widest text-emerald-300 font-bold">{position.sector} · Vybráno</span>
                      )}
                      <span className={`text-[10px] font-mono font-bold ${up ? 'text-emerald-400' : 'text-red-400'}`}>
                        {formatSignedMoney(position.pnl, model.currency)} ({formatPercent(position.pnlPct)})
                      </span>
                    </div>
                    <span className="block text-[10px] font-mono text-zinc-500 mt-1">
                      cíl {formatPercent(position.target, Number.isInteger(position.target) ? 0 : 2)} · skutečně {formatPercent(position.actual)}
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
          ticker={displayTicker(pinned.id)}
          name={pinned.name}
          amount={formatMoney(pinned.value, model.currency)}
          sector={pinned.sector}
          color={pinned.color}
          weight={formatPercent(pinned.actual)}
          quote={financeQuote(pinned.id)}
          pnl={`${formatSignedMoney(pinned.pnl, model.currency)} (${formatPercent(pinned.pnlPct)})`}
          chartSymbol={yahooSymbol(pinned.id)}
          body={PARENT_REASON[pinned.id] ?? 'Titul je v koláči rodičů. Částka a váha jsou z účtu Trading 212.'}
        />
      ) : (
        <PositionPrompt />
      )}

      <section className="flex flex-col gap-5">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-white">Tři scénáře do prosince</h2>
          <p className="text-xs uppercase tracking-widest text-zinc-500 font-bold mt-2">Na vkladu {formatMoney(model.deposits, model.currency, depositDigits)}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {SCENARIOS.map((scenario) => {
            const low = model.deposits * scenario.low;
            const high = model.deposits * scenario.high;
            const [from, to] = low < high ? [low, high] : [high, low];
            return (
              <article key={scenario.id} className="rounded-3xl border border-white/10 bg-[#050505] p-5 flex flex-col gap-4">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-white font-bold">{scenario.title}</h3>
                  <span className={`text-[10px] font-mono font-bold uppercase tracking-widest px-2 py-1 rounded-full border ${toneClass[scenario.tone]}`}>
                    {scenario.label}
                  </span>
                </div>
                <p className="text-lg font-black text-white font-mono">{formatSignedMoney(from, model.currency, 0)} až {formatSignedMoney(to, model.currency, 0)}</p>
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
