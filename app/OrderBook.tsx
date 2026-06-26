"use client";

import React, { useState, useEffect, useRef } from 'react';

// --- CUSTOM HOOK PRO TICK FLASHING (Problikávání při změně) ---
function useTickFlash(value: number) {
  const [flash, setFlash] = useState<'none' | 'up' | 'down'>('none');
  const prevValue = useRef(value);

  useEffect(() => {
    if (value > prevValue.current) setFlash('up');
    else if (value < prevValue.current) setFlash('down');
    prevValue.current = value;

    const timer = setTimeout(() => setFlash('none'), 300);
    return () => clearTimeout(timer);
  }, [value]);

  return flash;
}

// --- KOMPONENTA PRO BUŇKU, KTERÁ MĚNÍ BARVU ---
const FlashingCell = ({ value, align = 'right', format = '2' }: { value: number, align?: 'left' | 'right' | 'center', format?: '2' | '4' | '0' }) => {
  const flash = useTickFlash(value);
  
  let bgClass = 'bg-transparent text-zinc-300';
  if (flash === 'up') bgClass = 'bg-emerald-500/40 text-emerald-100 transition-none';
  if (flash === 'down') bgClass = 'bg-red-500/40 text-red-100 transition-none';

  // Návrat do normálu s plynulým fade-out efektem
  const baseClass = flash === 'none' ? 'transition-colors duration-500' : '';

  const displayValue = format === '2' ? value.toFixed(2) : format === '4' ? value.toFixed(4) : value.toFixed(0);

  return (
    <div className={`px-1 py-0.5 rounded-sm ${bgClass} ${baseClass} w-full text-${align}`}>
      {displayValue}
    </div>
  );
};

export default function OrderBook({ symbol, livePrice }: { symbol: string, livePrice: number }) {
  // Simulace dat pro Order Book
  const [asks, setAsks] = useState<any[]>([]);
  const [bids, setBids] = useState<any[]>([]);
  const [currentPrice, setCurrentPrice] = useState(livePrice || 1.0850);
  const flashPrice = useTickFlash(currentPrice);

  // Generátor simulovaných tick dat
  useEffect(() => {
    const base = livePrice || 1.0850;
    
    const generateDOM = (startPrice: number, isAsk: boolean) => {
      let total = 0;
      return Array.from({ length: 7 }).map((_, i) => {
        const price = isAsk ? startPrice + (i * 0.0005) : startPrice - (i * 0.0005);
        const amount = Math.random() * 50 + 10;
        total += amount;
        return { price, amount, total, depth: Math.min((total / 400) * 100, 100) };
      }).reverse(); // Asks potřebujeme otočit, aby nejnižší cena byla dole
    };

    const interval = setInterval(() => {
      const volatility = (Math.random() - 0.5) * 0.0010;
      const newPrice = base + volatility;
      setCurrentPrice(newPrice);
      
      setAsks(generateDOM(newPrice + 0.0002, true));
      setBids(generateDOM(newPrice - 0.0002, false).reverse()); // Bids od nejvyšší po nejnižší
    }, 1500);

    return () => clearInterval(interval);
  }, [livePrice]);

  return (
    <div className="w-full bg-black/40 border border-white/5 rounded-2xl flex flex-col font-mono text-[10px] lg:text-xs overflow-hidden shadow-inner">
      {/* Hlavička */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/5 bg-white/[0.02] text-zinc-500 font-bold tracking-widest uppercase">
        <div className="w-1/3 text-left">Price</div>
        <div className="w-1/3 text-right">Amount</div>
        <div className="w-1/3 text-right">Total</div>
      </div>

      {/* ASKS (Červená část) */}
      <div className="flex flex-col py-1 relative">
        {asks.map((ask, i) => (
          <div key={`ask-${i}`} className="flex items-center justify-between px-4 py-1.5 relative group cursor-crosshair hover:bg-white/5">
            <div className="absolute right-0 top-0 h-full bg-red-500/10 transition-all duration-300" style={{ width: `${ask.depth}%` }} />
            <div className="w-1/3 text-left text-red-400 font-bold z-10 relative"><FlashingCell value={ask.price} format="4" align="left" /></div>
            <div className="w-1/3 text-right text-zinc-300 z-10 relative"><FlashingCell value={ask.amount} format="2" /></div>
            <div className="w-1/3 text-right text-zinc-500 z-10 relative">{ask.total.toFixed(2)}</div>
          </div>
        ))}
      </div>

      {/* MIDDLE - CURRENT PRICE */}
      <div className="px-4 py-2 border-y border-white/5 bg-zinc-950 flex items-center justify-between shadow-[0_0_15px_rgba(0,0,0,0.5)] z-20">
        <div className={`text-lg font-black tracking-tighter flex items-center gap-2 transition-colors duration-300 ${flashPrice === 'up' ? 'text-emerald-400' : flashPrice === 'down' ? 'text-red-400' : 'text-white'}`}>
          {currentPrice.toFixed(5)}
          {flashPrice === 'up' && <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>}
          {flashPrice === 'down' && <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>}
        </div>
        <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest bg-white/5 px-2 py-1 rounded">Mark Price</div>
      </div>

      {/* BIDS (Zelená část) */}
      <div className="flex flex-col py-1 relative">
        {bids.map((bid, i) => (
          <div key={`bid-${i}`} className="flex items-center justify-between px-4 py-1.5 relative group cursor-crosshair hover:bg-white/5">
            <div className="absolute right-0 top-0 h-full bg-emerald-500/10 transition-all duration-300" style={{ width: `${bid.depth}%` }} />
            <div className="w-1/3 text-left text-emerald-400 font-bold z-10 relative"><FlashingCell value={bid.price} format="4" align="left" /></div>
            <div className="w-1/3 text-right text-zinc-300 z-10 relative"><FlashingCell value={bid.amount} format="2" /></div>
            <div className="w-1/3 text-right text-zinc-500 z-10 relative">{bid.total.toFixed(2)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}