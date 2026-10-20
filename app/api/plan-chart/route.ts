import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const ALLOWED = new Set(['NEE', 'TGT', 'PFE', 'SYM', 'MC.PA', 'V', 'LMT']);

type ChartPoint = { t: number; close: number };

function parseSymbol(raw: string | null): string | null {
  if (!raw) return null;
  const symbol = raw.trim().toUpperCase();
  if (symbol === 'MC') return 'MC.PA';
  if (ALLOWED.has(symbol)) return symbol;
  return null;
}

async function fetchYahooSeries(symbol: string): Promise<{
  symbol: string;
  currency: string | null;
  price: number | null;
  changePct: number | null;
  points: ChartPoint[];
}> {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=6mo`;
  const response = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      Accept: 'application/json',
    },
    cache: 'no-store',
    signal: AbortSignal.timeout(12000),
  });
  if (!response.ok) {
    throw new Error(`yahoo ${response.status}`);
  }
  const json = (await response.json()) as {
    chart?: {
      result?: Array<{
        meta?: {
          currency?: string;
          regularMarketPrice?: number;
          chartPreviousClose?: number;
          previousClose?: number;
          regularMarketChangePercent?: number;
        };
        timestamp?: number[];
        indicators?: { quote?: Array<{ close?: Array<number | null> }> };
      }>;
    };
  };
  const result = json.chart?.result?.[0];
  if (!result) throw new Error('empty');
  const timestamps = result.timestamp ?? [];
  const closes = result.indicators?.quote?.[0]?.close ?? [];
  const points: ChartPoint[] = [];
  for (let i = 0; i < timestamps.length; i += 1) {
    const close = closes[i];
    const t = timestamps[i];
    if (typeof close === 'number' && Number.isFinite(close) && typeof t === 'number') {
      points.push({ t: t * 1000, close });
    }
  }
  const meta = result.meta;
  const price = meta?.regularMarketPrice ?? points.at(-1)?.close ?? null;
  let changePct =
    typeof meta?.regularMarketChangePercent === 'number' && Number.isFinite(meta.regularMarketChangePercent)
      ? meta.regularMarketChangePercent
      : null;
  if (changePct == null) {
    const prev = meta?.previousClose ?? meta?.chartPreviousClose ?? null;
    if (price != null && prev != null && prev !== 0) changePct = ((price - prev) / prev) * 100;
  }
  return {
    symbol,
    currency: meta?.currency ?? null,
    price,
    changePct,
    points,
  };
}

export async function GET(request: NextRequest) {
  const symbol = parseSymbol(request.nextUrl.searchParams.get('symbol'));
  if (!symbol) {
    return NextResponse.json({ error: 'unsupported symbol' }, { status: 400 });
  }
  try {
    const series = await fetchYahooSeries(symbol);
    return NextResponse.json(series, {
      headers: { 'Cache-Control': 'public, max-age=60, stale-while-revalidate=120' },
    });
  } catch {
    return NextResponse.json({ error: 'chart unavailable', symbol }, { status: 502 });
  }
}
