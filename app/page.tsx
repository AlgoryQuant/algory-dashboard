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
  parameters?: Record<string, { 
    SL: number; 
    TP: number; 
    Partial: number; 
    BE: number; 
    MaxSpread: number; 
    LiveSpread: number | string; 
    KeyDriver: string; 
    Direction?: string; 
    aiAnalysis?: AIAnalysis 
  }>;
}

const TradingChart = ({ symbol }: { symbol: string }) => {
  const getTVSymbol = (s: string) => {
    if (s === 'GOLD' || s === 'XAUUSD') return 'OANDA:XAUUSD';
    if (s === 'SILVER' || s === 'XAGUSD') return 'OANDA:XAGUSD';
    return `OANDA:${s}`;
  };

  const tvSymbol = getTVSymbol(symbol);

  return (
    <div className="w-full bg-white/[0.02] backdrop-blur-2xl border border-white/[0.05] rounded-[2rem] overflow-hidden shadow-xl h-[450px] relative">
      <div className="absolute top-0 left-0 w-full px-6 py-4 bg-white/[0.02] border-b border-white/[0.05] flex items-center justify-between z-10 pointer-events-none">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
            <svg className="w-4 h-4 text-white/80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
            </svg>
          </div>
          <h3 className="font-semibold tracking-widest text-white/90 uppercase text-sm">Live Market Structure: {symbol}</h3>
        </div>
        <span className="px-3 py-1 bg-black/40 text-white/60 text-[10px] font-bold uppercase tracking-widest rounded-md border border-white/5">
          M15 Timeframe
        </span>
      </div>
      
      <div className="w-full h-full pt-[73px]">
        <iframe
          src={`https://s.tradingview.com/widgetembed/?frameElementId=tradingview_1&symbol=${tvSymbol}&interval=15&hidesidetoolbar=1&symboledit=0&saveimage=0&toolbarbg=050505&studies=%5B%5D&theme=dark&style=1&timezone=Etc%2FUTC&studies_overrides=%7B%7D&overrides=%7B%7D&enabled_features=%5B%5D&disabled_features=%5B%5D&locale=en`}
          style={{ width: '100%', height: '100%', border: 'none' }}
          title={`TradingView Chart ${symbol}`}
        />
      </div>
    </div>
  );
};

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
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-8 relative z-10">
        <div className="flex flex-col gap-2 w-full md:w-auto">
          <div className="text-5xl font-semibold tracking-tight text-white/90">
            {now.toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' })}
            <span className="text-2xl text-white/40 ml-1">:{now.getSeconds().toString().padStart(2, '0')}</span>
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
  
  const [activePair, setActivePair] = useState<string>("EURUSD"); 
  
  // NOVÉ: Stav pro otevírání/zavírání skupin v levém menu (všechny jsou defaultně otevřené)
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    'Major Liquidity': true,
    'Cross Pairs': true,
    'Precious Metals': true
  });
  
  const [showLanding, setShowLanding] = useState<boolean>(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [showAuthGate, setShowAuthGate] = useState<boolean>(false);
  
  const [nickname, setNickname] = useState('');
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem('algory_user');
    if (savedUser) setIsAuthenticated(true);
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailError("Please enter a valid email address (e.g., name@domain.com).");
      return;
    }
    
    setEmailError(null);
    if (!nickname || !email) return;
    setIsSubmitting(true);
    
    try {
      const FIREBASE_USERS_URL = "https://algory-87b19-default-rtdb.europe-west1.firebasedatabase.app/users.json";
      const userData = { nickname, email, registeredAt: new Date().toISOString() };
      await fetch(FIREBASE_USERS_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(userData) });
      await fetch('/api/welcome', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, nickname }) });
      localStorage.setItem('algory_user', JSON.stringify(userData));
      setIsAuthenticated(true);
      setShowAuthGate(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLaunch = () => {
    setShowLanding(false);
    if (!isAuthenticated) setShowAuthGate(true);
  };

  useEffect(() => {
    const loadData = () => {
      const FIREBASE_DATA_URL = "https://algory-87b19-default-rtdb.europe-west1.firebasedatabase.app/results.json";
      fetch(`${FIREBASE_DATA_URL}?t=${new Date().getTime()}`)
        .then((res) => res.json())
        .then((jsonData: DashboardData) => {
          setData(jsonData || {});
          setLastRefresh(new Date());
          setError(null);
        })
        .catch(() => setError("Failed to sync with cloud database."))
        .finally(() => setLoading(false));
    };

    if (isAuthenticated || showAuthGate) {
       loadData();
       const interval = setInterval(loadData, 15 * 60 * 1000);
       return () => clearInterval(interval);
    }
  }, [isAuthenticated, showAuthGate]);

  // NOVÉ: Funkce na přepínání skupin
  const toggleGroup = (title: string) => {
    setOpenGroups(prev => ({ ...prev, [title]: !prev[title] }));
  };

  const renderSidebarGroup = (title: string, pairs: Record<string, number> | undefined) => {
    if (!pairs || Object.keys(pairs).length === 0) return null;
    const sortedPairs = Object.entries(pairs).sort((a, b) => b[1] - a[1]);
    const isOpen = openGroups[title]; // Kontrola, zda je skupina otevřená

    return (
      <div className="mb-4">
        {/* Tlačítko pro rozbalení / sbalení */}
        <button 
          onClick={() => toggleGroup(title)}
          className="w-full flex items-center justify-between px-6 py-2 mb-2 cursor-pointer group outline-none"
        >
          <span className="text-[10px] font-bold text-white/30 group-hover:text-white/60 uppercase tracking-widest transition-colors">
            {title}
          </span>
          <svg 
            className={`w-3 h-3 text-white/30 group-hover:text-white/60 transition-transform duration-300 ${isOpen ? 'rotate-180' : 'rotate-0'}`} 
            fill="none" viewBox="0 0 24 24" stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Samotný obsah, který se schovává/ukazuje */}
        <div className={`space-y-1 px-3 overflow-hidden transition-all duration-500 ease-in-out ${isOpen ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}>
          {sortedPairs.map(([ticker, prob]) => {
            const isActive = activePair === ticker;
            const displayTicker = ticker === "XAUUSD" ? "GOLD" : ticker;
            
            let pairDir = "NEUTRAL";
            if (prob >= 0.52) pairDir = "BUY";
            else if (prob <= 0.48 && prob > 0) pairDir = "SELL";

            let probColor = "text-white/20";
            if (pairDir === "BUY") probColor = isActive ? "text-emerald-400" : "text-emerald-500/60";
            if (pairDir === "SELL") probColor = isActive ? "text-red-400" : "text-red-500/60";

            return (
              <button
                key={ticker}
                onClick={() => setActivePair(ticker)}
                className={`w-full text-left px-4 py-3 rounded-2xl transition-all duration-300 flex justify-between items-center group ${
                  isActive 
                    ? pairDir === 'SELL' 
                        ? 'bg-red-500/10 border border-red-500/20' 
                        : 'bg-emerald-500/10 border border-emerald-500/20'
                    : 'border border-transparent hover:bg-white/5'
                }`}
              >
                <span className={`font-semibold tracking-wide ${isActive ? 'text-white' : 'text-white/60 group-hover:text-white/90'}`}>
                  {displayTicker}
                </span>
                <span className={`text-[10px] font-bold tracking-widest ${probColor}`}>
                  {(prob * 100).toFixed(0)}%
                </span>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  if (showLanding) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[#050505] text-white relative overflow-hidden font-sans">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-emerald-900/20 via-[#050505] to-[#050505] pointer-events-none" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none animate-pulse" />
        <div className="relative z-10 flex flex-col items-center text-center animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <div className="flex items-center gap-3 mb-6">
            <span className="relative flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span></span>
            <span className="text-xs font-bold text-emerald-400 tracking-[0.3em] uppercase">System Ready</span>
          </div>
          <h1 className="text-7xl md:text-9xl font-bold tracking-tighter text-white drop-shadow-2xl">Algory<span className="text-emerald-500">.</span></h1>
          <p className="mt-8 text-zinc-400 text-sm md:text-lg tracking-[0.2em] uppercase max-w-xl leading-relaxed">Institutional Grade <br/> <span className="text-white/80 font-bold">Quantitative Trading Engine</span></p>
          <button onClick={handleLaunch} className="mt-16 px-10 py-5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-full font-bold text-sm tracking-widest uppercase transition-all duration-300 shadow-[0_0_30px_rgba(52,211,153,0.15)] hover:bg-emerald-500/20 hover:-translate-y-1">Launch Terminal</button>
        </div>
      </div>
    );
  }

  if (showAuthGate && !isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[#050505] text-white relative overflow-hidden font-sans">
        <form onSubmit={handleRegister} className="relative z-10 w-full max-w-md p-10 bg-white/[0.02] backdrop-blur-2xl border border-white/[0.05] rounded-[2rem] shadow-2xl flex flex-col gap-6 animate-in fade-in zoom-in-95 duration-500">
          <div className="text-center mb-4">
            <h2 className="text-2xl font-bold tracking-tight text-white mb-2">Request Access</h2>
            <p className="text-xs text-zinc-400 uppercase tracking-widest">Connect to Algory Engine</p>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-[10px] text-zinc-400 font-medium uppercase tracking-widest ml-1">Trader Nickname</label>
            <input type="text" required value={nickname} onChange={(e) => setNickname(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500/50 transition-colors" placeholder="e.g. AlgoMaster99" />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-[10px] text-zinc-400 font-medium uppercase tracking-widest ml-1">Email Address</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={`w-full bg-black/50 border ${emailError ? 'border-red-500/50' : 'border-white/10'} rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500/50 transition-colors`} placeholder="name@domain.com" />
            {emailError && <span className="text-[10px] text-red-400 font-medium ml-1">{emailError}</span>}
          </div>
          <button type="submit" disabled={isSubmitting} className="mt-4 w-full py-4 bg-emerald-500 text-black font-bold text-xs tracking-widest uppercase rounded-xl transition-all hover:bg-emerald-400 disabled:opacity-50">{isSubmitting ? "Connecting..." : "Enter Terminal"}</button>
        </form>
      </div>
    );
  }

  const activeProb = data.majors?.[activePair] ?? data.minors?.[activePair] ?? data.metals?.[activePair] ?? 0;
  const activeParams = data.parameters?.[activePair];
  const displayTicker = activePair === "XAUUSD" ? "GOLD (XAUUSD)" : activePair;
  
  const clampedProb = Math.max(0, Math.min(1, activeProb));
  const gaugeRotation = (clampedProb * 180) - 90; 

  let inferredDirection = "NEUTRAL";
  let isTradeActive = false;

  if (clampedProb >= 0.52) {
      inferredDirection = "BUY";
      isTradeActive = true;
  } else if (clampedProb <= 0.48 && clampedProb > 0) {
      inferredDirection = "SELL";
      isTradeActive = true;
  }

  const getPageBackground = () => {
    if (inferredDirection === 'BUY') return 'from-emerald-950/20 via-[#0a0a0a] to-[#050505]';
    if (inferredDirection === 'SELL') return 'from-red-950/20 via-[#0a0a0a] to-[#050505]';
    return 'from-[#050505] via-[#0a0a0a] to-[#050505]';
  };

  return (
    <>
      {/* NOVÉ: GLOBÁLNÍ CSS PRO TENKÝ, PRŮHLEDNÝ SCROLLBAR */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      `}} />

      <div className="flex h-screen bg-[#050505] text-zinc-200 selection:bg-emerald-500/30 overflow-hidden font-sans animate-in fade-in duration-700">
        
        {/* LEVÉ MENU S CUSTOM SCROLLBAREM */}
        <aside className="w-80 flex-shrink-0 border-r border-white/5 bg-[#050505] flex flex-col h-full z-20 hidden md:flex">
          <div className="p-8 pb-6 cursor-pointer border-b border-white/5 mb-4" onClick={() => setShowLanding(true)}>
            <h2 className="text-3xl font-semibold tracking-tighter text-white hover:opacity-80 transition-opacity">
              Algory<span className="text-emerald-500">.</span>
            </h2>
            <div className="flex items-center gap-3 mt-4">
              <span className="relative flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${inferredDirection === 'SELL' ? 'bg-red-400' : 'bg-emerald-400'}`}></span>
                <span className={`relative inline-flex rounded-full h-2 w-2 ${inferredDirection === 'SELL' ? 'bg-red-500' : 'bg-emerald-500'}`}></span>
              </span>
              <p className="text-[10px] text-white/40 font-medium tracking-widest uppercase">Engine Online</p>
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto pb-10 custom-scrollbar pr-1">
            {renderSidebarGroup('Major Liquidity', data.majors)}
            {renderSidebarGroup('Cross Pairs', data.minors)}
            {renderSidebarGroup('Precious Metals', data.metals)}
          </nav>
        </aside>

        {/* HLAVNÍ OBSAH S CUSTOM SCROLLBAREM */}
        <main className={`flex-1 overflow-y-auto custom-scrollbar px-6 pt-12 pb-24 lg:px-12 lg:pt-20 scroll-smooth transition-colors duration-1000 ease-in-out bg-gradient-to-br ${getPageBackground()}`}>
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
                
                <div className="xl:col-span-2 flex flex-col space-y-10">
                  
                  <TradingChart symbol={activePair} />
                  
                  <div className="bg-white/[0.02] backdrop-blur-2xl border border-white/[0.05] rounded-[2rem] overflow-hidden shadow-xl p-8">
                    
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 border-b border-white/[0.05] pb-8">
                      <div>
                        <div className="flex items-center gap-4 mb-3">
                          <h2 className="text-3xl font-bold text-white/90">{displayTicker}</h2>
                          
                          {isTradeActive && (
                            <span className={`px-4 py-1.5 text-[11px] font-bold uppercase tracking-widest rounded-lg border shadow-lg ${
                              inferredDirection === 'BUY' 
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-emerald-500/20' 
                                : 'bg-red-500/10 text-red-400 border-red-500/30 shadow-red-500/20'
                            }`}>
                              {inferredDirection} PENDING
                            </span>
                          )}

                          {activeParams?.KeyDriver && (
                            <span className="px-3 py-1 bg-white/5 text-white/60 text-[10px] uppercase tracking-widest rounded-lg border border-white/10 font-medium">
                              {activeParams.KeyDriver}
                            </span>
                          )}
                        </div>
                        
                        {activeParams && (
                          <div className="flex flex-wrap gap-2 mt-4">
                            <span className="px-3 py-1.5 bg-black/40 text-white/50 text-[11px] rounded-md border border-white/5 font-mono">SL: {activeParams.SL}</span>
                            <span className="px-3 py-1.5 bg-black/40 text-white/50 text-[11px] rounded-md border border-white/5 font-mono">TP: {activeParams.TP === 9999 ? 'OPEN' : activeParams.TP}</span>
                            <span className="px-3 py-1.5 bg-black/40 text-white/50 text-[11px] rounded-md border border-white/5 font-mono">BE: {activeParams.BE}</span>
                            <span className="px-3 py-1.5 bg-black/40 text-white/80 text-[11px] rounded-md border border-white/10 font-mono">Spread: {activeParams.LiveSpread !== "N/A" ? activeParams.LiveSpread : activeParams.MaxSpread}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col items-center gap-4">
                        <div className="flex flex-col items-center justify-center relative w-44 h-24">
                          <svg viewBox="0 0 200 120" className="w-full h-full drop-shadow-2xl overflow-visible">
                            <path d="M 20 100 A 80 80 0 0 1 100 20" fill="none" stroke="currentColor" strokeWidth="12" className="text-red-500/10" strokeLinecap="round" />
                            <path d="M 100 20 A 80 80 0 0 1 180 100" fill="none" stroke="currentColor" strokeWidth="12" className="text-emerald-500/10" strokeLinecap="round" />
                            <path d="M 20 100 A 80 80 0 0 1 100 20" fill="none" stroke="currentColor" strokeWidth="12" className="text-red-500/80" strokeLinecap="round" strokeDasharray="125" strokeDashoffset="0" />
                            <path d="M 100 20 A 80 80 0 0 1 180 100" fill="none" stroke="currentColor" strokeWidth="12" className="text-emerald-500/80" strokeLinecap="round" strokeDasharray="125" strokeDashoffset="0" />
                            <circle cx="100" cy="100" r="8" fill="#18181b" stroke="#3f3f46" strokeWidth="3" />
                            <g transform={`rotate(${gaugeRotation} 100 100)`} className="transition-transform duration-1000 ease-[cubic-bezier(0.34,1.56,0.64,1)]">
                               <line x1="100" y1="100" x2="100" y2="25" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" className="drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
                               <polygon points="96,100 104,100 100,20" fill="#ffffff" />
                            </g>
                          </svg>
                          <div className={`absolute bottom-[-10px] text-2xl font-black tracking-tighter ${
                              inferredDirection === 'BUY' ? 'text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.4)]' :
                              inferredDirection === 'SELL' ? 'text-red-400 drop-shadow-[0_0_15px_rgba(239,68,68,0.4)]' :
                              'text-white/50'
                          }`}>
                            {(activeProb * 100).toFixed(1)}%
                          </div>
                        </div>

                        {isTradeActive ? (
                          <span className={`px-6 py-2.5 text-[10px] font-bold uppercase tracking-widest rounded-full border shadow-lg ${
                              inferredDirection === 'BUY'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-emerald-500/10'
                              : 'bg-red-500/10 text-red-400 border-red-500/30 shadow-red-500/10'
                          }`}>
                              Execute {inferredDirection}
                          </span>
                        ) : (
                          <span className="px-6 py-2.5 bg-black/40 text-white/30 text-[10px] font-bold uppercase tracking-widest rounded-full border border-white/10">
                              Skip Setup
                          </span>
                        )}
                      </div>
                    </div>

                    {activeParams?.aiAnalysis ? (
                      <div className="grid md:grid-cols-2 gap-8">
                        <div className="bg-white/[0.01] border border-white/5 rounded-2xl p-6">
                          <div className="text-[10px] text-white/40 uppercase tracking-widest mb-4 flex items-center justify-between">
                            <span>Previous: {activeParams.aiAnalysis.prev_session}</span>
                            <span className="w-1.5 h-1.5 rounded-full bg-white/20"></span>
                          </div>
                          <p className="text-sm text-white/60 leading-relaxed font-medium">
                            {activeParams.aiAnalysis.evaluation}
                          </p>
                        </div>
                        
                        <div className={`border rounded-2xl p-6 relative overflow-hidden transition-colors duration-1000 ${
                             inferredDirection === 'SELL' ? 'bg-red-500/5 border-red-500/20' : 
                             inferredDirection === 'BUY' ? 'bg-emerald-500/5 border-emerald-500/20' : 
                             'bg-white/5 border-white/10'
                        }`}>
                          <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl pointer-events-none transition-colors duration-1000 ${
                              inferredDirection === 'SELL' ? 'bg-red-500/20' : 
                              inferredDirection === 'BUY' ? 'bg-emerald-500/20' : 
                              'bg-white/10'
                          }`} />
                          <div className={`text-[10px] uppercase tracking-widest mb-4 flex items-center justify-between transition-colors duration-1000 ${
                              inferredDirection === 'SELL' ? 'text-red-400/80' : 
                              inferredDirection === 'BUY' ? 'text-emerald-400/80' : 
                              'text-white/50'
                          }`}>
                            <span>Prediction: {activeParams.aiAnalysis.current_session}</span>
                            <span className="relative flex h-2 w-2">
                              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                                  inferredDirection === 'SELL' ? 'bg-red-400' : 
                                  inferredDirection === 'BUY' ? 'bg-emerald-400' : 'bg-white/50'
                              }`}></span>
                              <span className={`relative inline-flex rounded-full h-2 w-2 ${
                                  inferredDirection === 'SELL' ? 'bg-red-500' : 
                                  inferredDirection === 'BUY' ? 'bg-emerald-500' : 'bg-white/50'
                              }`}></span>
                            </span>
                          </div>
                          <p className={`text-sm leading-relaxed font-medium relative z-10 transition-colors duration-1000 ${
                              inferredDirection === 'SELL' ? 'text-red-300/90' : 
                              inferredDirection === 'BUY' ? 'text-emerald-300/90' : 
                              'text-white/60'
                          }`}>
                            {activeParams.aiAnalysis.prediction}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="p-10 text-center text-xs text-white/30 font-medium uppercase tracking-widest">
                        Processing AI Sentiment...
                      </div>
                    )}
                  </div>
                </div>

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
    </>
  );
}