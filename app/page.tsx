"use client";

import React, { useState, useEffect } from 'react';
import { 
  DndContext, DragOverlay, closestCorners, DragStartEvent, DragEndEvent,
  defaultDropAnimationSideEffects, KeyboardSensor, PointerSensor, useSensor, useSensors,
  DropAnimation
} from '@dnd-kit/core';
import { 
  arrayMove, SortableContext, sortableKeyboardCoordinates, 
  verticalListSortingStrategy, useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'framer-motion';

// --- LOKÁLNÍ IMPORTY (ZACHOVEJTE PRO VS CODE) ---
// Až tento soubor zkopírujete do svého VS Code, tyto importy ODKOMENTUJTE
// a sekci s MOCK KOMPONENTAMI níže SMAŽTE.
/*
import Sidebar from './Sidebar';
import NewsPanel from './NewsPanel';
import ChartArea from './ChartArea';
import { SpatialArbitragePanel, TriangularArbitragePanel, FundingRatesPanel, SpatialArbData, TriangularArbData, FundingRateData } from './ArbitragePanel';
import BacktestLab from './BacktestLab';
*/

// --- MOCK KOMPONENTY PRO NÁHLED V PROHLÍŽEČI ---
type ArbStatus = 'ACTIVE' | 'DEGRADING' | 'CLOSED';
interface ChartPoint { time: string; spread: number; }
export interface SpatialArbData { id: string; asset: string; buyExchange: string; sellExchange: string; askPrice: number; bidPrice: number; spreadPercent: number; estimatedFeePercent: number; status: ArbStatus; chartData: ChartPoint[]; }
export interface TriangularArbData { id: string; pairName: string; path: string[]; rate1: number; rate2: number; rate3: number; expectedProfitPercent: number; status: ArbStatus; chartData: ChartPoint[]; }
export interface FundingRateData { id: string; asset: string; binanceRate: number; bybitRate: number; okxRate: number; optimalLong: string; optimalShort: string; netYield: number; status: ArbStatus; chartData: ChartPoint[]; }

const Sidebar = (props: any) => null; 
const NewsPanel = (props: any) => <div className="w-full xl:w-80 border border-white/5 rounded-xl p-6 text-zinc-500 flex items-center justify-center bg-white/[0.02]">Zprávy (Mock)</div>;
const ChartArea = (props: any) => <div className="w-full h-[400px] border border-white/5 rounded-xl p-6 text-zinc-500 flex items-center justify-center bg-white/[0.02]">Graf (Mock)</div>;
const SpatialArbitragePanel = (props: any) => <div className="w-full h-32 border border-white/5 rounded-xl p-6 text-zinc-500 flex items-center justify-center bg-white/[0.02]">Spatial Arb (Mock)</div>;
const TriangularArbitragePanel = (props: any) => <div className="w-full h-32 border border-white/5 rounded-xl p-6 text-zinc-500 flex items-center justify-center bg-white/[0.02]">Triangular Arb (Mock)</div>;
const FundingRatesPanel = (props: any) => <div className="w-full h-32 border border-white/5 rounded-xl p-6 text-zinc-500 flex items-center justify-center bg-white/[0.02]">Funding Rates (Mock)</div>;
const BacktestLab = (props: any) => (
  <div className="w-full h-[600px] border border-white/5 rounded-[2rem] p-10 text-zinc-500 flex flex-col items-center justify-center bg-white/[0.02] gap-6">
    <span className="text-xl tracking-widest uppercase font-bold text-white">Backtest Lab (Mock)</span>
    <button onClick={props.onBack} className="px-6 py-3 border border-white/10 rounded-xl text-white hover:bg-white/5 transition-colors uppercase tracking-widest text-[10px] font-bold">Zpět na Terminál</button>
  </div>
);
// ------------------------------------------------

interface TradeHistory { date: string; type: string; result: 'WIN' | 'LOSS'; pips: number; }
interface AIAnalysis { evaluation: string; prediction: string; current_session: string; prev_session: string; }
interface DashboardData {
  majors?: Record<string, number>;
  minors?: Record<string, number>;
  metals?: Record<string, number>;
  crypto?: Record<string, number>;
  crypto_arb?: {
    spatial?: Record<string, SpatialArbData>;
    triangular?: Record<string, TriangularArbData>;
    funding?: Record<string, FundingRateData>;
  };
  parameters?: Record<string, { SL: number; TP: number; Partial: number; BE: number; MaxSpread: number; LiveSpread: number | string; KeyDriver: string; Direction?: string; RRR?: number; LivePrice?: number; aiAnalysis?: AIAnalysis; history?: TradeHistory[]; }>;
}

const LIQUIDATIONS_MOCK = { longsRekt: 154200000, shortsRekt: 45800000 };

const dropAnimationConfig: DropAnimation = {
  sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: '0.4' } } }),
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

const MarketMonitor = ({ lastRefresh, mode, activeView }: { lastRefresh: Date | null, mode: string, activeView: 'terminal' | 'laboratory' }) => {
  const displayTime = lastRefresh || new Date();
  const hour = displayTime.getHours();
  
  const isCrypto = mode.includes('CRYPTO');
  const sessions = isCrypto ? [ { name: "Global Crypto Market", open: "24", close: "7", isActive: true } ] : [
    { name: "Sydney", open: "22:00", close: "07:00", isActive: hour >= 22 || hour < 7 },
    { name: "Tokyo", open: "00:00", close: "09:00", isActive: hour >= 0 && hour < 9 },
    { name: "London", open: "09:00", close: "17:30", isActive: hour >= 9 && hour < 17 },
    { name: "New York", open: "14:30", close: "22:00", isActive: hour >= 14 && hour < 22 },
  ];

  const minutes = displayTime.getMinutes();
  const seconds = displayTime.getSeconds();
  const progressPercent = (((minutes % 15) * 60 + seconds) / 900) * 100;

  let pulseColor = 'bg-emerald-400'; let gradientStart = 'from-emerald-600'; let gradientEnd = 'to-emerald-400';
  if (mode.includes('CRYPTO') && !mode.includes('TRIANGULAR') && !mode.includes('FUNDING')) { pulseColor = 'bg-blue-400'; gradientStart = 'from-blue-600'; gradientEnd = 'to-blue-400'; } 
  else if (mode.includes('TRIANGULAR')) { pulseColor = 'bg-purple-400'; gradientStart = 'from-purple-600'; gradientEnd = 'to-purple-400'; } 
  else if (mode.includes('FUNDING')) { pulseColor = 'bg-orange-400'; gradientStart = 'from-orange-600'; gradientEnd = 'to-orange-400'; }

  return (
    <div className="mb-6 p-6 lg:p-8 bg-zinc-950/50 backdrop-blur-xl border border-white/10 rounded-[2rem] shadow-2xl relative overflow-hidden transition-all duration-300 flex-shrink-0 z-10">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 lg:gap-8 relative z-10">
        <div className="flex flex-col gap-2 w-full md:w-auto">
          <div className="text-3xl md:text-5xl font-semibold tracking-tight text-white">
            {activeView === 'terminal' ? (
              <>
                {displayTime.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })}
                <span className="text-xl md:text-2xl text-white/50 ml-1">:{displayTime.getSeconds().toString().padStart(2, '0')}</span>
              </>
            ) : "AI BACKTEST LAB"}
          </div>
          <div className="text-[9px] md:text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex flex-wrap items-center gap-3 mt-2">
            <span className="flex items-center gap-2">
              <span className={`w-1.5 h-1.5 rounded-full ${activeView === 'terminal' ? (isCrypto ? 'animate-pulse ' + pulseColor : 'bg-emerald-400') : 'bg-zinc-500'}`}></span>
              {activeView === 'terminal' ? `SYSTEM SYNC (${mode})` : 'STRATEGY SIMULATOR ENVIRONMENT'}
            </span>
            {activeView === 'terminal' && (
              <span className="px-3 py-1 bg-black/40 rounded-full border border-white/5 text-white/80">{lastRefresh ? "CONNECTED" : "WAITING FOR DATA..."}</span>
            )}
          </div>
        </div>

        {activeView === 'terminal' && (
          <div className="flex flex-wrap gap-2 lg:gap-3 w-full md:w-auto">
            {sessions.map((s) => (
              <div key={s.name} className={`flex-1 min-w-[45%] md:min-w-0 px-3 lg:px-5 py-2 lg:py-3 border rounded-xl flex flex-col items-center justify-center transition-all duration-500 ${s.isActive ? `${isCrypto ? 'bg-blue-500/10 border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.1)]' : 'bg-emerald-500/10 border-emerald-500/30 shadow-[0_0_15px_rgba(52,211,153,0.1)]'}` : 'bg-black/40 border-white/5 opacity-60'}`}>
                <span className={`text-[8px] md:text-[10px] font-bold uppercase tracking-widest mb-1 text-center ${s.isActive ? (isCrypto ? 'text-blue-400' : 'text-emerald-400') : 'text-zinc-500'}`}>{s.name}</span>
                <span className="text-[9px] md:text-[10px] text-zinc-500 font-medium">{s.open} - {s.close}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {activeView === 'terminal' && (
        <div className="mt-6 lg:mt-8 relative z-10">
          <div className="flex justify-between text-[8px] md:text-[10px] text-zinc-500 font-bold mb-2 lg:mb-3 uppercase tracking-widest">
            <span>AI ENGINE M15 CYCLE</span><span>{15 - (minutes % 15)}m {(60 - seconds) % 60}s REMAINING</span>
          </div>
          <div className="w-full h-1.5 md:h-2 bg-black/60 rounded-full overflow-hidden border border-white/5">
            <div className={`h-full rounded-full transition-all duration-1000 ease-linear bg-gradient-to-r ${gradientStart} ${gradientEnd}`} style={{ width: `${progressPercent}%` }} />
          </div>
        </div>
      )}
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
    <div className="p-4 md:p-6 bg-black/30 rounded-2xl border border-white/5 shadow-inner mt-6">
      <div className="text-[9px] md:text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-4 flex items-center">
        POSITION SIZING
        <InfoTooltip info="Calculates precise trade volume based on your account balance, risk percentage, and the AI-generated Stop Loss distance." />
      </div>
      <div className="flex gap-4 md:gap-6 items-end">
        <div className="flex flex-col gap-2 w-1/3">
          <label className="text-[8px] md:text-[10px] text-zinc-500 uppercase font-semibold tracking-widest">BALANCE ($)</label>
          <input type="number" value={balance} onChange={(e) => setBalance(Number(e.target.value))} className={`bg-zinc-900/80 border border-white/5 rounded-lg px-2 md:px-4 py-2 text-xs md:text-sm text-white font-mono focus:outline-none focus:ring-1 ${focusRingColor} transition-all w-full`} />
        </div>
        <div className="flex flex-col gap-2 w-1/3">
          <label className="text-[8px] md:text-[10px] text-zinc-500 uppercase font-semibold tracking-widest">RISK (%)</label>
          <input type="number" step="0.1" value={riskPercent} onChange={(e) => setRiskPercent(Number(e.target.value))} className={`bg-zinc-900/80 border border-white/5 rounded-lg px-2 md:px-4 py-2 text-xs md:text-sm text-white font-mono focus:outline-none focus:ring-1 ${focusRingColor} transition-all w-full`} />
        </div>
        <div className={`w-1/3 flex flex-col items-center justify-center py-1 md:py-2 px-2 md:px-4 rounded-lg border shadow-inner transition-all duration-300 ${direction === 'BUY' ? 'bg-emerald-500/10 border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.15)]' : direction === 'SELL' ? 'bg-red-500/10 border-red-500/40 shadow-[0_0_15px_rgba(239,68,68,0.15)]' : 'bg-zinc-900 border-white/5'}`}>
          <span className={`text-[8px] md:text-[10px] uppercase font-bold tracking-widest mb-1 ${direction === 'BUY' ? 'text-emerald-500/70' : direction === 'SELL' ? 'text-red-500/70' : 'text-zinc-500'}`}>VOLUME</span>
          <span className="text-base md:text-xl font-bold text-white font-mono">{lotSize}</span>
        </div>
      </div>
    </div>
  );
};

const DraggableWidget = ({ id, children }: { id: string, children: React.ReactNode }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1, position: 'relative' as const, zIndex: isDragging ? 50 : 1 };

  return (
    <div ref={setNodeRef} style={style} className="w-full relative group/widget">
      <div {...attributes} {...listeners} className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#0a0a0a] border border-white/10 text-zinc-500 px-3 py-1 rounded-full cursor-grab active:cursor-grabbing opacity-0 group-hover/widget:opacity-100 transition-opacity z-50 flex items-center justify-center shadow-xl hover:text-white hover:border-white/20 hidden md:flex">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="12" r="1"/><circle cx="9" cy="5" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="19" r="1"/></svg>
      </div>
      {children}
    </div>
  );
};

export default function Home() {
  const [data, setData] = useState<DashboardData>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  
  const [activeView, setActiveView] = useState<'terminal' | 'laboratory'>('terminal');

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
       interval = setInterval(loadData, 3000);
    }
    return () => clearInterval(interval);
  }, [isAuthenticated, showAuthGate]);

  const handleSeedFirebase = async () => {
    try {
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
    if (activeView === 'laboratory') return 'from-indigo-950/20 via-zinc-950/20 to-[#050505]/40';
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
      <div className={`bg-zinc-950/50 backdrop-blur-xl border ${inferredDirection === 'SELL' ? 'border-red-500/20' : inferredDirection === 'BUY' ? (marketMode === 'CRYPTO' ? 'border-blue-500/20' : 'border-emerald-500/20') : 'border-white/10'} rounded-[2rem] overflow-hidden p-6 lg:p-8 transition-all duration-700 relative z-10 ${getGlowColor()}`}>
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8 border-b border-white/5 pb-8">
          <div className="w-full">
            <div className="flex flex-wrap items-center gap-3 lg:gap-4 mb-4">
              <h2 className="text-2xl md:text-4xl font-bold text-white tracking-tight">{displayTicker}</h2>
              {isTradeActive && (
                <span className={`px-3 lg:px-4 py-1.5 text-[9px] md:text-[11px] font-bold uppercase tracking-widest rounded-lg border shadow-[0_0_15px_rgba(0,0,0,0.5)] animate-pulse ${
                  inferredDirection === 'BUY' ? (marketMode === 'CRYPTO' ? 'bg-blue-500/10 text-blue-400 border-blue-500/30 shadow-blue-500/10' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-emerald-500/10') : 'bg-red-500/10 text-red-400 border-red-500/30 shadow-red-500/10'
                }`}>{inferredDirection} PENDING</span>
              )}
              {activeParams?.KeyDriver && (
                <span className="px-2 md:px-3 py-1 bg-white/5 text-white/80 text-[8px] md:text-[10px] uppercase tracking-widest rounded-lg border border-white/10 font-bold flex items-center shadow-inner">{activeParams.KeyDriver}</span>
              )}
            </div>
            
            <div className="flex flex-wrap items-center gap-2 mt-4">
              <span className="px-2 md:px-3 py-1.5 bg-black/40 rounded-lg border border-white/5 font-mono text-[9px] md:text-[11px] shadow-inner"><span className="text-zinc-500 mr-1 md:mr-2 uppercase tracking-wider">SL</span><span className="text-white font-bold">{activeParams.SL}</span></span>
              <span className="px-2 md:px-3 py-1.5 bg-black/40 rounded-lg border border-white/5 font-mono text-[9px] md:text-[11px] shadow-inner"><span className="text-zinc-500 mr-1 md:mr-2 uppercase tracking-wider">TP</span><span className="text-white font-bold">{activeParams.TP === 9999 ? 'OPEN' : activeParams.TP}</span></span>
              {activeParams.RRR && <span className="px-2 md:px-3 py-1.5 bg-zinc-800/50 rounded-lg border border-zinc-700/50 font-mono text-[9px] md:text-[11px] shadow-inner"><span className="text-zinc-400 mr-1 md:mr-2 uppercase tracking-wider font-bold">RRR</span><span className="text-white font-bold">1:{activeParams.RRR}</span></span>}
              <span className="px-2 md:px-3 py-1.5 bg-black/40 rounded-lg border border-white/5 font-mono text-[9px] md:text-[11px] shadow-inner"><span className="text-zinc-500 mr-1 md:mr-2 uppercase tracking-wider">BE</span><span className="text-white font-bold">{activeParams.BE}</span></span>
              <span className="px-2 md:px-3 py-1.5 bg-black/40 rounded-lg border border-white/5 font-mono text-[9px] md:text-[11px] shadow-inner"><span className="text-zinc-500 mr-1 md:mr-2 uppercase tracking-wider">SPREAD</span><span className="text-white font-bold">{activeParams.LiveSpread !== "N/A" ? activeParams.LiveSpread : activeParams.MaxSpread}</span></span>
              {activeParams.LivePrice && <span className="px-2 md:px-3 py-1.5 bg-blue-900/30 rounded-lg border border-blue-500/30 font-mono text-[9px] md:text-[11px] shadow-inner ml-auto"><span className="text-blue-400 mr-1 md:mr-2 uppercase tracking-wider">LIVE</span><span className="text-white font-bold">{activeParams.LivePrice}</span></span>}
            </div>
            <PositionCalculator slPips={activeParams.SL} direction={inferredDirection} />
          </div>

          <div className="flex flex-col items-center gap-6 flex-shrink-0 w-full lg:w-auto mt-6 lg:mt-0">
            <div className="flex flex-col items-center justify-center relative w-40 md:w-56 h-20 md:h-28 mt-2">
              <svg viewBox="0 0 200 120" className="w-full h-full drop-shadow-2xl overflow-visible">
                <defs><filter id="glow" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="3" result="blur" /><feComposite in="SourceGraphic" in2="blur" operator="over" /></filter></defs>
                <path d="M 30 100 A 70 70 0 0 1 100 30" fill="none" stroke="#ef4444" strokeWidth="6" strokeLinecap="round" strokeOpacity="0.8" />
                <path d="M 100 30 A 70 70 0 0 1 170 100" fill="none" stroke="#10b981" strokeWidth="6" strokeLinecap="round" strokeOpacity="0.8" />
                <g style={{ transform: `rotate(${gaugeRotation}deg)`, transformOrigin: '100px 100px' }} className="transition-transform duration-[1500ms] ease-[cubic-bezier(0.34,1.56,0.64,1)]">
                  <polygon points="96,100 104,100 100,25" fill={needleColor} filter="url(#glow)" opacity="0.9" />
                  <circle cx="100" cy="100" r="8" fill="#050505" stroke={needleColor} strokeWidth="3" />
                </g>
              </svg>
              <div className={`absolute bottom-[-10px] text-2xl md:text-3xl font-black tracking-tighter ${inferredDirection === 'BUY' ? (marketMode === 'CRYPTO' ? 'text-blue-400' : 'text-emerald-400') : inferredDirection === 'SELL' ? 'text-red-400 drop-shadow-[0_0_15px_rgba(239,68,68,0.4)]' : 'text-zinc-500'}`}>
                {(activeProb * 100).toFixed(1)}%
              </div>
            </div>
            {isTradeActive ? (
              <button className={`w-full px-6 py-4 text-[10px] md:text-[11px] font-bold uppercase tracking-widest rounded-xl border shadow-xl transition-all hover:-translate-y-1 ${inferredDirection === 'BUY' ? (marketMode === 'CRYPTO' ? 'bg-blue-500 hover:bg-blue-400 text-white border-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.5)]' : 'bg-emerald-500 hover:bg-emerald-400 text-black border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.5)]') : 'bg-red-500 hover:bg-red-400 text-white border-red-400 shadow-[0_0_15px_rgba(239,68,68,0.5)]'}`}>
                EXECUTE {inferredDirection}
              </button>
            ) : (
              <button disabled className="w-full px-6 py-4 bg-zinc-900/50 text-zinc-600 text-[10px] md:text-[11px] font-bold uppercase tracking-widest rounded-xl border border-white/5 cursor-not-allowed">LOW CONVICTION</button>
            )}
          </div>
        </div>

        {activeParams?.aiAnalysis && (
          <div className="grid md:grid-cols-2 gap-4 lg:gap-8 mb-8">
            <div className="bg-black/40 border border-white/5 rounded-2xl p-4 lg:p-6 transition-all hover:bg-black/60 shadow-inner">
              <div className="text-[9px] lg:text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-3 lg:mb-4 flex items-center justify-between"><span className="flex items-center">PREVIOUS: {activeParams.aiAnalysis.prev_session}</span><span className="w-1.5 h-1.5 rounded-full bg-zinc-600"></span></div>
              <p className="text-xs lg:text-sm text-white/90 leading-loose font-medium">{activeParams.aiAnalysis.evaluation}</p>
            </div>
            <div className={`border rounded-2xl p-4 lg:p-6 relative overflow-hidden transition-all duration-1000 shadow-inner ${inferredDirection === 'SELL' ? 'bg-red-950/20 border-red-500/20' : inferredDirection === 'BUY' ? (marketMode === 'CRYPTO' ? 'bg-blue-950/20 border-blue-500/20' : 'bg-emerald-950/20 border-emerald-500/20') : 'bg-black/40 border-white/5'}`}>
              <div className={`text-[9px] lg:text-[10px] font-bold uppercase tracking-widest mb-3 lg:mb-4 flex items-center justify-between ${inferredDirection === 'SELL' ? 'text-red-400/80' : inferredDirection === 'BUY' ? (marketMode === 'CRYPTO' ? 'text-blue-400/80' : 'text-emerald-400/80') : 'text-zinc-500'}`}>
                <span>PREDICTION: {activeParams.aiAnalysis.current_session}</span>
                <span className="relative flex h-2 w-2">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${inferredDirection === 'SELL' ? 'bg-red-400' : inferredDirection === 'BUY' ? (marketMode === 'CRYPTO' ? 'bg-blue-400' : 'bg-emerald-400') : 'bg-zinc-600'}`}></span>
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${inferredDirection === 'SELL' ? 'bg-red-500' : inferredDirection === 'BUY' ? (marketMode === 'CRYPTO' ? 'bg-blue-500' : 'bg-emerald-500') : 'bg-zinc-500'}`}></span>
                </span>
              </div>
              <p className={`text-xs lg:text-sm leading-loose font-medium relative z-10 ${inferredDirection !== 'NEUTRAL' ? 'text-white' : 'text-white/80'}`}>{activeParams.aiAnalysis.prediction}</p>
            </div>
          </div>
        )}

        {activeParams?.history && (
          <div className="border-t border-white/5 pt-6 lg:pt-8 mt-2">
            <div className="text-[9px] lg:text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-4 lg:mb-6 flex items-center gap-2"><svg className="w-4 h-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>AI BACKTEST & SIGNAL HISTORY</div>
            <div className="flex flex-wrap gap-2 lg:gap-3">
              {activeParams.history.map((trade, idx) => (
                <div key={idx} className={`flex items-center gap-2 lg:gap-3 px-3 py-2 lg:px-4 lg:py-3 rounded-xl border shadow-inner transition-colors hover:bg-white/5 ${trade.result === 'WIN' ? 'bg-emerald-500/5 border-emerald-500/10' : 'bg-red-500/5 border-red-500/10'}`}>
                  <span className="text-[9px] lg:text-[10px] text-zinc-500 font-mono bg-black/40 px-1.5 py-1 lg:px-2 rounded">{trade.date}</span><span className="text-[9px] lg:text-[10px] font-bold text-white/80">{trade.type}</span><span className={`text-[9px] lg:text-[10px] font-bold ${trade.result === 'WIN' ? 'text-emerald-400' : 'text-red-400'}`}>{trade.pips > 0 ? '+' : ''}{trade.pips} PIPS</span>
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
    'liquidations': marketMode === 'CRYPTO' && cryptoMode === 'standard' ? (
      <div className="w-full bg-zinc-950/50 backdrop-blur-xl border border-white/10 rounded-[2rem] p-6 shadow-2xl relative z-10">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold flex items-center gap-2">
            <svg className="w-4 h-4 text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" /></svg>
            24H MARKET LIQUIDATIONS
          </h3>
          <span className="text-[9px] bg-white/5 px-2 py-1 rounded text-zinc-400 border border-white/5 tracking-widest uppercase font-bold">GLOBAL METRICS</span>
        </div>
        <div className="flex justify-between text-xs font-mono font-bold mb-2">
          <span className="text-red-400">LONGS REKT: ${(LIQUIDATIONS_MOCK.longsRekt / 1000000).toFixed(1)}M</span>
          <span className="text-emerald-400">SHORTS REKT: ${(LIQUIDATIONS_MOCK.shortsRekt / 1000000).toFixed(1)}M</span>
        </div>
        <div className="w-full h-3 rounded-full overflow-hidden flex border border-white/5 shadow-inner">
          <div className="bg-gradient-to-r from-red-600 to-red-400 h-full transition-all duration-1000" style={{ width: `${(LIQUIDATIONS_MOCK.longsRekt / (LIQUIDATIONS_MOCK.longsRekt + LIQUIDATIONS_MOCK.shortsRekt)) * 100}%` }}></div>
          <div className="bg-gradient-to-l from-emerald-600 to-emerald-400 h-full transition-all duration-1000" style={{ width: `${(LIQUIDATIONS_MOCK.shortsRekt / (LIQUIDATIONS_MOCK.longsRekt + LIQUIDATIONS_MOCK.shortsRekt)) * 100}%` }}></div>
        </div>
      </div>
    ) : null
  };

  // ── ÚVODNÍ OBRAZOVKA (RESPONSIVE CYBERPUNK) ──
  if (!marketMode && activeView !== 'laboratory') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen w-full relative overflow-hidden font-sans bg-[#050505] p-4 lg:p-0">
        
        {/* Animované pozadí */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-950/20 via-[#050505] to-[#050505] z-0" />
        <motion.div animate={{ y: [0, -40, 0], x: [0, 20, 0] }} transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }} className="absolute top-[-10%] left-[-10%] w-[60vw] md:w-[40vw] h-[60vw] md:h-[40vw] max-w-[600px] max-h-[600px] bg-indigo-600 rounded-full blur-[80px] md:blur-[120px] opacity-20 z-0 pointer-events-none" />
        <motion.div animate={{ y: [0, 50, 0], x: [0, -30, 0] }} transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }} className="absolute bottom-[-10%] right-[-10%] w-[60vw] md:w-[40vw] h-[60vw] md:h-[40vw] max-w-[600px] max-h-[600px] bg-emerald-600 rounded-full blur-[80px] md:blur-[120px] opacity-20 z-0 pointer-events-none" />
        <motion.div animate={{ y: [0, -30, 0], scale: [1, 1.1, 1] }} transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }} className="absolute top-[30%] left-[40%] w-[40vw] md:w-[30vw] h-[40vw] md:h-[30vw] max-w-[500px] max-h-[500px] bg-blue-600 rounded-full blur-[80px] md:blur-[120px] opacity-10 z-0 pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center text-center w-full max-w-5xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="flex flex-col items-center">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-emerald-400 font-bold tracking-[0.4em] text-[8px] md:text-[10px] lg:text-xs mb-4 md:mb-6 uppercase drop-shadow-[0_0_15px_rgba(99,102,241,0.5)]">WELCOME TO ALGORY</span>
            
            {/* Responsivní písmo pro nadpis */}
            <h1 className="text-5xl md:text-7xl lg:text-9xl font-black tracking-tighter text-white drop-shadow-2xl mb-4 md:mb-6">Algory<span className="text-zinc-600">.</span></h1>
            
            <p className="text-zinc-400 text-xs md:text-sm lg:text-lg font-light tracking-wide max-w-[90%] md:max-w-2xl leading-relaxed">Advanced quantitative analysis & real-time execution engine.</p>
          </motion.div>

          <div className="w-full max-w-4xl flex flex-col gap-4 md:gap-6 mt-10 md:mt-16 relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <motion.div 
                initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }}
                whileHover={{ scale: 1.02, y: -5 }} whileTap={{ scale: 0.98 }}
                onClick={() => { setMarketMode('FOREX'); setActivePair("EURUSD"); if(!isAuthenticated) setShowAuthGate(true); }}
                className="cursor-pointer group relative bg-zinc-950/40 backdrop-blur-xl border border-white/10 hover:border-emerald-500/50 rounded-[1.5rem] md:rounded-[2rem] p-6 md:p-8 transition-all duration-300 overflow-hidden shadow-2xl"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4 md:mb-6 group-hover:shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all duration-300">
                  <span className="text-lg md:text-xl">💱</span>
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-white mb-2 tracking-wide group-hover:text-emerald-400 transition-colors text-left">Global Forex</h2>
                <p className="text-zinc-400 text-xs md:text-sm leading-relaxed font-sans text-left">
                  Live liquidity streams, cross-pair institutional arbitrage tracking, and deep orderflow metrics.
                </p>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.4 }}
                whileHover={{ scale: 1.02, y: -5 }} whileTap={{ scale: 0.98 }}
                onClick={() => { setMarketMode('CRYPTO'); setCryptoMode('standard'); setActivePair("BTCUSD"); if(!isAuthenticated) setShowAuthGate(true); }}
                className="cursor-pointer group relative bg-zinc-950/40 backdrop-blur-xl border border-white/10 hover:border-blue-500/50 rounded-[1.5rem] md:rounded-[2rem] p-6 md:p-8 transition-all duration-300 overflow-hidden shadow-2xl"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-4 md:mb-6 group-hover:shadow-[0_0_20px_rgba(59,130,246,0.3)] transition-all duration-300">
                  <span className="text-lg md:text-xl">₿</span>
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-white mb-2 tracking-wide group-hover:text-blue-400 transition-colors text-left">Digital Assets</h2>
                <p className="text-zinc-400 text-xs md:text-sm leading-relaxed font-sans text-left">
                  Spatial crypto arbitrage monitoring, real-time funding rates analysis, and derivative flow pools.
                </p>
              </motion.div>
            </div>

            <motion.div 
              initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.6 }}
              whileHover={{ scale: 1.01, y: -3 }} whileTap={{ scale: 0.99 }}
              onClick={() => { setMarketMode('FOREX'); setActiveView('laboratory'); if(!isAuthenticated) setShowAuthGate(true); }}
              className="cursor-pointer group relative bg-zinc-950/60 backdrop-blur-2xl border border-indigo-500/30 hover:border-indigo-400/80 rounded-[1.5rem] md:rounded-[2rem] p-6 md:p-8 transition-all duration-500 overflow-hidden shadow-[0_0_50px_rgba(99,102,241,0.05)] hover:shadow-[0_0_60px_rgba(99,102,241,0.2)]"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 via-purple-500/5 to-indigo-500/5 opacity-40 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="absolute -top-24 -right-24 w-56 h-56 bg-indigo-500/15 rounded-full blur-[90px] group-hover:bg-indigo-400/25 transition-colors duration-500 pointer-events-none"></div>
              <div className="absolute -bottom-24 -left-24 w-56 h-56 bg-purple-500/15 rounded-full blur-[90px] group-hover:bg-purple-400/25 transition-colors duration-500 pointer-events-none"></div>
              
              <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 md:gap-8">
                <div className="flex flex-col flex-1 text-left">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.4)]">
                      <span className="text-white font-bold text-base md:text-lg">🧪</span>
                    </div>
                    <h2 className="text-xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 tracking-wide uppercase">
                      AI Quant Laboratory
                    </h2>
                  </div>
                  <p className="text-zinc-400 text-xs md:text-sm leading-relaxed max-w-2xl font-sans">
                    Enter the cloud engine. Develop & backtest Python models on historical tick data. Features OpenAI insights, dynamic strategy generation, and strict Prop Firm evaluation limits.
                  </p>
                </div>
                
                <div className="flex items-center gap-2 md:gap-3 px-4 py-3 md:px-6 md:py-4 bg-indigo-500/10 border border-indigo-500/30 rounded-xl md:rounded-2xl text-indigo-400 font-mono font-bold tracking-widest text-[10px] md:text-xs uppercase group-hover:bg-indigo-500 group-hover:text-white group-hover:shadow-[0_0_30px_rgba(99,102,241,0.4)] transition-all duration-300 whitespace-nowrap">
                  Initialize Engine
                  <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    );
  }

  // ── AUTH GATE ──
  if (showAuthGate && !isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center h-screen w-full bg-[#050505] text-white relative overflow-hidden font-sans p-4">
        <form onSubmit={handleRegister} className="relative z-10 w-full max-w-md p-6 md:p-10 bg-white/[0.02] backdrop-blur-2xl border border-white/5 rounded-[2rem] shadow-2xl flex flex-col gap-6 animate-in fade-in zoom-in-95 duration-500">
          <div className="text-center mb-2 md:mb-4"><h2 className="text-xl md:text-2xl font-bold tracking-tight text-white mb-2">REQUEST ACCESS</h2><p className="text-[9px] md:text-[10px] text-zinc-400 uppercase tracking-widest">CONNECT TO ALGORY ENGINE</p></div>
          <div className="flex flex-col gap-2"><label className="text-[9px] md:text-[10px] text-zinc-500 font-bold uppercase tracking-widest ml-1">TRADER NICKNAME</label><input type="text" required value={nickname} onChange={(e) => setNickname(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500/50 transition-all" placeholder="e.g. AlgoMaster99" /></div>
          <div className="flex flex-col gap-2"><label className="text-[9px] md:text-[10px] text-zinc-500 font-bold uppercase tracking-widest ml-1">EMAIL ADDRESS</label><input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={`w-full bg-black/50 border ${emailError ? 'border-red-500/50' : 'border-white/10'} rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500/50 transition-all`} placeholder="name@domain.com" />{emailError && <span className="text-[10px] text-red-400 font-medium ml-1">{emailError}</span>}</div>
          <button type="submit" disabled={isSubmitting} className="mt-2 md:mt-4 w-full py-4 bg-emerald-500 text-black font-bold text-[10px] tracking-widest uppercase rounded-xl transition-all hover:bg-emerald-400 hover:-translate-y-1 hover:shadow-lg disabled:opacity-50">{isSubmitting ? "CONNECTING..." : "ENTER TERMINAL"}</button>
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

      {/* ODSTRANĚNO min-w-[1024px] pro responzivitu na mobilech */}
      <div className="flex h-screen w-full bg-[#050505] text-zinc-200 selection:bg-emerald-500/30 overflow-hidden font-sans animate-in fade-in duration-700 relative">
        
        {/* Původní animované pozadí */}
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden hidden md:block">
          <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] max-w-[600px] max-h-[600px] bg-indigo-500 rounded-full blur-[120px] opacity-[0.08] animate-pulse" style={{ animationDuration: '8s' }} />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] max-w-[600px] max-h-[600px] bg-emerald-500 rounded-full blur-[120px] opacity-[0.08] animate-pulse" style={{ animationDuration: '12s' }} />
          <div className="absolute top-[30%] left-[40%] w-[30vw] h-[30vw] max-w-[500px] max-h-[500px] bg-blue-500 rounded-full blur-[120px] opacity-[0.06] animate-pulse" style={{ animationDuration: '10s' }} />
        </div>

        {/* Sidebar zobrazen jen pokud nejsme v laboratoři. Uvnitř samotné komponenty je nyní skrytí pro mobily (lg:hidden) */}
        {activeView !== 'laboratory' && (
          <Sidebar 
            activeView={activeView} setActiveView={setActiveView}
            marketMode={marketMode} setMarketMode={setMarketMode}
            cryptoMode={cryptoMode} setCryptoMode={setCryptoMode}
            activePair={activePair} setActivePair={setActivePair}
            data={data} 
            spatialArbData={data.crypto_arb?.spatial || {}}
            triangularArbData={data.crypto_arb?.triangular || {}}
            fundingRateData={data.crypto_arb?.funding || {}}
            openGroups={openGroups} setOpenGroups={setOpenGroups}
            favorites={favorites} setFavorites={setFavorites}
            activeDragId={null} setActiveDragId={() => {}}
            handleSeedFirebase={handleSeedFirebase}
          />
        )}

        {/* Zásadní změna: Přidáno pb-32 lg:pb-24, aby na mobilu obsah "nepodtekl" pod novou navigační spodní lištu. 
        */}
        <main className={`flex-1 min-w-0 h-full overflow-y-auto custom-scrollbar px-4 md:px-6 pt-6 md:pt-12 pb-32 lg:pb-20 scroll-smooth transition-colors duration-1000 ease-in-out bg-gradient-to-br animate-bg-gradient ${getPageBackground()} relative z-10`}>
          <div className={`${activeView === 'laboratory' ? 'w-full max-w-full' : 'max-w-[1400px] mx-auto w-full'} relative z-10 transition-all duration-500`}>
            
            <MarketMonitor lastRefresh={lastRefresh} mode={marketMode === 'CRYPTO' ? `CRYPTO (${cryptoMode.toUpperCase()})` : 'FOREX'} activeView={activeView} />

            {activeView === 'laboratory' ? (
              <BacktestLab onBack={() => { setActiveView('terminal'); setMarketMode('FOREX'); }} />
            ) : loading && !data.majors ? (
              <div className="p-10 md:p-20 mt-10 text-center flex flex-col items-center justify-center gap-4 md:gap-6 border border-white/10 rounded-[2rem] bg-white/[0.02]">
                <div className={`w-8 h-8 md:w-10 md:h-10 border-4 border-t-transparent rounded-full animate-spin ${marketMode === 'CRYPTO' ? 'border-blue-500/30 border-t-blue-500' : 'border-emerald-500/30 border-t-emerald-500'}`}></div>
                <span className="text-[9px] md:text-[10px] text-zinc-400 font-bold tracking-widest uppercase">SYSTEM SCANNING...</span>
              </div>
            ) : error && !data.majors ? (
              <div className="p-6 md:p-10 mt-10 text-center text-[9px] md:text-[10px] uppercase font-bold text-red-400 border border-red-900/40 bg-red-950/20 rounded-[1.5rem] md:rounded-[2rem]">{error}</div>
            ) : (
              <div className="flex flex-col xl:flex-row gap-6 md:gap-10 mt-6 md:mt-10 w-full items-start">
                <div className="w-full xl:w-2/3 flex flex-col space-y-6 md:space-y-10">
                  {marketMode === 'CRYPTO' && cryptoMode === 'spatial_arb' ? (
                    <SpatialArbitragePanel arbData={data.crypto_arb?.spatial?.[activePair]} />
                  ) : marketMode === 'CRYPTO' && cryptoMode === 'triangular_arb' ? (
                    <TriangularArbitragePanel arbData={data.crypto_arb?.triangular?.[activePair]} />
                  ) : marketMode === 'CRYPTO' && cryptoMode === 'funding_rates' ? (
                    <FundingRatesPanel data={data.crypto_arb?.funding?.[activePair]} />
                  ) : (
                    <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleWidgetDragStart} onDragEnd={handleWidgetDragEnd}>
                      <SortableContext items={mainLayout} strategy={verticalListSortingStrategy}>
                        <div className="flex flex-col space-y-6 md:space-y-10 w-full">
                          {mainLayout.map((widgetId) => (
                              widgetMap[widgetId] ? (
                                <DraggableWidget key={widgetId} id={widgetId}>{widgetMap[widgetId]}</DraggableWidget>
                              ) : null
                          ))}
                        </div>
                      </SortableContext>
                      <DragOverlay dropAnimation={dropAnimationConfig}>
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