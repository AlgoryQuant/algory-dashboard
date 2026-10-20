"use client";

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useAuth } from '@clerk/nextjs';
import { clerkBrowserEnabled } from '@/lib/clerk-browser';
import { CandlestickBackdrop } from './dashboard/CandlestickBackdrop';

export default function LandingPage() {
  if (!clerkBrowserEnabled()) {
    return <LandingView isLoaded={false} userId={null} />;
  }
  return <LandingAuthed />;
}

function LandingAuthed() {
  const { isLoaded, userId } = useAuth();
  return <LandingView isLoaded={isLoaded} userId={userId} />;
}

function LandingView({
  isLoaded,
  userId,
}: {
  isLoaded: boolean;
  userId: string | null | undefined;
}) {
  return (
    <div className="min-h-[100dvh] w-full bg-background text-foreground font-sans overflow-x-hidden scroll-smooth">
      
      {/* GLOBAL HEADER */}
      <header className="fixed top-0 left-0 w-full p-6 lg:px-12 lg:py-6 flex justify-between items-center z-[100] bg-background/50 backdrop-blur-md border-b border-edge">
        <div className="text-xl font-black tracking-tighter text-foreground">Algory<span className="text-muted">.</span></div>
        <div className="flex items-center gap-4">
          <Link href="/plan" className="text-[10px] lg:text-xs font-bold uppercase tracking-widest text-muted hover:text-foreground transition-colors">
            Q4 Plán
          </Link>
          {isLoaded && !userId && (
            <Link href="/sign-in">
              <button className="text-[10px] lg:text-xs font-bold uppercase tracking-widest text-muted hover:text-foreground transition-colors">
                Sign In
              </button>
            </Link>
          )}
          {isLoaded && userId && (
            <Link href="/terminal">
              <button className="text-[10px] lg:text-xs font-bold uppercase tracking-widest text-accent hover:opacity-80 transition-opacity">
                Active Session
              </button>
            </Link>
          )}
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative w-full min-h-[90vh] flex flex-col items-center justify-center pt-20 px-6 z-10 overflow-hidden">
        <CandlestickBackdrop />
        
        <motion.div 
          initial={{ opacity: 0, y: 30 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 flex flex-col items-center text-center max-w-4xl w-full"
        >
          <p className="mb-6 font-mono text-[10px] font-medium uppercase tracking-[0.35em] text-accent lg:text-xs">
            Quantitative Execution Engine
          </p>
          
          <h1 className="mb-5 text-6xl font-black tracking-tighter text-foreground md:text-7xl lg:mb-6 lg:text-8xl lg:leading-[0.95]">
            Algory<span className="text-muted">.</span>
          </h1>

          <p className="mb-4 text-lg font-medium tracking-tight text-foreground/80 md:text-xl lg:text-2xl">
            Institutional grade. Retail access.
          </p>
          
          <p className="text-sm md:text-base lg:text-lg text-muted font-light tracking-wide max-w-2xl leading-relaxed mb-12">
            Real-time market topology, multi-exchange arbitrage matrices, and a Python backtesting lab — execute with precision.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 w-full sm:w-auto">
            {isLoaded && !userId && (
              <Link href="/sign-up" className="w-full sm:w-auto">
                <button className="w-full sm:w-auto px-8 py-4 bg-foreground text-background text-xs font-bold uppercase tracking-widest hover:opacity-90 transition-opacity">
                  Get Started
                </button>
              </Link>
            )}
            {isLoaded && userId && (
              <Link href="/terminal" className="w-full sm:w-auto">
                <button className="w-full px-8 py-4 bg-foreground text-background text-xs font-bold uppercase tracking-widest hover:opacity-90 transition-opacity">
                  Enter Terminal
                </button>
              </Link>
            )}
            
            <a href="#features" className="w-full sm:w-auto px-8 py-4 bg-transparent border border-edge text-xs font-bold uppercase tracking-widest text-foreground hover:bg-row-hover transition-colors text-center">
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

          {/* BENTO BOX 3: Academy */}
          <Link
            href="/academy"
            className="md:col-span-3 md:row-span-1 bg-[#050505] border border-white/10 rounded-3xl p-8 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden group hover:border-white/20 transition-colors"
          >
            <div className="absolute inset-0 bg-gradient-to-t from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative z-10 w-full md:w-1/3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 mb-2">Edukace</p>
              <h3 className="text-lg font-bold text-white tracking-tight">Algory Academy</h3>
              <p className="text-xs text-zinc-500 mt-2 leading-relaxed">
                Forex, crypto a algotrading — vzdělávací portál. Edukace, ne trading bot. Bez živého obchodování a bez spouštění kódu.
              </p>
            </div>
            <div className="relative z-10 w-full md:w-2/3 border border-white/5 rounded-xl p-5 bg-[#0a0a0a] flex flex-col gap-3">
              {['Forex — měnové trhy a risk', 'Crypto — spot, deriváty, funding', 'Algotrading — edge a disciplína'].map((line) => (
                <div key={line} className="flex items-center gap-3 text-xs text-zinc-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/70 shrink-0" />
                  {line}
                </div>
              ))}
              <span className="mt-2 text-[10px] font-bold uppercase tracking-widest text-zinc-500 group-hover:text-zinc-300 transition-colors">
                Otevřít Academy →
              </span>
            </div>
          </Link>

        </div>
      </section>
      
      {/* FOOTER */}
      <footer className="w-full border-t border-edge py-8 mt-12 text-center relative z-10 bg-background">
        <div className="text-[10px] font-bold uppercase tracking-widest text-muted">
          © 2026 ALGORY SYSTEMS. <br className="sm:hidden"/>ALL RIGHTS RESERVED.
        </div>
      </footer>
    </div>
  );
}