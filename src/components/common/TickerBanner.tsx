import React from 'react';
import { motion } from 'framer-motion';

const TICKER_ITEMS = [
  { symbol: 'XAUUSD', name: 'GOLD', price: '2,384.50', change: '+1.24%', up: true },
  { symbol: 'EURUSD', name: 'EURO', price: '1.0854', change: '+0.15%', up: true },
  { symbol: 'GBPUSD', name: 'CABLE', price: '1.2740', change: '-0.22%', up: false },
  { symbol: 'US30', name: 'DOW JONES', price: '39,120.00', change: '+0.45%', up: true },
  { symbol: 'NAS100', name: 'NASDAQ', price: '19,840.50', change: '+0.82%', up: true },
  { symbol: 'BTCUSD', name: 'BITCOIN', price: '64,250.00', change: '-1.10%', up: false },
  { symbol: 'USDTWD', name: 'DXY', price: '104.30', change: '-0.08%', up: false },
];

export const TickerBanner: React.FC = () => {
  return (
    <div className="h-7 bg-[#050609] border-b border-white/[0.06] flex items-center overflow-hidden shrink-0 select-none">
      <div className="bg-[#6366f1]/20 border-r border-[#6366f1]/30 px-3 h-full flex items-center gap-1.5 shrink-0 z-10">
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
        <span className="text-[9px] font-mono font-bold text-[#818cf8] uppercase tracking-wider">MARKETS</span>
      </div>

      <div className="flex-1 overflow-hidden relative flex items-center">
        <motion.div
          animate={{ x: ['0%', '-50%'] }}
          transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
          className="flex items-center gap-6 whitespace-nowrap"
        >
          {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, idx) => (
            <div key={idx} className="flex items-center gap-2 text-[10px] font-mono">
              <span className="font-bold text-slate-300">{item.symbol}</span>
              <span className="text-slate-400">{item.price}</span>
              <span className={`font-bold ${item.up ? 'text-emerald-400' : 'text-red-400'}`}>
                {item.change}
              </span>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
};
