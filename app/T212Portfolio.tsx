"use client";

import React, { useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

interface PortfolioPosition {
  id: string;
  name: string;
  ticker: string;
  allocation: number;
  value: number;
  pnl: number;
  pnlPercent: number;
  color: string;
}

export default function T212Portfolio() {
  // MOCK DATA: Simulace T212 Koláče
  const [positions] = useState<PortfolioPosition[]>([
    { id: '1', name: 'Vanguard S&P 500', ticker: 'VUSA', allocation: 50, value: 62715, pnl: 6968, pnlPercent: 12.5, color: '#3f3f46' }, // Zinc-700
    { id: '2', name: 'Invesco Nasdaq 100', ticker: 'EQQQ', allocation: 30, value: 37629, pnl: 5792, pnlPercent: 18.2, color: '#3b82f6' }, // Blue-500
    { id: '3', name: 'Apple Inc.', ticker: 'AAPL', allocation: 20, value: 25086, pnl: 6092, pnlPercent: 32.1, color: '#10b981' }  // Emerald-500
  ]);

  const totalValue = positions.reduce((acc, pos) => acc + pos.value, 0);
  const totalPnL = positions.reduce((acc, pos) => acc + pos.pnl, 0);
  const investedAmount = totalValue - totalPnL;
  const totalReturnPercent = (totalPnL / investedAmount) * 100;

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-[#0a0a0a] border border-white/10 p-3 rounded-xl shadow-2xl backdrop-blur-md">
          <p className="text-white font-bold text-xs tracking-wide">{data.name}</p>
          <p className="text-zinc-400 text-[10px] font-mono mt-1">{data.allocation}% Allocation</p>
          <p className="text-emerald-400 text-[10px] font-mono font-bold">+{data.pnlPercent}% Return</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full flex flex-col gap-6 animate-in fade-in duration-700 max-w-6xl mx-auto">
      
      <div className="flex items-center gap-3 mb-2 px-2">
        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
        </svg>
        <h2 className="text-2xl font-bold text-white tracking-tight">Investment Portfolio</h2>
        <span className="px-2 py-1 bg-white/5 border border-white/10 rounded-md text-[9px] font-bold uppercase tracking-widest text-zinc-500 ml-2">T212 SYNCHRONIZED</span>
      </div>

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#050505] border border-white/10 rounded-2xl p-6 shadow-inner flex flex-col">
          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-2">Total Value (CZK)</span>
          <span className="text-3xl font-black text-white font-mono tracking-tight">{totalValue.toLocaleString('cs-CZ')} Kč</span>
        </div>
        <div className="bg-[#050505] border border-white/10 rounded-2xl p-6 shadow-inner flex flex-col">
          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-2">Invested Amount</span>
          <span className="text-3xl font-black text-zinc-300 font-mono tracking-tight">{investedAmount.toLocaleString('cs-CZ')} Kč</span>
        </div>
        <div className="bg-[#050505] border border-white/10 rounded-2xl p-6 shadow-inner flex flex-col">
          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-2">Total Return</span>
          <span className={`text-3xl font-black font-mono tracking-tight ${totalReturnPercent >= 0 ? 'text-emerald-400 drop-shadow-[0_0_10px_rgba(16,185,129,0.3)]' : 'text-red-400'}`}>
            {totalReturnPercent >= 0 ? '+' : ''}{totalReturnPercent.toFixed(2)}%
          </span>
        </div>
      </div>

      {/* CHART & DETAILS SPLIT */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        
        {/* DONUT CHART */}
        <div className="bg-[#050505] border border-white/10 rounded-3xl p-6 flex flex-col items-center justify-center min-h-[350px] shadow-inner relative">
          <div className="absolute top-6 left-6 text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Allocation Pie</div>
          <div className="w-full h-full max-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={positions}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={110}
                  paddingAngle={5}
                  dataKey="allocation"
                  stroke="none"
                >
                  {positions.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          {/* Center Text inside Donut */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-2">
             <span className="text-xs text-zinc-500 font-bold uppercase tracking-widest">Assets</span>
             <span className="text-xl font-black text-white">{positions.length}</span>
          </div>
        </div>

        {/* POSITIONS TABLE */}
        <div className="bg-[#050505] border border-white/10 rounded-3xl p-6 flex flex-col shadow-inner overflow-hidden">
          <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-6">Holding Breakdown</div>
          
          <div className="flex-1 w-full overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 text-[9px] uppercase tracking-widest text-zinc-500">
                  <th className="pb-3 font-semibold w-10">Color</th>
                  <th className="pb-3 font-semibold">Instrument</th>
                  <th className="pb-3 font-semibold text-right">Allocation</th>
                  <th className="pb-3 font-semibold text-right">Value (CZK)</th>
                  <th className="pb-3 font-semibold text-right">Return</th>
                </tr>
              </thead>
              <tbody>
                {positions.map((pos) => (
                  <tr key={pos.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors">
                    <td className="py-4">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: pos.color }}></div>
                    </td>
                    <td className="py-4">
                      <div className="flex flex-col">
                        <span className="text-white text-xs font-bold tracking-wide">{pos.name}</span>
                        <span className="text-zinc-500 text-[10px] font-mono mt-0.5">{pos.ticker}</span>
                      </div>
                    </td>
                    <td className="py-4 text-right">
                      <span className="text-zinc-300 text-xs font-mono">{pos.allocation}%</span>
                    </td>
                    <td className="py-4 text-right">
                      <span className="text-white text-xs font-mono font-medium">{pos.value.toLocaleString('cs-CZ')}</span>
                    </td>
                    <td className="py-4 text-right">
                      <span className={`text-xs font-mono font-bold ${pos.pnlPercent >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {pos.pnlPercent >= 0 ? '+' : ''}{pos.pnlPercent}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}