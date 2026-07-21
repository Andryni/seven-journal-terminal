import React from 'react';
import { useTrades } from '../trades/useTrades';
import { usePerformanceMetrics } from './usePerformanceMetrics';
import {
  TrendingUp, Percent, Target,
  TrendingDown, Activity, Award, Zap, Brain
} from 'lucide-react';
import {
  AreaChart, Area,
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, ReferenceLine, Cell
} from 'recharts';

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

const KpiTile = ({ label, value, sub, icon: Icon, isPositive }: {
  label: string;
  value: string;
  sub: string;
  icon: React.FC<{ className?: string }>;
  isPositive?: boolean;
}) => {
  return (
    <div className="bg-[#181920] border border-[#262833] rounded-xl p-5 hover:border-[#363948] transition-all flex flex-col justify-between">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-slate-400">{label}</span>
        <div className="p-2 rounded-lg bg-[#20222c] text-slate-300">
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div>
        <div className={`text-2xl font-bold tabular-nums tracking-tight mb-1 ${
          isPositive === true ? 'text-emerald-400' : isPositive === false ? 'text-red-400' : 'text-white'
        }`}>
          {value}
        </div>
        <div className="text-xs text-slate-500 font-medium">
          {sub}
        </div>
      </div>
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
        <span className="text-xs text-slate-400 font-medium">Chargement des métriques...</span>
      </div>
    );
  }

  const equityData = [{ tradeIndex: 0, pnl: 0, date: 'Début' }, ...m.equityCurve];
  const isPositive = m.netPnL >= 0;

  return (
    <div className="space-y-6 page-enter">

      {/* ── TOP KPI SUMMARY CARDS ────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiTile
          label="Net P&L"
          value={`${m.netPnL >= 0 ? '+' : ''}$${m.netPnL.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
          sub={`${m.totalTrades} trade${m.totalTrades > 1 ? 's' : ''} au total`}
          icon={m.netPnL >= 0 ? TrendingUp : TrendingDown}
          isPositive={isPositive}
        />
        <KpiTile
          label="Win Rate %"
          value={`${m.winRate.toFixed(1)}%`}
          sub={`${m.winCount} Gagnants · ${m.lossCount} Perdants`}
          icon={Percent}
          isPositive={m.winRate >= 50}
        />
        <KpiTile
          label="Profit Factor"
          value={m.profitFactor === Infinity ? '∞' : m.profitFactor.toFixed(2)}
          sub={`Gains: $${m.grossProfit.toFixed(0)} · Pertes: $${m.grossLoss.toFixed(0)}`}
          icon={Target}
          isPositive={m.profitFactor >= 1.5}
        />
        <KpiTile
          label="Avg R-Multiple"
          value={`${m.avgRMultiple >= 0 ? '+' : ''}${m.avgRMultiple.toFixed(2)} R`}
          sub={`Consistency Score: ${m.consistency.score.toFixed(1)}%`}
          icon={Award}
          isPositive={m.avgRMultiple >= 0}
        />
      </div>

      {/* ── CHARTS SECTION (TradeZella Style) ───────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Cumulative P&L Area Chart */}
        <div className="lg:col-span-2 bg-[#181920] border border-[#262833] rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
              <span className="w-1 h-3.5 bg-[#6366f1] rounded-full" />
              P&L Cumulé ($)
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
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="pnlGradRed" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
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
                  strokeWidth={2}
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
              P&L par Jour ($)
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

      {/* ── ADDITIONAL STATS TILES ──────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* Key Metrics Breakdown */}
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

        {/* Streaks & Discipline */}
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

        {/* Mindset & Psychology */}
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

    </div>
  );
};
