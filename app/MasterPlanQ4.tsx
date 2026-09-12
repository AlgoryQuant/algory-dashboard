"use client";

import { useState } from 'react';
import { motion, Variants } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

// --- DATA STRUCTURES ---
const ALLOCATION_DATA = [
  { 
    id: 'NEE', 
    name: 'NextEra Energy', 
    allocation: 25, 
    sector: 'Utility', 
    desc: 'Stabilní defenziva a zelená energie. Profit z nižších sazeb Fedu, jistota a dividenda.',
    color: '#3b82f6' // Blue
  },
  { 
    id: 'TGT', 
    name: 'Target Corp', 
    allocation: 25, 
    sector: 'Retail', 
    desc: 'Král vánoční sezóny. Útěk spotřebitelů k levnějšímu zboží. Zotavení z propadů.',
    color: '#ef4444' // Red
  },
  { 
    id: 'PFE', 
    name: 'Pfizer', 
    allocation: 20, 
    sector: 'Healthcare', 
    desc: 'Defenzivní štít imunní vůči krizím. Fundamentálně levná akcie.',
    color: '#10b981' // Emerald
  },
  { 
    id: 'SYM', 
    name: 'Symbotic', 
    allocation: 15, 
    sector: 'Logistics/AI', 
    desc: 'Růstový motor. Robotizace skladů klíčová pro Q4 nákupní horečku.',
    color: '#f59e0b' // Amber
  },
  { 
    id: 'NVO', 
    name: 'Novo Nordisk', 
    allocation: 15, 
    sector: 'Pharma', 
    desc: 'Extrémní poptávka po lécích na hubnutí (Wegovy). Monopolní síla.',
    color: '#8b5cf6' // Purple
  }
];

// --- ANIMATION VARIANTS ---
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.15, ease: "easeOut" }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } }
};

export default function MasterPlanQ4() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-[#0a0a0a] border border-white/10 p-3 rounded-xl shadow-2xl backdrop-blur-md">
          <p className="text-white font-bold text-xs tracking-wide flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: data.color }}></span>
            {data.id}
          </p>
          <p className="text-zinc-400 text-[10px] mt-1">{data.sector}</p>
          <p className="text-white text-xs font-mono font-bold mt-2">{data.allocation}%</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-full w-full bg-[#000000] text-zinc-200 font-sans p-4 md:p-8 lg:p-12 overflow-hidden selection:bg-zinc-800">
      <motion.div 
        className="max-w-7xl mx-auto w-full flex flex-col gap-12"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        
        {/* 1. HERO SECTION */}
        <motion.section variants={itemVariants} className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-white">
              Q4 Master Plan 2026
            </h1>
            <p className="text-sm md:text-base text-zinc-500 max-w-2xl font-light tracking-wide">
              Taktická alokace kapitálu a ochrana před volatilitou během US voleb.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl mt-2">
            <div className="bg-[#050505] border border-white/10 rounded-2xl p-5 flex flex-col gap-1 shadow-inner relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 relative z-10">Celkový kapitál</span>
              <span className="text-2xl font-black text-white font-mono tracking-tight relative z-10">40 000 CZK</span>
            </div>
            <div className="bg-[#050505] border border-white/10 rounded-2xl p-5 flex flex-col gap-1 shadow-inner relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 relative z-10">Cílový Take-Profit</span>
              <span className="text-xl font-bold text-white tracking-tight mt-1 relative z-10">Polovina prosince 2026</span>
            </div>
          </div>
        </motion.section>

        <div className="w-full h-px bg-white/10 my-2"></div>

        {/* 2. INTERAKTIVNÍ ALOKACE */}
        <motion.section variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          <div className="lg:col-span-5 h-[350px] relative bg-[#050505] border border-white/10 rounded-3xl p-6 shadow-inner">
            <h3 className="absolute top-6 left-6 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
              Distribuční Model
            </h3>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={ALLOCATION_DATA}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={110}
                  paddingAngle={4}
                  dataKey="allocation"
                  stroke="none"
                  cursor="crosshair"
                  onMouseEnter={(_: any, index: number) => setActiveIndex(index)}
                  onMouseLeave={() => setActiveIndex(null)}
                >
                  {ALLOCATION_DATA.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.color} 
                      fillOpacity={activeIndex === null || activeIndex === index ? 1 : 0.2}
                      stroke="none"
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-2">
              <span className="text-xs text-zinc-500 font-bold uppercase tracking-widest">Assets</span>
              <span className="text-2xl font-black text-white font-mono">{ALLOCATION_DATA.length}</span>
            </div>
          </div>

          <div className="lg:col-span-7 flex flex-col gap-3">
            {ALLOCATION_DATA.map((item, index) => (
              <div 
                key={item.id}
                onMouseEnter={() => setActiveIndex(index)}
                onMouseLeave={() => setActiveIndex(null)}
                className={`p-4 rounded-2xl border transition-all duration-300 flex flex-col sm:flex-row sm:items-center gap-4 cursor-crosshair ${
                  activeIndex === index 
                    ? 'border-white/20 bg-white/[0.03] shadow-[0_0_20px_rgba(255,255,255,0.02)]' 
                    : 'border-white/5 bg-[#050505] hover:border-white/10'
                }`}
              >
                <div className="flex items-center gap-4 min-w-[120px]">
                  <div 
                    className="w-1.5 h-8 rounded-full transition-colors duration-300"
                    style={{ backgroundColor: activeIndex === null || activeIndex === index ? item.color : '#27272a' }}
                  ></div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-white tracking-wide">{item.id}</span>
                    <span className="text-[10px] text-zinc-500 font-mono mt-0.5">{item.allocation}%</span>
                  </div>
                </div>
                <div className="flex-1">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 block mb-1">
                    {item.sector}
                  </span>
                  <p className="text-xs text-zinc-500 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </motion.section>

        {/* 3. ČASOVÁ OSA EXEKUCE */}
        <motion.section variants={itemVariants} className="flex flex-col gap-8 bg-[#050505] border border-white/10 rounded-3xl p-6 md:p-10 shadow-inner">
          <div className="flex flex-col gap-1">
            <h3 className="text-lg font-bold text-white tracking-tight">Architektura Exekuce</h3>
            <p className="text-xs text-zinc-500 uppercase tracking-widest font-bold">Časový harmonogram nasazení kapitálu</p>
          </div>

          <div className="relative pl-6 md:pl-8 border-l border-white/10 flex flex-col gap-10 mt-4">
            
            {/* Phase 1 */}
            <div className="relative group">
              <div className="absolute -left-[37px] md:-left-[45px] top-0.5 bg-[#000000] p-1.5 rounded-full border border-white/10 group-hover:border-blue-500/50 transition-colors">
                <svg className="w-3.5 h-3.5 text-zinc-400 group-hover:text-blue-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex flex-col sm:flex-row sm:items-baseline gap-2">
                  <span className="text-sm font-bold text-white">Fáze 1: Září</span>
                  <span className="text-[10px] uppercase tracking-widest font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20 w-fit">
                    Tiché budování
                  </span>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed max-w-2xl">
                  Alokace <span className="text-white font-mono font-bold">10 000 CZK</span>. DCA nákupy po <span className="font-mono text-white">2 500 CZK</span> týdně. Makroekonomické prostředí zůstává nejisté, minimalizujeme tržní expozici.
                </p>
              </div>
            </div>

            {/* Phase 2 */}
            <div className="relative group">
              <div className="absolute -left-[37px] md:-left-[45px] top-0.5 bg-[#000000] p-1.5 rounded-full border border-white/10 group-hover:border-red-500/50 transition-colors">
                <svg className="w-3.5 h-3.5 text-zinc-400 group-hover:text-red-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <circle cx="12" cy="12" r="10"></circle>
                  <circle cx="12" cy="12" r="3"></circle>
                  <line x1="12" y1="2" x2="12" y2="5"></line>
                  <line x1="12" y1="19" x2="12" y2="22"></line>
                  <line x1="2" y1="12" x2="5" y2="12"></line>
                  <line x1="19" y1="12" x2="22" y2="12"></line>
                </svg>
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex flex-col sm:flex-row sm:items-baseline gap-2">
                  <span className="text-sm font-bold text-white">Fáze 2: Polovina října</span>
                  <span className="text-[10px] uppercase tracking-widest font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20 w-fit">
                    Snajperský úder
                  </span>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed max-w-2xl">
                  Alokace <span className="text-white font-mono font-bold">20 000 CZK</span>. Nákup strachu: Aktivace enginu pouze pokud index <span className="font-mono text-white border-b border-white/20">VIX &gt; 25</span>, nebo při hlubokém propadu referenčních akcií o 5-7 %.
                </p>
              </div>
            </div>

            {/* Phase 3 */}
            <div className="relative group">
              <div className="absolute -left-[37px] md:-left-[45px] top-0.5 bg-[#000000] p-1.5 rounded-full border border-white/10 group-hover:border-emerald-500/50 transition-colors">
                <svg className="w-3.5 h-3.5 text-zinc-400 group-hover:text-emerald-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
                  <polyline points="17 6 23 6 23 12"></polyline>
                </svg>
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex flex-col sm:flex-row sm:items-baseline gap-2">
                  <span className="text-sm font-bold text-white">Fáze 3: Listopad / Prosinec</span>
                  <span className="text-[10px] uppercase tracking-widest font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 w-fit">
                    Relief Rally
                  </span>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed max-w-2xl">
                  Alokace <span className="text-white font-mono font-bold">10 000 CZK</span>. Volby skončily, trh absorbuje data a startuje vánoční růst. Optimalizace pozic a aktivní příprava na Take-Profit.
                </p>
              </div>
            </div>

          </div>
        </motion.section>

        {/* 4. SCÉNÁŘE RIZIKA */}
        <motion.section variants={itemVariants} className="flex flex-col gap-6">
          <div className="flex flex-col gap-1 px-2">
            <h3 className="text-lg font-bold text-white tracking-tight">Metriky Rizika & Odměny</h3>
            <p className="text-xs text-zinc-500 uppercase tracking-widest font-bold">Pravděpodobnostní modely vývoje</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Green Scenario */}
            <div className="bg-[#050505] border border-white/10 hover:border-emerald-500/40 hover:bg-emerald-950/10 transition-all duration-300 rounded-2xl p-6 flex flex-col gap-4 shadow-inner group">
              <div className="flex justify-between items-start">
                <div className="p-2 bg-white/5 border border-white/10 rounded-lg group-hover:bg-emerald-500/10 group-hover:border-emerald-500/30 transition-colors">
                  <svg className="w-4 h-4 text-zinc-400 group-hover:text-emerald-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
                    <polyline points="17 6 23 6 23 12"></polyline>
                  </svg>
                </div>
                <span className="text-[10px] font-mono font-bold text-emerald-400 tracking-widest">+12% TO +15%</span>
              </div>
              <div>
                <h4 className="text-white font-bold text-sm tracking-wide mb-1">Optimistický Scénář</h4>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  Trh po amerických volbách strmě roste. Strach opadá a začíná masivní nákupní horečka (Santa Rally).
                </p>
              </div>
            </div>

            {/* Yellow Scenario */}
            <div className="bg-[#050505] border border-white/10 hover:border-yellow-500/40 hover:bg-yellow-950/10 transition-all duration-300 rounded-2xl p-6 flex flex-col gap-4 shadow-inner group">
              <div className="flex justify-between items-start">
                <div className="p-2 bg-white/5 border border-white/10 rounded-lg group-hover:bg-yellow-500/10 group-hover:border-yellow-500/30 transition-colors">
                  <svg className="w-4 h-4 text-zinc-400 group-hover:text-yellow-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                  </svg>
                </div>
                <span className="text-[10px] font-mono font-bold text-yellow-400 tracking-widest">+7% TO +10%</span>
              </div>
              <div>
                <h4 className="text-white font-bold text-sm tracking-wide mb-1">Reálný Scénář</h4>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  Standardní předvánoční růst trhu spojený s mírnou korekcí bezprostředně po volbách. Fundament drží.
                </p>
              </div>
            </div>

            {/* Red Scenario */}
            <div className="bg-[#050505] border border-white/10 hover:border-red-500/40 hover:bg-red-950/10 transition-all duration-300 rounded-2xl p-6 flex flex-col gap-4 shadow-inner group">
              <div className="flex justify-between items-start">
                <div className="p-2 bg-white/5 border border-white/10 rounded-lg group-hover:bg-red-500/10 group-hover:border-red-500/30 transition-colors">
                  <svg className="w-4 h-4 text-zinc-400 group-hover:text-red-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                  </svg>
                </div>
                <span className="text-[10px] font-mono font-bold text-red-400 tracking-widest">-2% TO -5% MAX</span>
              </div>
              <div>
                <h4 className="text-white font-bold text-sm tracking-wide mb-1">Pesimistický Scénář</h4>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  Makroekonomický šok. Silná defenzivní povaha zvolených aktiv (NEE, PFE) působí jako tlumič a limituje ztráty.
                </p>
              </div>
            </div>

          </div>
        </motion.section>

      </motion.div>
    </div>
  );
}