"use client";

import { useState, useEffect } from 'react';

interface DashboardData {
  majors?: Record<string, number>;
  minors?: Record<string, number>;
  metals?: Record<string, number>;
  parameters?: Record<string, { SL: number; TP: number; Partial: number; BE: number; MaxSpread: number; LiveSpread: number | string; KeyDriver: string }>;
}

type ViewType = 'OVERVIEW' | 'MAJORS' | 'MINORS' | 'METALS' | 'TICKER';

const HeroSection = () => (
  <div className="relative border-b border-zinc-800 bg-zinc-950 p-12 overflow-hidden shrink-0">
    <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-800/20 via-black to-black pointer-events-none" />
    <div className="relative max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
      <div>
        <h1 className="text-6xl font-bold tracking-tighter text-white">Algory<span className="text-green-500">.</span></h1>
        <p className="mt-4 text-xl text-zinc-400 max-w-lg leading-relaxed">
          Quantitative intelligence powering real-time market edge. 
          Analyze M15 candle structures with machine learning precision.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl shadow-lg">
          <div className="text-green-500 text-2xl font-bold font-mono">15m</div>
          <div className="text-xs text-zinc-500 uppercase tracking-widest mt-1">Timeframe</div>
        </div>
        <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl shadow-lg">
          <div className="text-green-500 text-2xl font-bold font-mono">XGBoost</div>
          <div className="text-xs text-zinc-500 uppercase tracking-widest mt-1">AI Engine</div>
        </div>
      </div>
    </div>
  </div>
);

export default function Home() {
  const [data, setData] = useState<DashboardData>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    majors: true,
    minors: false,
    metals: true
  });
  const [activeView, setActiveView] = useState<{ type: ViewType; payload?: string }>({ type: 'OVERVIEW' });

  useEffect(() => {
    const loadData = () => {
      const timestamp = new Date().getTime();
      fetch(`/results.json?t=${timestamp}`)
        .then((res) => {
          if (!res.ok) throw new Error('Error loading results file');
          return res.json();
        })
        .then((jsonData: DashboardData) => {
          setData(jsonData);
          setError(null);
        })
        .catch((err) => {
          console.error("API Error:", err);
          setError("Failed to load current data from the running engine.");
        })
        .finally(() => {
          setLoading(false);
        });
    };

    loadData();
    const interval = setInterval(loadData, 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const renderTable = (pairsData: Record<string, number> | undefined, title: string, categoryId: ViewType) => {
    if (!pairsData || Object.keys(pairsData).length === 0) return null;
    if (activeView.type !== 'OVERVIEW' && activeView.type !== categoryId && activeView.type !== 'TICKER') return null;

    let sortedPairs = Object.entries(pairsData).sort((a, b) => b[1] - a[1]);
    if (activeView.type === 'TICKER' && activeView.payload) {
      sortedPairs = sortedPairs.filter(([ticker]) => ticker === activeView.payload);
      if (sortedPairs.length === 0) return null;
    }

    return (
      <div className="mb-8 w-full bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="bg-zinc-800/50 p-4 border-b border-zinc-800 font-bold tracking-widest text-zinc-300">
          {title}
        </div>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-900/80">
              <th className="p-4 text-sm uppercase tracking-widest text-zinc-500 font-medium">Instrument & Parameters</th>
              <th className="p-4 text-sm uppercase tracking-widest text-zinc-500 font-medium text-right">Win Rate</th>
              <th className="p-4 text-sm uppercase tracking-widest text-zinc-500 font-medium text-right">Status</th>
            </tr>
          </thead>
          <tbody>
            {sortedPairs.map(([ticker, accuracy]) => {
              const isProfitable = accuracy > 0.52;
              const displayTicker = ticker === "XAUUSD" ? "GOLD (XAUUSD)" : ticker;
              const params = data.parameters?.[ticker];
              const displaySpread = params?.LiveSpread !== "N/A" ? params?.LiveSpread : `${params?.MaxSpread} (Max)`;
              
              return (
                <tr key={ticker} className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors">
                  <td className="p-4">
                    <div className="font-mono text-lg text-white flex items-center gap-3">
                      {displayTicker}
                      {/* VYSVĚTLITELNOST MODELU - KEY DRIVER */}
                      {params?.KeyDriver && (
                        <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 text-[10px] uppercase tracking-wider rounded border border-indigo-500/20 font-sans">
                          Driver: {params.KeyDriver}
                        </span>
                      )}
                    </div>
                    {params && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        <span className="px-2 py-0.5 bg-zinc-800 text-zinc-400 text-[10px] rounded border border-zinc-700">SL: {params.SL}</span>
                        <span className="px-2 py-0.5 bg-zinc-800 text-zinc-400 text-[10px] rounded border border-zinc-700">TP: {params.TP === 9999 ? 'OPEN' : params.TP}</span>
                        <span className="px-2 py-0.5 bg-zinc-800 text-zinc-400 text-[10px] rounded border border-zinc-700">BE: {params.BE}</span>
                        <span className="px-2 py-0.5 bg-zinc-800 text-zinc-400 text-[10px] rounded border border-zinc-700">Partial: {params.Partial}</span>
                        <span className="px-2 py-0.5 bg-zinc-800 text-zinc-400 text-[10px] rounded border border-zinc-700">Spread: {displaySpread}</span>
                      </div>
                    )}
                  </td>
                  <td className="p-4 font-mono text-xl text-right align-top pt-5">
                    <span className={isProfitable ? "text-green-400 font-bold" : "text-zinc-400"}>
                      {(accuracy * 100).toFixed(1)}%
                    </span>
                  </td>
                  <td className="p-4 text-right align-top pt-5">
                    {isProfitable ? (
                      <span className="px-3 py-1 bg-green-500/10 text-green-400 text-xs rounded-full border border-green-500/20 shadow-[0_0_10px_rgba(34,197,94,0.2)]">
                        Tradeable
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-zinc-800 text-zinc-500 text-xs rounded-full border border-zinc-700">
                        Skip
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  const SidebarSection = ({ title, sectionKey, tickers, viewType }: { title: string, sectionKey: string, tickers?: string[], viewType: ViewType }) => {
    const isOpen = expandedSections[sectionKey];
    return (
      <div className="mb-2">
        <button 
          onClick={() => toggleSection(sectionKey)}
          className="w-full flex items-center justify-between p-2 text-sm font-semibold tracking-wider text-zinc-400 uppercase hover:text-white transition-colors"
        >
          <span className="cursor-pointer hover:underline" onClick={(e) => { e.stopPropagation(); setActiveView({ type: viewType }); }}>
            {title}
          </span>
          <svg className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {isOpen && tickers && (
          <div className="mt-1 pl-4 space-y-1">
            {tickers.map(ticker => (
              <div 
                key={ticker} 
                onClick={() => setActiveView({ type: 'TICKER', payload: ticker })}
                className={`p-2 text-sm font-mono cursor-pointer rounded-md transition-all ${
                  activeView.payload === ticker ? 'bg-zinc-800 text-green-400 border border-zinc-700' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'
                }`}
              >
                {ticker === "XAUUSD" ? "GOLD" : ticker.replace("=X", "").replace("GC=F", "GOLD").replace("SI=F", "SILVER")}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-black text-white selection:bg-zinc-800 overflow-hidden">
      <aside className="w-72 flex-shrink-0 border-r border-zinc-800 bg-zinc-950 flex flex-col h-full z-10 overflow-y-auto">
        <div className="p-6 border-b border-zinc-800">
          <h2 className="text-2xl font-bold tracking-tighter bg-gradient-to-br from-white to-zinc-500 bg-clip-text text-transparent">
            Algory
          </h2>
          <div className="flex items-center gap-2 mt-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <p className="text-xs text-zinc-500 font-mono tracking-widest">SYSTEM ONLINE</p>
          </div>
        </div>

        <nav className="flex-1 p-4">
          <div className="mb-6">
            <button 
              onClick={() => setActiveView({ type: 'OVERVIEW' })}
              className={`w-full text-left p-3 rounded-lg font-medium transition-colors ${
                activeView.type === 'OVERVIEW' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
              }`}
            >
              Overview Dashboard
            </button>
          </div>

          {!loading && (
            <div className="space-y-4">
              <SidebarSection title="Majors" sectionKey="majors" viewType="MAJORS" tickers={data.majors ? Object.keys(data.majors) : []} />
              <SidebarSection title="Minors" sectionKey="minors" viewType="MINORS" tickers={data.minors ? Object.keys(data.minors) : []} />
              <SidebarSection title="Metals" sectionKey="metals" viewType="METALS" tickers={data.metals ? Object.keys(data.metals) : []} />
            </div>
          )}
        </nav>
        
        <div className="p-4 border-t border-zinc-800 text-[10px] text-zinc-600 font-mono text-center">
          V1.0.0 &copy; Algory Engine
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-full overflow-hidden bg-zinc-950/50">
        <HeroSection />
        <div className="flex-1 overflow-y-auto p-8 lg:p-12">
          <div className="max-w-5xl mx-auto">
            <header className="mb-10">
              <h1 className="text-4xl font-bold tracking-tighter text-white">
                {activeView.type === 'OVERVIEW' && "Market Overview"}
                {activeView.type === 'MAJORS' && "Major Forex Pairs"}
                {activeView.type === 'MINORS' && "Minor & Cross Pairs"}
                {activeView.type === 'METALS' && "Precious Metals"}
                {activeView.type === 'TICKER' && `Detailed View: ${activeView.payload}`}
              </h1>
            </header>

            {loading && !data.majors ? (
              <div className="p-12 text-center text-zinc-500 font-mono animate-pulse border border-zinc-800/50 rounded-2xl bg-zinc-900/20">
                Initializing live data feed...
              </div>
            ) : error && !data.majors ? (
              <div className="p-6 text-center text-red-500 font-mono border border-red-500/30 bg-red-500/10 rounded-xl">
                {error}
              </div>
            ) : (
              <div className="w-full flex flex-col">
                {renderTable(data.majors, "MAJOR FOREX", "MAJORS")}
                {renderTable(data.minors, "MINOR & CROSS FOREX", "MINORS")}
                {renderTable(data.metals, "PRECIOUS METALS", "METALS")}
                
                {activeView.type !== 'TICKER' && (
                  <div className="mt-4 text-xs text-zinc-600 font-mono text-center pb-12">
                    Live tracking active. Data refreshed automatically.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}