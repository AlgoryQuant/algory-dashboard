"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Editor from '@monaco-editor/react';

// ─── ŠABLONY STRATEGIÍ ──────────────────────────────────────────────
const TEMPLATES = {
  "AI_XGBOOST": `# Algory AI XGBoost Binary Core
from __future__ import annotations
import MetaTrader5 as mt5
import numpy as np
import pandas as pd
from datetime import datetime
from xgboost import XGBClassifier

class TradingEngine:
    def __init__(self):
        self.active = True

    def _on_new_bar(self, dt: datetime) -> None:
        # Complex ML prediction logic here...
        pass
        
    def _sync_and_manage(self) -> None:
        pass
`,
  "MEAN_REVERSION": `# Statistical Mean Reversion (Bollinger Bands)
from __future__ import annotations
import MetaTrader5 as mt5
import pandas as pd
from datetime import datetime

class TradingEngine:
    def __init__(self):
        self.period = 20
        self.std_dev = 2.0

    def _on_new_bar(self, dt: datetime) -> None:
        # Calculate deviation from the mean
        # Execute contrarian positions
        pass
        
    def _sync_and_manage(self) -> None:
        pass
`,
  "SMA_CROSSOVER": `# Institutional Trend Follower (SMA 50/200)
from __future__ import annotations
import MetaTrader5 as mt5
import pandas as pd
from datetime import datetime

class TradingEngine:
    def __init__(self):
        self.fast_sma = 50
        self.slow_sma = 200

    def _on_new_bar(self, dt: datetime) -> None:
        # Detect Golden Cross / Death Cross
        # Ride the macro trend
        pass
        
    def _sync_and_manage(self) -> None:
        pass
`
};

const CURRENCIES = ["USD", "EUR", "GBP", "CZK"];
const FOREX_PAIRS = ["EURUSD", "GBPUSD", "USDJPY", "USDCAD", "AUDUSD", "USDCHF", "GBPJPY", "EURJPY", "XAUUSD"];
const AGGRESSIVENESS_LEVELS = [
  { label: "High Frequency (Aggressive)", value: "0.38" },
  { label: "Balanced (Standard)", value: "0.45" },
  { label: "High Accuracy (Conservative)", value: "0.55" }
];

export default function BacktestLab() {
  const [isSimulating, setIsSimulating] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [aiInsight, setAiInsight] = useState<string>("");
  
  const [code, setCode] = useState(TEMPLATES["AI_XGBOOST"]);
  const [currency, setCurrency] = useState("USD");
  const [capital, setCapital] = useState("50000");
  const [pair, setPair] = useState("XAUUSD");
  const [confidence, setConfidence] = useState("0.45");
  
  // Nové funkce State
  const [propFirmMode, setPropFirmMode] = useState(false);
  const [challengeFailed, setChallengeFailed] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [elapsedTime, setElapsedTime] = useState(0);

  const [chartData, setChartData] = useState<any[]>([]);
  const [metrics, setMetrics] = useState({ 
    totalTrades: 0, winRate: 0, profitFactor: 0, sharpeRatio: 0, maxDrawdown: 0, netProfit: 0 
  });

  const terminalEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isSimulating) {
      setElapsedTime(0);
      interval = setInterval(() => { setElapsedTime(prev => prev + 1); }, 1000);
    }
    return () => clearInterval(interval);
  }, [isSimulating]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3000);
  };

  const handleCopyReport = () => {
    const report = `🚀 Algory AI Backtest Report\n📈 Pair: ${pair}\n💰 Net Profit: ${(metrics.netProfit > 0 ? '+' : '')}${metrics.netProfit.toFixed(2)} ${currency}\n🎯 Win Rate: ${metrics.winRate.toFixed(1)}%\n📊 Profit Factor: ${metrics.profitFactor.toFixed(2)}x\n📉 Max DD: ${Math.abs(metrics.maxDrawdown).toFixed(2)}%\n\nTest your own institutional algo at algory.com!`;
    navigator.clipboard.writeText(report);
    showToast("Report copied to clipboard! 📋");
  };

  const loadTemplate = (templateKey: keyof typeof TEMPLATES) => {
    setCode(TEMPLATES[templateKey]);
    setShowTemplates(false);
    showToast("Template loaded successfully!");
  };

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const formatDateString = (timeStr: string) => {
    if (!timeStr) return '';
    try {
      const date = new Date(timeStr);
      if (isNaN(date.getTime())) return timeStr;
      return `${date.getDate()}. ${date.getMonth() + 1}. ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    } catch { return timeStr; }
  };

  const renderFormattedText = (text: string) => {
    if (!text) return null;
    return text.split(/(\*\*.*?\*\*|```python[\s\S]*?```)/g).map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="text-emerald-400 font-bold tracking-wide">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('```python') && part.endsWith('```')) {
        return <pre key={i} className="bg-red-950/30 text-red-400 border border-red-500/20 p-4 rounded-xl mt-2 mb-2 font-mono text-[10px] overflow-x-auto whitespace-pre-wrap">{part.slice(9, -3)}</pre>;
      }
      return part;
    });
  };

  const handleRunSimulation = async () => {
    setShowResults(false);
    setIsSimulating(true);
    setChallengeFailed(false);
    setAiInsight("");
    setLogs(["[INFO] Odesílám požadavek do Cloud Enginu..."]);
    
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
      
      const response = await fetch(`${API_URL}/api/run-backtest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
            code, pair, timeframe: "M15", capital: parseFloat(capital), currency, confidence: parseFloat(confidence)
        })
      });

      if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);

      const backendData = await response.json();
      const newMetrics = backendData.metrics || { totalTrades: 0, winRate: 0, profitFactor: 0, sharpeRatio: 0, maxDrawdown: 0, netProfit: 0 };
      
      setLogs(prev => [...prev, ...(backendData.logs || [])]);
      setMetrics(newMetrics);
      setChartData(backendData.equityCurve || []);
      setAiInsight(backendData.ai_insight || "");

      // ── PROP FIRM EVALUATOR LOGIC ──
      if (propFirmMode) {
        const dd = Math.abs(newMetrics.maxDrawdown);
        const maxLoss = parseFloat(capital) * 0.05; // 5% Daily Loss simulace
        if (dd >= 10.0 || newMetrics.netProfit <= -maxLoss) {
          setChallengeFailed(true);
        }
      }
      
    } catch (err) {
      setLogs(prev => [...prev, `[NETWORK ERROR] Selhalo spojení se serverem: ${err}`]);
      setAiInsight(`🚨 **Chyba spojení s backendem!** 🚨\n\nNelze se spojit se serverem. Zkontroluj proměnnou NEXT_PUBLIC_API_URL nebo zda server běží.`);
    } finally {
      setIsSimulating(false);
      setShowResults(true);
    }
  };

  const chartColor = challengeFailed ? "#ef4444" : "#10b981"; // Červená vs Zelená

  return (
    <div className="w-full flex flex-col xl:flex-row gap-10 mt-6 pb-20 relative">
      
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="fixed top-10 left-1/2 -translate-x-1/2 z-50 bg-emerald-500 text-black px-6 py-3 rounded-full font-bold shadow-[0_0_30px_rgba(16,185,129,0.4)]">
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="w-full xl:w-[40%] flex flex-col gap-6">
        <div className="bg-zinc-950/50 backdrop-blur-xl border border-white/10 rounded-[2rem] p-6 shadow-2xl relative flex flex-col h-full">
          <div className="flex items-center justify-between mb-6 border-b border-white/5 pb-4">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
              <h2 className="text-sm font-bold uppercase tracking-widest text-white">PYTHON STRATEGY</h2>
            </div>
            {/* Tlačítko Šablon */}
            <div className="relative">
              <button onClick={() => setShowTemplates(!showTemplates)} className="text-[10px] uppercase tracking-widest font-bold bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2 rounded-lg text-emerald-400 transition-colors">
                📂 Load Template
              </button>
              <AnimatePresence>
                {showTemplates && (
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="absolute right-0 top-10 w-48 bg-zinc-900 border border-white/10 rounded-xl shadow-2xl z-30 overflow-hidden flex flex-col">
                    <button onClick={() => loadTemplate("AI_XGBOOST")} className="text-xs text-left px-4 py-3 hover:bg-emerald-500/20 text-zinc-300 hover:text-emerald-400 transition-colors border-b border-white/5">🤖 AI XGBoost Core</button>
                    <button onClick={() => loadTemplate("MEAN_REVERSION")} className="text-xs text-left px-4 py-3 hover:bg-emerald-500/20 text-zinc-300 hover:text-emerald-400 transition-colors border-b border-white/5">📉 Mean Reversion</button>
                    <button onClick={() => loadTemplate("SMA_CROSSOVER")} className="text-xs text-left px-4 py-3 hover:bg-emerald-500/20 text-zinc-300 hover:text-emerald-400 transition-colors">📈 SMA Crossover</button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
          
          <div className="w-full h-[450px] min-h-[450px] border border-white/10 rounded-xl overflow-hidden relative shadow-inner">
            <div className="absolute top-0 left-0 w-full h-8 bg-[#1e1e1e] border-b border-white/5 flex items-center px-4 gap-2 z-10">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500/80"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></span>
              <span className="ml-4 text-[10px] text-zinc-400 font-mono tracking-widest">quant_bot.py</span>
            </div>
            <div className="w-full h-full pt-8">
              <Editor
                height="100%" width="100%" defaultLanguage="python" theme="vs-dark"
                value={code} onChange={(val) => setCode(val || '')}
                options={{ minimap: { enabled: false }, fontSize: 12, fontFamily: 'monospace', scrollBeyondLastLine: false }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="flex flex-col gap-2">
              <label className="text-[9px] font-bold text-zinc-500 tracking-widest uppercase">ACCOUNT CURRENCY</label>
              <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white font-mono outline-none">
                {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[9px] font-bold text-zinc-500 tracking-widest uppercase">INITIAL CAPITAL</label>
              <input type="number" value={capital} onChange={(e) => setCapital(e.target.value)} className="bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white font-mono outline-none" />
            </div>
            <div className="flex flex-col gap-2 col-span-2">
              <label className="text-[9px] font-bold text-zinc-500 tracking-widest uppercase">FOREX / METAL PAIR</label>
              <select value={pair} onChange={(e) => setPair(e.target.value)} className="bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white font-mono outline-none">
                {FOREX_PAIRS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            
            {/* PROP FIRM SWITCH */}
            <div className="flex flex-row items-center justify-between col-span-2 bg-red-950/20 border border-red-500/20 rounded-xl px-4 py-3 mt-2">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-red-400 tracking-widest uppercase">PROP FIRM STRICT MODE</span>
                <span className="text-[9px] text-zinc-500">Evaluates Max 10% DD & 5% Daily Loss</span>
              </div>
              <div onClick={() => setPropFirmMode(!propFirmMode)} className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors flex items-center ${propFirmMode ? 'bg-red-500' : 'bg-zinc-800'}`}>
                <motion.div layout className="w-4 h-4 bg-white rounded-full shadow-md" animate={{ x: propFirmMode ? 24 : 0 }} />
              </div>
            </div>
          </div>

          <button onClick={handleRunSimulation} disabled={isSimulating} className="w-full mt-6 py-4 bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs tracking-[0.2em] uppercase rounded-xl transition-all h-[52px] flex justify-center items-center shadow-[0_0_20px_rgba(16,185,129,0.3)] disabled:opacity-50">
            {isSimulating ? (
              <svg className="animate-spin h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            ) : "RUN AI SIMULATION"}
          </button>
        </div>
      </div>

      <div className="w-full xl:w-[60%] flex flex-col h-full min-h-[700px]">
        <AnimatePresence mode="wait">
          {!showResults && !isSimulating && (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col items-center justify-center border border-dashed border-white/10 rounded-[2rem] bg-white/[0.02]">
              <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">Awaiting Compilation...</p>
            </motion.div>
          )}

          {isSimulating && (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col border border-emerald-500/20 rounded-[2rem] bg-[#050505] shadow-[0_0_50px_rgba(16,185,129,0.1)] p-6 font-mono overflow-hidden">
              <div className="flex items-center justify-between mb-6 border-b border-white/5 pb-4">
                <div className="flex items-center gap-3">
                  <span className="animate-pulse w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]"></span>
                  <span className="text-[10px] text-zinc-400 tracking-widest uppercase">Executing Quant Engine</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-zinc-500 tracking-widest uppercase">Compute Time:</span>
                  <span className="text-xs font-bold text-emerald-400">{formatTimer(elapsedTime)}</span>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-2 text-xs">
                {logs.map((log, i) => ( 
                  <pre key={i} className={`whitespace-pre-wrap font-sans ${log.includes('SUCCESS') ? 'text-emerald-400 font-bold' : log.includes('ERROR') ? 'text-red-400 font-bold' : log.includes('INFO') ? 'text-blue-400' : log.includes('WARNING') ? 'text-yellow-400 font-bold' : 'text-zinc-400'}`}>{log}</pre> 
                ))}
                <div ref={terminalEndRef} />
              </div>
            </motion.div>
          )}

          {showResults && (
            <motion.div key="results" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex-1 flex flex-col gap-6">
              
              <div className="flex justify-between items-end mb-2">
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 w-full">
                  <div className="bg-black/40 border border-white/5 rounded-2xl p-4"><div className="text-[8px] font-bold text-zinc-500 uppercase mb-1">TOTAL TRADES</div><div className="text-xl font-black text-white">{metrics?.totalTrades ?? 0}</div></div>
                  <div className="bg-black/40 border border-white/5 rounded-2xl p-4"><div className="text-[8px] font-bold text-zinc-500 uppercase mb-1">WIN RATE</div><div className="text-xl font-black text-emerald-400">{(metrics?.winRate ?? 0).toFixed(1)}%</div></div>
                  <div className="bg-black/40 border border-white/5 rounded-2xl p-4"><div className="text-[8px] font-bold text-zinc-500 uppercase mb-1">PROFIT FACTOR</div><div className="text-xl font-black text-blue-400">{(metrics?.profitFactor ?? 0).toFixed(2)}x</div></div>
                  <div className={`border rounded-2xl p-4 ${challengeFailed ? 'bg-red-950/20 border-red-500/30' : 'bg-red-950/10 border-red-500/10'}`}><div className="text-[8px] font-bold text-zinc-500 uppercase mb-1">MAX DRAWDOWN</div><div className="text-xl font-black text-red-400">{metrics?.maxDrawdown ?? 0}%</div></div>
                  <div className="bg-emerald-950/10 border border-emerald-500/20 rounded-2xl p-4"><div className="text-[8px] font-bold text-zinc-500 uppercase mb-1">NET PROFIT</div><div className="text-xl font-black text-emerald-400">{(metrics?.netProfit ?? 0) > 0 ? '+' : ''}{(metrics?.netProfit ?? 0).toFixed(2)} {currency}</div></div>
                </div>
              </div>
              
              {/* TLAČÍTKO SDÍLENÍ */}
              <div className="flex justify-end">
                <button onClick={handleCopyReport} className="flex items-center gap-2 bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 border border-blue-500/30 px-5 py-2 rounded-xl text-[10px] font-bold tracking-widest uppercase transition-all shadow-[0_0_15px_rgba(59,130,246,0.2)]">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                  Share Results
                </button>
              </div>

              <div className={`w-full bg-zinc-950/50 border rounded-[2rem] p-6 relative overflow-hidden transition-colors ${challengeFailed ? 'border-red-500/50 shadow-[0_0_30px_rgba(239,68,68,0.1)]' : 'border-white/10'}`}>
                
                {/* PROP FIRM FAILED OVERLAY */}
                <AnimatePresence>
                  {challengeFailed && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 z-20 bg-red-950/40 backdrop-blur-[2px] flex items-center justify-center">
                      <motion.div initial={{ scale: 3, opacity: 0, rotate: -15 }} animate={{ scale: 1, opacity: 1, rotate: -15 }} transition={{ type: "spring", damping: 12, stiffness: 200, delay: 0.2 }} className="border-4 border-red-500 text-red-500 text-4xl lg:text-6xl font-black uppercase tracking-widest p-6 lg:p-8 rounded-3xl shadow-[0_0_100px_rgba(239,68,68,0.8)] bg-black/80 whitespace-nowrap">
                        ❌ CHALLENGE FAILED
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={chartData || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colEq" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={chartColor} stopOpacity={challengeFailed ? 0.6 : 0.4}/>
                        <stop offset="95%" stopColor={chartColor} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff0a" vertical={false} />
                    <XAxis dataKey="time" stroke="#ffffff30" tick={{ fill: '#71717a', fontSize: 10 }} tickFormatter={formatDateString} />
                    <YAxis domain={['auto', 'auto']} stroke="#ffffff30" tick={{ fill: '#71717a', fontSize: 10 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#09090b', borderColor: '#ffffff20' }} itemStyle={{ color: chartColor, fontWeight: 'bold' }} />
                    <Area type="monotone" dataKey="equity" stroke={chartColor} strokeWidth={challengeFailed ? 4 : 2} fillOpacity={1} fill="url(#colEq)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {aiInsight && (
                <div className={`w-full bg-zinc-950/60 border rounded-[2rem] p-8 relative ${challengeFailed ? 'border-red-500/30' : 'border-white/10'}`}>
                  <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r opacity-70 ${challengeFailed ? 'from-red-500/20 via-red-500/80 to-red-500/20' : 'from-emerald-500/20 via-emerald-400/80 to-emerald-500/20'}`}></div>
                  <div className="flex items-center gap-3 mb-6 border-b border-white/5 pb-4">
                    <span className="text-xl">{challengeFailed ? '🚨' : '✨'}</span><h3 className={`text-sm font-bold uppercase ${challengeFailed ? 'text-red-400' : 'text-emerald-400'}`}>AI Quant Insights</h3>
                  </div>
                  <div className="text-zinc-300 text-sm leading-relaxed font-sans whitespace-pre-wrap">
                    {renderFormattedText(aiInsight)}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}