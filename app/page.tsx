"use client";

import { useState, useEffect } from 'react';
import { 
  DndContext, DragOverlay, closestCorners, pointerWithin, rectIntersection,
  KeyboardSensor, PointerSensor, useSensor, useSensors, DragStartEvent, DragEndEvent
} from '@dnd-kit/core';
import { 
  arrayMove, SortableContext, sortableKeyboardCoordinates, 
  verticalListSortingStrategy, useSortable 
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip 
} from 'recharts';

// === INTERFACES ===
interface TradeHistory { date: string; type: string; result: 'WIN' | 'LOSS'; pips: number; }
interface AIAnalysis { evaluation: string; prediction: string; current_session: string; prev_session: string; }
interface NewsItem { title: string; publisher: string; link: string; time: string; sentiment: 'positive' | 'negative' | 'neutral'; }
interface WhaleAlert { id: string; text: string; type: 'bullish' | 'bearish' | 'neutral'; time: string; amountUsd: string; }

type ArbStatus = 'ACTIVE' | 'DEGRADING' | 'CLOSED';
interface ChartPoint { time: string; spread: number; }

interface SpatialArbData { id: string; asset: string; buyExchange: string; sellExchange: string; askPrice: number; bidPrice: number; spreadPercent: number; estimatedFeePercent: number; status: ArbStatus; chartData: ChartPoint[]; }
interface TriangularArbData { id: string; pairName: string; path: string[]; rate1: number; rate2: number; rate3: number; expectedProfitPercent: number; status: ArbStatus; chartData: ChartPoint[]; }
interface FundingRateData { id: string; asset: string; binanceRate: number; bybitRate: number; okxRate: number; optimalLong: string; optimalShort: string; netYield: number; status: ArbStatus; chartData: ChartPoint[]; }

interface DashboardData {
  majors?: Record<string, number>;
  minors?: Record<string, number>;
  metals?: Record<string, number>;
  crypto?: Record<string, number>;
  crypto_arb?: Record<string, SpatialArbData>;
  news?: NewsItem[];
  parameters?: Record<string, { SL: number; TP: number; Partial: number; BE: number; MaxSpread: number; LiveSpread: number | string; KeyDriver: string; Direction?: string; RRR?: number; aiAnalysis?: AIAnalysis; history?: TradeHistory[]; }>;
}

// === HELPER TO GENERATE MOCK CHART DATA ===
const generateSpreadHistory = (baseSpread: number, status: ArbStatus): ChartPoint[] => {
  const data: ChartPoint[] = [];
  let current = status === 'CLOSED' ? baseSpread + 1.5 : baseSpread - 0.5;
  for (let i = 24; i >= 0; i--) {
      data.push({ time: i === 0 ? 'Now' : `-${i}h`, spread: Number(Math.max(0, current).toFixed(2)) });
      if (status === 'ACTIVE') current += Math.random() * 0.15 - 0.05;
      else if (status === 'DEGRADING') current -= Math.random() * 0.2;
      else current -= Math.random() * 0.4;
  }
  return data;
};

// === EXTENDED MOCK DATA ===
const MOCK_CRYPTO_PAIRS: Record<string, number> = {
  "BTCUSD": 0.85, "ETHUSD": 0.72, "SOLUSD": 0.65, "XRPUSD": 0.45,
  "ADAUSD": 0.55, "AVAXUSD": 0.62, "MATICUSD": 0.48, "DOTUSD": 0.51,
  "DOGEUSD": 0.88, "PEPEUSD": 0.92, "SHIBUSD": 0.41, "BNBUSD": 0.60, 
  "LINKUSD": 0.40, "UNIUSD": 0.58, "LTCUSD": 0.49, "ATOMUSD": 0.35
};

const MOCK_SPATIAL_ARB: Record<string, SpatialArbData> = {
  "ARB-BTC-1": { id: "ARB-BTC-1", asset: "BTC/USDT", buyExchange: "Binance", sellExchange: "Kraken", askPrice: 64200.50, bidPrice: 64970.90, spreadPercent: 1.2, estimatedFeePercent: 0.2, status: 'ACTIVE', chartData: generateSpreadHistory(1.2, 'ACTIVE') },
  "ARB-ETH-1": { id: "ARB-ETH-1", asset: "ETH/USDT", buyExchange: "KuCoin", sellExchange: "Binance", askPrice: 3450.10, bidPrice: 3481.15, spreadPercent: 0.9, estimatedFeePercent: 0.2, status: 'DEGRADING', chartData: generateSpreadHistory(0.9, 'DEGRADING') },
  "ARB-SOL-1": { id: "ARB-SOL-1", asset: "SOL/USDT", buyExchange: "Bybit", sellExchange: "Coinbase", askPrice: 142.20, bidPrice: 145.75, spreadPercent: 2.5, estimatedFeePercent: 0.25, status: 'ACTIVE', chartData: generateSpreadHistory(2.5, 'ACTIVE') },
  "ARB-PEPE-1": { id: "ARB-PEPE-1", asset: "PEPE/USDT", buyExchange: "HTX", sellExchange: "Binance", askPrice: 0.0000105, bidPrice: 0.0000101, spreadPercent: -3.8, estimatedFeePercent: 0.3, status: 'CLOSED', chartData: generateSpreadHistory(0, 'CLOSED') },
};

const MOCK_TRIANGULAR_ARB: Record<string, TriangularArbData> = {
  "TRI-1": { id: "TRI-1", pairName: "USDT ➔ BTC ➔ ETH ➔ USDT", path: ["USDT", "BTC", "ETH", "USDT"], rate1: 64000, rate2: 18.5, rate3: 3500, expectedProfitPercent: 1.15, status: 'ACTIVE', chartData: generateSpreadHistory(1.15, 'ACTIVE') },
  "TRI-2": { id: "TRI-2", pairName: "USDT ➔ SOL ➔ BNB ➔ USDT", path: ["USDT", "SOL", "BNB", "USDT"], rate1: 145, rate2: 0.24, rate3: 610, expectedProfitPercent: 0.85, status: 'DEGRADING', chartData: generateSpreadHistory(0.85, 'DEGRADING') },
  "TRI-3": { id: "TRI-3", pairName: "USDT ➔ ADA ➔ XRP ➔ USDT", path: ["USDT", "ADA", "XRP", "USDT"], rate1: 0.45, rate2: 1.2, rate3: 0.55, expectedProfitPercent: 0.1, status: 'CLOSED', chartData: generateSpreadHistory(0.1, 'CLOSED') },
};

const MOCK_FUNDING_RATES: Record<string, FundingRateData> = {
  "FUND-SOL": { id: "FUND-SOL", asset: "SOL Perpetuals", binanceRate: 0.015, bybitRate: 0.002, okxRate: -0.012, optimalLong: "OKX", optimalShort: "Binance", netYield: 0.027, status: 'ACTIVE', chartData: generateSpreadHistory(0.027, 'ACTIVE') },
  "FUND-XRP": { id: "FUND-XRP", asset: "XRP Perpetuals", binanceRate: -0.005, bybitRate: 0.018, okxRate: 0.015, optimalLong: "Binance", optimalShort: "Bybit", netYield: 0.023, status: 'DEGRADING', chartData: generateSpreadHistory(0.023, 'DEGRADING') },
  "FUND-BTC": { id: "FUND-BTC", asset: "BTC Perpetuals", binanceRate: 0.010, bybitRate: 0.011, okxRate: 0.001, optimalLong: "OKX", optimalShort: "Bybit", netYield: 0.010, status: 'CLOSED', chartData: generateSpreadHistory(0.010, 'CLOSED') },
};

const FOREX_NEWS_MOCK: NewsItem[] = [
  { title: "Fed Chair Powell hints at maintaining higher rates for longer.", publisher: "Bloomberg", link: "#", time: "14:30", sentiment: "negative" },
  { title: "EUR/USD rallies as ECB downplays immediate rate cut risks.", publisher: "FXStreet", link: "#", time: "11:15", sentiment: "positive" },
  { title: "Gold prices stabilize amid fluctuating US bond yields.", publisher: "ForexLive", link: "#", time: "09:45", sentiment: "neutral" },
  { title: "BoE holds interest rates steady, sterling remains firm.", publisher: "Bloomberg", link: "#", time: "08:00", sentiment: "positive" }
];

const CRYPTO_NEWS_MOCK: NewsItem[] = [
  { title: "Bitcoin breaks key resistance as institutional inflows surge.", publisher: "CoinDesk", link: "#", time: "15:20", sentiment: "positive" },
  { title: "Ethereum gas fees hit new lows following latest network upgrade.", publisher: "Decrypt", link: "#", time: "13:05", sentiment: "positive" },
  { title: "SEC delays decision on spot Altcoin ETFs citing market volatility.", publisher: "CoinTelegraph", link: "#", time: "10:30", sentiment: "negative" }
];

const WHALE_ALERTS_MOCK: WhaleAlert[] = [
  { id: "W1", text: "10,500 BTC transferred from Unknown Wallet to Binance", type: "bearish", time: "Just now", amountUsd: "$680.5M" },
  { id: "W2", text: "250,000 ETH transferred from Coinbase to Unknown Wallet", type: "bullish", time: "12 mins ago", amountUsd: "$862.1M" },
  { id: "W3", text: "50,000,000 XRP transferred from Ripple Escrow to Unknown Wallet", type: "neutral", time: "45 mins ago", amountUsd: "$29.5M" },
  { id: "W4", text: "4,200 BTC transferred from Kraken to Unknown Wallet", type: "bullish", time: "1 hour ago", amountUsd: "$272.3M" }
];

const LIQUIDATIONS_MOCK = { longsRekt: 154200000, shortsRekt: 45800000 };

// === CUSTOM COLLISION DETECTION ===
const customCollisionDetection = (args: any) => {
  const pointerCollisions = pointerWithin(args);
  if (pointerCollisions.length > 0) return pointerCollisions;
  const rectCollisions = rectIntersection(args);
  if (rectCollisions.length > 0) return rectCollisions;
  return closestCorners(args);
};

// === SUB-COMPONENTS ===
const InfoTooltip = ({ info }: { info: string }) => (
  <span className="relative group inline-flex items-center cursor-help ml-2">
    <span className="flex items-center justify-center w-3.5 h-3.5 text-[9px] border border-zinc-600 text-zinc-400 rounded-full hover:bg-zinc-700 hover:text-white transition-colors">i</span>
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-zinc-900 border border-white/10 text-white/90 text-xs rounded-xl shadow-2xl opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-50 font-normal normal-case tracking-normal text-left">
      {info}
      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-zinc-900" />
    </div>
  </span>
);

const StatusBadge = ({ status }: { status: ArbStatus }) => {
  const colors = {
      ACTIVE: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      DEGRADING: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
      CLOSED: 'text-red-400 bg-red-500/10 border-red-500/20'
  };
  const dotColors = {
      ACTIVE: 'bg-emerald-400',
      DEGRADING: 'bg-yellow-400',
      CLOSED: 'bg-red-400'
  };
  return (
      <div className={`px-2 py-1 rounded-md border text-[9px] font-bold tracking-widest flex items-center gap-1.5 ml-4 ${colors[status]}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${dotColors[status]} ${status === 'ACTIVE' ? 'animate-pulse' : ''}`}></span>
          {status}
      </div>
  )
};

const SpreadHistoryChart = ({ data, color }: { data: ChartPoint[], color: string }) => (
  <div className="w-full mt-8 bg-black/40 border border-white/5 rounded-2xl p-6 shadow-inner">
      <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-4 flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke={color}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" /></svg>
          Spread & Profitability History (24H)
      </div>
      <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                      <linearGradient id={`colorGradient`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
                          <stop offset="95%" stopColor={color} stopOpacity={0}/>
                      </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="time" stroke="rgba(255,255,255,0.2)" fontSize={10} tickMargin={10} axisLine={false} tickLine={false} />
                  <YAxis stroke="rgba(255,255,255,0.2)" fontSize={10} tickFormatter={(val) => `${val}%`} width={50} axisLine={false} tickLine={false} />
                  <RechartsTooltip 
                      contentStyle={{ backgroundColor: '#0a0a0a', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '0.5rem', fontSize: '12px' }}
                      itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                      labelStyle={{ color: '#a1a1aa', marginBottom: '4px' }}
                  />
                  <Area type="monotone" dataKey="spread" stroke={color} strokeWidth={2} fillOpacity={1} fill={`url(#colorGradient)`} />
              </AreaChart>
          </ResponsiveContainer>
      </div>
  </div>
);

const ExecuteButton = ({ baseClass, defaultText, colorTheme, disabled = false }: { baseClass: string, defaultText: string, colorTheme: 'emerald' | 'red' | 'blue' | 'purple' | 'orange', disabled?: boolean }) => {
  const [state, setState] = useState<'idle' | 'loading' | 'success'>('idle');

  const handleClick = () => {
    if (state !== 'idle' || disabled) return;
    setState('loading');
    setTimeout(() => {
      setState('success');
      setTimeout(() => setState('idle'), 1000);
    }, 1500);
  };

  let bgClass = '';
  if (disabled) {
    bgClass = 'bg-zinc-900/50 text-zinc-600 border border-white/5 cursor-not-allowed';
  } else {
    if (colorTheme === 'emerald') bgClass = 'bg-emerald-500 hover:bg-emerald-400 text-black border-emerald-400 shadow-[0_5px_20px_rgba(52,211,153,0.2)] hover:-translate-y-1';
    if (colorTheme === 'red') bgClass = 'bg-red-500 hover:bg-red-400 text-white border-red-400 shadow-[0_5px_20px_rgba(239,68,68,0.2)] hover:-translate-y-1';
    if (colorTheme === 'blue') bgClass = 'bg-blue-500 hover:bg-blue-400 text-white border-blue-400 shadow-[0_5px_20px_rgba(59,130,246,0.2)] hover:-translate-y-1';
    if (colorTheme === 'purple') bgClass = 'bg-purple-500 hover:bg-purple-400 text-white border-purple-400 shadow-[0_5px_20px_rgba(168,85,247,0.2)] hover:-translate-y-1';
    if (colorTheme === 'orange') bgClass = 'bg-orange-500 hover:bg-orange-400 text-white border-orange-400 shadow-[0_5px_20px_rgba(249,115,22,0.2)] hover:-translate-y-1';
  }

  return (
    <button onClick={handleClick} disabled={disabled} className={`${baseClass} ${bgClass} flex items-center justify-center transition-all duration-300 relative overflow-hidden`}>
      <div className={`transition-all duration-300 ${state !== 'idle' ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`}>
        {defaultText}
      </div>
      
      <div className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${state === 'loading' ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
        <svg className="animate-spin h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>

      <div className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${state === 'success' ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}>
        <svg className="h-6 w-6 text-current" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
    </button>
  );
};

const LiquidationsBar = () => {
  const total = LIQUIDATIONS_MOCK.longsRekt + LIQUIDATIONS_MOCK.shortsRekt;
  const longPct = (LIQUIDATIONS_MOCK.longsRekt / total) * 100;
  const shortPct = (LIQUIDATIONS_MOCK.shortsRekt / total) * 100;

  return (
    <div className="w-full bg-[#0a0a0a]/80 backdrop-blur-2xl border border-white/5 rounded-[2rem] p-6 mt-6 shadow-2xl">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold flex items-center gap-2">
          <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" /></svg>
          24H MARKET LIQUIDATIONS
        </h3>
        <span className="text-[9px] bg-white/5 px-2 py-1 rounded text-zinc-400 border border-white/5 tracking-widest uppercase font-bold">GLOBAL METRICS</span>
      </div>
      <div className="flex justify-between text-xs font-mono font-bold mb-2">
        <span className="text-red-400">LONGS REKT: ${(LIQUIDATIONS_MOCK.longsRekt / 1000000).toFixed(1)}M</span>
        <span className="text-emerald-400">SHORTS REKT: ${(LIQUIDATIONS_MOCK.shortsRekt / 1000000).toFixed(1)}M</span>
      </div>
      <div className="w-full h-3 rounded-full overflow-hidden flex border border-white/5 shadow-inner">
        <div className="bg-gradient-to-r from-red-600 to-red-400 h-full transition-all duration-1000" style={{ width: `${longPct}%` }}></div>
        <div className="bg-gradient-to-l from-emerald-600 to-emerald-400 h-full transition-all duration-1000" style={{ width: `${shortPct}%` }}></div>
      </div>
    </div>
  );
};

const PositionCalculator = ({ slPips, direction }: { slPips: number, direction: string }) => {
  const [balance, setBalance] = useState<number>(10000);
  const [riskPercent, setRiskPercent] = useState<number>(1);
  const [lotSize, setLotSize] = useState<string>("0.00");

  useEffect(() => {
    if (slPips > 0) {
      const riskAmount = balance * (riskPercent / 100);
      const pipValueStandardLot = 10; 
      const calculatedLots = riskAmount / (slPips * pipValueStandardLot);
      setLotSize(calculatedLots.toFixed(2));
    } else {
      setLotSize("0.00");
    }
  }, [balance, riskPercent, slPips]);

  const focusRingColor = direction === 'BUY' ? 'focus:ring-emerald-500/50' : direction === 'SELL' ? 'focus:ring-red-500/50' : 'focus:ring-white/20';

  return (
    <div className="mt-6 p-6 bg-black/30 rounded-2xl border border-white/5 shadow-inner">
      <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-4 flex items-center">
        POSITION SIZING
        <InfoTooltip info="Calculates precise trade volume based on your account balance, risk percentage, and the AI-generated Stop Loss distance." />
      </div>
      <div className="flex gap-6 items-end">
        <div className="flex flex-col gap-2 w-1/3">
          <label className="text-[10px] text-zinc-500 uppercase font-semibold tracking-widest">BALANCE ($)</label>
          <input type="number" value={balance} onChange={(e) => setBalance(Number(e.target.value))} className={`bg-zinc-900/80 border border-white/5 rounded-lg px-4 py-2.5 text-sm text-white font-mono focus:outline-none focus:ring-1 ${focusRingColor} transition-all`} />
        </div>
        <div className="flex flex-col gap-2 w-1/3">
          <label className="text-[10px] text-zinc-500 uppercase font-semibold tracking-widest">RISK (%)</label>
          <input type="number" step="0.1" value={riskPercent} onChange={(e) => setRiskPercent(Number(e.target.value))} className={`bg-zinc-900/80 border border-white/5 rounded-lg px-4 py-2.5 text-sm text-white font-mono focus:outline-none focus:ring-1 ${focusRingColor} transition-all`} />
        </div>
        <div className={`w-1/3 flex flex-col items-center justify-center py-2 px-4 rounded-lg border shadow-inner ${direction === 'BUY' ? 'bg-emerald-500/5 border-emerald-500/10' : 'bg-red-500/5 border-red-500/10'}`}>
          <span className={`text-[10px] uppercase font-bold tracking-widest mb-1 ${direction === 'BUY' ? 'text-emerald-500/70' : 'text-red-500/70'}`}>VOLUME</span>
          <span className="text-xl font-bold text-white font-mono">{lotSize} <span className="text-xs text-zinc-500 font-normal font-sans tracking-normal">Lots</span></span>
        </div>
      </div>
    </div>
  );
};

const TradingChart = ({ symbol, isArb }: { symbol: string, isArb?: boolean }) => {
  const getTVSymbol = (s: string) => {
    if (isArb) {
      const parts = s.split('/');
      return `COINBASE:${parts[0]}/COINBASE:${parts[1]}`;
    }
    if (s === 'GOLD' || s === 'XAUUSD') return 'OANDA:XAUUSD';
    if (s === 'SILVER' || s === 'XAGUSD') return 'OANDA:XAGUSD';
    return `COINBASE:${s}`;
  };

  return (
    <div className="w-full bg-[#050505] backdrop-blur-2xl border border-white/5 rounded-[2rem] overflow-hidden shadow-2xl h-[450px] relative transition-all duration-300 flex-shrink-0">
      <div className="absolute top-0 left-0 w-full px-6 py-4 bg-white/[0.02] border-b border-white/5 flex items-center justify-between z-10 pointer-events-none">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" /></svg>
          </div>
          <h3 className="font-bold tracking-widest text-white uppercase text-[10px]">
            {isArb ? `STATISTICAL ARBITRAGE SPREAD: ${symbol}` : `LIVE MARKET STRUCTURE: ${symbol}`}
          </h3>
        </div>
        <span className="px-3 py-1.5 bg-black/60 text-white/80 text-[9px] font-bold uppercase tracking-widest rounded-md border border-white/5">M15 TIMEFRAME</span>
      </div>
      <div className="w-full h-full pt-[73px]">
        <iframe src={`https://s.tradingview.com/widgetembed/?frameElementId=tradingview_1&symbol=${encodeURIComponent(getTVSymbol(symbol))}&interval=15&hidesidetoolbar=1&symboledit=0&saveimage=0&toolbarbg=050505&studies=%5B%5D&theme=dark&style=1&timezone=Etc%2FUTC&studies_overrides=%7B%7D&overrides=%7B%7D&enabled_features=%5B%5D&disabled_features=%5B%5D&locale=en`} style={{ width: '100%', height: '100%', border: 'none' }} title={`Chart ${symbol}`} />
      </div>
    </div>
  );
};

// === ARBITRAGE PANELS ===
const SpatialArbitragePanel = ({ arbData }: { arbData: SpatialArbData }) => {
  const [volume, setVolume] = useState<number>(1);
  const grossProfit = (arbData.bidPrice - arbData.askPrice) * volume;
  const fees = (arbData.askPrice * volume * (arbData.estimatedFeePercent / 100)) + (arbData.bidPrice * volume * (arbData.estimatedFeePercent / 100));
  const netProfit = grossProfit - fees;
  const isProfitable = netProfit > 0;
  
  const chartColor = arbData.status === 'ACTIVE' ? '#34d399' : arbData.status === 'DEGRADING' ? '#fbbf24' : '#ef4444';

  return (
    <div className="w-full bg-[#050505] backdrop-blur-2xl border border-blue-500/20 rounded-[2rem] overflow-hidden shadow-[0_0_50px_rgba(59,130,246,0.15)] transition-all duration-300">
      <div className="px-8 py-6 border-b border-white/5 bg-white/[0.02] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
          </div>
          <div className="flex items-center">
            <div>
              <h2 className="text-2xl font-bold text-white tracking-tight uppercase">{arbData.asset} ARBITRAGE</h2>
              <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mt-1">SPATIAL EXCHANGE OPPORTUNITY</p>
            </div>
            <StatusBadge status={arbData.status} />
          </div>
        </div>
        <div className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
          <span className="text-emerald-400 font-bold text-lg tracking-wider">{arbData.spreadPercent > 0 ? '+' : ''}{arbData.spreadPercent}% SPREAD</span>
        </div>
      </div>

      <div className="p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
          <div className="bg-black/40 border border-white/5 rounded-2xl p-6 shadow-inner relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-red-500/50"></div>
            <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-2">BUY EXCHANGE (ASK)</div>
            <div className="text-xl font-bold text-white mb-4 uppercase">{arbData.buyExchange}</div>
            <div className="text-4xl font-mono font-bold text-red-400">${arbData.askPrice.toLocaleString()}</div>
          </div>
          <div className="bg-black/40 border border-white/5 rounded-2xl p-6 shadow-inner relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500/50"></div>
            <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-2">SELL EXCHANGE (BID)</div>
            <div className="text-xl font-bold text-white mb-4 uppercase">{arbData.sellExchange}</div>
            <div className="text-4xl font-mono font-bold text-emerald-400">${arbData.bidPrice.toLocaleString()}</div>
          </div>
        </div>

        <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-8">
          <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-6 flex items-center gap-2">
            <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
            NET PROFIT CALCULATOR
          </div>
          <div className="flex flex-col md:flex-row gap-8 items-end">
            <div className="flex flex-col gap-2 w-full md:w-1/3">
              <label className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">TRADING VOLUME ({arbData.asset.split('/')[0]})</label>
              <input type="number" min="0.01" step="0.01" value={volume} onChange={(e) => setVolume(Number(e.target.value))} className="bg-black/50 border border-white/10 rounded-xl px-5 py-3 text-lg text-white font-mono focus:outline-none focus:border-blue-500/50 transition-all" />
            </div>
            <div className="flex flex-col gap-2 w-full md:w-1/3">
              <div className="flex justify-between text-[10px] tracking-widest font-bold text-zinc-500 uppercase"><span>GROSS PROFIT:</span><span className={`font-mono ${grossProfit > 0 ? 'text-emerald-400' : 'text-red-400'}`}>${grossProfit.toFixed(2)}</span></div>
              <div className="flex justify-between text-[10px] tracking-widest font-bold text-zinc-500 uppercase"><span>EST. FEES ({arbData.estimatedFeePercent}%):</span><span className="font-mono text-red-400">-${fees.toFixed(2)}</span></div>
              <div className="w-full h-[1px] bg-white/10 my-2"></div>
              <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest"><span className="text-zinc-500">NET PROFIT:</span></div>
            </div>
            <div className="w-full md:w-1/3 flex justify-end">
               <div className={`text-6xl font-black font-mono tracking-tighter ${isProfitable ? 'text-emerald-400 drop-shadow-[0_0_25px_rgba(52,211,153,0.6)]' : 'text-red-400 drop-shadow-[0_0_25px_rgba(239,68,68,0.6)]'}`}>
                 {isProfitable ? '+' : ''}${netProfit.toFixed(2)}
               </div>
            </div>
          </div>
          
          <div className="mt-8 flex justify-end">
            <ExecuteButton 
              baseClass="w-full md:w-auto px-10 py-5 font-bold text-[10px] tracking-widest uppercase rounded-xl" 
              defaultText="EXECUTE ARBITRAGE" 
              colorTheme="blue" 
              disabled={arbData.status === 'CLOSED'}
            />
          </div>
        </div>

        <SpreadHistoryChart data={arbData.chartData} color={chartColor} />
      </div>
    </div>
  );
};

const TriangularArbitragePanel = ({ arbData }: { arbData: TriangularArbData }) => {
  const [volume, setVolume] = useState<number>(1000);
  
  const step1 = volume / arbData.rate1;
  const step2 = step1 * arbData.rate2;
  const step3 = step2 * arbData.rate3;
  const netProfit = step3 - volume;
  const isProfitable = netProfit > 0;

  const chartColor = arbData.status === 'ACTIVE' ? '#a855f7' : arbData.status === 'DEGRADING' ? '#fbbf24' : '#ef4444';

  return (
    <div className="w-full bg-[#050505] backdrop-blur-2xl border border-purple-500/20 rounded-[2rem] overflow-hidden shadow-[0_0_50px_rgba(168,85,247,0.15)] transition-all duration-300">
      <div className="px-8 py-6 border-b border-white/5 bg-white/[0.02] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
          </div>
          <div className="flex items-center">
            <div>
              <h2 className="text-2xl font-bold text-white tracking-tight uppercase">{arbData.pairName}</h2>
              <p className="text-[10px] font-bold text-purple-400 uppercase tracking-widest mt-1">TRIANGULAR INEFFICIENCY LOOP</p>
            </div>
            <StatusBadge status={arbData.status} />
          </div>
        </div>
        <div className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
          <span className="text-emerald-400 font-bold text-lg tracking-wider">{arbData.expectedProfitPercent > 0 ? '+' : ''}{arbData.expectedProfitPercent}% EXPECTED</span>
        </div>
      </div>

      <div className="p-8">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4 mb-12 relative">
          <div className="absolute top-1/2 left-0 w-full h-[2px] bg-white/5 hidden lg:block -z-10"></div>
          
          <div className="bg-black border border-white/10 rounded-2xl p-6 shadow-2xl flex flex-col items-center w-full lg:w-1/3">
            <div className="text-[10px] text-zinc-500 uppercase tracking-widest mb-2 font-bold">STEP 1: BUY {arbData.path[1]}</div>
            <div className="text-2xl font-bold text-white mb-2">{arbData.path[0]} ➔ {arbData.path[1]}</div>
            <div className="text-[10px] font-mono font-bold tracking-widest uppercase text-purple-400">RATE: {arbData.rate1.toLocaleString()}</div>
          </div>
          
          <div className="hidden lg:flex items-center justify-center w-8 h-8 rounded-full bg-purple-500/20 text-purple-400 z-10 border border-purple-500/30">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </div>

          <div className="bg-black border border-white/10 rounded-2xl p-6 shadow-2xl flex flex-col items-center w-full lg:w-1/3">
            <div className="text-[10px] text-zinc-500 uppercase tracking-widest mb-2 font-bold">STEP 2: CROSS TO {arbData.path[2]}</div>
            <div className="text-2xl font-bold text-white mb-2">{arbData.path[1]} ➔ {arbData.path[2]}</div>
            <div className="text-[10px] font-mono font-bold tracking-widest uppercase text-purple-400">RATE: {arbData.rate2.toLocaleString()}</div>
          </div>

          <div className="hidden lg:flex items-center justify-center w-8 h-8 rounded-full bg-purple-500/20 text-purple-400 z-10 border border-purple-500/30">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </div>

          <div className="bg-black border border-white/10 rounded-2xl p-6 shadow-2xl flex flex-col items-center w-full lg:w-1/3">
            <div className="text-[10px] text-zinc-500 uppercase tracking-widest mb-2 font-bold">STEP 3: SELL BACK TO {arbData.path[3]}</div>
            <div className="text-2xl font-bold text-white mb-2">{arbData.path[2]} ➔ {arbData.path[3]}</div>
            <div className="text-[10px] font-mono font-bold tracking-widest uppercase text-purple-400">RATE: {arbData.rate3.toLocaleString()}</div>
          </div>
        </div>

        <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-8 flex flex-col md:flex-row gap-8 items-center justify-between">
          <div className="w-full md:w-1/3">
            <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">INITIAL CAPITAL ({arbData.path[0]})</label>
            <input type="number" min="1" step="100" value={volume} onChange={(e) => setVolume(Number(e.target.value))} className="w-full bg-black/50 border border-white/10 rounded-xl px-5 py-3 text-lg text-white font-mono focus:outline-none focus:border-purple-500/50 mt-2 transition-all" />
          </div>
          <div className="flex-1 text-center md:text-right">
            <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-2">CALCULATED NET PROFIT</div>
            <div className={`text-6xl font-black font-mono tracking-tighter ${isProfitable ? 'text-emerald-400 drop-shadow-[0_0_25px_rgba(52,211,153,0.6)]' : 'text-red-400 drop-shadow-[0_0_25px_rgba(239,68,68,0.6)]'}`}>
              {isProfitable ? '+' : ''}{netProfit.toFixed(2)} <span className="text-2xl tracking-normal text-white/50">{arbData.path[0]}</span>
            </div>
          </div>
          
          <ExecuteButton 
            baseClass="w-full md:w-auto px-10 py-5 font-bold text-[10px] tracking-widest uppercase rounded-xl" 
            defaultText="EXECUTE LOOP" 
            colorTheme="purple" 
            disabled={arbData.status === 'CLOSED'}
          />
        </div>

        <SpreadHistoryChart data={arbData.chartData} color={chartColor} />
      </div>
    </div>
  );
};

const FundingRatesPanel = ({ data }: { data: FundingRateData }) => {
  const chartColor = data.status === 'ACTIVE' ? '#f97316' : data.status === 'DEGRADING' ? '#fbbf24' : '#ef4444';

  return (
    <div className="w-full bg-[#050505] backdrop-blur-2xl border border-orange-500/20 rounded-[2rem] overflow-hidden shadow-[0_0_50px_rgba(249,115,22,0.15)] transition-all duration-300">
      <div className="px-8 py-6 border-b border-white/5 bg-white/[0.02] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <div className="flex items-center">
            <div>
              <h2 className="text-2xl font-bold text-white tracking-tight uppercase">{data.asset}</h2>
              <p className="text-[10px] font-bold text-orange-400 uppercase tracking-widest mt-1">CROSS-EXCHANGE FUNDING ARB</p>
            </div>
            <StatusBadge status={data.status} />
          </div>
        </div>
        <div className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
          <span className="text-emerald-400 font-bold text-lg tracking-wider">{(data.netYield * 100).toFixed(3)}% DAILY YIELD</span>
        </div>
      </div>

      <div className="p-8">
        <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-6">CURRENT 8H FUNDING RATES</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {[
            { name: 'Binance', rate: data.binanceRate },
            { name: 'Bybit', rate: data.bybitRate },
            { name: 'OKX', rate: data.okxRate }
          ].map(ex => (
             <div key={ex.name} className="bg-black/40 border border-white/5 rounded-2xl p-6 shadow-inner flex flex-col items-center">
               <div className="text-[10px] font-bold text-white mb-4 uppercase tracking-widest">{ex.name}</div>
               <div className={`text-4xl font-mono font-black ${ex.rate > 0 ? 'text-red-400 drop-shadow-[0_0_10px_rgba(248,113,113,0.3)]' : 'text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.3)]'}`}>
                 {ex.rate > 0 ? '+' : ''}{(ex.rate * 100).toFixed(4)}%
               </div>
               <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest mt-3">
                 {ex.rate > 0 ? 'PAYS SHORTS' : 'PAYS LONGS'}
               </div>
             </div>
          ))}
        </div>

        <div className="bg-orange-950/20 border border-orange-500/20 rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <div className="text-sm font-bold text-white uppercase tracking-widest mb-2 flex items-center gap-2">
              <svg className="w-5 h-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" /></svg>
              DELTA-NEUTRAL SETUP
            </div>
            <p className="text-xs text-orange-400/80 leading-relaxed max-w-md">
              To collect the funding fee difference without price exposure, open opposing positions simultaneously.
            </p>
          </div>
          <div className="flex gap-4 items-center">
            <div className="px-6 py-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex flex-col items-center">
              <span className="text-[10px] text-emerald-500 uppercase font-bold tracking-widest mb-1">LONG POSITION</span>
              <span className="text-xl font-bold text-white uppercase">{data.optimalLong}</span>
            </div>
            <div className="text-zinc-600 font-bold">+</div>
            <div className="px-6 py-4 bg-red-500/10 border border-red-500/30 rounded-xl flex flex-col items-center">
              <span className="text-[10px] text-red-500 uppercase font-bold tracking-widest mb-1">SHORT POSITION</span>
              <span className="text-xl font-bold text-white uppercase">{data.optimalShort}</span>
            </div>
          </div>
          <ExecuteButton 
            baseClass="w-full md:w-auto px-10 py-5 font-bold text-[10px] tracking-widest uppercase rounded-xl" 
            defaultText="OPEN POSITIONS" 
            colorTheme="orange" 
            disabled={data.status === 'CLOSED'}
          />
        </div>

        <SpreadHistoryChart data={data.chartData} color={chartColor} />
      </div>
    </div>
  );
};

const MarketMonitor = ({ lastRefresh, mode }: { lastRefresh: Date | null, mode: string }) => {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const hour = now.getHours();
  const isCrypto = mode.includes('CRYPTO');
  const sessions = isCrypto ? [
    { name: "Global Crypto Market", open: "24", close: "7", isActive: true }
  ] : [
    { name: "Sydney", open: "22:00", close: "07:00", isActive: hour >= 22 || hour < 7 },
    { name: "Tokyo", open: "00:00", close: "09:00", isActive: hour >= 0 && hour < 9 },
    { name: "London", open: "09:00", close: "17:30", isActive: hour >= 9 && hour < 17 },
    { name: "New York", open: "14:30", close: "22:00", isActive: hour >= 14 && hour < 22 },
  ];

  const minutes = now.getMinutes();
  const seconds = now.getSeconds();
  const progressPercent = (((minutes % 15) * 60 + seconds) / 900) * 100;

  let pulseColor = 'bg-emerald-400';
  let gradientStart = 'from-emerald-600';
  let gradientEnd = 'to-emerald-400';

  if (mode.includes('CRYPTO') && !mode.includes('TRIANGULAR') && !mode.includes('FUNDING')) {
      pulseColor = 'bg-blue-400'; gradientStart = 'from-blue-600'; gradientEnd = 'to-blue-400'; 
  } else if (mode.includes('TRIANGULAR')) {
      pulseColor = 'bg-purple-400'; gradientStart = 'from-purple-600'; gradientEnd = 'to-purple-400'; 
  } else if (mode.includes('FUNDING')) {
      pulseColor = 'bg-orange-400'; gradientStart = 'from-orange-600'; gradientEnd = 'to-orange-400'; 
  }

  return (
    <div className="mb-6 p-8 bg-white/[0.02] backdrop-blur-3xl border border-white/5 rounded-[2rem] shadow-2xl relative overflow-hidden transition-all duration-300 flex-shrink-0">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-8 relative z-10">
        <div className="flex flex-col gap-2 w-full md:w-auto">
          <div className="text-5xl font-semibold tracking-tight text-white">
            {now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })}
            <span className="text-2xl text-white/50 ml-1">:{now.getSeconds().toString().padStart(2, '0')}</span>
          </div>
          <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-3 mt-2">
            <span className="flex items-center gap-2">
              <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${pulseColor}`}></span>
              SYSTEM SYNC ({mode})
            </span>
            <span className="px-3 py-1 bg-black/40 rounded-full border border-white/5 text-white/80">
              {lastRefresh ? lastRefresh.toLocaleTimeString('en-US', { hour12: false }) : "CONNECTING..."}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 w-full md:w-auto">
          {sessions.map((s) => (
            <div key={s.name} className={`px-5 py-3 border rounded-xl flex flex-col items-center justify-center transition-all duration-500 ${
              s.isActive 
                ? `${isCrypto ? 'bg-blue-500/10 border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.1)]' : 'bg-emerald-500/10 border-emerald-500/30 shadow-[0_0_15px_rgba(52,211,153,0.1)]'}` 
                : 'bg-black/40 border-white/5 opacity-60'
            }`}>
              <span className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${s.isActive ? (isCrypto ? 'text-blue-400' : 'text-emerald-400') : 'text-zinc-500'}`}>
                {s.name}
              </span>
              <span className="text-[10px] text-zinc-500 font-medium">{s.open} - {s.close}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 relative z-10">
        <div className="flex justify-between text-[10px] text-zinc-500 font-bold mb-3 uppercase tracking-widest">
          <span>AI ENGINE M15 CYCLE</span>
          <span>{15 - (minutes % 15)}m {(60 - seconds) % 60}s REMAINING</span>
        </div>
        <div className="w-full h-2 bg-black/60 rounded-full overflow-hidden border border-white/5">
          <div 
            className={`h-full rounded-full transition-all duration-1000 ease-linear bg-gradient-to-r ${gradientStart} ${gradientEnd}`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
};

// === SIDEBAR ITEM COMPONENTS ===

interface SidebarItemProps { ticker: string; prob?: number; isActive: boolean; isFavorite: boolean; onClick: () => void; onToggleFavorite: (ticker: string) => void; isOverlay?: boolean; dragListeners?: any; dragAttributes?: any; setNodeRef?: (node: HTMLElement | null) => void; style?: React.CSSProperties; }

const SidebarItemNode = ({ ticker, prob, isActive, isFavorite, onClick, onToggleFavorite, isOverlay, dragListeners, dragAttributes, setNodeRef, style }: SidebarItemProps) => {
  const displayTicker = ticker === "XAUUSD" ? "GOLD" : ticker;
  let probColor = "text-zinc-500";
  let pairDir = "NEUTRAL";

  if (prob !== undefined) {
      if (prob >= 0.52) pairDir = "BUY";
      else if (prob <= 0.48 && prob > 0) pairDir = "SELL";
      probColor = pairDir === "BUY" ? (isActive ? "text-emerald-400" : "text-emerald-500/80") : (isActive ? "text-red-400" : "text-red-500/80");
  }

  let containerClasses = `w-full text-left px-3 py-3 rounded-xl transition-all duration-300 flex justify-between items-center group border cursor-pointer `;
  if (isOverlay) containerClasses += `bg-[#0a0a0a] border-white/20 shadow-2xl ring-1 ring-white/10 scale-105 rotate-2 z-50`;
  else if (isActive) containerClasses += pairDir === 'SELL' ? 'bg-red-500/10 border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.05)] ' : 'bg-emerald-500/10 border-emerald-500/20 shadow-[0_0_15px_rgba(52,211,153,0.05)] ';
  else containerClasses += 'border-transparent hover:bg-white/5';

  return (
    <div ref={setNodeRef} style={style} className={containerClasses} onClick={!isOverlay ? onClick : undefined}>
      <div className="flex items-center gap-2">
        {isFavorite ? (
          <div {...dragListeners} {...dragAttributes} onClick={(e) => e.stopPropagation()} className={`cursor-grab active:cursor-grabbing text-zinc-600 hover:text-white transition-colors touch-none ${isOverlay ? 'text-white' : 'opacity-0 group-hover:opacity-100'}`}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="12" r="1"/><circle cx="9" cy="5" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="19" r="1"/></svg>
          </div>
        ) : <div className="w-[14px]"></div>}
        <span className={`font-semibold tracking-wide text-xs ${isActive || isOverlay ? 'text-white' : 'text-zinc-400 group-hover:text-white'}`}>{displayTicker}</span>
      </div>
      <div className="flex items-center gap-3">
        <span className={`text-[10px] font-bold tracking-widest ${probColor}`}>{`${((prob ?? 0) * 100).toFixed(0)}%`}</span>
        <button onClick={(e) => { e.stopPropagation(); onToggleFavorite(ticker); }} className={`transition-all duration-300 hover:scale-110 ${isFavorite ? 'text-zinc-300 hover:text-red-400' : 'text-zinc-600 hover:text-white'}`} title={isFavorite ? "Remove from Favorites" : "Add to Favorites"}>
          <svg className="w-4 h-4" fill={isFavorite ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
        </button>
      </div>
    </div>
  );
};

const SortableSidebarItem = (props: any) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: props.ticker });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0 : 1 };
  return <SidebarItemNode {...props} dragListeners={listeners} dragAttributes={attributes} setNodeRef={setNodeRef} style={style} />;
};

const ArbSidebarItemNode = ({ data, isActive, onClick, type }: { data: any, isActive: boolean, onClick: () => void, type: 'spatial' | 'triangular' | 'funding' }) => {
  let containerClasses = `w-full text-left px-4 py-3 rounded-xl transition-all duration-300 flex flex-col justify-between group border cursor-pointer `;
  
  if (isActive) {
    if (type === 'spatial') containerClasses += 'bg-blue-500/10 border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.1)]';
    else if (type === 'triangular') containerClasses += 'bg-purple-500/10 border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.1)]';
    else containerClasses += 'bg-orange-500/10 border-orange-500/30 shadow-[0_0_15px_rgba(249,115,22,0.1)]';
  } else containerClasses += 'border-transparent hover:bg-white/5';

  if (type === 'spatial') {
    return (
      <div className={containerClasses} onClick={onClick}>
        <div className="flex justify-between items-center w-full mb-1">
          <div className="flex items-center gap-2">
            <span className={`font-bold tracking-wide text-xs ${isActive ? 'text-white' : 'text-zinc-300 group-hover:text-white'}`}>{data.asset}</span>
            <div className={`w-1.5 h-1.5 rounded-full ${data.status === 'ACTIVE' ? 'bg-emerald-400 animate-pulse' : data.status === 'DEGRADING' ? 'bg-yellow-400' : 'bg-red-400'}`}></div>
          </div>
          <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">{data.spreadPercent > 0 ? '+' : ''}{data.spreadPercent.toFixed(2)}%</span>
        </div>
        <div className="flex items-center text-[10px] font-medium text-zinc-500 uppercase tracking-widest">
          <span>{data.buyExchange}</span><svg className="w-3 h-3 mx-1 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg><span>{data.sellExchange}</span>
        </div>
      </div>
    );
  } else if (type === 'triangular') {
    return (
      <div className={containerClasses} onClick={onClick}>
        <div className="flex justify-between items-center w-full mb-2">
          <div className="flex items-center gap-2">
            <span className={`font-bold tracking-wide text-[11px] ${isActive ? 'text-white' : 'text-zinc-300 group-hover:text-white'}`}>{data.id}</span>
            <div className={`w-1.5 h-1.5 rounded-full ${data.status === 'ACTIVE' ? 'bg-purple-400 animate-pulse' : data.status === 'DEGRADING' ? 'bg-yellow-400' : 'bg-red-400'}`}></div>
          </div>
          <span className="text-[10px] font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">{data.expectedProfitPercent > 0 ? '+' : ''}{data.expectedProfitPercent.toFixed(2)}%</span>
        </div>
        <div className="text-[9px] font-mono text-zinc-500 break-words">{data.pairName}</div>
      </div>
    );
  } else {
    return (
      <div className={containerClasses} onClick={onClick}>
        <div className="flex justify-between items-center w-full mb-1">
          <div className="flex items-center gap-2">
            <span className={`font-bold tracking-wide text-xs ${isActive ? 'text-white' : 'text-zinc-300 group-hover:text-white'}`}>{data.asset}</span>
            <div className={`w-1.5 h-1.5 rounded-full ${data.status === 'ACTIVE' ? 'bg-orange-400 animate-pulse' : data.status === 'DEGRADING' ? 'bg-yellow-400' : 'bg-red-400'}`}></div>
          </div>
          <span className="text-[10px] font-bold text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/20">{(data.netYield * 100).toFixed(2)}% APY</span>
        </div>
        <div className="flex items-center text-[9px] font-medium text-zinc-500 mt-1 uppercase tracking-widest">
          L: {data.optimalLong} / S: {data.optimalShort}
        </div>
      </div>
    );
  }
};

// === MAIN APPLICATION ===
export default function Home() {
  const [data, setData] = useState<DashboardData>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  
  // Modes & States
  const [marketMode, setMarketMode] = useState<'FOREX' | 'CRYPTO' | null>(null);
  const [cryptoMode, setCryptoMode] = useState<'standard' | 'spatial_arb' | 'triangular_arb' | 'funding_rates'>('standard');
  const [rightPanelMode, setRightPanelMode] = useState<'news' | 'whales'>('news');
  const [activePair, setActivePair] = useState<string>("EURUSD"); 
  
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    'Major Liquidity': true, 'Cross Pairs': true, 'Precious Metals': true, 'Crypto Assets': true
  });

  const [favorites, setFavorites] = useState<string[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  
  const [showLanding, setShowLanding] = useState<boolean>(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [showAuthGate, setShowAuthGate] = useState<boolean>(false);
  const [nickname, setNickname] = useState('');
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const savedUser = localStorage.getItem('algory_user');
    if (savedUser) setIsAuthenticated(true);
    const savedFavs = localStorage.getItem('algory_favorites');
    if (savedFavs) { try { setFavorites(JSON.parse(savedFavs)); } catch (e) {} }
  }, []);

  useEffect(() => { if (isMounted) localStorage.setItem('algory_favorites', JSON.stringify(favorites)); }, [favorites, isMounted]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setEmailError("Please enter a valid email address."); return; }
    setEmailError(null);
    if (!nickname || !email) return;
    setIsSubmitting(true);
    try {
      const FIREBASE_USERS_URL = "https://algory-87b19-default-rtdb.europe-west1.firebasedatabase.app/users.json";
      const userData = { nickname, email, registeredAt: new Date().toISOString() };
      await fetch(FIREBASE_USERS_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(userData) });
      localStorage.setItem('algory_user', JSON.stringify(userData));
      setIsAuthenticated(true);
      setShowAuthGate(false);
    } catch (err) {} finally { setIsSubmitting(false); }
  };

  useEffect(() => {
    const loadData = () => {
      fetch(`https://algory-87b19-default-rtdb.europe-west1.firebasedatabase.app/results.json?t=${new Date().getTime()}`)
        .then(res => res.json())
        .then(jsonData => { setData(jsonData || {}); setLastRefresh(new Date()); setError(null); })
        .catch(() => setError("Failed to sync"))
        .finally(() => setLoading(false));
    };
    if (isAuthenticated || showAuthGate) {
       loadData();
       const interval = setInterval(loadData, 15 * 60 * 1000);
       return () => clearInterval(interval);
    }
  }, [isAuthenticated, showAuthGate]);

  const toggleFavorite = (ticker: string) => { setFavorites(prev => prev.includes(ticker) ? prev.filter(t => t !== ticker) : [...prev, ticker]); };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragStart = (event: DragStartEvent) => setActiveDragId(event.active.id as string);
  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDragId(null);
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = favorites.indexOf(active.id as string);
      const newIndex = favorites.indexOf(over.id as string);
      if (oldIndex !== -1 && newIndex !== -1) setFavorites((items) => arrayMove(items, oldIndex, newIndex));
    }
  };

  const getSidebarIcon = (title: string) => {
    if (title.includes('Liquidity')) return <svg className="w-3.5 h-3.5 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z" /></svg>;
    if (title.includes('Cross')) return <svg className="w-3.5 h-3.5 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5" /></svg>;
    if (title.includes('Metals')) return <svg className="w-3.5 h-3.5 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><polygon points="12 2 2 7 12 22 22 7 12 2" /></svg>;
    if (title.includes('Crypto Assets')) return <svg className="w-3.5 h-3.5 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>;
    return null;
  };

  const renderSidebarGroup = (title: string, pairs: Record<string, number> | undefined, tooltipInfo?: string) => {
    const finalPairs = title === 'Crypto Assets' && (!pairs || Object.keys(pairs).length === 0) ? MOCK_CRYPTO_PAIRS : pairs;
    if (!finalPairs || Object.keys(finalPairs).length === 0) return null;
    
    const availablePairs = Object.entries(finalPairs).filter(([ticker]) => !favorites.includes(ticker)).sort((a, b) => b[1] - a[1]);
    const isOpen = openGroups[title]; 

    return (
      <div className="mb-6">
        <div className="w-full flex items-center justify-between px-6 py-2 mb-3 group">
          <button onClick={() => setOpenGroups(prev => ({ ...prev, [title]: !prev[title] }))} className="flex items-center gap-2 cursor-pointer outline-none">
            {getSidebarIcon(title)}
            <span className="text-[10px] font-bold text-zinc-500 group-hover:text-zinc-300 uppercase tracking-widest transition-colors flex items-center">
              {title}
              {tooltipInfo && <InfoTooltip info={tooltipInfo} />}
            </span>
          </button>
          <svg className={`w-3.5 h-3.5 text-zinc-600 transition-transform duration-300 ${isOpen ? 'rotate-180' : 'rotate-0'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
        </div>
        <div className={`space-y-1.5 px-3 overflow-hidden transition-all duration-500 ease-in-out ${isOpen ? 'max-h-[1500px] opacity-100' : 'max-h-0 opacity-0'}`}>
          {availablePairs.map(([ticker, prob]) => (
            <SidebarItemNode key={ticker} ticker={ticker} prob={prob} isActive={activePair === ticker} isFavorite={false} onClick={() => setActivePair(ticker)} onToggleFavorite={toggleFavorite} />
          ))}
        </div>
      </div>
    );
  };

  const renderFavorites = () => {
    const fallbackCrypto = data.crypto && Object.keys(data.crypto).length > 0 ? data.crypto : MOCK_CRYPTO_PAIRS;
    const allPairsMap = { ...data.majors, ...data.minors, ...data.metals, ...fallbackCrypto };
    
    const relevantFavs = favorites.filter(ticker => {
      const isCryptoTicker = Object.keys(fallbackCrypto || {}).includes(ticker);
      if (marketMode === 'CRYPTO') return isCryptoTicker;
      if (marketMode === 'FOREX') return !isCryptoTicker;
      return true;
    });

    if (relevantFavs.length === 0) return (
      <div className="w-full text-[10px] uppercase tracking-widest font-bold px-4 py-8 border border-dashed rounded-xl text-center flex flex-col items-center justify-center gap-2 transition-all duration-300 border-zinc-800 text-zinc-600">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
        CLICK STAR TO PIN
      </div>
    );

    return relevantFavs.map(ticker => <SortableSidebarItem key={ticker} ticker={ticker} prob={allPairsMap[ticker] || 0} isActive={activePair === ticker} isFavorite={true} onClick={() => setActivePair(ticker)} onToggleFavorite={toggleFavorite} />);
  };

  if (!marketMode) {
    return (
      <div className="flex flex-col items-center justify-center h-screen w-full bg-[#050505] text-white relative overflow-hidden font-sans">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-zinc-900/20 via-[#050505] to-[#050505] pointer-events-none" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-[120px] pointer-events-none animate-pulse" />
        <div className="relative z-10 flex flex-col items-center text-center animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <div className="flex items-center gap-3 mb-6">
            <span className="relative flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-zinc-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-zinc-500"></span></span>
            <span className="text-[10px] font-bold text-zinc-400 tracking-[0.3em] uppercase">SYSTEM READY</span>
          </div>
          <h1 className="text-7xl md:text-9xl font-bold tracking-tighter text-white drop-shadow-2xl">Algory<span className="text-zinc-500">.</span></h1>
          <p className="mt-8 text-zinc-400 text-sm md:text-lg tracking-[0.2em] uppercase max-w-xl leading-relaxed">SELECT YOUR MARKET ENVIRONMENT</p>
          <div className="flex flex-col md:flex-row gap-6 mt-16">
            <button onClick={() => { setMarketMode('FOREX'); setActivePair("EURUSD"); if(!isAuthenticated) setShowAuthGate(true); }} className="group relative px-10 py-6 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-2xl font-bold text-sm tracking-widest uppercase transition-all duration-300 shadow-[0_0_30px_rgba(52,211,153,0.1)] hover:bg-emerald-500/20 hover:shadow-[0_0_40px_rgba(52,211,153,0.25)] hover:-translate-y-1">
              <div className="flex flex-col items-center gap-3"><svg className="w-8 h-8 opacity-80 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z" /></svg><span>FOREX & METALS</span></div>
            </button>
            <button onClick={() => { setMarketMode('CRYPTO'); setCryptoMode('standard'); setActivePair("BTCUSD"); if(!isAuthenticated) setShowAuthGate(true); }} className="group relative px-10 py-6 bg-blue-500/10 text-blue-400 border border-blue-500/30 rounded-2xl font-bold text-sm tracking-widest uppercase transition-all duration-300 shadow-[0_0_30px_rgba(59,130,246,0.1)] hover:bg-blue-500/20 hover:shadow-[0_0_40px_rgba(59,130,246,0.25)] hover:-translate-y-1">
              <div className="flex flex-col items-center gap-3"><svg className="w-8 h-8 opacity-80 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg><span>CRYPTO ASSETS</span></div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (showAuthGate && !isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center h-screen w-full bg-[#050505] text-white relative overflow-hidden font-sans">
        <form onSubmit={handleRegister} className="relative z-10 w-full max-w-md p-10 bg-white/[0.02] backdrop-blur-2xl border border-white/5 rounded-[2rem] shadow-2xl flex flex-col gap-6 animate-in fade-in zoom-in-95 duration-500">
          <div className="text-center mb-4"><h2 className="text-2xl font-bold tracking-tight text-white mb-2">REQUEST ACCESS</h2><p className="text-[10px] text-zinc-400 uppercase tracking-widest">CONNECT TO ALGORY ENGINE</p></div>
          <div className="flex flex-col gap-2"><label className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest ml-1">TRADER NICKNAME</label><input type="text" required value={nickname} onChange={(e) => setNickname(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500/50 transition-all" placeholder="e.g. AlgoMaster99" /></div>
          <div className="flex flex-col gap-2"><label className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest ml-1">EMAIL ADDRESS</label><input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={`w-full bg-black/50 border ${emailError ? 'border-red-500/50' : 'border-white/10'} rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500/50 transition-all`} placeholder="name@domain.com" />{emailError && <span className="text-[10px] text-red-400 font-medium ml-1">{emailError}</span>}</div>
          <button type="submit" disabled={isSubmitting} className="mt-4 w-full py-4 bg-emerald-500 text-black font-bold text-[10px] tracking-widest uppercase rounded-xl transition-all hover:bg-emerald-400 hover:-translate-y-1 hover:shadow-lg disabled:opacity-50">{isSubmitting ? "CONNECTING..." : "ENTER TERMINAL"}</button>
        </form>
      </div>
    );
  }

  // --- LOGIC FOR CARD RENDERING ---
  const getProbForTicker = (ticker: string) => {
    const fallbackCrypto = data.crypto && Object.keys(data.crypto).length > 0 ? data.crypto : MOCK_CRYPTO_PAIRS;
    return data.majors?.[ticker] ?? data.minors?.[ticker] ?? data.metals?.[ticker] ?? fallbackCrypto?.[ticker] ?? 0;
  };
  
  const activeProb = getProbForTicker(activePair);
  const activeParams = data.parameters?.[activePair];
  const displayTicker = activePair === "XAUUSD" ? "GOLD (XAUUSD)" : activePair;

  const clampedProb = Math.max(0, Math.min(1, activeProb));
  const gaugeRotation = (clampedProb * 180) - 90; 

  let inferredDirection = "NEUTRAL";
  let isTradeActive = false;

  if (clampedProb >= 0.52) { inferredDirection = "BUY"; isTradeActive = true; } 
  else if (clampedProb <= 0.48 && clampedProb > 0) { inferredDirection = "SELL"; isTradeActive = true; }

  const needleColor = inferredDirection === 'BUY' ? '#34d399' : inferredDirection === 'SELL' ? '#f87171' : '#a1a1aa';

  const getPageBackground = () => {
    if (marketMode === 'CRYPTO' && cryptoMode !== 'standard') return 'from-blue-950/20 via-[#0a0a0a] to-[#050505]';
    if (inferredDirection === 'BUY') return marketMode === 'CRYPTO' ? 'from-blue-950/20 via-[#0a0a0a] to-[#050505]' : 'from-emerald-950/20 via-[#0a0a0a] to-[#050505]';
    if (inferredDirection === 'SELL') return 'from-red-950/20 via-[#0a0a0a] to-[#050505]';
    return 'from-[#050505] via-[#0a0a0a] to-[#050505]';
  };
  
  const getGlowColor = () => {
    if (marketMode === 'CRYPTO' && cryptoMode !== 'standard') return 'shadow-[0_0_60px_rgba(59,130,246,0.05)]';
    if (inferredDirection === 'BUY') return marketMode === 'CRYPTO' ? 'shadow-[0_0_60px_rgba(59,130,246,0.05)]' : 'shadow-[0_0_60px_rgba(52,211,153,0.05)]';
    if (inferredDirection === 'SELL') return 'shadow-[0_0_60px_rgba(239,68,68,0.05)]';
    return 'shadow-2xl';
  };

  const displayedNews = marketMode === 'FOREX' ? FOREX_NEWS_MOCK : CRYPTO_NEWS_MOCK;

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(39, 39, 42, 0.8); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(63, 63, 70, 1); }
      `}} />

      {/* MAIN LAYOUT WRAPPER */}
      <div className="flex h-screen w-full bg-[#050505] text-zinc-200 selection:bg-emerald-500/30 overflow-hidden font-sans animate-in fade-in duration-700 min-w-[1024px]">
        
        {/* LEFT SIDEBAR (FIXED WIDTH, FLEX-SHRINK-0) */}
        <aside className="w-80 flex-shrink-0 border-r border-white/10 bg-[#050505] flex flex-col h-full z-20 hidden md:flex overflow-hidden">
          <div className="p-8 pb-4 border-b border-white/5 mb-4 flex-shrink-0">
            <h2 className="text-3xl font-semibold tracking-tighter text-white cursor-pointer hover:opacity-80 transition-opacity" onClick={() => setMarketMode(null)}>
              Algory<span className={marketMode === 'CRYPTO' ? 'text-blue-500' : 'text-emerald-500'}>.</span>
            </h2>
            
            <div className="flex bg-black/60 rounded-xl p-1 mt-6 border border-white/5">
              <button onClick={() => { setMarketMode('FOREX'); setActivePair("EURUSD"); }} className={`flex-1 text-[10px] font-bold tracking-widest uppercase py-2 rounded-lg transition-all ${marketMode === 'FOREX' ? 'bg-white/10 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}>FOREX</button>
              <button onClick={() => { setMarketMode('CRYPTO'); setCryptoMode('standard'); setActivePair("BTCUSD"); }} className={`flex-1 text-[10px] font-bold tracking-widest uppercase py-2 rounded-lg transition-all ${marketMode === 'CRYPTO' ? 'bg-white/10 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}>CRYPTO</button>
            </div>

            {marketMode === 'CRYPTO' && (
              <div className="flex flex-wrap gap-1 bg-[#0a0a0a] rounded-xl p-1 mt-3 border border-white/5 shadow-inner">
                <button onClick={() => { setCryptoMode('standard'); setActivePair("BTCUSD"); }} className={`flex-1 min-w-[45%] text-[9px] font-bold tracking-widest uppercase py-1.5 rounded-lg transition-all ${cryptoMode === 'standard' ? 'bg-zinc-800 text-white shadow' : 'text-zinc-500 hover:text-zinc-300'}`}>STANDARD</button>
                <button onClick={() => { setCryptoMode('spatial_arb'); setActivePair("ARB-BTC-1"); }} className={`flex-1 min-w-[45%] text-[9px] font-bold tracking-widest uppercase py-1.5 rounded-lg transition-all ${cryptoMode === 'spatial_arb' ? 'bg-zinc-800 text-white shadow' : 'text-zinc-500 hover:text-zinc-300'}`}>SPATIAL</button>
                <button onClick={() => { setCryptoMode('triangular_arb'); setActivePair("TRI-1"); }} className={`flex-1 min-w-[45%] text-[9px] font-bold tracking-widest uppercase py-1.5 rounded-lg transition-all ${cryptoMode === 'triangular_arb' ? 'bg-zinc-800 text-white shadow' : 'text-zinc-500 hover:text-zinc-300'}`}>TRIANGLE</button>
                <button onClick={() => { setCryptoMode('funding_rates'); setActivePair("FUND-SOL"); }} className={`flex-1 min-w-[45%] text-[9px] font-bold tracking-widest uppercase py-1.5 rounded-lg transition-all ${cryptoMode === 'funding_rates' ? 'bg-zinc-800 text-white shadow' : 'text-zinc-500 hover:text-zinc-300'}`}>FUNDING</button>
              </div>
            )}
          </div>

          <nav className="flex-1 overflow-y-auto pb-10 custom-scrollbar pr-2 pl-2 flex flex-col">
            
            {marketMode === 'CRYPTO' && cryptoMode === 'spatial_arb' ? (
              <div className="pb-20">
                <div className="mb-6">
                  <div className="w-full flex items-center justify-between px-6 py-2 mb-3">
                    <div className="flex items-center gap-2">
                      <svg className="w-3.5 h-3.5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                      <span className="text-[10px] font-bold text-blue-500/80 uppercase tracking-widest flex items-center">SPATIAL ARBITRAGE <InfoTooltip info="Exploits price differences of the same asset across different exchanges (e.g., Buy on Binance, Sell on Kraken)." /></span>
                    </div>
                  </div>
                  <div className="space-y-2 px-3">
                    {Object.values(MOCK_SPATIAL_ARB).map((arb) => (
                       <ArbSidebarItemNode key={arb.id} data={arb} isActive={activePair === arb.id} onClick={() => setActivePair(arb.id)} type="spatial" />
                    ))}
                  </div>
                </div>
              </div>
            ) : marketMode === 'CRYPTO' && cryptoMode === 'triangular_arb' ? (
              <div className="pb-20">
                <div className="mb-6">
                  <div className="w-full flex items-center justify-between px-6 py-2 mb-3">
                    <div className="flex items-center gap-2">
                      <svg className="w-3.5 h-3.5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                      <span className="text-[10px] font-bold text-purple-500/80 uppercase tracking-widest flex items-center">TRIANGULAR LOOPS <InfoTooltip info="Executes a sequence of three trades on a single exchange to profit from currency cross-rate inefficiencies (e.g., USDT -> BTC -> ETH -> USDT)." /></span>
                    </div>
                  </div>
                  <div className="space-y-2 px-3">
                    {Object.values(MOCK_TRIANGULAR_ARB).map((arb) => (
                       <ArbSidebarItemNode key={arb.id} data={arb} isActive={activePair === arb.id} onClick={() => setActivePair(arb.id)} type="triangular" />
                    ))}
                  </div>
                </div>
              </div>
            ) : marketMode === 'CRYPTO' && cryptoMode === 'funding_rates' ? (
              <div className="pb-20">
                <div className="mb-6">
                  <div className="w-full flex items-center justify-between px-6 py-2 mb-3">
                    <div className="flex items-center gap-2">
                      <svg className="w-3.5 h-3.5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      <span className="text-[10px] font-bold text-orange-500/80 uppercase tracking-widest flex items-center">CROSS-EXCHANGE RATES <InfoTooltip info="A delta-neutral strategy where you open opposing positions on two derivatives exchanges to capture the interest payments (funding fees) paid between long and short traders." /></span>
                    </div>
                  </div>
                  <div className="space-y-2 px-3">
                    {Object.values(MOCK_FUNDING_RATES).map((arb) => (
                       <ArbSidebarItemNode key={arb.id} data={arb} isActive={activePair === arb.id} onClick={() => setActivePair(arb.id)} type="funding" />
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <>
                <DndContext sensors={sensors} collisionDetection={customCollisionDetection} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                  <div className={`mb-6 mt-2 pb-4 pt-2 rounded-2xl transition-colors duration-300 w-full`}>
                    <div className={`text-[10px] font-bold uppercase tracking-widest px-6 mb-3 flex items-center gap-2 ${marketMode === 'CRYPTO' ? 'text-blue-500/90' : 'text-emerald-500/90'}`}>
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg> FAVORITES
                    </div>
                    <div className="px-3 w-full space-y-1.5 min-h-[60px]">
                      <SortableContext items={favorites} strategy={verticalListSortingStrategy}>{renderFavorites()}</SortableContext>
                    </div>
                  </div>
                  <DragOverlay dropAnimation={{ duration: 250, easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)' }}>
                    {activeDragId ? <SidebarItemNode ticker={activeDragId} prob={getProbForTicker(activeDragId)} isActive={activePair === activeDragId} isFavorite={true} onClick={() => {}} onToggleFavorite={() => {}} isOverlay /> : null}
                  </DragOverlay>
                </DndContext>

                <div className="pb-20 flex-1">
                  {marketMode === 'FOREX' ? (
                    <>{renderSidebarGroup('Major Liquidity', data.majors, "Trading the most liquid fiat currency pairs globally, driven by macroeconomic data and central bank policies.")}{renderSidebarGroup('Cross Pairs', data.minors)}{renderSidebarGroup('Precious Metals', data.metals)}</>
                  ) : (
                    <>{renderSidebarGroup('Crypto Assets', data.crypto && Object.keys(data.crypto).length > 0 ? data.crypto : MOCK_CRYPTO_PAIRS)}</>
                  )}
                </div>
              </>
            )}

          </nav>
        </aside>

        {/* MAIN PANEL (FLEX-1, MIN-W-0) */}
        <main className={`flex-1 min-w-0 h-full overflow-y-auto custom-scrollbar px-6 pt-12 pb-24 lg:px-12 lg:pt-20 scroll-smooth transition-colors duration-1000 ease-in-out bg-gradient-to-br ${getPageBackground()}`}>
          <div className="max-w-[1400px] mx-auto w-full">
            
            <MarketMonitor lastRefresh={lastRefresh} mode={marketMode === 'CRYPTO' ? `CRYPTO (${cryptoMode.toUpperCase()})` : 'FOREX'} />

            {loading && !data.majors ? (
              <div className="p-20 mt-10 text-center flex flex-col items-center justify-center gap-6 border border-white/10 rounded-[2rem] bg-white/[0.02]">
                <div className={`w-10 h-10 border-4 border-t-transparent rounded-full animate-spin ${marketMode === 'CRYPTO' ? 'border-blue-500/30 border-t-blue-500' : 'border-emerald-500/30 border-t-emerald-500'}`}></div>
                <span className="text-[10px] text-zinc-400 font-bold tracking-widest uppercase">SYSTEM SCANNING...</span>
              </div>
            ) : error && !data.majors ? (
              <div className="p-10 mt-10 text-center text-[10px] uppercase font-bold text-red-400 border border-red-900/40 bg-red-950/20 rounded-[2rem]">{error}</div>
            ) : (
              <div className="flex flex-col xl:flex-row gap-10 mt-10 w-full">
                
                <div className="w-full xl:w-2/3 flex flex-col space-y-10">
                  
                  {marketMode === 'CRYPTO' && cryptoMode === 'spatial_arb' && MOCK_SPATIAL_ARB[activePair] ? (
                    <SpatialArbitragePanel arbData={MOCK_SPATIAL_ARB[activePair]} />
                  ) : marketMode === 'CRYPTO' && cryptoMode === 'triangular_arb' && MOCK_TRIANGULAR_ARB[activePair] ? (
                    <TriangularArbitragePanel arbData={MOCK_TRIANGULAR_ARB[activePair]} />
                  ) : marketMode === 'CRYPTO' && cryptoMode === 'funding_rates' && MOCK_FUNDING_RATES[activePair] ? (
                    <FundingRatesPanel data={MOCK_FUNDING_RATES[activePair]} />
                  ) : (
                    // === STANDARD MAIN PANEL (Chart + AI Analysis) ===
                    <>
                      <TradingChart symbol={activePair} />
                      
                      <div className={`bg-[#0a0a0a]/80 backdrop-blur-2xl border ${inferredDirection === 'SELL' ? 'border-red-500/20' : inferredDirection === 'BUY' ? (marketMode === 'CRYPTO' ? 'border-blue-500/20' : 'border-emerald-500/20') : 'border-white/5'} rounded-[2rem] overflow-hidden p-8 transition-all duration-700 ${getGlowColor()}`}>
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 border-b border-white/5 pb-8">
                          <div className="w-full">
                            <div className="flex items-center gap-4 mb-4">
                              <h2 className="text-4xl font-bold text-white tracking-tight">{displayTicker}</h2>
                              {isTradeActive && (
                                <span className={`px-4 py-1.5 text-[11px] font-bold uppercase tracking-widest rounded-lg border shadow-lg ${
                                  inferredDirection === 'BUY' 
                                    ? (marketMode === 'CRYPTO' ? 'bg-blue-500/10 text-blue-400 border-blue-500/30 shadow-blue-500/10' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-emerald-500/10') 
                                    : 'bg-red-500/10 text-red-400 border-red-500/30 shadow-red-500/10'
                                }`}>
                                  {inferredDirection} PENDING
                                </span>
                              )}
                              {activeParams?.KeyDriver && (
                                <span className="px-3 py-1 bg-white/5 text-white/80 text-[10px] uppercase tracking-widest rounded-lg border border-white/10 font-bold flex items-center shadow-inner">
                                  {activeParams.KeyDriver}
                                </span>
                              )}
                            </div>
                            
                            {activeParams && (
                              <div className="flex flex-wrap items-center gap-3 mt-4">
                                <span className="px-3 py-1.5 bg-black/40 rounded-lg border border-white/5 font-mono text-[11px] shadow-inner">
                                  <span className="text-zinc-500 mr-2 uppercase tracking-wider">SL</span>
                                  <span className="text-white font-bold">{activeParams.SL}</span>
                                </span>
                                <span className="px-3 py-1.5 bg-black/40 rounded-lg border border-white/5 font-mono text-[11px] shadow-inner">
                                  <span className="text-zinc-500 mr-2 uppercase tracking-wider">TP</span>
                                  <span className="text-white font-bold">{activeParams.TP === 9999 ? 'OPEN' : activeParams.TP}</span>
                                </span>
                                {activeParams.RRR && (
                                  <span className="px-3 py-1.5 bg-zinc-800/50 rounded-lg border border-zinc-700/50 font-mono text-[11px] shadow-inner">
                                    <span className="text-zinc-400 mr-2 uppercase tracking-wider font-bold">RRR</span>
                                    <span className="text-white font-bold">1:{activeParams.RRR}</span>
                                  </span>
                                )}
                                <span className="px-3 py-1.5 bg-black/40 rounded-lg border border-white/5 font-mono text-[11px] shadow-inner">
                                  <span className="text-zinc-500 mr-2 uppercase tracking-wider">BE</span>
                                  <span className="text-white font-bold">{activeParams.BE}</span>
                                </span>
                                <span className="px-3 py-1.5 bg-black/40 rounded-lg border border-white/5 font-mono text-[11px] shadow-inner">
                                  <span className="text-zinc-500 mr-2 uppercase tracking-wider">SPREAD</span>
                                  <span className="text-white font-bold">{activeParams.LiveSpread !== "N/A" ? activeParams.LiveSpread : activeParams.MaxSpread}</span>
                                </span>
                              </div>
                            )}
                            {activeParams && <PositionCalculator slPips={activeParams.SL} direction={inferredDirection} />}
                          </div>

                          <div className="flex flex-col items-center gap-6 flex-shrink-0">
                            <div className="flex flex-col items-center justify-center relative w-56 h-28 mt-2">
                              <svg viewBox="0 0 200 120" className="w-full h-full drop-shadow-2xl overflow-visible">
                                <defs><filter id="glow" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="3" result="blur" /><feComposite in="SourceGraphic" in2="blur" operator="over" /></filter></defs>
                                <path d="M 30 100 A 70 70 0 0 1 100 30" fill="none" stroke="#ef4444" strokeWidth="6" strokeLinecap="round" strokeOpacity="0.8" />
                                <path d="M 100 30 A 70 70 0 0 1 170 100" fill="none" stroke="#10b981" strokeWidth="6" strokeLinecap="round" strokeOpacity="0.8" />
                                <g style={{ transform: `rotate(${gaugeRotation}deg)`, transformOrigin: '100px 100px' }} className="transition-transform duration-[1500ms] ease-[cubic-bezier(0.34,1.56,0.64,1)]">
                                  <line x1="100" y1="100" x2="100" y2="35" stroke={needleColor} strokeWidth="3.5" strokeLinecap="round" filter="url(#glow)" strokeOpacity="0.9" />
                                  <circle cx="100" cy="100" r="7" fill="#050505" stroke={needleColor} strokeWidth="2.5" />
                                </g>
                              </svg>
                              <div className={`absolute bottom-[-10px] text-3xl font-black tracking-tighter ${
                                  inferredDirection === 'BUY' ? (marketMode === 'CRYPTO' ? 'text-blue-400' : 'text-emerald-400') :
                                  inferredDirection === 'SELL' ? 'text-red-400 drop-shadow-[0_0_15px_rgba(239,68,68,0.4)]' : 'text-zinc-500'
                              }`}>
                                {(activeProb * 100).toFixed(1)}%
                              </div>
                            </div>
                            {isTradeActive ? (
                              <ExecuteButton 
                                baseClass="w-full px-6 py-4 text-[11px] font-bold uppercase tracking-widest rounded-xl border shadow-xl transition-all hover:-translate-y-1"
                                defaultText={`EXECUTE ${inferredDirection}`}
                                colorTheme={inferredDirection === 'BUY' ? (marketMode === 'CRYPTO' ? 'blue' : 'emerald') : 'red'}
                              />
                            ) : (
                              <button disabled className="w-full px-6 py-4 bg-zinc-900/50 text-zinc-600 text-[11px] font-bold uppercase tracking-widest rounded-xl border border-white/5 cursor-not-allowed">
                                  LOW CONVICTION
                              </button>
                            )}
                          </div>
                        </div>

                        {activeParams?.aiAnalysis && (
                          <div className="grid md:grid-cols-2 gap-8 mb-8">
                            <div className="bg-black/40 border border-white/5 rounded-2xl p-6 transition-all hover:bg-black/60 shadow-inner">
                              <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-4 flex items-center justify-between">
                                <span className="flex items-center">PREVIOUS: {activeParams.aiAnalysis.prev_session}</span>
                                <span className="w-1.5 h-1.5 rounded-full bg-zinc-600"></span>
                              </div>
                              <p className="text-sm text-white/90 leading-loose font-medium">{activeParams.aiAnalysis.evaluation}</p>
                            </div>
                            <div className={`border rounded-2xl p-6 relative overflow-hidden transition-all duration-1000 shadow-inner ${
                                inferredDirection === 'SELL' ? 'bg-red-950/20 border-red-500/20' : 
                                inferredDirection === 'BUY' ? (marketMode === 'CRYPTO' ? 'bg-blue-950/20 border-blue-500/20' : 'bg-emerald-950/20 border-emerald-500/20') : 
                                'bg-black/40 border-white/5'
                            }`}>
                              <div className={`text-[10px] font-bold uppercase tracking-widest mb-4 flex items-center justify-between ${
                                  inferredDirection === 'SELL' ? 'text-red-400/80' : 
                                  inferredDirection === 'BUY' ? (marketMode === 'CRYPTO' ? 'text-blue-400/80' : 'text-emerald-400/80') : 'text-zinc-500'
                              }`}>
                                <span>PREDICTION: {activeParams.aiAnalysis.current_session}</span>
                                <span className="relative flex h-2 w-2">
                                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                                      inferredDirection === 'SELL' ? 'bg-red-400' : 
                                      inferredDirection === 'BUY' ? (marketMode === 'CRYPTO' ? 'bg-blue-400' : 'bg-emerald-400') : 'bg-zinc-600'
                                  }`}></span>
                                  <span className={`relative inline-flex rounded-full h-2 w-2 ${
                                      inferredDirection === 'SELL' ? 'bg-red-500' : 
                                      inferredDirection === 'BUY' ? (marketMode === 'CRYPTO' ? 'bg-blue-500' : 'bg-emerald-500') : 'bg-zinc-500'
                                  }`}></span>
                                </span>
                              </div>
                              <p className={`text-sm leading-loose font-medium relative z-10 ${inferredDirection !== 'NEUTRAL' ? 'text-white' : 'text-white/80'}`}>
                                {activeParams.aiAnalysis.prediction}
                              </p>
                            </div>
                          </div>
                        )}

                        {activeParams?.history && (
                          <div className="border-t border-white/5 pt-8 mt-2">
                            <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-6 flex items-center gap-2">
                              <svg className="w-4 h-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                              AI BACKTEST & SIGNAL HISTORY (LAST 5)
                            </div>
                            <div className="flex flex-wrap gap-3">
                              {activeParams.history.map((trade, idx) => (
                                <div key={idx} className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-inner transition-colors hover:bg-white/5 ${trade.result === 'WIN' ? 'bg-emerald-500/5 border-emerald-500/10' : 'bg-red-500/5 border-red-500/10'}`}>
                                  <span className="text-[10px] text-zinc-500 font-mono bg-black/40 px-2 py-1 rounded">{trade.date}</span>
                                  <span className="text-[10px] font-bold text-white/80">{trade.type}</span>
                                  <span className={`text-[10px] font-bold ${trade.result === 'WIN' ? 'text-emerald-400' : 'text-red-400'}`}>{trade.pips > 0 ? '+' : ''}{trade.pips} PIPS</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* LIQUIDATIONS BAR */}
                      {marketMode === 'CRYPTO' && cryptoMode === 'standard' && (
                        <LiquidationsBar />
                      )}
                    </>
                  )}

                </div>

                {/* RIGHT SIDEBAR (FIXED WIDTH, FLEX-SHRINK-0) */}
                <div className="w-full xl:w-80 flex-shrink-0 flex flex-col h-full">
                  <div className="bg-[#0a0a0a]/80 backdrop-blur-2xl border border-white/5 rounded-[2rem] overflow-hidden shadow-2xl transition-all duration-300 sticky top-8 flex flex-col max-h-[85vh]">
                    <div className="px-6 py-6 border-b border-white/5 bg-white/[0.01]">
                      
                      <div className="flex w-full bg-black/60 rounded-xl p-1 border border-white/5">
                        <button 
                          onClick={() => setRightPanelMode('news')} 
                          className={`flex-1 text-[10px] font-bold tracking-widest uppercase py-2 rounded-lg transition-all ${rightPanelMode === 'news' ? 'bg-white/10 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
                        >
                          MARKET NEWS
                        </button>
                        {marketMode === 'CRYPTO' && (
                          <button 
                            onClick={() => setRightPanelMode('whales')} 
                            className={`flex-1 text-[10px] font-bold tracking-widest uppercase py-2 rounded-lg transition-all flex items-center justify-center gap-2 ${rightPanelMode === 'whales' ? 'bg-white/10 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
                          >
                            WHALES 🚨
                          </button>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex flex-col p-4 overflow-y-auto custom-scrollbar flex-1">
                      {rightPanelMode === 'news' ? (
                        displayedNews && displayedNews.length > 0 ? (
                          displayedNews.map((item, idx) => (
                            <a key={idx} href={item.link} target="_blank" rel="noreferrer" className="block pb-5 mb-5 border-b border-white/5 last:border-0 last:mb-0 last:pb-0 group">
                              <div className="flex items-center gap-3 mb-2">
                                <div className={`w-2 h-2 rounded-full ${item.sentiment === 'positive' ? 'bg-emerald-500' : item.sentiment === 'negative' ? 'bg-red-500' : 'bg-zinc-500'}`} title={`Sentiment: ${item.sentiment}`} />
                                <span className="text-[10px] text-zinc-400 font-mono bg-black/60 px-2 py-1 rounded-md border border-white/5 shadow-inner">
                                  {item.time}
                                </span>
                                <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-md border shadow-inner ${
                                  item.publisher.toUpperCase() === 'COINDESK' ? 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' :
                                  item.publisher.toUpperCase() === 'FXSTREET' ? 'text-blue-400 bg-blue-500/10 border-blue-500/20' :
                                  'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                                }`}>
                                  {item.publisher}
                                </span>
                              </div>
                              <h4 className="text-sm font-medium text-white/70 leading-relaxed group-hover:text-white transition-colors mt-1">
                                {item.title}
                              </h4>
                            </a>
                          ))
                        ) : (
                          <div className="p-10 text-center text-[10px] text-zinc-500 font-bold uppercase tracking-widest flex flex-col items-center gap-4">
                            <svg className="animate-spin h-6 w-6 text-zinc-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                            SYSTEM SCANNING...
                          </div>
                        )
                      ) : (
                        // WHALE ALERTS LIST
                        WHALE_ALERTS_MOCK.map((alert) => (
                          <div key={alert.id} className="block pb-5 mb-5 border-b border-white/5 last:border-0 last:mb-0 last:pb-0">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] text-zinc-400 font-mono bg-black/60 px-2 py-1 rounded-md border border-white/5 shadow-inner">
                                  {alert.time}
                                </span>
                                <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-md border shadow-inner ${
                                  alert.type === 'bullish' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' :
                                  alert.type === 'bearish' ? 'text-red-400 bg-red-500/10 border-red-500/20' :
                                  'text-zinc-400 bg-zinc-500/10 border-zinc-500/20'
                                }`}>
                                  {alert.type}
                                </span>
                              </div>
                              <span className="text-[10px] font-mono font-bold text-white/90">{alert.amountUsd}</span>
                            </div>
                            <h4 className="text-sm font-medium text-white/70 leading-relaxed mt-1">
                              {alert.text}
                            </h4>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
                
              </div>
            )}
          </div>
        </main>
      </div>
    </>
  );
}