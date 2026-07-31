import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import type { Trade } from '../trades/useTrades';
import { usePerformanceMetrics } from '../dashboard/usePerformanceMetrics';
import { Trophy, Lock, CheckCircle2 } from 'lucide-react';

// ─── Badge definitions ────────────────────────────────────────────────────────

interface BadgeDef {
  id: string;
  icon: string;
  label: string;
  description: string;
  color: string;
  glow: string;
  check: (stats: BadgeStats) => boolean;
}

interface BadgeStats {
  totalTrades: number;
  winRate: number;
  bestStreak: number;
  currentStreak: number;
  profitFactor: number;
  netPnL: number;
  maxDrawdown: number;
  winCount: number;
  consistency: number;
  avgRMultiple: number;
}

const BADGES: BadgeDef[] = [
  {
    id: 'first_trade',
    icon: '🚀',
    label: 'Premier Décollage',
    description: 'Ajouter votre premier trade',
    color: 'bg-indigo-500/15 border-indigo-500/30',
    glow: '#6366f1',
    check: (s) => s.totalTrades >= 1,
  },
  {
    id: 'ten_trades',
    icon: '📊',
    label: 'Trader Sérieux',
    description: '10 trades enregistrés',
    color: 'bg-blue-500/15 border-blue-500/30',
    glow: '#3b82f6',
    check: (s) => s.totalTrades >= 10,
  },
  {
    id: 'fifty_trades',
    icon: '💼',
    label: 'Professionnel',
    description: '50 trades enregistrés',
    color: 'bg-violet-500/15 border-violet-500/30',
    glow: '#8b5cf6',
    check: (s) => s.totalTrades >= 50,
  },
  {
    id: 'first_win',
    icon: '✅',
    label: 'Premier Gain',
    description: 'Réaliser un trade gagnant',
    color: 'bg-emerald-500/15 border-emerald-500/30',
    glow: '#10b981',
    check: (s) => s.winCount >= 1,
  },
  {
    id: 'win_rate_60',
    icon: '🎯',
    label: 'Précision +60%',
    description: 'Win rate ≥ 60%',
    color: 'bg-emerald-500/15 border-emerald-500/30',
    glow: '#10b981',
    check: (s) => s.winRate >= 60 && s.totalTrades >= 10,
  },
  {
    id: 'win_rate_70',
    icon: '🏹',
    label: 'Sniper',
    description: 'Win rate ≥ 70% sur 20+ trades',
    color: 'bg-teal-500/15 border-teal-500/30',
    glow: '#14b8a6',
    check: (s) => s.winRate >= 70 && s.totalTrades >= 20,
  },
  {
    id: 'streak_3',
    icon: '🔥',
    label: '3 Jours en Feu',
    description: '3 jours gagnants consécutifs',
    color: 'bg-amber-500/15 border-amber-500/30',
    glow: '#f59e0b',
    check: (s) => s.bestStreak >= 3,
  },
  {
    id: 'streak_7',
    icon: '🌟',
    label: 'Semaine Parfaite',
    description: '7 jours gagnants consécutifs',
    color: 'bg-amber-500/15 border-amber-500/30',
    glow: '#f59e0b',
    check: (s) => s.bestStreak >= 7,
  },
  {
    id: 'profit_factor_2',
    icon: '⚡',
    label: 'Profit Machine',
    description: 'Profit factor ≥ 2.0',
    color: 'bg-yellow-500/15 border-yellow-500/30',
    glow: '#eab308',
    check: (s) => s.profitFactor >= 2 && s.totalTrades >= 10,
  },
  {
    id: 'pnl_1k',
    icon: '💰',
    label: 'Mille Dollars',
    description: 'P&L net ≥ $1,000',
    color: 'bg-green-500/15 border-green-500/30',
    glow: '#22c55e',
    check: (s) => s.netPnL >= 1000,
  },
  {
    id: 'pnl_10k',
    icon: '🏆',
    label: 'Dix Mille',
    description: 'P&L net ≥ $10,000',
    color: 'bg-gold-500/15 border-amber-400/40',
    glow: '#fbbf24',
    check: (s) => s.netPnL >= 10000,
  },
  {
    id: 'iron_discipline',
    icon: '🛡️',
    label: 'Iron Discipline',
    description: 'Consistency score < 15% sur 20+ trades',
    color: 'bg-cyan-500/15 border-cyan-500/30',
    glow: '#06b6d4',
    check: (s) => s.consistency < 15 && s.totalTrades >= 20,
  },
  {
    id: 'r_master',
    icon: '🧠',
    label: 'R-Multiple Master',
    description: 'R-Multiple moyen ≥ 1.5',
    color: 'bg-purple-500/15 border-purple-500/30',
    glow: '#a855f7',
    check: (s) => s.avgRMultiple >= 1.5 && s.totalTrades >= 15,
  },
];

// ─── Badge card ───────────────────────────────────────────────────────────────

function BadgeCard({ badge, unlocked, index }: { badge: BadgeDef; unlocked: boolean; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.4, ease: [0.22, 0.61, 0.36, 1] }}
      className={`relative border rounded-2xl p-4 flex flex-col items-center gap-2 text-center transition-all duration-300
        ${unlocked
          ? `${badge.color} hover:scale-105 cursor-default`
          : 'bg-[#0a0b0f] border-white/[0.04] opacity-40 grayscale'
        }`}
      style={unlocked ? { boxShadow: `0 0 20px ${badge.glow}22` } : {}}
    >
      {/* Lock overlay */}
      {!unlocked && (
        <div className="absolute inset-0 flex items-center justify-center rounded-2xl">
          <Lock className="w-4 h-4 text-slate-700" />
        </div>
      )}

      {/* Glow ring for unlocked */}
      {unlocked && (
        <motion.div
          className="absolute inset-0 rounded-2xl opacity-0"
          animate={{ opacity: [0, 0.15, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          style={{ background: `radial-gradient(circle, ${badge.glow}, transparent 70%)` }}
        />
      )}

      <div className="text-3xl relative z-10">{unlocked ? badge.icon : '🔒'}</div>
      <div className="relative z-10">
        <div className="text-xs font-bold text-white leading-tight">{badge.label}</div>
        <div className="text-[10px] font-mono text-slate-500 mt-0.5 leading-tight">{badge.description}</div>
      </div>
      {unlocked && (
        <div className="relative z-10">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
        </div>
      )}
    </motion.div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface AchievementsProps {
  trades: Trade[];
}

export const Achievements: React.FC<AchievementsProps> = ({ trades }) => {
  const m = usePerformanceMetrics(trades);

  const stats: BadgeStats = useMemo(() => ({
    totalTrades: m.totalTrades,
    winRate: m.winRate,
    bestStreak: m.streak.best,
    currentStreak: m.streak.current,
    profitFactor: m.profitFactor,
    netPnL: m.netPnL,
    maxDrawdown: m.maxDrawdown,
    winCount: m.winCount,
    consistency: m.consistency.score,
    avgRMultiple: m.avgRMultiple,
  }), [m]);

  const results = useMemo(() =>
    BADGES.map(b => ({ badge: b, unlocked: b.check(stats) })),
    [stats]
  );

  const unlockedCount = results.filter(r => r.unlocked).length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-200">Achievements</span>
        </div>
        <div className="text-xs font-mono text-slate-400">
          <span className="text-amber-400 font-bold">{unlockedCount}</span> / {BADGES.length} débloqués
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${(unlockedCount / BADGES.length) * 100}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {results.map(({ badge, unlocked }, i) => (
          <BadgeCard key={badge.id} badge={badge} unlocked={unlocked} index={i} />
        ))}
      </div>
    </div>
  );
};
