"use client";

import { useState, useEffect } from 'react';

// === INTERFACES ===
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
  sentiment: 'positive' | 'negative' | 'neutral'; // NOVÉ
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
    RRR?: number; // NOVÉ
    aiAnalysis?: AIAnalysis 
  }>;
}

// === KOMPONENTY ===

// 1. Tooltip s ikonou [i]
const InfoTooltip = ({ term, info }: { term: string, info: string }) => (
  <span className="relative group inline-flex items-center cursor-help ml-1">
    <span className="flex items-center justify-center w-3 h-3 text-[8px] border border-white/20 text-white/50 rounded-full hover:bg-white/10 hover:text-white transition-colors">
      i
    </span>
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-zinc-900 border border-white/10 text-white/90 text-xs rounded shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
      <div className="font-bold mb-1">{term}</div>
      {info}
      {/* Malá šipka dolů */}
      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-zinc-900" />
    </div>
  </span>
);

// 2. Kalkulačka Pozice
const PositionCalculator = ({ slPips }: { slPips: number }) => {
  const [balance, setBalance] = useState<number>(10000);
  const [riskPercent, setRiskPercent] = useState<number>(1);
  const [lotSize, setLotSize] = useState<string>("0.00");

  useEffect(() => {
    if (slPips > 0) {
      // Zjednodušený vzorec pro výpočet lotů (předpokládá $10 za pip na 1 standardní lot u EURUSD)
      // V reálu záleží na měně účtu a páru.
      const riskAmount = balance * (riskPercent / 100);
      const pipValueStandardLot = 10; 
      const calculatedLots = riskAmount / (slPips * pipValueStandardLot);
      setLotSize(calculatedLots.toFixed(2));
    } else {
      setLotSize("0.00");
    }
  }, [balance, riskPercent, slPips]);

  return (
    <div className="mt-4 p-4 bg-black/40 rounded-xl border border-white/5">
      <div className="text-xs font-bold text-white/60 uppercase tracking-widest mb-3 flex items-center">
        Position Sizing
        <InfoTooltip term="Position Sizing" info="Calculates trade volume based on account balance, risk percentage, and Stop Loss distance." />
      </div>
      <div className="flex gap-4 items-end">
        <div className="flex flex-col gap-1 w-1/3">
          <label className="text-[10px] text-white/40 uppercase">Balance ($)</label>
          <input 
            type="number" 
            value={balance} 
            onChange={(e) => setBalance(Number(e.target.value))}
            className="bg-white/5 border border-white/10 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-emerald-500/50"
          />
        </div>
        <div className="flex flex-col gap-1 w-1/3">
          <label className="text-[10px] text-white/40 uppercase">Risk (%)</label>
          <input 
            type="number" 
            step="0.1"
            value={riskPercent} 
            onChange={(e) => setRiskPercent(Number(e.target.value))}
            className="bg-white/5 border border-white/10 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-emerald-500/50"
          />
        </div>
        <div className="w-1/3 flex flex-col items-center justify-center p-2 bg-emerald-500/10 border border-emerald-500/20 rounded">
          <span className="text-[10px] text-emerald-400 uppercase tracking-widest font-bold">Volume</span>
          <span className="text-lg font-bold text-white">{lotSize} <span className="text-xs text-white/50">Lots</span></span>
        </div>
      </div>
    </div>
  );
};


const TradingChart = ({ symbol }: { symbol: string }) => {
  const getTVSymbol = (s: string) => {
    if (s === 'GOLD' || s === 'XAUUSD') return 'OANDA:XAUUSD';
    if (s === 'SILVER' || s === 'XAGUSD') return 'OANDA:XAGUSD';
    return `OANDA:${s}`;
  };

  const tvSymbol = getTVSymbol(symbol);

  return (
    <div className="w-full bg-white/[0.02] backdrop-blur-2xl border border-white/[0.05] rounded-[2rem] overflow-hidden shadow-xl h-[450px] relative transition-all duration-300 hover:shadow-white/5">
      <div className="absolute top-0 left-0 w-full px-6 py-4 bg-white/[0.02] border-b border-white/[0.05] flex items-center justify-between z-10 pointer-events-none">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
            </svg>
          </div>
          <h3 className="font-semibold tracking-widest text-white uppercase text-sm">Live Market Structure: {symbol}</h3>
        </div>
        <span className="px-3 py-1 bg-black/40 text-white/80 text-[10px] font-bold uppercase tracking-widest rounded-md border border-white/5">
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
    <div className="mb-10 p-8 bg-white/[0.02] backdrop-blur-3xl border border-white/[0.05] rounded-[2rem] shadow-2xl relative overflow-hidden transition-all duration-300 hover:shadow-white/5">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-8 relative z-10">
        <div className="flex flex-col gap-2 w-full md:w-auto">
          <div className="text-5xl font-semibold tracking-tight text-white">
            {now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })}
            <span className="text-2xl text-white/50 ml-1">:{now.getSeconds().toString().padStart(2, '0')}</span>
          </div>
          <div className="text-xs font-medium text-white/60 uppercase tracking-widest flex items-center gap-3 mt-2">
            <span className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              System Sync
            </span>
            <span className="px-3 py-1 bg-white/5 rounded-full border border-white/10 text-white/80">
              {lastRefresh ? lastRefresh.toLocaleTimeString('en-US', { hour12: false }) : "Connecting..."}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 w-full md:w-auto">
          {sessions.map((s) => (
            <div key={s.name} className={`px-5 py-3 border rounded-2xl flex flex-col items-center justify-center transition-all duration-500 ${
              s.isActive 
                ? 'bg-emerald-500/10 border-emerald-500/30 shadow-[0_0_15px_rgba(52,211,153,0.1)]' 
                : 'bg-black/20 border-white/5 opacity-50'
            }`}>
              <span className={`text-xs font-bold uppercase tracking-widest mb-1 ${s.isActive ? 'text-emerald-400' : 'text-white/60'}`}>
                {s.name}
              </span>
              <span className="text-[10px] text-white/40 font-medium">{s.open} - {s.close}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 relative z-10">
        <div className="flex justify-between text-[10px] text-white/60 font-medium mb-3 uppercase tracking-widest">
          <span>AI Engine M15 Cycle</span>
          <span>{15 - (minutes % 15)}m {(60 - seconds) % 60}s remaining</span>
        </div>
        <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden border border-white/10">
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
      setEmailError("Please enter a valid email address.");
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

  const toggleGroup = (title: string) => {
    setOpenGroups(prev => ({ ...prev, [title]: !prev[title] }));
  };

  const getPublisherStyle = (publisher: string) => {
    const pub = publisher.toUpperCase();
    if (pub === 'FXSTREET') return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
    if (pub === 'INVESTING') return 'text-orange-400 bg-orange-500/10 border-orange-500/20';
    return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
  };

  // Helper pro barvu zprávy podle sentimentu
  const getSentimentDotColor = (sentiment?: string) => {
    if (sentiment === 'positive') return 'bg-emerald-500';
    if (sentiment === 'negative') return 'bg-red-500';
    return 'bg-zinc-500';
  };

  const renderSidebarGroup = (title: string, pairs: Record<string, number> | undefined) => {
    if (!pairs || Object.keys(pairs).length === 0) return null;
    const sortedPairs = Object.entries(pairs).sort((a, b) => b[1] - a[1]);
    const isOpen = openGroups[title]; 

    return (
      <div className="mb-4">
        <button 
          onClick={() => toggleGroup(title)}
          className="w-full flex items-center justify-between px-6 py-2 mb-2 cursor-pointer group outline-none"
        >
          <span className="text-[10px] font-bold text-white/50 group-hover:text-white/80 uppercase tracking-widest transition-colors">
            {title}
          </span>
          <svg 
            className={`w-3 h-3 text-white/40 group-hover:text-white/80 transition-transform duration-300 ${isOpen ? 'rotate-180' : 'rotate-0'}`} 
            fill="none" viewBox="0 0 24 24" stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        <div className={`space-y-1 px-3 overflow-hidden transition-all duration-500 ease-in-out ${isOpen ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}>
          {sortedPairs.map(([ticker, prob]) => {
            const isActive = activePair === ticker;
            const displayTicker = ticker === "XAUUSD" ? "GOLD" : ticker;
            
            let pairDir = "NEUTRAL";
            if (prob >= 0.52) pairDir = "BUY";
            else if (prob <= 0.48 && prob > 0) pairDir = "SELL";

            let probColor = "text-white/40";
            if (pairDir === "BUY") probColor = isActive ? "text-emerald-400" : "text-emerald-500/80";
            if (pairDir === "SELL") probColor = isActive ? "text-red-400" : "text-red-500/80";

            return (
              <button
                key={ticker}
                onClick={() => setActivePair(ticker)}
                className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-300 flex justify-between items-center group ${
                  isActive 
                    ? pairDir === 'SELL' 
                        ? 'bg-red-500/15 border border-red-500/30 shadow-[0_0_10px_rgba(239,68,68,0.1)]' 
                        : 'bg-emerald-500/15 border border-emerald-500/30 shadow-[0_0_10px_rgba(52,211,153,0.1)]'
                    : 'border border-transparent hover:bg-white/5'
                }`}
              >
                <span className={`font-semibold tracking-wide ${isActive ? 'text-white' : 'text-white/70 group-hover:text-white'}`}>
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
          <p className="mt-8 text-zinc-400 text-sm md:text-lg tracking-[0.2em] uppercase max-w-xl leading-relaxed">Institutional Grade <br/> <span className="text-white/90 font-bold">Quantitative Trading Engine</span></p>
          <button onClick={handleLaunch} className="mt-16 px-10 py-5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-full font-bold text-sm tracking-widest uppercase transition-all duration-300 shadow-[0_0_30px_rgba(52,211,153,0.15)] hover:bg-emerald-500/20 hover:shadow-[0_0_40px_rgba(52,211,153,0.25)] hover:-translate-y-1">Launch Terminal</button>
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
            <label className="text-[10px] text-zinc-300 font-medium uppercase tracking-widest ml-1">Trader Nickname</label>
            <input type="text" required value={nickname} onChange={(e) => setNickname(e.target.value)} className="w-full bg-black/50 border border-white/20 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500/50 transition-colors" placeholder="e.g. AlgoMaster99" />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-[10px] text-zinc-300 font-medium uppercase tracking-widest ml-1">Email Address</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={`w-full bg-black/50 border ${emailError ? 'border-red-500/50' : 'border-white/20'} rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500/50 transition-colors`} placeholder="name@domain.com" />
            {emailError && <span className="text-[10px] text-red-400 font-medium ml-1">{emailError}</span>}
          </div>
          <button type="submit" disabled={isSubmitting} className="mt-4 w-full py-4 bg-emerald-500 text-black font-bold text-xs tracking-widest uppercase rounded-xl transition-all hover:bg-emerald-400 hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50">{isSubmitting ? "Connecting..." : "Enter Terminal"}</button>
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

  const needleColor = inferredDirection === 'BUY' ? '#34d399' : inferredDirection === 'SELL' ? '#f87171' : '#a1a1aa';

  const getPageBackground = () => {
    if (inferredDirection === 'BUY') return 'from-emerald-950/20 via-[#0a0a0a] to-[#050505]';
    if (inferredDirection === 'SELL') return 'from-red-950/20 via-[#0a0a0a] to-[#050505]';
    return 'from-[#050505] via-[#0a0a0a] to-[#050505]';
  };
  
  const getGlowColor = () => {
    if (inferredDirection === 'BUY') return 'shadow-[0_0_60px_rgba(16,185,129,0.1)]';
    if (inferredDirection === 'SELL') return 'shadow-[0_0_60px_rgba(239,68,68,0.1)]';
    return 'shadow-xl';
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.15); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.3); }
      `}} />

      <div className="flex h-screen bg-[#050505] text-zinc-200 selection:bg-emerald-500/30 overflow-hidden font-sans animate-in fade-in duration-700">
        
        <aside className="w-80 flex-shrink-0 border-r border-white/10 bg-[#050505] flex flex-col h-full z-20 hidden md:flex">
          <div className="p-8 pb-6 cursor-pointer border-b border-white/5 mb-4" onClick={() => setShowLanding(true)}>
            <h2 className="text-3xl font-semibold tracking-tighter text-white hover:opacity-80 transition-opacity">
              Algory<span className="text-emerald-500">.</span>
            </h2>
            <div className="flex items-center gap-3 mt-4">
              <span className="relative flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${inferredDirection === 'SELL' ? 'bg-red-400' : 'bg-emerald-400'}`}></span>
                <span className={`relative inline-flex rounded-full h-2 w-2 ${inferredDirection === 'SELL' ? 'bg-red-500' : 'bg-emerald-500'}`}></span>
              </span>
              <p className="text-[10px] text-white/60 font-medium tracking-widest uppercase">Engine Online</p>
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto pb-10 custom-scrollbar pr-1">
            {renderSidebarGroup('Major Liquidity', data.majors)}
            {renderSidebarGroup('Cross Pairs', data.minors)}
            {renderSidebarGroup('Precious Metals', data.metals)}
          </nav>
        </aside>

        <main className={`flex-1 overflow-y-auto custom-scrollbar px-6 pt-12 pb-24 lg:px-12 lg:pt-20 scroll-smooth transition-colors duration-1000 ease-in-out bg-gradient-to-br ${getPageBackground()}`}>
          <div className="max-w-[1400px] mx-auto">
            
            <MarketMonitor lastRefresh={lastRefresh} />

            {loading && !data.majors ? (
              <div className="p-20 mt-10 text-center flex flex-col items-center justify-center gap-6 border border-white/10 rounded-[2rem] bg-white/[0.02]">
                <div className="w-10 h-10 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin"></div>
                <span className="text-sm text-white/70 font-medium tracking-widest uppercase">Connecting to Cloud Engine...</span>
              </div>
            ) : error && !data.majors ? (
              <div className="p-10 mt-10 text-center text-red-400 font-medium border border-red-900/40 bg-red-950/20 rounded-[2rem]">
                {error}
              </div>
            ) : (
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-10 mt-10">
                
                <div className="xl:col-span-2 flex flex-col space-y-10">
                  
                  <TradingChart symbol={activePair} />
                  
                  {/* PŘEDĚLANÁ KARTA PREDIKCE S DYNAMICKÝMI BARVAMI */}
                  <div className={`bg-white/[0.02] backdrop-blur-2xl border ${inferredDirection === 'SELL' ? 'border-red-500/20' : inferredDirection === 'BUY' ? 'border-emerald-500/20' : 'border-white/10'} rounded-[2rem] overflow-hidden p-8 transition-all duration-700 ${getGlowColor()}`}>
                    
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-6 border-b border-white/[0.05] pb-8">
                      <div className="w-full">
                        <div className="flex items-center gap-4 mb-3">
                          <h2 className="text-3xl font-bold text-white">{displayTicker}</h2>
                          
                          {isTradeActive && (
                            <span className={`px-4 py-1.5 text-[11px] font-bold uppercase tracking-widest rounded-lg border shadow-lg ${
                              inferredDirection === 'BUY' 
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-emerald-500/20' 
                                : 'bg-red-500/20 text-red-300 border-red-500/40 shadow-red-500/20'
                            }`}>
                              {inferredDirection} PENDING
                            </span>
                          )}

                          {activeParams?.KeyDriver && (
                            <span className="px-3 py-1 bg-white/10 text-white/90 text-[10px] uppercase tracking-widest rounded-lg border border-white/20 font-medium flex items-center">
                              {activeParams.KeyDriver}
                              <InfoTooltip term="Key Driver" info="The primary market catalyst currently affecting this asset's structure." />
                            </span>
                          )}
                        </div>
                        
                        {activeParams && (
                          <div className="flex flex-wrap items-center gap-2 mt-4">
                            <span className="px-3 py-1.5 bg-black/60 text-white/80 text-[11px] rounded-md border border-white/10 font-mono">SL: {activeParams.SL}</span>
                            <span className="px-3 py-1.5 bg-black/60 text-white/80 text-[11px] rounded-md border border-white/10 font-mono">TP: {activeParams.TP === 9999 ? 'OPEN' : activeParams.TP}</span>
                            
                            {/* NOVÉ: RRR Štítek */}
                            {activeParams.RRR && (
                              <span className="px-3 py-1.5 bg-blue-500/10 text-blue-300 text-[11px] font-bold rounded-md border border-blue-500/30">
                                RRR 1:{activeParams.RRR}
                              </span>
                            )}

                            <span className="px-3 py-1.5 bg-black/60 text-white/80 text-[11px] rounded-md border border-white/10 font-mono">BE: {activeParams.BE}</span>
                            <span className="px-3 py-1.5 bg-black/60 text-white text-[11px] rounded-md border border-white/20 font-mono">Spread: {activeParams.LiveSpread !== "N/A" ? activeParams.LiveSpread : activeParams.MaxSpread}</span>
                          </div>
                        )}
                        
                        {/* NOVÉ: Kalkulačka pozice vložená pod parametry */}
                        {activeParams && <PositionCalculator slPips={activeParams.SL} />}

                      </div>

                      <div className="flex flex-col items-center gap-4 flex-shrink-0">
                        <div className="flex flex-col items-center justify-center relative w-56 h-28 mt-2">
                          <svg viewBox="0 0 200 120" className="w-full h-full drop-shadow-2xl overflow-visible">
                            <defs>
                              <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                                <feGaussianBlur stdDeviation="3" result="blur" />
                                <feComposite in="SourceGraphic" in2="blur" operator="over" />
                              </filter>
                            </defs>
                            <path d="M 30 100 A 70 70 0 0 1 100 30" fill="none" stroke="#ef4444" strokeWidth="6" strokeLinecap="round" strokeOpacity="0.8" />
                            <path d="M 100 30 A 70 70 0 0 1 170 100" fill="none" stroke="#10b981" strokeWidth="6" strokeLinecap="round" strokeOpacity="0.8" />
                            
                            {[...Array(11)].map((_, i) => {
                                const angle = -90 + (i * 18);
                                const isMain = i === 0 || i === 5 || i === 10;
                                const tickColor = i < 5 ? "#ef4444" : i > 5 ? "#10b981" : "#a1a1aa";
                                return (
                                    <line key={i} x1="100" y1={isMain ? "25" : "30"} x2="100" y2="38" stroke={tickColor} strokeWidth={isMain ? "2" : "1"} strokeOpacity="0.6" style={{ transform: `rotate(${angle}deg)`, transformOrigin: '100px 100px' }} />
                                );
                            })}
                            <text x="25" y="115" fontSize="8" fill="#f87171" fontWeight="bold" textAnchor="middle" letterSpacing="1">SELL</text>
                            <text x="175" y="115" fontSize="8" fill="#34d399" fontWeight="bold" textAnchor="middle" letterSpacing="1">BUY</text>

                            <g style={{ transform: `rotate(${gaugeRotation}deg)`, transformOrigin: '100px 100px' }} className="transition-transform duration-[1500ms] ease-[cubic-bezier(0.34,1.56,0.64,1)]">
                               <line x1="100" y1="100" x2="100" y2="35" stroke={needleColor} strokeWidth="3" strokeLinecap="round" filter="url(#glow)" strokeOpacity="0.8" />
                               <polygon points="97,100 103,100 100,28" fill="#ffffff" />
                               <circle cx="100" cy="100" r="6" fill="#050505" stroke={needleColor} strokeWidth="2.5" />
                            </g>
                          </svg>
                          
                          <div className={`absolute bottom-[-5px] text-2xl font-black tracking-tighter ${
                              inferredDirection === 'BUY' ? 'text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.4)]' :
                              inferredDirection === 'SELL' ? 'text-red-400 drop-shadow-[0_0_15px_rgba(239,68,68,0.4)]' :
                              'text-white/70'
                          }`}>
                            {(activeProb * 100).toFixed(1)}%
                          </div>
                        </div>

                        {/* NOVÉ: Ochrana před vstupem (Disabled tlačítko) */}
                        {isTradeActive ? (
                          <button className={`w-full px-6 py-3 text-[10px] font-bold uppercase tracking-widest rounded-xl border shadow-lg transition-all hover:-translate-y-1 ${
                              inferredDirection === 'BUY'
                              ? 'bg-emerald-500 hover:bg-emerald-400 text-black border-emerald-400 shadow-[0_5px_20px_rgba(16,185,129,0.3)]'
                              : 'bg-red-500 hover:bg-red-400 text-white border-red-400 shadow-[0_5px_20px_rgba(239,68,68,0.3)]'
                          }`}>
                              Execute {inferredDirection}
                          </button>
                        ) : (
                          <button disabled className="w-full px-6 py-3 bg-zinc-800 text-zinc-500 text-[10px] font-bold uppercase tracking-widest rounded-xl border border-zinc-700 cursor-not-allowed">
                              Low Conviction
                          </button>
                        )}
                      </div>
                    </div>

                    {/* VYSVĚTLIVKY AI S DYNAMICKOU BARVOU PŘEDCHOZÍ KARTY */}
                    {activeParams?.aiAnalysis ? (
                      <div className="grid md:grid-cols-2 gap-8">
                        <div className="bg-black/30 border border-white/10 rounded-2xl p-6 transition-all hover:bg-black/50">
                          <div className="text-[10px] text-white/60 uppercase tracking-widest mb-4 flex items-center justify-between">
                            <span className="flex items-center">
                              Previous: {activeParams.aiAnalysis.prev_session}
                              {activeParams.aiAnalysis.prev_session.includes("Asian") && 
                                <InfoTooltip term="Asian Range" info="The consolidation period typically occurring during the Tokyo/Sydney trading hours." />
                              }
                            </span>
                            <span className="w-1.5 h-1.5 rounded-full bg-white/40"></span>
                          </div>
                          <p className="text-sm text-white/80 leading-relaxed font-medium">
                            {activeParams.aiAnalysis.evaluation}
                          </p>
                        </div>
                        
                        <div className={`border rounded-2xl p-6 relative overflow-hidden transition-all duration-1000 ${
                             inferredDirection === 'SELL' ? 'bg-red-950/40 border-red-500/30' : 
                             inferredDirection === 'BUY' ? 'bg-emerald-950/40 border-emerald-500/30' : 
                             'bg-black/30 border-white/10'
                        }`}>
                          <div className={`text-[10px] uppercase tracking-widest mb-4 flex items-center justify-between transition-colors duration-1000 ${
                              inferredDirection === 'SELL' ? 'text-red-300' : 
                              inferredDirection === 'BUY' ? 'text-emerald-300' : 
                              'text-white/60'
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
                              inferredDirection === 'SELL' ? 'text-white' : 
                              inferredDirection === 'BUY' ? 'text-white' : 
                              'text-white/80'
                          }`}>
                            {activeParams.aiAnalysis.prediction}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="p-10 text-center text-xs text-white/50 font-medium uppercase tracking-widest">
                        Processing AI Sentiment...
                      </div>
                    )}
                  </div>
                </div>

                <div className="xl:col-span-1">
                  <div className="bg-white/[0.02] backdrop-blur-2xl border border-white/[0.05] rounded-[2rem] overflow-hidden sticky top-8 shadow-xl transition-all duration-300 hover:shadow-white/5">
                    <div className="px-6 py-5 border-b border-white/[0.05] flex items-center justify-between bg-white/[0.01]">
                      <div className="font-semibold tracking-widest text-white uppercase text-sm">Live Market News</div>
                    </div>
                    
                    <div className="flex flex-col p-2">
                      {data.news && data.news.length > 0 ? (
                        data.news.map((item, idx) => (
                          <a key={idx} href={item.link} target="_blank" rel="noreferrer" className="p-4 m-1 rounded-2xl hover:bg-white/5 transition-all group border border-transparent hover:border-white/10">
                            <div className="flex items-center gap-3 mb-3">
                              {/* NOVÉ: Indikátor sentimentu zprávy */}
                              <div className={`w-2 h-2 rounded-full ${getSentimentDotColor(item.sentiment)} shadow-sm`} title={`Sentiment: ${item.sentiment}`} />
                              <span className="text-[9px] text-white/60 font-medium bg-black/60 px-2 py-1 rounded-md border border-white/10">
                                {item.time}
                              </span>
                              <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-md border ${getPublisherStyle(item.publisher)}`}>
                                {item.publisher}
                              </span>
                            </div>
                            <h4 className="text-sm font-medium text-white/80 leading-relaxed group-hover:text-white transition-colors">
                              {item.title}
                            </h4>
                          </a>
                        ))
                      ) : (
                        <div className="p-10 text-center text-xs text-white/50 font-medium uppercase tracking-widest">
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