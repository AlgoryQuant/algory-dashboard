"use client";

import React from 'react';
import Link from 'next/link';
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
      <header className="fixed top-0 left-0 z-[100] flex w-full items-center justify-between border-b border-edge bg-background/80 px-6 py-4 backdrop-blur-sm sm:px-10 lg:px-16">
        <div className="text-lg font-semibold tracking-tight text-foreground">
          Algory<span className="text-muted">.</span>
        </div>
        <div className="flex items-center gap-5">
          <Link
            href="/plan"
            className="text-xs font-medium tracking-wide text-muted transition-colors hover:text-foreground"
          >
            Q4 plán
          </Link>
          {isLoaded && !userId && (
            <Link
              href="/sign-in"
              className="text-xs font-medium tracking-wide text-muted transition-colors hover:text-foreground"
            >
              Sign in
            </Link>
          )}
          {isLoaded && userId && (
            <Link
              href="/terminal"
              className="text-xs font-medium tracking-wide text-foreground transition-opacity hover:opacity-80"
            >
              Terminal
            </Link>
          )}
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative z-10 flex min-h-[88vh] w-full flex-col justify-center overflow-hidden px-6 pb-16 pt-28 sm:px-10 lg:px-16">
        <CandlestickBackdrop />

        <div className="relative z-10 mx-auto w-full max-w-3xl animate-[hubFade_0.55s_ease_both]">
          <h1 className="mb-4 text-5xl font-semibold tracking-tight text-foreground sm:text-6xl lg:text-7xl lg:leading-[1.05]">
            Algory<span className="text-muted">.</span>
          </h1>

          <p className="mb-9 max-w-md text-[15px] leading-relaxed text-muted sm:text-base">
            Terminál, plán a academy na jednom místě — trhy bez marketingového šumu.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            {isLoaded && !userId && (
              <Link
                href="/sign-up"
                className="inline-flex items-center border border-foreground bg-foreground px-5 py-2.5 text-xs font-medium tracking-wide text-background transition-opacity hover:opacity-90"
              >
                Začít
              </Link>
            )}
            {isLoaded && userId && (
              <Link
                href="/terminal"
                className="inline-flex items-center border border-foreground bg-foreground px-5 py-2.5 text-xs font-medium tracking-wide text-background transition-opacity hover:opacity-90"
              >
                Terminal
              </Link>
            )}
            <a
              href="#features"
              className="inline-flex items-center border border-edge px-5 py-2.5 text-xs font-medium tracking-wide text-foreground transition-colors hover:border-foreground/35 hover:bg-row-hover"
            >
              Co umí
            </a>
          </div>
        </div>
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