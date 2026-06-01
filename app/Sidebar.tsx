"use client";

import React from 'react';
import { 
  DndContext, DragOverlay, closestCorners, pointerWithin, rectIntersection,
  KeyboardSensor, PointerSensor, useSensor, useSensors, DragStartEvent, DragEndEvent
} from '@dnd-kit/core';
import { 
  arrayMove, SortableContext, sortableKeyboardCoordinates, 
  verticalListSortingStrategy, useSortable 
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// === INTERFACES & MOCK DATA ===
type ArbStatus = 'ACTIVE' | 'DEGRADING' | 'CLOSED';
interface ChartPoint { time: string; spread: number; }
export interface SpatialArbData { id: string; asset: string; buyExchange: string; sellExchange: string; askPrice: number; bidPrice: number; spreadPercent: number; estimatedFeePercent: number; status: ArbStatus; chartData: ChartPoint[]; }
export interface TriangularArbData { id: string; pairName: string; path: string[]; rate1: number; rate2: number; rate3: number; expectedProfitPercent: number; status: ArbStatus; chartData: ChartPoint[]; }
export interface FundingRateData { id: string; asset: string; binanceRate: number; bybitRate: number; okxRate: number; optimalLong: string; optimalShort: string; netYield: number; status: ArbStatus; chartData: ChartPoint[]; }

const MOCK_CRYPTO_PAIRS: Record<string, number> = {
  "BTCUSD": 0.85, "ETHUSD": 0.72, "SOLUSD": 0.65, "ADAUSD": 0.55, "BNBUSD": 0.60, 
  "XRPUSD": 0.45, "MATICUSD": 0.48, "DOTUSD": 0.51, "AVAXUSD": 0.62, "DOGEUSD": 0.88, 
  "LINKUSD": 0.40, "UNIUSD": 0.58, "LTCUSD": 0.49, "PEPEUSD": 0.92, "SHIBUSD": 0.41,
  "TRXUSD": 0.61, "TONUSD": 0.75, "BCHUSD": 0.53, "XLMUSD": 0.38, "NEARUSD": 0.68,
  "APTUSD": 0.70, "ARBUSD": 0.45, "OPUSD": 0.55, "LDOUSD": 0.50, "ATOMUSD": 0.48,
  "INJUSD": 0.74, "RNDRUSD": 0.80, "IMXUSD": 0.65, "STXUSD": 0.60, "KASUSD": 0.78,
  "WIFUSD": 0.85, "FETUSD": 0.82, "FILUSD": 0.45, "ICPUSD": 0.52, "VETUSD": 0.40,
  "MKRUSD": 0.66, "AAVEUSD": 0.59, "SNXUSD": 0.42, "CRVUSD": 0.35, "THETAUSD": 0.44,
  "SANDUSD": 0.39, "MANAUSD": 0.37, "ALGOUSD": 0.35, "FTMUSD": 0.58, "QNTUSD": 0.51,
  "EGLDUSD": 0.47, "FLOWUSD": 0.33, "AXSUSD": 0.36, "CHZUSD": 0.41, "ENJUSD": 0.34
};

export interface SidebarProps {
  marketMode: 'FOREX' | 'CRYPTO' | null;
  setMarketMode: (mode: 'FOREX' | 'CRYPTO' | null) => void;
  cryptoMode: 'standard' | 'spatial_arb' | 'triangular_arb' | 'funding_rates';
  setCryptoMode: (mode: 'standard' | 'spatial_arb' | 'triangular_arb' | 'funding_rates') => void;
  activePair: string;
  setActivePair: (pair: string) => void;
  data: any;
  spatialArbData: Record<string, SpatialArbData>;
  triangularArbData: Record<string, TriangularArbData>;
  fundingRateData: Record<string, FundingRateData>;
  openGroups: Record<string, boolean>;
  setOpenGroups: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  favorites: string[];
  setFavorites: React.Dispatch<React.SetStateAction<string[]>>;
  activeDragId: string | null;
  setActiveDragId: React.Dispatch<React.SetStateAction<string | null>>;
  handleSeedFirebase: () => void;
}

const customCollisionDetection = (args: any) => {
  const pointerCollisions = pointerWithin(args);
  if (pointerCollisions.length > 0) return pointerCollisions;
  const rectCollisions = rectIntersection(args);
  if (rectCollisions.length > 0) return rectCollisions;
  return closestCorners(args);
};

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
        <button onClick={(e) => { e.stopPropagation(); onToggleFavorite(ticker); }} className={`transition-all duration-300 hover:scale-110 ${isFavorite ? 'text-zinc-300 hover:text-red-400' : 'text-zinc-600 hover:text-white'}`}>
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

export default function Sidebar({
  marketMode, setMarketMode, cryptoMode, setCryptoMode, activePair, setActivePair,
  data, spatialArbData, triangularArbData, fundingRateData,
  openGroups, setOpenGroups, favorites, setFavorites, activeDragId, setActiveDragId, handleSeedFirebase
}: SidebarProps) {

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

  const toggleFavorite = (ticker: string) => { 
      setFavorites(prev => prev.includes(ticker) ? prev.filter(t => t !== ticker) : [...prev, ticker]); 
  };

  const getProbForTicker = (ticker: string) => {
    const fallbackCrypto = data.crypto && Object.keys(data.crypto).length > 0 ? data.crypto : MOCK_CRYPTO_PAIRS;
    return data.majors?.[ticker] ?? data.minors?.[ticker] ?? data.metals?.[ticker] ?? fallbackCrypto?.[ticker] ?? 0;
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
      <div className="mb-6 z-10 relative">
        <div className="w-full flex items-center justify-between px-6 py-2 mb-3 group">
          <button onClick={() => setOpenGroups(prev => ({ ...prev, [title]: !prev[title] }))} className="flex items-center gap-2 cursor-pointer outline-none">
            {getSidebarIcon(title)}
            <span className="text-[10px] font-bold text-zinc-500 group-hover:text-zinc-300 uppercase tracking-widest transition-colors flex items-center">
              {title}
            </span>
          </button>
          {tooltipInfo && (
            <div className="relative group/navtt ml-auto mr-2">
              <span className="flex items-center justify-center w-3 h-3 text-[8px] border border-zinc-500 text-zinc-400 rounded-full cursor-help hover:bg-zinc-700 hover:text-white transition-colors">i</span>
              <div className="absolute z-50 hidden group-hover/navtt:block w-64 p-3 mt-2 text-xs text-zinc-300 bg-zinc-900 border border-zinc-700 rounded-lg shadow-2xl top-1/2 -translate-y-1/2 right-full mr-2 text-left font-normal normal-case tracking-normal break-words">
                {tooltipInfo}
              </div>
            </div>
          )}
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

  return (
    <aside className="w-80 flex-shrink-0 border-r border-white/10 bg-[#050505]/60 backdrop-blur-xl flex flex-col h-full z-20 hidden md:flex overflow-hidden">
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
            <button onClick={() => { setCryptoMode('spatial_arb'); setActivePair("ARB-BTC-1"); }} className={`relative group/tt flex-1 min-w-[45%] text-[9px] font-bold tracking-widest uppercase py-1.5 rounded-lg transition-all flex items-center justify-center gap-1 ${cryptoMode === 'spatial_arb' ? 'bg-zinc-800 text-white shadow' : 'text-zinc-500 hover:text-zinc-300'}`}>
              SPATIAL
              <div className="absolute z-50 hidden group-hover/tt:block w-64 p-3 mt-2 text-xs text-zinc-300 bg-zinc-900 border border-zinc-700 rounded-lg shadow-2xl top-full left-0 text-left font-normal normal-case tracking-normal">
                Exploits price differences of the same asset across different exchanges.
              </div>
            </button>
            <button onClick={() => { setCryptoMode('triangular_arb'); setActivePair("TRI-1"); }} className={`relative group/tt flex-1 min-w-[45%] text-[9px] font-bold tracking-widest uppercase py-1.5 rounded-lg transition-all flex items-center justify-center gap-1 ${cryptoMode === 'triangular_arb' ? 'bg-zinc-800 text-white shadow' : 'text-zinc-500 hover:text-zinc-300'}`}>
              TRIANGLE
              <div className="absolute z-50 hidden group-hover/tt:block w-64 p-3 mt-2 text-xs text-zinc-300 bg-zinc-900 border border-zinc-700 rounded-lg shadow-2xl top-full left-0 text-left font-normal normal-case tracking-normal">
                Executes a sequence of three trades to profit from currency cross-rate inefficiencies.
              </div>
            </button>
            <button onClick={() => { setCryptoMode('funding_rates'); setActivePair("FUND-SOL"); }} className={`relative group/tt flex-1 min-w-[45%] text-[9px] font-bold tracking-widest uppercase py-1.5 rounded-lg transition-all flex items-center justify-center gap-1 ${cryptoMode === 'funding_rates' ? 'bg-zinc-800 text-white shadow' : 'text-zinc-500 hover:text-zinc-300'}`}>
              FUNDING
              <div className="absolute z-50 hidden group-hover/tt:block w-64 p-3 mt-2 text-xs text-zinc-300 bg-zinc-900 border border-zinc-700 rounded-lg shadow-2xl top-full left-0 text-left font-normal normal-case tracking-normal">
                Delta-neutral strategy collecting funding rate differences.
              </div>
            </button>
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto pb-6 custom-scrollbar pr-2 pl-2 flex flex-col">
        {marketMode === 'CRYPTO' && cryptoMode === 'spatial_arb' ? (
          <div className="pb-10">
            <div className="mb-6">
              <div className="w-full flex items-center justify-between px-6 py-2 mb-3">
                <div className="flex items-center gap-2">
                  <svg className="w-3.5 h-3.5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                  <span className="text-[10px] font-bold text-blue-500/80 uppercase tracking-widest flex items-center">SPATIAL ARBITRAGE</span>
                </div>
              </div>
              <div className="space-y-2 px-3 z-10 relative">
                {Object.values(spatialArbData).map((arb) => (
                   <ArbSidebarItemNode key={arb.id} data={arb} isActive={activePair === arb.id} onClick={() => setActivePair(arb.id)} type="spatial" />
                ))}
              </div>
            </div>
          </div>
        ) : marketMode === 'CRYPTO' && cryptoMode === 'triangular_arb' ? (
          <div className="pb-10">
            <div className="mb-6">
              <div className="w-full flex items-center justify-between px-6 py-2 mb-3">
                <div className="flex items-center gap-2">
                  <svg className="w-3.5 h-3.5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                  <span className="text-[10px] font-bold text-purple-500/80 uppercase tracking-widest flex items-center">TRIANGULAR LOOPS</span>
                </div>
              </div>
              <div className="space-y-2 px-3 z-10 relative">
                {Object.values(triangularArbData).map((arb) => (
                   <ArbSidebarItemNode key={arb.id} data={arb} isActive={activePair === arb.id} onClick={() => setActivePair(arb.id)} type="triangular" />
                ))}
              </div>
            </div>
          </div>
        ) : marketMode === 'CRYPTO' && cryptoMode === 'funding_rates' ? (
          <div className="pb-10">
            <div className="mb-6">
              <div className="w-full flex items-center justify-between px-6 py-2 mb-3">
                <div className="flex items-center gap-2">
                  <svg className="w-3.5 h-3.5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <span className="text-[10px] font-bold text-orange-500/80 uppercase tracking-widest flex items-center">CROSS-EXCHANGE RATES</span>
                </div>
              </div>
              <div className="space-y-2 px-3 z-10 relative">
                {Object.values(fundingRateData).map((arb) => (
                   <ArbSidebarItemNode key={arb.id} data={arb} isActive={activePair === arb.id} onClick={() => setActivePair(arb.id)} type="funding" />
                ))}
              </div>
            </div>
          </div>
        ) : (
          <>
            <DndContext sensors={sensors} collisionDetection={customCollisionDetection} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
              <div className={`mb-6 mt-2 pb-4 pt-2 rounded-2xl transition-colors duration-300 w-full z-10 relative`}>
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

            <div className="flex-1 z-10 relative">
              {marketMode === 'FOREX' ? (
                <>{renderSidebarGroup('Major Liquidity', data.majors, "Trading the most liquid fiat currency pairs globally, driven by macroeconomic data and central bank policies.")}{renderSidebarGroup('Cross Pairs', data.minors)}{renderSidebarGroup('Precious Metals', data.metals)}</>
              ) : (
                <>{renderSidebarGroup('Crypto Assets', data.crypto && Object.keys(data.crypto).length > 0 ? data.crypto : MOCK_CRYPTO_PAIRS)}</>
              )}
            </div>
          </>
        )}

        <div className="px-6 mt-8 mb-6 z-10 relative">
          <button
            onClick={handleSeedFirebase}
            className="w-full py-3 bg-zinc-900/50 border border-zinc-800 text-zinc-500 hover:text-emerald-400 hover:border-emerald-500/50 hover:bg-emerald-500/10 text-[9px] font-bold tracking-widest uppercase rounded-xl transition-all shadow-inner flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
            SYNC ALL PAIRS TO FIREBASE
          </button>
        </div>
      </nav>
    </aside>
  );
}