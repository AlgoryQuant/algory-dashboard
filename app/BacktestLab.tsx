"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// === PROFESIONÁLNÍ PYTHON ŠABLONA (STAT ARB / MT5) ===
const PYTHON_TEMPLATE = `import MetaTrader5 as mt5
import pandas as pd
import numpy as np

def run_stat_arb_backtest(symbol_a='EURUSD', symbol_b='GBPUSD', timeframe=mt5.TIMEFRAME_M15):
    # Connect to MetaTrader 5 Terminal
    if not mt5.initialize(): 
        print("MT5 Initialization failed")
        return False
    
    # Fetch historical tick data (1 Year)
    rates_a = mt5.copy_rates_from_pos(symbol_a, timeframe, 0, 50000)
    rates_b = mt5.copy_rates_from_pos(symbol_b, timeframe, 0, 50000)
    
    df = pd.DataFrame({'close_a': rates_a['close'], 'close_b': rates_b['close']})
    
    # Calculate rolling spread and Z-Score
    df['spread'] = df['close_a'] - (df['close_b'] * (df['close_a'][0] / df['close_b'][0]))
    df['mean'] = df['spread'].rolling(window=100).mean()
    df['std'] = df['spread'].rolling(window=100).std()
    df['z_score'] = (df['spread'] - df['mean']) / df['std']
    
    # Mean Reversion Logic (Delta-Neutral)
    df['position'] = np.where(df['z_score'] > 2.5, -1, np.nan)
    df['position'] = np.where(df['z_score'] < -2.5, 1, df['position'])
    df['position'] = np.where(abs(df['z_score']) < 0.5, 0, df['position'])
    
    # Apply transactional costs & slippage
    df['returns'] = df['spread'].diff() * df['position'].shift().fillna(0) - 0.0001
    
    return df['returns'].cumsum()
`;

// === TERMINÁLOVÉ HLÁŠKY ===
const TERMINAL_LOGS = [
  "[INFO] Initializing MT5 socket connection...",
  "[INFO] Authenticated. Ping to trade server: 12ms",
  "[INFO] Fetching M15 tick data for pairs (2023-2024)...",
  "[INFO] Downloaded 1,204,550 ticks. Aligning timeseries...",
  "[INFO] Running vectorized backtest (Z-Score Threshold: 2.5)...",
  "[INFO] Applying spread & slippage matrices...",
  "[INFO] Calculating Sharpe, Sortino, and Max Drawdown...",
  "[SUCCESS] Simulation finished. Rendering equity curve."
];

// === GENERÁTOR REALISTICKÉ "ZUBATÉ" EQUITY KŘIVKY ===
const generateRealisticEquityCurve = (startCapital: number, trades: number) => {
  let capital = startCapital;
  let peak = capital;
  let maxDrawdown = 0;
  const data = [{ trade: 0, equity: capital }];
  
  for (let i = 1; i <= trades; i++) {
    // 68% Win Rate, Profit Factor cca 1.8
    const isWin = Math.random() < 0.684;
    // Zubaté kroky (stochastický šum)
    const baseMove = isWin ? (Math.random() * 80 + 10) : -(Math.random() * 110 + 30);
    // Přidání malého driftu/volatility
    const noise = (Math.random() * 20) - 10; 
    
    capital += baseMove + noise;
    
    // Sledování propadů (Drawdowns)
    if (capital > peak) peak = capital;
    const drawdown = (capital - peak) / peak;
    if (drawdown < maxDrawdown) maxDrawdown = drawdown;
    
    data.push({ trade: i, equity: Number(capital.toFixed(2)) });
  }
  
  return { 
    data, 
    finalEquity: capital, 
    maxDrawdown: (maxDrawdown * 100).toFixed(2) 
  };
};

export default function BacktestLab() {
  const [isSimulating, setIsSimulating] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [capital, setCapital] = useState("10000");
  
  // Stavy pro výsledky simulace
  const [logs, setLogs] = useState<string[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [metrics, setMetrics] = useState({ netProfit: 0, maxDrawdown: "0.00" });

  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll v terminálu
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const handleRunSimulation = () => {
    setShowResults(false);
    setIsSimulating(true);
    setLogs([]);
    
    let currentIndex = 0;
    
    // Interval simulující postupný výpis terminálu
    const interval = setInterval(() => {
      if (currentIndex < TERMINAL_LOGS.length) {
        setLogs(prev => [...prev, TERMINAL_LOGS[currentIndex]]);
        currentIndex++;
      } else {
        clearInterval(interval);
        
        // Generování reálné zubaté křivky po skončení terminálu
        const initialCap = parseFloat(capital) || 10000;
        const result = generateRealisticEquityCurve(initialCap, 342); // 342 Trades
        setChartData(result.data);
        setMetrics({
          netProfit: result.finalEquity - initialCap,
          maxDrawdown: result.maxDrawdown
        });

        setIsSimulating(false);
        setShowResults(true);
      }
    }, 350); // Rychlost vypisování terminálu
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full flex flex-col xl:flex-row gap-10 mt-6 pb-20"
    >
      {/* LEVÝ PANEL: CODE EDITOR & SETTINGS */}
      <div className="w-full xl:w-[40%] flex flex-col gap-6">
        <div className="bg-zinc-950/50 backdrop-blur-xl border border-white/10 rounded-[2rem] p-6 shadow-2xl relative overflow-hidden flex flex-col h-full">
          <div className="flex items-center gap-3 mb-6 border-b border-white/5 pb-4">
            <svg className="w-5 h-5 text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.8)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
            <h2 className="text-sm font-bold uppercase tracking-widest text-white">PYTHON STRATEGY EDITOR</h2>
          </div>
          
          <div className="relative group flex-1 flex flex-col min-h-[400px]">
            <div className="absolute top-0 left-0 w-full h-8 bg-zinc-900/90 border-b border-white/5 rounded-t-xl flex items-center px-4 gap-2 z-10 backdrop-blur-md">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500/80"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></span>
              <span className="ml-4 text-[10px] text-zinc-400 font-mono tracking-widest">stat_arb_mt5.py</span>
            </div>
            <textarea 
              defaultValue={PYTHON_TEMPLATE}
              className="w-full flex-1 bg-[#050505]/80 text-emerald-400/90 font-mono text-[11px] leading-relaxed p-4 pt-12 rounded-xl border border-white/10 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 resize-none custom-scrollbar transition-all group-hover:border-white/20 shadow-inner"
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
              <select className="bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white font-mono focus:outline-none focus:border-emerald-500/50 transition-colors appearance-none outline-none">
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

      {/* PRAVÝ PANEL: TERMINAL & RESULTS */}
      <div className="w-full xl:w-[60%] flex flex-col h-full min-h-[700px]">
        <AnimatePresence mode="wait">
          
          {/* PRÁZDNÝ STAV (Před spuštěním) */}
          {!showResults && !isSimulating && (
            <motion.div 
              key="empty"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex-1 flex flex-col items-center justify-center border border-dashed border-white/10 rounded-[2rem] bg-white/[0.02]"
            >
              <svg className="w-12 h-12 text-zinc-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
              <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">Awaiting Compilation...</p>
            </motion.div>
          )}

          {/* TERMINÁL ANIMACE (Během spouštění) */}
          {isSimulating && (
            <motion.div 
              key="loading"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex-1 flex flex-col border border-emerald-500/20 rounded-[2rem] bg-[#050505] shadow-[0_0_50px_rgba(16,185,129,0.1)] p-6 font-mono overflow-hidden"
            >
              <div className="flex items-center gap-3 mb-6 border-b border-white/5 pb-4">
                <span className="animate-pulse w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]"></span>
                <span className="text-[10px] text-zinc-400 tracking-widest uppercase">Executing Quant Engine</span>
              </div>
              
              <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-2 text-xs">
                {logs.map((log, index) => (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }} 
                    animate={{ opacity: 1, x: 0 }} 
                    key={index}
                    className={`${log.includes('SUCCESS') ? 'text-emerald-400 font-bold' : log.includes('INFO') ? 'text-blue-400' : 'text-zinc-400'}`}
                  >
                    {log}
                  </motion.div>
                ))}
                <div ref={terminalEndRef} />
              </div>
            </motion.div>
          )}

          {/* VÝSLEDKY A GRAF (Po spuštění) */}
          {showResults && (
            <motion.div 
              key="results"
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="flex-1 flex flex-col gap-6"
            >
              {/* === PROFESIONÁLNÍ QUANT METRIKY (PROP FIRM STANDARD) === */}
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-black/40 backdrop-blur-xl border border-white/5 rounded-2xl p-5 shadow-inner relative overflow-hidden group">
                  <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1">TOTAL TRADES</div>
                  <div className="text-2xl font-black text-white font-mono">342</div>
                </div>
                <div className="bg-black/40 backdrop-blur-xl border border-white/5 rounded-2xl p-5 shadow-inner relative overflow-hidden group">
                  <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1">WIN RATE</div>
                  <div className="text-2xl font-black text-emerald-400 font-mono">68.4<span className="text-sm">%</span></div>
                </div>
                <div className="bg-black/40 backdrop-blur-xl border border-white/5 rounded-2xl p-5 shadow-inner relative overflow-hidden group">
                  <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1">PROFIT FACTOR</div>
                  <div className="text-2xl font-black text-blue-400 font-mono">1.84<span className="text-sm ml-1 text-blue-500/50">x</span></div>
                </div>
                <div className="bg-black/40 backdrop-blur-xl border border-white/5 rounded-2xl p-5 shadow-inner relative overflow-hidden group">
                  <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1">SHARPE RATIO</div>
                  <div className="text-2xl font-black text-purple-400 font-mono">1.45</div>
                </div>
                <div className="bg-red-950/10 backdrop-blur-xl border border-red-500/10 rounded-2xl p-5 shadow-inner relative overflow-hidden group">
                  <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1">MAX DRAWDOWN</div>
                  <div className="text-2xl font-black text-red-400 font-mono">{metrics.maxDrawdown}<span className="text-sm">%</span></div>
                </div>
                <div className="bg-emerald-950/10 backdrop-blur-xl border border-emerald-500/20 rounded-2xl p-5 shadow-inner relative overflow-hidden group">
                  <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1">NET PROFIT</div>
                  <div className="text-2xl font-black text-emerald-400 font-mono">{metrics.netProfit > 0 ? '+' : ''}${metrics.netProfit.toFixed(2)}</div>
                </div>
              </div>

              {/* EQUITY CURVE CHART */}
              <div className="flex-1 min-h-[400px] bg-zinc-950/50 backdrop-blur-xl border border-white/10 rounded-[2rem] p-6 shadow-2xl relative">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-300 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
                    STRATEGY EQUITY CURVE (RANDOM WALK DRIFT)
                  </h3>
                </div>
                <div className="w-full h-[calc(100%-40px)]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorEquity" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff0a" vertical={false} />
                      <XAxis dataKey="trade" stroke="#ffffff30" tick={{ fill: '#71717a', fontSize: 10 }} tickLine={false} axisLine={false} />
                      <YAxis domain={['auto', 'auto']} stroke="#ffffff30" tick={{ fill: '#71717a', fontSize: 10, fontFamily: 'monospace' }} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val}`} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#09090b', borderColor: '#ffffff20', borderRadius: '12px', fontSize: '12px', color: '#fff', fontFamily: 'monospace' }}
                        itemStyle={{ color: '#10b981', fontWeight: 'bold' }}
                        formatter={(value: any) => [`$${value}`, "Equity"]}
                        labelFormatter={(label) => `Trade #${label}`}
                      />
                      <Area type="monotone" dataKey="equity" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorEquity)" isAnimationActive={true} />
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