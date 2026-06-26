import React from 'react';

export default function MarketMonitor({ lastRefresh, mode, activeView }: { lastRefresh: Date | null, mode: string, activeView: string }) {
  const displayTime = lastRefresh || new Date();
  const hour = displayTime.getHours();
  
  const isCrypto = mode?.includes('CRYPTO');
  const sessions = isCrypto ? [ { name: "CRYPTO (24/7)", open: "00", close: "24", isActive: true } ] : [
    { name: "SYD", isActive: hour >= 22 || hour < 7 },
    { name: "TOK", isActive: hour >= 0 && hour < 9 },
    { name: "LON", isActive: hour >= 9 && hour < 17 },
    { name: "NY", isActive: hour >= 14 && hour < 22 },
  ];
  
  if (activeView === 'laboratory') return null;

  return (
    <div className="sticky top-0 z-50 w-full h-10 md:h-12 bg-[#050505]/90 backdrop-blur-xl border-b border-white/10 flex items-center justify-between px-4 lg:px-6 font-mono text-[10px] md:text-xs text-zinc-400 shadow-md">
      
      <div className="flex items-center gap-4 md:gap-6">
        <div className="text-white font-bold tracking-widest text-xs md:text-sm flex items-center gap-1.5">
          {displayTime.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </div>
        
        <div className="flex items-center gap-1.5 md:gap-2 border-l border-white/10 pl-4 md:pl-6">
          <span className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse"></span>
          <span className="uppercase tracking-widest text-emerald-500 font-bold hidden sm:inline">CONNECTED: {mode}</span>
          <span className="uppercase tracking-widest text-emerald-500 font-bold sm:hidden">SYNCED</span>
        </div>
      </div>

      <div className="flex items-center gap-3 md:gap-6">
        {sessions.map((s) => (
           <div key={s.name} className={`flex items-center gap-1 md:gap-1.5 ${s.isActive ? 'text-white font-bold' : 'text-zinc-600'}`}>
             <span className={`w-1.5 h-1.5 rounded-full ${s.isActive ? 'bg-white shadow-[0_0_5px_rgba(255,255,255,0.8)]' : 'bg-transparent border border-zinc-600'}`}></span>
             {s.name}
           </div>
        ))}
      </div>
      
    </div>
  );
}