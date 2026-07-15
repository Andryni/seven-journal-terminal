import React, { useState, useMemo } from 'react';
import { useTrades } from '../trades/useTrades';
import type { Trade } from '../trades/useTrades';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Table, TableRow, TableCell } from '../../components/ui/Table';
import { ChevronLeft, ChevronRight, CalendarDays, TrendingUp, HelpCircle } from 'lucide-react';

export const Calendar: React.FC = () => {
  const { trades } = useTrades();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Navigation handlers
  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
    setSelectedDateStr(null);
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
    setSelectedDateStr(null);
  };

  // Get start of month and total days
  const firstDayIndex = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();
  const adjustedStartDay = firstDayIndex === 0 ? 6 : firstDayIndex - 1; // Mon-Sun

  // Aggregate trades by date (YYYY-MM-DD)
  const tradesByDate = useMemo(() => {
    const map: Record<string, { pnl: number; count: number; wins: number; losses: number; trades: Trade[] }> = {};
    trades.forEach(t => {
      if (t.exit_time) {
        const dateStr = t.exit_time.split('T')[0];
        if (!map[dateStr]) {
          map[dateStr] = { pnl: 0, count: 0, wins: 0, losses: 0, trades: [] };
        }
        map[dateStr].pnl += t.pnl || 0;
        map[dateStr].count += 1;
        if ((t.pnl || 0) > 0) map[dateStr].wins += 1;
        else map[dateStr].losses += 1;
        map[dateStr].trades.push(t);
      }
    });
    return map;
  }, [trades]);

  // Statistics for the currently selected month
  const monthStats = useMemo(() => {
    let totalPnL = 0;
    let tradesCount = 0;
    let winsCount = 0;
    let greenDays = 0;
    let redDays = 0;
    let maxDayGain = 0;
    let maxDayLoss = 0;

    for (let day = 1; day <= totalDays; day++) {
      const formattedDay = day < 10 ? `0${day}` : `${day}`;
      const formattedMonth = (month + 1) < 10 ? `0${month + 1}` : `${month + 1}`;
      const dateStr = `${year}-${formattedMonth}-${formattedDay}`;
      
      const dayStats = tradesByDate[dateStr];
      if (dayStats) {
        totalPnL += dayStats.pnl;
        tradesCount += dayStats.count;
        winsCount += dayStats.wins;
        if (dayStats.pnl > 0) {
          greenDays++;
          if (dayStats.pnl > maxDayGain) maxDayGain = dayStats.pnl;
        } else if (dayStats.pnl < 0) {
          redDays++;
          if (dayStats.pnl < maxDayLoss) maxDayLoss = dayStats.pnl;
        }
      }
    }

    const winRate = tradesCount > 0 ? (winsCount / tradesCount) * 100 : 0;

    return {
      totalPnL,
      tradesCount,
      winRate,
      greenDays,
      redDays,
      maxDayGain,
      maxDayLoss,
    };
  }, [tradesByDate, year, month, totalDays]);

  const monthNames = [
    'JANVIER', 'FÉVRIER', 'MARS', 'AVRIL', 'MAI', 'JUIN',
    'JUILLET', 'AOÛT', 'SEPTEMBRE', 'OCTOBRE', 'NOVEMBRE', 'DÉCEMBRE'
  ];

  const daysOfWeek = ['LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM', 'DIM'];

  const cells: React.ReactNode[] = [];

  // Blank slots at start
  for (let i = 0; i < adjustedStartDay; i++) {
    cells.push(<div key={`blank-${i}`} className="border border-bloomberg-border/20 bg-[#070709] min-h-[90px]" />);
  }

  // Days slots with dynamic coloring based on P&L magnitude
  for (let day = 1; day <= totalDays; day++) {
    const formattedDay = day < 10 ? `0${day}` : `${day}`;
    const formattedMonth = (month + 1) < 10 ? `0${month + 1}` : `${month + 1}`;
    const dateStr = `${year}-${formattedMonth}-${formattedDay}`;
    const dayStats = tradesByDate[dateStr];

    // Determine heat map style
    let bgStyle = 'bg-bloomberg-surface/30';
    if (dayStats) {
      if (dayStats.pnl > 0) {
        bgStyle = dayStats.pnl > 1000 ? 'bg-emerald-950/45 text-emerald-300' : 'bg-emerald-950/20 text-emerald-400';
      } else if (dayStats.pnl < 0) {
        bgStyle = dayStats.pnl < -1000 ? 'bg-rose-950/40 text-rose-300' : 'bg-rose-950/15 text-rose-400';
      }
    }

    const isSelected = selectedDateStr === dateStr;

    cells.push(
      <div 
        key={`day-${day}`}
        onClick={() => dayStats && setSelectedDateStr(dateStr)}
        className={`border ${isSelected ? 'border-bloomberg-gold bg-bloomberg-gold/5' : 'border-bloomberg-border'} p-2 flex flex-col justify-between min-h-[90px] ${dayStats ? 'cursor-pointer hover:border-bloomberg-gold/60' : ''} ${bgStyle} transition-all duration-150 font-mono text-[10px]`}
      >
        <span className="text-[#a1a1aa] font-bold text-[11px]">{day}</span>
        
        {dayStats ? (
          <div className="flex flex-col space-y-1 items-end w-full">
            <span className={`font-bold tabular-nums text-xs ${dayStats.pnl >= 0 ? 'text-bloomberg-green-light' : 'text-bloomberg-red-light'}`}>
              {dayStats.pnl >= 0 ? '+' : ''}
              {dayStats.pnl.toLocaleString('en-US', { maximumFractionDigits: 0 })}
            </span>
            <span className="text-[8px] opacity-75">
              {dayStats.count} POS.
            </span>
          </div>
        ) : (
          <span className="text-[8px] text-bloomberg-text-muted self-end">—</span>
        )}
      </div>
    );
  }

  // Selected date trades
  const selectedTrades = selectedDateStr ? (tradesByDate[selectedDateStr]?.trades || []) : [];

  return (
    <div className="space-y-6">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-bloomberg-border pb-4 gap-4">
        <div>
          <h2 className="text-sm font-extrabold uppercase tracking-widest text-white">
            CALENDRIER INTERACTIF
          </h2>
          <p className="text-[10px] text-bloomberg-text-secondary">
            Suivi quotidien des gains, du volume de trading et de la performance mensuelle
          </p>
        </div>

        <div className="flex items-center space-x-3 bg-bloomberg-surface border border-bloomberg-border px-3 py-1.5 rounded-sm self-start">
          <button onClick={handlePrevMonth} className="text-bloomberg-text-secondary hover:text-white transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-bold text-bloomberg-gold tracking-widest min-w-[130px] text-center">
            {monthNames[month]} {year}
          </span>
          <button onClick={handleNextMonth} className="text-bloomberg-text-secondary hover:text-white transition-colors">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* MONTHLY SUMMARY ROW */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 font-mono text-[10px]">
        <div className="bg-bloomberg-surface border border-bloomberg-border p-3">
          <div className="text-bloomberg-text-secondary uppercase mb-1">P&L du Mois</div>
          <div className={`text-base font-bold tabular-nums ${monthStats.totalPnL >= 0 ? 'text-bloomberg-green-light' : 'text-bloomberg-red-light'}`}>
            {monthStats.totalPnL >= 0 ? '+' : ''}{monthStats.totalPnL.toLocaleString('en-US', { maximumFractionDigits: 2 })}
          </div>
        </div>

        <div className="bg-bloomberg-surface border border-bloomberg-border p-3">
          <div className="text-bloomberg-text-secondary uppercase mb-1">Win Rate (Mois)</div>
          <div className="text-base font-bold text-white tabular-nums">
            {monthStats.winRate.toFixed(1)}%
          </div>
          <div className="text-[9px] text-bloomberg-text-muted mt-0.5">{monthStats.tradesCount} positions</div>
        </div>

        <div className="bg-bloomberg-surface border border-bloomberg-border p-3">
          <div className="text-bloomberg-text-secondary uppercase mb-1">Jours Verts vs Rouges</div>
          <div className="text-base font-bold text-bloomberg-green-light tabular-nums">
            {monthStats.greenDays} <span className="text-bloomberg-text-secondary">/</span> <span className="text-bloomberg-red-light">{monthStats.redDays}</span>
          </div>
        </div>

        <div className="bg-bloomberg-surface border border-bloomberg-border p-3">
          <div className="text-bloomberg-text-secondary uppercase mb-1">Meilleur Jour</div>
          <div className="text-base font-bold text-bloomberg-green-light tabular-nums">
            +{monthStats.maxDayGain.toLocaleString('en-US', { maximumFractionDigits: 0 })}
          </div>
        </div>

        <div className="bg-bloomberg-surface border border-bloomberg-border p-3">
          <div className="text-bloomberg-text-secondary uppercase mb-1">Pire Jour</div>
          <div className="text-base font-bold text-bloomberg-red-light tabular-nums">
            {monthStats.maxDayLoss.toLocaleString('en-US', { maximumFractionDigits: 0 })}
          </div>
        </div>

        <div className="bg-bloomberg-surface border border-bloomberg-border p-3">
          <div className="text-bloomberg-text-secondary uppercase mb-1">Consistency Score</div>
          <div className="text-base font-bold text-bloomberg-gold-light">
            {monthStats.tradesCount > 0 ? ((monthStats.greenDays / (monthStats.greenDays + monthStats.redDays || 1)) * 100).toFixed(0) : 0}%
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* CALENDAR CELL MATRIX */}
        <Card className="lg:col-span-2" title="CALENDRIER MENSUEL" headerAction={<CalendarDays className="w-3.5 h-3.5 text-bloomberg-gold" />}>
          <div className="grid grid-cols-7 text-center font-bold text-[10px] text-bloomberg-text-secondary uppercase border-b border-bloomberg-border/50 pb-2 mb-2">
            {daysOfWeek.map(d => (
              <div key={d}>{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {cells}
          </div>
        </Card>

        {/* DETAILED DAILY BREAKDOWN (SIDEBAR) */}
        <Card title={selectedDateStr ? `TRADES DU ${new Date(selectedDateStr).toLocaleDateString('fr-FR')}` : "SÉLECTIONNEZ UN JOUR"} headerAction={<TrendingUp className="w-3.5 h-3.5 text-bloomberg-gold" />}>
          {selectedDateStr && selectedTrades.length > 0 ? (
            <div className="space-y-4">
              <div className="flex justify-between border-b border-bloomberg-border pb-2 text-[10px] uppercase font-bold text-bloomberg-text-secondary font-mono">
                <span>Détail Session</span>
                <span className={`font-bold ${tradesByDate[selectedDateStr].pnl >= 0 ? 'text-bloomberg-green-light' : 'text-bloomberg-red-light'}`}>
                  TOTAL P&L: {tradesByDate[selectedDateStr].pnl >= 0 ? '+' : ''}{tradesByDate[selectedDateStr].pnl.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div className="max-h-[350px] overflow-y-auto pr-1">
                <Table headers={['INSTR.', 'DIR', 'LOTS', 'RESULT', 'P&L ($)']}>
                  {selectedTrades.map((t: Trade) => (
                    <TableRow key={t.id}>
                      <TableCell className="font-bold text-white text-[10px]">{t.pair}</TableCell>
                      <TableCell className="text-[10px]">
                        <Badge variant={t.direction === 'BUY' ? 'blue' : 'gold'}>
                          {t.direction}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-[10px]">{t.size}</TableCell>
                      <TableCell className="text-[10px]">
                        <span className={`font-bold uppercase text-[9px] px-1 rounded ${
                          t.result === 'TP' ? 'text-bloomberg-green-light border border-bloomberg-green/30 bg-bloomberg-green/10' :
                          t.result === 'SL' ? 'text-bloomberg-red-light border border-bloomberg-red/30 bg-bloomberg-red/10' :
                          'text-bloomberg-text-secondary border border-bloomberg-border bg-bloomberg-surface'
                        }`}>
                          {t.result}
                        </span>
                      </TableCell>
                      <TableCell className={`font-bold tabular-nums text-[10px] text-right ${t.pnl !== null && t.pnl >= 0 ? 'text-bloomberg-green-light' : 'text-bloomberg-red-light'}`}>
                        {t.pnl !== null ? `${t.pnl >= 0 ? '+' : ''}${t.pnl.toLocaleString('en-US', { maximumFractionDigits: 0 })}` : '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </Table>
              </div>
            </div>
          ) : (
            <div className="h-[280px] flex flex-col items-center justify-center text-center text-bloomberg-text-secondary font-mono text-[10px] uppercase tracking-wider space-y-2">
              <HelpCircle className="w-5 h-5 opacity-30" />
              <span>Sélectionnez un jour actif du calendrier pour voir l'historique des positions</span>
            </div>
          )}
        </Card>
      </div>

    </div>
  );
};
