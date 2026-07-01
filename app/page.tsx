"use client";

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useAuth } from '@clerk/nextjs';

export default function LandingPage() {
  const { isLoaded, userId } = useAuth();

  return (
    <div className="min-h-[100dvh] w-full bg-[#000000] text-zinc-200 selection:bg-zinc-800 font-sans overflow-x-hidden scroll-smooth">
      
      {/* GLOBAL HEADER */}
      <header className="fixed top-0 left-0 w-full p-6 lg:px-12 lg:py-6 flex justify-between items-center z-[100] bg-[#000000]/50 backdrop-blur-md border-b border-white/5">
        <div className="text-xl font-black tracking-tighter text-white">Algory<span className="text-zinc-600">.</span></div>
        <div className="flex items-center gap-4">
          {isLoaded && !userId && (
            <Link href="/sign-in">
              <button className="text-[10px] lg:text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-white transition-colors">
                Sign In
              </button>
            </Link>
          )}
          {isLoaded && userId && (
            <Link href="/terminal">
              <button className="text-[10px] lg:text-xs font-bold uppercase tracking-widest text-emerald-400 hover:text-emerald-300 transition-colors">
                Active Session
              </button>
            </Link>
          )}
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative w-full min-h-[90vh] flex flex-col items-center justify-center pt-20 px-6 z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900/40 via-[#000000] to-[#000000] z-0 pointer-events-none" />
        
        <motion.div 
          initial={{ opacity: 0, y: 30 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 flex flex-col items-center text-center max-w-4xl w-full"
        >
          <span className="px-3 py-1 mb-8 rounded-full border border-white/10 bg-white/5 text-[10px] uppercase tracking-widest text-zinc-400 font-medium backdrop-blur-sm">
            Quantitative Execution Engine
          </span>
          
          <h1 className="text-6xl md:text-7xl lg:text-8xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-zinc-600 mb-6 leading-[1.1]">
            Institutional Grade.<br />Retail Access.
          </h1>
          
          <p className="text-sm md:text-base lg:text-lg text-zinc-400 font-light tracking-wide max-w-2xl leading-relaxed mb-12">
            Advanced real-time market topology, multi-exchange spatial arbitrage matrices, and Python-driven backtesting environment. Execute with absolute precision.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 w-full sm:w-auto">
            {isLoaded && !userId && (
              <Link href="/sign-up" className="w-full sm:w-auto">
                <button className="w-full sm:w-auto px-8 py-4 bg-white text-black rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-zinc-200 transition-all shadow-[0_0_30px_rgba(255,255,255,0.15)] hover:shadow-[0_0_40px_rgba(255,255,255,0.25)]">
                  Get Started
                </button>
              </Link>
            )}
            {isLoaded && userId && (
              <Link href="/terminal" className="w-full sm:w-auto">
                <button className="w-full px-8 py-4 bg-white text-black rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-zinc-200 transition-all shadow-[0_0_30px_rgba(255,255,255,0.15)] hover:shadow-[0_0_40px_rgba(255,255,255,0.25)]">
                  Enter Terminal
                </button>
              </Link>
            )}
            
            <a href="#features" className="w-full sm:w-auto px-8 py-4 bg-transparent border border-white/10 rounded-lg text-xs font-bold uppercase tracking-widest text-white hover:bg-white/5 transition-all text-center">
              View Features
            </a>
          </div>
        </motion.div>
      </section>

      {/* BENTO GRID SHOWCASE */}
      <section id="features" className="w-full max-w-6xl mx-auto px-6 py-24 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-white mb-4">Architected for Alpha.</h2>
          <p className="text-zinc-500 text-sm tracking-wide">Explore the core infrastructure powering the terminal.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[300px]">
          
          {/* BENTO BOX 1: OrderBook / Live Tape */}
          <div className="md:col-span-2 md:row-span-2 bg-[#050505] border border-white/10 rounded-3xl p-8 flex flex-col relative overflow-hidden group hover:border-white/20 transition-colors">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative z-10 flex flex-col h-full">
              <div className="mb-6">
                <h3 className="text-lg font-bold text-white tracking-tight">Depth of Market & Tape</h3>
                <p className="text-xs text-zinc-500 mt-1 max-w-sm">Microsecond precision orderflow mapping and liquidity stream visualization.</p>
              </div>
              <div className="flex-1 w-full bg-[#0a0a0a] border border-white/5 rounded-xl p-4 overflow-hidden font-mono text-[9px] sm:text-[10px] text-zinc-400 select-none shadow-inner">
                <div className="flex justify-between border-b border-white/5 pb-2 mb-2 text-zinc-600 font-bold">
                  <span>PRICE</span><span>AMOUNT</span><span>TOTAL</span>
                </div>
                {[
                  { p: "58659.9728", a: "54.15", t: "314.81", color: "text-red-400" },
                  { p: "58659.9723", a: "42.90", t: "260.66", color: "text-red-400" },
                  { p: "58659.9718", a: "52.35", t: "217.77", color: "text-red-400" },
                  { p: "58659.9713", a: "54.48", t: "165.41", color: "text-red-400" },
                  { p: "58659.9698", a: "50.03", t: "50.03", color: "text-emerald-400", mt: true },
                  { p: "58659.9693", a: "18.22", t: "68.25", color: "text-emerald-400" },
                  { p: "58659.9688", a: "41.10", t: "109.35", color: "text-emerald-400" },
                ].map((row, i) => (
                  <div key={i} className={`flex justify-between py-1 hover:bg-white/5 transition-colors ${row.mt ? 'mt-3 pt-3 border-t border-white/5' : ''}`}>
                    <span className={`font-bold ${row.color}`}>{row.p}</span>
                    <span>{row.a}</span>
                    <span>{row.t}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* BENTO BOX 2: Imbalance Bar */}
          <div className="md:col-span-1 md:row-span-2 bg-[#050505] border border-white/10 rounded-3xl p-8 flex flex-col relative overflow-hidden group hover:border-white/20 transition-colors">
            <div className="absolute inset-0 bg-gradient-to-bl from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative z-10 flex flex-col h-full">
              <div className="mb-6">
                <h3 className="text-lg font-bold text-white tracking-tight">Imbalance Matrices</h3>
                <p className="text-xs text-zinc-500 mt-1">Real-time buyer/seller dominance indexing.</p>
              </div>
              <div className="flex-1 w-full flex flex-col items-center justify-center gap-6">
                <div className="text-center font-mono font-bold text-emerald-400 text-xs tracking-widest">
                  62.2% BUYER DOMINANCE
                </div>
                <div className="w-full h-3 bg-zinc-900 rounded-full overflow-hidden flex shadow-inner">
                  <div className="h-full bg-red-500 w-[37.8%]"></div>
                  <div className="h-full bg-emerald-500 w-[62.2%] shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                </div>
                <div className="w-full space-y-3 mt-4">
                  <div className="flex justify-between items-center text-[10px] uppercase font-bold text-zinc-500">
                    <span>Active Trend</span>
                    <span className="text-emerald-400">BULLISH</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] uppercase font-bold text-zinc-500">
                    <span>Vol. Delta</span>
                    <span className="text-white">+24.4K</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* BENTO BOX 3: Python Lab */}
          <div className="md:col-span-3 md:row-span-1 bg-[#050505] border border-white/10 rounded-3xl p-8 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden group hover:border-white/20 transition-colors">
            <div className="absolute inset-0 bg-gradient-to-t from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative z-10 w-full md:w-1/3">
              <h3 className="text-lg font-bold text-white tracking-tight">AI Quant Laboratory</h3>
              <p className="text-xs text-zinc-500 mt-2 leading-relaxed">
                Develop, backtest, and deploy algorithmic models directly in the browser. Powered by historical tick data integration and strict evaluation metrics.
              </p>
            </div>
            <div className="relative z-10 w-full md:w-2/3 bg-[#0a0a0a] border border-white/5 rounded-xl p-4 h-full overflow-hidden shadow-inner">
              <div className="flex items-center gap-1.5 mb-3 border-b border-white/5 pb-2">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500/80"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></div>
                <span className="ml-2 text-[9px] font-mono text-zinc-600">strategy_engine.py</span>
              </div>
              <pre className="font-mono text-[10px] text-zinc-300 leading-relaxed overflow-x-hidden">
                <span className="text-purple-400">def</span> <span className="text-blue-400">calculate_arbitrage_spread</span>(data, pair):<br/>
                &nbsp;&nbsp;&nbsp;&nbsp;ask = data[<span className="text-emerald-400">'binance'</span>][pair][<span className="text-emerald-400">'ask'</span>]<br/>
                &nbsp;&nbsp;&nbsp;&nbsp;bid = data[<span className="text-emerald-400">'kraken'</span>][pair][<span className="text-emerald-400">'bid'</span>]<br/>
                &nbsp;&nbsp;&nbsp;&nbsp;spread = ((bid - ask) / ask) * <span className="text-orange-400">100</span><br/>
                <br/>
                &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-purple-400">if</span> spread &gt; <span className="text-orange-400">0.15</span>:<br/>
                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-purple-400">return</span> <span className="text-blue-400">ExecuteOrder</span>(side=<span className="text-emerald-400">'BUY'</span>, volume=<span className="text-orange-400">1.5</span>)<br/>
                &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-purple-400">return</span> <span className="text-orange-400">None</span>
              </pre>
            </div>
          </div>

        </div>
      </section>
      
      {/* FOOTER */}
      <footer className="w-full border-t border-white/5 py-8 mt-12 text-center relative z-10 bg-[#000000]">
        <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">
          © 2026 ALGORY SYSTEMS. <br className="sm:hidden"/>ALL RIGHTS RESERVED.
        </div>
      </footer>
    </div>
  );
}