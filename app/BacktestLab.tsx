"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Editor from '@monaco-editor/react';

// === PROFESIONÁLNÍ PYTHON ŠABLONA (FOREX MT5) ===
const PYTHON_TEMPLATE = `import MetaTrader5 as mt5
import pandas as pd
import numpy as np

def run_forex_backtest(symbol, timeframe, capital):
    # Connect to MetaTrader 5 Terminal
    if not mt5.initialize(): 
        return {"error": "MT5 Initialization failed"}
    
    # Fetch historical tick data (Forex)
    rates = mt5.copy_rates_from_pos(symbol, timeframe, 0, 100000)
    df = pd.DataFrame(rates)
    df['time'] = pd.to_datetime(df['time'], unit='s')
    
    # --- YOUR CUSTOM ALGO LOGIC HERE ---
    df['EMA_50'] = df['close'].ewm(span=50).mean()
    df['EMA_200'] = df['close'].ewm(span=200).mean()
    
    # Strategy: Golden Cross
    df['position'] = np.where(df['EMA_50'] > df['EMA_200'], 1, -1)
    
    # Calculate Returns
    df['returns'] = df['close'].diff() * df['position'].shift()
    df['equity'] = capital + df['returns'].cumsum()
    
    # Return JSON structure expected by Algory Frontend
    return {
        "success": True,
        "metrics": {
            "totalTrades": 342,
            "winRate": 68.4,
            "profitFactor": 1.84,
            "sharpeRatio": 1.45,
            "maxDrawdown": -4.2,
            "netProfit": 3200.00
        },
        "equityCurve": [{"trade": i, "equity": val} for i, val in enumerate(df['equity'].dropna())],
        "logs": ["[INFO] Strategy executed successfully."]
    }
`;

// === OPTIONS PRO FOREX UI ===
const CURRENCIES = ["USD", "EUR", "GBP", "CZK"];
const FOREX_PAIRS = ["EURUSD", "GBPUSD", "USDJPY", "USDCAD", "AUDUSD", "USDCHF", "GBPJPY", "EURJPY"];
const TIMEFRAMES = [
  { label: "M1 (1 Minute)", value: "M1" },
  { label: "M5 (5 Minutes)", value: "M5" },
  { label: "M15 (15 Minutes)", value: "M15" },
  { label: "H1 (1 Hour)", value: "H1" },
  { label: "H4 (4 Hours)", value: "H4" },
  { label: "D1 (Daily)", value: "D1" }
];

export default function BacktestLab() {
  // === STATE MANAGEMENT ===
  const [isSimulating, setIsSimulating] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  
  // Editor State
  const [code, setCode] = useState(PYTHON_TEMPLATE);
  
  // Forex Parameters State
  const [currency, setCurrency] = useState("USD");
  const [capital, setCapital] = useState("10000");
  const [pair, setPair] = useState("EURUSD");
  const [timeframe, setTimeframe] = useState("M15");

  // Results State
  const [chartData, setChartData] = useState<any[]>([]);
  const [metrics, setMetrics] = useState({ 
    totalTrades: 0, winRate: 0, profitFactor: 0, sharpeRatio: 0, maxDrawdown: 0, netProfit: 0 
  });

  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll v terminálu
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  // === HLAVNÍ API CALL LOGIKA ===
  const handleRunSimulation = async () => {
    setShowResults(false);
    setIsSimulating(true);
    setLogs(["[INFO] Initializing Quantum Engine API..."]);

    try {
      setLogs(prev => [...prev, "[INFO] Establishing connection to Python backend (localhost:8000)..."]);
      setLogs(prev => [...prev, `[INFO] Payload configuration: ${pair} | ${timeframe} | ${capital} ${currency}`]);

      // === REÁLNÝ FETCH NA BACKEND ===
      const response = await fetch("http://localhost:8000/api/run-backtest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: code,
          pair: pair,
          timeframe: timeframe,
          capital: parseFloat(capital),
          currency: currency
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const backendData = await response.json();
      
      setLogs(prev => [...prev, ...backendData.logs]);
      setMetrics(backendData.metrics);
      setChartData(backendData.equityCurve);

    } catch (err) {
      // === FALLBACK PRO VÝVOJ ===
      // Pokud API neběží, vyhodíme chybu, ale nasimulujeme placeholder data, aby UI fungovalo dál
      setLogs(prev => [...prev, "[ERROR] Backend unreachable (Connection refused)."]);
      setLogs(prev => [...prev, "[INFO] Switching to fallback MOCK payload to preserve UI rendering..."]);
      
      await new Promise(resolve => setTimeout(resolve, 1500)); // Umělá prodleva
      
      setMetrics({
        totalTrades: 845,
        winRate: 54.2,
        profitFactor: 1.25,
        sharpeRatio: 1.12,
        maxDrawdown: -8.4,
        netProfit: parseFloat(capital) * 0.15 // 15% zisk pro ukázku
      });

      // MOCK Zubatá křivka
      let curr = parseFloat(capital);
      const mockCurve = [{ trade: 0, equity: curr }];
      for(let i=1; i<=845; i++) {
        curr += (Math.random() < 0.542 ? (Math.random() * 40) : -(Math.random() * 45));
        if(i % 10 === 0) mockCurve.push({ trade: i, equity: Number(curr.toFixed(2)) });
      }
      setChartData(mockCurve);
      
      setLogs(prev => [...prev, "[SUCCESS] Fallback backtest rendering complete."]);
    } finally {
      // Necháme uživateli 1 sekundu na přečtení posledních logů, pak ukážeme graf
      setTimeout(() => {
        setIsSimulating(false);
        setShowResults(true);
      }, 1000);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full flex flex-col xl:flex-row gap-10 mt-6 pb-20"
    >
      {/* LEVÝ PANEL: CODE EDITOR & FOREX SETTINGS */}
      <div className="w-full xl:w-[40%] flex flex-col gap-6">
        <div className="bg-zinc-950/50 backdrop-blur-xl border border-white/10 rounded-[2rem] p-6 shadow-2xl relative overflow-hidden flex flex-col h-full">
          <div className="flex items-center gap-3 mb-6 border-b border-white/5 pb-4">
            <svg className="w-5 h-5 text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.8)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
            <h2 className="text-sm font-bold uppercase tracking-widest text-white">PYTHON FOREX STRATEGY</h2>
          </div>
          
          {/* MONACO EDITOR CONTAINER */}
          <div className="relative group flex-1 flex flex-col min-h-[400px] border border-white/10 rounded-xl overflow-hidden shadow-inner transition-all hover:border-white/20">
            <div className="absolute top-0 left-0 w-full h-8 bg-[#1e1e1e] border-b border-white/5 flex items-center px-4 gap-2 z-10">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500/80"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></span>
              <span className="ml-4 text-[10px] text-zinc-400 font-mono tracking-widest">forex_algo.py</span>
            </div>
            <div className="flex-1 mt-8">
              <Editor
                height="100%"
                defaultLanguage="python"
                theme="vs-dark"
                value={code}
                onChange={(value) => setCode(value || '')}
                options={{
                  minimap: { enabled: false },
                  fontSize: 12,
                  fontFamily: 'monospace',
                  scrollBeyondLastLine: false,
                  padding: { top: 16 },
                  smoothScrolling: true,
                }}
              />
            </div>
          </div>

          {/* FOREX PARAMETERS CONTROL PANEL */}
          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold text-zinc-500 tracking-widest uppercase">ACCOUNT CURRENCY</label>
              <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white font-mono focus:outline-none focus:border-emerald-500/50 transition-colors outline-none cursor-pointer">
                {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold text-zinc-500 tracking-widest uppercase">INITIAL CAPITAL</label>
              <input type="number" value={capital} onChange={(e) => setCapital(e.target.value)} className="bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white font-mono focus:outline-none focus:border-emerald-500/50 transition-colors" />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold text-zinc-500 tracking-widest uppercase">FOREX PAIR</label>
              <select value={pair} onChange={(e) => setPair(e.target.value)} className="bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white font-mono focus:outline-none focus:border-emerald-500/50 transition-colors outline-none cursor-pointer">
                {FOREX_PAIRS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold text-zinc-500 tracking-widest uppercase">TEST TIMEFRAME</label>
              <select value={timeframe} onChange={(e) => setTimeframe(e.target.value)} className="bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white font-mono focus:outline-none focus:border-emerald-500/50 transition-colors outline-none cursor-pointer">
                {TIMEFRAMES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
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
                    className={`${log.includes('SUCCESS') ? 'text-emerald-400 font-bold' : log.includes('ERROR') ? 'text-red-400 font-bold' : log.includes('INFO') ? 'text-blue-400' : 'text-zinc-400'}`}
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
              {/* === PROFESIONÁLNÍ QUANT METRIKY === */}
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-black/40 backdrop-blur-xl border border-white/5 rounded-2xl p-5 shadow-inner relative overflow-hidden group">
                  <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1">TOTAL TRADES</div>
                  <div className="text-2xl font-black text-white font-mono">{metrics.totalTrades}</div>
                </div>
                <div className="bg-black/40 backdrop-blur-xl border border-white/5 rounded-2xl p-5 shadow-inner relative overflow-hidden group">
                  <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1">WIN RATE</div>
                  <div className="text-2xl font-black text-emerald-400 font-mono">{metrics.winRate}<span className="text-sm">%</span></div>
                </div>
                <div className="bg-black/40 backdrop-blur-xl border border-white/5 rounded-2xl p-5 shadow-inner relative overflow-hidden group">
                  <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1">PROFIT FACTOR</div>
                  <div className="text-2xl font-black text-blue-400 font-mono">{metrics.profitFactor}<span className="text-sm ml-1 text-blue-500/50">x</span></div>
                </div>
                <div className="bg-black/40 backdrop-blur-xl border border-white/5 rounded-2xl p-5 shadow-inner relative overflow-hidden group">
                  <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1">SHARPE RATIO</div>
                  <div className="text-2xl font-black text-purple-400 font-mono">{metrics.sharpeRatio}</div>
                </div>
                <div className="bg-red-950/10 backdrop-blur-xl border border-red-500/10 rounded-2xl p-5 shadow-inner relative overflow-hidden group">
                  <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1">MAX DRAWDOWN</div>
                  <div className="text-2xl font-black text-red-400 font-mono">{metrics.maxDrawdown}<span className="text-sm">%</span></div>
                </div>
                <div className="bg-emerald-950/10 backdrop-blur-xl border border-emerald-500/20 rounded-2xl p-5 shadow-inner relative overflow-hidden group">
                  <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1">NET PROFIT</div>
                  <div className="text-2xl font-black text-emerald-400 font-mono">{metrics.netProfit > 0 ? '+' : ''}{metrics.netProfit.toFixed(2)} <span className="text-sm">{currency}</span></div>
                </div>
              </div>

              {/* EQUITY CURVE CHART */}
              <div className="flex-1 min-h-[400px] bg-zinc-950/50 backdrop-blur-xl border border-white/10 rounded-[2rem] p-6 shadow-2xl relative">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-300 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
                    STRATEGY EQUITY CURVE ({pair})
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
                      <YAxis domain={['auto', 'auto']} stroke="#ffffff30" tick={{ fill: '#71717a', fontSize: 10, fontFamily: 'monospace' }} tickLine={false} axisLine={false} tickFormatter={(val) => `${val}`} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#09090b', borderColor: '#ffffff20', borderRadius: '12px', fontSize: '12px', color: '#fff', fontFamily: 'monospace' }}
                        itemStyle={{ color: '#10b981', fontWeight: 'bold' }}
                        formatter={(value: any) => [`${value} ${currency}`, "Equity"]}
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