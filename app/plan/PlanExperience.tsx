'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

const PARENT_EMAIL = 'rodice@seznam.cz';
const MASTER_CAPITAL = 40_000;
const PARENT_CAPITAL = 2_500;

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
    desc: 'Stabilní defenziva a zelená energie. Nižší sazby Fedu jí svědčí, dividenda drží pozici v klidu.',
    color: '#3b82f6',
    logo: '⚡',
  },
  {
    id: 'TGT',
    name: 'Target Corp',
    allocation: 25,
    sector: 'Retail',
    desc: 'Vánoční sezóna a přesun zákazníků k dostupnějšímu zboží. Hlavní sázka na konec roku.',
    color: '#ef4444',
    logo: '🎯',
  },
  {
    id: 'PFE',
    name: 'Pfizer',
    allocation: 20,
    sector: 'Healthcare',
    desc: 'Defenzivní štít. Zdravotnictví drží portfoliu záda, když zbytek trhu couvá.',
    color: '#10b981',
    logo: '💊',
  },
  {
    id: 'SYM',
    name: 'Symbotic',
    allocation: 15,
    sector: 'Logistics / AI',
    desc: 'Růstový motor. Robotizace skladů jede právě ve čtvrtletí, kdy retail plní regály.',
    color: '#f59e0b',
    logo: '🤖',
  },
  {
    id: 'NVO',
    name: 'Novo Nordisk',
    allocation: 15,
    sector: 'Pharma',
    desc: 'Poptávka po lécích na hubnutí drží Novo v roli monopolního růstového jména.',
    color: '#8b5cf6',
    logo: '🧬',
  },
];

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

type Quote = { price: number; prevClose: number; changePercent: number };
type MarketData = Record<string, Quote>;
type Focus = 'plan' | 'pie';

type Holding = Slice & {
  invested: number;
  value: number;
  change: number;
  changePct: number;
  price: number | null;
  live: boolean;
  weight: number;
};

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

function parentBook(market: MarketData | null) {
  const rate = market?.['CZK=X'];
  const rows: Holding[] = SLICES.map((slice) => {
    const invested = (PARENT_CAPITAL * slice.allocation) / 100;
    const quote = market?.[slice.id];
    const priced = Boolean(rate && rate.price > 0 && quote && quote.prevClose > 0 && quote.price > 0);
    if (!priced || !rate || !quote) {
      return {
        ...slice,
        invested,
        value: invested,
        change: 0,
        changePct: quote?.changePercent ?? 0,
        price: quote?.price ?? null,
        live: false,
        weight: slice.allocation,
      };
    }
    const shares = invested / rate.price / quote.prevClose;
    const value = shares * quote.price * rate.price;
    const previous = shares * quote.prevClose * rate.price;
    return {
      ...slice,
      invested,
      value,
      change: value - previous,
      changePct: previous > 0 ? ((value - previous) / previous) * 100 : 0,
      price: quote.price,
      live: true,
      weight: 0,
    };
  });
  const nav = rows.reduce((sum, row) => sum + row.value, 0);
  const live = rows.every((row) => row.live) && nav > 0;
  return {
    live,
    nav,
    pnl: nav - PARENT_CAPITAL,
    rows: rows.map((row) => ({
      ...row,
      weight: nav > 0 ? (row.value / nav) * 100 : row.allocation,
    })),
  };
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

function Donut({
  data,
  dataKey,
  activeIndex,
  onHover,
  centerLabel,
  centerValue,
}: {
  data: TooltipRow[];
  dataKey: 'allocation' | 'weight';
  activeIndex: number | null;
  onHover: (index: number | null) => void;
  centerLabel: string;
  centerValue: string;
}) {
  return (
    <div className="relative h-[320px] w-full">
      <ResponsiveContainer width="100%" height="100%">
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
            onMouseEnter={(_entry, index) => onHover(index)}
            onMouseLeave={() => onHover(null)}
          >
            {data.map((entry, index) => (
              <Cell
                key={entry.id}
                fill={entry.color}
                fillOpacity={activeIndex === null || activeIndex === index ? 1 : 0.22}
                stroke="none"
              />
            ))}
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
}

const toneClass: Record<string, string> = {
  blue: 'text-blue-300 bg-blue-500/10 border-blue-500/30',
  red: 'text-red-300 bg-red-500/10 border-red-500/30',
  emerald: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/30',
  yellow: 'text-yellow-300 bg-yellow-500/10 border-yellow-500/30',
};

export default function PlanExperience() {
  const params = useSearchParams();
  const requested = params.get('fokus');
  const { isLoaded, user } = useUser();
  const email = user?.primaryEmailAddress?.emailAddress;
  const isParent = isLoaded && email === PARENT_EMAIL;

  const [focus, setFocus] = useState<Focus>(requested === 'pie' ? 'pie' : 'plan');
  const userChoseFocus = useRef(false);
  const appliedFokus = useRef(requested);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [pinnedIndex, setPinnedIndex] = useState<number | null>(0);
  const [market, setMarket] = useState<MarketData | null>(null);
  const [quoteState, setQuoteState] = useState<'loading' | 'live' | 'offline'>('loading');

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
    let alive = true;
    const load = async () => {
      try {
        const res = await fetch('/api/welcome');
        if (!res.ok) throw new Error('quote');
        const data = (await res.json()) as MarketData;
        if (!alive) return;
        if (!data['CZK=X']) throw new Error('fx');
        setMarket(data);
        setQuoteState('live');
      } catch {
        if (alive) setQuoteState('offline');
      }
    };
    load();
    const timer = setInterval(load, 60_000);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, []);

  const phase = currentPhase();
  const book = useMemo(() => parentBook(market), [market]);
  const activeIndex = hoverIndex ?? pinnedIndex;
  const activeSlice = activeIndex != null ? SLICES[activeIndex] : null;
  const activeHolding = activeIndex != null ? book.rows[activeIndex] : null;

  const openFocus = (next: Focus) => {
    userChoseFocus.current = true;
    setFocus(next);
    setHoverIndex(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const masterPie: TooltipRow[] = SLICES.map((slice) => ({
    ...slice,
    valueCzk: (MASTER_CAPITAL * slice.allocation) / 100,
  }));
  const parentPie: TooltipRow[] = book.rows.map((row) => ({
    ...row,
    valueCzk: row.value,
    value: row.value,
  }));
  return (
    <div className="min-h-[100dvh] w-full bg-black text-zinc-200 font-sans selection:bg-zinc-800">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-black/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-5 lg:px-8 py-4 flex items-center gap-4 pr-24 lg:pr-36">
          <Link href="/dashboard" className="text-xl font-black tracking-tighter text-white shrink-0">
            Algory<span className="text-emerald-500">.</span>
          </Link>
          <div className="flex bg-white/5 border border-white/10 rounded-full p-1 ml-auto sm:ml-6">
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
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-5 lg:px-8 py-10 lg:py-14 flex flex-col gap-12">
        {focus === 'plan' ? (
          <PlanView
            phase={phase}
            activeIndex={activeIndex}
            activeSlice={activeSlice}
            masterPie={masterPie}
            onHover={setHoverIndex}
            onPin={setPinnedIndex}
            onOpenPie={() => openFocus('pie')}
          />
        ) : (
          <PieView
            isParent={Boolean(isParent)}
            quoteState={quoteState}
            book={book}
            activeIndex={activeIndex}
            activeHolding={activeHolding}
            parentPie={parentPie}
            onHover={setHoverIndex}
            onPin={setPinnedIndex}
            onOpenPlan={() => openFocus('plan')}
          />
        )}
      </main>
    </div>
  );
}

function PlanView({
  phase,
  activeIndex,
  activeSlice,
  masterPie,
  onHover,
  onPin,
  onOpenPie,
}: {
  phase: number;
  activeIndex: number | null;
  activeSlice: Slice | null;
  masterPie: TooltipRow[];
  onHover: (index: number | null) => void;
  onPin: (index: number) => void;
  onOpenPie: () => void;
}) {
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
              40 000 Kč rozdělených do defenzivy, vánočního retailu a dvou růstových jmen. Take-profit je v polovině prosince 2026, ještě před tím, než sezóna vychladne.
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenPie}
            className="shrink-0 text-left border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] rounded-2xl px-5 py-4 transition-colors"
          >
            <span className="block text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Přístup pro rodiče</span>
            <span className="block text-white font-bold mt-1">Jejich koláč · 2 500 Kč</span>
            <span className="block text-xs text-zinc-500 mt-1">Stejné váhy, první tranše plánu.</span>
          </button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Stat label="Celkový kapitál" value={formatCzk(MASTER_CAPITAL)} />
          <Stat label="Aktivní fáze" value={phase >= 4 ? 'Take-profit' : `Fáze ${phase}`} />
          <Stat label="Take-profit" value="15. 12. 2026" />
          <Stat label="Rodičovský podíl" value="6,25 %" hint="2 500 z 40 000 Kč" />
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center border border-white/10 rounded-3xl bg-[#050505] p-5 md:p-8">
        <div className="lg:col-span-5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2">Distribuční model</p>
          <Donut
            data={masterPie}
            dataKey="allocation"
            activeIndex={activeIndex}
            onHover={onHover}
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
                onClick={() => onPin(index)}
                className={`text-left rounded-2xl border px-4 py-3 transition-colors ${on ? 'border-white/25 bg-white/[0.04]' : 'border-white/5 hover:border-white/15'}`}
              >
                <div className="flex items-center gap-4">
                  <span className="w-1.5 h-10 rounded-full" style={{ backgroundColor: on || activeIndex === null ? slice.color : '#3f3f46' }} />
                  <div className="min-w-[92px]">
                    <span className="block text-sm font-bold text-white">{slice.id}</span>
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

function PieView({
  isParent,
  quoteState,
  book,
  activeIndex,
  activeHolding,
  parentPie,
  onHover,
  onPin,
  onOpenPlan,
}: {
  isParent: boolean;
  quoteState: 'loading' | 'live' | 'offline';
  book: ReturnType<typeof parentBook>;
  activeIndex: number | null;
  activeHolding: Holding | null;
  parentPie: TooltipRow[];
  onHover: (index: number | null) => void;
  onPin: (index: number) => void;
  onOpenPlan: () => void;
}) {
  const up = book.pnl >= 0;
  return (
    <>
      <section className="flex flex-col gap-8">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="max-w-3xl">
            <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-blue-300 mb-4">
              {isParent ? 'Přihlášeni jako rodiče' : 'Rodičovský přístup'}
            </p>
            <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-white leading-[0.95]">
              Váš Q4 koláč
            </h1>
            <p className="mt-5 text-sm md:text-base text-zinc-400 max-w-2xl leading-relaxed">
              Účet {PARENT_EMAIL} drží 2 500 Kč ve stejných pěti titulech jako master plán. Je to první týdenní tranše, jen ve vašem měřítku.
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenPlan}
            className="shrink-0 text-left border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] rounded-2xl px-5 py-4 transition-colors"
          >
            <span className="block text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Širší plán</span>
            <span className="block text-white font-bold mt-1">Master plán · 40 000 Kč</span>
            <span className="block text-xs text-zinc-500 mt-1">Harmonogram, fáze a scénáře.</span>
          </button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Stat label="Nasazeno" value={formatCzk(PARENT_CAPITAL)} />
          <Stat
            label={book.live ? 'Hodnota teď' : 'Cílová hodnota'}
            value={formatCzk(book.nav, book.live ? 0 : 0)}
            hint={book.live ? formatSignedCzk(book.pnl) : 'Čeká na živé ceny'}
          />
          <Stat label="Tituly" value="5" hint="NEE · TGT · PFE · SYM · NVO" />
          <Stat
            label="Ceny"
            value={quoteState === 'live' ? 'Živě' : quoteState === 'loading' ? 'Načítám' : 'Offline'}
            hint={quoteState === 'offline' ? 'Koláč ukazuje cílové váhy' : 'Yahoo · obnovení každou minutu'}
          />
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start border border-white/10 rounded-3xl bg-[#050505] p-5 md:p-8">
        <div className="lg:col-span-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Koláč účtu</p>
            <span className={`text-[10px] font-bold uppercase tracking-widest ${up ? 'text-emerald-400' : 'text-red-400'}`}>
              {book.live ? `${up ? '+' : ''}${book.pnl === 0 ? '0,00' : ((book.pnl / PARENT_CAPITAL) * 100).toFixed(2)} %` : 'Cílové váhy'}
            </span>
          </div>
          <Donut
            data={parentPie}
            dataKey="weight"
            activeIndex={activeIndex}
            onHover={onHover}
            centerLabel={activeHolding ? activeHolding.id : 'Portfolio'}
            centerValue={activeHolding ? formatCzk(activeHolding.value) : formatCzk(book.nav)}
          />
          {activeHolding && (
            <div className="mt-2 rounded-2xl border border-white/10 bg-black px-4 py-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{activeHolding.logo}</span>
                <div>
                  <p className="text-white font-bold">{activeHolding.name}</p>
                  <p className="text-[10px] uppercase tracking-widest text-zinc-500">{activeHolding.sector}</p>
                </div>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed mt-3">{activeHolding.desc}</p>
              <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-white/10">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Pozice</p>
                  <p className="text-white font-mono font-bold mt-1">{formatCzk(activeHolding.value, book.live ? 0 : 0)}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Cena</p>
                  <p className="text-white font-mono font-bold mt-1">
                    {activeHolding.price != null ? `$${activeHolding.price.toFixed(2)}` : '—'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-7 flex flex-col gap-2">
          {book.rows.map((row, index) => {
            const on = activeIndex === index;
            const positive = row.change >= 0;
            return (
              <button
                key={row.id}
                type="button"
                onMouseEnter={() => onHover(index)}
                onMouseLeave={() => onHover(null)}
                onClick={() => onPin(index)}
                className={`text-left rounded-2xl border px-4 py-3 transition-colors ${on ? 'border-white/25 bg-white/[0.04]' : 'border-white/5 hover:border-white/15'}`}
              >
                <div className="flex items-center gap-4">
                  <span className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-lg shrink-0">{row.logo}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="text-sm font-bold text-white">{row.name}</span>
                      <span className="text-sm font-mono font-bold text-white">{formatCzk(row.value, book.live ? 0 : 0)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3 mt-1">
                      <span className="text-[10px] font-mono text-zinc-500">
                        <span style={{ color: row.color }}>{row.weight.toFixed(1)} %</span>
                        {' '}/ cíl {row.allocation} %
                      </span>
                      <span className={`text-[10px] font-mono font-bold ${book.live ? (positive ? 'text-emerald-400' : 'text-red-400') : 'text-zinc-600'}`}>
                        {book.live ? `${positive ? '+' : ''}${row.changePct.toFixed(2)} %` : row.id}
                      </span>
                    </div>
                    <span className="mt-2 block h-1 rounded-full bg-white/5 overflow-hidden">
                      <span className="block h-full rounded-full" style={{ width: `${Math.min(row.weight, 100)}%`, backgroundColor: row.color }} />
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <ScenarioGrid capital={PARENT_CAPITAL} caption="Na rodičovských 2 500 Kč" />
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
