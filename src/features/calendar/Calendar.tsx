import React, { useState, useMemo } from 'react';
import { useTrades } from '../trades/useTrades';
import type { Trade } from '../trades/useTrades';
import { Card } from '../../components/ui/Card';
import { Table, TableRow, TableCell } from '../../components/ui/Table';
import { ChevronLeft, ChevronRight, CalendarDays, TrendingUp } from 'lucide-react';

export const Calendar: React.FC = () => {
  const { trades } = useTrades();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
    setSelectedDateStr(null);
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
    setSelectedDateStr(null);
  };

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

  // Month stats
  const monthStats = useMemo(() => {
    let totalPnL = 0;
    let tradesCount = 0;
    let winsCount = 0;
    let greenDays = 0;
    let redDays = 0;

    for (let day = 1; day <= totalDays; day++) {
      const formattedDay = day < 10 ? `0${day}` : `${day}`;
      const formattedMonth = (month + 1) < 10 ? `0${month + 1}` : `${month + 1}`;
      const dateStr = `${year}-${formattedMonth}-${formattedDay}`;
      
      const dayStats = tradesByDate[dateStr];
      if (dayStats) {
        totalPnL += dayStats.pnl;
        tradesCount += dayStats.count;
        winsCount += dayStats.wins;
        if (dayStats.pnl > 0) greenDays++;
        else if (dayStats.pnl < 0) redDays++;
      }
    }

    const winRate = tradesCount > 0 ? (winsCount / tradesCount) * 100 : 0;
    return { totalPnL, tradesCount, winRate, greenDays, redDays };
  }, [tradesByDate, year, month, totalDays]);

  const monthNames = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  const daysOfWeek = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

  const cells: React.ReactNode[] = [];

  // Blank slots
  for (let i = 0; i < adjustedStartDay; i++) {
    cells.push(<div key={`blank-${i}`} className="bg-[#121318] border border-[#262833] rounded-lg min-h-[55px] sm:min-h-[95px] opacity-40" />);
  }

  // Days slots TradeZella Style
  for (let day = 1; day <= totalDays; day++) {
    const formattedDay = day < 10 ? `0${day}` : `${day}`;
    const formattedMonth = (month + 1) < 10 ? `0${month + 1}` : `${month + 1}`;
    const dateStr = `${year}-${formattedMonth}-${formattedDay}`;
    const dayStats = tradesByDate[dateStr];

    let cellClass = 'bg-[#181920] border-[#262833] hover:border-[#363948]';
    if (dayStats) {
      if (dayStats.pnl > 0) {
        cellClass = 'bg-[#10b981]/15 border-[#10b981]/40 hover:border-[#10b981]';
      } else if (dayStats.pnl < 0) {
        cellClass = 'bg-[#ef4444]/15 border-[#ef4444]/40 hover:border-[#ef4444]';
      }
    }

    const isSelected = selectedDateStr === dateStr;

    cells.push(
      <div 
        key={`day-${day}`}
        onClick={() => dayStats && setSelectedDateStr(dateStr)}
        className={`border rounded-lg p-1 sm:p-2.5 flex flex-col justify-between min-h-[55px] sm:min-h-[95px] transition-all ${
          isSelected ? 'ring-2 ring-[#6366f1] border-transparent' : ''
        } ${dayStats ? 'cursor-pointer' : ''} ${cellClass}`}
      >
        <span className="text-slate-400 font-semibold text-[10px] sm:text-xs">{day}</span>
        
        {dayStats ? (
          <div className="flex flex-col space-y-0.5 sm:space-y-1 items-end w-full">
            <span className={`font-bold tabular-nums text-[10px] sm:text-sm ${dayStats.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {dayStats.pnl >= 0 ? '+' : ''}${Math.abs(dayStats.pnl) >= 1000 ? `${(dayStats.pnl / 1000).toFixed(1)}k` : dayStats.pnl.toFixed(0)}
            </span>
            <div className="hidden sm:block text-[10px] text-slate-400 font-medium">
              {dayStats.count} trade{dayStats.count > 1 ? 's' : ''} · {((dayStats.wins / dayStats.count) * 100).toFixed(0)}%
            </div>
            <div className="sm:hidden text-[9px] text-slate-400 font-medium">
              {dayStats.count}t
            </div>
          </div>
        ) : (
          <span className="text-[9px] sm:text-[10px] text-slate-600 self-end">—</span>
        )}
      </div>
    );
  }

  const selectedTrades = selectedDateStr ? (tradesByDate[selectedDateStr]?.trades || []) : [];

  return (
    <div className="space-y-6 page-enter">
      
      {/* HEADER & MONTH NAVIGATION */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-[#262833] pb-4 gap-4">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-white">
            CALENDRIER DES PERFORMANCES
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Vue mensuelle TradeZella des jours gagnants et perdants
          </p>
        </div>

        <div className="flex items-center space-x-3 bg-[#181920] border border-[#262833] px-3.5 py-2 rounded-xl self-start">
          <button onClick={handlePrevMonth} className="text-slate-400 hover:text-white transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-bold text-slate-200 tracking-wide min-w-[120px] text-center">
            {monthNames[month]} {year}
          </span>
          <button onClick={handleNextMonth} className="text-slate-400 hover:text-white transition-colors">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* MONTH STATS CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-[#181920] border border-[#262833] rounded-xl p-4">
          <div className="text-xs font-semibold text-slate-400 mb-1">Net P&L (Mois)</div>
          <div className={`text-xl font-bold tabular-nums ${monthStats.totalPnL >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {monthStats.totalPnL >= 0 ? '+' : ''}${monthStats.totalPnL.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
        </div>

        <div className="bg-[#181920] border border-[#262833] rounded-xl p-4">
          <div className="text-xs font-semibold text-slate-400 mb-1">Win Rate</div>
          <div className="text-xl font-bold text-white tabular-nums">
            {monthStats.winRate.toFixed(1)}%
          </div>
        </div>

        <div className="bg-[#181920] border border-[#262833] rounded-xl p-4">
          <div className="text-xs font-semibold text-slate-400 mb-1">Jours Verts / Rouges</div>
          <div className="text-xl font-bold text-emerald-400 tabular-nums">
            {monthStats.greenDays} <span className="text-slate-500">/</span> <span className="text-red-400">{monthStats.redDays}</span>
          </div>
        </div>

        <div className="bg-[#181920] border border-[#262833] rounded-xl p-4">
          <div className="text-xs font-semibold text-slate-400 mb-1">Trades du Mois</div>
          <div className="text-xl font-bold text-indigo-400 tabular-nums">
            {monthStats.tradesCount}
          </div>
        </div>
      </div>

      {/* CALENDAR GRID & DETAILS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* CALENDAR MATRIX */}
        <Card className="lg:col-span-2" title={`${monthNames[month]} ${year}`} headerAction={<CalendarDays className="w-4 h-4 text-[#6366f1]" />}>
          <div className="grid grid-cols-7 text-center font-semibold text-xs text-slate-400 pb-3 mb-2 border-b border-[#262833]">
            {daysOfWeek.map(d => (
              <div key={d}>{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {cells}
          </div>
        </Card>

        {/* SELECTED DAY DETAILS */}
        <Card title={selectedDateStr ? `TRADES DU ${new Date(selectedDateStr).toLocaleDateString('fr-FR')}` : "SÉLECTIONNEZ UN JOUR"} headerAction={<TrendingUp className="w-4 h-4 text-[#6366f1]" />}>
          {selectedDateStr && selectedTrades.length > 0 ? (
            <div className="space-y-4">
              <div className="flex justify-between border-b border-[#262833] pb-3 text-xs font-semibold text-slate-400">
                <span>Total P&L</span>
                <span className={`font-bold ${tradesByDate[selectedDateStr].pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {tradesByDate[selectedDateStr].pnl >= 0 ? '+' : ''}
                  ${tradesByDate[selectedDateStr].pnl.toFixed(2)}
                </span>
              </div>

              <Table headers={['PAIR', 'TYPE', 'RESULT', 'P&L']}>
                {selectedTrades.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-bold text-white">{t.pair}</TableCell>
                    <TableCell className={t.direction === 'BUY' ? 'text-emerald-400 font-semibold' : 'text-[#818cf8] font-semibold'}>
                      {t.direction}
                    </TableCell>
                    <TableCell>{t.result}</TableCell>
                    <TableCell className={`font-bold ${t.pnl && t.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {t.pnl !== null ? `${t.pnl >= 0 ? '+' : ''}${t.pnl.toFixed(2)}$` : 'OPEN'}
                    </TableCell>
                  </TableRow>
                ))}
              </Table>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500 text-xs font-medium">
              Cliquez sur un jour du calendrier pour voir le détail des trades.
            </div>
          )}
        </Card>

      </div>
    </div>
  );
};
