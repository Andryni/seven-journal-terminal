import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTrades } from '../trades/useTrades';
import { usePerformanceMetrics } from '../dashboard/usePerformanceMetrics';
import {
  Target, TrendingUp, Check, X, Edit3,
  AlertTriangle, Calendar
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface MonthlyGoal {
  pnlTarget: number;
  winRateTarget: number;
  maxTradesPerDay: number;
  maxDrawdownPercent: number;
  label: string;
}

const DEFAULT_GOAL: MonthlyGoal = {
  pnlTarget: 1000,
  winRateTarget: 60,
  maxTradesPerDay: 3,
  maxDrawdownPercent: 5,
  label: '',
};

function getStorageKey() {
  const now = new Date();
  return `seven_goals_${now.getFullYear()}_${now.getMonth()}`;
}

// ─── Animated progress ring ───────────────────────────────────────────────────

function ProgressRing({
  percent,
  color,
  size = 80,
  stroke = 7,
  label,
  value,
}: {
  percent: number;
  color: string;
  size?: number;
  stroke?: number;
  label: string;
  value: string;
}) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(Math.max(percent, 0), 100);

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#1e2028" strokeWidth={stroke} />
          <motion.circle
            cx={size/2} cy={size/2} r={r} fill="none"
            stroke={color} strokeWidth={stroke} strokeLinecap="round"
            strokeDasharray={circ}
            initial={{ strokeDashoffset: circ }}
            animate={{ strokeDashoffset: circ - (pct / 100) * circ }}
            transition={{ duration: 1.2, ease: 'easeOut', delay: 0.2 }}
            style={{ filter: `drop-shadow(0 0 6px ${color})` }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-sm font-black font-mono text-white">{Math.round(pct)}%</span>
        </div>
      </div>
      <div className="text-center">
        <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">{label}</div>
        <div className="text-xs font-bold text-white mt-0.5">{value}</div>
      </div>
    </div>
  );
}

// ─── Goal Card ────────────────────────────────────────────────────────────────

function GoalBar({
  label,
  current,
  target,
  unit,
  color,
  reverse = false,
  delay = 0,
}: {
  label: string;
  current: number;
  target: number;
  unit: string;
  color: string;
  reverse?: boolean;
  delay?: number;
}) {
  const pct = target > 0 ? Math.min(Math.abs(current) / target * 100, 100) : 0;
  const isGood = reverse ? current <= target : current >= target;

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.5 }}
      className="space-y-1.5"
    >
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-400 font-mono">{label}</span>
        <div className="flex items-center gap-1.5">
          <span className={`font-black font-mono ${isGood ? 'text-emerald-400' : 'text-slate-200'}`}>
            {current.toLocaleString('en-US', { maximumFractionDigits: 1 })}{unit}
          </span>
          <span className="text-slate-600">/</span>
          <span className="text-slate-500 font-mono">{target.toLocaleString('en-US', { maximumFractionDigits: 0 })}{unit}</span>
          {isGood && <Check className="w-3.5 h-3.5 text-emerald-400" />}
        </div>
      </div>
      <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: color }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1.0, ease: 'easeOut', delay: delay + 0.1 }}
        />
      </div>
      <div className="text-[10px] font-mono text-slate-600 text-right">{pct.toFixed(0)}% de l'objectif</div>
    </motion.div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export const Goals: React.FC = () => {
  const { trades } = useTrades();
  const m = usePerformanceMetrics(trades);
  const [goal, setGoal] = useState<MonthlyGoal>(DEFAULT_GOAL);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<MonthlyGoal>(DEFAULT_GOAL);

  // Load from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(getStorageKey());
      if (stored) setGoal(JSON.parse(stored));
    } catch { /* ignore */ }
  }, []);

  const save = () => {
    setGoal(draft);
    localStorage.setItem(getStorageKey(), JSON.stringify(draft));
    setEditing(false);
  };

  // Current month stats
  const now = new Date();
  const currentMonthPnL = useMemo(() => {
    return m.dailyPnL
      .filter(d => {
        const dd = new Date(d.date);
        return dd.getFullYear() === now.getFullYear() && dd.getMonth() === now.getMonth();
      })
      .reduce((sum, d) => sum + d.pnl, 0);
  }, [m.dailyPnL]);

  const pnlPct = goal.pnlTarget > 0 ? (currentMonthPnL / goal.pnlTarget) * 100 : 0;
  const wrPct = goal.winRateTarget > 0 ? (m.winRate / goal.winRateTarget) * 100 : 0;
  const monthName = now.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-6 page-enter">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-heading font-bold text-white tracking-tight">Objectifs du Mois</h2>
          <p className="text-xs text-slate-400 font-mono mt-0.5 capitalize">{monthName}</p>
        </div>
        <motion.button
          onClick={() => { setDraft(goal); setEditing(true); }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#6366f1]/15 border border-[#6366f1]/30 text-[#818cf8] text-xs font-bold hover:bg-[#6366f1]/25 transition-all"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          <Edit3 className="w-3.5 h-3.5" />
          Modifier les objectifs
        </motion.button>
      </div>

      {/* Progress rings row */}
      <div className="bg-[#0e0f14]/80 border border-white/[0.07] rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-6">
          <Target className="w-4 h-4 text-[#6366f1]" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-200">Vue d'ensemble</span>
        </div>
        <div className="flex flex-wrap justify-around gap-6">
          <ProgressRing
            percent={pnlPct}
            color="#10b981"
            label="P&L Cible"
            value={`$${currentMonthPnL.toFixed(0)} / $${goal.pnlTarget}`}
          />
          <ProgressRing
            percent={wrPct}
            color="#818cf8"
            label="Win Rate"
            value={`${m.winRate.toFixed(1)}% / ${goal.winRateTarget}%`}
          />
          <ProgressRing
            percent={m.streak.type === 'win' ? Math.min(m.streak.current * 20, 100) : 0}
            color="#f59e0b"
            label="Win Streak"
            value={`${m.streak.current} jours 🔥`}
          />
          <ProgressRing
            percent={goal.maxDrawdownPercent > 0 ? Math.max(100 - (m.maxDrawdown / 100) * 100, 0) : 100}
            color="#06b6d4"
            label="DD Control"
            value={`$${m.maxDrawdown.toFixed(0)} max DD`}
          />
        </div>
      </div>

      {/* Detailed bars */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-[#0e0f14]/80 border border-white/[0.07] rounded-2xl p-5 space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-white/[0.05]">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-200">Performance</span>
          </div>
          <GoalBar
            label="P&L du mois"
            current={currentMonthPnL}
            target={goal.pnlTarget}
            unit="$"
            color="linear-gradient(90deg,#10b981,#34d399)"
            delay={0}
          />
          <GoalBar
            label="Win Rate"
            current={m.winRate}
            target={goal.winRateTarget}
            unit="%"
            color="linear-gradient(90deg,#6366f1,#818cf8)"
            delay={0.1}
          />
          <GoalBar
            label="Profit Factor"
            current={m.profitFactor}
            target={2}
            unit="x"
            color="linear-gradient(90deg,#06b6d4,#38bdf8)"
            delay={0.2}
          />
        </div>

        <div className="bg-[#0e0f14]/80 border border-white/[0.07] rounded-2xl p-5 space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-white/[0.05]">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-200">Discipline</span>
          </div>
          <GoalBar
            label="Consistency Score"
            current={100 - m.consistency.score}
            target={85}
            unit="%"
            color="linear-gradient(90deg,#f59e0b,#fbbf24)"
            delay={0}
          />
          <GoalBar
            label="Max Drawdown (contrôle)"
            current={Math.max(0, goal.maxDrawdownPercent * 100 - m.maxDrawdown)}
            target={goal.maxDrawdownPercent * 100}
            unit="$"
            color="linear-gradient(90deg,#8b5cf6,#a78bfa)"
            delay={0.1}
          />
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 font-mono">Streak actuel</span>
              <span className="font-black font-mono text-amber-400">{m.streak.current}j 🔥</span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {Array.from({ length: Math.min(m.streak.best || 5, 10) }).map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs ${
                    i < m.streak.current ? 'bg-amber-500/30 border border-amber-500/60 text-amber-300' : 'bg-white/[0.04] border border-white/10 text-slate-700'
                  }`}
                >
                  🔥
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Motivational banner */}
      <motion.div
        className="bg-gradient-to-r from-[#6366f1]/10 to-[#8b5cf6]/10 border border-[#6366f1]/20 rounded-2xl p-5 flex items-center gap-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <div className="text-3xl">
          {pnlPct >= 100 ? '🏆' : pnlPct >= 50 ? '💪' : '🎯'}
        </div>
        <div>
          <div className="text-sm font-bold text-white">
            {pnlPct >= 100 ? 'Objectif atteint ! Félicitations 🎉' :
             pnlPct >= 75 ? 'Presque là ! Continue sur ta lancée.' :
             pnlPct >= 50 ? 'Bonne progression, tu es à mi-chemin.' :
             'Reste discipliné, chaque trade compte.'}
          </div>
          <div className="text-xs text-slate-400 mt-0.5 font-mono">
            {currentMonthPnL >= 0 ? '+' : ''}${currentMonthPnL.toFixed(2)} réalisés sur ${goal.pnlTarget} cibles
          </div>
        </div>
        <div className="ml-auto flex items-center gap-1 text-xs text-slate-600">
          <Calendar className="w-3.5 h-3.5" />
          <span>{monthName}</span>
        </div>
      </motion.div>

      {/* Edit Modal */}
      <AnimatePresence>
        {editing && (
          <motion.div
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setEditing(false)}
          >
            <motion.div
              className="bg-[#0e0f14] border border-white/[0.1] rounded-2xl p-6 w-full max-w-md shadow-2xl"
              initial={{ scale: 0.92, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.92, y: 20 }}
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-base font-bold text-white">Objectifs du mois</h3>
                <button onClick={() => setEditing(false)} className="text-slate-500 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                {[
                  { label: 'Nom du mois (optionnel)', key: 'label', unit: '', type: 'text' },
                  { label: 'Cible P&L ($)', key: 'pnlTarget', unit: '$', type: 'number' },
                  { label: 'Win Rate cible (%)', key: 'winRateTarget', unit: '%', type: 'number' },
                  { label: 'Max trades / jour', key: 'maxTradesPerDay', unit: '', type: 'number' },
                  { label: 'Max Drawdown (%)', key: 'maxDrawdownPercent', unit: '%', type: 'number' },
                ].map(({ label, key, type }) => (
                  <div key={key}>
                    <label className="text-xs font-mono text-slate-400 mb-1.5 block">{label}</label>
                    <input
                      type={type}
                      value={(draft as unknown as Record<string, string | number>)[key]}
                      onChange={e => setDraft(prev => ({
                        ...prev,
                        [key]: type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value,
                      }))}
                      className="w-full bg-[#181920] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#6366f1] transition-colors font-mono"
                    />
                  </div>
                ))}
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setEditing(false)}
                  className="flex-1 py-2.5 rounded-xl border border-white/10 text-slate-400 text-sm font-semibold hover:bg-white/5 transition-all"
                >
                  Annuler
                </button>
                <button
                  onClick={save}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white text-sm font-bold hover:opacity-90 transition-all"
                >
                  Enregistrer
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
