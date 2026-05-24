"use client";

import { useState, useEffect } from 'react';

interface AIAnalysis {
  evaluation: string;
  prediction: string;
  current_session: string;
  prev_session: string;
}

interface NewsItem {
  title: string;
  publisher: string;
  link: string;
  time: string;
}

interface DashboardData {
  majors?: Record<string, number>;
  minors?: Record<string, number>;
  metals?: Record<string, number>;
  news?: NewsItem[];
  parameters?: Record<string, { SL: number; TP: number; Partial: number; BE: number; MaxSpread: number; LiveSpread: number | string; KeyDriver: string; aiAnalysis?: AIAnalysis }>;
}

type ViewType = 'OVERVIEW' | 'MAJORS' | 'MINORS' | 'METALS';

// --- CLEAN MARKET MONITOR ---
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
    <div className="mb-8 bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-lg">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
        <div className="flex flex-col gap-1 w-full md:w-auto">
          <div className="text-3xl font-mono font-bold text-white tracking-widest">
            {now.toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </div>
          <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest flex items-center gap-2">
            System Last Sync: 
            <span className="text-zinc-300 font-bold bg-zinc-800 px-2 py-0.5 rounded border border-zinc-700">
              {lastRefresh ? lastRefresh.toLocaleTimeString('cs-CZ') : "Connecting..."}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          {sessions.map((s) => (
            <div key={s.name} className={`px-4 py-2 border rounded-lg flex flex-col items-center justify-center transition-all ${
              s.isActive 
                ? 'bg-zinc-800 border-green-500/50' 
                : 'bg-zinc-950 border-zinc-900 opacity-60'
            }`}>
              <div className="flex items-center gap-2 mb-1">
                {s.isActive && (
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                  </span>
                )}
                <span className={`text-[11px] font-bold uppercase tracking-widest ${s.isActive ? 'text-green-400' : 'text-zinc-500'}`}>
                  {s.name}
                </span>
              </div>
              <span className="text-[9px] text-zinc-500 font-mono">{s.open} - {s.close}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6">
        <div className="flex justify-between text-[10px] text-zinc-500 font-mono mb-2 uppercase tracking-widest">
          <span>M15 Engine Cycle</span>
          <span>{15 - (minutes % 15)}m {(60 - seconds) % 60}s to next pulse</span>
        </div>
        <div className="w-full h-1.5 bg-zinc-950 rounded-full overflow-hidden border border-zinc-800">
          <div 
            className="h-full bg-zinc-400 rounded-full transition-all duration-1000 ease-linear"
            style={{ width: `${progressPercent}%` }}
          />
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
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<{ type: ViewType }>({ type: 'OVERVIEW' });

  useEffect(() => {
    const loadData = () => {
      // ⚠️ TVOJE FIREBASE URL
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
      <div className="mb-8 w-full bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="bg-zinc-800/50 p-4 border-b border-zinc-800 font-bold tracking-widest text-zinc-300 text-sm flex items-center gap-3">
          <div className="w-1.5 h-1.5 rounded-full bg-zinc-400"></div>
          {title}
        </div>
        <div className="flex flex-col">
          <div className="grid grid-cols-12 p-3 border-b border-zinc-800 bg-zinc-950/50 text-[10px] uppercase tracking-widest text-zinc-500 font-medium">
            <div className="col-span-7">Instrument & Engine Logic</div>
            <div className="col-span-3 text-right">Probability</div>
            <div className="col-span-2 text-right">Signal</div>
          </div>
          
          {sortedPairs.map(([ticker, accuracy]) => {
            const isProfitable = accuracy > 0.52;
            const displayTicker = ticker === "XAUUSD" ? "GOLD (XAUUSD)" : ticker;
            const params = data.parameters?.[ticker];
            const isExpanded = expandedRow === ticker;
            
            return (
              <div key={ticker} className="border-b border-zinc-800/50 last:border-0">
                <div 
                  onClick={() => toggleRow(ticker)}
                  className={`grid grid-cols-12 p-4 items-center cursor-pointer transition-colors ${isExpanded ? 'bg-zinc-800/30' : 'hover:bg-zinc-800/50'}`}
                >
                  <div className="col-span-7">
                    <div className="font-mono text-lg text-white flex items-center gap-3">
                      <span className="font-bold">{displayTicker}</span>
                      {params?.KeyDriver && (
                        <span className="px-2 py-0.5 bg-zinc-800 text-zinc-300 text-[10px] uppercase tracking-wider rounded border border-zinc-700 font-sans">
                          {params.KeyDriver}
                        </span>
                      )}
                    </div>
                    {params && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        <span className="px-1.5 py-0.5 bg-zinc-950 text-zinc-500 text-[9px] rounded border border-zinc-800">SL: {params.SL}</span>
                        <span className="px-1.5 py-0.5 bg-zinc-950 text-zinc-500 text-[9px] rounded border border-zinc-800">TP: {params.TP === 9999 ? 'OPEN' : params.TP}</span>
                        <span className="px-1.5 py-0.5 bg-zinc-950 text-zinc-500 text-[9px] rounded border border-zinc-800">BE: {params.BE}</span>
                        <span className="px-1.5 py-0.5 bg-zinc-950 text-zinc-500 text-[9px] rounded border border-zinc-800">Sprd: {params.LiveSpread !== "N/A" ? params.LiveSpread : params.MaxSpread}</span>
                      </div>
                    )}
                  </div>
                  <div className="col-span-3 font-mono text-xl text-right">
                    <span className={isProfitable ? "text-green-400 font-bold" : "text-zinc-500"}>
                      {(accuracy * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="col-span-2 text-right flex justify-end items-center gap-3">
                    {isProfitable ? (
                      <span className="px-3 py-1 bg-green-500/10 text-green-400 text-[10px] font-bold uppercase tracking-widest rounded border border-green-500/20">
                        Trade
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-zinc-900 text-zinc-500 text-[10px] font-bold uppercase tracking-widest rounded border border-zinc-800">
                        Skip
                      </span>
                    )}
                    <svg className={`w-4 h-4 text-zinc-600 transition-transform ${isExpanded ? 'rotate-180 text-zinc-300' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>

                {isExpanded && params?.aiAnalysis && (
                  <div className="bg-zinc-950/80 p-6 border-t border-zinc-800">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-1.5 h-1.5 rounded-full bg-zinc-400"></div>
                      <h4 className="text-xs font-bold text-zinc-300 tracking-widest uppercase">Algory Engine Log</h4>
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
                        <div className="text-[9px] text-zinc-500 uppercase tracking-widest mb-2 flex items-center justify-between">
                          <span>Previous Session Data</span>
                          <span className="w-1.5 h-1.5 rounded-full bg-zinc-600"></span>
                        </div>
                        <p className="text-xs text-zinc-400 leading-relaxed font-mono">
                          {params.aiAnalysis.evaluation}
                        </p>
                      </div>

                      <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-4 relative overflow-hidden">
                        <div className="text-[9px] text-zinc-300 uppercase tracking-widest mb-2 flex items-center justify-between">
                          <span>Live Prediction</span>
                          <span className="relative flex h-1.5 w-1.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500"></span>
                          </span>
                        </div>
                        <p className={`text-xs leading-relaxed font-mono ${isProfitable ? 'text-green-300' : 'text-zinc-400'}`}>
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
    <div className="flex h-screen bg-[#09090b] text-zinc-200 selection:bg-zinc-700 overflow-hidden font-sans">
      <aside className="w-64 flex-shrink-0 border-r border-zinc-800 bg-[#09090b] flex flex-col h-full z-20">
        <div className="p-6 border-b border-zinc-800">
          <h2 className="text-2xl font-bold tracking-tighter text-white">
            Algory<span className="text-zinc-500">.</span>
          </h2>
          <div className="flex items-center gap-2 mt-2">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500"></span>
            </span>
            <p className="text-[9px] text-zinc-500 font-mono tracking-widest">QUANT ENGINE LIVE</p>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          <button 
            onClick={() => setActiveView({ type: 'OVERVIEW' })}
            className={`w-full text-left p-3 rounded-lg font-bold text-xs tracking-widest uppercase transition-colors ${
              activeView.type === 'OVERVIEW' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300'
            }`}
          >
            Terminal Home
          </button>
          <button 
            onClick={() => setActiveView({ type: 'MAJORS' })}
            className={`w-full text-left p-3 rounded-lg font-bold text-xs tracking-widest uppercase transition-colors ${
              activeView.type === 'MAJORS' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:bg-zinc-900'
            }`}
          >
            Majors
          </button>
          <button 
            onClick={() => setActiveView({ type: 'MINORS' })}
            className={`w-full text-left p-3 rounded-lg font-bold text-xs tracking-widest uppercase transition-colors ${
              activeView.type === 'MINORS' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:bg-zinc-900'
            }`}
          >
            Minors
          </button>
        </nav>
      </aside>

      <main className="flex-1 overflow-y-auto p-6 lg:p-8 scroll-smooth bg-[#09090b]">
        <div className="max-w-[1400px] mx-auto">
          
          <MarketMonitor lastRefresh={lastRefresh} />

          {loading && !data.majors ? (
            <div className="p-12 text-center text-zinc-600 font-mono border border-zinc-800 rounded-xl bg-zinc-900/50">
              Initializing secure cloud connection...
            </div>
          ) : error && !data.majors ? (
            <div className="p-6 text-center text-red-400 font-mono border border-red-900/50 bg-red-950/20 rounded-xl">
              {error}
            </div>
          ) : (
            
            /* --- NOVÝ GRID LAYOUT: VLEVO TABULKY, VPRAVO NEWS FEED --- */
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Hlavní obsah s tabulkami (zabírá 2/3 šířky) */}
              <div className="lg:col-span-2 flex flex-col">
                {renderTable(data.majors, "MAJOR LIQUIDITY", "MAJORS")}
                {renderTable(data.minors, "MINOR & CROSS PAIRS", "MINORS")}
                {renderTable(data.metals, "PRECIOUS METALS", "METALS")}
              </div>

              {/* Pravý sloupec s Novinkami (zabírá 1/3 šířky) */}
              <div className="lg:col-span-1">
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden sticky top-8">
                  <div className="bg-zinc-800/50 p-4 border-b border-zinc-800 flex items-center justify-between">
                    <div className="font-bold tracking-widest text-zinc-300 text-sm uppercase">Live Market Feed</div>
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                    </span>
                  </div>
                  <div className="flex flex-col divide-y divide-zinc-800/50">
                    {data.news && data.news.length > 0 ? (
                      data.news.map((item, idx) => (
                        <a key={idx} href={item.link} target="_blank" rel="noreferrer" className="p-4 hover:bg-zinc-800/30 transition-colors group">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-[10px] text-zinc-400 font-mono bg-zinc-950 px-1.5 py-0.5 rounded border border-zinc-800">
                              {item.time}
                            </span>
                            <span className="text-[10px] text-zinc-500 uppercase tracking-wider">
                              {item.publisher}
                            </span>
                          </div>
                          <h4 className="text-sm font-medium text-zinc-300 leading-snug group-hover:text-white transition-colors">
                            {item.title}
                          </h4>
                        </a>
                      ))
                    ) : (
                      <div className="p-6 text-center text-xs text-zinc-500 font-mono">
                        Awaiting market catalysts...
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
            </div>
          )}
        </div>
      </main>
    </div>
  );
}