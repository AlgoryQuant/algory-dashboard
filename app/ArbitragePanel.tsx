"use client";

import React, { useState, useEffect } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip } from 'recharts';
import { motion } from 'framer-motion';

// === INTERFACES ===
type ArbStatus = 'ACTIVE' | 'DEGRADING' | 'CLOSED';
interface ChartPoint { time: string; spread: number; }
export interface SpatialArbData { id: string; asset: string; buyExchange: string; sellExchange: string; askPrice: number; bidPrice: number; spreadPercent: number; estimatedFeePercent: number; status: ArbStatus; chartData: ChartPoint[]; }
export interface TriangularArbData { id: string; pairName: string; path: string[]; rate1: number; rate2: number; rate3: number; expectedProfitPercent: number; status: ArbStatus; chartData: ChartPoint[]; }
export interface FundingRateData { id: string; asset: string; binanceRate: number; bybitRate: number; okxRate: number; optimalLong: string; optimalShort: string; netYield: number; status: ArbStatus; chartData: ChartPoint[]; }

// === SHARED COMPONENTS ===
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
      if (progress < 1) {
        animationFrameId = window.requestAnimationFrame(step);
      }
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
    if (state === 'loading') {
      t1 = setTimeout(() => setState('success'), 1500);
    } else if (state === 'success') {
      t2 = setTimeout(() => setState('idle'), 1000);
    }
    return () => { if (t1) clearTimeout(t1); if (t2) clearTimeout(t2); };
  }, [state]);

  const handleClick = () => { if (state !== 'idle' || disabled) return; setState('loading'); };

  let bgClass = disabled ? 'bg-zinc-900/50 text-zinc-600 border border-white/5 cursor-not-allowed' :
    colorTheme === 'emerald' ? 'bg-emerald-500 hover:bg-emerald-400 text-black border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.5)] hover:shadow-[0_0_25px_rgba(16,185,129,0.8)] hover:-translate-y-1' :
    colorTheme === 'red' ? 'bg-red-500 hover:bg-red-400 text-white border-red-400 shadow-[0_0_15px_rgba(239,68,68,0.5)] hover:shadow-[0_0_25px_rgba(239,68,68,0.8)] hover:-translate-y-1' :
    colorTheme === 'blue' ? 'bg-blue-500 hover:bg-blue-400 text-white border-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.5)] hover:shadow-[0_0_25px_rgba(59,130,246,0.8)] hover:-translate-y-1' :
    colorTheme === 'purple' ? 'bg-purple-500 hover:bg-purple-400 text-white border-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.5)] hover:shadow-[0_0_25px_rgba(168,85,247,0.8)] hover:-translate-y-1' :
    'bg-orange-500 hover:bg-orange-400 text-white border-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.5)] hover:shadow-[0_0_25px_rgba(249,115,22,0.8)] hover:-translate-y-1';

  return (
    <motion.button layout onClick={handleClick} disabled={disabled || state !== 'idle'} className={`${baseClass} ${bgClass} flex items-center justify-center transition-all duration-300 relative overflow-hidden`}>
      <div className={`transition-all duration-300 ${state !== 'idle' ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`}>{defaultText}</div>
      <div className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${state === 'loading' ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
        <svg className="animate-spin h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
      </div>
      <div className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${state === 'success' ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}>
        <svg className="h-6 w-6 text-current" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
      </div>
    </motion.button>
  );
};

const StatusBadge = ({ status }: { status?: ArbStatus }) => {
  const safeStatus = status || 'CLOSED';
  const colors = { 
    ACTIVE: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.2)]', 
    DEGRADING: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/40 shadow-[0_0_15px_rgba(250,204,21,0.2)]', 
    CLOSED: 'text-red-400 bg-red-500/10 border-red-500/40 shadow-[0_0_15px_rgba(239,68,68,0.2)]' 
  };
  const dotColors = { 
    ACTIVE: 'bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.8)]', 
    DEGRADING: 'bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.8)]', 
    CLOSED: 'bg-red-400 shadow-[0_0_8px_rgba(239,68,68,0.8)]' 
  };
  return (
      <div className={`px-2 py-1 rounded-md border text-[9px] font-bold tracking-widest flex items-center gap-1.5 ml-4 transition-all duration-300 ${colors[safeStatus]}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${dotColors[safeStatus]} ${safeStatus === 'ACTIVE' ? 'animate-pulse' : ''}`}></span>{safeStatus}
      </div>
  )
};

const SpreadHistoryChart = ({ data, color }: { data?: ChartPoint[], color: string }) => {
  const safeData = data || [];
  return (
    <div className="w-full mt-8 bg-zinc-950/40 backdrop-blur-md border border-white/5 rounded-2xl p-6 shadow-inner relative z-10">
        <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-4 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke={color}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" /></svg>SPREAD & PROFITABILITY HISTORY (24H)
        </div>
        <div className="h-48 w-full">
            {safeData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={safeData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                      <defs><linearGradient id={`colorGradient-${color}`} x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={color} stopOpacity={0.4}/><stop offset="95%" stopColor={color} stopOpacity={0}/></linearGradient></defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                      <XAxis dataKey="time" stroke="rgba(255,255,255,0.2)" fontSize={10} tickMargin={10} axisLine={false} tickLine={false} />
                      <YAxis stroke="rgba(255,255,255,0.2)" fontSize={10} tickFormatter={(val) => `${val}%`} width={50} axisLine={false} tickLine={false} />
                      <RechartsTooltip contentStyle={{ backgroundColor: 'rgba(9, 9, 11, 0.9)', backdropFilter: 'blur(10px)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '0.5rem', fontSize: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }} itemStyle={{ color: '#fff', fontWeight: 'bold' }} labelStyle={{ color: '#a1a1aa', marginBottom: '4px' }} />
                      <Area type="monotone" dataKey="spread" stroke={color} strokeWidth={2} fillOpacity={1} fill={`url(#colorGradient-${color})`} />
                  </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xs text-zinc-600 font-mono">NO CHART DATA AVAILABLE</div>
            )}
        </div>
    </div>
  );
};

// === PANELS ===

export const SpatialArbitragePanel = ({ arbData }: { arbData?: SpatialArbData }) => {
  const [volume, setVolume] = useState<number>(1);
  
  if (!arbData || !arbData.id) return (
    <motion.div key="empty-spatial" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full bg-zinc-950/50 backdrop-blur-xl border border-white/10 rounded-[2rem] p-10 flex items-center justify-center text-zinc-500 font-mono text-sm shadow-2xl relative z-10">
      <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
      SYNCING SPATIAL MATRICES...
    </motion.div>
  );

  const askPrice = arbData?.askPrice || 0;
  const bidPrice = arbData?.bidPrice || 0;
  const estFee = arbData?.estimatedFeePercent || 0;

  const grossProfit = (bidPrice - askPrice) * volume;
  const fees = (askPrice * volume * (estFee / 100)) + (bidPrice * volume * (estFee / 100));
  const netProfit = grossProfit - fees;
  const isProfitable = netProfit > 0;
  
  const chartColor = arbData?.status === 'ACTIVE' ? '#34d399' : arbData?.status === 'DEGRADING' ? '#fbbf24' : '#ef4444';
  const baseAsset = (arbData?.asset || '').split('/')?.[0] || 'ASSET';

  return (
    <motion.div 
      key={arbData.id} 
      layout
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="w-full bg-zinc-950/50 backdrop-blur-xl border border-white/10 rounded-[2rem] overflow-hidden shadow-[0_10px_40px_rgba(0,0,0,0.5)] transition-all duration-300 relative z-10"
    >
      <div className="px-8 py-6 border-b border-white/5 bg-white/[0.02] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1 w-full">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.15)]">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
              </div>
              <div className="flex items-center">
                <div>
                  <h2 className="text-2xl font-bold text-white tracking-tight uppercase">{arbData?.asset || 'UNKNOWN'} ARBITRAGE</h2>
                  <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mt-1">SPATIAL EXCHANGE OPPORTUNITY</p>
                </div>
                <StatusBadge status={arbData?.status} />
              </div>
            </div>
            <div className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-xl shadow-[0_0_15px_rgba(16,185,129,0.1)]">
              <span className="text-emerald-400 font-bold text-lg tracking-wider">{(arbData?.spreadPercent || 0) > 0 ? '+' : ''}{(arbData?.spreadPercent || 0).toFixed(2)}% SPREAD</span>
            </div>
          </div>
          <p className="text-sm text-zinc-400 italic mt-3 ml-14">Exploits price differences of the same asset across different exchanges.</p>
        </div>
      </div>

      <div className="p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
          <div className="bg-zinc-900/40 backdrop-blur-md border border-white/5 rounded-2xl p-6 relative overflow-hidden group hover:border-red-500/40 hover:shadow-[0_0_25px_rgba(239,68,68,0.15)] transition-all duration-300 cursor-default">
            <div className="absolute top-0 left-0 w-1 h-full bg-red-500/50 group-hover:bg-red-400 group-hover:shadow-[0_0_10px_rgba(239,68,68,0.8)] transition-all"></div>
            <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-2 group-hover:text-red-400/70 transition-colors">BUY EXCHANGE (ASK)</div>
            <div className="text-xl font-bold text-white mb-4 uppercase">{arbData?.buyExchange || 'N/A'}</div>
            <div className="text-4xl font-mono font-bold text-red-400">${askPrice.toLocaleString()}</div>
          </div>
          <div className="bg-zinc-900/40 backdrop-blur-md border border-white/5 rounded-2xl p-6 relative overflow-hidden group hover:border-emerald-500/40 hover:shadow-[0_0_25px_rgba(16,185,129,0.15)] transition-all duration-300 cursor-default">
            <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500/50 group-hover:bg-emerald-400 group-hover:shadow-[0_0_10px_rgba(16,185,129,0.8)] transition-all"></div>
            <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-2 group-hover:text-emerald-400/70 transition-colors">SELL EXCHANGE (BID)</div>
            <div className="text-xl font-bold text-white mb-4 uppercase">{arbData?.sellExchange || 'N/A'}</div>
            <div className="text-4xl font-mono font-bold text-emerald-400">${bidPrice.toLocaleString()}</div>
          </div>
        </div>

        <div className="bg-zinc-950/60 backdrop-blur-md border border-white/10 rounded-2xl p-8">
          <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-6 flex items-center gap-2">
            <svg className="w-4 h-4 text-blue-400 drop-shadow-[0_0_5px_rgba(59,130,246,0.5)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
            NET PROFIT CALCULATOR
          </div>
          <div className="flex flex-col md:flex-row gap-8 items-end">
            <div className="flex flex-col gap-2 w-full md:w-1/3">
              <label className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">TRADING VOLUME ({baseAsset})</label>
              <input type="number" min="0.01" step="0.01" value={volume} onChange={(e) => setVolume(Number(e.target.value))} className="bg-black/50 backdrop-blur-sm border border-white/10 rounded-xl px-5 py-3 text-lg text-white font-mono focus:outline-none focus:border-blue-500/50 focus:shadow-[0_0_15px_rgba(59,130,246,0.2)] transition-all" />
            </div>
            <div className="flex flex-col gap-2 w-full md:w-1/3">
              <div className="flex justify-between text-[10px] tracking-widest font-bold text-zinc-500 uppercase"><span>GROSS PROFIT:</span><span className={`font-mono ${grossProfit > 0 ? 'text-emerald-400' : 'text-red-400'}`}>$<AnimatedNumber value={grossProfit} /></span></div>
              <div className="flex justify-between text-[10px] tracking-widest font-bold text-zinc-500 uppercase"><span>EST. FEES ({estFee}%):</span><span className="font-mono text-red-400">-$<AnimatedNumber value={fees} /></span></div>
              <div className="w-full h-[1px] bg-white/10 my-2"></div>
              <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest"><span className="text-zinc-500">NET PROFIT:</span></div>
            </div>
            <div className="w-full md:w-1/3 flex justify-end">
               <div className={`text-6xl font-black font-mono tracking-tighter ${isProfitable ? 'text-emerald-400 drop-shadow-[0_0_25px_rgba(52,211,153,0.6)]' : 'text-red-400 drop-shadow-[0_0_25px_rgba(239,68,68,0.6)]'}`}>
                 {isProfitable ? '+' : ''}$<AnimatedNumber value={netProfit} />
               </div>
            </div>
          </div>
          <div className="mt-8 flex justify-end">
            <ExecuteButton baseClass="w-full md:w-auto px-10 py-5 font-bold text-[10px] tracking-widest uppercase rounded-xl" defaultText="EXECUTE ARBITRAGE" colorTheme="blue" disabled={arbData?.status === 'CLOSED'} />
          </div>
        </div>
        <SpreadHistoryChart data={arbData?.chartData || []} color={chartColor} />
      </div>
    </motion.div>
  );
};

export const TriangularArbitragePanel = ({ arbData }: { arbData?: TriangularArbData }) => {
  const [volume, setVolume] = useState<number>(1000);
  
  if (!arbData || !arbData.id) return (
    <motion.div key="empty-tri" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full bg-zinc-950/50 backdrop-blur-xl border border-white/10 rounded-[2rem] p-10 flex items-center justify-center text-zinc-500 font-mono text-sm shadow-2xl relative z-10">
      <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
      SYNCING TRIANGULAR LOOPS...
    </motion.div>
  );

  const rate1 = arbData?.rate1 || 1;
  const rate2 = arbData?.rate2 || 0;
  const rate3 = arbData?.rate3 || 0;

  const step1 = volume / rate1;
  const step2 = step1 * rate2;
  const step3 = step2 * rate3;
  const netProfit = step3 - volume;
  const isProfitable = netProfit > 0;
  
  const chartColor = arbData?.status === 'ACTIVE' ? '#a855f7' : arbData?.status === 'DEGRADING' ? '#fbbf24' : '#ef4444';
  const path = arbData?.path || ['?', '?', '?', '?'];

  return (
    <motion.div 
      key={arbData.id} 
      layout
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="w-full bg-zinc-950/50 backdrop-blur-xl border border-white/10 rounded-[2rem] overflow-hidden shadow-[0_10px_40px_rgba(0,0,0,0.5)] transition-all duration-300 relative z-10"
    >
      <div className="px-8 py-6 border-b border-white/5 bg-white/[0.02] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1 w-full">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.15)]">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
              </div>
              <div className="flex items-center">
                <div>
                  <h2 className="text-2xl font-bold text-white tracking-tight uppercase">{arbData?.pairName || 'UNKNOWN'}</h2>
                  <p className="text-[10px] font-bold text-purple-400 uppercase tracking-widest mt-1">TRIANGULAR INEFFICIENCY LOOP</p>
                </div>
                <StatusBadge status={arbData?.status} />
              </div>
            </div>
            <div className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-xl shadow-[0_0_15px_rgba(16,185,129,0.1)]">
              <span className="text-emerald-400 font-bold text-lg tracking-wider">{(arbData?.expectedProfitPercent || 0) > 0 ? '+' : ''}{(arbData?.expectedProfitPercent || 0).toFixed(2)}% EXPECTED</span>
            </div>
          </div>
          <p className="text-sm text-zinc-400 italic mt-3 ml-14">Executes a sequence of three trades to profit from currency cross-rate inefficiencies.</p>
        </div>
      </div>

      <div className="p-8">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4 mb-12 relative">
          <div className="absolute top-1/2 left-0 w-full h-[2px] bg-white/10 hidden lg:block -z-10 shadow-[0_0_10px_rgba(255,255,255,0.1)]"></div>
          
          <div className="bg-zinc-900/50 backdrop-blur-md border border-white/5 rounded-2xl p-6 shadow-2xl flex flex-col items-center w-full lg:w-1/3 hover:border-purple-500/50 hover:shadow-[0_0_25px_rgba(168,85,247,0.2)] transition-all duration-300">
            <div className="text-[10px] text-zinc-500 uppercase tracking-widest mb-2 font-bold">STEP 1: BUY {path[1]}</div>
            <div className="text-2xl font-bold text-white mb-2">{path[0]} ➔ {path[1]}</div>
            <div className="text-[10px] font-mono font-bold tracking-widest uppercase text-purple-400">RATE: {rate1.toLocaleString()}</div>
          </div>
          
          <div className="hidden lg:flex items-center justify-center w-8 h-8 rounded-full bg-purple-500/20 text-purple-400 z-10 border border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.3)]">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </div>

          <div className="bg-zinc-900/50 backdrop-blur-md border border-white/5 rounded-2xl p-6 shadow-2xl flex flex-col items-center w-full lg:w-1/3 hover:border-purple-500/50 hover:shadow-[0_0_25px_rgba(168,85,247,0.2)] transition-all duration-300">
            <div className="text-[10px] text-zinc-500 uppercase tracking-widest mb-2 font-bold">STEP 2: CROSS TO {path[2]}</div>
            <div className="text-2xl font-bold text-white mb-2">{path[1]} ➔ {path[2]}</div>
            <div className="text-[10px] font-mono font-bold tracking-widest uppercase text-purple-400">RATE: {rate2.toLocaleString()}</div>
          </div>

          <div className="hidden lg:flex items-center justify-center w-8 h-8 rounded-full bg-purple-500/20 text-purple-400 z-10 border border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.3)]">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </div>

          <div className="bg-zinc-900/50 backdrop-blur-md border border-white/5 rounded-2xl p-6 shadow-2xl flex flex-col items-center w-full lg:w-1/3 hover:border-purple-500/50 hover:shadow-[0_0_25px_rgba(168,85,247,0.2)] transition-all duration-300">
            <div className="text-[10px] text-zinc-500 uppercase tracking-widest mb-2 font-bold">STEP 3: SELL BACK TO {path[3]}</div>
            <div className="text-2xl font-bold text-white mb-2">{path[2]} ➔ {path[3]}</div>
            <div className="text-[10px] font-mono font-bold tracking-widest uppercase text-purple-400">RATE: {rate3.toLocaleString()}</div>
          </div>
        </div>

        <div className="bg-zinc-950/60 backdrop-blur-md border border-white/10 rounded-2xl p-8 flex flex-col md:flex-row gap-8 items-center justify-between">
          <div className="w-full md:w-1/3">
            <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">INITIAL CAPITAL ({path[0]})</label>
            <input type="number" min="1" step="100" value={volume} onChange={(e) => setVolume(Number(e.target.value))} className="w-full bg-black/50 backdrop-blur-sm border border-white/10 rounded-xl px-5 py-3 text-lg text-white font-mono focus:outline-none focus:border-purple-500/50 focus:shadow-[0_0_15px_rgba(168,85,247,0.2)] mt-2 transition-all" />
          </div>
          <div className="flex-1 text-center md:text-right">
            <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-2">CALCULATED NET PROFIT</div>
            <div className={`text-6xl font-black font-mono tracking-tighter ${isProfitable ? 'text-emerald-400 drop-shadow-[0_0_25px_rgba(52,211,153,0.6)]' : 'text-red-400 drop-shadow-[0_0_25px_rgba(239,68,68,0.6)]'}`}>
              {isProfitable ? '+' : ''}<AnimatedNumber value={netProfit} /> <span className="text-2xl tracking-normal text-white/50">{path[0]}</span>
            </div>
          </div>
          <ExecuteButton baseClass="w-full md:w-auto px-10 py-5 font-bold text-[10px] tracking-widest uppercase rounded-xl" defaultText="EXECUTE LOOP" colorTheme="purple" disabled={arbData?.status === 'CLOSED'} />
        </div>
        <SpreadHistoryChart data={arbData?.chartData || []} color={chartColor} />
      </div>
    </motion.div>
  );
};

export const FundingRatesPanel = ({ data }: { data?: FundingRateData }) => {
  if (!data || !data.id) return (
    <motion.div key="empty-fund" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full bg-zinc-950/50 backdrop-blur-xl border border-white/10 rounded-[2rem] p-10 flex items-center justify-center text-zinc-500 font-mono text-sm shadow-2xl relative z-10">
      <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
      SYNCING EXCHANGE RATES...
    </motion.div>
  );

  const chartColor = data?.status === 'ACTIVE' ? '#f97316' : data?.status === 'DEGRADING' ? '#fbbf24' : '#ef4444';

  return (
    <motion.div 
      key={data.id} 
      layout
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="w-full bg-zinc-950/50 backdrop-blur-xl border border-white/10 rounded-[2rem] overflow-hidden shadow-[0_10px_40px_rgba(0,0,0,0.5)] transition-all duration-300 relative z-10"
    >
      <div className="px-8 py-6 border-b border-white/5 bg-white/[0.02] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1 w-full">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.15)]">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <div className="flex items-center">
                <div>
                  <h2 className="text-2xl font-bold text-white tracking-tight uppercase">{data?.asset || 'UNKNOWN'}</h2>
                  <p className="text-[10px] font-bold text-orange-400 uppercase tracking-widest mt-1">CROSS-EXCHANGE FUNDING ARB</p>
                </div>
                <StatusBadge status={data?.status} />
              </div>
            </div>
            <div className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-xl shadow-[0_0_15px_rgba(16,185,129,0.1)]">
              <span className="text-emerald-400 font-bold text-lg tracking-wider">{((data?.netYield || 0) * 100).toFixed(3)}% DAILY YIELD</span>
            </div>
          </div>
          <p className="text-sm text-zinc-400 italic mt-3 ml-14">Delta-neutral strategy holding opposing Long/Short positions on two exchanges to collect funding rate differences.</p>
        </div>
      </div>

      <div className="p-8">
        <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-6">CURRENT 8H FUNDING RATES</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {[ { id: 'ex-binance', name: 'Binance', rate: data?.binanceRate || 0 }, { id: 'ex-bybit', name: 'Bybit', rate: data?.bybitRate || 0 }, { id: 'ex-okx', name: 'OKX', rate: data?.okxRate || 0 } ].map(ex => (
             <div key={ex.id} className="bg-zinc-900/40 backdrop-blur-md border border-white/5 rounded-2xl p-6 shadow-inner flex flex-col items-center hover:border-orange-500/30 hover:shadow-[0_0_20px_rgba(249,115,22,0.1)] transition-all duration-300">
               <div className="text-[10px] font-bold text-white mb-4 uppercase tracking-widest">{ex.name}</div>
               <div className={`text-4xl font-mono font-black ${ex.rate > 0 ? 'text-red-400 drop-shadow-[0_0_10px_rgba(248,113,113,0.3)]' : 'text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.3)]'}`}>
                 {ex.rate > 0 ? '+' : ''}{(ex.rate * 100).toFixed(4)}%
               </div>
               <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest mt-3">{ex.rate > 0 ? 'PAYS SHORTS' : 'PAYS LONGS'}</div>
             </div>
          ))}
        </div>

        <div className="bg-zinc-950/60 backdrop-blur-md border border-orange-500/20 rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-[0_0_30px_rgba(249,115,22,0.05)]">
          <div>
            <div className="text-sm font-bold text-white uppercase tracking-widest mb-2 flex items-center gap-2">
              <svg className="w-5 h-5 text-orange-500 drop-shadow-[0_0_5px_rgba(249,115,22,0.5)]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" /></svg>
              DELTA-NEUTRAL SETUP
            </div>
            <p className="text-xs text-orange-400/80 leading-relaxed max-w-md">To collect the funding fee difference without price exposure, open opposing positions simultaneously.</p>
          </div>
          <div className="flex gap-4 items-center">
            <div className="px-6 py-4 bg-emerald-500/10 border border-emerald-500/40 rounded-xl flex flex-col items-center shadow-[0_0_15px_rgba(16,185,129,0.15)]">
              <span className="text-[10px] text-emerald-500 uppercase font-bold tracking-widest mb-1">LONG POSITION</span><span className="text-xl font-bold text-white uppercase">{data?.optimalLong || 'N/A'}</span>
            </div>
            <div className="text-zinc-600 font-bold">+</div>
            <div className="px-6 py-4 bg-red-500/10 border border-red-500/40 rounded-xl flex flex-col items-center shadow-[0_0_15px_rgba(239,68,68,0.15)]">
              <span className="text-[10px] text-red-500 uppercase font-bold tracking-widest mb-1">SHORT POSITION</span><span className="text-xl font-bold text-white uppercase">{data?.optimalShort || 'N/A'}</span>
            </div>
          </div>
          <ExecuteButton baseClass="w-full md:w-auto px-10 py-5 font-bold text-[10px] tracking-widest uppercase rounded-xl" defaultText="OPEN POSITIONS" colorTheme="orange" disabled={data?.status === 'CLOSED'} />
        </div>
        <SpreadHistoryChart data={data?.chartData || []} color={chartColor} />
      </div>
    </motion.div>
  );
};