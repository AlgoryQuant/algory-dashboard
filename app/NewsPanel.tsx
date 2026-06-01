"use client";

import React, { useState, useEffect } from 'react';

interface NewsItem { title: string; publisher: string; link: string; time: string; sentiment: 'positive' | 'negative' | 'neutral'; }
interface WhaleAlert { id: string; text: string; type: 'bullish' | 'bearish' | 'neutral'; time: string; amountUsd: string; }

const FOREX_NEWS_MOCK: NewsItem[] = [
  { title: "Fed Chair Powell hints at maintaining higher rates for longer.", publisher: "Bloomberg", link: "#", time: "14:30", sentiment: "negative" },
  { title: "EUR/USD rallies as ECB downplays immediate rate cut risks.", publisher: "FXStreet", link: "#", time: "11:15", sentiment: "positive" },
  { title: "Gold prices stabilize amid fluctuating US bond yields.", publisher: "ForexLive", link: "#", time: "09:45", sentiment: "neutral" },
  { title: "BoE holds interest rates steady, sterling remains firm.", publisher: "Bloomberg", link: "#", time: "08:00", sentiment: "positive" }
];

const CRYPTO_NEWS_MOCK: NewsItem[] = [
  { title: "Bitcoin breaks key resistance as institutional inflows surge.", publisher: "CoinDesk", link: "#", time: "15:20", sentiment: "positive" },
  { title: "Ethereum gas fees hit new lows following latest network upgrade.", publisher: "Decrypt", link: "#", time: "13:05", sentiment: "positive" },
  { title: "SEC delays decision on spot Altcoin ETFs citing market volatility.", publisher: "CoinTelegraph", link: "#", time: "10:30", sentiment: "negative" }
];

const WHALE_ALERTS_MOCK: WhaleAlert[] = [
  { id: "W1", text: "10,500 BTC transferred from Unknown Wallet to Binance", type: "bearish", time: "Just now", amountUsd: "$680.5M" },
  { id: "W2", text: "250,000 ETH transferred from Coinbase to Unknown Wallet", type: "bullish", time: "12 mins ago", amountUsd: "$862.1M" },
  { id: "W3", text: "50,000,000 XRP transferred from Ripple Escrow to Unknown Wallet", type: "neutral", time: "45 mins ago", amountUsd: "$29.5M" },
  { id: "W4", text: "4,200 BTC transferred from Kraken to Unknown Wallet", type: "bullish", time: "1 hour ago", amountUsd: "$272.3M" }
];

interface NewsPanelProps {
  marketMode: 'FOREX' | 'CRYPTO' | null;
  rightPanelMode: 'news' | 'whales';
  setRightPanelMode: (mode: 'news' | 'whales') => void;
}

const LiveWhalesPanel = () => {
  const [whales, setWhales] = useState<WhaleAlert[]>(WHALE_ALERTS_MOCK);

  useEffect(() => {
    const interval = setInterval(() => {
      const assets = ['BTC', 'ETH', 'SOL', 'XRP', 'DOGE', 'USDT', 'USDC', 'ADA'];
      const types: ('bullish' | 'bearish' | 'neutral')[] = ['bullish', 'bearish', 'neutral'];
      const actions = ['transferred from Unknown Wallet to', 'transferred from', 'minted at', 'burned at'];
      const exchanges = ['Binance', 'Coinbase', 'Kraken', 'Unknown Wallet', 'Ripple Escrow'];
      
      const asset = assets[Math.floor(Math.random() * assets.length)];
      const type = types[Math.floor(Math.random() * types.length)];
      const action = actions[Math.floor(Math.random() * actions.length)];
      const exchange = exchanges[Math.floor(Math.random() * exchanges.length)];
      
      let amount = 0;
      if (asset === 'BTC') amount = Math.floor(Math.random() * 5000) + 100;
      else if (asset === 'ETH') amount = Math.floor(Math.random() * 50000) + 1000;
      else amount = Math.floor(Math.random() * 50000000) + 1000000;

      const newAlert: WhaleAlert = {
        id: `W-${Date.now()}`,
        text: `${amount.toLocaleString()} ${asset} ${action} ${exchange}`,
        type,
        time: 'Just now',
        amountUsd: `$${(Math.random() * 900 + 10).toFixed(1)}M`
      };

      setWhales(prev => [newAlert, ...prev.slice(0, 4)]);
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col gap-4">
      {whales.map((alert) => (
        <div key={alert.id} className="block pb-5 border-b border-white/5 last:border-0 last:pb-0 animate-in fade-in slide-in-from-top-4 duration-700 ease-out">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-zinc-400 font-mono bg-black/60 px-2 py-1 rounded-md border border-white/5 shadow-inner">
                {alert.time}
              </span>
              <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-md border shadow-inner ${
                alert.type === 'bullish' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' :
                alert.type === 'bearish' ? 'text-red-400 bg-red-500/10 border-red-500/20' :
                'text-zinc-400 bg-zinc-500/10 border-zinc-500/20'
              }`}>
                {alert.type}
              </span>
            </div>
            <span className="text-[10px] font-mono font-bold text-white/90">{alert.amountUsd}</span>
          </div>
          <h4 className="text-sm font-medium text-white/70 leading-relaxed mt-1">
            {alert.text}
          </h4>
        </div>
      ))}
    </div>
  );
};

export default function NewsPanel({ marketMode, rightPanelMode, setRightPanelMode }: NewsPanelProps) {
  const displayedNews = marketMode === 'FOREX' ? FOREX_NEWS_MOCK : CRYPTO_NEWS_MOCK;

  return (
    <div className="w-full xl:w-80 flex-shrink-0 flex flex-col sticky top-8">
      <div className="bg-[#0a0a0a]/80 backdrop-blur-2xl border border-white/5 rounded-[2rem] overflow-hidden shadow-2xl transition-all duration-300 flex flex-col max-h-[85vh]">
        <div className="px-6 py-6 border-b border-white/5 bg-white/[0.01]">
          <div className="flex w-full bg-black/60 rounded-xl p-1 border border-white/5">
            <button 
              onClick={() => setRightPanelMode('news')} 
              className={`flex-1 text-[10px] font-bold tracking-widest uppercase py-2 rounded-lg transition-all ${rightPanelMode === 'news' ? 'bg-white/10 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              MARKET NEWS
            </button>
            {marketMode === 'CRYPTO' && (
              <button 
                onClick={() => setRightPanelMode('whales')} 
                className={`flex-1 text-[10px] font-bold tracking-widest uppercase py-2 rounded-lg transition-all flex items-center justify-center gap-2 ${rightPanelMode === 'whales' ? 'bg-white/10 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                WHALES 🚨
              </button>
            )}
          </div>
        </div>
        
        <div className="flex flex-col p-4 overflow-y-auto custom-scrollbar flex-1 relative min-h-[300px]">
          {rightPanelMode === 'news' ? (
            displayedNews && displayedNews.length > 0 ? (
              displayedNews.map((item, idx) => (
                <a key={idx} href={item.link} target="_blank" rel="noreferrer" className="block pb-5 mb-5 border-b border-white/5 last:border-0 last:mb-0 last:pb-0 group animate-in fade-in">
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-2 h-2 rounded-full ${item.sentiment === 'positive' ? 'bg-emerald-500' : item.sentiment === 'negative' ? 'bg-red-500' : 'bg-zinc-500'}`} title={`Sentiment: ${item.sentiment}`} />
                    <span className="text-[10px] text-zinc-400 font-mono bg-black/60 px-2 py-1 rounded-md border border-white/5 shadow-inner">
                      {item.time}
                    </span>
                    <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-md border shadow-inner ${
                      item.publisher.toUpperCase() === 'COINDESK' ? 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' :
                      item.publisher.toUpperCase() === 'FXSTREET' ? 'text-blue-400 bg-blue-500/10 border-blue-500/20' :
                      'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                    }`}>
                      {item.publisher}
                    </span>
                  </div>
                  <h4 className="text-sm font-medium text-white/70 leading-relaxed group-hover:text-white transition-colors mt-1">
                    {item.title}
                  </h4>
                </a>
              ))
            ) : (
              <div className="p-10 text-center text-[10px] text-zinc-500 font-bold uppercase tracking-widest flex flex-col items-center gap-4">
                <svg className="animate-spin h-6 w-6 text-zinc-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                SYSTEM SCANNING...
              </div>
            )
          ) : (
            <LiveWhalesPanel />
          )}
        </div>
      </div>
    </div>
  );
}