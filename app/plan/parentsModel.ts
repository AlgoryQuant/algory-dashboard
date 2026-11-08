export type PieSource = 'live' | 'demo' | 'snapshot';

export type ParentsPosition = {
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

export type ParentsPieModel = {
  source: PieSource;
  fallback: 'none' | 'missing-key' | 'unauthorized' | 'unavailable' | 'not-found';
  matchedBy: 'name' | 'holdings' | 'snapshot';
  currency: string;
  pieName: string;
  deposits: number;
  depositHint: string;
  overviewValue: number;
  weekChange: number | null;
  weekReturn: number | null;
  holdingsValue: number;
  holdingsPnl: number;
  holdingsReturn: number;
  cashAvailable: number | null;
  positions: ParentsPosition[];
};

const KNOWN: Record<string, { name: string; sector: string; color: string }> = {
  TGT: { name: 'Target', sector: 'Retail', color: '#ff4d4d' },
  V: { name: 'Visa', sector: 'Payments', color: '#3b82f6' },
  PFE: { name: 'Pfizer', sector: 'Healthcare', color: '#22d3ee' },
  LMT: { name: 'Lockheed Martin', sector: 'Aerospace', color: '#a855f7' },
  MC: { name: 'LVMH Moet Hennessy Louis Vuitton', sector: 'Luxury', color: '#d4d4d8' },
  PCAR: { name: 'PACCAR', sector: 'Trucks', color: '#f59e0b' },
  GS: { name: 'Goldman Sachs', sector: 'Banks', color: '#10b981' },
};

const ORDER = ['TGT', 'V', 'PFE', 'LMT', 'MC', 'PCAR', 'GS'];
const PARENT_IDS = ['TGT', 'V', 'PFE', 'LMT', 'MC', 'PCAR', 'GS'] as const;
/** Short Czech names for intro copy when live pie is still loading. */
export const PARENTS_HOLDING_LABELS = [
  'Target',
  'Visa',
  'Pfizer',
  'Lockheed Martin',
  'LVMH',
  'Paccar',
  'Goldman Sachs',
] as const;
/** Net cash parents put in — shown separately from live holdings PnL. */
export const PARENTS_NET_DEPOSIT = 20_000;

export const PARENTS_SNAPSHOT: ParentsPieModel = {
  source: 'snapshot',
  fallback: 'none',
  matchedBy: 'snapshot',
  currency: 'CZK',
  pieName: 'Parents',
  deposits: PARENTS_NET_DEPOSIT,
  depositHint: 'Čistý vklad',
  overviewValue: 65_280.7,
  weekChange: null,
  weekReturn: null,
  holdingsValue: 15_431.65,
  holdingsPnl: 774.03,
  holdingsReturn: 5.28,
  cashAvailable: null,
  positions: [
    { id: 'TGT', name: 'Target', target: 21, actual: 16.49, value: 2544.36, pnl: 105.82, pnlPct: 4.34, color: '#ff4d4d', sector: 'Retail' },
    { id: 'V', name: 'Visa', target: 21, actual: 18.99, value: 2931.08, pnl: 426.4, pnlPct: 17.02, color: '#3b82f6', sector: 'Payments' },
    { id: 'PFE', name: 'Pfizer', target: 17, actual: 13.49, value: 2082.08, pnl: 169.2, pnlPct: 8.85, color: '#22d3ee', sector: 'Healthcare' },
    { id: 'LMT', name: 'Lockheed Martin', target: 13, actual: 10.86, value: 1676.4, pnl: 149.53, pnlPct: 9.79, color: '#a855f7', sector: 'Aerospace' },
    { id: 'MC', name: 'LVMH Moet Hennessy Louis Vuitton', target: 12, actual: 10.25, value: 1581.62, pnl: 70.96, pnlPct: 4.7, color: '#d4d4d8', sector: 'Luxury' },
    { id: 'PCAR', name: 'PACCAR', target: 8, actual: 14.39, value: 2221.22, pnl: -57.35, pnlPct: -2.52, color: '#f59e0b', sector: 'Trucks' },
    { id: 'GS', name: 'Goldman Sachs', target: 8, actual: 15.52, value: 2394.89, pnl: -90.53, pnlPct: -3.64, color: '#10b981', sector: 'Banks' },
  ],
};

/** "Target, Visa … a Goldman Sachs" for Czech UI sentences. */
export function formatHoldingList(names: readonly string[]): string {
  const clean = names.map((name) => name.trim()).filter(Boolean);
  if (clean.length === 0) return '';
  if (clean.length === 1) return clean[0];
  if (clean.length === 2) return `${clean[0]} a ${clean[1]}`;
  return `${clean.slice(0, -1).join(', ')} a ${clean[clean.length - 1]}`;
}

export function snapshotModel(fallback: ParentsPieModel['fallback']): ParentsPieModel {
  return {
    ...PARENTS_SNAPSHOT,
    fallback,
    positions: PARENTS_SNAPSHOT.positions.map((position) => ({ ...position })),
  };
}

export function pieStatusLabel(model: Pick<ParentsPieModel, 'source' | 'fallback'>): string {
  if (model.source === 'live') return 'Živě z Trading 212';
  if (model.source === 'demo') return 'Živě z Trading 212 · demo';
  if (model.fallback === 'missing-key') return 'Snímek · není živý stav (chybí klíč Trading 212)';
  if (model.fallback === 'unauthorized') return 'Snímek · není živý stav (API odmítlo přístup)';
  if (model.fallback === 'not-found') return 'Snímek · není živý stav (pie Parents nenalezen)';
  if (model.fallback === 'unavailable') return 'Snímek · není živý stav (Trading 212 nedostupné)';
  return 'Snímek · není živý stav';
}

/** Display tickers as shown in Trading 212 / Yahoo (LVMH is MC.PA). */
export function displayTicker(id: string): string {
  if (id === 'MC') return 'MC.PA';
  return id;
}

/** Yahoo Finance chart symbol for plan holdings. */
export function yahooSymbol(id: string): string {
  const key = id.toUpperCase().replace(/\.PA$/, '');
  if (key === 'MC') return 'MC.PA';
  return key;
}

/** Google Finance style exchange:ticker for the detail card. */
export function financeQuote(id: string): string {
  const key = id.toUpperCase().replace(/\.PA$/, '');
  if (key === 'MC') return 'EURONEXT: MC';
  if (
    key === 'NEE' ||
    key === 'TGT' ||
    key === 'PFE' ||
    key === 'SYM' ||
    key === 'V' ||
    key === 'LMT' ||
    key === 'NVO' ||
    key === 'LLY' ||
    key === 'GS'
  ) {
    return `NYSE: ${key}`;
  }
  if (key === 'PCAR') return `NASDAQ: ${key}`;
  return key;
}

export function formatMoney(value: number, currency = 'CZK', digits = 2): string {
  const formatted = new Intl.NumberFormat('cs-CZ', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
  if (!currency || currency === 'CZK') return `${formatted} Kč`;
  try {
    return new Intl.NumberFormat('cs-CZ', {
      style: 'currency',
      currency,
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    }).format(value);
  } catch {
    return `${formatted} ${currency}`;
  }
}

export function formatSignedMoney(value: number, currency = 'CZK', digits = 2): string {
  const core = formatMoney(Math.abs(value), currency, digits);
  if (value > 0) return `+${core}`;
  if (value < 0) return `−${core}`;
  return core;
}

export function formatPercent(value: number, digits = 2): string {
  return `${new Intl.NumberFormat('cs-CZ', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value)} %`;
}

export function canonicalId(ticker: string, name = ''): string | null {
  const symbol = ticker.toUpperCase();
  const label = name.toUpperCase();
  if (symbol === 'TGT' || symbol.startsWith('TGT_') || label.includes('TARGET')) return 'TGT';
  if (symbol === 'PFE' || symbol.startsWith('PFE_') || label.includes('PFIZER')) return 'PFE';
  if (symbol === 'LMT' || symbol.startsWith('LMT_') || label.includes('LOCKHEED')) return 'LMT';
  if (symbol === 'V' || symbol.startsWith('V_') || label === 'VISA' || label.startsWith('VISA ') || label.includes('VISA INC')) return 'V';
  if (
    symbol === 'MC' ||
    symbol.startsWith('MC_') ||
    symbol.startsWith('LVMH') ||
    symbol.startsWith('LVMUY') ||
    label.includes('LVMH') ||
    label.includes('LOUIS VUITTON')
  ) {
    return 'MC';
  }
  if (symbol === 'PCAR' || symbol.startsWith('PCAR_') || label.includes('PACCAR')) return 'PCAR';
  if (
    symbol === 'GS' ||
    symbol.startsWith('GS_') ||
    label.includes('GOLDMAN SACHS') ||
    label === 'GOLDMAN' ||
    label.startsWith('GOLDMAN ')
  ) {
    return 'GS';
  }
  return null;
}

type InvestmentResult = {
  priceAvgInvestedValue?: number;
  priceAvgResult?: number;
  priceAvgResultCoef?: number;
  priceAvgValue?: number;
};

type RawInstrument = {
  ticker?: string;
  currentShare?: number;
  expectedShare?: number;
  result?: InvestmentResult;
};

type RawPieDetail = {
  settings?: {
    id?: number | string;
    name?: string;
    initialInvestment?: number;
    instrumentShares?: Record<string, number>;
  };
  instruments?: RawInstrument[];
};

type RawPieListItem = {
  id?: number | string;
  cash?: number;
  result?: InvestmentResult;
};

type RawPosition = {
  instrument?: { ticker?: string; name?: string };
  walletImpact?: { currency?: string };
};

type RawSummary = {
  currency?: string;
  totalValue?: number;
  cash?: { availableToTrade?: number; inPies?: number };
  investments?: { currentValue?: number };
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function asNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function asArray(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  if (isRecord(value) && Array.isArray(value.items)) return value.items;
  return [];
}

function resultPercent(result: InvestmentResult | undefined): number {
  const invested = result?.priceAvgInvestedValue ?? 0;
  const pnl = result?.priceAvgResult ?? 0;
  if (invested > 0 && Number.isFinite(invested) && Number.isFinite(pnl)) return (pnl / invested) * 100;
  const coef = result?.priceAvgResultCoef;
  if (coef == null || !Number.isFinite(coef)) return 0;
  return Math.abs(coef) <= 2 ? coef * 100 : coef;
}

function shareScale(values: number[]): 'fraction' | 'percent' {
  const sum = values.reduce((total, value) => total + (Number.isFinite(value) ? value : 0), 0);
  return sum > 0 && sum <= 1.5 ? 'fraction' : 'percent';
}

function toPercent(value: number, scale: 'fraction' | 'percent'): number {
  return scale === 'fraction' ? value * 100 : value;
}

function sameId(left: number | string | undefined, right: number | string | undefined): boolean {
  if (left == null || right == null) return false;
  return String(left) === String(right);
}

function nameRank(name: string): number {
  const trimmed = name.trim().toLowerCase();
  if (trimmed === 'parents' || trimmed === 'parent') return 2;
  if (/(^|[^a-z0-9])parents?([^a-z0-9]|$)/i.test(name)) return 1;
  return 0;
}

function holdingIds(detail: RawPieDetail, names: Map<string, string>): string[] {
  const tickers = new Set<string>();
  for (const instrument of detail.instruments ?? []) {
    if (instrument.ticker) tickers.add(instrument.ticker);
  }
  for (const ticker of Object.keys(detail.settings?.instrumentShares ?? {})) tickers.add(ticker);
  const ids: string[] = [];
  for (const ticker of tickers) {
    const id = canonicalId(ticker, names.get(ticker) ?? '');
    if (id) ids.push(id);
  }
  return ids;
}

function holdingsRank(ids: string[]): number {
  const present = new Set(ids);
  return PARENT_IDS.filter((id) => present.has(id)).length;
}

export function buildLiveModel(input: {
  environment: 'live' | 'demo';
  summary: unknown;
  positions: unknown;
  pies: unknown;
  details: unknown[];
}): ParentsPieModel | null {
  const summary = isRecord(input.summary) ? (input.summary as RawSummary) : {};
  const positions = asArray(input.positions).filter(isRecord) as RawPosition[];
  const pies = asArray(input.pies).filter(isRecord) as RawPieListItem[];
  const details = input.details.filter(isRecord) as RawPieDetail[];
  const names = new Map<string, string>();
  for (const position of positions) {
    const ticker = position.instrument?.ticker;
    const name = position.instrument?.name;
    if (ticker && name) names.set(ticker, name);
  }

  const ranked = details
    .map((detail) => {
      const ids = holdingIds(detail, names);
      return {
        detail,
        name: detail.settings?.name ?? '',
        nameRank: nameRank(detail.settings?.name ?? ''),
        holdingsRank: holdingsRank(ids),
        extra: new Set(ids).size,
      };
    })
    .filter((item) => item.detail.settings);

  const named = ranked
    .filter((item) => item.nameRank > 0)
    .sort((a, b) => b.nameRank - a.nameRank || b.holdingsRank - a.holdingsRank)[0];
  const byHoldings = ranked
    .filter((item) => item.holdingsRank >= PARENT_IDS.length)
    .sort((a, b) => a.extra - b.extra || b.holdingsRank - a.holdingsRank)[0];
  const chosen = named ?? byHoldings;
  if (!chosen) return null;

  const detail = chosen.detail;
  const listItem = pies.find((pie) => sameId(pie.id, detail.settings?.id));
  const instruments = detail.instruments ?? [];
  if (instruments.length === 0) return null;

  const actualRaw = instruments.map((instrument) => instrument.currentShare ?? 0);
  const targetRaw = instruments.map((instrument) => {
    if (instrument.expectedShare != null) return instrument.expectedShare;
    const shares = detail.settings?.instrumentShares;
    return instrument.ticker && shares ? shares[instrument.ticker] ?? 0 : 0;
  });
  const actualScale = shareScale(actualRaw);
  const targetScale = shareScale(targetRaw.some((value) => value > 0) ? targetRaw : actualRaw);

  const rows: ParentsPosition[] = instruments.map((instrument, index) => {
    const ticker = instrument.ticker ?? '';
    const apiName = names.get(ticker) ?? '';
    const id = canonicalId(ticker, apiName) ?? (ticker.split('_')[0] || ticker || '—');
    const known = KNOWN[id];
    const value = instrument.result?.priceAvgValue ?? 0;
    const pnl = instrument.result?.priceAvgResult ?? 0;
    return {
      id,
      name: apiName.trim() || known?.name || id,
      target: toPercent(targetRaw[index] ?? 0, targetScale),
      actual: toPercent(actualRaw[index] ?? 0, actualScale),
      value,
      pnl,
      pnlPct: resultPercent(instrument.result),
      color: known?.color ?? '#71717a',
      sector: known?.sector ?? 'Pozice',
    };
  });

  const valueSum = rows.reduce((total, row) => total + row.value, 0);
  if (rows.every((row) => row.actual === 0) && valueSum > 0) {
    for (const row of rows) row.actual = (row.value / valueSum) * 100;
  }

  rows.sort((a, b) => {
    const left = ORDER.indexOf(a.id);
    const right = ORDER.indexOf(b.id);
    return (left === -1 ? 99 : left) - (right === -1 ? 99 : right);
  });

  const pieResult = listItem?.result;
  const invested = pieResult?.priceAvgInvestedValue ?? rows.reduce((total, row) => total + Math.max(row.value - row.pnl, 0), 0);
  const holdingsValue = pieResult?.priceAvgValue && pieResult.priceAvgValue > 0 ? pieResult.priceAvgValue : valueSum;
  const holdingsPnl = pieResult?.priceAvgResult ?? rows.reduce((total, row) => total + row.pnl, 0);
  const holdingsReturn = pieResult ? resultPercent(pieResult) : invested > 0 ? (holdingsPnl / invested) * 100 : 0;
  const currency =
    (typeof summary.currency === 'string' && summary.currency) ||
    positions.find((position) => position.walletImpact?.currency)?.walletImpact?.currency ||
    'CZK';
  const overview =
    asNumber(summary.totalValue) ??
    asNumber(summary.investments?.currentValue) ??
    holdingsValue;

  return {
    source: input.environment,
    fallback: 'none',
    matchedBy: named ? 'name' : 'holdings',
    currency,
    pieName: chosen.name.trim() || 'Parents',
    // Net family deposit is planned capital; ZISK still comes from live T212 PnL.
    deposits: PARENTS_NET_DEPOSIT,
    depositHint: 'Čistý vklad',
    overviewValue: overview,
    weekChange: null,
    weekReturn: null,
    holdingsValue,
    holdingsPnl,
    holdingsReturn,
    cashAvailable: asNumber(summary.cash?.availableToTrade),
    positions: rows,
  };
}
