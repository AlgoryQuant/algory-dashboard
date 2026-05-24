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
    <div className="mb-10 p-8 bg-white/[0.02] backdrop-blur-3xl border border-white/[0.05] rounded-[2rem] shadow-2xl relative overflow-hidden">
      {/* Vznášející se gradient na pozadí boxu */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-8 relative z-10">
        
        <div className="flex flex-col gap-2 w-full md:w-auto">
          <div className="text-5xl font-semibold tracking-tight text-white/90">
            {now.toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' })}
            <span className="text-2xl text-white/40 ml-2">:{now.toLocaleTimeString('cs-CZ', { second: '2-digit' }).split(':')[2]}</span>
          </div>
          <div className="text-xs font-medium text-white/40 uppercase tracking-widest flex items-center gap-3 mt-2">
            <span className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Live Sync
            </span>
            <span className="px-3 py-1 bg-white/5 rounded-full border border-white/5">
              {lastRefresh ? lastRefresh.toLocaleTimeString('cs-CZ') : "Connecting..."}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 w-full md:w-auto">
          {sessions.map((s) => (
            <div key={s.name} className={`px-5 py-3 border rounded-2xl flex flex-col items-center justify-center transition-all duration-500 ${
              s.isActive 
                ? 'bg-emerald-500/10 border-emerald-500/30' 
                : 'bg-black/20 border-white/5 opacity-50'
            }`}>
              <span className={`text-xs font-bold uppercase tracking-widest mb-1 ${s.isActive ? 'text-emerald-400' : 'text-white/50'}`}>
                {s.name}
              </span>
              <span className="text-[10px] text-white/30 font-medium">{s.open} - {s.close}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 relative z-10">
        <div className="flex justify-between text-[10px] text-white/40 font-medium mb-3 uppercase tracking-widest">
          <span>AI Engine M15 Cycle</span>
          <span>{15 - (minutes % 15)}m {(60 - seconds) % 60}s remaining</span>
        </div>
        <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden border border-white/5">
          <div 
            className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full transition-all duration-1000 ease-linear shadow-[0_0_15px_rgba(52,211,153,0.5)]"
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
      // ⚠️ TVOJE FIREBASE URL ZDE
      const FIREBASE_URL = "https://algory-87b19-default-rtdb.europe-west1.firebasedatabase.app/results.json";
      
      fetch(`${FIREBASE_URL}?t=${new Date().getTime()}`)
        .then((res) => {
          if (!res.ok) throw new Error('Network response was not ok');
          return res.json();
        })
        .then((jsonData: DashboardData) => {
          setData(jsonData || {});
          setLastRefresh(new Date());
          setError(null);
        })
        .catch((err) => {
          console.error("API Error:", err);
          setError("Failed to sync with cloud database.");
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
      <div className="mb-10 w-full bg-white/[0.02] backdrop-blur-2xl border border-white/[0.05] rounded-[2rem] overflow-hidden shadow-xl">
        <div className="bg-white/[0.02] px-6 py-5 border-b border-white/[0.05] flex items-center gap-4">
          <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)]"></div>
          </div>
          <h3 className="font-semibold tracking-widest text-white/90 uppercase text-sm">{title}</h3>
        </div>
        
        <div className="flex flex-col">
          <div className="grid grid-cols-12 px-6 py-4 bg-black/20 text-[10px] uppercase tracking-widest text-white/40 font-medium">
            <div className="col-span-7">Market Structure</div>
            <div className="col-span-3 text-right">Probability</div>
            <div className="col-span-2 text-right">Action</div>
          </div>
          
          {sortedPairs.map(([ticker, accuracy]) => {
            const isProfitable = accuracy > 0.52;
            const displayTicker = ticker === "XAUUSD" ? "GOLD (XAUUSD)" : ticker;
            const params = data.parameters?.[ticker];
            const isExpanded = expandedRow === ticker;
            
            return (
              <div key={ticker} className="border-b border-white/[0.02] last:border-0">
                <div 
                  onClick={() => toggleRow(ticker)}
                  className={`grid grid-cols-12 px-6 py-5 items-center cursor-pointer transition-all duration-300 ${isExpanded ? 'bg-white/[0.04]' : 'hover:bg-white/[0.03]'}`}
                >
                  <div className="col-span-7">
                    <div className="flex items-center gap-4">
                      <span className="font-bold text-lg text-white/90">{displayTicker}</span>
                      {params?.KeyDriver && (
                        <span className="px-2.5 py-1 bg-white/5 text-white/60 text-[9px] uppercase tracking-widest rounded-lg border border-white/10 font-medium">
                          {params.KeyDriver}
                        </span>
                      )}
                    </div>
                    {params && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        <span className="px-2 py-1 bg-black/40 text-white/40 text-[10px] rounded-md border border-white/5">SL: {params.SL}</span>
                        <span className="px-2 py-1 bg-black/40 text-white/40 text-[10px] rounded-md border border-white/5">TP: {params.TP === 9999 ? 'OPEN' : params.TP}</span>
                        <span className="px-2 py-1 bg-black/40 text-white/40 text-[10px] rounded-md border border-white/5">BE: {params.BE}</span>
                        <span className="px-2 py-1 bg-black/40 text-white/40 text-[10px] rounded-md border border-white/5">Spread: {params.LiveSpread !== "N/A" ? params.LiveSpread : params.MaxSpread}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="col-span-3 text-right flex justify-end">
                    <span className={`text-xl font-medium tracking-tight ${isProfitable ? "text-emerald-400 drop-shadow-[0_0_12px_rgba(52,211,153,0.3)]" : "text-white/40"}`}>
                      {(accuracy * 100).toFixed(1)}%
                    </span>
                  </div>
                  
                  <div className="col-span-2 flex justify-end items-center gap-4">
                    {isProfitable ? (
                      <span className="px-4 py-1.5 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold uppercase tracking-widest rounded-full border border-emerald-500/20">
                        Trade
                      </span>
                    ) : (
                      <span className="px-4 py-1.5 bg-black/40 text-white/30 text-[10px] font-bold uppercase tracking-widest rounded-full border border-white/10">
                        Skip
                      </span>
                    )}
                  </div>
                </div>

                {/* Rozbalovací AI analýza */}
                {isExpanded && params?.aiAnalysis && (
                  <div className="bg-black/20 p-8 border-t border-white/5">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6">
                        <div className="text-[10px] text-white/40 uppercase tracking-widest mb-4 flex items-center justify-between">
                          <span>Previous: {params.aiAnalysis.prev_session}</span>
                          <span className="w-1.5 h-1.5 rounded-full bg-white/20"></span>
                        </div>
                        <p className="text-sm text-white/60 leading-relaxed font-medium">
                          {params.aiAnalysis.evaluation}
                        </p>
                      </div>

                      <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-6 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
                        <div className="text-[10px] text-emerald-400/80 uppercase tracking-widest mb-4 flex items-center justify-between">
                          <span>Prediction: {params.aiAnalysis.current_session}</span>
                          <span className="relative flex h-1.5 w-1.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                          </span>
                        </div>
                        <p className={`text-sm leading-relaxed font-medium relative z-10 ${isProfitable ? 'text-emerald-300/90' : 'text-white/60'}`}>
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
    <div className="flex h-screen bg-[#050505] text-zinc-200 selection:bg-emerald-500/30 overflow-hidden font-sans">
      
      <aside className="w-72 flex-shrink-0 border-r border-white/5 bg-[#050505] flex flex-col h-full z-20 hidden md:flex">
        <div className="p-8 pb-12">
          <h2 className="text-3xl font-semibold tracking-tighter text-white">
            Algory<span className="text-emerald-500">.</span>
          </h2>
          <div className="flex items-center gap-3 mt-4">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <p className="text-[10px] text-white/40 font-medium tracking-widest uppercase">Engine Online</p>
          </div>
        </div>

        <nav className="flex-1 px-6 space-y-2">
          {[
            { id: 'OVERVIEW', label: 'Dashboard' },
            { id: 'MAJORS', label: 'Major Pairs' },
            { id: 'MINORS', label: 'Cross Pairs' }
          ].map((item) => (
            <button 
              key={item.id}
              onClick={() => setActiveView({ type: item.id as ViewType })}
              className={`w-full text-left px-5 py-4 rounded-2xl font-semibold text-xs tracking-widest uppercase transition-all duration-300 ${
                activeView.type === item.id 
                  ? 'bg-white/10 text-white shadow-sm' 
                  : 'text-white/40 hover:bg-white/5 hover:text-white/70'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      {/* Hlavní obsah - přidán obrovský padding nahoře (pt-12 až pt-20), aby to nebylo nalepené */}
      <main className="flex-1 overflow-y-auto px-6 pt-12 pb-24 lg:px-12 lg:pt-20 scroll-smooth bg-gradient-to-br from-[#050505] via-[#0a0a0a] to-[#050505]">
        <div className="max-w-[1400px] mx-auto">
          
          <MarketMonitor lastRefresh={lastRefresh} />

          {loading && !data.majors ? (
            <div className="p-20 mt-10 text-center flex flex-col items-center justify-center gap-6 border border-white/5 rounded-[2rem] bg-white/[0.02]">
              <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
              <span className="text-sm text-white/40 font-medium tracking-widest uppercase">Connecting to Cloud Engine...</span>
            </div>
          ) : error && !data.majors ? (
            <div className="p-10 mt-10 text-center text-red-400 font-medium border border-red-900/30 bg-red-950/10 rounded-[2rem]">
              {error}
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-10 mt-10">
              
              {/* Tabulky (2/3 šířky) */}
              <div className="xl:col-span-2 flex flex-col space-y-10">
                {renderTable(data.majors, "Major Liquidity", "MAJORS")}
                {renderTable(data.minors, "Cross Pairs", "MINORS")}
                {renderTable(data.metals, "Precious Metals", "METALS")}
              </div>

              {/* News Feed - Bento Box styl (1/3 šířky) */}
              <div className="xl:col-span-1">
                <div className="bg-white/[0.02] backdrop-blur-2xl border border-white/[0.05] rounded-[2rem] overflow-hidden sticky top-8 shadow-xl">
                  <div className="px-6 py-5 border-b border-white/[0.05] flex items-center justify-between bg-white/[0.01]">
                    <div className="font-semibold tracking-widest text-white/90 text-sm uppercase">Live Market News</div>
                  </div>
                  
                  <div className="flex flex-col p-2">
                    {data.news && data.news.length > 0 ? (
                      data.news.map((item, idx) => (
                        <a key={idx} href={item.link} target="_blank" rel="noreferrer" className="p-4 m-1 rounded-2xl hover:bg-white/[0.04] transition-colors group">
                          <div className="flex items-center gap-3 mb-3">
                            <span className="text-[9px] text-white/50 font-medium bg-black/40 px-2 py-1 rounded-md border border-white/5">
                              {item.time}
                            </span>
                            <span className="text-[10px] text-emerald-400/80 uppercase tracking-widest font-bold">
                              {item.publisher}
                            </span>
                          </div>
                          <h4 className="text-sm font-medium text-white/70 leading-relaxed group-hover:text-white transition-colors">
                            {item.title}
                          </h4>
                        </a>
                      ))
                    ) : (
                      <div className="p-10 text-center text-xs text-white/30 font-medium uppercase tracking-widest">
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