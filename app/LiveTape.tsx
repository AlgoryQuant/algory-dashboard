"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Trade {
  id: string;
  time: string;
  price: number;
  size: number;
  type: 'buy' | 'sell';
}

export default function LiveTape({ symbol, livePrice }: { symbol: string, livePrice: number }) {
  const [trades, setTrades] = useState<Trade[]>([]);

  useEffect(() => {
    const base = livePrice || 1.0850;
    
    // Generování startovních dat, aby páska nebyla zpočátku prázdná
    const initial = Array.from({length: 15}).map((_, i) => ({
      id: `init-${i}`,
      time: new Date(Date.now() - i * 1000).toLocaleTimeString('en-US', { hour12: false }),
      price: base + (Math.random() - 0.5) * 0.0010,
      size: Math.floor(Math.random() * 50) + 1,
      type: Math.random() > 0.5 ? 'buy' : 'sell'
    }));
    setTrades(initial as Trade[]);

    // Průběžné přidávání nových obchodů
    const interval = setInterval(() => {
      const newTrade: Trade = {
        id: `trade-${Date.now()}`,
        time: new Date().toLocaleTimeString('en-US', { hour12: false }),
        price: base + (Math.random() - 0.5) * 0.0010,
        size: Math.floor(Math.random() * 100) + 1,
        type: Math.random() > 0.5 ? 'buy' : 'sell'
      };
      setTrades(prev => [newTrade, ...prev].slice(0, 50)); // Udržujeme max 50 řádků v paměti
    }, 600 + Math.random() * 800);

    return () => clearInterval(interval);
  }, [livePrice]);

  return (
    <div className="w-full bg-black/40 border border-white/5 rounded-2xl flex flex-col font-mono text-[10px] lg:text-xs overflow-hidden shadow-inner h-full">
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/5 bg-white/[0.02] text-zinc-500 font-bold tracking-widest uppercase">
        <div className="w-1/3 text-left">Time</div>
        <div className="w-1/3 text-center">Price</div>
        <div className="w-1/3 text-right">Size</div>
      </div>
      <div className="flex flex-col relative flex-1 overflow-hidden min-h-[300px]"> 
        <AnimatePresence initial={false}>
          {trades.map((trade) => (
            <motion.div 
              key={trade.id}
              initial={{ opacity: 0, y: -15, backgroundColor: trade.type === 'buy' ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)' }}
              animate={{ opacity: 1, y: 0, backgroundColor: 'transparent' }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="flex items-center justify-between px-4 py-1.5 border-b border-white/[0.02] hover:bg-white/5"
            >
              <div className="w-1/3 text-left text-zinc-500">{trade.time}</div>
              <div className={`w-1/3 text-center font-bold ${trade.type === 'buy' ? 'text-emerald-400' : 'text-red-400'}`}>
                {trade.price.toFixed(5)}
              </div>
              <div className="w-1/3 text-right text-zinc-300">{trade.size}</div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}