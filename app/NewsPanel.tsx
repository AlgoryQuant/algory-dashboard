"use client";

import React from 'react';
import { motion } from 'framer-motion';

const FOREX_NEWS_MOCK = [
  { title: "Fed Chair Powell hints at maintaining higher rates for longer.", publisher: "Bloomberg", link: "https://www.bloomberg.com/markets", time: "14:30" },
  { title: "EUR/USD rallies as ECB downplays immediate rate cut risks.", publisher: "FXStreet", link: "https://www.fxstreet.com/", time: "11:15" },
];

export default function NewsPanel({ marketMode, rightPanelMode, setRightPanelMode }: any) {
  const displayedNews = FOREX_NEWS_MOCK; // V tvém kódu použij reálné

  return (
    <div className="w-full xl:w-80 flex-shrink-0 flex flex-col sticky top-8 z-10 font-sans">
      <motion.div layout className="bg-transparent border border-white/5 rounded-xl overflow-hidden flex flex-col max-h-[85vh]">
        
        {/* Přepínač News/Whales */}
        <div className="p-4 border-b border-white/5">
          <div className="flex w-full bg-white/[0.02] border border-white/5 rounded-lg p-1">
            <button className="flex-1 text-[10px] font-medium tracking-widest uppercase py-2 rounded-md bg-white/10 text-white">
              Market News
            </button>
          </div>
        </div>
        
        {/* Výpis zpráv */}
        <div className="flex flex-col p-4 overflow-y-auto custom-scrollbar flex-1 relative min-h-[300px]">
          {displayedNews.map((item, idx) => (
            <motion.a 
              layout initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} key={idx} 
              href={item.link} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="group block p-4 mb-3 bg-transparent border border-white/5 hover:border-white/20 rounded-xl cursor-pointer transition-all duration-200"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest">{item.time}</span>
                <span className="text-[9px] font-medium uppercase tracking-widest px-2 py-0.5 rounded border border-white/10 text-zinc-400 group-hover:text-white transition-colors">
                  {item.publisher}
                </span>
              </div>
              <h4 className="text-sm font-medium text-zinc-300 leading-relaxed group-hover:text-white transition-colors mt-1">
                {item.title}
              </h4>
            </motion.a>
          ))}
        </div>
      </motion.div>
    </div>
  );
}