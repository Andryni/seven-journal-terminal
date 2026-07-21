import React from 'react';
import { useTrades } from '../trades/useTrades';
import { usePerformanceMetrics } from './usePerformanceMetrics';
import {
  TrendingUp, Target,
  TrendingDown, Activity, Brain, History, BarChart2
} from 'lucide-react';
import {
  AreaChart, Area,
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, ReferenceLine, Cell, CartesianGrid
} from 'recharts';
import { Badge } from '../../components/ui/Badge';

// ── Tooltip partagé ────────────────────────────────────────────────────────────
const ChartTooltip = ({ active, payload, label }: {
  active?: boolean; payload?: { value: number; name?: string }[]; label?: string;
}) => {
  if (!active || !payload?.length) return null;
  const val = payload[0].value;
  return (
    <div className="bg-[#181920] border border-[#262833] px-3 py-2 rounded-xl text-xs shadow-xl">
      <div className="text-slate-400 text-[11px] mb-0.5">{label}</div>
      <div className={`font-bold tabular-nums ${val >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
        {val >= 0 ? '+' : ''}${val.toLocaleString('en-US', { minimumFractionDigits: 2 })}
      </div>
    </div>
  );
};

// ── Gauge SVG demi-cercle ──────────────────────────────────────────────────────
const SemiCircleGauge = ({ percent, color = '#10b981' }: { percent: number; color?: string }) => {
  const r = 24;
  const circ = Math.PI * r;
  const offset = circ - (Math.min(Math.max(percent, 0), 100) / 100) * circ;
  return (
    <div className="relative w-14 h-8 flex items-center justify-center shrink-0">
      <svg className="w-14 h-8 transform -rotate-180" viewBox="0 0 56 30">
        <path d="M 4 28 A 22 22 0 0 1 52 28" fill="none" stroke="#262833" strokeWidth="5" strokeLinecap="round" />
        <path d="M 4 28 A 22 22 0 0 1 52 28" fill="none" stroke={color} strokeWidth="5"
          strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.5s ease-out' }} />
      </svg>
    </div>
  );
};

// ── Stat Row minimaliste ───────────────────────────────────────────────────────
const StatRow = ({ label, value, colorClass = 'text-slate-200' }: {
  label: string; value: string; colorClass?: string;
}) => (
  <div className="flex justify-between items-center py-1.5 border-b border-[#1e2029] last:border-0">
    <span className="text-[11px] text-slate-400">{label}</span>
    <span className={`text-[11px] font-bold tabular-nums ${colorClass}`}>{value}</span>
  </div>
);

// ── KPI Card compact ───────────────────────────────────────────────────────────
const KpiCard = ({
  label, value, sub, colorClass = 'text-white', icon, gauge
}: {
  label: string; value: string; sub?: string; colorClass?: string;
  icon: React.ReactNode; gauge?: React.ReactNode;
}) => (
  <div className="bg-[#181920] border border-[#262833] rounded-xl px-4 py-3 hover:border-[#363948] transition-all flex items-center justify-between gap-3">
    <div className="min-w-0 flex-1">
      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block leading-none mb-1">{label}</span>
      <div className={`text-xl font-black tabular-nums tracking-tight leading-none ${colorClass}`}>{value}</div>
      {sub && <div className="text-[10px] text-slate-500 mt-0.5">{sub}</div>}
    </div>
    {gauge ?? icon}
  </div>
);

// ═══════════════════════════════════════════════════════════════════════════════
export const Dashboard: React.FC = () => {
  const { trades, isLoading } = useTrades();
  const m = usePerformanceMetrics(trades);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3">
        <div className="w-8 h-8 border-2 border-[#6366f1]/30 border-t-[#6366f1] rounded-full animate-spin" />
        <span className="text-xs text-slate-400 font-medium">Chargement de Seven Tracking...</span>
      </div>
    );
  }

  const equityData = [{ tradeIndex: 0, pnl: 0, date: 'Début' }, ...m.equityCurve];
  const isPositive = m.netPnL >= 0;

  // Données graphique mensuel — on abrège le mois pour plus de lisibilité
  const monthlyChartData = m.monthlyPerformance.map(mp => ({
    month: mp.month.slice(0, 3),
    pnl: mp.pnl,
  }));

  return (
    <div className="flex flex-col gap-3 h-full page-enter">

      {/* ── ROW 1 : 5 KPI CARDS ───────────────────────────────────────────── */}
      <div className="grid grid-cols-5 gap-3 shrink-0">
        <KpiCard
          label="Net P&L"
          value={`${m.netPnL >= 0 ? '+' : ''}$${m.netPnL.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
          sub={`${m.totalTrades} trade${m.totalTrades > 1 ? 's' : ''}`}
          colorClass={isPositive ? 'text-emerald-400' : 'text-red-400'}
          icon={
            <div className="p-2 rounded-xl bg-[#20222c]">
              {isPositive
                ? <TrendingUp className="w-4 h-4 text-emerald-400" />
                : <TrendingDown className="w-4 h-4 text-red-400" />}
            </div>
          }
        />
        <KpiCard
          label="Trade win %"
          value={`${m.winRate.toFixed(1)}%`}
          sub={`${m.winCount}G · ${m.lossCount}P`}
          colorClass="text-white"
          icon={null}
          gauge={<SemiCircleGauge percent={m.winRate} color={m.winRate >= 50 ? '#10b981' : '#ef4444'} />}
        />
        <KpiCard
          label="Profit Factor"
          value={m.profitFactor === Infinity ? '∞' : m.profitFactor.toFixed(2)}
          sub={`G $${m.grossProfit.toFixed(0)} · P $${m.grossLoss.toFixed(0)}`}
          colorClass="text-white"
          icon={<div className="p-2 rounded-xl bg-[#20222c]"><Target className="w-4 h-4 text-[#818cf8]" /></div>}
        />
        <KpiCard
          label="Day win %"
          value={`${m.dayWinRate.toFixed(1)}%`}
          sub="Jours gagnants / total"
          colorClass="text-white"
          icon={null}
          gauge={<SemiCircleGauge percent={m.dayWinRate} color={m.dayWinRate >= 50 ? '#10b981' : '#ef4444'} />}
        />
        <KpiCard
          label="Max Drawdown"
          value={`-$${m.maxDrawdown.toFixed(2)}`}
          sub="Perte max enregistrée"
          colorClass="text-red-400"
          icon={
            <div className="p-2 rounded-xl bg-red-500/10 border border-red-500/20">
              <TrendingDown className="w-4 h-4 text-red-400" />
            </div>
          }
        />
      </div>

      {/* ── ROW 2 : CHARTS + METRICS ──────────────────────────────────────── */}
      <div className="grid grid-cols-12 gap-3 flex-1 min-h-0">

        {/* Equity Curve — col 5 */}
        <div className="col-span-5 bg-[#181920] border border-[#262833] rounded-xl p-4 flex flex-col gap-2 min-h-0">
          <div className="flex items-center justify-between shrink-0">
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <span className="w-1 h-3 bg-[#6366f1] rounded-full" />
              Equity Curve
            </h3>
            <span className={`text-xs font-bold ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
              {m.netPnL >= 0 ? '+' : ''}${m.netPnL.toFixed(2)}
            </span>
          </div>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={equityData} margin={{ top: 6, right: 6, left: -24, bottom: 0 }}>
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
                <CartesianGrid stroke="rgba(255,255,255,0.04)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" stroke="#64748b" fontSize={9} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={9} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                <Tooltip content={<ChartTooltip />} />
                <ReferenceLine y={0} stroke="#262833" strokeDasharray="3 3" />
                <Area type="monotone" dataKey="pnl"
                  stroke={isPositive ? '#10b981' : '#ef4444'} strokeWidth={2}
                  fill={`url(#${isPositive ? 'pnlGradGreen' : 'pnlGradRed'})`} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Performance par Mois (graphique) — col 4 */}
        <div className="col-span-4 bg-[#181920] border border-[#262833] rounded-xl p-4 flex flex-col gap-2 min-h-0">
          <div className="flex items-center justify-between shrink-0">
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <span className="w-1 h-3 bg-[#6366f1] rounded-full" />
              Performance par Mois
            </h3>
            <BarChart2 className="w-3.5 h-3.5 text-slate-500" />
          </div>
          <div className="flex-1 min-h-0">
            {monthlyChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyChartData} margin={{ top: 6, right: 6, left: -24, bottom: 0 }} barSize={14}>
                  <CartesianGrid stroke="rgba(255,255,255,0.04)" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" stroke="#64748b" fontSize={9} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748b" fontSize={9} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                  <Tooltip content={<ChartTooltip />} />
                  <ReferenceLine y={0} stroke="#262833" />
                  <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                    {monthlyChartData.map((entry, i) => (
                      <Cell key={i} fill={entry.pnl >= 0 ? '#10b981' : '#ef4444'}
                        fillOpacity={0.85} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-500 text-xs">
                Aucune donnée mensuelle.
              </div>
            )}
          </div>
        </div>

        {/* Métriques condensées — col 3 */}
        <div className="col-span-3 flex flex-col gap-3 min-h-0">

          {/* Détail */}
          <div className="bg-[#181920] border border-[#262833] rounded-xl p-4 flex-1 flex flex-col gap-1 min-h-0">
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5 shrink-0 mb-1">
              <Activity className="w-3.5 h-3.5 text-[#6366f1]" />
              Métriques
            </h4>
            <StatRow label="Meilleur Trade" value={m.bestTrade?.pnl ? `+$${m.bestTrade.pnl.toFixed(2)}` : '—'} colorClass="text-emerald-400" />
            <StatRow label="Pire Trade" value={m.worstTrade?.pnl ? `$${m.worstTrade.pnl.toFixed(2)}` : '—'} colorClass="text-red-400" />
            <StatRow label="Gain Moyen" value={`+$${m.avgWin.toFixed(2)}`} colorClass="text-emerald-400" />
            <StatRow label="Perte Moyenne" value={`$${m.avgLoss.toFixed(2)}`} colorClass="text-red-400" />
            <StatRow label="Payoff Ratio" value={m.avgLoss !== 0 ? Math.abs(m.avgWin / m.avgLoss).toFixed(2) : '—'} colorClass="text-[#818cf8]" />
          </div>

          {/* Psychologie */}
          <div className="bg-[#181920] border border-[#262833] rounded-xl p-4 flex-1 flex flex-col gap-1 min-h-0">
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5 shrink-0 mb-1">
              <Brain className="w-3.5 h-3.5 text-[#6366f1]" />
              Vue d'Ensemble
            </h4>
            <StatRow label="Trades clôturés" value={`${m.closedTrades}`} />
            <StatRow label="Trades en cours" value={`${m.openTrades}`} colorClass="text-[#818cf8]" />
            <StatRow label="Consistency" value={`${m.consistency.score.toFixed(1)}%`}
              colorClass={m.consistency.alert ? 'text-red-400' : 'text-emerald-400'} />
            <StatRow label="R-Mult. moyen" value={`${m.avgRMultiple >= 0 ? '+' : ''}${m.avgRMultiple.toFixed(2)} R`}
              colorClass={m.avgRMultiple >= 0 ? 'text-emerald-400' : 'text-red-400'} />
            <StatRow label="Gain Brut" value={`+$${m.grossProfit.toFixed(2)}`} colorClass="text-emerald-400" />
          </div>

        </div>
      </div>

      {/* ── ROW 3 : DAILY P&L BAR + 5 TRADES RÉCENTS ─────────────────────── */}
      <div className="grid grid-cols-12 gap-3 shrink-0" style={{ height: '160px' }}>

        {/* Daily P&L Bar */}
        <div className="col-span-6 bg-[#181920] border border-[#262833] rounded-xl p-4 flex flex-col gap-2">
          <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5 shrink-0">
            <span className="w-1 h-3 bg-[#6366f1] rounded-full" />
            Net Daily P&L
          </h3>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={m.dailyPnL} margin={{ top: 4, right: 6, left: -24, bottom: 0 }} barSize={10}>
                <XAxis dataKey="date" stroke="#64748b" fontSize={9} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={9} tickLine={false} axisLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <ReferenceLine y={0} stroke="#262833" />
                <Bar dataKey="pnl" radius={[3, 3, 0, 0]}>
                  {m.dailyPnL.map((entry, i) => (
                    <Cell key={i} fill={entry.pnl >= 0 ? '#10b981' : '#ef4444'} fillOpacity={0.8} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 5 Trades Récents */}
        <div className="col-span-6 bg-[#181920] border border-[#262833] rounded-xl p-4 flex flex-col gap-2 overflow-hidden">
          <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5 shrink-0">
            <History className="w-3.5 h-3.5 text-[#6366f1]" />
            5 Trades Récents
          </h3>
          {m.recentTrades.length === 0 ? (
            <div className="flex items-center justify-center flex-1 text-slate-500 text-xs">
              Aucun trade enregistré.
            </div>
          ) : (
            <div className="flex flex-col gap-1 overflow-hidden">
              {m.recentTrades.map((t) => (
                <div key={t.id}
                  className="flex items-center justify-between text-[11px] px-2 py-1 rounded-lg bg-[#13141a] border border-[#1e2029]">
                  <span className="font-bold text-white w-20">{t.pair}</span>
                  <Badge variant={t.direction === 'BUY' ? 'green' : 'indigo'}>
                    {t.direction}
                  </Badge>
                  <span className="text-slate-400 w-12 text-center">{t.size} lots</span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    t.result === 'TP' ? 'bg-emerald-500/10 text-emerald-400' :
                    t.result === 'SL' ? 'bg-red-500/10 text-red-400' :
                    'bg-slate-800 text-slate-400'
                  }`}>
                    {t.result}
                  </span>
                  <span className={`font-bold w-20 text-right tabular-nums ${t.pnl && t.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {t.pnl !== null ? `${t.pnl >= 0 ? '+' : ''}$${t.pnl.toFixed(2)}` : 'OPEN'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
