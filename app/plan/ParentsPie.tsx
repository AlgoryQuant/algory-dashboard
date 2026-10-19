'use client';

import { useMemo, useState } from 'react';
import { Area, AreaChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

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
  { id: 'MC', name: 'LVMH Moet Hennessy Louis Vuitton', target: 15, actual: 14.45, value: 1508.12, pnl: -2.54, pnlPct: -0.17, color: '#d4d4d8', sector: 'Luxury' },
];

const RANGES = ['1D', '1W', '1M', '3M', '1Y', 'MAX'] as const;
type Range = (typeof RANGES)[number];

const INSIGHTS = [
  {
    id: 'weight',
    title: "What's over- and under-weight in my pie?",
    body: 'Nad cílem je Visa (26,56 % proti 25 %) a Lockheed Martin (15,49 % proti 15 %). Pod cílem je Target (23,65 % proti 25 %), LVMH (14,45 % proti 15 %) a Pfizer (19,83 % proti 20 %).',
  },
  {
    id: 'performance',
    title: "How's my pie performing?",
    body: 'Pozice dohromady vydělaly +Kč 541.10, tedy 5,47 % proti nákladům. Za poslední týden je pie výš o +Kč 124.44, což je 1,2 %. Čistý vklad je Kč 10,000.00.',
  },
  {
    id: 'sector',
    title: "Break down my pie's return by sector",
    body: 'Nejvíc táhne payments: Visa +Kč 267.25. Healthcare Pfizer +Kč 156.71, aerospace Lockheed +Kč 89.90, retail Target +Kč 29.78. Luxury LVMH je −Kč 2.54.',
  },
  {
    id: 'about',
    title: "What's this pie?",
    body: 'Parents. Pět titulů s cíli 25 / 25 / 20 / 15 / 15: Target, Visa, Pfizer, Lockheed Martin a LVMH. Vklad Kč 10,000.00, hodnota pozic Kč 10,434.73.',
  },
];

function money(value: number, signed = false) {
  const text = Math.abs(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (!signed) return `Kč ${text}`;
  if (value < 0) return `−Kč ${text}`;
  if (value > 0) return `+Kč ${text}`;
  return `Kč ${text}`;
}

function weekSeries() {
  const start = OVERVIEW_VALUE - WEEK_CHANGE;
  return Array.from({ length: 28 }, (_, index) => {
    const t = index / 27;
    const eased = t * t * (3 - 2 * t);
    return { index, value: start + WEEK_CHANGE * eased };
  });
}

function Mark({ position }: { position: Position }) {
  const letter = position.id === 'MC' ? 'LV' : position.id === 'TGT' ? '' : position.id.slice(0, 1);
  return (
    <span className="relative w-9 h-9 rounded-full shrink-0 flex items-center justify-center font-black text-white text-sm" style={{ backgroundColor: position.color }}>
      {position.id === 'TGT' ? <span className="w-3.5 h-3.5 rounded-full border-2 border-white" /> : letter}
    </span>
  );
}

export default function ParentsPie({ onOpenPlan }: { onOpenPlan?: () => void }) {
  const [tab, setTab] = useState<'overview' | 'holdings'>('overview');
  const [range, setRange] = useState<Range>('1W');
  const [insight, setInsight] = useState<string | null>(null);
  const [goal, setGoal] = useState('');
  const [note, setNote] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [sortMode, setSortMode] = useState<'target' | 'value'>('target');
  const series = useMemo(() => weekSeries(), []);
  const ordered = useMemo(() => {
    const rows = [...POSITIONS];
    if (sortMode === 'value') rows.sort((a, b) => b.value - a.value);
    return rows;
  }, [sortMode]);
  const openInsight = INSIGHTS.find((item) => item.id === insight);
  const goalValue = Number(goal.replace(',', '.'));
  const goalReady = Number.isFinite(goalValue) && goalValue > 0;

  const mirror = (label: string) => {
    setNote(`${label} zůstává v Trading 212. Tady je náhled pie Parents.`);
  };

  return (
    <div className="mx-auto w-full max-w-md text-white">
      <div className="flex items-center justify-between px-1 pb-4">
        <span className="w-8" />
        <h1 className="text-base font-semibold tracking-tight">Parents</h1>
        <button
          type="button"
          aria-label="Další možnosti"
          onClick={() => setNote(note ? null : 'Náhled pie Parents pro rodice@seznam.cz.')}
          className="w-8 h-8 text-zinc-400 text-lg leading-none"
        >
          ···
        </button>
      </div>

      <div className="grid grid-cols-2 border-b border-white/10 mb-6">
        {(['overview', 'holdings'] as const).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setTab(item)}
            className={`pb-3 text-sm capitalize ${tab === item ? 'text-white border-b-2 border-white' : 'text-zinc-500'}`}
          >
            {item === 'overview' ? 'Overview' : 'Holdings'}
          </button>
        ))}
      </div>

      {tab === 'overview' ? (
        <div className="flex flex-col gap-6">
          <div>
            <p className="text-4xl font-semibold tracking-tight">{money(range === '1W' ? OVERVIEW_VALUE : HOLDINGS_VALUE)}</p>
            <div className="grid grid-cols-2 gap-6 mt-4">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-zinc-500">Last week</p>
                <p className="text-emerald-400 font-semibold mt-1">{range === '1W' ? money(WEEK_CHANGE, true) : 'Jen u 1W'}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-zinc-500">Rate of return</p>
                <p className="text-emerald-400 font-semibold mt-1">{range === '1W' ? `↗ ${WEEK_RETURN.toFixed(1)}%` : `${HOLDINGS_RETURN.toFixed(2)}% celkem`}</p>
              </div>
            </div>
            <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-zinc-900 px-3 py-1.5 text-xs text-zinc-300">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              {money(NET_DEPOSITS)} net deposits
            </div>
          </div>

          <div className="h-[180px] w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={range === '1W' ? series : [{ index: 0, value: HOLDINGS_VALUE }, { index: 1, value: HOLDINGS_VALUE }]}>
                <defs>
                  <linearGradient id="parentsFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="#22d3ee" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Tooltip
                  content={({ active, payload }) => {
                    const point = payload?.[0]?.value;
                    if (!active || typeof point !== 'number') return null;
                    return <div className="bg-zinc-900 border border-white/10 rounded-lg px-2 py-1 text-xs">{money(point)}</div>;
                  }}
                />
                <Area type="monotone" dataKey="value" stroke="#67e8f9" strokeWidth={2} fill="url(#parentsFill)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[11px] text-zinc-500 -mt-4">
            {range === '1W'
              ? '1W spojuje začátek týdne a Kč 10,336.88. Mezihodnoty nejsou burzovní tisky.'
              : 'Historii za toto období ze snímku nemáme. Číslo nahoře je aktuální hodnota pozic.'}
          </p>

          <div className="flex items-center justify-between text-xs text-zinc-500">
            {RANGES.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setRange(item)}
                className={`px-2.5 py-1 rounded-full ${range === item ? 'bg-zinc-800 text-white' : ''}`}
              >
                {item}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button type="button" onClick={() => mirror('Invest')} className="h-12 rounded-full bg-[#0095ff] font-semibold">Invest</button>
            <button type="button" onClick={() => mirror('Withdraw')} className="h-12 rounded-full bg-zinc-800 font-semibold text-zinc-200">Withdraw</button>
          </div>
          {note && <p className="text-xs text-zinc-400">{note}</p>}

          <section>
            <h2 className="text-sm text-zinc-400 mb-3">AI analysis</h2>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {INSIGHTS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setInsight(insight === item.id ? null : item.id)}
                  className={`shrink-0 max-w-[180px] text-left rounded-2xl px-3 py-3 text-xs leading-snug ${insight === item.id ? 'bg-zinc-700' : 'bg-zinc-900'}`}
                >
                  {item.title}
                </button>
              ))}
            </div>
            {openInsight && <p className="mt-3 text-sm text-zinc-300 leading-relaxed">{openInsight.body}</p>}
          </section>

          <section>
            <h2 className="text-sm text-zinc-400 mb-3">Goal</h2>
            {goalReady ? (
              <button type="button" onClick={() => setGoal('')} className="w-full text-left rounded-2xl border border-white/10 px-4 py-4">
                <span className="block text-xs text-zinc-500">Cíl na tomto náhledu</span>
                <span className="block mt-1 font-semibold">{money(goalValue)}</span>
                <span className="mt-3 block h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                  <span className="block h-full bg-[#0095ff]" style={{ width: `${Math.min((HOLDINGS_VALUE / goalValue) * 100, 100)}%` }} />
                </span>
              </button>
            ) : (
              <label className="block rounded-2xl border border-white/10 px-4 py-4 text-sm text-zinc-500">
                Set your desired goal and keep track of your investment progress
                <input
                  value={goal}
                  onChange={(event) => setGoal(event.target.value)}
                  inputMode="decimal"
                  placeholder="Kč"
                  className="mt-3 w-full bg-transparent text-white outline-none placeholder:text-zinc-600"
                />
              </label>
            )}
          </section>

          <section className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-sm text-zinc-300">AutoInvest</h2>
              <p className="text-xs text-zinc-500 mt-2 leading-relaxed">Build your pie by setting an investment schedule and automating your deposits</p>
            </div>
            <span className="text-xs text-zinc-500 shrink-0">Off</span>
          </section>
          <section className="flex items-start justify-between gap-4 pb-8">
            <div>
              <h2 className="text-sm text-zinc-300">Invest spare change</h2>
            </div>
            <span className="text-xs text-zinc-500 shrink-0">Off</span>
          </section>
        </div>
      ) : (
        <div className="flex flex-col gap-6 pb-10">
          <div className="flex items-center gap-4">
            <div className="relative h-[168px] w-[168px] shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={POSITIONS} dataKey="value" innerRadius={62} outerRadius={80} stroke="none" paddingAngle={2}>
                    {POSITIONS.map((position) => (
                      <Cell key={position.id} fill={position.color} fillOpacity={activeId === null || activeId === position.id ? 1 : 0.25} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-6">
                <span className="text-sm font-semibold">{money(HOLDINGS_VALUE)}</span>
                <span className="text-[10px] text-emerald-400 mt-0.5">{money(HOLDINGS_PNL, true)} ({HOLDINGS_RETURN.toFixed(2)}%)</span>
              </div>
            </div>
            <div className="flex-1 flex flex-col gap-3">
              <button type="button" onClick={() => mirror('Edit pie')} className="h-11 rounded-full bg-zinc-800 text-sm font-semibold">Edit pie</button>
              <button type="button" onClick={() => mirror('Rebalance')} className="h-11 rounded-full bg-zinc-800 text-sm font-semibold">Rebalance</button>
            </div>
          </div>
          {note && <p className="text-xs text-zinc-400">{note}</p>}

          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-sm font-semibold">Holdings</h2>
              <p className="text-[11px] text-zinc-500 mt-1">{sortMode === 'target' ? 'Sorted by target weight' : 'Sorted by value'}</p>
            </div>
            <button type="button" aria-label="Změnit řazení" onClick={() => setSortMode(sortMode === 'target' ? 'value' : 'target')} className="text-zinc-400 text-sm">
              ↕
            </button>
          </div>

          <div className="flex flex-col">
            {ordered.map((position) => {
              const up = position.pnl >= 0;
              const on = activeId === position.id;
              return (
                <button
                  key={position.id}
                  type="button"
                  onClick={() => setActiveId(on ? null : position.id)}
                  className={`flex items-center gap-3 py-3 text-left border-b border-white/5 ${on ? 'bg-white/[0.03]' : ''}`}
                >
                  <Mark position={position} />
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm font-medium truncate">{position.name}</span>
                    <span className="block text-[11px] text-emerald-400 mt-0.5">{position.actual.toFixed(2)}% / {position.target}%</span>
                  </span>
                  <span className="text-right">
                    <span className="block text-sm font-medium">{money(position.value)}</span>
                    <span className={`block text-[11px] mt-0.5 ${up ? 'text-emerald-400' : 'text-red-400'}`}>
                      {money(position.pnl, true)} ({Math.abs(position.pnlPct).toFixed(2)}%)
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
          {onOpenPlan && (
            <button type="button" onClick={onOpenPlan} className="text-xs uppercase tracking-widest text-zinc-500 text-left">
              Master plán 40 000 Kč
            </button>
          )}
        </div>
      )}
    </div>
  );
}
