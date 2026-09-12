"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { 
  LineChart, Line, PieChart, Pie, Cell, 
  ResponsiveContainer, Tooltip, YAxis 
} from 'recharts';

// --- STATIC MOCK DATA (O(1) Memory Footprint) ---
const INITIAL_CAPITAL = 2500;
const FIXED_ALLOCATIONS: Record<string, { weight: number; invested: number; color: string; logo: string; name: string; insight: string }> = {
  'NEE': { weight: 25, invested: 625, color: '#3b82f6', logo: '⚡', name: 'NextEra Energy', insight: 'Stabilní defenziva a zelená energie. Profit z nižších sazeb Fedu, jistota a dividenda.' },
  'TGT': { weight: 25, invested: 625, color: '#ef4444', logo: '🎯', name: 'Target Corp', insight: 'Král vánoční sezóny. Útěk spotřebitelů k levnějšímu zboží. Zotavení z propadů.' },
  'PFE': { weight: 20, invested: 500, color: '#10b981', logo: '💊', name: 'Pfizer', insight: 'Defenzivní štít imunní vůči krizím. Fundamentálně levná akcie.' },
  'SYM': { weight: 15, invested: 375, color: '#f59e0b', logo: '🤖', name: 'Symbotic', insight: 'Růstový motor. Robotizace skladů klíčová pro Q4 nákupní horečku.' },
  'NVO': { weight: 15, invested: 375, color: '#8b5cf6', logo: '🧬', name: 'Novo Nordisk', insight: 'Extrémní poptávka po lécích na hubnutí (Wegovy). Monopolní síla.' }
};

const MOCK_HISTORY = [
  { id: 1, title: 'AutoInvest executed', type: 'buy', amount: '+2 500.00 Kč', date: 'Dnes, 09:30' },
  { id: 2, title: 'Deposit received', type: 'deposit', amount: '+2 500.00 Kč', date: 'Dnes, 09:25' },
  { id: 3, title: 'AutoInvest resumed', type: 'system', amount: '', date: 'Včera, 18:45' },
];

const TIMEFRAMES = ['1D', '1W', '1M', '3M', '1Y', 'MAX'];

// --- ANIMATION VARIANTS ---
const pageVariants: Variants = {
  enter: { opacity: 0, x: 20 },
  center: { opacity: 1, x: 0, transition: { duration: 0.4, ease: "easeOut" } },
  exit: { opacity: 0, x: -20, transition: { duration: 0.2, ease: "easeIn" } }
};

interface MarketData {
  [ticker: string]: {
    price: number;
    prevClose: number;
    changePercent: number;
  }
}

export default function T212Portfolio() {
  const [activeTab, setActiveTab] = useState<'overview' | 'holdings'>('overview');
  const [selectedAsset, setSelectedAsset] = useState<string | null>(null);
  const [activeTimeframe, setActiveTimeframe] = useState('1D');
  
  const [marketData, setMarketData] = useState<MarketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // DATA FETCHING ENGINE
  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      try {
        const res = await fetch('/api/welcome');
        if (!res.ok) throw new Error("API stream rejected.");
        const data = await res.json();
        if (isMounted) {
          setMarketData(data);
          setError(null);
        }
      } catch (err) {
        if (isMounted) setError("Connection to exchange lost.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchData();
    const interval = setInterval(fetchData, 60000); // 60s synchronizace
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // QUANTITATIVE CALCULATION MATRIX
  const portfolioMetrics = useMemo(() => {
    if (!marketData || !marketData['CZK=X']) return null;

    let currentNavCZK = 0;
    let prevNavCZK = 0;
    const usdCzkRate = marketData['CZK=X'].price;

    const assets = Object.keys(FIXED_ALLOCATIONS).map(ticker => {
      const config = FIXED_ALLOCATIONS[ticker];
      const mkt = marketData[ticker];
      
      if (!mkt) return null;

      // Simulace: Nakoupeno za včerejší close cenu (zjednodušený model pro vizualizaci dneška)
      const sharesOwned = (config.invested / usdCzkRate) / mkt.prevClose;
      
      const currentValueUSD = sharesOwned * mkt.price;
      const currentValueCZK = currentValueUSD * usdCzkRate;
      
      const prevValueUSD = sharesOwned * mkt.prevClose;
      const prevValueCZK = prevValueUSD * usdCzkRate; // zjednodušení: kurz stejný
      
      const dailyChangeCZK = currentValueCZK - prevValueCZK;

      currentNavCZK += currentValueCZK;
      prevNavCZK += prevValueCZK;

      return {
        id: ticker,
        ...config,
        currentValueCZK,
        dailyChangeCZK,
        dailyChangePercent: mkt.changePercent,
        livePriceUSD: mkt.price
      };
    }).filter(Boolean) as any[];

    const totalDailyChangeCZK = currentNavCZK - INITIAL_CAPITAL;
    const totalDailyChangePercent = (totalDailyChangeCZK / INITIAL_CAPITAL) * 100;

    // Přepočet reálných vah portfolia
    const finalizedAssets = assets.map(a => ({
      ...a,
      actualWeight: (a.currentValueCZK / currentNavCZK) * 100
    })).sort((a, b) => b.currentValueCZK - a.currentValueCZK);

    return {
      currentNavCZK,
      totalDailyChangeCZK,
      totalDailyChangePercent,
      assets: finalizedAssets
    };
  }, [marketData]);

  // GENERACE MOCK GRAFU Z ŽIVÉ CENY PRO VIZUÁLNÍ EFEKT
  const generateSparkline = (baseValue: number, change: number) => {
    const points = [];
    let current = baseValue - change;
    for(let i=0; i<8; i++) {
      points.push({ time: i, value: current });
      current += (change / 7) + (Math.random() * (change*0.2) - (change*0.1));
    }
    points[7].value = baseValue; // Poslední bod musí přesně sedět
    return points;
  };

  const chartData = useMemo(() => {
    if (!portfolioMetrics) return [];
    return generateSparkline(portfolioMetrics.currentNavCZK, portfolioMetrics.totalDailyChangeCZK);
  }, [portfolioMetrics]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px] w-full bg-[#000000]">
        <div className="w-8 h-8 border-4 border-t-emerald-500 border-white/10 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !portfolioMetrics) {
    return (
      <div className="flex items-center justify-center min-h-[500px] w-full bg-[#000000]">
        <span className="text-[10px] uppercase font-bold text-red-500 tracking-widest bg-red-500/10 px-4 py-2 rounded-lg border border-red-500/20">
          {error || "Telemetry Data Unavailable"}
        </span>
      </div>
    );
  }

  // --- SUB-VIEW: ASSET DETAIL DRILL-DOWN ---
  if (selectedAsset) {
    const assetData = portfolioMetrics.assets.find(a => a.id === selectedAsset);
    if (!assetData) return null;
    
    const assetSparkline = generateSparkline(assetData.livePriceUSD, assetData.livePriceUSD * (assetData.dailyChangePercent / 100));

    return (
      <motion.div key="detail" variants={pageVariants} initial="enter" animate="center" exit="exit" className="w-full max-w-4xl mx-auto flex flex-col font-sans bg-[#000000] text-zinc-200 min-h-screen px-6 py-6 pb-24">
        
        {/* BACK NAVIGATION */}
        <button onClick={() => setSelectedAsset(null)} className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors w-fit mb-8 group">
          <svg className="w-5 h-5 transform group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
          <span className="text-[10px] font-bold uppercase tracking-widest">Zpět na Portfolio</span>
        </button>

        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-2xl shadow-inner">
            {assetData.logo}
          </div>
          <div className="flex flex-col">
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">{assetData.name}</h1>
            <span className="text-xs text-zinc-500 font-mono tracking-widest">{assetData.id}</span>
          </div>
        </div>

        <div className="flex flex-col mb-8">
          <span className="text-4xl font-black text-white font-mono tracking-tighter">
            ${assetData.livePriceUSD.toFixed(2)}
          </span>
          <div className={`flex items-center gap-2 mt-2 font-mono font-bold text-sm tracking-wide ${assetData.dailyChangePercent >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            <svg className={`w-4 h-4 ${assetData.dailyChangePercent < 0 ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
            <span>{assetData.dailyChangePercent >= 0 ? '+' : ''}{assetData.dailyChangePercent.toFixed(2)}%</span>
          </div>
        </div>

        <div className="w-full h-[250px] mb-8">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={assetSparkline}>
              <YAxis domain={['dataMin', 'dataMax']} hide />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke={assetData.color} 
                strokeWidth={3} 
                dot={false}
                activeDot={{ r: 6, fill: assetData.color, stroke: "#000000", strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-[#050505] border border-white/10 rounded-2xl p-6 shadow-inner">
          <h3 className="text-[10px] uppercase tracking-widest font-bold text-zinc-500 mb-3">Taktický Insight</h3>
          <p className="text-sm text-zinc-300 leading-relaxed font-medium">
            {assetData.insight}
          </p>
          <div className="mt-6 pt-6 border-t border-white/5 grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-[9px] uppercase tracking-widest text-zinc-500 font-bold">Naše Pozice</span>
              <span className="text-white font-mono text-sm font-bold">{assetData.currentValueCZK.toLocaleString('cs-CZ', { maximumFractionDigits: 0 })} Kč</span>
            </div>
            <div className="flex flex-col gap-1 text-right">
              <span className="text-[9px] uppercase tracking-widest text-zinc-500 font-bold">Cílová Alokace</span>
              <span className="text-white font-mono text-sm font-bold">{assetData.weight}%</span>
            </div>
          </div>
        </div>

      </motion.div>
    );
  }

  // --- MAIN TABS VIEW ---
  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col font-sans bg-[#000000] text-zinc-200 min-h-screen">
      
      {/* ─── HEADER & NAVIGATION ─── */}
      <div className="px-6 pt-6 pb-2 sticky top-0 bg-[#000000]/80 backdrop-blur-xl z-50 border-b border-white/5">
        <div className="flex items-center gap-3 mb-6">
          <svg className="w-5 h-5 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
          <h1 className="text-xl font-bold tracking-tight text-white">Q4 Portfolio</h1>
          <span className="px-2 py-0.5 bg-white/5 border border-white/10 rounded uppercase tracking-widest text-[9px] font-bold text-zinc-500 ml-auto">READ-ONLY</span>
        </div>

        <div className="flex bg-white/5 p-1 rounded-xl w-full max-w-sm mb-4">
          <button 
            onClick={() => setActiveTab('overview')}
            className={`flex-1 text-[11px] font-bold uppercase tracking-widest py-2 rounded-lg transition-all ${activeTab === 'overview' ? 'bg-white/10 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            Overview
          </button>
          <button 
            onClick={() => setActiveTab('holdings')}
            className={`flex-1 text-[11px] font-bold uppercase tracking-widest py-2 rounded-lg transition-all ${activeTab === 'holdings' ? 'bg-white/10 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            Holdings & Strategy
          </button>
        </div>
      </div>

      {/* ─── TAB CONTENT ─── */}
      <div className="px-6 py-6 pb-24 overflow-hidden relative">
        <AnimatePresence mode="wait">
          
          {activeTab === 'overview' && (
            <motion.div key="overview" variants={pageVariants} initial="enter" animate="center" exit="exit" className="flex flex-col gap-8">
              
              {/* MAIN METRICS */}
              <div className="flex flex-col items-center justify-center text-center mt-4">
                <h2 className="text-5xl md:text-6xl font-black text-white tracking-tighter tabular-nums font-mono">
                  {portfolioMetrics.currentNavCZK.toLocaleString('cs-CZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-2xl text-zinc-500">Kč</span>
                </h2>
                <div className={`flex items-center gap-2 mt-3 font-bold font-mono text-sm tracking-wide ${portfolioMetrics.totalDailyChangeCZK >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  <svg className={`w-4 h-4 ${portfolioMetrics.totalDailyChangeCZK < 0 ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
                  <span>{portfolioMetrics.totalDailyChangeCZK >= 0 ? '+' : ''}{portfolioMetrics.totalDailyChangeCZK.toLocaleString('cs-CZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Kč</span>
                  <span className="text-zinc-600 px-1">•</span>
                  <span>{portfolioMetrics.totalDailyChangePercent >= 0 ? '+' : ''}{portfolioMetrics.totalDailyChangePercent.toFixed(2)}%</span>
                </div>
              </div>

              {/* T212 STYLE LINE CHART */}
              <div className="w-full flex flex-col gap-4">
                <div className="h-[250px] w-full relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <YAxis domain={['dataMin', 'dataMax']} hide />
                      <Line 
                        type="monotone" 
                        dataKey="value" 
                        stroke={portfolioMetrics.totalDailyChangeCZK >= 0 ? "#10b981" : "#ef4444"} 
                        strokeWidth={3} 
                        dot={false}
                        activeDot={{ r: 6, fill: portfolioMetrics.totalDailyChangeCZK >= 0 ? "#10b981" : "#ef4444", stroke: "#000000", strokeWidth: 2 }}
                        style={{ filter: `drop-shadow(0px 10px 10px ${portfolioMetrics.totalDailyChangeCZK >= 0 ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'})` }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                
                {/* TIMEFRAME SELECTOR */}
                <div className="flex justify-between items-center w-full max-w-sm mx-auto px-4">
                  {TIMEFRAMES.map((tf) => (
                    <button 
                      key={tf}
                      onClick={() => setActiveTimeframe(tf)}
                      className={`text-[10px] font-bold py-1.5 px-3 rounded-full transition-colors ${activeTimeframe === tf ? 'bg-zinc-800 text-white border border-white/10' : 'text-zinc-500 hover:text-zinc-300'}`}
                    >
                      {tf}
                    </button>
                  ))}
                </div>
              </div>

              {/* GOAL & AUTOINVEST CARDS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="bg-[#050505] border border-white/5 rounded-2xl p-5 shadow-inner flex items-center justify-between group">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">AutoInvest</span>
                    <span className="text-sm font-bold text-white tracking-wide">2 500 Kč / týdně</span>
                  </div>
                  <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-widest">ON</span>
                  </div>
                </div>

                <div className="bg-[#050505] border border-white/5 rounded-2xl p-5 shadow-inner flex flex-col justify-center">
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Q4 Goal Progress</span>
                    <span className="text-[10px] font-mono text-zinc-400 font-bold">{(portfolioMetrics.currentNavCZK / 40000 * 100).toFixed(1)}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" style={{ width: `${Math.min(portfolioMetrics.currentNavCZK / 40000 * 100, 100)}%` }}></div>
                  </div>
                </div>
              </div>

              {/* HISTORY SECTION */}
              <div className="flex flex-col gap-4 mt-6">
                <h3 className="text-lg font-bold text-white tracking-tight px-2">History</h3>
                <div className="flex flex-col gap-2">
                  {MOCK_HISTORY.map((item) => (
                    <div key={item.id} className="bg-[#050505] border border-white/5 rounded-2xl p-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                      <div className="flex items-center gap-4">
                        <div className={`p-2.5 rounded-full ${item.type === 'buy' ? 'bg-blue-500/10 text-blue-400' : item.type === 'deposit' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-zinc-800 text-zinc-400'}`}>
                          {item.type === 'buy' && <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>}
                          {item.type === 'deposit' && <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>}
                          {item.type === 'system' && <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-white">{item.title}</span>
                          <span className="text-[10px] text-zinc-500">{item.date}</span>
                        </div>
                      </div>
                      <span className="text-sm font-bold font-mono text-emerald-400">{item.amount}</span>
                    </div>
                  ))}
                </div>
              </div>

            </motion.div>
          )}

          {activeTab === 'holdings' && (
            <motion.div key="holdings" variants={pageVariants} initial="enter" animate="center" exit="exit" className="flex flex-col gap-10">
              
              {/* DONUT CHART & HOLDINGS LIST */}
              <div className="flex flex-col gap-6">
                
                <div className="h-[280px] w-full relative flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={portfolioMetrics.assets}
                        cx="50%"
                        cy="50%"
                        innerRadius={90}
                        outerRadius={110}
                        paddingAngle={3}
                        dataKey="actualWeight"
                        stroke="none"
                      >
                        {portfolioMetrics.assets.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        content={({ active, payload }: any) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-[#0a0a0a] border border-white/10 p-3 rounded-xl shadow-2xl">
                                <p className="text-white font-bold text-xs">{payload?.[0]?.payload?.name}</p>
                                <p className="text-zinc-400 text-[10px] font-mono mt-1">{Number(payload?.[0]?.value || 0).toFixed(2)}% Actual</p>
                              </div>
                            );
                          }
                          return null;
                        }} 
                        cursor={{ fill: 'transparent' }} 
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-1">Total NAV</span>
                    <span className="text-2xl font-black text-white font-mono">{portfolioMetrics.currentNavCZK.toLocaleString('cs-CZ', { maximumFractionDigits: 0 })} Kč</span>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <h3 className="text-[10px] uppercase tracking-widest font-bold text-zinc-500 px-2 mb-2">Assets (Click to Expand)</h3>
                  {portfolioMetrics.assets.map((asset) => (
                    <div 
                      key={asset.id} 
                      onClick={() => setSelectedAsset(asset.id)}
                      className="bg-[#050505] border border-white/5 rounded-2xl p-4 flex items-center justify-between cursor-pointer hover:border-white/20 transition-all hover:bg-white/[0.02] shadow-inner group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-lg group-hover:scale-110 transition-transform">
                          {asset.logo}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-white tracking-wide">{asset.name}</span>
                          <span className="text-[10px] text-zinc-500 font-mono mt-0.5">
                            <span style={{ color: asset.color }} className="font-bold">{asset.actualWeight.toFixed(2)}%</span> / {asset.weight}% Target
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-sm font-bold text-white font-mono">{asset.currentValueCZK.toLocaleString('cs-CZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        <span className={`text-[10px] font-mono font-bold mt-0.5 ${asset.dailyChangeCZK >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {asset.dailyChangeCZK >= 0 ? '+' : ''}{asset.dailyChangeCZK.toLocaleString('cs-CZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="w-full h-px bg-white/10 my-2"></div>

              {/* TIMELINE: ARCHITEKTURA EXEKUCE */}
              <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-1 px-2">
                  <h3 className="text-lg font-bold text-white tracking-tight">Architektura Exekuce</h3>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Časový harmonogram Master Planu</p>
                </div>

                <div className="relative pl-8 border-l border-white/10 flex flex-col gap-10 mt-2 ml-2">
                  <div className="relative">
                    <div className="absolute -left-[41px] top-0.5 bg-[#000000] p-1.5 rounded-full border border-white/10">
                      <svg className="w-3.5 h-3.5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                    </div>
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-white">Fáze 1: Září</span>
                        <span className="text-[9px] uppercase tracking-widest font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">Tiché budování</span>
                      </div>
                      <p className="text-xs text-zinc-400 leading-relaxed">Aktuální fáze. DCA nákupy po <span className="font-mono text-white">2 500 CZK</span> týdně. Makroekonomické prostředí zůstává nejisté.</p>
                    </div>
                  </div>

                  <div className="relative opacity-50 grayscale">
                    <div className="absolute -left-[41px] top-0.5 bg-[#000000] p-1.5 rounded-full border border-white/10">
                      <svg className="w-3.5 h-3.5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/><line x1="12" y1="2" x2="12" y2="5"/><line x1="12" y1="19" x2="12" y2="22"/><line x1="2" y1="12" x2="5" y2="12"/><line x1="19" y1="12" x2="22" y2="12"/></svg>
                    </div>
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-white">Fáze 2: Polovina října</span>
                        <span className="text-[9px] uppercase tracking-widest font-bold text-zinc-500 bg-white/5 px-2 py-0.5 rounded border border-white/10">Zamčeno</span>
                      </div>
                      <p className="text-xs text-zinc-500 leading-relaxed">Nákup strachu: Aktivace enginu pouze pokud index <span className="font-mono text-zinc-400 border-b border-white/10">VIX &gt; 25</span>.</p>
                    </div>
                  </div>

                  <div className="relative opacity-50 grayscale">
                    <div className="absolute -left-[41px] top-0.5 bg-[#000000] p-1.5 rounded-full border border-white/10">
                      <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
                    </div>
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-white">Fáze 3: Listopad / Prosinec</span>
                        <span className="text-[9px] uppercase tracking-widest font-bold text-zinc-500 bg-white/5 px-2 py-0.5 rounded border border-white/10">Zamčeno</span>
                      </div>
                      <p className="text-xs text-zinc-500 leading-relaxed">Volby skončily. Optimalizace pozic a aktivní příprava na Take-Profit.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* RISK SCENARIOS */}
              <div className="flex flex-col gap-6 mt-4">
                <div className="flex flex-col gap-1 px-2">
                  <h3 className="text-lg font-bold text-white tracking-tight">Metriky Rizika</h3>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Pravděpodobnostní modely</p>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div className="bg-[#050505] border border-white/10 rounded-2xl p-5 flex flex-col gap-3 shadow-inner">
                    <div className="flex justify-between items-center">
                      <span className="text-white font-bold text-sm tracking-wide">Optimistický Scénář</span>
                      <span className="text-[10px] font-mono font-bold text-emerald-400 tracking-widest bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20">+12% TO +15%</span>
                    </div>
                    <p className="text-xs text-zinc-500 leading-relaxed">Trh po volbách roste. Strach opadá a začíná masivní nákupní horečka (Santa Rally).</p>
                  </div>

                  <div className="bg-[#050505] border border-white/10 rounded-2xl p-5 flex flex-col gap-3 shadow-inner">
                    <div className="flex justify-between items-center">
                      <span className="text-white font-bold text-sm tracking-wide">Reálný Scénář</span>
                      <span className="text-[10px] font-mono font-bold text-yellow-400 tracking-widest bg-yellow-500/10 px-2 py-1 rounded border border-yellow-500/20">+7% TO +10%</span>
                    </div>
                    <p className="text-xs text-zinc-500 leading-relaxed">Standardní předvánoční růst spojený s mírnou korekcí po volbách. Fundament drží.</p>
                  </div>

                  <div className="bg-[#050505] border border-white/10 rounded-2xl p-5 flex flex-col gap-3 shadow-inner">
                    <div className="flex justify-between items-center">
                      <span className="text-white font-bold text-sm tracking-wide">Pesimistický Scénář</span>
                      <span className="text-[10px] font-mono font-bold text-red-400 tracking-widest bg-red-500/10 px-2 py-1 rounded border border-red-500/20">-2% TO -5% MAX</span>
                    </div>
                    <p className="text-xs text-zinc-500 leading-relaxed">Makroekonomický šok. Silná defenzivní povaha aktiv (NEE, PFE) působí jako tlumič ztrát.</p>
                  </div>
                </div>
              </div>

            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}