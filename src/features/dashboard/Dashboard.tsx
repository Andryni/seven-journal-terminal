import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTrades } from '../trades/useTrades';
import { usePerformanceMetrics } from './usePerformanceMetrics';
import {
  Target, Flame, TrendingDown, Activity, Zap, Brain, Calendar, History, ArrowRight,
  Globe, Sparkles
} from 'lucide-react';
import { Table, TableRow, TableCell } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import {
  GlowingEquityChart,
  GradientBarChart,
  Sparkline,
  GlowDefs,
} from '../../components/ui/PremiumCharts';
import { Achievements } from '../achievements/Achievements';

// ── Gauge SVG Component ────────────────────────────────────────────────────────
const SemiCircleGauge = ({ percent, color = '#10b981' }: { percent: number; color?: string }) => {
  const radius = 28;
  const circumference = Math.PI * radius;
  const strokeDashoffset = circumference - (Math.min(Math.max(percent, 0), 100) / 100) * circumference;

  return (
    <div className="relative w-16 h-10 flex items-center justify-center shrink-0">
      <svg className="w-16 h-10 transform -rotate-180" viewBox="0 0 64 36">
        <GlowDefs />
        <path d="M 6 32 A 26 26 0 0 1 58 32" fill="none" stroke="#1e293b" strokeWidth="6" strokeLinecap="round" />
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

// ── Market Sessions Helper ───────────────────────────────────────────────────
function getMarketSessions(date: Date) {
  const utcHour = date.getUTCHours();
  return [
    { name: 'Tokyo', open: utcHour >= 0 && utcHour < 9, time: '00:00 - 09:00 UTC' },
    { name: 'Londres', open: utcHour >= 7 && utcHour < 16, time: '07:00 - 16:00 UTC' },
    { name: 'New York', open: utcHour >= 12 && utcHour < 21, time: '12:00 - 21:00 UTC' },
    { name: 'Sydney', open: utcHour >= 21 || utcHour < 6, time: '21:00 - 06:00 UTC' },
  ];
}

export const Dashboard: React.FC = () => {
  const { trades, isLoading } = useTrades();
  const m = usePerformanceMetrics(trades);
  const [now, setNow] = useState(new Date());

  // Tabs for Central Right Widget
  const [activeTabWidget, setActiveTabWidget] = useState<'checklist' | 'ratio' | 'session'>('checklist');

  // Pre-session checklist state (persisted)
  const [checklist, setChecklist] = useState(() => {
    const saved = localStorage.getItem('seven_pre_session_checklist');
    return saved ? JSON.parse(saved) : [
      { id: '1', text: 'Vérifier le calendrier économique (News high impact)', done: false },
      { id: '2', text: 'Valider le biais H4/H1 & Key Levels', done: false },
      { id: '3', text: 'Respecter le Stop Loss & Max 1% de risque', done: false },
      { id: '4', text: 'Pas de revenge trading après 1 perte', done: false }
    ];
  });

  const toggleChecklistItem = (id: string) => {
    setChecklist((prev: any[]) => {
      const updated = prev.map(item => item.id === id ? { ...item, done: !item.done } : item);
      localStorage.setItem('seven_pre_session_checklist', JSON.stringify(updated));
      return updated;
    });
  };

  // Session Timer
  const [sessionActive, setSessionActive] = useState(false);
  const [sessionStart, setSessionStart] = useState<Date | null>(null);
  const [sessionElapsed, setSessionElapsed] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
      if (sessionActive && sessionStart) {
        setSessionElapsed(Math.floor((Date.now() - sessionStart.getTime()) / 1000));
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [sessionActive, sessionStart]);

  const toggleSession = () => {
    if (sessionActive) {
      setSessionActive(false);
      setSessionStart(null);
      setSessionElapsed(0);
    } else {
      setSessionActive(true);
      setSessionStart(new Date());
    }
  };

  const formatElapsed = (s: number) => {
    const h = Math.floor(s / 3600);
    const min = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${String(h).padStart(2,'0')}:${String(min).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
  };

  const sessionOverLimit = sessionElapsed >= 4 * 3600;
  const marketSessions = useMemo(() => getMarketSessions(now), [now]);

  // Account Health Status
  const healthStatus = useMemo(() => {
    if (m.maxDrawdown > 12 || m.consistency.alert) return { label: 'CRITIQUE', color: 'text-red-400 bg-red-500/10 border-red-500/30' };
    if (m.maxDrawdown > 6 || m.winRate < 40) return { label: 'PRUDENCE', color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' };
    return { label: 'EXCELLENT', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' };
  }, [m]);

  // Today trades count
  const todayTradesCount = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    return trades.filter(t => t.entry_time && t.entry_time.startsWith(todayStr)).length;
  }, [trades]);

  // Long vs Short distribution
  const longVsShort = useMemo(() => {
    const longs = trades.filter(t => t.direction === 'BUY').length;
    const shorts = trades.filter(t => t.direction === 'SELL').length;
    const total = longs + shorts || 1;
    return { longs, shorts, longPct: Math.round((longs / total) * 100), shortPct: Math.round((shorts / total) * 100) };
  }, [trades]);

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

      {/* ── HERO BANNER & SESSIONS OVERVIEW ─── */}
      <div className="bg-gradient-to-r from-[#0d0e14]/95 via-[#131520]/90 to-[#0e1017]/95 border border-white/[0.08] rounded-2xl p-5 backdrop-blur-xl shadow-card-premium flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Left: Salutation + Health Status */}
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-heading font-black tracking-tight text-white flex items-center gap-2">
              <span>Bons trades, Trader</span>
              <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
            </h2>
            <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${healthStatus.color}`}>
              Santé : {healthStatus.label}
            </span>
          </div>
          <p className="text-xs text-slate-400 font-mono">
            {todayTradesCount === 0 ? 'Aucun trade exécuté aujourd\'hui.' : `${todayTradesCount} trade(s) pris aujourd'hui.`} 
            {todayTradesCount >= 3 && <span className="text-amber-400 font-bold ml-1">⚠️ Attention au overtrading !</span>}
          </p>
        </div>

        {/* Right: Market Sessions & Clock */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Sessions Pills */}
          <div className="flex items-center gap-1.5 bg-[#08090d]/80 border border-white/[0.06] rounded-xl px-3 py-1.5">
            <Globe className="w-3.5 h-3.5 text-slate-400 mr-1" />
            {marketSessions.map(s => (
              <span
                key={s.name}
                title={s.time}
                className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-md transition-all ${
                  s.open
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-white/[0.03] text-slate-600 border border-white/[0.04]'
                }`}
              >
                {s.name}
              </span>
            ))}
          </div>

          {/* Session Timer */}
          <motion.button
            onClick={toggleSession}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className={`flex items-center gap-2 rounded-xl px-3 py-2 border text-[11px] font-bold font-mono transition-all ${
              sessionActive
                ? sessionOverLimit
                  ? 'bg-red-500/20 border-red-500/50 text-red-300 animate-pulse'
                  : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                : 'bg-[#181920]/80 border-white/[0.06] text-slate-400 hover:text-white hover:border-white/20'
            }`}
          >
            {sessionActive ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span className="tabular-nums">{formatElapsed(sessionElapsed)}</span>
                {sessionOverLimit && <span className="text-[9px] text-red-300">⚠️ 4H+</span>}
              </>
            ) : (
              <>
                <span className="text-[10px]">▶</span>
                <span>Session</span>
              </>
            )}
          </motion.button>
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

        {/* Ratio RR Moyen (Avg Win / Avg Loss) */}
        <div className="stat-card p-5 flex items-center justify-between group">
          <div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-400 block mb-1">Ratio Gain/Perte</span>
            <div className="kpi-value text-2xl text-cyan-400">
              {m.avgLoss !== 0 ? (m.avgWin / m.avgLoss).toFixed(2) : '1.00'}x
            </div>
            <div className="text-[11px] text-slate-400 font-mono mt-1">
              +${m.avgWin.toFixed(0)} / -${m.avgLoss.toFixed(0)}
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 group-hover:scale-110 transition-transform">
            <Zap className="w-5 h-5 text-cyan-400" />
          </div>
        </div>

        {/* Max Drawdown */}
        <div className="stat-card p-5 flex items-center justify-between group">
          <div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-400 block mb-1">Max Drawdown</span>
            <div className="kpi-value text-2xl text-red-400" style={{ filter: 'drop-shadow(0 0 8px #ef4444)' }}>-${m.maxDrawdown.toFixed(2)}</div>
            <div className="text-[11px] text-slate-400 font-mono mt-1">Perte max subie</div>
          </div>
          <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 group-hover:scale-110 transition-transform">
            <TrendingDown className="w-5 h-5 text-red-400" />
          </div>
        </div>

      </div>

      {/* ── STREAK TRACKER BANNER ─── */}
      <AnimatePresence>
        {m.streak.current > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.5, ease: [0.22, 0.61, 0.36, 1] }}
            className={`relative overflow-hidden rounded-2xl border px-5 py-4 flex items-center justify-between gap-4 ${
              m.streak.type === 'win'
                ? 'bg-gradient-to-r from-amber-950/60 to-emerald-950/40 border-amber-500/30'
                : 'bg-gradient-to-r from-red-950/60 to-[#0e0f14] border-red-500/30'
            }`}
          >
            <div className={`absolute inset-0 opacity-10 ${m.streak.type === 'win' ? 'bg-amber-400' : 'bg-red-500'}`} />

            <div className="flex items-center gap-3 relative z-10">
              <motion.div
                animate={{ scale: [1, 1.18, 1], rotate: [-3, 3, -3] }}
                transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
                className="text-2xl"
              >
                {m.streak.type === 'win' ? '🔥' : '❄️'}
              </motion.div>
              <div>
                <div className="text-xs font-mono font-bold text-white/60 uppercase tracking-wider">
                  {m.streak.type === 'win' ? 'Win Streak' : 'Loss Streak'}
                </div>
                <div className={`text-2xl font-black font-mono tabular-nums ${m.streak.type === 'win' ? 'text-amber-400' : 'text-red-400'}`}
                  style={{ filter: `drop-shadow(0 0 10px ${m.streak.type === 'win' ? '#f59e0b' : '#ef4444'})` }}
                >
                  {m.streak.current} <span className="text-sm font-bold text-white/40">jours</span>
                </div>
              </div>
            </div>

            {m.streak.type === 'win' && m.streak.best > 0 && (
              <div className="flex-1 max-w-xs relative z-10 hidden sm:block">
                <div className="flex justify-between text-[10px] font-mono text-white/40 mb-1.5">
                  <span>Streak actuel</span>
                  <span>Record: {m.streak.best}j</span>
                </div>
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min((m.streak.current / m.streak.best) * 100, 100)}%` }}
                    transition={{ duration: 1, delay: 0.3, ease: 'easeOut' }}
                  />
                </div>
                <div className="text-[10px] font-mono text-amber-400/60 mt-1">
                  {m.streak.current >= m.streak.best ? '🏆 Nouveau record !' : `${m.streak.best - m.streak.current}j du record`}
                </div>
              </div>
            )}

            <div className="relative z-10 shrink-0 hidden sm:flex items-center gap-1 text-xs font-mono text-white/30">
              <Flame className="w-3.5 h-3.5" />
              <span>Continue !</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── CHARTS & INTERACTIVE MULTI-WIDGET ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Glowing Equity Curve */}
        <div className="chart-container lg:col-span-2 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-heading font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
              <span className="w-1 h-3.5 rounded-full" style={{background: 'linear-gradient(180deg,#6366f1,#8b5cf6)'}} />
              Courbe d'Équité & Drawdown Live
            </h3>
            <span className={`text-xs font-mono font-bold ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}
              style={{ filter: `drop-shadow(0 0 6px ${isPositive ? '#10b981' : '#ef4444'})` }}>
              {m.netPnL >= 0 ? '+' : ''}${m.netPnL.toFixed(2)}
            </span>
          </div>
          <GlowingEquityChart data={equityData} dataKey="pnl" height={256} isPositive={isPositive} />
        </div>

        {/* Multi-Tab Interactive Widget */}
        <div className="chart-container p-5 flex flex-col justify-between">
          <div>
            {/* Widget Tabs Header */}
            <div className="flex items-center gap-1 border-b border-white/[0.06] pb-3 mb-4">
              <button
                onClick={() => setActiveTabWidget('checklist')}
                className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-lg transition-all ${
                  activeTabWidget === 'checklist' ? 'bg-[#6366f1]/20 text-[#818cf8] border border-[#6366f1]/30' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                Checklist Session
              </button>
              <button
                onClick={() => setActiveTabWidget('ratio')}
                className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-lg transition-all ${
                  activeTabWidget === 'ratio' ? 'bg-[#6366f1]/20 text-[#818cf8] border border-[#6366f1]/30' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                Long vs Short
              </button>
            </div>

            {/* TAB 1: Checklist Pré-Session */}
            {activeTabWidget === 'checklist' && (
              <div className="space-y-2.5">
                <div className="text-[11px] text-slate-400 font-mono mb-2 flex items-center justify-between">
                  <span>Règles de Discipline :</span>
                  <span className="text-emerald-400 font-bold">{checklist.filter((i: any) => i.done).length}/{checklist.length}</span>
                </div>
                {checklist.map((item: any) => (
                  <label
                    key={item.id}
                    onClick={() => toggleChecklistItem(item.id)}
                    className={`flex items-start gap-2.5 p-2 rounded-xl border transition-all cursor-pointer text-xs ${
                      item.done
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 line-through opacity-75'
                        : 'bg-[#14151f] border-white/[0.05] text-slate-300 hover:border-white/10'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={item.done}
                      onChange={() => {}}
                      className="mt-0.5 rounded border-white/20 bg-[#0e0f14] text-[#6366f1] focus:ring-0"
                    />
                    <span>{item.text}</span>
                  </label>
                ))}
              </div>
            )}

            {/* TAB 2: Long vs Short Ratio */}
            {activeTabWidget === 'ratio' && (
              <div className="space-y-4">
                <div className="text-xs text-slate-400 font-mono">Répartition des positions exécutées :</div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-mono font-bold">
                    <span className="text-emerald-400">BUY / LONG ({longVsShort.longs})</span>
                    <span className="text-indigo-400">SELL / SHORT ({longVsShort.shorts})</span>
                  </div>
                  <div className="h-3 w-full bg-[#121318] rounded-full overflow-hidden flex border border-white/10">
                    <div className="bg-emerald-400 h-full transition-all" style={{ width: `${longVsShort.longPct}%` }} />
                    <div className="bg-indigo-500 h-full transition-all" style={{ width: `${longVsShort.shortPct}%` }} />
                  </div>
                  <div className="flex justify-between text-[10px] font-mono text-slate-500">
                    <span>{longVsShort.longPct}% Longs</span>
                    <span>{longVsShort.shortPct}% Shorts</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-white/[0.05] mt-4 flex items-center justify-between text-[10px] font-mono text-slate-500">
            <span>Seven Tracking v2.0</span>
            <span className="text-emerald-400">Discipline 100%</span>
          </div>
        </div>

      </div>

      {/* P&L Quotidien — Gradient Bar Chart */}
      <div className="chart-container p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-heading font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
            <span className="w-1 h-3.5 rounded-full" style={{background: 'linear-gradient(180deg,#06b6d4,#6366f1)'}} />
            P&L Quotidien — Bars
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

        {/* Performance par Mois */}
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

        {/* Derniers Trades */}
        <div className="chart-container p-5 space-y-4">
          <h3 className="text-xs font-heading font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
            <History className="w-4 h-4 text-[#8b5cf6]" />
            Derniers Trades Exécutés
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

      {/* ── ACHIEVEMENTS ─── */}
      <div className="bg-[#0e0f14]/80 border border-white/[0.07] rounded-2xl p-5">
        <Achievements trades={trades} />
      </div>

    </div>
  );
};
