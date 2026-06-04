"use client";

import React from 'react';
import { motion } from 'framer-motion';

export interface ChartAreaProps {
  symbol: string;
  isArb?: boolean;
  mode: string | null;
}

// Obalení komponenty do React.memo() pro absolutní ochranu před re-rendery z pollingu
const ChartArea = React.memo(function ChartArea({ symbol, isArb, mode }: ChartAreaProps) {
  const getTVSymbol = (s: string) => {
    if (isArb) {
      const parts = s.split('/');
      return `${parts[0]}USDT`;
    }
    if (mode === 'CRYPTO' || ['BTCUSD', 'ETHUSD', 'SOLUSD', 'XRPUSD', 'ADAUSD', 'DOGEUSD', 'BNBUSD'].includes(s)) {
      return s;
    }
    if (s === 'GOLD' || s === 'XAUUSD') return 'OANDA:XAUUSD';
    if (s === 'SILVER' || s === 'XAGUSD') return 'OANDA:XAGUSD';
    return `OANDA:${s}`;
  };

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="w-full bg-zinc-950/50 backdrop-blur-xl border border-white/10 rounded-[2rem] overflow-hidden shadow-2xl h-[450px] relative transition-all duration-300 flex-shrink-0 z-10"
    >
      <div className="absolute top-0 left-0 w-full px-6 py-4 bg-white/[0.02] border-b border-white/5 flex items-center justify-between z-10 pointer-events-none backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shadow-inner">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" /></svg>
          </div>
          <h3 className="font-bold tracking-widest text-white uppercase text-[10px] drop-shadow-md">
            {isArb ? `STATISTICAL ARBITRAGE SPREAD: ${symbol}` : `LIVE MARKET STRUCTURE: ${symbol}`}
          </h3>
        </div>
        <span className="px-3 py-1.5 bg-black/60 text-white/80 text-[9px] font-bold uppercase tracking-widest rounded-md border border-white/10 shadow-inner">
          M15 TIMEFRAME
        </span>
      </div>
      <div className="w-full h-full pt-[73px]">
        <iframe 
          // Zde je zafixovaný parametr interval=15 a symboledit=0 bránící přepisu
          src={`https://s.tradingview.com/widgetembed/?frameElementId=tradingview_1&symbol=${encodeURIComponent(getTVSymbol(symbol))}&interval=15&hidesidetoolbar=1&symboledit=0&saveimage=0&toolbarbg=050505&studies=%5B%5D&theme=dark&style=1&timezone=Etc%2FUTC&studies_overrides=%7B%7D&overrides=%7B%7D&enabled_features=%5B%5D&disabled_features=%5B%5D&locale=en`} 
          style={{ width: '100%', height: '100%', border: 'none' }} 
          title={`Chart ${symbol}`} 
        />
      </div>
    </motion.div>
  );
});

export default ChartArea;