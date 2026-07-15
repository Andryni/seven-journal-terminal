export interface CalculateRMultipleParams {
  direction: 'BUY' | 'SELL';
  entryPrice: number;
  exitPrice: number;
  stopLoss: number;
}

/**
 * Calcule le R-multiple d'un trade.
 * R = (exit_price - entry_price) / (entry_price - stop_loss) pour BUY
 * R = (entry_price - exit_price) / (entry_price - stop_loss) pour SELL
 */
export function calculateRMultiple(params: CalculateRMultipleParams): number {
  const { direction, entryPrice, exitPrice, stopLoss } = params;
  
  const risk = Math.abs(entryPrice - stopLoss);
  if (risk === 0) return 0;
  
  const reward = direction === 'BUY'
    ? exitPrice - entryPrice
    : entryPrice - exitPrice;
    
  return Number((reward / risk).toFixed(2));
}

export interface TradePnLEntry {
  pnl: number;
  exit_time: string; // ISO string ou date simple YYYY-MM-DD
}

export interface ConsistencyResult {
  score: number;
  alert: boolean;
}

/**
 * Calcule le score de consistance (Consistency Score) d'un compte de trading.
 * Formule : (Meilleur profit net journalier / Profit net total) * 100
 * Alerte si le score dépasse 15.00% (seuil standard prop firms).
 */
export function calculateConsistencyScore(trades: TradePnLEntry[]): ConsistencyResult {
  // Regrouper les profits nets uniquement par jour
  const dailyPnL: Record<string, number> = {};
  
  trades.forEach(t => {
    if (t.pnl && t.exit_time) {
      const dateStr = t.exit_time.split('T')[0];
      dailyPnL[dateStr] = (dailyPnL[dateStr] || 0) + t.pnl;
    }
  });

  const totalNetProfit = Object.values(dailyPnL).reduce((sum, val) => sum + val, 0);
  if (totalNetProfit <= 0) return { score: 0, alert: false };

  // On cherche le meilleur jour rentable (profit net journalier max)
  const bestDayProfit = Math.max(...Object.values(dailyPnL).map(p => Math.max(0, p)));
  const score = Number(((bestDayProfit / totalNetProfit) * 100).toFixed(2));

  return {
    score,
    alert: score > 15.00
  };
}
