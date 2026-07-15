import React from 'react';
import { useTrades } from '../trades/useTrades';
import { usePerformanceMetrics } from './usePerformanceMetrics';
import {
  TrendingUp, Percent, Target, Brain, Quote,
  TrendingDown, Activity, Award, Zap, ShieldCheck,
} from 'lucide-react';
import {
  AreaChart, Area,
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, ReferenceLine, Cell,
} from 'recharts';

const ChartTooltip = ({ active, payload, label }: {
  active?: boolean; payload?: { value: number }[]; label?: string;
}) => {
  if (!active || !payload?.length) return null;
  const val = payload[0].value;
  return (
    <div className="bg-[#08080b] border border-[#2a2a32] px-3 py-2 text-[10px] font-mono shadow-xl">
      <div className="text-[#52525b] mb-0.5">{label}</div>
      <div className={`font-bold text-sm ${val >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
        {val >= 0 ? '+' : ''}{val.toLocaleString('en-US', { minimumFractionDigits: 2 })}
      </div>
    </div>
  );
};

// ── KPI CARD with gradient accent ──────────────────────────────────────────────
const KpiCard = ({ label, value, sub, icon: Icon, color, trend }: {
  label: string; value: string; sub: string;
  icon: React.FC<{ className?: string }>;
  color: 'gold' | 'green' | 'red' | 'blue';
  trend?: 'up' | 'down' | 'neutral';
}) => {
  const colorMap = {
    gold:  { grad: 'from-amber-500/10 via-transparent', border: 'border-amber-500/30', text: 'text-amber-400', glow: 'shadow-[0_0_30px_rgba(245,158,11,0.1)]', icon: 'text-amber-400' },
    green: { grad: 'from-emerald-500/10 via-transparent', border: 'border-emerald-500/30', text: 'text-emerald-400', glow: 'shadow-[0_0_30px_rgba(16,185,129,0.1)]', icon: 'text-emerald-400' },
    red:   { grad: 'from-red-500/10 via-transparent', border: 'border-red-500/30', text: 'text-red-400', glow: 'shadow-[0_0_30px_rgba(239,68,68,0.1)]', icon: 'text-red-400' },
    blue:  { grad: 'from-blue-500/10 via-transparent', border: 'border-blue-500/30', text: 'text-blue-400', glow: 'shadow-[0_0_30px_rgba(59,130,246,0.1)]', icon: 'text-blue-400' },
  };
  const c = colorMap[color];
  return (
    <div className={`relative bg-gradient-to-br ${c.grad} to-[#0a0a0d] border ${c.border} ${c.glow} p-5 overflow-hidden group hover:scale-[1.02] transition-all duration-200`}>
      {/* Decorative corner */}
      <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl ${c.grad} to-transparent opacity-30`} />
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[9px] uppercase tracking-[0.18em] text-[#52525b] font-bold">{label}</span>
          <div className={`p-1.5 bg-[#0f0f14] border border-[#1a1a1f]`}>
            <Icon className={`w-3.5 h-3.5 ${c.icon}`} />
          </div>
        </div>
        <div className={`text-3xl font-black tabular-nums kpi-value ${c.text} leading-none mb-2`}>
          {value}
        </div>
        <div className="flex items-center gap-2">
          {trend === 'up' && <TrendingUp className="w-3 h-3 text-emerald-400 shrink-0" />}
          {trend === 'down' && <TrendingDown className="w-3 h-3 text-red-400 shrink-0" />}
          <span className="text-[9px] text-[#52525b]">{sub}</span>
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
        <div className="w-8 h-8 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
        <span className="text-[10px] text-[#52525b] font-mono tracking-widest uppercase">Chargement des données...</span>
      </div>
    );
  }

  const equityData = [{ tradeIndex: 0, pnl: 0, date: 'Start' }, ...m.equityCurve];
  const isPositive = m.netPnL >= 0;

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ── HERO HEADER ─────────────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#0a0a0d] via-[#0f0f14] to-[#0a0a0d] border border-[#1a1a1f] p-6">
        {/* Decorative lines */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-500/60 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-500/20 to-transparent" />
        <div className={`absolute inset-0 bg-gradient-to-r ${isPositive ? 'from-emerald-950/20' : 'from-red-950/20'} via-transparent to-transparent`} />

        <div className="relative flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-[9px] uppercase tracking-[0.2em] text-[#71717a]">Trading Dashboard</span>
            </div>
            <h1 className="text-xl font-black uppercase tracking-widest text-white leading-none">
              SEVEN <span className="text-amber-400">JOURNAL</span>
            </h1>
            <p className="text-[10px] text-[#52525b] mt-1.5">
              {m.closedTrades} trades analysés · {m.openTrades} position{m.openTrades !== 1 ? 's' : ''} ouverte{m.openTrades !== 1 ? 's' : ''}
            </p>
          </div>

          <div className="text-right">
            <div className="text-[9px] uppercase tracking-widest text-[#52525b] mb-1">P&L CUMULÉ</div>
            <div className={`text-4xl font-black tabular-nums kpi-value leading-none ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}
              style={{ textShadow: isPositive ? '0 0 30px rgba(52,211,153,0.3)' : '0 0 30px rgba(248,113,113,0.3)' }}>
              {isPositive ? '+' : ''}{m.netPnL.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <div className={`text-[10px] mt-1 font-bold ${isPositive ? 'text-emerald-500' : 'text-red-500'}`}>
              {isPositive ? '▲ EN PROFIT' : '▼ EN PERTE'}
            </div>
          </div>
        </div>
      </div>

      {/* ── KPI GRID ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard
          label="Win Rate"
          value={`${m.winRate.toFixed(1)}%`}
          sub={`${m.winCount} gains / ${m.lossCount} pertes`}
          icon={Percent}
          color={m.winRate >= 50 ? 'green' : 'red'}
          trend={m.winRate >= 50 ? 'up' : 'down'}
        />
        <KpiCard
          label="Profit Factor"
          value={m.profitFactor.toFixed(2)}
          sub="Seuil viable ≥ 1.50"
          icon={TrendingUp}
          color={m.profitFactor >= 1.5 ? 'green' : m.profitFactor >= 1 ? 'gold' : 'red'}
          trend={m.profitFactor >= 1.5 ? 'up' : 'down'}
        />
        <KpiCard
          label="R-Multiple Moy."
          value={`${m.avgRMultiple >= 0 ? '+' : ''}${m.avgRMultiple.toFixed(2)}R`}
          sub={`Win moy: +$${m.avgWin.toFixed(0)} / Loss: -$${m.avgLoss.toFixed(0)}`}
          icon={Target}
          color={m.avgRMultiple >= 0 ? 'green' : 'red'}
          trend={m.avgRMultiple >= 0 ? 'up' : 'down'}
        />
        <KpiCard
          label="Consistency"
          value={`${m.consistency.score.toFixed(1)}%`}
          sub={m.consistency.alert ? '⚠ Alerte Prop Firm' : '✓ Conforme Prop Firm'}
          icon={m.consistency.alert ? Zap : ShieldCheck}
          color={m.consistency.alert ? 'red' : 'gold'}
          trend={m.consistency.alert ? 'down' : 'up'}
        />
      </div>

      {/* ── CHARTS ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* EQUITY CURVE with gradient area */}
        <div className="lg:col-span-2 bg-[#0a0a0d] border border-[#1a1a1f] overflow-hidden">
          <div className="h-px bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />
          <div className="px-4 py-3 border-b border-[#1a1a1f] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-1 h-3 bg-amber-500 rounded-full" />
              <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-amber-500">Courbe d'Equity</span>
            </div>
            <Activity className="w-3.5 h-3.5 text-[#52525b]" />
          </div>
          <div className="p-4">
            {equityData.length > 1 ? (
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={equityData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="eqGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={isPositive ? '#10b981' : '#ef4444'} stopOpacity={0.3} />
                        <stop offset="100%" stopColor={isPositive ? '#10b981' : '#ef4444'} stopOpacity={0.01} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="tradeIndex" stroke="#1a1a1f" tick={{ fontSize: 9, fill: '#52525b', fontFamily: 'monospace' }} />
                    <YAxis stroke="#1a1a1f" tick={{ fontSize: 9, fill: '#52525b', fontFamily: 'monospace' }} />
                    <Tooltip content={<ChartTooltip />} />
                    <ReferenceLine y={0} stroke="#dc2626" strokeDasharray="4 4" strokeWidth={1} />
                    <Area
                      type="monotone" dataKey="pnl" stroke={isPositive ? '#10b981' : '#ef4444'}
                      strokeWidth={2} fill="url(#eqGrad)" dot={false}
                      activeDot={{ r: 5, fill: isPositive ? '#34d399' : '#f87171', strokeWidth: 0 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[220px] flex items-center justify-center text-[#3f3f46] text-[10px] uppercase tracking-widest">
                Pas encore assez de trades
              </div>
            )}
          </div>
        </div>

        {/* GOGGINS CORNER */}
        <div className="bg-[#0a0a0d] border border-[#1a1a1f] overflow-hidden">
          <div className="h-px bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />
          <div className="px-4 py-3 border-b border-[#1a1a1f] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-1 h-3 bg-amber-500 rounded-full" />
              <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-amber-500">Goggins Corner</span>
            </div>
            <Brain className="w-3.5 h-3.5 text-[#52525b]" />
          </div>
          <div className="p-4 space-y-4">
            <div className="relative bg-amber-950/20 border border-amber-500/20 p-3">
              <Quote className="w-4 h-4 text-amber-500/30 mb-1.5" />
              <p className="text-[10px] text-amber-200/70 italic leading-relaxed">
                "The only way you can grow is to be uncomfortable. Fear of failure is the biggest reason people don't reach their potential."
              </p>
              <p className="text-[9px] text-amber-500/50 mt-2 text-right">— David Goggins</p>
            </div>

            <div className="space-y-2 text-[10px]">
              {[
                { icon: '🏺', label: 'Cookie Jar', desc: 'Revoyez vos meilleurs setups avant d\'entrer sous pression.' },
                { icon: '💪', label: '40% Rule', desc: 'Quand le cerveau dit stop, vous n\'êtes qu\'à 40% de vos capacités.' },
                { icon: '⛔', label: 'Revenge Lock', desc: '2 SL consécutifs = session verrouillée. Aucune exception.' },
              ].map(r => (
                <div key={r.label} className="flex items-start gap-2.5 p-2 bg-[#0f0f14] border border-[#1a1a1f] hover:border-[#2a2a32] transition-colors">
                  <span className="text-sm shrink-0 mt-0.5">{r.icon}</span>
                  <div>
                    <span className="font-bold text-white">{r.label} : </span>
                    <span className="text-[#71717a]">{r.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── DAILY P&L + EXTREMES ────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* DAILY P&L BAR */}
        <div className="lg:col-span-2 bg-[#0a0a0d] border border-[#1a1a1f] overflow-hidden">
          <div className="h-px bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />
          <div className="px-4 py-3 border-b border-[#1a1a1f] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-1 h-3 bg-amber-500 rounded-full" />
              <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-amber-500">P&L Journalier</span>
            </div>
            <TrendingDown className="w-3.5 h-3.5 text-[#52525b]" />
          </div>
          <div className="p-4">
            {m.dailyPnL.length > 0 ? (
              <div className="h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={m.dailyPnL} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                    <XAxis dataKey="date" stroke="#1a1a1f" tick={{ fontSize: 9, fill: '#52525b', fontFamily: 'monospace' }} />
                    <YAxis stroke="#1a1a1f" tick={{ fontSize: 9, fill: '#52525b', fontFamily: 'monospace' }} />
                    <Tooltip content={<ChartTooltip />} />
                    <ReferenceLine y={0} stroke="#2a2a32" strokeWidth={1} />
                    <Bar dataKey="pnl" radius={[2, 2, 0, 0]} maxBarSize={32}>
                      {m.dailyPnL.map((entry, i) => (
                        <Cell key={`c-${i}`} fill={entry.pnl >= 0 ? '#059669' : '#dc2626'}
                          fillOpacity={0.9} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[180px] flex items-center justify-center text-[#3f3f46] text-[10px] uppercase tracking-widest">
                Aucune donnée journalière
              </div>
            )}
          </div>
        </div>

        {/* BEST / WORST */}
        <div className="bg-[#0a0a0d] border border-[#1a1a1f] overflow-hidden">
          <div className="h-px bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />
          <div className="px-4 py-3 border-b border-[#1a1a1f] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-1 h-3 bg-amber-500 rounded-full" />
              <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-amber-500">Extrêmes</span>
            </div>
            <Award className="w-3.5 h-3.5 text-[#52525b]" />
          </div>
          <div className="p-4 space-y-4 font-mono">
            {m.bestTrade ? (
              <div className="p-3 bg-emerald-950/20 border border-emerald-500/20 space-y-1">
                <div className="text-[8px] uppercase tracking-widest text-emerald-500/70 font-bold">🏆 Meilleur Trade</div>
                <div className="text-2xl font-black text-emerald-400 tabular-nums" style={{ textShadow: '0 0 20px rgba(52,211,153,0.3)' }}>
                  +{m.bestTrade.pnl!.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </div>
                <div className="text-[9px] text-[#71717a]">
                  {m.bestTrade.pair} {m.bestTrade.direction} · {m.bestTrade.timeframe}
                  {m.bestTrade.r_multiple ? ` · +${m.bestTrade.r_multiple}R` : ''}
                </div>
              </div>
            ) : null}

            {m.worstTrade ? (
              <div className="p-3 bg-red-950/20 border border-red-500/20 space-y-1">
                <div className="text-[8px] uppercase tracking-widest text-red-500/70 font-bold">💀 Pire Trade</div>
                <div className="text-2xl font-black text-red-400 tabular-nums" style={{ textShadow: '0 0 20px rgba(248,113,113,0.3)' }}>
                  {m.worstTrade.pnl!.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </div>
                <div className="text-[9px] text-[#71717a]">
                  {m.worstTrade.pair} {m.worstTrade.direction} · {m.worstTrade.timeframe}
                  {m.worstTrade.r_multiple ? ` · ${m.worstTrade.r_multiple}R` : ''}
                </div>
              </div>
            ) : null}

            {!m.bestTrade && !m.worstTrade && (
              <div className="text-[#3f3f46] uppercase py-4 text-center text-[10px] tracking-widest">
                Aucun trade clôturé
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
