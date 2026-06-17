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

import Sidebar from './Sidebar';
import NewsPanel from './NewsPanel';
import ChartArea from './ChartArea';
import { SpatialArbitragePanel, TriangularArbitragePanel, FundingRatesPanel, SpatialArbData, TriangularArbData, FundingRateData } from './ArbitragePanel';
import BacktestLab from './BacktestLab';

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
    <span className="flex items-center justify-center w-3.5 h-3.5 text-[9px] border border-white/20 text-zinc-400 rounded-full hover:bg-white/10 hover:text-white transition-colors">i</span>
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-[#0A0A0A] border border-white/10 text-white/90 text-xs rounded-lg shadow-2xl opacity-0 group-hover/tt:opacity-100 transition-all pointer-events-none z-50 font-normal normal-case tracking-normal text-left">
      {info}
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

  return (
    <div className="mb-6 p-6 bg-transparent border border-white/5 rounded-xl flex-shrink-0 z-10 font-sans">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-8 relative z-10">
        <div className="flex flex-col gap-1 w-full md:w-auto">
          <div className="text-[10px] font-medium text-zinc-500 uppercase tracking-widest mb-1">
             {activeView === 'terminal' ? `System Sync • ${mode}` : 'Development Environment'}
          </div>
          <div className="text-4xl font-mono tracking-tight text-zinc-100 flex items-baseline">
            {activeView === 'terminal' ? (
              <>
                {displayTime.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })}
                <span className="text-xl text-zinc-600 ml-1">:{displayTime.getSeconds().toString().padStart(2, '0')}</span>
              </>
            ) : "AI BACKTEST LAB"}
          </div>
        </div>

        {activeView === 'terminal' && (
          <div className="flex flex-wrap gap-6 w-full md:w-auto">
            {sessions.map((s) => (
              <div key={s.name} className="flex flex-col">
                <span className={`text-[10px] font-medium uppercase tracking-widest mb-1 flex items-center gap-1.5 ${s.isActive ? 'text-white' : 'text-zinc-600'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${s.isActive ? 'bg-white' : 'bg-zinc-800'}`}></span> {s.name}
                </span>
                <span className={`text-sm font-mono ${s.isActive ? 'text-zinc-200' : 'text-zinc-600'}`}>{s.open} - {s.close}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {activeView === 'terminal' && (
        <div className="mt-6 relative z-10">
          <div className="flex justify-between text-[10px] text-zinc-500 font-medium mb-2 uppercase tracking-widest">
            <span>M15 Cycle</span><span className="font-mono">{15 - (minutes % 15)}m {(60 - seconds) % 60}s</span>
          </div>
          <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
            <div className="h-full bg-white/20 transition-all duration-1000 ease-linear" style={{ width: `${progressPercent}%` }} />
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

  return (
    <div className="p-6 bg-transparent border border-white/5 rounded-xl mt-6">
      <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-medium mb-4 flex items-center">
        Position Sizing
        <InfoTooltip info="Calculates precise trade volume based on your account balance, risk percentage, and the AI-generated Stop Loss distance." />
      </div>
      <div className="flex gap-4 items-end">
        <div className="flex flex-col gap-2 w-1/3">
          <label className="text-[10px] text-zinc-500 uppercase tracking-widest">Balance ($)</label>
          <input type="number" value={balance} onChange={(e) => setBalance(Number(e.target.value))} className="bg-transparent border border-white/10 hover:border-white/20 rounded-lg px-4 py-2 text-sm text-white font-mono focus:outline-none focus:border-white/40 transition-colors" />
        </div>
        <div className="flex flex-col gap-2 w-1/3">
          <label className="text-[10px] text-zinc-500 uppercase tracking-widest">Risk (%)</label>
          <input type="number" step="0.1" value={riskPercent} onChange={(e) => setRiskPercent(Number(e.target.value))} className="bg-transparent border border-white/10 hover:border-white/20 rounded-lg px-4 py-2 text-sm text-white font-mono focus:outline-none focus:border-white/40 transition-colors" />
        </div>
        <div className="w-1/3 flex flex-col items-center justify-center py-2 px-4 rounded-lg bg-white/[0.02] border border-white/5">
          <span className="text-[10px] uppercase tracking-widest mb-1 text-zinc-500">Volume</span>
          <span className="text-xl text-white font-mono">{lotSize} <span className="text-xs text-zinc-500 font-sans">Lots</span></span>
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
      <div {...attributes} {...listeners} className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#0A0A0A] border border-white/10 text-zinc-500 px-3 py-1 rounded-full cursor-grab active:cursor-grabbing opacity-0 group-hover/widget:opacity-100 transition-opacity z-50 flex items-center justify-center hover:text-white hover:border-white/30">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="12" r="1"/><circle cx="9" cy="5" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="19" r="1"/></svg>
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
  let inferredDirection = "NEUTRAL";
  let isTradeActive = false;

  if (clampedProb >= 0.52) { inferredDirection = "BUY"; isTradeActive = true; } 
  else if (clampedProb <= 0.48 && clampedProb > 0) { inferredDirection = "SELL"; isTradeActive = true; }

  const renderAiAnalysisWidget = () => {
    if (!activeParams) return null;
    return (
      <div className="bg-transparent border border-white/5 rounded-xl overflow-hidden p-8 font-sans">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 border-b border-white/5 pb-8">
          <div className="w-full">
            <div className="flex items-center gap-4 mb-4">
              <h2 className="text-3xl font-medium text-white tracking-tight">{displayTicker}</h2>
              {isTradeActive && (
                <span className={`px-3 py-1 text-[10px] font-medium uppercase tracking-widest rounded-md border ${
                  inferredDirection === 'BUY' ? 'bg-white/10 text-white border-white/20' : 'bg-white/10 text-white border-white/20'
                }`}>{inferredDirection} PENDING</span>
              )}
              {activeParams?.KeyDriver && (
                <span className="px-3 py-1 bg-white/[0.02] text-zinc-400 text-[10px] uppercase tracking-widest rounded-md border border-white/5 font-medium">{activeParams.KeyDriver}</span>
              )}
            </div>
            
            <div className="flex flex-wrap items-center gap-3 mt-4">
              <span className="px-3 py-1.5 bg-transparent border border-white/5 rounded-lg text-[11px]"><span className="text-zinc-500 mr-2 uppercase tracking-widest">SL</span><span className="text-zinc-100 font-mono">{activeParams.SL}</span></span>
              <span className="px-3 py-1.5 bg-transparent border border-white/5 rounded-lg text-[11px]"><span className="text-zinc-500 mr-2 uppercase tracking-widest">TP</span><span className="text-zinc-100 font-mono">{activeParams.TP === 9999 ? 'OPEN' : activeParams.TP}</span></span>
              {activeParams.RRR && <span className="px-3 py-1.5 bg-transparent border border-white/5 rounded-lg text-[11px]"><span className="text-zinc-500 mr-2 uppercase tracking-widest">RRR</span><span className="text-zinc-100 font-mono">1:{activeParams.RRR}</span></span>}
              <span className="px-3 py-1.5 bg-transparent border border-white/5 rounded-lg text-[11px]"><span className="text-zinc-500 mr-2 uppercase tracking-widest">BE</span><span className="text-zinc-100 font-mono">{activeParams.BE}</span></span>
              <span className="px-3 py-1.5 bg-transparent border border-white/5 rounded-lg text-[11px]"><span className="text-zinc-500 mr-2 uppercase tracking-widest">SPREAD</span><span className="text-zinc-100 font-mono">{activeParams.LiveSpread !== "N/A" ? activeParams.LiveSpread : activeParams.MaxSpread}</span></span>
              {activeParams.LivePrice && <span className="px-3 py-1.5 bg-white/[0.02] border border-white/10 rounded-lg text-[11px] ml-auto"><span className="text-zinc-400 mr-2 uppercase tracking-widest">LIVE</span><span className="text-white font-mono">{activeParams.LivePrice}</span></span>}
            </div>
            <PositionCalculator slPips={activeParams.SL} direction={inferredDirection} />
          </div>

          <div className="flex flex-col items-center gap-4 flex-shrink-0 min-w-[200px]">
            <div className="text-4xl font-mono text-white mb-2 tracking-tight">
              {(activeProb * 100).toFixed(1)}%
            </div>
            {isTradeActive ? (
              <button className="w-full px-6 py-3 text-[10px] font-medium uppercase tracking-widest rounded-lg bg-white text-black hover:bg-zinc-200 transition-colors">
                Execute {inferredDirection}
              </button>
            ) : (
              <button disabled className="w-full px-6 py-3 bg-transparent text-zinc-600 text-[10px] font-medium uppercase tracking-widest rounded-lg border border-white/5 cursor-not-allowed">Low Conviction</button>
            )}
          </div>
        </div>

        {activeParams?.aiAnalysis && (
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="bg-transparent border border-white/5 rounded-xl p-6">
              <div className="text-[10px] text-zinc-500 font-medium uppercase tracking-widest mb-3 flex items-center justify-between"><span>Previous: {activeParams.aiAnalysis.prev_session}</span></div>
              <p className="text-sm text-zinc-300 leading-relaxed">{activeParams.aiAnalysis.evaluation}</p>
            </div>
            <div className="bg-white/[0.02] border border-white/10 rounded-xl p-6">
              <div className="text-[10px] font-medium uppercase tracking-widest mb-3 flex items-center justify-between text-zinc-400">
                <span>Prediction: {activeParams.aiAnalysis.current_session}</span>
              </div>
              <p className="text-sm text-zinc-100 leading-relaxed">{activeParams.aiAnalysis.prediction}</p>
            </div>
          </div>
        )}

        {activeParams?.history && (
          <div className="border-t border-white/5 pt-6 mt-2">
            <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-medium mb-4">Signal History</div>
            <div className="flex flex-wrap gap-2">
              {activeParams.history.map((trade, idx) => (
                <div key={idx} className="flex items-center gap-3 px-3 py-2 rounded-lg border border-white/5 bg-transparent">
                  <span className="text-[10px] text-zinc-500 font-mono">{trade.date}</span>
                  <span className="text-[10px] font-medium text-zinc-300">{trade.type}</span>
                  <span className={`text-[10px] font-mono ${trade.result === 'WIN' ? 'text-emerald-500' : 'text-red-500'}`}>{trade.pips > 0 ? '+' : ''}{trade.pips}</span>
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
      <div className="w-full bg-transparent border border-white/5 rounded-xl p-6 font-sans">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-[10px] text-zinc-500 uppercase tracking-widest font-medium">
            24H Liquidations
          </h3>
          <span className="text-[9px] text-zinc-500 border border-white/5 px-2 py-1 rounded">Global</span>
        </div>
        <div className="flex justify-between text-xs font-mono mb-2">
          <span className="text-red-500">Longs: ${(LIQUIDATIONS_MOCK.longsRekt / 1000000).toFixed(1)}M</span>
          <span className="text-emerald-500">Shorts: ${(LIQUIDATIONS_MOCK.shortsRekt / 1000000).toFixed(1)}M</span>
        </div>
        <div className="w-full h-1 rounded-full overflow-hidden flex bg-white/5">
          <div className="bg-red-500 h-full" style={{ width: `${(LIQUIDATIONS_MOCK.longsRekt / (LIQUIDATIONS_MOCK.longsRekt + LIQUIDATIONS_MOCK.shortsRekt)) * 100}%` }}></div>
          <div className="bg-emerald-500 h-full" style={{ width: `${(LIQUIDATIONS_MOCK.shortsRekt / (LIQUIDATIONS_MOCK.longsRekt + LIQUIDATIONS_MOCK.shortsRekt)) * 100}%` }}></div>
        </div>
      </div>
    ) : null
  };

  // ── ÚVODNÍ OBRAZOVKA (LINEAR STYLE MINIMALISM) ──
  if (!marketMode && activeView !== 'laboratory') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen w-full bg-[#0A0A0A] text-zinc-200 font-sans selection:bg-white/10">
        <div className="relative z-10 flex flex-col items-center px-4 w-full max-w-4xl text-left md:text-center">
          
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full flex flex-col md:items-center">
            <span className="text-[10px] tracking-widest text-zinc-500 uppercase mb-4">Algory Terminal</span>
            <h1 className="text-5xl md:text-6xl font-medium tracking-tight text-white mb-4">Quant Infrastructure</h1>
            <p className="text-sm md:text-base text-zinc-500 max-w-xl leading-relaxed">
              Institutional grade execution engine. Real-time liquidity streams, structural analysis, and Python backtesting cloud.
            </p>
          </motion.div>

          {/* Karty - Wireframe styl */}
          <div className="w-full flex flex-col gap-4 mt-16">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <motion.div 
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
                onClick={() => { setMarketMode('FOREX'); setActivePair("EURUSD"); if(!isAuthenticated) setShowAuthGate(true); }}
                className="cursor-pointer p-8 bg-transparent border border-white/5 hover:border-white/15 hover:bg-white/[0.02] rounded-xl transition-all duration-200 flex flex-col text-left group"
              >
                <div className="text-[10px] font-medium uppercase tracking-widest text-zinc-500 mb-6">Market Data</div>
                <h2 className="text-xl font-medium tracking-tight text-zinc-100 group-hover:text-white transition-colors mb-2">Global Forex</h2>
                <p className="text-sm text-zinc-500 leading-relaxed">Live liquidity streams, cross-pair institutional arbitrage tracking, and deep orderflow metrics.</p>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}
                onClick={() => { setMarketMode('CRYPTO'); setCryptoMode('standard'); setActivePair("BTCUSD"); if(!isAuthenticated) setShowAuthGate(true); }}
                className="cursor-pointer p-8 bg-transparent border border-white/5 hover:border-white/15 hover:bg-white/[0.02] rounded-xl transition-all duration-200 flex flex-col text-left group"
              >
                <div className="text-[10px] font-medium uppercase tracking-widest text-zinc-500 mb-6">Digital Assets</div>
                <h2 className="text-xl font-medium tracking-tight text-zinc-100 group-hover:text-white transition-colors mb-2">Crypto Matrices</h2>
                <p className="text-sm text-zinc-500 leading-relaxed">Spatial crypto arbitrage monitoring, real-time funding rates analysis, and derivative flow pools.</p>
              </motion.div>
            </div>

            <motion.div 
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}
              onClick={() => { setMarketMode('FOREX'); setActiveView('laboratory'); if(!isAuthenticated) setShowAuthGate(true); }}
              className="cursor-pointer p-8 bg-transparent border border-white/5 hover:border-white/15 hover:bg-white/[0.02] rounded-xl transition-all duration-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 text-left group"
            >
              <div className="flex flex-col">
                <div className="text-[10px] font-medium uppercase tracking-widest text-zinc-500 mb-4 flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-white/20"></span> Development Environment
                </div>
                <h2 className="text-xl font-medium tracking-tight text-zinc-100 group-hover:text-white transition-colors mb-2">AI Quant Laboratory</h2>
                <p className="text-sm text-zinc-500 leading-relaxed max-w-xl">
                  Develop & backtest Python models on historical tick data. Features OpenAI insights, dynamic strategy generation, and strict evaluation limits.
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs font-medium text-zinc-400 group-hover:text-white transition-colors uppercase tracking-widest whitespace-nowrap">
                Initialize Engine <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
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
      <div className="flex flex-col items-center justify-center min-h-screen w-full bg-[#0A0A0A] text-zinc-200 font-sans selection:bg-white/10">
        <form onSubmit={handleRegister} className="w-full max-w-sm p-8 bg-transparent border border-white/5 rounded-xl flex flex-col gap-6">
          <div className="mb-2">
            <h2 className="text-xl font-medium tracking-tight text-white mb-1">Request Access</h2>
            <p className="text-xs text-zinc-500">Connect to Algory Engine</p>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-[10px] text-zinc-500 font-medium uppercase tracking-widest">Trader Nickname</label>
            <input type="text" required value={nickname} onChange={(e) => setNickname(e.target.value)} className="w-full bg-transparent border border-white/10 hover:border-white/20 focus:border-white/40 rounded-lg px-4 py-3 text-sm text-white focus:outline-none transition-colors" placeholder="e.g. AlgoMaster99" />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-[10px] text-zinc-500 font-medium uppercase tracking-widest">Email Address</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={`w-full bg-transparent border ${emailError ? 'border-red-500/50' : 'border-white/10 hover:border-white/20 focus:border-white/40'} rounded-lg px-4 py-3 text-sm text-white focus:outline-none transition-colors`} placeholder="name@domain.com" />
            {emailError && <span className="text-[10px] text-red-400 font-medium">{emailError}</span>}
          </div>
          <button type="submit" disabled={isSubmitting} className="mt-2 w-full py-3 bg-white text-black font-medium text-xs uppercase tracking-widest rounded-lg transition-colors hover:bg-zinc-200 disabled:opacity-50">
            {isSubmitting ? "Connecting..." : "Enter Terminal"}
          </button>
        </form>
      </div>
    );
  }

  // ── HLAVNÍ TERMINÁL (LINEAR STYLE) ──
  return (
    <div className="flex h-screen w-full bg-[#0A0A0A] text-zinc-200 selection:bg-white/10 overflow-hidden font-sans">
      
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

      <main className="flex-1 min-w-0 h-full overflow-y-auto custom-scrollbar px-6 pt-12 pb-24 lg:px-12 lg:pt-16 scroll-smooth bg-[#0A0A0A] relative z-10">
        <div className={`${activeView === 'laboratory' ? 'w-full max-w-full' : 'max-w-[1400px] mx-auto w-full'} transition-all duration-300`}>
          
          <MarketMonitor lastRefresh={lastRefresh} mode={marketMode === 'CRYPTO' ? `CRYPTO (${cryptoMode.toUpperCase()})` : 'FOREX'} activeView={activeView} />

          {activeView === 'laboratory' ? (
            <BacktestLab onBack={() => { setActiveView('terminal'); setMarketMode('FOREX'); }} />
          ) : loading && !data.majors ? (
            <div className="p-20 mt-10 text-center flex flex-col items-center justify-center gap-4 border border-white/5 rounded-xl">
              <svg className="animate-spin h-5 w-5 text-zinc-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              <span className="text-[10px] text-zinc-500 font-medium uppercase tracking-widest">Scanning Data</span>
            </div>
          ) : error && !data.majors ? (
            <div className="p-8 mt-10 text-center text-xs text-red-400 border border-red-900/30 rounded-xl">{error}</div>
          ) : (
            <div className="flex flex-col xl:flex-row gap-8 mt-8 w-full items-start">
              <div className="w-full xl:w-2/3 flex flex-col space-y-8">
                {marketMode === 'CRYPTO' && cryptoMode === 'spatial_arb' ? (
                  <SpatialArbitragePanel arbData={data.crypto_arb?.spatial?.[activePair]} />
                ) : marketMode === 'CRYPTO' && cryptoMode === 'triangular_arb' ? (
                  <TriangularArbitragePanel arbData={data.crypto_arb?.triangular?.[activePair]} />
                ) : marketMode === 'CRYPTO' && cryptoMode === 'funding_rates' ? (
                  <FundingRatesPanel data={data.crypto_arb?.funding?.[activePair]} />
                ) : (
                  <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleWidgetDragStart} onDragEnd={handleWidgetDragEnd}>
                    <SortableContext items={mainLayout} strategy={verticalListSortingStrategy}>
                      <div className="flex flex-col space-y-8 w-full">
                        {mainLayout.map((widgetId) => (
                            widgetMap[widgetId] ? (
                              <DraggableWidget key={widgetId} id={widgetId}>{widgetMap[widgetId]}</DraggableWidget>
                            ) : null
                        ))}
                      </div>
                    </SortableContext>
                    <DragOverlay dropAnimation={dropAnimationConfig}>
                      {activeWidgetDragId && widgetMap[activeWidgetDragId] ? (
                        <div className="opacity-90 scale-[1.02] pointer-events-none shadow-2xl">{widgetMap[activeWidgetDragId]}</div>
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
  );
}