import React, { useState, useEffect } from 'react';
import { useTrades } from '../trades/useTrades';
import { usePerformanceMetrics } from './usePerformanceMetrics';
import {
  TrendingUp, Target,
  TrendingDown, Activity, Zap, Brain, Calendar, History, Clock
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Cell, ReferenceLine, Tooltip
} from 'recharts';
import { Table, TableRow, TableCell } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import {
  GlowingEquityChart,
  GradientBarChart,
  DonutRingChart,
  Sparkline,
  GlowDefs,
} from '../../components/ui/PremiumCharts';

const ChartTooltip = ({ active, payload, label }: {
  active?: boolean; payload?: { value: number }[]; label?: string;
}) => {
  if (!active || !payload?.length) return null;
  const val = payload[0].value;
  return (
    <div className="bg-[#181920] border border-[#262833] px-3.5 py-2 rounded-xl text-xs shadow-xl">
      <div className="text-slate-400 text-[11px] mb-1">{label}</div>
      <div className={`font-bold tabular-nums text-sm ${val >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
        {val >= 0 ? '+' : ''}${val.toLocaleString('en-US', { minimumFractionDigits: 2 })}
      </div>
    </div>
  );
};

// ── Gauge SVG Component ────────────────────────────────────────────────────────
const SemiCircleGauge = ({ percent, color = '#10b981' }: { percent: number; color?: string }) => {
  const radius = 28;
  const circumference = Math.PI * radius;
  const strokeDashoffset = circumference - (Math.min(Math.max(percent, 0), 100) / 100) * circumference;

  return (
    <div className="relative w-16 h-10 flex items-center justify-center shrink-0">
      <svg className="w-16 h-10 transform -rotate-180" viewBox="0 0 64 36">
        <GlowDefs />
        {/* Background Arc */}
        <path d="M 6 32 A 26 26 0 0 1 58 32" fill="none" stroke="#1e293b" strokeWidth="6" strokeLinecap="round" />
        {/* Value Arc */}
        <path
          d="M 6 32 A 26 26 0 0 1 58 32"
          fill="none" stroke={color} strokeWidth="6" strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
          style={{ filter: `drop-shadow(0 0 6px ${color})`, transition: 'stroke-dashoffset 0.8s cubic-bezier(0.16,1,0.3,1)' }}
        />
      </svg>
    </div>
  );
};



export const Dashboard: React.FC = () => {
  const { trades, isLoading } = useTrades();
  const m = usePerformanceMetrics(trades);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <div className="w-8 h-8 border-2 border-[#6366f1]/30 border-t-[#6366f1] rounded-full animate-spin" />
        <span className="text-xs text-slate-400 font-mono">Chargement du Dashboard Seven Tracking...</span>
      </div>
    );
  }

  const equityData = [{ tradeIndex: 0, pnl: 0, date: 'Début' }, ...m.equityCurve];
  const isPositive = m.netPnL >= 0;

  return (
    <div className="space-y-6 page-enter">

      {/* ── MARKET OVERVIEW HEADER ─── */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h2 className="text-xl font-heading font-bold text-white tracking-tight">Market Overview</h2>
          <p className="text-xs text-slate-400 font-mono mt-0.5">Tableau de bord personnel · Seven Tracking</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-[#181920]/80 backdrop-blur border border-white/[0.06] rounded-xl px-3 py-2">
            <div className="live-dot" />
            <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-wider">LIVE</span>
          </div>
          <div className="flex items-center gap-2 bg-[#181920]/80 backdrop-blur border border-white/[0.06] rounded-xl px-3 py-2">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[11px] font-mono text-slate-300 tabular-nums">
              {now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          </div>
        </div>
      </div>

      {/* ── TOP KPI SUMMARY CARDS ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        
        {/* Net P&L + Sparkline */}
        <div className="bg-[#0e0f14]/95 backdrop-blur-xl border border-white/[0.08] rounded-2xl p-5 hover:border-[#6366f1]/40 hover:shadow-[0_0_30px_rgba(99,102,241,0.15)] transition-all flex flex-col gap-2 group">
          <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-400">Net P&L</span>
          <div className={`text-2xl font-heading font-black tabular-nums tracking-tight ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}
            style={{ filter: `drop-shadow(0 0 12px ${isPositive ? '#10b981' : '#ef4444'})` }}>
            {m.netPnL >= 0 ? '+' : ''}${m.netPnL.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="flex items-center justify-between">
            <div className="text-[11px] text-slate-400 font-mono">{m.totalTrades} trades</div>
            <div className="opacity-80">
              {m.equityCurve.length > 1 && (
                <Sparkline
                  data={m.equityCurve.map(e => ({ value: e.pnl }))}
                  color={isPositive ? '#10b981' : '#ef4444'}
                  width={60} height={32}
                />
              )}
            </div>
          </div>
        </div>

        {/* Win Rate % avec gauge */}
        <div className="stat-card p-5 flex items-center justify-between group">
          <div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-400 block mb-1">Win Rate</span>
            <div className="kpi-value text-2xl text-white">{m.winRate.toFixed(1)}%</div>
            <div className="text-[11px] text-slate-400 font-mono mt-1">
              <span className="text-emerald-400 font-bold">{m.winCount}W</span> · <span className="text-red-400 font-bold">{m.lossCount}L</span>
            </div>
          </div>
          <SemiCircleGauge percent={m.winRate} color={m.winRate >= 50 ? '#10b981' : '#ef4444'} />
        </div>

        {/* Profit Factor */}
        <div className="stat-card p-5 flex items-center justify-between group">
          <div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-400 block mb-1">Profit Factor</span>
            <div className="kpi-value text-2xl text-[#818cf8]">{m.profitFactor === Infinity ? '∞' : m.profitFactor.toFixed(2)}</div>
            <div className="text-[11px] text-slate-400 font-mono mt-1">
              G: ${m.grossProfit.toFixed(0)} · P: ${m.grossLoss.toFixed(0)}
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-[#6366f1]/10 border border-[#6366f1]/20 group-hover:scale-110 transition-transform">
            <Target className="w-5 h-5 text-[#818cf8]" />
          </div>
        </div>

        {/* Day Win Rate % */}
        <div className="stat-card p-5 flex items-center justify-between group">
          <div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-400 block mb-1">Day Win %</span>
            <div className="kpi-value text-2xl text-white">{m.dayWinRate.toFixed(1)}%</div>
            <div className="text-[11px] text-slate-400 font-mono mt-1">Jours gagnants</div>
          </div>
          <SemiCircleGauge percent={m.dayWinRate} color={m.dayWinRate >= 50 ? '#10b981' : '#ef4444'} />
        </div>

        {/* Max Drawdown */}
        <div className="stat-card p-5 flex items-center justify-between group">
          <div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-400 block mb-1">Max Drawdown</span>
            <div className="kpi-value text-2xl text-red-400" style={{ filter: 'drop-shadow(0 0 8px #ef4444)' }}>-${m.maxDrawdown.toFixed(2)}</div>
            <div className="text-[11px] text-slate-400 font-mono mt-1">Perte max</div>
          </div>
          <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 group-hover:scale-110 transition-transform">
            <TrendingDown className="w-5 h-5 text-red-400" />
          </div>
        </div>

      </div>

      {/* ── CHARTS SECTION ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Glowing Equity Curve */}
        <div className="chart-container lg:col-span-2 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-heading font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
              <span className="w-1 h-3.5 rounded-full" style={{background: 'linear-gradient(180deg,#6366f1,#8b5cf6)'}} />
              Courbe d'Équité — Glowing
            </h3>
            <span className={`text-xs font-mono font-bold ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}
              style={{ filter: `drop-shadow(0 0 6px ${isPositive ? '#10b981' : '#ef4444'})` }}>
              {m.netPnL >= 0 ? '+' : ''}${m.netPnL.toFixed(2)}
            </span>
          </div>
          <GlowingEquityChart data={equityData} dataKey="pnl" height={256} isPositive={isPositive} />
        </div>

        {/* Donut Win/Loss + P&L Quotidien */}
        <div className="chart-container p-5 space-y-3 flex flex-col">
          <h3 className="text-xs font-heading font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
            <span className="w-1 h-3.5 rounded-full" style={{background: 'linear-gradient(180deg,#8b5cf6,#06b6d4)'}} />
            Win / Loss Ratio
          </h3>
          <DonutRingChart wins={m.winCount} losses={m.lossCount} height={180} />
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="text-center p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <div className="text-lg font-heading font-black text-emerald-400" style={{ filter: 'drop-shadow(0 0 8px #10b981)' }}>{m.winCount}</div>
              <div className="text-[10px] font-mono text-slate-400">WINS</div>
            </div>
            <div className="text-center p-2 rounded-xl bg-red-500/10 border border-red-500/20">
              <div className="text-lg font-heading font-black text-red-400" style={{ filter: 'drop-shadow(0 0 8px #ef4444)' }}>{m.lossCount}</div>
              <div className="text-[10px] font-mono text-slate-400">LOSSES</div>
            </div>
          </div>
        </div>

      </div>

      {/* P&L Quotidien — Gradient Bar Chart */}
      <div className="chart-container p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-heading font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
            <span className="w-1 h-3.5 rounded-full" style={{background: 'linear-gradient(180deg,#06b6d4,#6366f1)'}} />
            P&L Quotidien — Gradient Bars
          </h3>
        </div>
        <GradientBarChart data={m.dailyPnL} dataKey="pnl" height={180} />
      </div>

      {/* ── METRICS BREAKDOWN ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 stagger-children">

        <div className="stat-card p-5 space-y-3 animate-slide-up">
          <h4 className="text-xs font-heading font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#6366f1]" />
            Détail des Métriques
          </h4>
          <div className="space-y-2 text-xs divide-y divide-[#262833]">
            <div className="flex justify-between py-2">
              <span className="text-slate-400">Meilleur Trade</span>
              <span className="font-bold text-emerald-400">{m.bestTrade?.pnl ? `+$${m.bestTrade.pnl.toFixed(2)}` : '—'}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-slate-400">Pire Trade</span>
              <span className="font-bold text-red-400">{m.worstTrade?.pnl ? `$${m.worstTrade.pnl.toFixed(2)}` : '—'}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-slate-400">Gain Moyen</span>
              <span className="font-bold text-emerald-400">+${m.avgWin.toFixed(2)}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-slate-400">Perte Moyenne</span>
              <span className="font-bold text-red-400">${m.avgLoss.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="stat-card p-5 space-y-3 animate-slide-up">
          <h4 className="text-xs font-heading font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <Zap className="w-4 h-4 text-[#8b5cf6]" />
            Vue d'Ensemble
          </h4>
          <div className="space-y-2 text-xs divide-y divide-white/[0.05]">
            <div className="flex justify-between py-2">
              <span className="text-slate-400">Positions Clôturées</span>
              <span className="font-mono font-bold text-slate-200">{m.closedTrades}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-slate-400">Positions En Cours</span>
              <span className="font-mono font-bold text-[#818cf8]">{m.openTrades}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-slate-400">Consistency Score</span>
              <span className={`font-mono font-bold ${m.consistency.alert ? 'text-red-400' : 'text-emerald-400'}`}>
                {m.consistency.score.toFixed(1)}% {m.consistency.alert ? '⚠ >15%' : '✓ OK'}
              </span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-slate-400">Gain Brut</span>
              <span className="font-mono font-bold text-emerald-400">+${m.grossProfit.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="stat-card p-5 space-y-3 animate-slide-up">
          <h4 className="text-xs font-heading font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <Brain className="w-4 h-4 text-[#06b6d4]" />
            Psychologie & R-Multiple
          </h4>
          <div className="space-y-2 text-xs divide-y divide-white/[0.05]">
            <div className="flex justify-between py-2">
              <span className="text-slate-400">R-Multiple Moyen</span>
              <span className={`font-mono font-bold ${m.avgRMultiple >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {m.avgRMultiple >= 0 ? '+' : ''}{m.avgRMultiple.toFixed(2)} R
              </span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-slate-400">Total Positions</span>
              <span className="font-mono font-bold text-slate-200">{m.totalTrades}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-slate-400">Payoff Ratio</span>
              <span className="font-mono font-bold text-[#818cf8]">
                {m.avgLoss !== 0 ? Math.abs(m.avgWin / m.avgLoss).toFixed(2) : '—'}
              </span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-slate-400">Statut Session</span>
              <div className="flex items-center gap-1.5">
                <div className="live-dot" />
                <span className="font-mono font-bold text-emerald-400">Actif</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* ── MONTHLY PERFORMANCE & RECENT TRADES ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Performance par Mois — Gradient Bars */}
        <div className="chart-container p-5 space-y-3 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-heading font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#6366f1]" />
              Performance Mensuelle
            </h3>
          </div>

          <GradientBarChart
            data={m.monthlyPerformance.map(e => ({ ...e, date: e.month }))}
            dataKey="pnl"
            height={192}
          />

          {m.monthlyPerformance.length === 0 && (
            <div className="text-center py-6 text-slate-500 text-xs font-medium">
              Aucune donnée mensuelle disponible.
            </div>
          )}
        </div>

        {/* 3 Trades Récents */}
        <div className="chart-container p-5 space-y-4">
          <h3 className="text-xs font-heading font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
            <History className="w-4 h-4 text-[#8b5cf6]" />
            Derniers Trades
          </h3>

          <Table headers={['PAIRE', 'DIRECTION', 'LOTS', 'RESULT', 'P&L']}>
            {m.recentTrades.map((t) => (
              <TableRow key={t.id}>
                <TableCell className="font-bold text-white">{t.pair}</TableCell>
                <TableCell>
                  <Badge variant={t.direction === 'BUY' ? 'green' : 'indigo'}>
                    {t.direction}
                  </Badge>
                </TableCell>
                <TableCell>{t.size}</TableCell>
                <TableCell>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    t.result === 'TP' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                    t.result === 'SL' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                    'bg-slate-800 text-slate-400'
                  }`}>
                    {t.result}
                  </span>
                </TableCell>
                <TableCell className={`font-bold ${t.pnl && t.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {t.pnl !== null ? `${t.pnl >= 0 ? '+' : ''}$${t.pnl.toFixed(2)}` : 'OPEN'}
                </TableCell>
              </TableRow>
            ))}
          </Table>

          {m.recentTrades.length === 0 && (
            <div className="text-center py-6 text-slate-500 text-xs font-medium">
              Aucun trade récent enregistré.
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
