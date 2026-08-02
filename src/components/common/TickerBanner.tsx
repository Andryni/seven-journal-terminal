import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useTrades } from '../../features/trades/useTrades';

export const TickerBanner: React.FC = () => {
  const { trades } = useTrades();

  // Dynamically calculate ticker items from actual trades recorded in journal
  const tickerItems = useMemo(() => {
    if (!trades || trades.length === 0) {
      return [
        { symbol: 'XAUUSD', direction: 'BUY', result: 'TP', pnl: '+$250.00', r: '+2.5R', up: true },
        { symbol: 'EURUSD', direction: 'SELL', result: 'SL', pnl: '-$100.00', r: '-1.0R', up: false },
        { symbol: 'US30', direction: 'BUY', result: 'TP', pnl: '+$450.00', r: '+3.0R', up: true },
      ];
    }

    return trades.slice(0, 10).map(t => {
      const pnlVal = t.pnl ?? 0;
      const isPositive = pnlVal >= 0;
      const rVal = t.r_multiple !== null && t.r_multiple !== undefined ? `${t.r_multiple >= 0 ? '+' : ''}${t.r_multiple.toFixed(1)}R` : '';
      const pnlStr = t.pnl !== null && t.pnl !== undefined ? `${isPositive ? '+' : ''}$${t.pnl.toFixed(2)}` : 'OPEN';

      return {
        id: t.id,
        symbol: t.pair,
        direction: t.direction,
        result: t.result || (t.exit_time ? 'CLOSED' : 'OPEN'),
        pnl: pnlStr,
        r: rVal,
        up: isPositive,
        date: new Date(t.entry_time).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }),
      };
    });
  }, [trades]);

  const itemsToDisplay = [...tickerItems, ...tickerItems];

  return (
    <div className="h-7 bg-[#050609] border-b border-white/[0.06] flex items-center overflow-hidden shrink-0 select-none">
      <div className="bg-[#6366f1]/20 border-r border-[#6366f1]/30 px-3 h-full flex items-center gap-1.5 shrink-0 z-10">
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
        <span className="text-[9px] font-mono font-bold text-[#818cf8] uppercase tracking-wider">LIVE TRADES</span>
      </div>

      <div className="flex-1 overflow-hidden relative flex items-center">
        <motion.div
          animate={{ x: ['0%', '-50%'] }}
          transition={{ duration: Math.max(15, tickerItems.length * 5), repeat: Infinity, ease: 'linear' }}
          className="flex items-center gap-6 whitespace-nowrap"
        >
          {itemsToDisplay.map((item, idx) => (
            <div key={`${item.symbol}-${idx}`} className="flex items-center gap-2 text-[10px] font-mono">
              <span className="font-bold text-slate-200">{item.symbol}</span>
              <span className={`text-[9px] font-bold px-1 py-0.2 rounded ${item.direction === 'BUY' ? 'text-emerald-400 bg-emerald-500/10' : 'text-indigo-400 bg-indigo-500/10'}`}>
                {item.direction}
              </span>
              <span className="text-slate-400 font-medium">{item.pnl}</span>
              {item.r && (
                <span className={`font-bold ${item.up ? 'text-emerald-400' : 'text-red-400'}`}>
                  ({item.r})
                </span>
              )}
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
};
