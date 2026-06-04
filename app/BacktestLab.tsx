"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const MOCK_EQUITY_DATA = [
  { trade: 0, equity: 10000 }, { trade: 5, equity: 10250 }, { trade: 10, equity: 10100 },
  { trade: 15, equity: 10600 }, { trade: 20, equity: 10450 }, { trade: 25, equity: 11200 },
  { trade: 30, equity: 11100 }, { trade: 35, equity: 11800 }, { trade: 40, equity: 11750 },
  { trade: 45, equity: 12500 }, { trade: 50, equity: 12400 }, { trade: 55, equity: 13200 }
];

const PYTHON_TEMPLATE = `import pandas as pd
import numpy as np

def calculate_signals(df):
    # Calculate 50 & 200 EMA
    df['EMA_50'] = df['close'].ewm(span=50).mean()
    df['EMA_200'] = df['close'].ewm(span=200).mean()
    
    # Golden Cross Logic
    df['Signal'] = 0
    df.loc[df['EMA_50'] > df['EMA_200'], 'Signal'] = 1
    df.loc[df['EMA_50'] < df['EMA_200'], 'Signal'] = -1
    
    # Apply ATR for dynamic Stop Loss
    df['ATR'] = df['high'] - df['low']
    df['SL'] = df['ATR'] * 1.5
    
    return df

# Expected return: DataFrame with signals
`;

export default function BacktestLab() {
  const [isSimulating, setIsSimulating] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [capital, setCapital] = useState("10000");

  const handleRunSimulation = () => {
    setShowResults(false);
    setIsSimulating(true);
    setTimeout(() => {
      setIsSimulating(false);
      setShowResults(true);
    }, 2000);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full flex flex-col xl:flex-row gap-10 mt-6 pb-20"
    >
      {/* LEVÝ PANEL: CODE EDITOR & SETTINGS */}
      <div className="w-full xl:w-1/3 flex flex-col gap-6">
        <div className="bg-zinc-950/50 backdrop-blur-xl border border-white/10 rounded-[2rem] p-6 shadow-2xl relative overflow-hidden">
          <div className="flex items-center gap-3 mb-6 border-b border-white/5 pb-4">
            <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
            <h2 className="text-sm font-bold uppercase tracking-widest text-white">PYTHON STRATEGY EDITOR</h2>
          </div>
          
          <div className="relative group">
            <div className="absolute top-0 left-0 w-full h-8 bg-zinc-900/80 border-b border-white/5 rounded-t-xl flex items-center px-4 gap-2 z-10">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500/80"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></span>
              <span className="ml-4 text-[10px] text-zinc-500 font-mono">strategy.py</span>
            </div>
            <textarea 
              defaultValue={PYTHON_TEMPLATE}
              className="w-full h-80 bg-[#0a0a0a] text-emerald-400 font-mono text-xs p-4 pt-12 rounded-xl border border-white/10 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 resize-none custom-scrollbar transition-all group-hover:border-white/20 shadow-inner"
              spellCheck="false"
            />
          </div>

          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold text-zinc-500 tracking-widest uppercase">INITIAL CAPITAL ($)</label>
              <input type="number" value={capital} onChange={(e) => setCapital(e.target.value)} className="bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white font-mono focus:outline-none focus:border-emerald-500/50 transition-colors" />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold text-zinc-500 tracking-widest uppercase">TEST TIMEFRAME</label>
              <select className="bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white font-mono focus:outline-none focus:border-emerald-500/50 transition-colors appearance-none">
                <option>M15 (15 Minutes)</option>
                <option>H1 (1 Hour)</option>
                <option>H4 (4 Hours)</option>
                <option>D1 (Daily)</option>
              </select>
            </div>
          </div>

          <button 
            onClick={handleRunSimulation}
            disabled={isSimulating}
            className="w-full mt-6 py-4 bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs tracking-[0.2em] uppercase rounded-xl transition-all hover:-translate-y-1 shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex justify-center items-center h-[52px]"
          >
            {isSimulating ? (
              <svg className="animate-spin h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            ) : "RUN AI SIMULATION"}
          </button>
        </div>
      </div>

      {/* PRAVÝ PANEL: RESULTS & EQUITY CURVE */}
      <div className="w-full xl:w-2/3 flex flex-col h-[600px]">
        <AnimatePresence mode="wait">
          {!showResults && !isSimulating && (
            <motion.div 
              key="empty"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex-1 flex flex-col items-center justify-center border border-dashed border-white/10 rounded-[2rem] bg-white/[0.02]"
            >
              <svg className="w-12 h-12 text-zinc-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
              <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">Awaiting Simulation Code...</p>
            </motion.div>
          )}

          {isSimulating && (
            <motion.div 
              key="loading"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex-1 flex flex-col items-center justify-center border border-emerald-500/20 rounded-[2rem] bg-emerald-500/5 shadow-[0_0_50px_rgba(16,185,129,0.1)]"
            >
              <div className="relative flex items-center justify-center w-24 h-24 mb-6">
                <div className="absolute inset-0 border-4 border-emerald-500/20 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-emerald-500 rounded-full border-t-transparent animate-spin"></div>
                <svg className="w-8 h-8 text-emerald-400 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              </div>
              <p className="text-emerald-400 font-bold uppercase tracking-[0.3em] text-xs animate-pulse">Running Backtest Engine...</p>
              <p className="text-emerald-500/50 font-mono text-[10px] mt-2">Processing 1,204,550 historical ticks</p>
            </motion.div>
          )}

          {showResults && (
            <motion.div 
              key="results"
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="flex-1 flex flex-col gap-6"
            >
              {/* PERFORMANCE METRICS CARDS */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-zinc-950/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl relative overflow-hidden group hover:border-emerald-500/30 transition-colors">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/10 rounded-bl-full blur-xl group-hover:bg-emerald-500/20 transition-colors"></div>
                  <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">WIN RATE</div>
                  <div className="text-3xl font-black text-white">68.4<span className="text-emerald-400 text-xl">%</span></div>
                </div>
                <div className="bg-zinc-950/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl relative overflow-hidden group hover:border-blue-500/30 transition-colors">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/10 rounded-bl-full blur-xl group-hover:bg-blue-500/20 transition-colors"></div>
                  <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">PROFIT FACTOR</div>
                  <div className="text-3xl font-black text-white">1.84<span className="text-blue-400 text-xl font-medium ml-2">x</span></div>
                </div>
                <div className="bg-zinc-950/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl relative overflow-hidden group hover:border-red-500/30 transition-colors">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-red-500/10 rounded-bl-full blur-xl group-hover:bg-red-500/20 transition-colors"></div>
                  <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">MAX DRAWDOWN</div>
                  <div className="text-3xl font-black text-white">-4.2<span className="text-red-400 text-xl">%</span></div>
                </div>
              </div>

              {/* EQUITY CURVE CHART */}
              <div className="flex-1 bg-zinc-950/50 backdrop-blur-xl border border-white/10 rounded-[2rem] p-6 shadow-2xl relative">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-300 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
                    STRATEGY EQUITY CURVE
                  </h3>
                  <div className="text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-3 py-1.5 rounded-lg">
                    NET PROFIT: +$3,200.00
                  </div>
                </div>
                <div className="w-full h-[calc(100%-40px)]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={MOCK_EQUITY_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorEquity" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                      <XAxis dataKey="trade" stroke="#ffffff30" tick={{ fill: '#71717a', fontSize: 10 }} tickLine={false} axisLine={false} />
                      <YAxis domain={['dataMin - 500', 'auto']} stroke="#ffffff30" tick={{ fill: '#71717a', fontSize: 10, fontFamily: 'monospace' }} tickLine={false} axisLine={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#09090b', borderColor: '#ffffff20', borderRadius: '12px', fontSize: '12px', color: '#fff' }}
                        itemStyle={{ color: '#10b981', fontWeight: 'bold' }}
                      />
                      <Area type="monotone" dataKey="equity" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorEquity)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}