import { useMemo } from 'react';
import { calculateConsistencyScore, calculateRMultiple } from '../../utils/financials';
import type { Trade } from '../trades/useTrades';

export interface PerformanceMetrics {
  totalTrades: number;
  closedTrades: number;
  openTrades: number;
  winCount: number;
  lossCount: number;
  winRate: number; // %
  grossProfit: number;
  grossLoss: number;
  profitFactor: number;
  netPnL: number;
  avgRMultiple: number;
  bestTrade: Trade | null;
  worstTrade: Trade | null;
  avgWin: number;
  avgLoss: number;
  maxDrawdown: number;
  dayWinRate: number;
  recentTrades: Trade[];
  monthlyPerformance: { month: string; pnl: number; count: number; winRate: number }[];
  consistency: { score: number; alert: boolean };
  equityCurve: { tradeIndex: number; pnl: number; date: string }[];
  dailyPnL: { date: string; pnl: number }[];
}

export function usePerformanceMetrics(trades: Trade[]): PerformanceMetrics {
  return useMemo(() => {
    const closedTrades = trades.filter(
      (t): t is Trade & { exit_time: string; pnl: number } =>
        t.exit_time !== null && t.pnl !== null
    );
    const openTrades = trades.filter((t) => t.exit_time === null);

    // Win / Loss
    const winTrades = closedTrades.filter((t) => t.pnl > 0);
    const lossTrades = closedTrades.filter((t) => t.pnl <= 0);
    const winRate = closedTrades.length > 0 ? (winTrades.length / closedTrades.length) * 100 : 0;

    // P&L
    const grossProfit = winTrades.reduce((sum, t) => sum + t.pnl, 0);
    const grossLoss = Math.abs(lossTrades.reduce((sum, t) => sum + t.pnl, 0));
    const netPnL = closedTrades.reduce((sum, t) => sum + t.pnl, 0);
    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? 99.99 : 0;

    // Averages
    const avgWin = winTrades.length > 0 ? grossProfit / winTrades.length : 0;
    const avgLoss = lossTrades.length > 0 ? grossLoss / lossTrades.length : 0;

    // R-Multiple moyen
    const rMultiples = closedTrades.map((t) =>
      t.r_multiple !== null
        ? t.r_multiple
        : calculateRMultiple({
            direction: t.direction,
            entryPrice: t.entry_price,
            exitPrice: (t.exit_price as number),
            stopLoss: t.stop_loss,
          })
    );
    const avgRMultiple =
      rMultiples.length > 0 ? rMultiples.reduce((s, r) => s + r, 0) / rMultiples.length : 0;

    // Best / Worst trade
    const winClosed = closedTrades.filter(t => t.pnl > 0);
    const lossClosed = closedTrades.filter(t => t.pnl < 0);

    const bestTrade =
      winClosed.length > 0
        ? winClosed.reduce((best, t) => (t.pnl > best.pnl ? t : best), winClosed[0])
        : null;
    const worstTrade =
      lossClosed.length > 0
        ? lossClosed.reduce((worst, t) => (t.pnl < worst.pnl ? t : worst), lossClosed[0])
        : null;

    // Consistency score
    const consistency = calculateConsistencyScore(
      closedTrades.map((t) => ({ pnl: t.pnl, exit_time: t.exit_time }))
    );

    // Equity curve & Max Drawdown calculation
    let cumPnL = 0;
    let peak = 0;
    let maxDrawdown = 0;

    const equityCurve = closedTrades
      .slice()
      .sort((a, b) => new Date(a.exit_time).getTime() - new Date(b.exit_time).getTime())
      .map((t, i) => {
        cumPnL += t.pnl;
        if (cumPnL > peak) peak = cumPnL;
        const dd = peak - cumPnL;
        if (dd > maxDrawdown) maxDrawdown = dd;

        return {
          tradeIndex: i + 1,
          pnl: Number(cumPnL.toFixed(2)),
          date: new Date(t.exit_time).toLocaleDateString('fr-FR', {
            month: 'short',
            day: 'numeric',
          }),
        };
      });

    // Daily P&L & Day Win Rate calculation
    const dailyMap: Record<string, number> = {};
    closedTrades.forEach((t) => {
      const dateKey = t.exit_time.split('T')[0];
      dailyMap[dateKey] = (dailyMap[dateKey] || 0) + t.pnl;
    });
    const dailyPnL = Object.entries(dailyMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, pnl]) => ({ date, pnl: Number(pnl.toFixed(2)) }));

    const greenDays = dailyPnL.filter(d => d.pnl > 0).length;
    const dayWinRate = dailyPnL.length > 0 ? (greenDays / dailyPnL.length) * 100 : 0;

    // Monthly performance calculation
    const monthlyMap: Record<string, { pnl: number; count: number; wins: number }> = {};
    closedTrades.forEach((t) => {
      const date = new Date(t.exit_time);
      const monthKey = date.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });
      if (!monthlyMap[monthKey]) {
        monthlyMap[monthKey] = { pnl: 0, count: 0, wins: 0 };
      }
      monthlyMap[monthKey].pnl += t.pnl;
      monthlyMap[monthKey].count += 1;
      if (t.pnl > 0) monthlyMap[monthKey].wins += 1;
    });

    const monthlyPerformance = Object.entries(monthlyMap).map(([month, data]) => ({
      month: month.toUpperCase(),
      pnl: Number(data.pnl.toFixed(2)),
      count: data.count,
      winRate: Number(((data.wins / data.count) * 100).toFixed(1)),
    }));

    // Recent 3 trades
    const recentTrades = [...trades]
      .sort((a, b) => new Date(b.entry_time).getTime() - new Date(a.entry_time).getTime())
      .slice(0, 3);

    return {
      totalTrades: trades.length,
      closedTrades: closedTrades.length,
      openTrades: openTrades.length,
      winCount: winTrades.length,
      lossCount: lossTrades.length,
      winRate: Number(winRate.toFixed(2)),
      grossProfit: Number(grossProfit.toFixed(2)),
      grossLoss: Number(grossLoss.toFixed(2)),
      profitFactor: Number(profitFactor.toFixed(2)),
      netPnL: Number(netPnL.toFixed(2)),
      avgRMultiple: Number(avgRMultiple.toFixed(2)),
      bestTrade: bestTrade as Trade | null,
      worstTrade: worstTrade as Trade | null,
      avgWin: Number(avgWin.toFixed(2)),
      avgLoss: Number(avgLoss.toFixed(2)),
      maxDrawdown: Number(maxDrawdown.toFixed(2)),
      dayWinRate: Number(dayWinRate.toFixed(1)),
      recentTrades,
      monthlyPerformance,
      consistency,
      equityCurve,
      dailyPnL,
    };
  }, [trades]);
}
