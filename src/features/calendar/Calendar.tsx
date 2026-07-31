import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTrades } from '../trades/useTrades';
import type { Trade } from '../trades/useTrades';
import { Table, TableRow, TableCell } from '../../components/ui/Table';
import {
  ChevronLeft, ChevronRight, CalendarDays, TrendingUp,
  Flame, Trophy, Target, BarChart2
} from 'lucide-react';

// ─── Heat level helper ────────────────────────────────────────────────────────

function getHeatStyle(pnl: number, maxAbsPnl: number): React.CSSProperties {
  if (pnl === 0 || maxAbsPnl === 0) return {};
  const intensity = Math.min(Math.abs(pnl) / maxAbsPnl, 1);
  if (pnl > 0) {
    const alpha = 0.12 + intensity * 0.45;
    return {
      background: `rgba(16,185,129,${alpha})`,
      borderColor: `rgba(16,185,129,${0.2 + intensity * 0.5})`,
      boxShadow: intensity > 0.6 ? `0 0 ${12 * intensity}px rgba(16,185,129,0.25)` : undefined,
    };
  } else {
    const alpha = 0.12 + intensity * 0.45;
    return {
      background: `rgba(239,68,68,${alpha})`,
      borderColor: `rgba(239,68,68,${0.2 + intensity * 0.5})`,
      boxShadow: intensity > 0.6 ? `0 0 ${12 * intensity}px rgba(239,68,68,0.25)` : undefined,
    };
  }
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  color,
  delay,
}: {
  label: string;
  value: React.ReactNode;
  sub?: string;
  icon: React.FC<{ className?: string }>;
  color: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: [0.22, 0.61, 0.36, 1] }}
      className="bg-[#0e0f14]/90 border border-white/[0.07] rounded-2xl p-4 flex items-center gap-3 hover:border-white/20 transition-colors"
    >
      <div className={`p-2.5 rounded-xl ${color} shrink-0`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="min-w-0">
        <div className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">{label}</div>
        <div className="text-lg font-black font-mono text-white mt-0.5 tabular-nums">{value}</div>
        {sub && <div className="text-[10px] text-slate-500 font-mono">{sub}</div>}
      </div>
    </motion.div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

const MONTH_NAMES = [
  'Janvier','Février','Mars','Avril','Mai','Juin',
  'Juillet','Août','Septembre','Octobre','Novembre','Décembre',
];
const DAYS_OF_WEEK = ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'];

export const Calendar: React.FC = () => {
  const { trades } = useTrades();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(null);
  const [direction, setDirection] = useState<1 | -1>(1);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const handlePrevMonth = () => {
    setDirection(-1);
    setCurrentDate(new Date(year, month - 1, 1));
    setSelectedDateStr(null);
  };
  const handleNextMonth = () => {
    setDirection(1);
    setCurrentDate(new Date(year, month + 1, 1));
    setSelectedDateStr(null);
  };

  const firstDayIndex = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();
  // Mon = 0 … Sun = 6
  const adjustedStartDay = firstDayIndex === 0 ? 6 : firstDayIndex - 1;

  // Aggregate trades by date
  const tradesByDate = useMemo(() => {
    const map: Record<string, { pnl: number; count: number; wins: number; losses: number; trades: Trade[] }> = {};
    trades.forEach(t => {
      const timeStr = t.exit_time || t.entry_time;
      if (timeStr) {
        const d = new Date(timeStr);
        if (!isNaN(d.getTime())) {
          const dateStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
          if (!map[dateStr]) map[dateStr] = { pnl: 0, count: 0, wins: 0, losses: 0, trades: [] };
          map[dateStr].pnl += t.pnl || 0;
          map[dateStr].count += 1;
          if ((t.pnl || 0) > 0) map[dateStr].wins += 1;
          else map[dateStr].losses += 1;
          map[dateStr].trades.push(t);
        }
      }
    });
    return map;
  }, [trades]);

  // Max abs PnL in current month (for heat intensity scaling)
  const maxAbsPnl = useMemo(() => {
    let max = 0;
    for (let d = 1; d <= totalDays; d++) {
      const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      const v = Math.abs(tradesByDate[dateStr]?.pnl ?? 0);
      if (v > max) max = v;
    }
    return max;
  }, [tradesByDate, year, month, totalDays]);

  // Month stats
  const monthStats = useMemo(() => {
    let totalPnL = 0, tradesCount = 0, winsCount = 0, greenDays = 0, redDays = 0;
    for (let d = 1; d <= totalDays; d++) {
      const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      const ds = tradesByDate[dateStr];
      if (ds) {
        totalPnL += ds.pnl;
        tradesCount += ds.count;
        winsCount += ds.wins;
        if (ds.pnl > 0) greenDays++;
        else if (ds.pnl < 0) redDays++;
      }
    }
    return { totalPnL, tradesCount, winRate: tradesCount > 0 ? (winsCount/tradesCount)*100 : 0, greenDays, redDays };
  }, [tradesByDate, year, month, totalDays]);

  // Win streak in current month
  const monthStreak = useMemo(() => {
    let cur = 0, best = 0, temp = 0;
    for (let d = 1; d <= totalDays; d++) {
      const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      const ds = tradesByDate[dateStr];
      if (ds && ds.pnl > 0) { temp++; if (temp > best) best = temp; }
      else temp = 0;
    }
    // current streak = count backwards from last active day
    for (let d = totalDays; d >= 1; d--) {
      const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      const ds = tradesByDate[dateStr];
      if (!ds) continue;
      if (ds.pnl > 0) cur++;
      else break;
    }
    return { current: cur, best };
  }, [tradesByDate, year, month, totalDays]);

  const selectedTrades = selectedDateStr ? (tradesByDate[selectedDateStr]?.trades || []) : [];

  // Build cells
  const cells: React.ReactNode[] = [];
  for (let i = 0; i < adjustedStartDay; i++) {
    cells.push(
      <div key={`b-${i}`} className="bg-[#0a0b0f] border border-[#1a1c24] rounded-xl min-h-[64px] sm:min-h-[88px] opacity-30" />
    );
  }

  for (let day = 1; day <= totalDays; day++) {
    const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    const ds = tradesByDate[dateStr];
    const isSelected = selectedDateStr === dateStr;
    const isToday = dateStr === new Date().toISOString().split('T')[0];
    const heatStyle = ds ? getHeatStyle(ds.pnl, maxAbsPnl) : {};

    cells.push(
      <motion.div
        key={`d-${day}`}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: day * 0.008, duration: 0.25 }}
        onClick={() => ds && setSelectedDateStr(isSelected ? null : dateStr)}
        style={heatStyle}
        className={`
          border rounded-xl p-1.5 sm:p-2.5 flex flex-col justify-between
          min-h-[64px] sm:min-h-[88px] transition-all duration-200 relative overflow-hidden
          ${ds ? 'cursor-pointer hover:scale-[1.03] hover:z-10' : 'bg-[#0e0f14] border-[#1e2028]'}
          ${isSelected ? 'ring-2 ring-[#6366f1] ring-offset-1 ring-offset-[#07080a]' : ''}
          ${isToday && !ds ? 'border-[#6366f1]/40 bg-[#6366f1]/5' : ''}
        `}
      >
        {/* Day number */}
        <div className="flex items-center justify-between">
          <span className={`font-bold text-[11px] sm:text-xs ${isToday ? 'text-[#818cf8]' : 'text-slate-400'}`}>
            {day}
          </span>
          {isToday && (
            <span className="text-[8px] font-black text-[#818cf8] uppercase tracking-widest hidden sm:block">TODAY</span>
          )}
        </div>

        {ds ? (
          <div className="flex flex-col items-end gap-0.5">
            <span className={`font-black font-mono tabular-nums text-[11px] sm:text-sm ${ds.pnl >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>
              {ds.pnl >= 0 ? '+' : ''}
              {Math.abs(ds.pnl) >= 1000
                ? `${(ds.pnl/1000).toFixed(1)}k`
                : ds.pnl.toFixed(0)}$
            </span>
            <span className="text-[9px] sm:text-[10px] font-mono text-white/50">
              {ds.count}t · {((ds.wins/ds.count)*100).toFixed(0)}%
            </span>
          </div>
        ) : (
          <span className="text-[9px] text-slate-700 self-end">—</span>
        )}
      </motion.div>
    );
  }

  const slideVariants = {
    enter: (dir: number) => ({ x: dir * 60, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir * -60, opacity: 0 }),
  };

  return (
    <div className="space-y-6 page-enter">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-heading font-bold text-white tracking-tight">
            Calendrier des Performances
          </h2>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Heat map journalier · intensité = amplitude du P&L
          </p>
        </div>
        {/* Month navigator */}
        <div className="flex items-center gap-3 bg-[#0e0f14] border border-white/[0.07] rounded-xl px-4 py-2.5 self-start">
          <button onClick={handlePrevMonth} className="text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/5">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-bold text-white min-w-[140px] text-center">
            {MONTH_NAMES[month]} {year}
          </span>
          <button onClick={handleNextMonth} className="text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/5">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Month Stats ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          label="Net P&L Mois"
          value={<span className={monthStats.totalPnL >= 0 ? 'text-emerald-400' : 'text-red-400'}>
            {monthStats.totalPnL >= 0 ? '+' : ''}${monthStats.totalPnL.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </span>}
          icon={TrendingUp}
          color={monthStats.totalPnL >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}
          delay={0}
        />
        <StatCard
          label="Win Rate"
          value={`${monthStats.winRate.toFixed(1)}%`}
          sub={`${monthStats.tradesCount} trades`}
          icon={Target}
          color="bg-indigo-500/10 text-indigo-400"
          delay={0.05}
        />
        <StatCard
          label="Jours"
          value={<span><span className="text-emerald-400">{monthStats.greenDays}✓</span> <span className="text-slate-600 text-sm">/</span> <span className="text-red-400">{monthStats.redDays}✗</span></span>}
          sub="Verts / Rouges"
          icon={CalendarDays}
          color="bg-slate-500/10 text-slate-400"
          delay={0.1}
        />
        <StatCard
          label="Streak 🔥"
          value={<span className="text-amber-400">{monthStreak.current}j</span>}
          sub={`Best: ${monthStreak.best}j`}
          icon={Flame}
          color="bg-amber-500/10 text-amber-400"
          delay={0.15}
        />
      </div>

      {/* ── Calendar Grid + Side Panel ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Calendar */}
        <div className="lg:col-span-2 bg-[#0e0f14]/80 border border-white/[0.07] rounded-2xl p-5">
          {/* Day headers */}
          <div className="grid grid-cols-7 text-center mb-3">
            {DAYS_OF_WEEK.map(d => (
              <div key={d} className="text-[10px] font-bold text-slate-500 uppercase tracking-wider py-1">{d}</div>
            ))}
          </div>

          {/* Grid with slide animation per month change */}
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={`${year}-${month}`}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.35, ease: [0.22, 0.61, 0.36, 1] }}
              className="grid grid-cols-7 gap-1.5 sm:gap-2"
            >
              {cells}
            </motion.div>
          </AnimatePresence>

          {/* Legend */}
          <div className="flex items-center gap-3 mt-4 pt-3 border-t border-white/[0.05]">
            <span className="text-[10px] text-slate-600 font-mono uppercase tracking-wider">Intensité</span>
            <div className="flex items-center gap-1">
              {[0.15, 0.3, 0.5, 0.7, 0.9].map((v, i) => (
                <div key={i} className="w-4 h-4 rounded-sm" style={{ background: `rgba(16,185,129,${v})` }} />
              ))}
              <span className="text-[10px] text-slate-600 font-mono ml-1">Profits</span>
            </div>
            <div className="flex items-center gap-1">
              {[0.15, 0.3, 0.5, 0.7, 0.9].map((v, i) => (
                <div key={i} className="w-4 h-4 rounded-sm" style={{ background: `rgba(239,68,68,${v})` }} />
              ))}
              <span className="text-[10px] text-slate-600 font-mono ml-1">Pertes</span>
            </div>
          </div>
        </div>

        {/* Side Panel */}
        <div className="bg-[#0e0f14]/80 border border-white/[0.07] rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-white/[0.05]">
            <BarChart2 className="w-4 h-4 text-[#6366f1]" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
              {selectedDateStr
                ? new Date(selectedDateStr + 'T12:00:00').toLocaleDateString('fr-FR', { weekday:'long', day:'numeric', month:'long' })
                : 'Sélectionner un jour'}
            </span>
          </div>

          <AnimatePresence mode="wait">
            {selectedDateStr && selectedTrades.length > 0 ? (
              <motion.div
                key={selectedDateStr}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
                className="space-y-4"
              >
                {/* Day P&L summary */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <span className="text-xs text-slate-400 font-mono">Total P&L</span>
                  <span className={`text-base font-black font-mono ${tradesByDate[selectedDateStr].pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {tradesByDate[selectedDateStr].pnl >= 0 ? '+' : ''}${tradesByDate[selectedDateStr].pnl.toFixed(2)}
                  </span>
                </div>

                <Table headers={['PAIR', 'TYPE', 'RES', 'P&L']}>
                  {selectedTrades.map(t => (
                    <TableRow key={t.id}>
                      <TableCell className="font-bold text-white text-xs">{t.pair}</TableCell>
                      <TableCell className={`text-xs font-semibold ${t.direction === 'BUY' ? 'text-emerald-400' : 'text-indigo-400'}`}>
                        {t.direction}
                      </TableCell>
                      <TableCell>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          t.result === 'TP' ? 'bg-emerald-500/10 text-emerald-400' :
                          t.result === 'SL' ? 'bg-red-500/10 text-red-400' :
                          'bg-slate-800 text-slate-400'
                        }`}>{t.result}</span>
                      </TableCell>
                      <TableCell className={`font-bold text-xs ${t.pnl && t.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {t.pnl !== null ? `${t.pnl >= 0 ? '+' : ''}$${Math.abs(t.pnl).toFixed(0)}` : 'OPEN'}
                      </TableCell>
                    </TableRow>
                  ))}
                </Table>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-12 text-center gap-3"
              >
                <Trophy className="w-8 h-8 text-slate-700" />
                <p className="text-xs text-slate-500 leading-relaxed">
                  Clique sur un jour<br />avec des trades pour voir les détails
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
