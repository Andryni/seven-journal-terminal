import React from 'react';
import { useTrades } from '../trades/useTrades';
import { usePerformanceMetrics } from './usePerformanceMetrics';
import {
  TrendingUp, Target,
  TrendingDown, Activity, Zap, Brain, Calendar, History
} from 'lucide-react';
import {
  AreaChart, Area,
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, ReferenceLine, Cell
} from 'recharts';
import { Table, TableRow, TableCell } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';

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
        {/* Background Arc */}
        <path
          d="M 6 32 A 26 26 0 0 1 58 32"
          fill="none"
          stroke="#262833"
          strokeWidth="6"
          strokeLinecap="round"
        />
        {/* Value Arc */}
        <path
          d="M 6 32 A 26 26 0 0 1 58 32"
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          style={{ transition: 'stroke-dashoffset 0.5s ease-out' }}
        />
      </svg>
    </div>
  );
};

export const Dashboard: React.FC = () => {
  const { trades, isLoading } = useTrades();
  const m = usePerformanceMetrics(trades);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <div className="w-8 h-8 border-2 border-[#6366f1]/30 border-t-[#6366f1] rounded-full animate-spin" />
        <span className="text-xs text-slate-400 font-medium">Chargement du Dashboard Seven Tracking...</span>
      </div>
    );
  }

  const equityData = [{ tradeIndex: 0, pnl: 0, date: 'Début' }, ...m.equityCurve];
  const isPositive = m.netPnL >= 0;

  return (
    <div className="space-y-6 page-enter">

      {/* ── TOP KPI SUMMARY CARDS (TradeZella Style with Gauges & Max Drawdown) ──────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        
        {/* Net P&L */}
        <div className="bg-[#181920] border border-[#262833] rounded-xl p-5 hover:border-[#363948] transition-all flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 block mb-1">Net P&L</span>
            <div className={`text-2xl font-black tabular-nums tracking-tight ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
              {m.netPnL >= 0 ? '+' : ''}${m.netPnL.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-[11px] text-slate-500 font-medium mt-1">
              {m.totalTrades} trade{m.totalTrades > 1 ? 's' : ''} au total
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-[#20222c] text-[#6366f1]">
            {isPositive ? <TrendingUp className="w-5 h-5 text-emerald-400" /> : <TrendingDown className="w-5 h-5 text-red-400" />}
          </div>
        </div>

        {/* Win Rate % */}
        <div className="bg-[#181920] border border-[#262833] rounded-xl p-5 hover:border-[#363948] transition-all flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 block mb-1">Trade win %</span>
            <div className="text-2xl font-bold text-white tabular-nums tracking-tight">
              {m.winRate.toFixed(1)}%
            </div>
            <div className="text-[11px] text-slate-500 font-medium mt-1">
              <span className="text-emerald-400 font-semibold">{m.winCount} G</span> · <span className="text-red-400 font-semibold">{m.lossCount} P</span>
            </div>
          </div>
          <SemiCircleGauge percent={m.winRate} color={m.winRate >= 50 ? '#10b981' : '#ef4444'} />
        </div>

        {/* Profit Factor */}
        <div className="bg-[#181920] border border-[#262833] rounded-xl p-5 hover:border-[#363948] transition-all flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 block mb-1">Profit factor</span>
            <div className="text-2xl font-bold text-white tabular-nums tracking-tight">
              {m.profitFactor === Infinity ? '∞' : m.profitFactor.toFixed(2)}
            </div>
            <div className="text-[11px] text-slate-500 font-medium mt-1">
              Gains: ${m.grossProfit.toFixed(0)} · Pertes: ${m.grossLoss.toFixed(0)}
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-[#20222c] text-[#818cf8]">
            <Target className="w-5 h-5 text-[#818cf8]" />
          </div>
        </div>

        {/* Day Win Rate % */}
        <div className="bg-[#181920] border border-[#262833] rounded-xl p-5 hover:border-[#363948] transition-all flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 block mb-1">Day win %</span>
            <div className="text-2xl font-bold text-white tabular-nums tracking-tight">
              {m.dayWinRate.toFixed(1)}%
            </div>
            <div className="text-[11px] text-slate-500 font-medium mt-1">
              Jours gagnants / total
            </div>
          </div>
          <SemiCircleGauge percent={m.dayWinRate} color={m.dayWinRate >= 50 ? '#10b981' : '#ef4444'} />
        </div>

        {/* Max Drawdown */}
        <div className="bg-[#181920] border border-[#262833] rounded-xl p-5 hover:border-[#363948] transition-all flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 block mb-1">Max Drawdown</span>
            <div className="text-2xl font-bold text-red-400 tabular-nums tracking-tight">
              -${m.maxDrawdown.toFixed(2)}
            </div>
            <div className="text-[11px] text-slate-500 font-medium mt-1">
              Perte max enregistrée
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
            <TrendingDown className="w-5 h-5" />
          </div>
        </div>

      </div>

      {/* ── CHARTS SECTION (TradeZella Area + Bar Charts) ───────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Cumulative P&L Area Chart */}
        <div className="lg:col-span-2 bg-[#181920] border border-[#262833] rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
              <span className="w-1 h-3.5 bg-[#6366f1] rounded-full" />
              Daily Net Cumulative P&L ($)
            </h3>
            <span className={`text-xs font-bold font-mono ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
              {m.netPnL >= 0 ? '+' : ''}${m.netPnL.toFixed(2)}
            </span>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={equityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="pnlGradGreen" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="pnlGradRed" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                <Tooltip content={<ChartTooltip />} />
                <ReferenceLine y={0} stroke="#262833" strokeDasharray="3 3" />
                <Area
                  type="monotone"
                  dataKey="pnl"
                  stroke={isPositive ? '#10b981' : '#ef4444'}
                  strokeWidth={2.5}
                  fill={`url(#${isPositive ? 'pnlGradGreen' : 'pnlGradRed'})`}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Daily P&L Bar Chart */}
        <div className="bg-[#181920] border border-[#262833] rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
              <span className="w-1 h-3.5 bg-[#6366f1] rounded-full" />
              Net Daily P&L ($)
            </h3>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={m.dailyPnL} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="date" stroke="#64748b" fontSize={9} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <ReferenceLine y={0} stroke="#262833" />
                <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                  {m.dailyPnL.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? '#10b981' : '#ef4444'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* ── METRICS BREAKDOWN ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        <div className="bg-[#181920] border border-[#262833] rounded-xl p-5 space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
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

        <div className="bg-[#181920] border border-[#262833] rounded-xl p-5 space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <Zap className="w-4 h-4 text-[#6366f1]" />
            Vue d'Ensemble
          </h4>
          <div className="space-y-2 text-xs divide-y divide-[#262833]">
            <div className="flex justify-between py-2">
              <span className="text-slate-400">Positions Clôturées</span>
              <span className="font-bold text-slate-200">{m.closedTrades}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-slate-400">Positions En Cours</span>
              <span className="font-bold text-[#818cf8]">{m.openTrades}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-slate-400">Consistency Score</span>
              <span className={`font-bold ${m.consistency.alert ? 'text-red-400' : 'text-emerald-400'}`}>
                {m.consistency.score.toFixed(1)}% {m.consistency.alert ? '(Alerte >15%)' : '(Normal)'}
              </span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-slate-400">Gain Brut</span>
              <span className="font-bold text-emerald-400">+${m.grossProfit.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="bg-[#181920] border border-[#262833] rounded-xl p-5 space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <Brain className="w-4 h-4 text-[#6366f1]" />
            Psychologie & R-Multiple
          </h4>
          <div className="space-y-2 text-xs divide-y divide-[#262833]">
            <div className="flex justify-between py-2">
              <span className="text-slate-400">R-Multiple Moyen</span>
              <span className={`font-bold ${m.avgRMultiple >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {m.avgRMultiple >= 0 ? '+' : ''}{m.avgRMultiple.toFixed(2)} R
              </span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-slate-400">Total Positions</span>
              <span className="font-bold text-slate-200">{m.totalTrades}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-slate-400">Payoff Ratio</span>
              <span className="font-bold text-[#818cf8]">
                {m.avgLoss !== 0 ? Math.abs(m.avgWin / m.avgLoss).toFixed(2) : '—'}
              </span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-slate-400">Statut Session</span>
              <span className="font-bold text-emerald-400">Actif / Régulier</span>
            </div>
          </div>
        </div>

      </div>

      {/* ── NEW SECTION: MONTHLY PERFORMANCE & 5 RECENT TRADES (Zones Libres) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Performance par Mois */}
        <div className="bg-[#181920] border border-[#262833] rounded-xl p-5 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#6366f1]" />
            Performance par Mois
          </h3>

          <Table headers={['MOIS', 'TRADES', 'WIN RATE', 'NET P&L']}>
            {m.monthlyPerformance.map((mon, idx) => (
              <TableRow key={idx}>
                <TableCell className="font-bold text-white">{mon.month}</TableCell>
                <TableCell>{mon.count} trades</TableCell>
                <TableCell className={mon.winRate >= 50 ? 'text-emerald-400 font-semibold' : 'text-red-400 font-semibold'}>
                  {mon.winRate}%
                </TableCell>
                <TableCell className={`font-bold ${mon.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {mon.pnl >= 0 ? '+' : ''}${mon.pnl.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </TableCell>
              </TableRow>
            ))}
          </Table>

          {m.monthlyPerformance.length === 0 && (
            <div className="text-center py-6 text-slate-500 text-xs font-medium">
              Aucune donnée mensuelle disponible.
            </div>
          )}
        </div>

        {/* 5 Trades Récents */}
        <div className="bg-[#181920] border border-[#262833] rounded-xl p-5 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
            <History className="w-4 h-4 text-[#6366f1]" />
            5 Trades Récents
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
