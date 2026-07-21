import React from 'react';
import { useTrades } from '../trades/useTrades';
import { usePerformanceMetrics } from './usePerformanceMetrics';
import {
  AreaChart, Area,
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, ReferenceLine, Cell, CartesianGrid,
  RadarChart, Radar, PolarGrid, PolarAngleAxis
} from 'recharts';

/* ── Shared Tooltip ─────────────────────────────────────────────────────────── */
const ChartTooltip = ({ active, payload, label }: {
  active?: boolean; payload?: { value: number }[]; label?: string;
}) => {
  if (!active || !payload?.length) return null;
  const val = payload[0].value;
  return (
    <div className="bg-[#181920] border border-[#262833] px-3 py-1.5 rounded-lg text-xs shadow-xl">
      <div className="text-slate-500 text-[10px]">{label}</div>
      <div className={`font-bold tabular-nums ${val >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
        {val >= 0 ? '+' : ''}${val.toLocaleString('en-US', { minimumFractionDigits: 2 })}
      </div>
    </div>
  );
};

/* ── Semi-circle Gauge (like TradeZella win % arc) ──────────────────────────── */
const SemiGauge = ({ pct, color }: { pct: number; color: string }) => {
  const r = 22;
  const circ = Math.PI * r;
  const off = circ - (Math.min(Math.max(pct, 0), 100) / 100) * circ;
  return (
    <svg className="w-[52px] h-[30px] -rotate-180" viewBox="0 0 52 28">
      <path d="M 4 26 A 20 20 0 0 1 48 26" fill="none" stroke="#262833" strokeWidth="4.5" strokeLinecap="round" />
      <path d="M 4 26 A 20 20 0 0 1 48 26" fill="none" stroke={color} strokeWidth="4.5"
        strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={off}
        style={{ transition: 'stroke-dashoffset .6s ease-out' }} />
    </svg>
  );
};

/* ── Dot Legend (green / gray / red) ────────────────────────────────────────── */
const DotLegend = ({ values }: { values: [number, number, number] }) => (
  <div className="flex items-center gap-3 mt-1">
    {[['#10b981', values[0]], ['#6b7280', values[1]], ['#ef4444', values[2]]].map(([c, v], i) => (
      <span key={i} className="flex items-center gap-1 text-[10px] tabular-nums text-slate-400">
        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: c as string }} />
        {v as number}
      </span>
    ))}
  </div>
);

/* ═══════════════════════════════════════════════════════════════════════════════
   DASHBOARD
   ═══════════════════════════════════════════════════════════════════════════════ */
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

  const isPositive = m.netPnL >= 0;
  const equityData = [{ tradeIndex: 0, pnl: 0, date: 'Début' }, ...m.equityCurve];
  const beCount = Math.max(m.closedTrades - m.winCount - m.lossCount, 0);
  const avgWinLossRatio = m.avgLoss !== 0 ? Math.abs(m.avgWin / m.avgLoss) : 0;

  // Day-level stats
  const winDays = m.dailyPnL.filter(d => d.pnl > 0).length;
  const lossDays = m.dailyPnL.filter(d => d.pnl < 0).length;
  const beDays = m.dailyPnL.filter(d => d.pnl === 0).length;

  // ── Radar data (Seven Score) ──────────────────────────────────────────────
  const recoveryFactor = m.maxDrawdown > 0 ? m.netPnL / m.maxDrawdown : 0;
  const radarData = [
    { metric: 'Win %', value: Math.min(m.winRate, 100), fullMark: 100 },
    { metric: 'Profit factor', value: Math.min(m.profitFactor === Infinity ? 100 : (m.profitFactor / 5) * 100, 100), fullMark: 100 },
    { metric: 'Avg win/loss', value: Math.min((avgWinLossRatio / 3) * 100, 100), fullMark: 100 },
    { metric: 'Recovery factor', value: Math.min((Math.max(recoveryFactor, 0) / 5) * 100, 100), fullMark: 100 },
    { metric: 'Max drawdown', value: m.netPnL > 0 ? Math.max(100 - (m.maxDrawdown / m.netPnL) * 100, 0) : 0, fullMark: 100 },
    { metric: 'Consistency', value: Math.max(100 - m.consistency.score * 2, 0), fullMark: 100 },
  ];
  const sevenScore = radarData.length > 0
    ? Number((radarData.reduce((s, d) => s + d.value, 0) / radarData.length).toFixed(1))
    : 0;

  // Format dates for charts
  const equityChartData = equityData.map(d => ({
    ...d,
    date: d.date.length > 6 ? d.date : d.date,
  }));
  const dailyChartData = m.dailyPnL.map(d => ({
    ...d,
    date: new Date(d.date).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' }),
  }));

  return (
    <div className="flex flex-col gap-3 h-full page-enter">

      {/* ══════════════════════════════════════════════════════════════════════
          ROW 1 — 5 KPI CARDS (matching TradeZella exactly)
          ══════════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-5 gap-3 shrink-0">

        {/* ── Net P&L ──────────────────────────────────────────────────────── */}
        <div className="bg-[#181920] border border-[#262833] rounded-xl px-4 py-3 hover:border-[#363948] transition-all">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Net P&L</span>
            <span className="text-[9px] bg-[#262833] text-slate-400 px-1.5 py-0.5 rounded font-bold tabular-nums">{m.closedTrades}</span>
          </div>
          <div className={`text-[22px] font-black tabular-nums tracking-tight leading-none ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
            ${Math.abs(m.netPnL).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
        </div>

        {/* ── Trade win % ──────────────────────────────────────────────────── */}
        <div className="bg-[#181920] border border-[#262833] rounded-xl px-4 py-3 hover:border-[#363948] transition-all">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Trade win %</span>
              <div className="text-[22px] font-black text-white tabular-nums tracking-tight leading-none">
                {m.winRate.toFixed(2)}%
              </div>
            </div>
            <SemiGauge pct={m.winRate} color={m.winRate >= 50 ? '#10b981' : '#ef4444'} />
          </div>
          <DotLegend values={[m.winCount, beCount, m.lossCount]} />
        </div>

        {/* ── Profit Factor ────────────────────────────────────────────────── */}
        <div className="bg-[#181920] border border-[#262833] rounded-xl px-4 py-3 hover:border-[#363948] transition-all">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Profit factor</span>
          <div className="text-[22px] font-black text-white tabular-nums tracking-tight leading-none">
            {m.profitFactor >= 99 ? '∞' : m.profitFactor.toFixed(2)}
          </div>
        </div>

        {/* ── Day win % ────────────────────────────────────────────────────── */}
        <div className="bg-[#181920] border border-[#262833] rounded-xl px-4 py-3 hover:border-[#363948] transition-all">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Day win %</span>
              <div className="text-[22px] font-black text-white tabular-nums tracking-tight leading-none">
                {m.dayWinRate.toFixed(2)}%
              </div>
            </div>
            <SemiGauge pct={m.dayWinRate} color={m.dayWinRate >= 50 ? '#10b981' : '#ef4444'} />
          </div>
          <DotLegend values={[winDays, beDays, lossDays]} />
        </div>

        {/* ── Avg win/loss trade ────────────────────────────────────────────── */}
        <div className="bg-[#181920] border border-[#262833] rounded-xl px-4 py-3 hover:border-[#363948] transition-all">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Avg win/loss trade</span>
          </div>
          <div className="text-[22px] font-black text-white tabular-nums tracking-tight leading-none mb-2">
            {avgWinLossRatio.toFixed(2)}
          </div>
          {/* Mini horizontal bars */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 flex-1">
              <div className="h-[6px] rounded-full bg-emerald-500 flex-1" style={{ maxWidth: `${Math.min((m.avgWin / Math.max(m.avgWin, m.avgLoss, 1)) * 100, 100)}%` }} />
              <span className="text-[9px] text-emerald-400 font-bold tabular-nums whitespace-nowrap">${m.avgWin.toFixed(0)}</span>
            </div>
            <div className="flex items-center gap-1 flex-1">
              <div className="h-[6px] rounded-full bg-red-500 flex-1" style={{ maxWidth: `${Math.min((m.avgLoss / Math.max(m.avgWin, m.avgLoss, 1)) * 100, 100)}%` }} />
              <span className="text-[9px] text-red-400 font-bold tabular-nums whitespace-nowrap">-${m.avgLoss.toFixed(0)}</span>
            </div>
          </div>
        </div>

      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          ROW 2 — 3 EQUAL PANELS (Radar + Equity + Daily P&L)
          ══════════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-3 gap-3 flex-1 min-h-0">

        {/* ── Seven Score (Radar) ───────────────────────────────────────────── */}
        <div className="bg-[#181920] border border-[#262833] rounded-xl p-4 flex flex-col min-h-0">
          <h3 className="text-[11px] font-bold text-slate-300 mb-2 shrink-0">Seven score</h3>

          <div className="flex-1 min-h-0 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
                <PolarGrid stroke="#262833" />
                <PolarAngleAxis
                  dataKey="metric"
                  tick={{ fill: '#94a3b8', fontSize: 10 }}
                />
                <Radar
                  dataKey="value"
                  stroke="#818cf8"
                  strokeWidth={2}
                  fill="#6366f1"
                  fillOpacity={0.25}
                  dot={{ r: 3, fill: '#818cf8', strokeWidth: 0 }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* Score bar at bottom */}
          <div className="shrink-0 mt-2 border-t border-[#262833] pt-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-semibold text-slate-400">Your Seven Score</span>
              <span className="text-lg font-black text-white tabular-nums">{sevenScore}</span>
            </div>
            {/* Gradient score bar */}
            <div className="relative h-2 rounded-full overflow-hidden bg-[#262833]">
              <div className="absolute inset-0 rounded-full"
                style={{ background: 'linear-gradient(to right, #ef4444, #f59e0b, #10b981)' }} />
              {/* Indicator dot */}
              <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white border-2 border-[#0e0f12] shadow-lg transition-all"
                style={{ left: `calc(${Math.min(sevenScore, 100)}% - 6px)` }} />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-[8px] text-slate-500">0</span>
              <span className="text-[8px] text-slate-500">100</span>
            </div>
          </div>
        </div>

        {/* ── Daily net cumulative P&L (Equity Curve) ───────────────────────── */}
        <div className="bg-[#181920] border border-[#262833] rounded-xl p-4 flex flex-col min-h-0">
          <h3 className="text-[11px] font-bold text-slate-300 mb-2 shrink-0">Daily net cumulative P&L</h3>

          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={equityChartData} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
                <defs>
                  <linearGradient id="eqGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.04)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" stroke="#64748b" fontSize={9} tickLine={false} axisLine={false}
                  interval="preserveStartEnd" />
                <YAxis stroke="#64748b" fontSize={9} tickLine={false} axisLine={false}
                  tickFormatter={(v) => `$${v.toLocaleString()}`} />
                <Tooltip content={<ChartTooltip />} />
                <ReferenceLine y={0} stroke="#262833" strokeDasharray="3 3" />
                <Area type="monotone" dataKey="pnl" stroke="#10b981" strokeWidth={2}
                  fill="url(#eqGrad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ── Net daily P&L (Bar chart) ─────────────────────────────────────── */}
        <div className="bg-[#181920] border border-[#262833] rounded-xl p-4 flex flex-col min-h-0">
          <h3 className="text-[11px] font-bold text-slate-300 mb-2 shrink-0">Net daily P&L</h3>

          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyChartData} margin={{ top: 5, right: 5, left: -15, bottom: 0 }} barSize={12}>
                <CartesianGrid stroke="rgba(255,255,255,0.04)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" stroke="#64748b" fontSize={9} tickLine={false} axisLine={false}
                  interval="preserveStartEnd" />
                <YAxis stroke="#64748b" fontSize={9} tickLine={false} axisLine={false}
                  tickFormatter={(v) => `$${v}`} />
                <Tooltip content={<ChartTooltip />} />
                <ReferenceLine y={0} stroke="#262833" />
                <Bar dataKey="pnl" radius={[3, 3, 0, 0]}>
                  {dailyChartData.map((entry, i) => (
                    <Cell key={i} fill={entry.pnl >= 0 ? '#10b981' : '#ef4444'} fillOpacity={0.85} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
};
