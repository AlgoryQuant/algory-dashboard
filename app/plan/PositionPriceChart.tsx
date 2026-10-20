'use client';

import { useEffect, useState } from 'react';
import { Area, AreaChart, ResponsiveContainer, Tooltip, YAxis } from 'recharts';

type ChartPoint = { t: number; close: number };

type ChartPayload = {
  symbol: string;
  currency: string | null;
  price: number | null;
  changePct: number | null;
  points: ChartPoint[];
};

function formatPrice(value: number, currency: string | null) {
  const digits = value >= 100 ? 2 : value >= 10 ? 2 : 3;
  const core = new Intl.NumberFormat('cs-CZ', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
  if (currency === 'EUR') return `${core} €`;
  if (currency === 'USD') return `${core} $`;
  if (currency) return `${core} ${currency}`;
  return core;
}

function formatChange(value: number) {
  const core = new Intl.NumberFormat('cs-CZ', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(value));
  if (value > 0) return `+${core} %`;
  if (value < 0) return `−${core} %`;
  return `${core} %`;
}

function ChartTooltip({
  active,
  payload,
  currency,
}: {
  active?: boolean;
  payload?: Array<{ payload?: ChartPoint }>;
  currency: string | null;
}) {
  const row = payload?.[0]?.payload;
  if (!active || !row) return null;
  const day = new Intl.DateTimeFormat('cs-CZ', { day: 'numeric', month: 'short', year: 'numeric' }).format(row.t);
  return (
    <div className="bg-[#0a0a0a] border border-white/10 px-3 py-2 rounded-xl shadow-2xl">
      <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">{day}</p>
      <p className="text-white text-xs font-mono font-bold mt-1">{formatPrice(row.close, currency)}</p>
    </div>
  );
}

export default function PositionPriceChart({
  symbol,
  color,
}: {
  symbol: string;
  color: string;
}) {
  const [data, setData] = useState<ChartPayload | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    let cancel = false;
    setState('loading');
    setData(null);
    (async () => {
      try {
        const response = await fetch(`/api/plan-chart?symbol=${encodeURIComponent(symbol)}`, { cache: 'no-store' });
        if (!response.ok) throw new Error('route');
        const json = (await response.json()) as ChartPayload;
        if (!cancel) {
          if (!Array.isArray(json.points) || json.points.length < 2) throw new Error('empty');
          setData(json);
          setState('ready');
        }
      } catch {
        if (!cancel) setState('error');
      }
    })();
    return () => {
      cancel = true;
    };
  }, [symbol]);

  const up = (data?.changePct ?? 0) >= 0;
  const stroke = up ? '#34d399' : '#f87171';

  return (
    <div className="mt-5 rounded-2xl border border-white/10 bg-black/40 p-4" data-price-chart={symbol}>
      <div className="flex items-end justify-between gap-3 mb-3">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Cena · 6 měsíců</p>
          {state === 'ready' && data?.price != null ? (
            <p className="mt-1 text-xl font-black font-mono text-white">{formatPrice(data.price, data.currency)}</p>
          ) : (
            <p className="mt-1 text-sm text-zinc-500">{state === 'error' ? 'Graf teď nejde načíst' : 'Načítám…'}</p>
          )}
        </div>
        {state === 'ready' && data?.changePct != null && (
          <p className={`text-sm font-mono font-bold ${up ? 'text-emerald-400' : 'text-red-400'}`}>
            {formatChange(data.changePct)}
          </p>
        )}
      </div>
      <div className="h-[160px] w-full">
        {state === 'ready' && data ? (
          <ResponsiveContainer width="100%" height={160} debounce={120} initialDimension={{ width: 480, height: 160 }}>
            <AreaChart data={data.points} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={`plan-chart-${symbol.replace('.', '-')}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={stroke} stopOpacity={0.35} />
                  <stop offset="95%" stopColor={stroke} stopOpacity={0} />
                </linearGradient>
              </defs>
              <YAxis domain={['dataMin', 'dataMax']} hide width={0} />
              <Tooltip
                content={(props) => (
                  <ChartTooltip
                    active={props.active}
                    payload={props.payload as unknown as Array<{ payload?: ChartPoint }> | undefined}
                    currency={data.currency}
                  />
                )}
              />
              <Area
                type="monotone"
                dataKey="close"
                stroke={stroke}
                strokeWidth={2}
                fill={`url(#plan-chart-${symbol.replace('.', '-')})`}
                isAnimationActive={false}
                dot={false}
                activeDot={{ r: 3, fill: color, stroke: '#fff', strokeWidth: 1 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full w-full rounded-xl border border-dashed border-white/10 bg-white/[0.02]" />
        )}
      </div>
    </div>
  );
}
