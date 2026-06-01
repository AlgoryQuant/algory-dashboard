"use client";

import React, { useState, useEffect } from 'react';
import { 
  DndContext, DragOverlay, closestCorners, DragStartEvent, DragEndEvent,
  defaultDropAnimationSideEffects, KeyboardSensor, PointerSensor, useSensor, useSensors
} from '@dnd-kit/core';
import { 
  arrayMove, SortableContext, sortableKeyboardCoordinates, 
  verticalListSortingStrategy, useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// === EXTERNAL COMPONENTS ===
import Sidebar from './Sidebar';
import NewsPanel from './NewsPanel';
import ChartArea from './ChartArea';
import { SpatialArbitragePanel, TriangularArbitragePanel, FundingRatesPanel, SpatialArbData, TriangularArbData, FundingRateData } from './ArbitragePanel';

// === INTERFACES ===
interface TradeHistory { date: string; type: string; result: 'WIN' | 'LOSS'; pips: number; }
interface AIAnalysis { evaluation: string; prediction: string; current_session: string; prev_session: string; }
interface DashboardData {
  majors?: Record<string, number>;
  minors?: Record<string, number>;
  metals?: Record<string, number>;
  crypto?: Record<string, number>;
  parameters?: Record<string, { SL: number; TP: number; Partial: number; BE: number; MaxSpread: number; LiveSpread: number | string; KeyDriver: string; Direction?: string; RRR?: number; aiAnalysis?: AIAnalysis; history?: TradeHistory[]; }>;
}

// === CENTRALIZED MOCK DATA ===
const generateSpreadHistory = (baseSpread: number, status: 'ACTIVE' | 'DEGRADING' | 'CLOSED') => {
  const data = [];
  let current = status === 'CLOSED' ? baseSpread + 1.5 : baseSpread - 0.5;
  for (let i = 24; i >= 0; i--) {
      data.push({ time: i === 0 ? 'Now' : `-${i}h`, spread: Number(Math.max(0, current).toFixed(2)) });
      if (status === 'ACTIVE') current += Math.random() * 0.15 - 0.05;
      else if (status === 'DEGRADING') current -= Math.random() * 0.2;
      else current -= Math.random() * 0.4;
  }
  return data;
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

const LIQUIDATIONS_MOCK = { longsRekt: 154200000, shortsRekt: 45800000 };

// === SHARED UI COMPONENTS ===
const AnimatedNumber = ({ value }: { value: number }) => {
  const safeValue = value || 0;
  const [displayValue, setDisplayValue] = useState(safeValue);

  useEffect(() => {
    let start = displayValue;
    const end = safeValue;
    if (start === end) return;
    const duration = 400;
    let startTime: number | null = null;
    let animationFrameId: number;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setDisplayValue(start + (end - start) * progress);
      if (progress < 1) animationFrameId = window.requestAnimationFrame(step);
    };
    animationFrameId = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(animationFrameId);
  }, [safeValue, displayValue]);

  return <>{displayValue.toFixed(2)}</>;
};

const ExecuteButton = ({ baseClass, defaultText, colorTheme, disabled = false }: { baseClass: string, defaultText: string, colorTheme: 'emerald' | 'red' | 'blue' | 'purple' | 'orange', disabled?: boolean }) => {
  const [state, setState] = useState<'idle' | 'loading' | 'success'>('idle');

  useEffect(() => {
    let t1: NodeJS.Timeout;
    let t2: NodeJS.Timeout;
    if (state === 'loading') { t1 = setTimeout(() => setState('success'), 1500); } 
    else if (state === 'success') { t2 = setTimeout(() => setState('idle'), 1000); }
    return () => { if (t1) clearTimeout(t1); if (t2) clearTimeout(t2); };
  }, [state]);

  const handleClick = () => { if (state !== 'idle' || disabled) return; setState('loading'); };

  let bgClass = disabled ? 'bg-zinc-900/50 text-zinc-600 border border-white/5 cursor-not-allowed' :
    colorTheme === 'emerald' ? 'bg-emerald-500 hover:bg-emerald-400 text-black border-emerald-400 shadow-[0_5px_20px_rgba(52,211,153,0.2)] hover:-translate-y-1' :
    colorTheme === 'red' ? 'bg-red-500 hover:bg-red-400 text-white border-red-400 shadow-[0_5px_20px_rgba(239,68,68,0.2)] hover:-translate-y-1' :
    colorTheme === 'blue' ? 'bg-blue-500 hover:bg-blue-400 text-white border-blue-400 shadow-[0_5px_20px_rgba(59,130,246,0.2)] hover:-translate-y-1' :
    colorTheme === 'purple' ? 'bg-purple-500 hover:bg-purple-400 text-white border-purple-400 shadow-[0_5px_20px_rgba(168,85,247,0.2)] hover:-translate-y-1' :
    'bg-orange-500 hover:bg-orange-400 text-white border-orange-400 shadow-[0_5px_20px_rgba(249,115,22,0.2)] hover:-translate-y-1';

  return (
    <button onClick={handleClick} disabled={disabled || state !== 'idle'} className={`${baseClass} ${bgClass} flex items-center justify-center transition-all duration-300 relative overflow-hidden`}>
      <div className={`transition-all duration-300 ${state !== 'idle' ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`}>{defaultText}</div>
      <div className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${state === 'loading' ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
        <svg className="animate-spin h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
      </div>
      <div className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${state === 'success' ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}>
        <svg className="h-6 w-6 text-current" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
      </div>
    </button>
  );
};

const InfoTooltip = ({ info }: { info: string }) => (
  <span className="relative group/tt inline-flex items-center cursor-help ml-2">
    <span className="flex items-center justify-center w-3.5 h-3.5 text-[9px] border border-zinc-600 text-zinc-400 rounded-full hover:bg-zinc-700 hover:text-white transition-colors">i</span>
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-zinc-900 border border-white/10 text-white/90 text-xs rounded-xl shadow-2xl opacity-0 group-hover/tt:opacity-100 transition-all pointer-events-none z-50 font-normal normal-case tracking-normal text-left">
      {info}
      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-zinc-900" />
    </div>
  </span>
);

const MarketMonitor = ({ lastRefresh, mode }: { lastRefresh: Date | null, mode: string }) => {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const hour = now.getHours();
  const isCrypto = mode.includes('CRYPTO');
  const sessions = isCrypto ? [ { name: "Global Crypto Market", open: "24", close: "7", isActive: true } ] : [
    { name: "Sydney", open: "22:00", close: "07:00", isActive: hour >= 22 || hour < 7 },
    { name: "Tokyo", open: "00:00", close: "09:00", isActive: hour >= 0 && hour < 9 },
    { name: "London", open: "09:00", close: "17:30", isActive: hour >= 9 && hour < 17 },
    { name: "New York", open: "14:30", close: "22:00", isActive: hour >= 14 && hour < 22 },
  ];

  const minutes = now.getMinutes();
  const seconds = now.getSeconds();
  const progressPercent = (((minutes % 15) * 60 + seconds) / 900) * 100;

  let pulseColor = 'bg-emerald-400'; let gradientStart = 'from-emerald-600'; let gradientEnd = 'to-emerald-400';
  if (mode.includes('CRYPTO') && !mode.includes('TRIANGULAR') && !mode.includes('FUNDING')) { pulseColor = 'bg-blue-400'; gradientStart = 'from-blue-600'; gradientEnd = 'to-blue-400'; } 
  else if (mode.includes('TRIANGULAR')) { pulseColor = 'bg-purple-400'; gradientStart = 'from-purple-600'; gradientEnd = 'to-purple-400'; } 
  else if (mode.includes('FUNDING')) { pulseColor = 'bg-orange-400'; gradientStart = 'from-orange-600'; gradientEnd = 'to-orange-400'; }

  return (
    <div className="mb-6 p-8 bg-white/[0.02] backdrop-blur-3xl border border-white/5 rounded-[2rem] shadow-2xl relative overflow-hidden transition-all duration-300 flex-shrink-0 z-10">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-8 relative z-10">
        <div className="flex flex-col gap-2 w-full md:w-auto">
          <div className="text-5xl font-semibold tracking-tight text-white">
            {now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })}
            <span className="text-2xl text-white/50 ml-1">:{now.getSeconds().toString().padStart(2, '0')}</span>
          </div>
          <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-3 mt-2">
            <span className="flex items-center gap-2"><span className={`w-1.5 h-1.5 rounded-full animate-pulse ${pulseColor}`}></span>SYSTEM SYNC ({mode})</span>
            <span className="px-3 py-1 bg-black/40 rounded-full border border-white/5 text-white/80">{lastRefresh ? lastRefresh.toLocaleTimeString('en-US', { hour12: false }) : "CONNECTING..."}</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 w-full md:w-auto">
          {sessions.map((s) => (
            <div key={s.name} className={`px-5 py-3 border rounded-xl flex flex-col items-center justify-center transition-all duration-500 ${s.isActive ? `${isCrypto ? 'bg-blue-500/10 border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.1)]' : 'bg-emerald-500/10 border-emerald-500/30 shadow-[0_0_15px_rgba(52,211,153,0.1)]'}` : 'bg-black/40 border-white/5 opacity-60'}`}>
              <span className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${s.isActive ? (isCrypto ? 'text-blue-400' : 'text-emerald-400') : 'text-zinc-500'}`}>{s.name}</span>
              <span className="text-[10px] text-zinc-500 font-medium">{s.open} - {s.close}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 relative z-10">
        <div className="flex justify-between text-[10px] text-zinc-500 font-bold mb-3 uppercase tracking-widest">
          <span>AI ENGINE M15 CYCLE</span><span>{15 - (minutes % 15)}m {(60 - seconds) % 60}s REMAINING</span>
        </div>
        <div className="w-full h-2 bg-black/60 rounded-full overflow-hidden border border-white/5">
          <div className={`h-full rounded-full transition-all duration-1000 ease-linear bg-gradient-to-r ${gradientStart} ${gradientEnd}`} style={{ width: `${progressPercent}%` }} />
        </div>
      </div>
    </div>
  );
};

const LiquidationsBar = () => {
  const total = LIQUIDATIONS_MOCK.longsRekt + LIQUIDATIONS_MOCK.shortsRekt;
  const longPct = (LIQUIDATIONS_MOCK.longsRekt / total) * 100;
  const shortPct = (LIQUIDATIONS_MOCK.shortsRekt / total) * 100;

  return (
    <div className="w-full bg-[#0a0a0a]/80 backdrop-blur-2xl border border-white/5 rounded-[2rem] p-6 shadow-2xl relative z-10">
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
    <div className="p-6 bg-black/30 rounded-2xl border border-white/5 shadow-inner mt-6">
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
        <div className={`w-1/3 flex flex-col items-center justify-center py-2 px-4 rounded-lg border shadow-inner ${direction === 'BUY' ? 'bg-emerald-500/5 border-emerald-500/10' : direction === 'SELL' ? 'bg-red-500/5 border-red-500/10' : 'bg-zinc-900 border-white/5'}`}>
          <span className={`text-[10px] uppercase font-bold tracking-widest mb-1 ${direction === 'BUY' ? 'text-emerald-500/70' : direction === 'SELL' ? 'text-red-500/70' : 'text-zinc-500'}`}>VOLUME</span>
          <span className="text-xl font-bold text-white font-mono">{lotSize} <span className="text-xs text-zinc-500 font-normal font-sans tracking-normal">Lots</span></span>
        </div>
      </div>
    </div>
  );
};

// === SORTABLE WIDGET WRAPPER ===
const DraggableWidget = ({ id, children }: { id: string, children: React.ReactNode }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1, position: 'relative' as const, zIndex: isDragging ? 50 : 1 };

  return (
    <div ref={setNodeRef} style={style} className="w-full relative group/widget">
      <div {...attributes} {...listeners} className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#0a0a0a] border border-white/10 text-zinc-500 px-3 py-1 rounded-full cursor-grab active:cursor-grabbing opacity-0 group-hover/widget:opacity-100 transition-opacity z-50 flex items-center justify-center shadow-xl hover:text-white hover:border-white/20">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="12" r="1"/><circle cx="9" cy="5" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="19" r="1"/></svg>
      </div>
      {children}
    </div>
  );
};

// === ROOT ORCHESTRATOR ===
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
  const [mainLayout, setMainLayout] = useState<string[]>(['chart', 'ai_panel', 'liquidations']);
  
  const [isMounted, setIsMounted] = useState(false);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [activeWidgetDragId, setActiveWidgetDragId] = useState<string | null>(null);
  
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
    const savedLayout = localStorage.getItem('algory_main_layout');
    if (savedLayout) { try { setMainLayout(JSON.parse(savedLayout)); } catch (e) {} }
  }, []);

  useEffect(() => { 
    if (isMounted) {
      localStorage.setItem('algory_favorites', JSON.stringify(favorites)); 
      localStorage.setItem('algory_main_layout', JSON.stringify(mainLayout));
    }
  }, [favorites, mainLayout, isMounted]);

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
    let interval: NodeJS.Timeout;
    const loadData = () => {
      fetch(`https://algory-87b19-default-rtdb.europe-west1.firebasedatabase.app/results.json?t=${new Date().getTime()}`)
        .then(res => res.json())
        .then(jsonData => { setData(jsonData || {}); setLastRefresh(new Date()); setError(null); })
        .catch(() => setError("Failed to sync data stream."))
        .finally(() => setLoading(false));
    };
    if (isAuthenticated || showAuthGate) {
       loadData();
       interval = setInterval(loadData, 15 * 60 * 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isAuthenticated, showAuthGate]);

  const handleSeedFirebase = async () => {
    try {
      // Dummy call for UX sync feedback
      alert('Firebase synchronization successful.');
    } catch (error) {
      console.error("Firebase upload error:", error);
      alert('System failure during Firebase synchronization.');
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleWidgetDragStart = (event: DragStartEvent) => setActiveWidgetDragId(event.active.id as string);
  const handleWidgetDragEnd = (event: DragEndEvent) => {
    setActiveWidgetDragId(null);
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = mainLayout.indexOf(active.id as string);
      const newIndex = mainLayout.indexOf(over.id as string);
      if (oldIndex !== -1 && newIndex !== -1) setMainLayout((items) => arrayMove(items, oldIndex, newIndex));
    }
  };

  const activeProb = data.majors?.[activePair] ?? data.minors?.[activePair] ?? data.metals?.[activePair] ?? data.crypto?.[activePair] ?? 0;
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
    if (marketMode === 'CRYPTO' && cryptoMode !== 'standard') return 'from-blue-950/10 via-zinc-950/20 to-[#050505]/40';
    if (inferredDirection === 'BUY') return marketMode === 'CRYPTO' ? 'from-blue-950/10 via-[#0a0a0a]/40 to-[#050505]/40' : 'from-emerald-950/10 via-[#0a0a0a]/40 to-[#050505]/40';
    if (inferredDirection === 'SELL') return 'from-red-950/10 via-[#0a0a0a]/40 to-[#050505]/40';
    return 'from-[#050505]/40 via-[#0a0a0a]/40 to-[#050505]/40';
  };
  
  const getGlowColor = () => {
    if (marketMode === 'CRYPTO' && cryptoMode !== 'standard') return 'shadow-[0_0_60px_rgba(59,130,246,0.05)]';
    if (inferredDirection === 'BUY') return marketMode === 'CRYPTO' ? 'shadow-[0_0_60px_rgba(59,130,246,0.05)]' : 'shadow-[0_0_60px_rgba(52,211,153,0.05)]';
    if (inferredDirection === 'SELL') return 'shadow-[0_0_60px_rgba(239,68,68,0.05)]';
    return 'shadow-2xl';
  };

  const renderAiAnalysisWidget = () => {
    if (!activeParams) return null;
    return (
      <div className={`bg-[#0a0a0a]/80 backdrop-blur-2xl border ${inferredDirection === 'SELL' ? 'border-red-500/20' : inferredDirection === 'BUY' ? (marketMode === 'CRYPTO' ? 'border-blue-500/20' : 'border-emerald-500/20') : 'border-white/5'} rounded-[2rem] overflow-hidden p-8 transition-all duration-700 relative z-10 ${getGlowColor()}`}>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 border-b border-white/5 pb-8">
          <div className="w-full">
            <div className="flex items-center gap-4 mb-4">
              <h2 className="text-4xl font-bold text-white tracking-tight">{displayTicker}</h2>
              {isTradeActive && (
                <span className={`px-4 py-1.5 text-[11px] font-bold uppercase tracking-widest rounded-lg border shadow-lg animate-pulse ${
                  inferredDirection === 'BUY' ? (marketMode === 'CRYPTO' ? 'bg-blue-500/10 text-blue-400 border-blue-500/30 shadow-blue-500/10' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-emerald-500/10') : 'bg-red-500/10 text-red-400 border-red-500/30 shadow-red-500/10'
                }`}>{inferredDirection} PENDING</span>
              )}
              {activeParams?.KeyDriver && (
                <span className="px-3 py-1 bg-white/5 text-white/80 text-[10px] uppercase tracking-widest rounded-lg border border-white/10 font-bold flex items-center shadow-inner">{activeParams.KeyDriver}</span>
              )}
            </div>
            
            <div className="flex flex-wrap items-center gap-3 mt-4">
              <span className="px-3 py-1.5 bg-black/40 rounded-lg border border-white/5 font-mono text-[11px] shadow-inner"><span className="text-zinc-500 mr-2 uppercase tracking-wider">SL</span><span className="text-white font-bold">{activeParams.SL}</span></span>
              <span className="px-3 py-1.5 bg-black/40 rounded-lg border border-white/5 font-mono text-[11px] shadow-inner"><span className="text-zinc-500 mr-2 uppercase tracking-wider">TP</span><span className="text-white font-bold">{activeParams.TP === 9999 ? 'OPEN' : activeParams.TP}</span></span>
              {activeParams.RRR && <span className="px-3 py-1.5 bg-zinc-800/50 rounded-lg border border-zinc-700/50 font-mono text-[11px] shadow-inner"><span className="text-zinc-400 mr-2 uppercase tracking-wider font-bold">RRR</span><span className="text-white font-bold">1:{activeParams.RRR}</span></span>}
              <span className="px-3 py-1.5 bg-black/40 rounded-lg border border-white/5 font-mono text-[11px] shadow-inner"><span className="text-zinc-500 mr-2 uppercase tracking-wider">BE</span><span className="text-white font-bold">{activeParams.BE}</span></span>
              <span className="px-3 py-1.5 bg-black/40 rounded-lg border border-white/5 font-mono text-[11px] shadow-inner"><span className="text-zinc-500 mr-2 uppercase tracking-wider">SPREAD</span><span className="text-white font-bold">{activeParams.LiveSpread !== "N/A" ? activeParams.LiveSpread : activeParams.MaxSpread}</span></span>
            </div>
            <PositionCalculator slPips={activeParams.SL} direction={inferredDirection} />
          </div>

          <div className="flex flex-col items-center gap-6 flex-shrink-0">
            <div className="flex flex-col items-center justify-center relative w-56 h-28 mt-2">
              <svg viewBox="0 0 200 120" className="w-full h-full drop-shadow-2xl overflow-visible">
                <defs><filter id="glow" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="3" result="blur" /><feComposite in="SourceGraphic" in2="blur" operator="over" /></filter></defs>
                <path d="M 30 100 A 70 70 0 0 1 100 30" fill="none" stroke="#ef4444" strokeWidth="6" strokeLinecap="round" strokeOpacity="0.8" />
                <path d="M 100 30 A 70 70 0 0 1 170 100" fill="none" stroke="#10b981" strokeWidth="6" strokeLinecap="round" strokeOpacity="0.8" />
                <g style={{ transform: `rotate(${gaugeRotation}deg)`, transformOrigin: '100px 100px' }} className="transition-transform duration-[1500ms] ease-[cubic-bezier(0.34,1.56,0.64,1)]">
                  <polygon points="96,100 104,100 100,25" fill={needleColor} filter="url(#glow)" opacity="0.9" />
                  <circle cx="100" cy="100" r="8" fill="#050505" stroke={needleColor} strokeWidth="3" />
                </g>
              </svg>
              <div className={`absolute bottom-[-10px] text-3xl font-black tracking-tighter ${inferredDirection === 'BUY' ? (marketMode === 'CRYPTO' ? 'text-blue-400' : 'text-emerald-400') : inferredDirection === 'SELL' ? 'text-red-400 drop-shadow-[0_0_15px_rgba(239,68,68,0.4)]' : 'text-zinc-500'}`}>
                <AnimatedNumber value={activeProb * 100} />%
              </div>
            </div>
            {isTradeActive ? (
              <ExecuteButton baseClass="w-full px-6 py-4 text-[11px] font-bold uppercase tracking-widest rounded-xl border shadow-xl transition-all hover:-translate-y-1" defaultText={`EXECUTE ${inferredDirection}`} colorTheme={inferredDirection === 'BUY' ? (marketMode === 'CRYPTO' ? 'blue' : 'emerald') : 'red'} />
            ) : (
              <button disabled className="w-full px-6 py-4 bg-zinc-900/50 text-zinc-600 text-[11px] font-bold uppercase tracking-widest rounded-xl border border-white/5 cursor-not-allowed">LOW CONVICTION</button>
            )}
          </div>
        </div>

        {activeParams?.aiAnalysis && (
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            <div className="bg-black/40 border border-white/5 rounded-2xl p-6 transition-all hover:bg-black/60 shadow-inner">
              <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-4 flex items-center justify-between"><span className="flex items-center">PREVIOUS: {activeParams.aiAnalysis.prev_session}</span><span className="w-1.5 h-1.5 rounded-full bg-zinc-600"></span></div>
              <p className="text-sm text-white/90 leading-loose font-medium">{activeParams.aiAnalysis.evaluation}</p>
            </div>
            <div className={`border rounded-2xl p-6 relative overflow-hidden transition-all duration-1000 shadow-inner ${inferredDirection === 'SELL' ? 'bg-red-950/20 border-red-500/20' : inferredDirection === 'BUY' ? (marketMode === 'CRYPTO' ? 'bg-blue-950/20 border-blue-500/20' : 'bg-emerald-950/20 border-emerald-500/20') : 'bg-black/40 border-white/5'}`}>
              <div className={`text-[10px] font-bold uppercase tracking-widest mb-4 flex items-center justify-between ${inferredDirection === 'SELL' ? 'text-red-400/80' : inferredDirection === 'BUY' ? (marketMode === 'CRYPTO' ? 'text-blue-400/80' : 'text-emerald-400/80') : 'text-zinc-500'}`}>
                <span>PREDICTION: {activeParams.aiAnalysis.current_session}</span>
                <span className="relative flex h-2 w-2">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${inferredDirection === 'SELL' ? 'bg-red-400' : inferredDirection === 'BUY' ? (marketMode === 'CRYPTO' ? 'bg-blue-400' : 'bg-emerald-400') : 'bg-zinc-600'}`}></span>
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${inferredDirection === 'SELL' ? 'bg-red-500' : inferredDirection === 'BUY' ? (marketMode === 'CRYPTO' ? 'bg-blue-500' : 'bg-emerald-500') : 'bg-zinc-500'}`}></span>
                </span>
              </div>
              <p className={`text-sm leading-loose font-medium relative z-10 ${inferredDirection !== 'NEUTRAL' ? 'text-white' : 'text-white/80'}`}>{activeParams.aiAnalysis.prediction}</p>
            </div>
          </div>
        )}

        {activeParams?.history && (
          <div className="border-t border-white/5 pt-8 mt-2">
            <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-6 flex items-center gap-2"><svg className="w-4 h-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>AI BACKTEST & SIGNAL HISTORY (LAST 5)</div>
            <div className="flex flex-wrap gap-3">
              {activeParams.history.map((trade, idx) => (
                <div key={idx} className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-inner transition-colors hover:bg-white/5 ${trade.result === 'WIN' ? 'bg-emerald-500/5 border-emerald-500/10' : 'bg-red-500/5 border-red-500/10'}`}>
                  <span className="text-[10px] text-zinc-500 font-mono bg-black/40 px-2 py-1 rounded">{trade.date}</span><span className="text-[10px] font-bold text-white/80">{trade.type}</span><span className={`text-[10px] font-bold ${trade.result === 'WIN' ? 'text-emerald-400' : 'text-red-400'}`}>{trade.pips > 0 ? '+' : ''}{trade.pips} PIPS</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const widgetMap: Record<string, React.ReactNode> = {
    'chart': <ChartArea symbol={activePair} mode={marketMode} />,
    'ai_panel': renderAiAnalysisWidget(),
    'liquidations': marketMode === 'CRYPTO' && cryptoMode === 'standard' ? <LiquidationsBar /> : null
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

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes custom-gradient { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
        .animate-bg-gradient { background-size: 200% 200%; animation: custom-gradient 15s ease infinite; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(39, 39, 42, 0.8); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(63, 63, 70, 1); }
      `}} />

      <div className="flex h-screen w-full bg-[#050505] text-zinc-200 selection:bg-emerald-500/30 overflow-hidden font-sans animate-in fade-in duration-700 min-w-[1024px] relative">
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] max-w-[600px] max-h-[600px] bg-indigo-500 rounded-full blur-[120px] opacity-[0.08] animate-pulse" style={{ animationDuration: '8s' }} />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] max-w-[600px] max-h-[600px] bg-emerald-500 rounded-full blur-[120px] opacity-[0.08] animate-pulse" style={{ animationDuration: '12s' }} />
          <div className="absolute top-[30%] left-[40%] w-[30vw] h-[30vw] max-w-[500px] max-h-[500px] bg-blue-500 rounded-full blur-[120px] opacity-[0.06] animate-pulse" style={{ animationDuration: '10s' }} />
        </div>

        <Sidebar 
          marketMode={marketMode} setMarketMode={setMarketMode}
          cryptoMode={cryptoMode} setCryptoMode={setCryptoMode}
          activePair={activePair} setActivePair={setActivePair}
          data={data} 
          spatialArbData={MOCK_SPATIAL_ARB}
          triangularArbData={MOCK_TRIANGULAR_ARB}
          fundingRateData={MOCK_FUNDING_RATES}
          openGroups={openGroups} setOpenGroups={setOpenGroups}
          favorites={favorites} setFavorites={setFavorites}
          activeDragId={activeDragId} setActiveDragId={setActiveDragId}
          handleSeedFirebase={handleSeedFirebase}
        />

        <main className={`flex-1 min-w-0 h-full overflow-y-auto custom-scrollbar px-6 pt-12 pb-24 lg:px-12 lg:pt-20 scroll-smooth transition-colors duration-1000 ease-in-out bg-gradient-to-br animate-bg-gradient ${getPageBackground()} relative z-10`}>
          <div className="max-w-[1400px] mx-auto w-full relative z-10">
            <MarketMonitor lastRefresh={lastRefresh} mode={marketMode === 'CRYPTO' ? `CRYPTO (${cryptoMode.toUpperCase()})` : 'FOREX'} />

            {loading && !data.majors ? (
              <div className="p-20 mt-10 text-center flex flex-col items-center justify-center gap-6 border border-white/10 rounded-[2rem] bg-white/[0.02]">
                <div className={`w-10 h-10 border-4 border-t-transparent rounded-full animate-spin ${marketMode === 'CRYPTO' ? 'border-blue-500/30 border-t-blue-500' : 'border-emerald-500/30 border-t-emerald-500'}`}></div>
                <span className="text-[10px] text-zinc-400 font-bold tracking-widest uppercase">SYSTEM SCANNING...</span>
              </div>
            ) : error && !data.majors ? (
              <div className="p-10 mt-10 text-center text-[10px] uppercase font-bold text-red-400 border border-red-900/40 bg-red-950/20 rounded-[2rem]">{error}</div>
            ) : (
              <div className="flex flex-col xl:flex-row gap-10 mt-10 w-full items-start">
                <div className="w-full xl:w-2/3 flex flex-col space-y-10">
                  {marketMode === 'CRYPTO' && cryptoMode === 'spatial_arb' ? (
                    <SpatialArbitragePanel arbData={MOCK_SPATIAL_ARB[activePair]} />
                  ) : marketMode === 'CRYPTO' && cryptoMode === 'triangular_arb' ? (
                    <TriangularArbitragePanel arbData={MOCK_TRIANGULAR_ARB[activePair]} />
                  ) : marketMode === 'CRYPTO' && cryptoMode === 'funding_rates' ? (
                    <FundingRatesPanel data={MOCK_FUNDING_RATES[activePair]} />
                  ) : (
                    <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleWidgetDragStart} onDragEnd={handleWidgetDragEnd}>
                      <SortableContext items={mainLayout} strategy={verticalListSortingStrategy}>
                        <div className="flex flex-col space-y-10 w-full">
                          {mainLayout.map((widgetId) => (
                             widgetMap[widgetId] ? (
                               <DraggableWidget key={widgetId} id={widgetId}>{widgetMap[widgetId]}</DraggableWidget>
                             ) : null
                          ))}
                        </div>
                      </SortableContext>
                      <DragOverlay dropAnimation={{ sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: '0.4' } } }) }}>
                        {activeWidgetDragId && widgetMap[activeWidgetDragId] ? (
                          <div className="opacity-80 scale-105 shadow-2xl pointer-events-none">{widgetMap[activeWidgetDragId]}</div>
                        ) : null}
                      </DragOverlay>
                    </DndContext>
                  )}
                </div>
                <NewsPanel marketMode={marketMode} rightPanelMode={rightPanelMode} setRightPanelMode={setRightPanelMode} />
              </div>
            )}
          </div>
        </main>
      </div>
    </>
  );
}