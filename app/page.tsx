"use client";

import { useState, useEffect } from 'react';

interface AIAnalysis {
  evaluation: string;
  prediction: string;
  current_session: string;
  prev_session: string;
}

interface DashboardData {
  majors?: Record<string, number>;
  minors?: Record<string, number>;
  metals?: Record<string, number>;
  parameters?: Record<string, { SL: number; TP: number; Partial: number; BE: number; MaxSpread: number; LiveSpread: number | string; KeyDriver: string; aiAnalysis?: AIAnalysis }>;
}

type ViewType = 'OVERVIEW' | 'MAJORS' | 'MINORS' | 'METALS';

const MarketMonitor = ({ lastRefresh }: { lastRefresh: Date | null }) => {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const hour = now.getHours();
  
  const sessions = [
    { name: "Sydney", open: "22:00", close: "07:00", isActive: hour >= 22 || hour < 7 },
    { name: "Tokyo", open: "00:00", close: "09:00", isActive: hour >= 0 && hour < 9 },
    { name: "London", open: "09:00", close: "17:30", isActive: hour >= 9 && hour < 17 },
    { name: "New York", open: "14:30", close: "22:00", isActive: hour >= 14 && hour < 22 },
  ];

  const minutes = now.getMinutes();
  const seconds = now.getSeconds();
  const elapsedSeconds = (minutes % 15) * 60 + seconds;
  const progressPercent = (elapsedSeconds / (15 * 60)) * 100;

  return (
    <div className="mb-10 bg-zinc-900/40 backdrop-blur-md border border-zinc-700/50 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
      {/* Decentní záře na pozadí */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/2" />
      
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 relative z-10">
        <div className="flex flex-col gap-1 w-full md:w-auto">
          <div className="text-4xl font-mono font-bold text-white tracking-widest drop-shadow-md">
            {now.toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </div>
          <div className="text-xs font-mono text-zinc-400 uppercase tracking-widest flex items-center gap-2">
            Last Sync: 
            <span className="text-indigo-400 font-bold bg-indigo-950/50 px-2 py-0.5 rounded border border-indigo-500/30">
              {lastRefresh ? lastRefresh.toLocaleTimeString('cs-CZ') : "Waiting..."}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 w-full md:w-auto">
          {sessions.map((s) => (
            <div key={s.name} className={`px-5 py-2.5 border rounded-xl flex flex-col items-center justify-center transition-all duration-500 ${
              s.isActive 
                ? 'bg-green-950/30 border-green-500/50 shadow-[0_0_20px_rgba(34,197,94,0.15)]' 
                : 'bg-zinc-950/50 border-zinc-800/50 opacity-60'
            }`}>
              <div className="flex items-center gap-2 mb-1">
                {s.isActive && (
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500 shadow-[0_0_8px_#22c55e]"></span>
                  </span>
                )}
                <span className={`text-xs font-bold uppercase tracking-widest ${s.isActive ? 'text-green-400 drop-shadow-md' : 'text-zinc-500'}`}>
                  {s.name}
                </span>
              </div>
              <span className="text-[10px] text-zinc-400 font-mono">{s.open} - {s.close}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 relative z-10">
        <div className="flex justify-between text-[10px] text-zinc-400 font-mono mb-2 uppercase tracking-widest">
          <span className="flex items-center gap-2">
            <svg className="w-3 h-3 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            M15 Engine Cycle
          </span>
          <span>{15 - (minutes % 15)}m {(60 - seconds) % 60}s to next pulse</span>
        </div>
        <div className="w-full h-2 bg-black/50 rounded-full overflow-hidden border border-zinc-800/50 shadow-inner">
          <div 
            className="h-full bg-gradient-to-r from-indigo-600 to-indigo-400 rounded-full transition-all duration-1000 ease-linear shadow-[0_0_15px_rgba(99,102,241,0.6)] relative"
            style={{ width: `${progressPercent}%` }}
          >
            <div className="absolute top-0 right-0 w-8 h-full bg-white/30 blur-sm" />
          </div>
        </div>
      </div>
    </div>
  );
};


export default function Home() {
  const [data, setData] = useState<DashboardData>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [expandedRow, setExpandedRow] = useState<string | null>(null); // Nový stav pro rozbalování tabulky
  const [activeView, setActiveView] = useState<{ type: ViewType }>({ type: 'OVERVIEW' });

  useEffect(() => {
    const loadData = () => {
      const FIREBASE_URL = "https://algory-87b19-default-rtdb.europe-west1.firebasedatabase.app/results.json";
      
      fetch(`${FIREBASE_URL}?t=${new Date().getTime()}`)
        .then((res) => {
          if (!res.ok) throw new Error('Error loading results from Cloud');
          return res.json();
        })
        .then((jsonData: DashboardData) => {
          setData(jsonData || {});
          setLastRefresh(new Date());
          setError(null);
        })
        .catch((err) => {
          console.error("API Error:", err);
          setError("Failed to load current data.");
        })
        .finally(() => setLoading(false));
    };

    loadData();
    const interval = setInterval(loadData, 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const toggleRow = (ticker: string) => {
    setExpandedRow(expandedRow === ticker ? null : ticker);
  };

  const renderTable = (pairsData: Record<string, number> | undefined, title: string, categoryId: ViewType) => {
    if (!pairsData || Object.keys(pairsData).length === 0) return null;
    if (activeView.type !== 'OVERVIEW' && activeView.type !== categoryId) return null;

    let sortedPairs = Object.entries(pairsData).sort((a, b) => b[1] - a[1]);

    return (
      <div className="mb-10 w-full bg-zinc-900/30 backdrop-blur-sm border border-zinc-800/80 rounded-2xl shadow-xl">
        <div className="bg-gradient-to-r from-zinc-800/80 to-zinc-900/20 p-5 rounded-t-2xl border-b border-zinc-800/80 font-bold tracking-widest text-zinc-200 flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-zinc-500"></div>
          {title}
        </div>
        <div className="flex flex-col">
          {/* Hlavička tabulky */}
          <div className="grid grid-cols-12 p-4 border-b border-zinc-800/50 bg-black/20 text-xs uppercase tracking-widest text-zinc-500 font-medium">
            <div className="col-span-7">Instrument & Parameters</div>
            <div className="col-span-3 text-right">Win Rate</div>
            <div className="col-span-2 text-right">Status</div>
          </div>
          
          {/* Tělo tabulky */}
          {sortedPairs.map(([ticker, accuracy]) => {
            const isProfitable = accuracy > 0.52;
            const displayTicker = ticker === "XAUUSD" ? "GOLD (XAUUSD)" : ticker;
            const params = data.parameters?.[ticker];
            const isExpanded = expandedRow === ticker;
            
            return (
              <div key={ticker} className="border-b border-zinc-800/30 last:border-0">
                {/* Viditelný řádek (Klikací) */}
                <div 
                  onClick={() => toggleRow(ticker)}
                  className={`grid grid-cols-12 p-4 items-center cursor-pointer transition-all duration-300 ${isExpanded ? 'bg-indigo-950/20' : 'hover:bg-zinc-800/30'}`}
                >
                  <div className="col-span-7">
                    <div className="font-mono text-lg text-white flex items-center gap-3">
                      <span className="font-bold">{displayTicker}</span>
                      {params?.KeyDriver && (
                        <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-300 text-[9px] uppercase tracking-wider rounded border border-indigo-500/30 font-sans shadow-sm">
                          {params.KeyDriver}
                        </span>
                      )}
                    </div>
                    {params && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        <span className="px-1.5 py-0.5 bg-black/40 text-zinc-400 text-[10px] rounded border border-zinc-800">SL: {params.SL}</span>
                        <span className="px-1.5 py-0.5 bg-black/40 text-zinc-400 text-[10px] rounded border border-zinc-800">TP: {params.TP === 9999 ? 'OPEN' : params.TP}</span>
                        <span className="px-1.5 py-0.5 bg-black/40 text-zinc-400 text-[10px] rounded border border-zinc-800">BE: {params.BE}</span>
                        <span className="px-1.5 py-0.5 bg-black/40 text-zinc-400 text-[10px] rounded border border-zinc-800">Sprd: {params.LiveSpread !== "N/A" ? params.LiveSpread : params.MaxSpread}</span>
                      </div>
                    )}
                  </div>
                  <div className="col-span-3 font-mono text-xl text-right">
                    <span className={isProfitable ? "text-green-400 font-bold drop-shadow-[0_0_8px_rgba(34,197,94,0.4)]" : "text-zinc-500"}>
                      {(accuracy * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="col-span-2 text-right flex justify-end items-center gap-4">
                    {isProfitable ? (
                      <span className="px-3 py-1 bg-green-500/10 text-green-400 text-[10px] font-bold uppercase tracking-wider rounded-full border border-green-500/30 shadow-[0_0_10px_rgba(34,197,94,0.1)]">
                        Trade
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-zinc-800/50 text-zinc-500 text-[10px] font-bold uppercase tracking-wider rounded-full border border-zinc-700/50">
                        Skip
                      </span>
                    )}
                    {/* Šipka ukazující rozbalení */}
                    <svg className={`w-4 h-4 text-zinc-500 transition-transform duration-300 ${isExpanded ? 'rotate-180 text-indigo-400' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>

                {/* Rozbalovací část: AI Analýza */}
                {isExpanded && params?.aiAnalysis && (
                  <div className="bg-black/40 p-6 border-t border-indigo-900/30 animate-in slide-in-from-top-2 fade-in duration-300">
                    <div className="flex items-center gap-2 mb-4">
                      <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <h4 className="text-sm font-bold text-indigo-200 tracking-widest uppercase">Algory AI Insight</h4>
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-6">
                      {/* Zhodnocení staré seance */}
                      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
                        <div className="text-[10px] text-zinc-500 uppercase tracking-widest mb-2 flex items-center justify-between">
                          <span>Previous: {params.aiAnalysis.prev_session}</span>
                          <span className="w-2 h-2 rounded-full bg-zinc-600"></span>
                        </div>
                        <p className="text-sm text-zinc-300 leading-relaxed font-serif italic">
                          "{params.aiAnalysis.evaluation}"
                        </p>
                      </div>

                      {/* Predikce nové seance */}
                      <div className="bg-indigo-950/20 border border-indigo-900/50 rounded-xl p-4 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-500/10 rounded-full blur-xl pointer-events-none" />
                        <div className="text-[10px] text-indigo-400 uppercase tracking-widest mb-2 flex items-center justify-between">
                          <span>Opening: {params.aiAnalysis.current_session}</span>
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                          </span>
                        </div>
                        <p className="text-sm text-indigo-100 leading-relaxed font-serif relative z-10">
                          {params.aiAnalysis.prediction}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-[#0a0a0c] text-white selection:bg-indigo-500/30 overflow-hidden font-sans">
      <aside className="w-72 flex-shrink-0 border-r border-zinc-800/50 bg-black/50 flex flex-col h-full z-20">
        <div className="p-8 border-b border-zinc-800/50">
          <h2 className="text-3xl font-bold tracking-tighter bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent drop-shadow-sm">
            Algory<span className="text-indigo-500">.</span>
          </h2>
          <div className="flex items-center gap-2 mt-3">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500 shadow-[0_0_8px_#6366f1]"></span>
            </span>
            <p className="text-[10px] text-zinc-400 font-mono tracking-widest">QUANT ENGINE LIVE</p>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <button 
            onClick={() => setActiveView({ type: 'OVERVIEW' })}
            className={`w-full text-left p-3 rounded-xl font-medium text-sm tracking-wider uppercase transition-all duration-300 ${
              activeView.type === 'OVERVIEW' ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 shadow-inner' : 'text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300 border border-transparent'
            }`}
          >
            Terminal Dashboard
          </button>
          <button 
            onClick={() => setActiveView({ type: 'MAJORS' })}
            className={`w-full text-left p-3 rounded-xl font-medium text-sm tracking-wider uppercase transition-all duration-300 ${
              activeView.type === 'MAJORS' ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20' : 'text-zinc-500 hover:bg-zinc-900 border border-transparent'
            }`}
          >
            Majors
          </button>
          <button 
            onClick={() => setActiveView({ type: 'MINORS' })}
            className={`w-full text-left p-3 rounded-xl font-medium text-sm tracking-wider uppercase transition-all duration-300 ${
              activeView.type === 'MINORS' ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20' : 'text-zinc-500 hover:bg-zinc-900 border border-transparent'
            }`}
          >
            Minors & Crosses
          </button>
        </nav>
      </aside>

      <main className="flex-1 flex flex-col h-full overflow-hidden bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900/40 via-[#0a0a0c] to-[#0a0a0c]">
        <div className="flex-1 overflow-y-auto p-8 lg:p-12 scroll-smooth">
          <div className="max-w-6xl mx-auto">
            
            <MarketMonitor lastRefresh={lastRefresh} />

            {loading && !data.majors ? (
              <div className="p-12 text-center flex flex-col items-center justify-center gap-4 text-zinc-500 font-mono border border-zinc-800/50 rounded-2xl bg-zinc-900/10 h-64">
                <svg className="w-8 h-8 animate-spin text-indigo-500" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Syncing with Cloud Neural Net...
              </div>
            ) : error && !data.majors ? (
              <div className="p-6 text-center text-red-400 font-mono border border-red-900/50 bg-red-950/30 rounded-xl shadow-[0_0_20px_rgba(220,38,38,0.1)]">
                {error}
              </div>
            ) : (
              <div className="w-full flex flex-col space-y-6">
                {renderTable(data.majors, "MAJOR LIQUIDITY", "MAJORS")}
                {renderTable(data.minors, "MINOR & CROSS PAIRS", "MINORS")}
                {renderTable(data.metals, "PRECIOUS METALS", "METALS")}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}