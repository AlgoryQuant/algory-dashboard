"use client";
import React from 'react';
import { motion } from 'framer-motion';
import { SignInButton, SignUpButton } from '@clerk/nextjs';

export default function PublicLanding() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[100dvh] w-full relative overflow-hidden font-sans bg-[#050505] p-6 lg:p-0">
      
      {/* EXPLICIT AUTHENTICATION HEADER */}
      <header className="absolute top-0 left-0 w-full p-6 lg:px-12 lg:py-8 flex justify-between items-center z-50">
        <div className="text-xl font-black tracking-tighter text-white">Algory<span className="text-zinc-600">.</span></div>
        <div className="flex items-center gap-4 lg:gap-6">
          <SignInButton mode="modal" forceRedirectUrl="/terminal">
            <button className="text-[10px] lg:text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-white transition-colors">
              Sign In
            </button>
          </SignInButton>
          <SignUpButton mode="modal" forceRedirectUrl="/terminal">
            <button className="text-[10px] lg:text-xs font-bold uppercase tracking-widest bg-white text-black px-4 py-2 lg:px-5 lg:py-2.5 rounded-lg hover:bg-zinc-200 transition-colors shadow-[0_0_15px_rgba(255,255,255,0.1)]">
              Sign Up
            </button>
          </SignUpButton>
        </div>
      </header>

      {/* BACKGROUND GRADIENTS */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-950/20 via-[#050505] to-[#050505] z-0" />
      <motion.div 
        animate={{ y: [0, -40, 0], x: [0, 20, 0] }} 
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }} 
        className="absolute top-[-10%] left-[-10%] w-[60vw] lg:w-[40vw] h-[60vw] lg:h-[40vw] max-w-[600px] max-h-[600px] bg-indigo-600 rounded-full blur-[80px] lg:blur-[120px] opacity-20 z-0 pointer-events-none" 
      />
      <motion.div 
        animate={{ y: [0, 50, 0], x: [0, -30, 0] }} 
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }} 
        className="absolute bottom-[-10%] right-[-10%] w-[60vw] lg:w-[40vw] h-[60vw] lg:h-[40vw] max-w-[600px] max-h-[600px] bg-emerald-600 rounded-full blur-[80px] lg:blur-[120px] opacity-20 z-0 pointer-events-none" 
      />
      
      <div className="relative z-10 flex flex-col items-center text-center w-full max-w-5xl mt-16">
        
        {/* HERO SECTION & MAIN CTA */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="flex flex-col items-center">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-emerald-400 font-bold tracking-[0.4em] text-[10px] lg:text-xs mb-4 lg:mb-6 uppercase drop-shadow-[0_0_15px_rgba(99,102,241,0.5)]">
            WELCOME TO ALGORY
          </span>
          <h1 className="text-5xl md:text-7xl lg:text-9xl font-black tracking-tighter text-white drop-shadow-2xl mb-4 lg:mb-6">
            Algory<span className="text-zinc-600">.</span>
          </h1>
          <p className="text-zinc-400 text-xs md:text-sm lg:text-lg font-light tracking-wide max-w-2xl leading-relaxed mb-8 lg:mb-12">
            Advanced quantitative analysis & real-time execution engine.
          </p>
          
          <SignUpButton mode="modal" forceRedirectUrl="/terminal">
            <button className="flex items-center gap-3 px-8 py-3.5 lg:px-10 lg:py-4 bg-white/5 border border-white/10 rounded-full text-xs lg:text-sm font-bold uppercase tracking-widest text-white hover:bg-white/10 hover:border-white/20 transition-all group shadow-2xl">
              Initialize Engine
              <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          </SignUpButton>
        </motion.div>

        {/* STATIC INFORMATIONAL CARDS */}
        <div className="w-full max-w-4xl flex flex-col gap-4 lg:gap-6 mt-16 lg:mt-24 relative z-10 px-4 lg:px-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* MODULE 1: FOREX */}
            <div className="p-6 lg:p-8 bg-black/40 border border-white/5 rounded-xl flex flex-col text-left h-full backdrop-blur-sm">
              <div className="text-[10px] font-medium uppercase tracking-widest text-zinc-500 mb-4 lg:mb-6">Market Data</div>
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-xl font-medium tracking-tight text-zinc-100">Global Forex</h2>
              </div>
              <p className="text-xs lg:text-sm text-zinc-500 leading-relaxed max-w-xs">
                Live liquidity streams, cross-pair institutional arbitrage tracking, and deep orderflow metrics.
              </p>
            </div>

            {/* MODULE 2: CRYPTO */}
            <div className="p-6 lg:p-8 bg-black/40 border border-white/5 rounded-xl flex flex-col text-left h-full backdrop-blur-sm">
              <div className="text-[10px] font-medium uppercase tracking-widest text-zinc-500 mb-4 lg:mb-6">Digital Assets</div>
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-xl font-medium tracking-tight text-zinc-100">Crypto Matrices</h2>
              </div>
              <p className="text-xs lg:text-sm text-zinc-500 leading-relaxed max-w-xs">
                Spatial crypto arbitrage monitoring, real-time funding rates analysis, and derivative flow pools.
              </p>
            </div>

          </div>

          {/* MODULE 3: LABORATORY */}
          <div className="p-6 lg:p-8 bg-black/40 border border-white/5 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6 text-left backdrop-blur-sm">
            <div className="flex flex-col">
              <div className="text-[10px] font-medium uppercase tracking-widest text-zinc-500 mb-4 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-white/20"></span>
                Development Environment
              </div>
              <h2 className="text-2xl font-medium tracking-tight text-zinc-100 mb-2">
                AI Quant Laboratory
              </h2>
              <p className="text-xs lg:text-sm text-zinc-500 leading-relaxed max-w-2xl">
                Develop & backtest Python models on historical tick data. Features OpenAI insights, dynamic strategy generation, and strict evaluation limits.
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}