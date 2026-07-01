"use client";
import React from 'react';
import { motion } from 'framer-motion';
import { SignInButton } from '@clerk/nextjs';

export default function PublicLanding() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[100dvh] w-full relative overflow-hidden font-sans bg-[#050505] p-6 lg:p-0">
      {/* Background Gradients */}
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
      
      <div className="relative z-10 flex flex-col items-center text-center w-full max-w-5xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="flex flex-col items-center">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-emerald-400 font-bold tracking-[0.4em] text-[10px] lg:text-xs mb-4 lg:mb-6 uppercase drop-shadow-[0_0_15px_rgba(99,102,241,0.5)]">
            WELCOME TO ALGORY
          </span>
          <h1 className="text-5xl md:text-7xl lg:text-9xl font-black tracking-tighter text-white drop-shadow-2xl mb-4 lg:mb-6">
            Algory<span className="text-zinc-600">.</span>
          </h1>
          <p className="text-zinc-400 text-xs md:text-sm lg:text-lg font-light tracking-wide max-w-2xl leading-relaxed">
            Advanced quantitative analysis & real-time execution engine.
          </p>
        </motion.div>

        <div className="w-full max-w-4xl flex flex-col gap-4 lg:gap-6 mt-10 lg:mt-16 relative z-10 px-4 lg:px-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* GATEWAY 1: FOREX */}
            <SignInButton mode="modal" forceRedirectUrl="/terminal">
              <div className="group cursor-pointer p-6 lg:p-8 bg-transparent border border-white/5 hover:border-white/15 hover:bg-white/[0.02] rounded-xl transition-all duration-200 flex flex-col text-left h-full">
                <div className="text-[10px] font-medium uppercase tracking-widest text-zinc-500 mb-4 lg:mb-6">Market Data</div>
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-xl font-medium tracking-tight text-zinc-100 group-hover:text-white transition-colors">Global Forex</h2>
                </div>
                <p className="text-xs lg:text-sm text-zinc-500 leading-relaxed max-w-xs">
                  Live liquidity streams, cross-pair institutional arbitrage tracking, and deep orderflow metrics.
                </p>
              </div>
            </SignInButton>

            {/* GATEWAY 2: CRYPTO */}
            <SignInButton mode="modal" forceRedirectUrl="/terminal">
              <div className="group cursor-pointer p-6 lg:p-8 bg-transparent border border-white/5 hover:border-white/15 hover:bg-white/[0.02] rounded-xl transition-all duration-200 flex flex-col text-left h-full">
                <div className="text-[10px] font-medium uppercase tracking-widest text-zinc-500 mb-4 lg:mb-6">Digital Assets</div>
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-xl font-medium tracking-tight text-zinc-100 group-hover:text-white transition-colors">Crypto Matrices</h2>
                </div>
                <p className="text-xs lg:text-sm text-zinc-500 leading-relaxed max-w-xs">
                  Spatial crypto arbitrage monitoring, real-time funding rates analysis, and derivative flow pools.
                </p>
              </div>
            </SignInButton>

          </div>

          {/* GATEWAY 3: LABORATORY */}
          <SignInButton mode="modal" forceRedirectUrl="/terminal">
            <div className="group cursor-pointer p-6 lg:p-8 bg-transparent border border-white/5 hover:border-white/15 hover:bg-white/[0.02] rounded-xl transition-all duration-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 text-left">
              <div className="flex flex-col">
                <div className="text-[10px] font-medium uppercase tracking-widest text-zinc-500 mb-4 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-white/20"></span>
                  Development Environment
                </div>
                <h2 className="text-2xl font-medium tracking-tight text-zinc-100 group-hover:text-white transition-colors mb-2">
                  AI Quant Laboratory
                </h2>
                <p className="text-xs lg:text-sm text-zinc-500 leading-relaxed max-w-2xl">
                  Develop & backtest Python models on historical tick data. Features OpenAI insights, dynamic strategy generation, and strict evaluation limits.
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs lg:text-sm font-medium text-zinc-400 group-hover:text-white transition-colors whitespace-nowrap">
                Initialize Engine 
                <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </div>
            </div>
          </SignInButton>

        </div>
      </div>
    </div>
  );
}