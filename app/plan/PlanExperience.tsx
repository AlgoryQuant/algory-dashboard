'use client';

import { memo, useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import ParentsPie from './ParentsPie';
import { financeQuote, formatMoney, formatPercent, pieStatusLabel, yahooSymbol, type ParentsPieModel } from './parentsModel';
import { LvmhSwapNote, PositionDetail, PositionPrompt } from './PositionDetail';
import { MASTER_REASON } from './reasons';
import { RefreshCountdown } from './RefreshCountdown';
import { useParentsPie } from './useParentsPie';

const PARENT_EMAIL = 'rodice@seznam.cz';
const MASTER_CAPITAL = 40_000;

type Slice = {
  id: string;
  name: string;
  allocation: number;
  sector: string;
  desc: string;
  color: string;
  logo: string;
};

const SLICES: Slice[] = [
  {
    id: 'NEE',
    name: 'NextEra Energy',
    allocation: 25,
    sector: 'Utility',
    desc: 'Defenziva a dividenda. Největší americká elektrárenská utilita.',
    color: '#3b82f6',
    logo: '⚡',
  },
  {
    id: 'TGT',
    name: 'Target Corp',
    allocation: 25,
    sector: 'Retail',
    desc: 'Vánoční retail. Čtvrtina kapitálu na konec roku.',
    color: '#ef4444',
    logo: '🎯',
  },
  {
    id: 'PFE',
    name: 'Pfizer',
    allocation: 20,
    sector: 'Healthcare',
    desc: 'Zdravotnický štít s širokým portfoliem.',
    color: '#10b981',
    logo: '💊',
  },
  {
    id: 'SYM',
    name: 'Symbotic',
    allocation: 15,
    sector: 'Logistics / AI',
    desc: 'Růstový motor. Robotizace skladů pro vánoční retail.',
    color: '#f59e0b',
    logo: '🤖',
  },
  {
    id: 'MC',
    name: 'LVMH',
    allocation: 15,
    sector: 'Luxury',
    desc: 'Luxusní hotovost. Louis Vuitton, Dior, Tiffany a Sephora.',
    color: '#d4d4d8',
    logo: '👜',
  },
];

const DONUT_INITIAL = { width: 360, height: 320 } as const;

const PHASES = [
  {
    id: 1,
    title: 'Fáze 1 · Září',
    badge: 'Tiché budování',
    amount: 10_000,
    tone: 'blue',
    copy: 'Čtyři týdenní nákupy po 2 500 Kč. Makro zůstává nejisté, expozice se nabírá postupně.',
  },
  {
    id: 2,
    title: 'Fáze 2 · Polovina října',
    badge: 'Snajperský úder',
    amount: 20_000,
    tone: 'red',
    copy: 'Polovina kapitálu čeká na strach. Engine nakupuje, jen když je VIX nad 25, nebo když referenční akcie klesnou o 5–7 %.',
  },
  {
    id: 3,
    title: 'Fáze 3 · Listopad a prosinec',
    badge: 'Relief rally',
    amount: 10_000,
    tone: 'emerald',
    copy: 'Po volbách trh vstřebá výsledek a začíná vánoční růst. Zbylých 10 000 Kč dorovná váhy a připraví take-profit.',
  },
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
    copy: 'Makrošok. NextEra a Pfizer fungují jako tlumič, takže ztráta má strop, ne volný pád.',
  },
];

type Focus = 'plan' | 'pie';

type TooltipRow = {
  id: string;
  name: string;
  sector: string;
  color: string;
  allocation: number;
  valueCzk?: number;
  weight?: number;
  value?: number;
};

const MASTER_PIE: TooltipRow[] = SLICES.map((slice) => ({
  ...slice,
  valueCzk: (MASTER_CAPITAL * slice.allocation) / 100,
}));

function formatCzk(value: number, digits = 0) {
  return `${new Intl.NumberFormat('cs-CZ', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value)} Kč`;
}

function formatSignedCzk(value: number) {
  const core = formatCzk(Math.abs(value), 0);
  if (value > 0) return `+${core}`;
  if (value < 0) return `−${core}`;
  return core;
}

function currentPhase(now = new Date()) {
  const t = now.getTime();
  if (t < Date.parse('2026-10-01T00:00:00Z')) return 1;
  if (t < Date.parse('2026-11-01T00:00:00Z')) return 2;
  if (t < Date.parse('2026-12-15T00:00:00Z')) return 3;
  return 4;
}

function phaseStatus(id: number, active: number) {
  if (active >= 4 || id < active) return 'Hotovo';
  if (id === active) return 'Právě teď';
  return 'Čeká';
}

function SliceTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload?: TooltipRow }>;
}) {
  const row = payload?.[0]?.payload;
  if (!active || !row) return null;
  const amount = row.value ?? row.valueCzk;
  const weight = row.weight ?? row.allocation;
  return (
    <div className="bg-[#0a0a0a] border border-white/10 px-3 py-2.5 rounded-xl shadow-2xl">
      <p className="text-white font-bold text-xs tracking-wide flex items-center gap-2">
        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: row.color }} />
        {row.id}
      </p>
      <p className="text-zinc-400 text-[10px] mt-1">{row.sector}</p>
      <p className="text-white text-xs font-mono font-bold mt-2">
        {weight.toFixed(weight % 1 === 0 ? 0 : 1)} %{amount != null ? ` · ${formatCzk(amount, 0)}` : ''}
      </p>
    </div>
  );
}

const Donut = memo(function Donut({
  data,
  dataKey,
  activeIndex,
  pinnedIndex,
  onHover,
  onSelect,
  centerLabel,
  centerValue,
}: {
  data: TooltipRow[];
  dataKey: 'allocation' | 'weight';
  activeIndex: number | null;
  pinnedIndex: number | null;
  onHover: (index: number | null) => void;
  onSelect: (index: number) => void;
  centerLabel: string;
  centerValue: string;
}) {
  return (
    <div className="relative h-[320px] w-full">
      <ResponsiveContainer width="100%" height={320} debounce={120} initialDimension={DONUT_INITIAL}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={88}
            outerRadius={124}
            paddingAngle={4}
            dataKey={dataKey}
            stroke="none"
            isAnimationActive={false}
            onMouseEnter={(_entry, index) => onHover(index)}
            onMouseLeave={() => onHover(null)}
            onClick={(_entry, index) => onSelect(index)}
          >
            {data.map((entry, index) => {
              const selected = pinnedIndex === index;
              const lit = activeIndex === null || activeIndex === index || selected;
              return (
                <Cell
                  key={entry.id}
                  fill={entry.color}
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
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="text-[10px] uppercase tracking-[0.22em] text-zinc-500 font-bold">{centerLabel}</span>
        <span className="text-xl font-black text-white font-mono mt-1 text-center px-16">{centerValue}</span>
      </div>
    </div>
  );
});

const toneClass: Record<string, string> = {
  blue: 'text-blue-300 bg-blue-500/10 border-blue-500/30',
  red: 'text-red-300 bg-red-500/10 border-red-500/30',
  emerald: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/30',
  yellow: 'text-yellow-300 bg-yellow-500/10 border-yellow-500/30',
};

export default function PlanExperience({ clerkEnabled = false }: { clerkEnabled?: boolean }) {
  if (!clerkEnabled) {
    return <PlanExperienceContent isParent={false} />;
  }
  return <PlanExperienceSignedIn />;
}

function PlanExperienceSignedIn() {
  const { isLoaded, user } = useUser();
  const email = user?.primaryEmailAddress?.emailAddress;
  const isParent = Boolean(isLoaded && email === PARENT_EMAIL);
  return <PlanExperienceContent isParent={isParent} />;
}

function PlanExperienceContent({ isParent }: { isParent: boolean }) {
  const params = useSearchParams();
  const requested = params.get('fokus');

  const [focus, setFocus] = useState<Focus>(requested === 'pie' ? 'pie' : 'plan');
  const userChoseFocus = useRef(false);
  const appliedFokus = useRef(requested);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [pinnedIndex, setPinnedIndex] = useState<number | null>(null);

  useEffect(() => {
    if (requested === 'pie' || requested === 'plan') {
      if (appliedFokus.current !== requested) {
        appliedFokus.current = requested;
        userChoseFocus.current = false;
        setFocus(requested);
      }
      return;
    }
    appliedFokus.current = requested;
    if (isParent && !userChoseFocus.current) setFocus('pie');
  }, [requested, isParent]);

  useEffect(() => {
    if (focus !== 'plan' || pinnedIndex == null) return;
    document.getElementById('position-detail')?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [focus, pinnedIndex]);

  const phase = currentPhase();
  const parents = useParentsPie();
  const activeIndex = hoverIndex ?? pinnedIndex;
  const activeSlice = activeIndex != null ? SLICES[activeIndex] : null;

  const openFocus = useCallback((next: Focus) => {
    userChoseFocus.current = true;
    setFocus(next);
    setHoverIndex(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const openPie = useCallback(() => openFocus('pie'), [openFocus]);
  const openPlan = useCallback(() => openFocus('plan'), [openFocus]);

  return (
    <div className="min-h-[100dvh] w-full bg-black text-zinc-200 font-sans selection:bg-zinc-800">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-black/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-5 lg:px-8 py-4 flex items-center gap-3 sm:gap-4 pr-20 lg:pr-36">
          <Link href="/dashboard" className="text-xl font-black tracking-tighter text-white shrink-0">
            Algory<span className="text-emerald-500">.</span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-3 ml-auto min-w-0">
            <div className="flex bg-white/5 border border-white/10 rounded-full p-1 shrink-0">
              <button
                type="button"
                aria-pressed={focus === 'plan'}
                onClick={() => openFocus('plan')}
                className={`px-3 sm:px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-colors ${focus === 'plan' ? 'bg-white text-black' : 'text-zinc-400 hover:text-white'}`}
              >
                Master plán
              </button>
              <button
                type="button"
                aria-pressed={focus === 'pie'}
                onClick={() => openFocus('pie')}
                className={`px-3 sm:px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-colors ${focus === 'pie' ? 'bg-white text-black' : 'text-zinc-400 hover:text-white'}`}
              >
                Koláč rodičů
              </button>
            </div>
            <RefreshCountdown nextAt={parents.nextAt} ready={parents.ready} />
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-5 lg:px-8 py-10 lg:py-14 flex flex-col gap-12">
        {focus === 'plan' ? (
          <PlanView
            phase={phase}
            activeIndex={activeIndex}
            activeSlice={activeSlice}
            masterPie={MASTER_PIE}
            pinnedIndex={pinnedIndex}
            onHover={setHoverIndex}
            onPin={setPinnedIndex}
            onOpenPie={openPie}
            parents={parents.model}
          />
        ) : (
          <ParentsPie model={parents.model} ready={parents.ready} onOpenPlan={openPlan} />
        )}
      </main>
    </div>
  );
}

function PlanView({
  phase,
  activeIndex,
  pinnedIndex,
  activeSlice,
  masterPie,
  onHover,
  onPin,
  onOpenPie,
  parents,
}: {
  phase: number;
  activeIndex: number | null;
  pinnedIndex: number | null;
  activeSlice: Slice | null;
  masterPie: TooltipRow[];
  onHover: (index: number | null) => void;
  onPin: (index: number) => void;
  onOpenPie: () => void;
  parents: ParentsPieModel | null;
}) {
  const parentsReady = parents != null;
  const depositDigits = parentsReady && Number.isInteger(parents.deposits) ? 0 : 2;
  const parentsDeposit = parentsReady ? formatMoney(parents.deposits, parents.currency, depositDigits) : '…';
  const parentsValue = parentsReady ? formatMoney(parents.holdingsValue, parents.currency) : 'Načítám…';
  return (
    <>
      <section className="flex flex-col gap-8">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="max-w-3xl">
            <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-emerald-400 mb-4">Q4 2026 · pět titulů</p>
            <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-white leading-[0.95]">
              Q4 Master Plan
            </h1>
            <p className="mt-5 text-sm md:text-base text-zinc-400 max-w-2xl leading-relaxed">
              40 000 Kč v pěti titulech: NextEra a Pfizer drží defenzivu, Target vánoční retail, Symbotic skladovou robotiku a LVMH luxusní hotovost. Take-profit je v polovině prosince 2026, ještě před tím, než sezóna vychladne.
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenPie}
            className="shrink-0 text-left border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] rounded-2xl px-5 py-4 transition-colors"
          >
            <span className="block text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Přístup pro rodiče</span>
            <span className="block text-white font-bold mt-1">
              {parentsReady ? `Parents · vklad ${parentsDeposit}` : 'Parents · načítám pie…'}
            </span>
            <span className="block text-xs text-zinc-500 mt-1">Target, Visa, Pfizer, Lockheed, LVMH.</span>
          </button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Stat label="Celkový kapitál" value={formatCzk(MASTER_CAPITAL)} />
          <Stat label="Aktivní fáze" value={phase >= 4 ? 'Take-profit' : `Fáze ${phase}`} />
          <Stat label="Take-profit" value="15. 12. 2026" />
          <Stat
            label="Pie Parents"
            value={parentsValue}
            hint={
              !parentsReady
                ? 'Načítám pie…'
                : parents.source === 'snapshot'
                  ? `${pieStatusLabel(parents)} · ${formatPercent(parents.holdingsReturn)}`
                  : `${parents.depositHint} ${parentsDeposit} · ${formatPercent(parents.holdingsReturn)}`
            }
          />
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center border border-white/10 rounded-3xl bg-[#050505] p-5 md:p-8">
        <div className="lg:col-span-5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2">Distribuční model</p>
          <Donut
            data={masterPie}
            dataKey="allocation"
            activeIndex={activeIndex}
            pinnedIndex={pinnedIndex}
            onHover={onHover}
            onSelect={onPin}
            centerLabel={activeSlice ? activeSlice.id : 'Kapitál'}
            centerValue={activeSlice ? formatCzk((MASTER_CAPITAL * activeSlice.allocation) / 100) : formatCzk(MASTER_CAPITAL)}
          />
        </div>
        <div className="lg:col-span-7 flex flex-col gap-2">
          {SLICES.map((slice, index) => {
            const amount = (MASTER_CAPITAL * slice.allocation) / 100;
            const on = activeIndex === index;
            return (
              <button
                key={slice.id}
                type="button"
                onMouseEnter={() => onHover(index)}
                onMouseLeave={() => onHover(null)}
                aria-pressed={pinnedIndex === index}
                onClick={() => onPin(index)}
                className={`text-left rounded-2xl border px-4 py-3 transition-colors ${pinnedIndex === index ? 'border-white/70 bg-white/[0.08] shadow-[0_0_0_1px_rgba(255,255,255,0.28)]' : on ? 'border-white/20 bg-white/[0.03]' : 'border-white/5 hover:border-white/15'}`}
              >
                <div className="flex items-center gap-4">
                  <span className="w-1.5 h-10 rounded-full" style={{ backgroundColor: pinnedIndex === index || on || activeIndex === null ? slice.color : '#3f3f46' }} />
                  <div className="min-w-[92px]">
                    <span className={`block font-black text-white ${pinnedIndex === index ? 'text-2xl tracking-tight leading-none' : 'text-sm font-bold'}`}>{slice.id}</span>
                    {pinnedIndex === index && <span className="block text-[10px] uppercase tracking-widest text-emerald-300 font-bold mt-1">Vybráno</span>}
                    <span className="block text-[10px] font-mono text-zinc-500">{slice.allocation} % · {formatCzk(amount)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="block text-[10px] uppercase tracking-widest text-zinc-400 font-bold">{slice.sector}</span>
                    <span className="block text-xs text-zinc-500 mt-1 leading-relaxed">{slice.desc}</span>
                    <span className="mt-2 block h-1 rounded-full bg-white/5 overflow-hidden">
                      <span className="block h-full rounded-full" style={{ width: `${slice.allocation * 4}%`, backgroundColor: slice.color }} />
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {pinnedIndex != null && SLICES[pinnedIndex] ? (
        <PositionDetail
          ticker={SLICES[pinnedIndex].id === 'MC' ? 'MC.PA' : SLICES[pinnedIndex].id}
          name={SLICES[pinnedIndex].name}
          amount={formatCzk((MASTER_CAPITAL * SLICES[pinnedIndex].allocation) / 100)}
          sector={SLICES[pinnedIndex].sector}
          color={SLICES[pinnedIndex].color}
          weight={`${SLICES[pinnedIndex].allocation} %`}
          quote={financeQuote(SLICES[pinnedIndex].id)}
          chartSymbol={yahooSymbol(SLICES[pinnedIndex].id)}
          body={MASTER_REASON[SLICES[pinnedIndex].id]}
        />
      ) : (
        <PositionPrompt />
      )}

      <LvmhSwapNote />

      <section className="flex flex-col gap-5">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-white">Architektura exekuce</h2>
          <p className="text-xs uppercase tracking-widest text-zinc-500 font-bold mt-2">Tři tranše, jeden koláč</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {PHASES.map((item) => {
            const status = phaseStatus(item.id, phase);
            const live = status === 'Právě teď';
            return (
              <article key={item.id} className={`rounded-3xl border p-5 flex flex-col gap-4 bg-[#050505] ${live ? 'border-white/30' : 'border-white/10'}`}>
                <div className="flex items-center justify-between gap-3">
                  <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full border ${toneClass[item.tone]}`}>{item.badge}</span>
                  <span className={`text-[10px] font-bold uppercase tracking-widest ${live ? 'text-white' : 'text-zinc-500'}`}>{status}</span>
                </div>
                <div>
                  <h3 className="text-white font-bold">{item.title}</h3>
                  <p className="text-2xl font-black text-white font-mono mt-2">{formatCzk(item.amount)}</p>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">{item.copy}</p>
              </article>
            );
          })}
        </div>
      </section>

      <ScenarioGrid capital={MASTER_CAPITAL} caption="Na celých 40 000 Kč" />
    </>
  );
}

function ScenarioGrid({ capital, caption }: { capital: number; caption: string }) {
  return (
    <section className="flex flex-col gap-5">
      <div>
        <h2 className="text-2xl font-black tracking-tight text-white">Tři scénáře do prosince</h2>
        <p className="text-xs uppercase tracking-widest text-zinc-500 font-bold mt-2">{caption}</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {SCENARIOS.map((scenario) => {
          const low = capital * scenario.low;
          const high = capital * scenario.high;
          const [from, to] = low < high ? [low, high] : [high, low];
          return (
            <article key={scenario.id} className="rounded-3xl border border-white/10 bg-[#050505] p-5 flex flex-col gap-4">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-white font-bold">{scenario.title}</h3>
                <span className={`text-[10px] font-mono font-bold uppercase tracking-widest px-2 py-1 rounded-full border ${toneClass[scenario.tone]}`}>
                  {scenario.label}
                </span>
              </div>
              <p className="text-lg font-black text-white font-mono">{formatSignedCzk(from)} až {formatSignedCzk(to)}</p>
              <p className="text-xs text-zinc-400 leading-relaxed">{scenario.copy}</p>
            </article>
          );
        })}
      </div>
    </section>
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
