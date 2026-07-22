import React, { useState, useMemo } from 'react';
import { useTrades } from '../trades/useTrades';
import type { Trade } from '../trades/useTrades';
import { useAccounts } from '../accounts/useAccounts';
import { useUIStore } from '../../store/uiStore';
import { Card } from '../../components/ui/Card';
import {
  Line,
  BarChart, Bar,
  AreaChart, Area,
  PieChart, Pie, Cell,
  ComposedChart,
  XAxis, YAxis,
  Tooltip, Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import {
  TrendingUp, TrendingDown, Target, Percent,
  Flame, Activity, Clock, Brain, BarChart3,
  Zap, Award, AlertCircle
} from 'lucide-react';
import { ShareButton } from '../../components/share/ShareCard';

// ─── Empty state ──────────────────────────────────────────────────────────────
const Empty = () => (
  <div className="h-[200px] flex flex-col items-center justify-center text-slate-500 text-xs font-medium space-y-2">
    <AlertCircle className="w-5 h-5 opacity-40" />
    <span>Pas encore assez de données</span>
  </div>
);

// ─── Custom Tooltip for Dark Theme ────────────────────────────────────────────
const AnalyticsTooltip = ({ active, payload, label }: {
  active?: boolean;
  payload?: any[];
  label?: string;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#181920] border border-[#262833] px-3.5 py-2.5 rounded-xl text-xs shadow-2xl">
      <div className="text-slate-400 mb-1 font-semibold uppercase tracking-wider text-[10px]">{label}</div>
      <div className="space-y-1">
        {payload.map((item, idx) => {
          const val = Number(item.value);
          const nameLower = (item.name || '').toLowerCase();
          const isDrawdown = nameLower.includes('drawdown');
          const isWinrate = nameLower.includes('win%') || nameLower.includes('winrate');
          const isAvgLoss = nameLower.includes('avg loss') || nameLower.includes('perte');

          let textClass = 'text-white';
          if (!isNaN(val)) {
            if (isDrawdown || isAvgLoss) {
              textClass = 'text-red-400 font-bold';
            } else if (isWinrate) {
              textClass = val >= 50 ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold';
            } else {
              textClass = val >= 0 ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold';
            }
          }

          let prefix = '';
          if (!isDrawdown && !isWinrate) {
            if (isAvgLoss) {
              prefix = '-$';
            } else {
              prefix = val >= 0 ? '+$' : '-$';
            }
          }
          const suffix = isDrawdown || isWinrate ? '%' : '';

          return (
            <div key={idx} className="flex items-center justify-between gap-4">
              <span className="text-slate-400">{item.name} :</span>
              <span className={textClass}>
                {prefix}{Math.abs(val).toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 2 })}{suffix}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── Tab types ────────────────────────────────────────────────────────────────
type Tab = 'overview' | 'equity' | 'distribution' | 'breakdown' | 'timing' | 'psychology' | 'propfirm';

const TABS: { id: Tab; label: string; icon: React.FC<{ className?: string }> }[] = [
  { id: 'overview',      label: 'VUE D\'ENSEMBLE', icon: Activity },
  { id: 'equity',        label: 'EQUITY & DRAWDOWN', icon: TrendingUp },
  { id: 'distribution',  label: 'DISTRIBUTION', icon: BarChart3 },
  { id: 'breakdown',     label: 'PAR SETUP/PAIRE/TF', icon: Target },
  { id: 'timing',        label: 'TIMING (H/J)', icon: Clock },
  { id: 'psychology',    label: 'PSYCHOLOGIE & ERREURS', icon: Brain },
  { id: 'propfirm',      label: 'PROP FIRM TRACKER', icon: Award },
];

// ─── Main component ───────────────────────────────────────────────────────────
export const Analytics: React.FC = () => {
  const { trades, isLoading } = useTrades();
  const { accounts } = useAccounts();
  const { activeAccountId } = useUIStore();
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  const selectedAccount = useMemo(() => {
    if (activeAccountId) return accounts.find(a => a.id === activeAccountId);
    return accounts[0];
  }, [accounts, activeAccountId]);

  const initialBalance = useMemo(() => {
    return selectedAccount ? selectedAccount.initial_balance : 10000;
  }, [selectedAccount]);

  const targetProfitAmount = useMemo(() => {
    return selectedAccount?.profit_target || 10000;
  }, [selectedAccount]);

  const maxDrawdownLimitAmount = useMemo(() => {
    return selectedAccount?.max_drawdown_limit || 10000;
  }, [selectedAccount]);

  const closed = useMemo(
    () => trades.filter((t): t is Trade & { exit_time: string; pnl: number } =>
      t.exit_time !== null && t.pnl !== null && (!activeAccountId || t.account_id === activeAccountId)),
    [trades, activeAccountId]
  );

  // ── Equity curve + Drawdown ────────────────────────────────────────────────

  const equityCurve = useMemo(() => {
    const sorted = [...closed].sort(
      (a, b) => new Date(a.exit_time).getTime() - new Date(b.exit_time).getTime()
    );
    let cum = 0, peak = initialBalance;
    return sorted.map((t, i) => {
      cum += t.pnl;
      const currentBalance = initialBalance + cum;
      if (currentBalance > peak) peak = currentBalance;
      const dd = ((currentBalance - peak) / peak) * 100;
      return {
        i: i + 1,
        date: new Date(t.exit_time).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' }),
        pnl: Number(cum.toFixed(2)),
        drawdown: Number(dd.toFixed(2)),
        trade_pnl: Number(t.pnl.toFixed(2)),
      };
    });
  }, [closed, initialBalance]);

  const maxDrawdown = useMemo(() => Math.min(0, ...equityCurve.map(e => e.drawdown)), [equityCurve]);
  const netPnL = useMemo(() => closed.reduce((s, t) => s + t.pnl, 0), [closed]);
  const winTrades = useMemo(() => closed.filter(t => t.pnl > 0), [closed]);
  const lossTrades = useMemo(() => closed.filter(t => t.pnl <= 0), [closed]);
  const winRate = closed.length > 0 ? (winTrades.length / closed.length) * 100 : 0;
  const grossProfit = winTrades.reduce((s, t) => s + t.pnl, 0);
  const grossLoss = Math.abs(lossTrades.reduce((s, t) => s + t.pnl, 0));
  const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? 99 : 0;
  const avgR = useMemo(() => {
    const rs = closed.map(t => t.r_multiple ?? 0);
    return rs.length > 0 ? rs.reduce((s, r) => s + r, 0) / rs.length : 0;
  }, [closed]);
  const avgWin = winTrades.length > 0 ? grossProfit / winTrades.length : 0;
  const avgLoss = lossTrades.length > 0 ? grossLoss / lossTrades.length : 0;
  const expectancy = winRate / 100 * avgWin - (1 - winRate / 100) * avgLoss;

  // ── Streaks ────────────────────────────────────────────────────────────────
  const streakData = useMemo(() => {
    const sorted = [...closed].sort(
      (a, b) => new Date(a.exit_time).getTime() - new Date(b.exit_time).getTime()
    );
    let bestWin = 0, worstLoss = 0, cur = 0, curType: 'W' | 'L' | '-' = '-';
    let localWin = 0, localLoss = 0;
    for (const t of sorted) {
      if (t.pnl > 0) {
        localWin++; localLoss = 0;
        if (localWin > bestWin) bestWin = localWin;
        cur = localWin; curType = 'W';
      } else {
        localLoss++; localWin = 0;
        if (localLoss > worstLoss) worstLoss = localLoss;
        cur = localLoss; curType = 'L';
      }
    }
    return { bestWin, worstLoss, cur, curType };
  }, [closed]);

  // ── Monthly P&L ───────────────────────────────────────────────────────────
  const monthlyData = useMemo(() => {
    const map: Record<string, { pnl: number; trades: number; wins: number }> = {};
    closed.forEach(t => {
      const d = new Date(t.exit_time);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!map[key]) map[key] = { pnl: 0, trades: 0, wins: 0 };
      map[key].pnl += t.pnl;
      map[key].trades++;
      if (t.pnl > 0) map[key].wins++;
    });
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => ({
        month: k.slice(0, 7),
        pnl: Number(v.pnl.toFixed(2)),
        trades: v.trades,
        winRate: Number(((v.wins / v.trades) * 100).toFixed(1)),
      }));
  }, [closed]);

  // ── R-Multiple distribution histogram ────────────────────────────────────
  const rDistribution = useMemo(() => {
    const buckets: Record<string, number> = {
      '< -2R': 0, '-2R': 0, '-1R': 0, '-0.5R': 0,
      '0': 0, '+0.5R': 0, '+1R': 0, '+2R': 0, '> +2R': 0
    };
    closed.forEach(t => {
      const r = t.r_multiple ?? (t.pnl > 0 ? 1 : -1);
      if (r < -2) buckets['< -2R']++;
      else if (r < -1) buckets['-2R']++;
      else if (r < -0.5) buckets['-1R']++;
      else if (r < 0) buckets['-0.5R']++;
      else if (r === 0) buckets['0']++;
      else if (r < 0.5) buckets['+0.5R']++;
      else if (r < 1) buckets['+0.5R']++;
      else if (r < 2) buckets['+1R']++;
      else if (r < 3) buckets['+2R']++;
      else buckets['> +2R']++;
    });
    return Object.entries(buckets).map(([bucket, count]) => ({
      bucket, count,
      positive: bucket.startsWith('+') || bucket === '0',
    }));
  }, [closed]);

  // ── Win / Loss pie ────────────────────────────────────────────────────────
  const pieData = [
    { name: 'WINS', value: winTrades.length, color: '#059669' },
    { name: 'LOSSES', value: lossTrades.length, color: '#dc2626' },
  ];

  // ── Direction (BUY vs SELL) ───────────────────────────────────────────────
  const directionData = useMemo(() => {
    const map: Record<string, { pnl: number; wins: number; total: number }> = {
      BUY: { pnl: 0, wins: 0, total: 0 },
      SELL: { pnl: 0, wins: 0, total: 0 },
    };
    closed.forEach(t => {
      map[t.direction].pnl += t.pnl;
      map[t.direction].total++;
      if (t.pnl > 0) map[t.direction].wins++;
    });
    return Object.entries(map).map(([dir, d]) => ({
      name: dir,
      pnl: Number(d.pnl.toFixed(2)),
      winRate: d.total > 0 ? Number(((d.wins / d.total) * 100).toFixed(1)) : 0,
      total: d.total,
    }));
  }, [closed]);

  // ── By Pair ────────────────────────────────────────────────────────────────
  const pairData = useMemo(() => {
    const map: Record<string, { pnl: number; wins: number; total: number; r: number[] }> = {};
    closed.forEach(t => {
      if (!map[t.pair]) map[t.pair] = { pnl: 0, wins: 0, total: 0, r: [] };
      map[t.pair].pnl += t.pnl;
      map[t.pair].total++;
      if (t.pnl > 0) map[t.pair].wins++;
      map[t.pair].r.push(t.r_multiple ?? 0);
    });
    return Object.entries(map).map(([pair, d]) => ({
      name: pair,
      pnl: Number(d.pnl.toFixed(2)),
      winRate: Number(((d.wins / d.total) * 100).toFixed(1)),
      total: d.total,
      avgR: Number((d.r.reduce((s, v) => s + v, 0) / d.r.length).toFixed(2)),
    }));
  }, [closed]);

  // ── By Timeframe ───────────────────────────────────────────────────────────
  const tfData = useMemo(() => {
    const map: Record<string, { pnl: number; wins: number; total: number }> = {};
    closed.forEach(t => {
      if (!map[t.timeframe]) map[t.timeframe] = { pnl: 0, wins: 0, total: 0 };
      map[t.timeframe].pnl += t.pnl;
      map[t.timeframe].total++;
      if (t.pnl > 0) map[t.timeframe].wins++;
    });
    const ORDER = ['M1','M5','M15','H1','H4','D1'];
    return Object.entries(map)
      .sort(([a], [b]) => ORDER.indexOf(a) - ORDER.indexOf(b))
      .map(([tf, d]) => ({
        name: tf,
        pnl: Number(d.pnl.toFixed(2)),
        winRate: Number(((d.wins / d.total) * 100).toFixed(1)),
        total: d.total,
      }));
  }, [closed]);

  // ── By Session ─────────────────────────────────────────────────────────────
  const sessionData = useMemo(() => {
    const map: Record<string, { pnl: number; wins: number; total: number }> = {
      'Asia': { pnl: 0, wins: 0, total: 0 },
      'London': { pnl: 0, wins: 0, total: 0 },
      'New York': { pnl: 0, wins: 0, total: 0 },
      'Over Session': { pnl: 0, wins: 0, total: 0 },
    };
    closed.forEach(t => {
      const s = t.session || 'Over Session';
      const key = s === 'Asia' || s === 'London' || s === 'New York' || s === 'Over Session' ? s : 'Over Session';
      map[key].pnl += t.pnl;
      map[key].total++;
      if (t.pnl > 0) map[key].wins++;
    });
    return Object.entries(map)
      .filter(([_, d]) => d.total > 0)
      .map(([sess, d]) => ({
        name: sess.toUpperCase(),
        pnl: Number(d.pnl.toFixed(2)),
        winRate: Number(((d.wins / d.total) * 100).toFixed(1)),
        total: d.total,
      }));
  }, [closed]);

  // ── Setup performance ──────────────────────────────────────────────────────
  const setupData = useMemo(() => {
    const defs = [
      { name: 'BOS', check: (t: Trade) => t.setup_structures.includes('BOS') },
      { name: 'CHoCH', check: (t: Trade) => t.setup_structures.includes('CHoCH') },
      { name: 'Order Block', check: (t: Trade) => t.setup_ob },
      { name: 'FVG', check: (t: Trade) => t.setup_fvg },
      { name: 'Liquidity Sweep', check: (t: Trade) => t.setup_liquidity_sweep },
    ];
    return defs.map(({ name, check }) => {
      const sub = closed.filter(check);
      const wins = sub.filter(t => t.pnl > 0).length;
      const pnl = sub.reduce((s, t) => s + t.pnl, 0);
      return {
        name, total: sub.length, wins,
        winRate: sub.length > 0 ? Number(((wins / sub.length) * 100).toFixed(1)) : 0,
        pnl: Number(pnl.toFixed(2)),
      };
    });
  }, [closed]);

  // ── By Hour of Day ────────────────────────────────────────────────────────
  const hourData = useMemo(() => {
    const map: Record<number, { pnl: number; wins: number; total: number }> = {};
    closed.forEach(t => {
      const h = new Date(t.exit_time).getHours();
      if (!map[h]) map[h] = { pnl: 0, wins: 0, total: 0 };
      map[h].pnl += t.pnl;
      map[h].total++;
      if (t.pnl > 0) map[h].wins++;
    });
    return Array.from({ length: 24 }, (_, h) => ({
      hour: `${String(h).padStart(2, '0')}h`,
      pnl: map[h] ? Number(map[h].pnl.toFixed(2)) : 0,
      winRate: map[h] && map[h].total > 0 ? Number(((map[h].wins / map[h].total) * 100).toFixed(1)) : 0,
      total: map[h]?.total ?? 0,
    })).filter(d => d.total > 0);
  }, [closed]);

  // ── By Day of Week ────────────────────────────────────────────────────────
  const DAYS = ['LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM', 'DIM'];
  const dayData = useMemo(() => {
    const map: Record<number, { pnl: number; wins: number; total: number }> = {};
    closed.forEach(t => {
      let d = new Date(t.exit_time).getDay();
      d = d === 0 ? 6 : d - 1; // Mon=0 … Sun=6
      if (!map[d]) map[d] = { pnl: 0, wins: 0, total: 0 };
      map[d].pnl += t.pnl;
      map[d].total++;
      if (t.pnl > 0) map[d].wins++;
    });
    return DAYS.map((day, i) => ({
      day,
      pnl: map[i] ? Number(map[i].pnl.toFixed(2)) : 0,
      winRate: map[i] && map[i].total > 0 ? Number(((map[i].wins / map[i].total) * 100).toFixed(1)) : 0,
      total: map[i]?.total ?? 0,
    }));
  }, [closed]);

  // ── By Mental State ───────────────────────────────────────────────────────
  const mentalData = useMemo(() => {
    const map: Record<string, { pnl: number; wins: number; total: number }> = {};
    closed.forEach(t => {
      if (!map[t.mental_state]) map[t.mental_state] = { pnl: 0, wins: 0, total: 0 };
      map[t.mental_state].pnl += t.pnl;
      map[t.mental_state].total++;
      if (t.pnl > 0) map[t.mental_state].wins++;
    });
    return Object.entries(map).map(([state, d]) => ({
      name: state.toUpperCase(),
      pnl: Number(d.pnl.toFixed(2)),
      winRate: Number(((d.wins / d.total) * 100).toFixed(1)),
      total: d.total,
    })).sort((a, b) => b.pnl - a.pnl);
  }, [closed]);



  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-bloomberg-text-secondary font-mono text-xs">
        CALCUL DES ANALYTICS...
      </div>
    );
  }

  return (
    <div className="space-y-5">

      {/* PAGE HEADER */}
      <div className="flex items-center justify-between border-b border-[#262833] pb-4">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-white">ANALYTICS AVANCÉS</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {closed.length} trades clôturés analysés · Toutes métriques calculées en temps réel
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <ShareButton />
          <div className="text-right">
            <div className={`text-xl font-bold tabular-nums ${netPnL >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {netPnL >= 0 ? '+' : ''}${netPnL.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-[10px] font-semibold text-slate-500 uppercase">P&L CUMULÉ</div>
          </div>
        </div>
      </div>

      {/* TABS */}
      <div className="flex flex-wrap gap-2 border-b border-[#262833] pb-3">
        {TABS.map(({ id, label, icon: Icon }) => {
          const active = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                active
                  ? 'bg-[#6366f1]/15 text-[#818cf8] border border-[#6366f1]/30 shadow-indigo-glow'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#181920] border border-transparent'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${active ? 'text-[#818cf8]' : 'text-slate-400'}`} />
              <span>{label}</span>
            </button>
          );
        })}
      </div>

      {/* ── TAB: VUE D'ENSEMBLE ───────────────────────────────────────────── */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          
          {/* TOP 3 FINTECH CHART CARDS (Win Rate Gauge, Profit Factor & Expectancy Bar, Win/Loss Comparison) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            
            {/* 1. RADIAL WIN RATE GAUGE CHART */}
            <div className="bg-[#181920] border border-[#262833] rounded-2xl p-5 hover:border-[#363948] transition-all flex flex-col justify-between">
              <div className="flex items-center justify-between border-b border-[#262833] pb-3 mb-2">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <PieChart className="w-4 h-4 text-[#818cf8]" />
                  <span>RÉPARTITION WIN / LOSS</span>
                </span>
                <span className={`text-xs font-extrabold px-2 py-0.5 rounded-lg ${winRate >= 50 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                  {winRate.toFixed(1)}% WR
                </span>
              </div>

              <div className="h-[150px] relative flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={42}
                      outerRadius={58}
                      startAngle={180}
                      endAngle={0}
                      dataKey="value"
                      paddingAngle={4}
                    >
                      <Cell fill="#10b981" />
                      <Cell fill="#ef4444" />
                    </Pie>
                    <Tooltip content={<AnalyticsTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute top-[55%] text-center transform -translate-y-1/2">
                  <div className="text-xl font-extrabold text-white tabular-nums">{winTrades.length}W - {lossTrades.length}L</div>
                  <div className="text-[10px] text-slate-400 font-medium">Ratio Gagnants/Perdants</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-center text-xs pt-2 border-t border-[#262833]">
                <div className="bg-[#121318] p-2 rounded-xl">
                  <span className="text-slate-400 block text-[10px]">Gain Moyen</span>
                  <span className="font-bold text-emerald-400 tabular-nums">+${avgWin.toFixed(0)}</span>
                </div>
                <div className="bg-[#121318] p-2 rounded-xl">
                  <span className="text-slate-400 block text-[10px]">Perte Moyenne</span>
                  <span className="font-bold text-red-400 tabular-nums">-${avgLoss.toFixed(0)}</span>
                </div>
              </div>
            </div>

            {/* 2. PROFIT FACTOR & EXPECTANCY CHART */}
            <div className="bg-[#181920] border border-[#262833] rounded-2xl p-5 hover:border-[#363948] transition-all flex flex-col justify-between">
              <div className="flex items-center justify-between border-b border-[#262833] pb-3 mb-2">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-[#818cf8]" />
                  <span>PROFIT FACTOR & EXPECTANCY</span>
                </span>
                <span className="text-xs font-extrabold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-lg border border-indigo-500/20">
                  PF: {profitFactor.toFixed(2)}
                </span>
              </div>

              <div className="h-[150px] flex items-center">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[
                    { name: 'Avg Win', amount: avgWin, fill: '#10b981' },
                    { name: 'Expectancy', amount: Math.max(expectancy, 0), fill: '#818cf8' },
                    { name: 'Avg Loss', amount: avgLoss, fill: '#ef4444' },
                  ]} layout="vertical" margin={{ left: 10, right: 20 }}>
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" stroke="#94a3b8" tick={{ fontSize: 10, fontFamily: 'sans-serif' }} axisLine={false} tickLine={false} width={75} />
                    <Tooltip content={<AnalyticsTooltip />} />
                    <Bar dataKey="amount" radius={[0, 8, 8, 0]} barSize={16}>
                      {[
                        <Cell key="0" fill="#10b981" />,
                        <Cell key="1" fill="#818cf8" />,
                        <Cell key="2" fill="#ef4444" />,
                      ]}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-[#121318] p-2.5 rounded-xl flex items-center justify-between text-xs">
                <span className="text-slate-400 text-[11px]">Espérance Mathématique :</span>
                <span className={`font-bold tabular-nums ${expectancy >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {expectancy >= 0 ? '+' : ''}${expectancy.toFixed(2)} / trade
                </span>
              </div>
            </div>

            {/* 3. STREAKS & DRAWDOWN PROGRESS CHART */}
            <div className="bg-[#181920] border border-[#262833] rounded-2xl p-5 hover:border-[#363948] transition-all flex flex-col justify-between">
              <div className="flex items-center justify-between border-b border-[#262833] pb-3 mb-2">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <Flame className="w-4 h-4 text-amber-400" />
                  <span>SÉRIES & DRAWDOWN MAX</span>
                </span>
                <span className={`text-xs font-extrabold px-2 py-0.5 rounded-lg ${streakData.curType === 'W' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                  Streak: {streakData.cur}{streakData.curType}
                </span>
              </div>

              <div className="space-y-3 my-auto">
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-400">Meilleure Série de Wins</span>
                    <span className="text-emerald-400 font-bold">{streakData.bestWin} Gains consécutifs</span>
                  </div>
                  <div className="w-full bg-[#121318] h-2 rounded-full overflow-hidden border border-[#262833]">
                    <div className="bg-emerald-400 h-full rounded-full" style={{ width: `${Math.min((streakData.bestWin / 10) * 100, 100)}%` }} />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-400">Pire Série de Losses</span>
                    <span className="text-red-400 font-bold">{streakData.worstLoss} Pertes consécutives</span>
                  </div>
                  <div className="w-full bg-[#121318] h-2 rounded-full overflow-hidden border border-[#262833]">
                    <div className="bg-red-400 h-full rounded-full" style={{ width: `${Math.min((streakData.worstLoss / 10) * 100, 100)}%` }} />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-400">Max Drawdown subi</span>
                    <span className="text-amber-400 font-bold">{maxDrawdown.toFixed(2)}%</span>
                  </div>
                  <div className="w-full bg-[#121318] h-2 rounded-full overflow-hidden border border-[#262833]">
                    <div className="bg-amber-400 h-full rounded-full" style={{ width: `${Math.min((Math.abs(maxDrawdown) / 10) * 100, 100)}%` }} />
                  </div>
                </div>
              </div>

              <div className="bg-[#121318] p-2.5 rounded-xl flex items-center justify-between text-xs">
                <span className="text-slate-400 text-[11px]">R-Multiple Moyen :</span>
                <span className={`font-bold tabular-nums ${avgR >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {avgR >= 0 ? '+' : ''}{avgR.toFixed(2)}R
                </span>
              </div>
            </div>

          </div>

          {/* R-MULTIPLE HISTOGRAM SPARKBAR & MONTHLY P&L */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* R-DISTRIBUTION HISTOGRAM */}
            <Card className="lg:col-span-1" title="DISTRIBUTION DES R-MULTIPLES" headerAction={<BarChart3 className="w-4 h-4 text-[#818cf8]" />}>
              {rDistribution.length > 0 ? (
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={rDistribution} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                      <XAxis dataKey="bucket" stroke="#52525b" tick={{ fontSize: 9, fontFamily: 'monospace' }} />
                      <YAxis stroke="#52525b" tick={{ fontSize: 9, fontFamily: 'monospace' }} />
                      <Tooltip content={<AnalyticsTooltip />} />
                      <Bar dataKey="count" name="Nombre de trades">
                        {rDistribution.map((d, i) => (
                          <Cell key={i} fill={d.positive ? '#10b981' : '#ef4444'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : <Empty />}
            </Card>

            {/* Monthly P&L COMPOSED CHART */}
            <Card className="lg:col-span-2" title="P&L MENSUEL ET WIN RATE CUMULÉ" headerAction={<Flame className="w-4 h-4 text-amber-400" />}>
              {monthlyData.length > 0 ? (
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="glowWin" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#10b981" stopOpacity={0.8} />
                          <stop offset="100%" stopColor="#059669" stopOpacity={0.2} />
                        </linearGradient>
                        <linearGradient id="glowLoss" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#ef4444" stopOpacity={0.8} />
                          <stop offset="100%" stopColor="#b91c1c" stopOpacity={0.2} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="month" stroke="#52525b" tick={{ fontSize: 9, fontFamily: 'monospace' }} />
                      <YAxis stroke="#52525b" tick={{ fontSize: 9, fontFamily: 'monospace' }} />
                      <Tooltip content={<AnalyticsTooltip />} />
                      <ReferenceLine y={0} stroke="#52525b" />
                      <Bar dataKey="pnl" name="P&L ($)">
                        {monthlyData.map((d, i) => (
                          <Cell key={i} fill={d.pnl >= 0 ? 'url(#glowWin)' : 'url(#glowLoss)'} />
                        ))}
                      </Bar>
                      <Line type="monotone" dataKey="winRate" name="WinRate (%)" stroke="#818cf8" strokeWidth={2} dot={{ r: 3, fill: '#818cf8' }} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              ) : <Empty />}
            </Card>
          </div>

        </div>
      )}

      {/* ── TAB: EQUITY & DRAWDOWN ────────────────────────────────────────── */}
      {activeTab === 'equity' && (
        <div className="space-y-5">
          <Card title="COURBE D'EQUITY CUMULATIVE" headerAction={<TrendingUp className="w-3.5 h-3.5 text-bloomberg-gold" />}>
            {equityCurve.length > 0 ? (
              <div className="h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={equityCurve} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="equityGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                        <stop offset="50%" stopColor="#f59e0b" stopOpacity={0.1} />
                        <stop offset="95%" stopColor="#059669" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" stroke="#3f3f46" tick={{ fontSize: 9, fontFamily: 'monospace' }} />
                    <YAxis stroke="#3f3f46" tick={{ fontSize: 9, fontFamily: 'monospace' }} />
                    <Tooltip content={<AnalyticsTooltip />} />
                    <ReferenceLine y={0} stroke="#ef4444" strokeDasharray="3 3" strokeWidth={1} />
                    <Area type="monotone" dataKey="pnl" name="Equity ($)" stroke="#10b981" strokeWidth={2.5} fill="url(#equityGrad)" dot={false} activeDot={{ r: 5, fill: '#f59e0b', strokeWidth: 2, stroke: '#fff' }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : <Empty />}
          </Card>

          <Card title="DRAWDOWN (% DEPUIS LE PEAK)" headerAction={<TrendingDown className="w-3.5 h-3.5 text-bloomberg-red-light" />}>
            {equityCurve.length > 0 ? (
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={equityCurve} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="ddGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#b91c1c" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" stroke="#3f3f46" tick={{ fontSize: 9, fontFamily: 'monospace' }} />
                    <YAxis stroke="#3f3f46" tick={{ fontSize: 9, fontFamily: 'monospace' }} tickFormatter={(v) => `${v}%`} />
                    <Tooltip content={<AnalyticsTooltip />} />
                    <ReferenceLine y={0} stroke="#3f3f46" />
                    <Area type="monotone" dataKey="drawdown" name="Drawdown %" stroke="#ef4444" strokeWidth={2} fill="url(#ddGrad)" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : <Empty />}
          </Card>

          <Card title="P&L PAR TRADE (CHRONOLOGIQUE)">
            {equityCurve.length > 0 ? (
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={equityCurve} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="barWin" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity={0.9} />
                        <stop offset="100%" stopColor="#059669" stopOpacity={0.3} />
                      </linearGradient>
                      <linearGradient id="barLoss" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#ef4444" stopOpacity={0.9} />
                        <stop offset="100%" stopColor="#b91c1c" stopOpacity={0.3} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="i" stroke="#3f3f46" tick={{ fontSize: 9, fontFamily: 'monospace' }} label={{ value: 'Trade #', position: 'insideBottomRight', fontSize: 9, fill: '#71717a' }} />
                    <YAxis stroke="#3f3f46" tick={{ fontSize: 9, fontFamily: 'monospace' }} />
                    <Tooltip content={<AnalyticsTooltip />} />
                    <ReferenceLine y={0} stroke="#3f3f46" />
                    <Bar dataKey="trade_pnl" name="P&L Trade">
                      {equityCurve.map((d, i) => (
                        <Cell key={i} fill={d.trade_pnl >= 0 ? 'url(#barWin)' : 'url(#barLoss)'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : <Empty />}
          </Card>
        </div>
      )}

      {/* ── TAB: DISTRIBUTION ────────────────────────────────────────────── */}
      {activeTab === 'distribution' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

            {/* Win / Loss Pie */}
            <Card title="RÉPARTITION WINS vs LOSSES" headerAction={<Percent className="w-3.5 h-3.5 text-bloomberg-gold" />}>
              {closed.length > 0 ? (
                <div className="flex items-center space-x-6">
                  <div className="h-[200px] w-[200px] shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={pieData} dataKey="value" cx="50%" cy="50%" outerRadius={80} innerRadius={45} paddingAngle={3} stroke="none">
                          {pieData.map((d, i) => <Cell key={i} fill={d.color} />)}
                        </Pie>
                        <Tooltip content={<AnalyticsTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-3 font-mono text-xs">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="w-3 h-3 rounded-full bg-bloomberg-green inline-block shrink-0" />
                        <span className="text-bloomberg-text-secondary">WINS</span>
                      </div>
                      <div className="text-bloomberg-green-light font-bold text-lg tabular-nums">{winTrades.length}</div>
                      <div className="text-[10px] text-bloomberg-text-muted">{winRate.toFixed(1)}% du total</div>
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="w-3 h-3 rounded-full bg-bloomberg-red inline-block shrink-0" />
                        <span className="text-bloomberg-text-secondary">LOSSES</span>
                      </div>
                      <div className="text-bloomberg-red-light font-bold text-lg tabular-nums">{lossTrades.length}</div>
                      <div className="text-[10px] text-bloomberg-text-muted">{(100 - winRate).toFixed(1)}% du total</div>
                    </div>
                  </div>
                </div>
              ) : <Empty />}
            </Card>

            {/* R-Multiple distribution */}
            <Card title="DISTRIBUTION DES R-MULTIPLES" headerAction={<Target className="w-3.5 h-3.5 text-bloomberg-gold" />}>
              {rDistribution.some(d => d.count > 0) ? (
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={rDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="distWin" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#10b981" stopOpacity={0.85} />
                          <stop offset="100%" stopColor="#059669" stopOpacity={0.25} />
                        </linearGradient>
                        <linearGradient id="distLoss" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#ef4444" stopOpacity={0.85} />
                          <stop offset="100%" stopColor="#b91c1c" stopOpacity={0.25} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="bucket" stroke="#3f3f46" tick={{ fontSize: 8, fontFamily: 'monospace' }} />
                      <YAxis stroke="#3f3f46" tick={{ fontSize: 9, fontFamily: 'monospace' }} allowDecimals={false} />
                      <Tooltip content={<AnalyticsTooltip />} />
                      <Bar dataKey="count" name="Trades">
                        {rDistribution.map((d, i) => (
                          <Cell key={i} fill={d.positive ? 'url(#distWin)' : 'url(#distLoss)'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : <Empty />}
            </Card>

            {/* BUY vs SELL */}
            <Card title="PERFORMANCE PAR DIRECTION (BUY vs SELL)" headerAction={<Zap className="w-3.5 h-3.5 text-bloomberg-gold" />}>
              {directionData.some(d => d.total > 0) ? (
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={directionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <XAxis dataKey="name" stroke="#52525b" tick={{ fontSize: 10, fontFamily: 'monospace' }} />
                      <YAxis stroke="#52525b" tick={{ fontSize: 9, fontFamily: 'monospace' }} />
                      <Tooltip content={<AnalyticsTooltip />} />
                      <Bar dataKey="pnl" name="P&L ($)">
                        {directionData.map((d, i) => (
                          <Cell key={i} fill={d.pnl >= 0 ? '#059669' : '#dc2626'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : <Empty />}
            </Card>

            {/* BUY/SELL Win Rate */}
            <Card title="WIN RATE PAR DIRECTION">
              <div className="space-y-4 pt-2">
                {directionData.map(d => (
                  <div key={d.name} className="space-y-1">
                    <div className="flex justify-between text-xs font-mono">
                      <span className={`font-bold ${d.name === 'BUY' ? 'text-bloomberg-green-light' : 'text-bloomberg-red-light'}`}>{d.name}</span>
                      <span className="text-white">{d.winRate}% — {d.total} trades</span>
                    </div>
                    <div className="w-full bg-bloomberg-border rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${d.name === 'BUY' ? 'bg-bloomberg-green' : 'bg-bloomberg-red'}`}
                        style={{ width: `${Math.min(d.winRate, 100)}%` }}
                      />
                    </div>
                    <div className="text-[9px] text-bloomberg-text-muted">
                      P&L: {d.pnl >= 0 ? '+' : ''}{d.pnl.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* ── TAB: PAR SETUP / PAIRE / TF ────────────────────────────────────── */}
      {activeTab === 'breakdown' && (
        <div className="space-y-5">
          {/* By Pair */}
          <Card title="P&L NET PAR INSTRUMENT" headerAction={<Award className="w-3.5 h-3.5 text-bloomberg-gold" />}>
            {pairData.length > 0 ? (
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={pairData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="glowWinPair" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity={0.8} />
                        <stop offset="100%" stopColor="#059669" stopOpacity={0.2} />
                      </linearGradient>
                      <linearGradient id="glowLossPair" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#ef4444" stopOpacity={0.8} />
                        <stop offset="100%" stopColor="#b91c1c" stopOpacity={0.2} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="name" stroke="#3f3f46" tick={{ fontSize: 10, fontFamily: 'monospace' }} />
                    <YAxis yAxisId="left" stroke="#3f3f46" tick={{ fontSize: 9, fontFamily: 'monospace' }} />
                    <YAxis yAxisId="right" orientation="right" stroke="#3f3f46" tick={{ fontSize: 9, fontFamily: 'monospace' }} tickFormatter={v => `${v}%`} />
                    <Tooltip content={<AnalyticsTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 9, fontFamily: 'monospace' }} />
                    <Bar yAxisId="left" dataKey="pnl" name="P&L ($)">
                      {pairData.map((d, i) => <Cell key={i} fill={d.pnl >= 0 ? 'url(#glowWinPair)' : 'url(#glowLossPair)'} />)}
                    </Bar>
                    <Line yAxisId="right" type="monotone" dataKey="winRate" name="Win%" stroke="#f59e0b" strokeWidth={2} dot={{ fill: '#f59e0b', r: 3 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            ) : <Empty />}
          </Card>

          {/* By Timeframe */}
          <Card title="PERFORMANCE PAR TIMEFRAME">
            {tfData.length > 0 ? (
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={tfData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="glowWinTf" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity={0.8} />
                        <stop offset="100%" stopColor="#059669" stopOpacity={0.2} />
                      </linearGradient>
                      <linearGradient id="glowLossTf" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#ef4444" stopOpacity={0.8} />
                        <stop offset="100%" stopColor="#b91c1c" stopOpacity={0.2} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="name" stroke="#3f3f46" tick={{ fontSize: 10, fontFamily: 'monospace' }} />
                    <YAxis yAxisId="left" stroke="#3f3f46" tick={{ fontSize: 9, fontFamily: 'monospace' }} />
                    <YAxis yAxisId="right" orientation="right" stroke="#3f3f46" tick={{ fontSize: 9, fontFamily: 'monospace' }} tickFormatter={v => `${v}%`} />
                    <Tooltip content={<AnalyticsTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 9, fontFamily: 'monospace' }} />
                    <Bar yAxisId="left" dataKey="pnl" name="P&L ($)">
                      {tfData.map((d, i) => <Cell key={i} fill={d.pnl >= 0 ? 'url(#glowWinTf)' : 'url(#glowLossTf)'} />)}
                    </Bar>
                    <Line yAxisId="right" type="monotone" dataKey="winRate" name="Win%" stroke="#f59e0b" strokeWidth={2} dot={{ fill: '#f59e0b', r: 3 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            ) : <Empty />}
          </Card>

          {/* By Session */}
          <Card title="PERFORMANCE PAR SESSION DE TRADING">
            {sessionData.length > 0 ? (
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={sessionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="glowWinSess" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity={0.8} />
                        <stop offset="100%" stopColor="#059669" stopOpacity={0.2} />
                      </linearGradient>
                      <linearGradient id="glowLossSess" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#ef4444" stopOpacity={0.8} />
                        <stop offset="100%" stopColor="#b91c1c" stopOpacity={0.2} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="name" stroke="#3f3f46" tick={{ fontSize: 10, fontFamily: 'monospace' }} />
                    <YAxis yAxisId="left" stroke="#3f3f46" tick={{ fontSize: 9, fontFamily: 'monospace' }} />
                    <YAxis yAxisId="right" orientation="right" stroke="#3f3f46" tick={{ fontSize: 9, fontFamily: 'monospace' }} tickFormatter={v => `${v}%`} />
                    <Tooltip content={<AnalyticsTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 9, fontFamily: 'monospace' }} />
                    <Bar yAxisId="left" dataKey="pnl" name="P&L ($)">
                      {sessionData.map((d, i) => <Cell key={i} fill={d.pnl >= 0 ? 'url(#glowWinSess)' : 'url(#glowLossSess)'} />)}
                    </Bar>
                    <Line yAxisId="right" type="monotone" dataKey="winRate" name="Win%" stroke="#f59e0b" strokeWidth={2} dot={{ fill: '#f59e0b', r: 3 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            ) : <Empty />}
          </Card>

          {/* Setup table */}
          <Card title="WIN RATE PAR CONFIRMATION SMC/ICT">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-bloomberg-border font-mono text-xs">
                <thead className="bg-bloomberg-surface text-[9px] text-bloomberg-text-secondary uppercase">
                  <tr>
                    <th className="px-4 py-2 text-left">Setup</th>
                    <th className="px-4 py-2 text-right">Trades</th>
                    <th className="px-4 py-2 text-right">Win Rate</th>
                    <th className="px-4 py-2 text-right">P&L Cumulé</th>
                    <th className="px-4 py-2 text-right">Progression</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-bloomberg-border/40 text-white tabular-nums">
                  {setupData.map(s => (
                    <tr key={s.name} className="hover:bg-bloomberg-surface/30">
                      <td className="px-4 py-2.5 font-bold">{s.name}</td>
                      <td className="px-4 py-2.5 text-right text-bloomberg-text-secondary">{s.total}</td>
                      <td className={`px-4 py-2.5 text-right font-bold ${s.winRate >= 50 ? 'text-bloomberg-green-light' : s.total > 0 ? 'text-bloomberg-red-light' : 'text-bloomberg-text-muted'}`}>
                        {s.total > 0 ? `${s.winRate}%` : '—'}
                      </td>
                      <td className={`px-4 py-2.5 text-right font-bold ${s.pnl >= 0 ? 'text-bloomberg-green-light' : 'text-bloomberg-red-light'}`}>
                        {s.total > 0 ? `${s.pnl >= 0 ? '+' : ''}${s.pnl.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '—'}
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="w-full bg-bloomberg-border rounded-full h-1.5">
                          <div
                            className={`h-1.5 rounded-full ${s.winRate >= 50 ? 'bg-bloomberg-green' : 'bg-bloomberg-red'}`}
                            style={{ width: `${Math.min(s.winRate, 100)}%` }}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* ── TAB: TIMING ──────────────────────────────────────────────────── */}
      {activeTab === 'timing' && (
        <div className="space-y-5">
          <Card title="P&L PAR HEURE DE SORTIE (UTC)" headerAction={<Clock className="w-3.5 h-3.5 text-bloomberg-gold" />}>
            {hourData.length > 0 ? (
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={hourData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="hour" stroke="#52525b" tick={{ fontSize: 9, fontFamily: 'monospace' }} />
                    <YAxis yAxisId="left" stroke="#52525b" tick={{ fontSize: 9, fontFamily: 'monospace' }} />
                    <YAxis yAxisId="right" orientation="right" stroke="#52525b" tick={{ fontSize: 9, fontFamily: 'monospace' }} tickFormatter={v => `${v}%`} />
                    <Tooltip content={<AnalyticsTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 9, fontFamily: 'monospace' }} />
                    <ReferenceLine yAxisId="left" y={0} stroke="#52525b" />
                    <Bar yAxisId="left" dataKey="pnl" name="P&L ($)">
                      {hourData.map((d, i) => <Cell key={i} fill={d.pnl >= 0 ? '#059669' : '#dc2626'} />)}
                    </Bar>
                    <Line yAxisId="right" type="monotone" dataKey="winRate" name="Win%" stroke="#d97706" strokeWidth={2} dot={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            ) : <Empty />}
          </Card>

          <Card title="P&L PAR JOUR DE LA SEMAINE">
            {dayData.some(d => d.total > 0) ? (
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={dayData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="day" stroke="#52525b" tick={{ fontSize: 10, fontFamily: 'monospace' }} />
                    <YAxis yAxisId="left" stroke="#52525b" tick={{ fontSize: 9, fontFamily: 'monospace' }} />
                    <YAxis yAxisId="right" orientation="right" stroke="#52525b" tick={{ fontSize: 9, fontFamily: 'monospace' }} tickFormatter={v => `${v}%`} />
                    <Tooltip content={<AnalyticsTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 9, fontFamily: 'monospace' }} />
                    <ReferenceLine yAxisId="left" y={0} stroke="#52525b" />
                    <Bar yAxisId="left" dataKey="pnl" name="P&L ($)">
                      {dayData.map((d, i) => <Cell key={i} fill={d.pnl >= 0 ? '#059669' : '#dc2626'} />)}
                    </Bar>
                    <Line yAxisId="right" type="monotone" dataKey="winRate" name="Win%" stroke="#d97706" strokeWidth={2} dot={{ fill: '#d97706', r: 5 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            ) : <Empty />}
          </Card>
        </div>
      )}

      {/* ── TAB: PSYCHOLOGIE ─────────────────────────────────────────────── */}
      {activeTab === 'psychology' && (
        <div className="space-y-5">
          <Card title="PERFORMANCE PAR ÉTAT MENTAL" headerAction={<Brain className="w-3.5 h-3.5 text-bloomberg-gold" />}>
            {mentalData.length > 0 ? (
              <>
                <div className="h-[220px] mb-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={mentalData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <XAxis dataKey="name" stroke="#52525b" tick={{ fontSize: 9, fontFamily: 'monospace' }} />
                      <YAxis yAxisId="left" stroke="#52525b" tick={{ fontSize: 9, fontFamily: 'monospace' }} />
                      <YAxis yAxisId="right" orientation="right" stroke="#52525b" tick={{ fontSize: 9, fontFamily: 'monospace' }} tickFormatter={v => `${v}%`} />
                      <Tooltip content={<AnalyticsTooltip />} />
                      <Legend wrapperStyle={{ fontSize: 9, fontFamily: 'monospace' }} />
                      <ReferenceLine yAxisId="left" y={0} stroke="#52525b" />
                      <Bar yAxisId="left" dataKey="pnl" name="P&L ($)">
                        {mentalData.map((d, i) => <Cell key={i} fill={d.pnl >= 0 ? '#059669' : '#dc2626'} />)}
                      </Bar>
                      <Line yAxisId="right" type="monotone" dataKey="winRate" name="Win%" stroke="#d97706" strokeWidth={2} dot={{ fill: '#d97706', r: 5 }} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>

                {/* Barchart progress per state */}
                <div className="space-y-3">
                  {mentalData.map(d => {
                    const isNegative = ['REVENGE', 'GREEDY', 'FOMO', 'ANXIOUS', 'TIRED'].includes(d.name);
                    return (
                      <div key={d.name} className="space-y-1">
                        <div className="flex justify-between text-[10px] font-mono">
                          <span className={`font-bold ${isNegative ? 'text-bloomberg-red-light' : 'text-bloomberg-gold-light'}`}>{d.name}</span>
                          <span className="text-bloomberg-text-secondary">{d.total} trades · WR: {d.winRate}%</span>
                          <span className={`font-bold ${d.pnl >= 0 ? 'text-bloomberg-green-light' : 'text-bloomberg-red-light'}`}>
                            {d.pnl >= 0 ? '+' : ''}{d.pnl.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div className="w-full bg-bloomberg-border rounded-full h-1.5">
                          <div
                            className={`h-1.5 rounded-full ${d.winRate >= 50 ? 'bg-bloomberg-green' : 'bg-bloomberg-red'}`}
                            style={{ width: `${Math.min(d.winRate, 100)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : <Empty />}
          </Card>

          {/* Goggins / Discipline */}
          <Card title="FRAMEWORKS GOGGINS — APPLICATION TERRAIN">
            {closed.length > 0 ? (() => {
              const cookieJarCount = closed.filter(t => t.cookie_jar_ref).length;
              const rule40Count = closed.filter(t => t.rule_40_percent).length;
              const cookieJarWR = closed.filter(t => t.cookie_jar_ref && t.pnl > 0).length / Math.max(cookieJarCount, 1) * 100;
              const rule40WR = closed.filter(t => t.rule_40_percent && t.pnl > 0).length / Math.max(rule40Count, 1) * 100;
              return (
                <div className="grid grid-cols-2 gap-6 font-mono text-xs">
                  <div className="space-y-2">
                    <div className="text-[#818cf8] font-bold uppercase text-[10px]">Cookie Jar Method</div>
                    <div className="text-2xl font-bold text-white tabular-nums">{cookieJarCount}</div>
                    <div className="text-slate-400 text-[10px]">activations sur {closed.length} trades</div>
                    <div className={`font-bold ${cookieJarWR >= 50 ? 'text-emerald-400' : 'text-red-400'}`}>
                      Win Rate: {cookieJarWR.toFixed(1)}%
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-[#818cf8] font-bold uppercase text-[10px]">40% Rule</div>
                    <div className="text-2xl font-bold text-white tabular-nums">{rule40Count}</div>
                    <div className="text-slate-400 text-[10px]">activations sur {closed.length} trades</div>
                    <div className={`font-bold ${rule40WR >= 50 ? 'text-emerald-400' : 'text-red-400'}`}>
                      Win Rate: {rule40WR.toFixed(1)}%
                    </div>
                  </div>
                </div>
              );
            })() : <Empty />}
          </Card>
        </div>
      )}

      {/* ── TAB: PROP FIRM TRACKER ────────────────────────────────────────── */}
      {activeTab === 'propfirm' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-[#181920] border border-[#262833] rounded-xl p-5 space-y-2">
              <span className="text-xs font-semibold text-slate-400">Objectif de Profit (${targetProfitAmount.toLocaleString()})</span>
              <div className="text-2xl font-bold text-emerald-400 tabular-nums">
                {netPnL >= 0 ? '+' : ''}${netPnL.toFixed(2)} / ${targetProfitAmount.toLocaleString()}
              </div>
              <div className="w-full bg-[#121318] h-2 rounded-full overflow-hidden border border-[#262833]">
                <div className="bg-emerald-400 h-full rounded-full transition-all" style={{ width: `${Math.min(Math.max((netPnL / Math.max(targetProfitAmount, 1)) * 100, 0), 100)}%` }} />
              </div>
              <span className="text-[10px] text-slate-500 font-medium block">
                Progression : {((netPnL / Math.max(targetProfitAmount, 1)) * 100).toFixed(1)}% de l'objectif
              </span>
            </div>

            <div className="bg-[#181920] border border-[#262833] rounded-xl p-5 space-y-2">
              <span className="text-xs font-semibold text-slate-400">Drawdown Max Autorisé (${maxDrawdownLimitAmount.toLocaleString()})</span>
              <div className="text-2xl font-bold text-red-400 tabular-nums">
                {maxDrawdown.toFixed(2)}% / -{((maxDrawdownLimitAmount / Math.max(initialBalance, 1)) * 100).toFixed(1)}%
              </div>
              <div className="w-full bg-[#121318] h-2 rounded-full overflow-hidden border border-[#262833]">
                <div className="bg-red-400 h-full rounded-full transition-all" style={{ width: `${Math.min((Math.abs(maxDrawdown) / Math.max(((maxDrawdownLimitAmount / Math.max(initialBalance, 1)) * 100), 1)) * 100, 100)}%` }} />
              </div>
              <span className="text-[10px] text-slate-500 font-medium block">
                Marge restante : {(Math.max(((maxDrawdownLimitAmount / Math.max(initialBalance, 1)) * 100) - Math.abs(maxDrawdown), 0)).toFixed(1)}%
              </span>
            </div>

            <div className="bg-[#181920] border border-[#262833] rounded-xl p-5 space-y-2">
              <span className="text-xs font-semibold text-slate-400">Consistency Score Prop Firm</span>
              <div className={`text-2xl font-bold tabular-nums ${netPnL > 0 && winTrades.length > 0 && (Math.max(...winTrades.map(t => t.pnl)) / netPnL) * 100 > 15 ? 'text-[#818cf8]' : 'text-emerald-400'}`}>
                {netPnL > 0 && winTrades.length > 0 ? Math.min(((Math.max(...winTrades.map(t => t.pnl)) / netPnL) * 100), 100).toFixed(1) : '0.0'}%
              </div>
              <div className="text-[10px] text-slate-500 font-medium">
                {netPnL > 0 && winTrades.length > 0 && (Math.max(...winTrades.map(t => t.pnl)) / netPnL) * 100 > 15
                  ? 'ℹ️ Conseil : Votre meilleur jour représente la majorité de vos gains cumulés actuel'
                  : '✓ Excellente répartition des profits sur l\'ensemble des jours'}
              </div>
            </div>
          </div>

          <Card title="STATUT DU COMPTE DE CHALLENGE PROP FIRM">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-sans">
              <div className="p-3 bg-[#121318] border border-[#262833] rounded-xl">
                <span className="text-slate-400 block text-[11px]">Trades Minimaux Requis</span>
                <span className="text-lg font-bold text-white">{closed.length} / 5 jours</span>
              </div>
              <div className="p-3 bg-[#121318] border border-[#262833] rounded-xl">
                <span className="text-slate-400 block text-[11px]">Profit Factor Exigé</span>
                <span className={`text-lg font-bold ${profitFactor >= 1.5 ? 'text-emerald-400' : 'text-amber-400'}`}>{profitFactor.toFixed(2)} (Min 1.5)</span>
              </div>
              <div className="p-3 bg-[#121318] border border-[#262833] rounded-xl">
                <span className="text-slate-400 block text-[11px]">Statut du Risque Daily</span>
                <span className="text-lg font-bold text-emerald-400">Sécurisé</span>
              </div>
              <div className="p-3 bg-[#121318] border border-[#262833] rounded-xl">
                <span className="text-slate-400 block text-[11px]">Éligibilité au Payout</span>
                <span className={`text-lg font-bold ${netPnL > 0 && Math.abs(maxDrawdown) < 10 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {netPnL > 0 && Math.abs(maxDrawdown) < 10 ? 'ÉLIGIBLE ✓' : 'EN COURS'}
                </span>
              </div>
            </div>
          </Card>
        </div>
      )}

    </div>
  );
};
