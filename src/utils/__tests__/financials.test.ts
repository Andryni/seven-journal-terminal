import { describe, it, expect } from 'vitest';
import { calculateRMultiple, calculateConsistencyScore } from '../financials';

describe('calculateRMultiple', () => {
  it('calcule correctement pour un BUY gagnant', () => {
    const result = calculateRMultiple({
      direction: 'BUY',
      entryPrice: 2000,
      exitPrice: 2020,
      stopLoss: 1990
    });
    expect(result).toBe(2.00); // Risk 10 pts, gain 20 pts = 2R
  });

  it('calcule correctement pour un BUY perdant', () => {
    const result = calculateRMultiple({
      direction: 'BUY',
      entryPrice: 2000,
      exitPrice: 1990,
      stopLoss: 1990
    });
    expect(result).toBe(-1.00); // Risk 10 pts, perte 10 pts = -1R
  });

  it('calcule correctement pour un SELL gagnant', () => {
    const result = calculateRMultiple({
      direction: 'SELL',
      entryPrice: 2000,
      exitPrice: 1980,
      stopLoss: 2010
    });
    expect(result).toBe(2.00); // Risk 10 pts, gain 20 pts = 2R
  });

  it('calcule correctement pour un SELL perdant', () => {
    const result = calculateRMultiple({
      direction: 'SELL',
      entryPrice: 2000,
      exitPrice: 2010,
      stopLoss: 2010
    });
    expect(result).toBe(-1.00); // Risk 10 pts, perte 10 pts = -1R
  });

  it('gère le cas où stop loss égal entry price', () => {
    const result = calculateRMultiple({
      direction: 'BUY',
      entryPrice: 2000,
      exitPrice: 2010,
      stopLoss: 2000
    });
    expect(result).toBe(0);
  });
});

describe('calculateConsistencyScore', () => {
  it('renvoie 0 sans alerte si profit total négatif ou nul', () => {
    const result = calculateConsistencyScore([
      { pnl: -100, exit_time: '2026-07-15T12:00:00Z' },
      { pnl: 50, exit_time: '2026-07-16T12:00:00Z' }
    ]);
    expect(result).toEqual({ score: 0, alert: false });
  });

  it('calcule correctement le score de consistance', () => {
    // Profit total = 1000. Meilleur jour (15 juillet) = 200 + 300 = 500.
    // Score = 500 / 1000 = 50%
    const result = calculateConsistencyScore([
      { pnl: 200, exit_time: '2026-07-15T10:00:00Z' },
      { pnl: 300, exit_time: '2026-07-15T14:00:00Z' },
      { pnl: 500, exit_time: '2026-07-16T12:00:00Z' }
    ]);
    expect(result.score).toBe(50.00);
    expect(result.alert).toBe(true); // 50% > 15%
  });

  it('ne lève pas d alerte si le score est inférieur ou égal à 15%', () => {
    // Profit total = 10000. Meilleur jour = 1200 (15 juillet et 20 juillet).
    // Score = 1200 / 10000 = 12%
    const result = calculateConsistencyScore([
      { pnl: 1200, exit_time: '2026-07-15T10:00:00Z' },
      { pnl: 1100, exit_time: '2026-07-16T12:00:00Z' },
      { pnl: 1000, exit_time: '2026-07-17T12:00:00Z' },
      { pnl: 900, exit_time: '2026-07-18T12:00:00Z' },
      { pnl: 800, exit_time: '2026-07-19T12:00:00Z' },
      { pnl: 1200, exit_time: '2026-07-20T12:00:00Z' },
      { pnl: 1100, exit_time: '2026-07-21T12:00:00Z' },
      { pnl: 1000, exit_time: '2026-07-22T12:00:00Z' },
      { pnl: 900, exit_time: '2026-07-23T12:00:00Z' },
      { pnl: 800, exit_time: '2026-07-24T12:00:00Z' }
    ]);
    expect(result.score).toBe(12.00);
    expect(result.alert).toBe(false); // 12% <= 15%
  });
});
