import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import type { Trade } from '../trades/useTrades';

interface SessionHeatmapProps {
  trades: Trade[];
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

// ─── Component ────────────────────────────────────────────────────────────────

export const SessionHeatmap: React.FC<SessionHeatmapProps> = ({ trades }) => {
  // Build heatmap data: dayOfWeek (0=Mon) × hour → { totalPnL, count }
  const heatData = useMemo(() => {
    const grid: Record<string, { totalPnL: number; count: number }> = {};

    trades.forEach(t => {
      if (!t.exit_time || t.pnl === null) return;
      const d = new Date(t.exit_time);
      // getDay() returns 0=Sun…6=Sat → convert to Mon=0…Sun=6
      const rawDay = d.getDay();
      const dayIdx = rawDay === 0 ? 6 : rawDay - 1;
      const hour = d.getHours();
      const key = `${dayIdx}-${hour}`;
      if (!grid[key]) grid[key] = { totalPnL: 0, count: 0 };
      grid[key].totalPnL += t.pnl;
      grid[key].count += 1;
    });

    return grid;
  }, [trades]);

  // Max abs avg PnL for intensity scaling
  const maxAbsAvg = useMemo(() => {
    let max = 0;
    Object.values(heatData).forEach(v => {
      const avg = Math.abs(v.totalPnL / v.count);
      if (avg > max) max = avg;
    });
    return max || 1;
  }, [heatData]);

  const getCellStyle = (dayIdx: number, hour: number): React.CSSProperties => {
    const key = `${dayIdx}-${hour}`;
    const v = heatData[key];
    if (!v || v.count === 0) return {};
    const avg = v.totalPnL / v.count;
    const intensity = Math.min(Math.abs(avg) / maxAbsAvg, 1);
    if (avg > 0) {
      return { background: `rgba(16,185,129,${0.1 + intensity * 0.7})`, borderColor: `rgba(16,185,129,${0.2 + intensity * 0.5})` };
    } else {
      return { background: `rgba(239,68,68,${0.1 + intensity * 0.7})`, borderColor: `rgba(239,68,68,${0.2 + intensity * 0.5})` };
    }
  };

  const getTooltip = (dayIdx: number, hour: number): string => {
    const key = `${dayIdx}-${hour}`;
    const v = heatData[key];
    if (!v) return '';
    const avg = v.totalPnL / v.count;
    return `${DAYS[dayIdx]} ${hour}h — ${v.count} trade${v.count > 1 ? 's' : ''} · Avg: ${avg >= 0 ? '+' : ''}$${avg.toFixed(1)}`;
  };

  const totalTrades = trades.filter(t => t.exit_time && t.pnl !== null).length;

  if (totalTrades < 3) {
    return (
      <div className="h-48 flex flex-col items-center justify-center text-slate-500 text-xs gap-2">
        <span>Pas encore assez de données</span>
        <span className="text-slate-700">Ajoutez plus de trades pour voir la heatmap</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="text-xs font-mono text-slate-500 text-right">Avg P&L par créneau horaire</div>

      {/* Hour labels */}
      <div className="overflow-x-auto">
        <div className="min-w-[600px]">
          <div className="flex items-center gap-1 mb-1">
            <div className="w-8 shrink-0" />
            {HOURS.map(h => (
              <div key={h} className="flex-1 text-center text-[9px] font-mono text-slate-600">
                {h % 3 === 0 ? `${h}h` : ''}
              </div>
            ))}
          </div>

          {/* Grid */}
          {DAYS.map((day, dayIdx) => (
            <div key={day} className="flex items-center gap-1 mb-1">
              <div className="w-8 text-[10px] font-mono text-slate-500 shrink-0">{day}</div>
              {HOURS.map(hour => {
                const key = `${dayIdx}-${hour}`;
                const v = heatData[key];
                return (
                  <motion.div
                    key={hour}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: (dayIdx * 24 + hour) * 0.001, duration: 0.2 }}
                    style={getCellStyle(dayIdx, hour)}
                    title={getTooltip(dayIdx, hour)}
                    className="flex-1 h-6 rounded-sm border border-[#1e2028] cursor-default transition-all hover:scale-125 hover:z-10 hover:border-white/30"
                  >
                    {v && v.count > 0 && (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-[7px] font-bold text-white/60">{v.count}</span>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 pt-2 border-t border-white/[0.05]">
        <span className="text-[10px] text-slate-600 font-mono">Intensité</span>
        <div className="flex items-center gap-1">
          {[0.1, 0.3, 0.5, 0.7, 0.9].map((v, i) => (
            <div key={i} className="w-4 h-4 rounded-sm" style={{ background: `rgba(16,185,129,${v})` }} />
          ))}
          <span className="text-[10px] text-slate-600 font-mono ml-1">Profit</span>
        </div>
        <div className="flex items-center gap-1">
          {[0.1, 0.3, 0.5, 0.7, 0.9].map((v, i) => (
            <div key={i} className="w-4 h-4 rounded-sm" style={{ background: `rgba(239,68,68,${v})` }} />
          ))}
          <span className="text-[10px] text-slate-600 font-mono ml-1">Perte</span>
        </div>
        <span className="ml-auto text-[10px] text-slate-700 font-mono">{totalTrades} trades analysés</span>
      </div>
    </div>
  );
};
