import React, { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import html2canvas from 'html2canvas';
import { useTrades } from '../../features/trades/useTrades';
import { useAccounts } from '../../features/accounts/useAccounts';
import type { Trade } from '../../features/trades/useTrades';
import type { TradingAccount } from '../../features/accounts/useAccounts';
import { X, Download, Share2, Camera } from 'lucide-react';

// ─── Types ─────────────────────────────────────────────────────────────────────
type Period = 'daily' | 'weekly' | 'monthly' | 'yearly';

interface PeriodStats {
  totalPnl: number;
  tradeCount: number;
  wins: number;
  losses: number;
  winRate: number;
  avgR: number;
  bestTrade: number;
  worstTrade: number;
  pairs: string[];
  sessions: string[];
  equityCurve: number[];
  periodLabel: string;
}

// ─── Helpers ────────────────────────────────────────────────────────────────────
function getPeriodRange(period: Period): { start: Date; end: Date; label: string } {
  const now = new Date();
  let start: Date, end: Date, label: string;

  switch (period) {
    case 'daily':
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
      label = now.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
      break;
    case 'weekly': {
      const day = now.getDay();
      const diff = day === 0 ? -6 : 1 - day;
      start = new Date(now); start.setDate(now.getDate() + diff); start.setHours(0, 0, 0, 0);
      end = new Date(start); end.setDate(start.getDate() + 6); end.setHours(23, 59, 59);
      label = `Semaine du ${start.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} au ${end.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}`;
      break;
    }
    case 'monthly':
      start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      label = now.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }).toUpperCase();
      break;
    case 'yearly':
      start = new Date(now.getFullYear(), 0, 1, 0, 0, 0);
      end = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
      label = `Année ${now.getFullYear()}`;
      break;
  }

  return { start, end, label };
}

function computeStats(trades: Trade[], period: Period): PeriodStats {
  const { start, end, label } = getPeriodRange(period);

  const filtered = trades.filter(t => {
    const time = new Date(t.entry_time);
    return time >= start && time <= end && t.pnl !== null;
  });

  const closedTrades = filtered.filter(t => t.result !== 'OPEN');
  const wins = closedTrades.filter(t => (t.pnl ?? 0) > 0);
  const losses = closedTrades.filter(t => (t.pnl ?? 0) < 0);
  const totalPnl = closedTrades.reduce((s, t) => s + (t.pnl ?? 0), 0);
  const avgR = closedTrades.length > 0
    ? closedTrades.reduce((s, t) => s + (t.r_multiple ?? 0), 0) / closedTrades.length
    : 0;
  const pnlValues = closedTrades.map(t => t.pnl ?? 0);
  const bestTrade = pnlValues.length > 0 ? Math.max(...pnlValues) : 0;
  const worstTrade = pnlValues.length > 0 ? Math.min(...pnlValues) : 0;

  // Equity curve
  const sorted = [...closedTrades].sort((a, b) =>
    new Date(a.entry_time).getTime() - new Date(b.entry_time).getTime()
  );
  let running = 0;
  const equityCurve = sorted.map(t => { running += (t.pnl ?? 0); return running; });
  if (equityCurve.length === 0) equityCurve.push(0, 0);

  const pairs = [...new Set(filtered.map(t => t.pair))];
  const sessions = [...new Set(filtered.map(t => t.session).filter(Boolean))] as string[];

  return {
    totalPnl,
    tradeCount: closedTrades.length,
    wins: wins.length,
    losses: losses.length,
    winRate: closedTrades.length > 0 ? (wins.length / closedTrades.length) * 100 : 0,
    avgR,
    bestTrade,
    worstTrade,
    pairs,
    sessions,
    equityCurve,
    periodLabel: label,
  };
}

// ─── SVG Equity Curve ──────────────────────────────────────────────────────────
const EquityCurveSVG = ({ data, positive, trades }: { data: number[]; positive: boolean; trades: Trade[] }) => {
  if (data.length < 2) return null;
  const w = 530, h = 110;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  
  const hLines = 4;

  const pts = data.map((v, i) => {
    const x = 55 + (i / (data.length - 1)) * (w - 75);
    const y = 15 + (1 - (v - min) / range) * (h - 35);
    return { x, y, val: v };
  });

  const color = positive ? '#10b981' : '#ef4444';
  const polylinePoints = pts.map(p => `${p.x},${p.y}`).join(' ');
  const polygonPoints = `55,${h - 20} ${polylinePoints} ${pts[pts.length - 1].x},${h - 20}`;

  return (
    <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} fill="none" style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id="shareEqGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.35} />
          <stop offset="100%" stopColor={color} stopOpacity={0.0} />
        </linearGradient>
      </defs>

      {/* Grid lines */}
      {Array.from({ length: hLines }).map((_, i) => {
        const y = 15 + (i / (hLines - 1)) * (h - 35);
        return (
          <line key={i} x1="55" y1={y} x2={w - 15} y2={y} stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
        );
      })}

      {/* Y Axis Labels */}
      {Array.from({ length: hLines }).map((_, i) => {
        const y = 15 + (i / (hLines - 1)) * (h - 35);
        const val = max - (i / (hLines - 1)) * range;
        return (
          <text key={i} x="46" y={y + 3} fill="rgba(255,255,255,0.35)" fontSize="9" fontFamily="monospace" textAnchor="end">
            {val.toFixed(0)}$
          </text>
        );
      })}

      {/* X Axis Labels */}
      {pts.map((p, i) => {
        if (i === 0 || i === pts.length - 1 || (pts.length > 4 && i === Math.floor(pts.length / 2))) {
          const tradeTime = trades[i]?.entry_time ? new Date(trades[i].entry_time) : new Date();
          const timeStr = `${tradeTime.getDate()}/${tradeTime.getMonth() + 1} ${tradeTime.getHours().toString().padStart(2, '0')}:00`;
          return (
            <text key={i} x={p.x} y={h - 3} fill="rgba(255,255,255,0.35)" fontSize="8.5" fontFamily="monospace" textAnchor="middle">
              {timeStr}
            </text>
          );
        }
        return null;
      })}

      {/* Gradient Fill & Stroke Line */}
      <polygon points={polygonPoints} fill="url(#shareEqGrad)" />
      <polyline points={polylinePoints} stroke={color} strokeWidth="2" fill="none" strokeLinejoin="round" />

      {/* Point Circles */}
      {pts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3.5" fill="#090b13" stroke={color} strokeWidth="2" />
      ))}
    </svg>
  );
};

// ─── Share Card (the visual captured to image) ──────────────────────────────────
const ShareCardVisual = React.forwardRef<HTMLDivElement, {
  stats: PeriodStats;
  period: Period;
  account: TradingAccount | null;
  trades: Trade[];
}>(({ stats, account, trades }, ref) => {
  const isPositive = stats.totalPnl >= 0;
  const profitColor = isPositive ? '#10b981' : '#ef4444';

  return (
    <div
      ref={ref}
      style={{
        width: '640px',
        background: 'linear-gradient(135deg, #0b0c10 0%, #14161f 50%, #0d0e14 100%)',
        fontFamily: '"Plus Jakarta Sans", "Inter", system-ui, sans-serif',
        padding: '40px',
        position: 'relative',
        overflow: 'hidden',
        borderRadius: '28px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 30px 60px -15px rgba(0, 0, 0, 0.9)',
      }}
    >
      {/* Background glow radial overlays */}
      <div style={{
        position: 'absolute', top: '-120px', left: '50%', transform: 'translateX(-50%)',
        width: '420px', height: '420px', borderRadius: '50%',
        background: isPositive 
          ? 'radial-gradient(circle, rgba(16, 185, 129, 0.18) 0%, transparent 70%)'
          : 'radial-gradient(circle, rgba(239, 68, 68, 0.18) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: '-100px', right: '-100px',
        width: '300px', height: '300px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Modern Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <div style={{
              width: '28px', height: '28px', borderRadius: '8px',
              background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(99, 102, 241, 0.4)',
              color: '#ffffff', fontWeight: 900, fontSize: '14px', lineHeight: 1
            }}>⚡</div>
            <span style={{ fontSize: '20px', fontWeight: 900, color: '#ffffff', letterSpacing: '2.5px' }}>SEVEN</span>
            <span style={{ fontSize: '20px', fontWeight: 900, color: '#818cf8', letterSpacing: '2.5px' }}>TRACKING</span>
          </div>
          <div style={{ fontSize: '11px', color: '#94a3b8', letterSpacing: '1.5px', textTransform: 'uppercase', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>⚡ RAPPORT FINANCIER CERTIFIÉ</span>
            <span>·</span>
            <span>{stats.periodLabel}</span>
          </div>
        </div>

        {/* Account Badge Top Right */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.04)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '16px', padding: '10px 18px',
          display: 'flex', flexDirection: 'column', alignItems: 'flex-end',
          boxShadow: '0 8px 20px rgba(0,0,0,0.4)',
        }}>
          <div style={{ fontSize: '12px', fontWeight: 800, color: '#ffffff', letterSpacing: '1px', lineHeight: 1.2 }}>
            {account ? account.name.toUpperCase() : 'TOUS LES COMPTES'}
          </div>
          {account && (
            <div style={{ fontSize: '9.5px', fontWeight: 700, color: '#818cf8', letterSpacing: '1px', marginTop: '3px', lineHeight: 1 }}>
              {account.type.toUpperCase()}
            </div>
          )}
        </div>
      </div>

      {/* Main Net P&L Display */}
      <div style={{ textAlign: 'center', marginBottom: '28px' }}>
        <div style={{ fontSize: '10px', fontWeight: 700, color: '#64748b', letterSpacing: '2.5px', textTransform: 'uppercase', marginBottom: '8px' }}>
          P&L NET
        </div>
        <div style={{
          fontSize: '56px',
          fontWeight: 900,
          color: profitColor,
          lineHeight: 1,
          letterSpacing: '-1px',
          filter: `drop-shadow(0 0 25px ${isPositive ? 'rgba(16, 185, 129, 0.45)' : 'rgba(239, 68, 68, 0.45)'})`,
        }}>
          {stats.totalPnl >= 0 ? '+' : ''}{stats.totalPnl.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}$
        </div>
        <div style={{ fontSize: '12.5px', color: '#94a3b8', marginTop: '8px', fontWeight: 500 }}>
          {stats.avgR >= 0 ? '+' : ''}{stats.avgR.toFixed(2)} R moyen · {stats.tradeCount} trade{stats.tradeCount > 1 ? 's' : ''}
        </div>
      </div>

      {/* Equity Curve Container */}
      {stats.equityCurve.length >= 2 && (
        <div style={{
          background: 'rgba(18, 19, 24, 0.6)', borderRadius: '16px',
          padding: '18px', marginBottom: '22px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.4)',
        }}>
          <div style={{ fontSize: '9.5px', fontWeight: 800, color: '#64748b', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '12px' }}>
            EQUITY CURVE
          </div>
          <EquityCurveSVG data={stats.equityCurve} positive={isPositive} trades={trades} />
        </div>
      )}

      {/* Stats Cards Grid (2 rows x 3 cols) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '20px' }}>
        {[
          {
            label: 'TAUX DE RÉUSSITE',
            value: `${stats.winRate.toFixed(1)}%`,
            color: '#10b981',
            bgColor: 'rgba(16, 185, 129, 0.06)',
            borderColor: 'rgba(16, 185, 129, 0.25)',
            icon: (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" /><polyline points="16 7 22 7 22 13" />
              </svg>
            )
          },
          {
            label: 'GAGNANTS',
            value: stats.wins.toString(),
            color: '#10b981',
            bgColor: 'rgba(16, 185, 129, 0.06)',
            borderColor: 'rgba(16, 185, 129, 0.25)',
            icon: (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" /><path d="M4 22h16" /><path d="M10 14.66V17c0 .55-.45 1-1 1H4v2h16v-2h-5c-.55 0-1-.45-1-1v-2.34" /><path d="M12 2a6 6 0 0 1 6 6v1H6V8a6 6 0 0 1 6-6z" />
              </svg>
            )
          },
          {
            label: 'PERDANTS',
            value: stats.losses.toString(),
            color: '#ef4444',
            bgColor: 'rgba(239, 68, 68, 0.06)',
            borderColor: 'rgba(239, 68, 68, 0.25)',
            icon: (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="22 17 13.5 8.5 8.5 13.5 2 7" /><polyline points="16 17 22 17 22 11" />
              </svg>
            )
          },
          {
            label: 'MEILLEUR TRADE',
            value: `+${stats.bestTrade.toFixed(2)}$`,
            color: '#10b981',
            bgColor: 'rgba(16, 185, 129, 0.06)',
            borderColor: 'rgba(16, 185, 129, 0.25)',
            icon: (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="7" y1="17" x2="17" y2="7" /><polyline points="7 7 17 7 17 17" />
              </svg>
            )
          },
          {
            label: 'PIRE TRADE',
            value: `${stats.worstTrade.toFixed(2)}$`,
            color: '#ef4444',
            bgColor: 'rgba(239, 68, 68, 0.06)',
            borderColor: 'rgba(239, 68, 68, 0.25)',
            icon: (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="7" y1="7" x2="17" y2="17" /><polyline points="17 7 17 17 7 17" />
              </svg>
            )
          },
          {
            label: 'ACTIFS',
            value: stats.pairs.length > 0 ? stats.pairs.slice(0, 2).join(', ') : '—',
            color: '#ffffff',
            bgColor: 'rgba(255, 255, 255, 0.03)',
            borderColor: 'rgba(255, 255, 255, 0.12)',
            icon: (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" />
              </svg>
            )
          },
        ].map(({ label, value, color, bgColor, borderColor, icon }) => (
          <div key={label} style={{
            background: bgColor,
            borderRadius: '14px',
            padding: '14px',
            border: `1px solid ${borderColor}`,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            position: 'relative',
            height: '72px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '8.5px', color: '#94a3b8', letterSpacing: '1px', fontWeight: 800, textTransform: 'uppercase' }}>
                {label}
              </div>
              <div style={{ opacity: 0.9 }}>
                {icon}
              </div>
            </div>
            <div style={{ fontSize: '16px', fontWeight: 800, color, fontFamily: 'monospace' }}>
              {value}
            </div>
          </div>
        ))}
      </div>

      {/* Trading Sessions Badges */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '24px' }}>
        {['NEW YORK', 'LONDON', 'ASIA', 'OVER SESSION'].map(s => {
          const isActive = stats.sessions.map(x => x.toUpperCase()).includes(s);
          return (
            <span key={s} style={{
              fontSize: '10px', fontWeight: 800, height: '26px', padding: '0 12px',
              borderRadius: '12px',
              border: isActive ? '1px solid rgba(99, 102, 241, 0.4)' : '1px solid rgba(255, 255, 255, 0.08)',
              background: isActive ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255, 255, 255, 0.03)',
              color: isActive ? '#818cf8' : '#64748b',
              letterSpacing: '1px',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              lineHeight: 1,
            }}>
              {s}
            </span>
          );
        })}
      </div>

      {/* Separator line and Sparkle */}
      <div style={{
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        position: 'relative',
        margin: '20px 0 16px 0',
      }}>
        {/* Star Sparkle icon on the separator line bottom right */}
        <svg width="26" height="26" viewBox="0 0 24 24" fill="#94a3b8" style={{
          position: 'absolute',
          right: '24px',
          top: '-13px',
          opacity: 0.6,
        }}>
          <path d="M12 0l3 9 9 3-9 3-3 9-3-9-9-3 9-3z" />
        </svg>
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: '9.5px', color: '#64748b', letterSpacing: '1px', fontWeight: 500 }}>
          Generated by Seven Journal
        </div>
        <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.2)', letterSpacing: '1px' }}>
          {new Date().toLocaleDateString('fr-FR')}
        </div>
      </div>
    </div>
  );
});
ShareCardVisual.displayName = 'ShareCardVisual';

// ─── Main ShareModal Component ────────────────────────────────────────────────────
interface ShareModalProps {
  onClose: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({ onClose }) => {
  const { trades } = useTrades();
  const { accounts } = useAccounts();
  const cardRef = useRef<HTMLDivElement>(null);

  const [period, setPeriod] = useState<Period>('monthly');
  const [selectedAccountId, setSelectedAccountId] = useState<string>('all');
  const [isCapturing, setIsCapturing] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const filteredTrades = selectedAccountId === 'all'
    ? trades
    : trades.filter(t => t.account_id === selectedAccountId);

  const selectedAccount = selectedAccountId === 'all'
    ? null
    : accounts.find(a => a.id === selectedAccountId) ?? null;

  const stats = computeStats(filteredTrades, period);

  const handleCapture = async () => {
    if (!cardRef.current) return;
    setIsCapturing(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: null,
        scale: 2,
        useCORS: true,
        logging: false,
        width: 600,
        height: cardRef.current.offsetHeight,
        windowWidth: 600,
        windowHeight: cardRef.current.offsetHeight,
        scrollX: 0,
        scrollY: 0,
        x: 0,
        y: 0,
      });
      const dataUrl = canvas.toDataURL('image/png');
      setPreview(dataUrl);
    } catch {
      alert("Erreur lors de la génération de l'image.");
    } finally {
      setIsCapturing(false);
    }
  };

  const handleDownload = () => {
    if (!preview) return;
    const link = document.createElement('a');
    link.href = preview;
    link.download = `seven-journal-${period}-${new Date().toISOString().split('T')[0]}.png`;
    link.click();
  };

  const PERIODS: { key: Period; label: string }[] = [
    { key: 'daily', label: 'Journalier' },
    { key: 'weekly', label: 'Hebdomadaire' },
    { key: 'monthly', label: 'Mensuel' },
    { key: 'yearly', label: 'Annuel' },
  ];

  return createPortal(
    <div className="fixed inset-0 bg-black/85 flex items-center justify-center z-[9999] p-4 overflow-y-auto backdrop-blur-sm animate-scale-up">
      <div className="bg-[#181920] border border-[#262833] rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden">

        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#262833]">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-[#6366f1]/15 border border-[#6366f1]/30 flex items-center justify-center shadow-indigo-glow">
              <Camera className="w-5 h-5 text-[#818cf8]" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">Partager le Journal</h2>
              <p className="text-xs text-slate-400 mt-0.5">Génère une image stylée de vos performances pour vos réseaux</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-[#20222c] text-slate-400 hover:text-white transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 items-start">

          {/* Left Controls */}
          <div className="space-y-5">
            {/* Period selector */}
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Période</label>
              <div className="grid grid-cols-2 gap-2">
                {PERIODS.map(p => (
                  <button
                    key={p.key}
                    onClick={() => { setPeriod(p.key); setPreview(null); }}
                    className={`px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      period === p.key
                        ? 'bg-[#6366f1] text-white shadow-indigo-glow'
                        : 'bg-[#121318] border border-[#262833] text-slate-400 hover:text-white hover:border-[#363948]'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Account selector */}
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Compte</label>
              <select
                value={selectedAccountId}
                onChange={e => { setSelectedAccountId(e.target.value); setPreview(null); }}
                className="w-full bg-[#121318] border border-[#262833] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#6366f1] transition-all cursor-pointer"
              >
                <option value="all">Tous les comptes</option>
                {accounts.map(acc => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} ({acc.type})
                  </option>
                ))}
              </select>
            </div>

            {/* Stats preview info */}
            <div className="bg-[#121318] border border-[#262833] rounded-xl p-4 space-y-2">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Aperçu des données</div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div><span className="text-slate-500">Période :</span> <span className="font-semibold text-white">{stats.periodLabel}</span></div>
                <div><span className="text-slate-500">Trades :</span> <span className="font-semibold text-white">{stats.tradeCount}</span></div>
                <div>
                  <span className="text-slate-500">P&L :</span>{' '}
                  <span className={`font-bold ${stats.totalPnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {stats.totalPnl >= 0 ? '+' : ''}${stats.totalPnl.toFixed(2)}
                  </span>
                </div>
                <div><span className="text-slate-500">Win Rate :</span> <span className="font-semibold text-white">{stats.winRate.toFixed(1)}%</span></div>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2 pt-1">
              <button
                onClick={handleCapture}
                disabled={isCapturing}
                className="w-full py-3 bg-[#6366f1] hover:bg-[#4f46e5] disabled:opacity-50 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center space-x-2 shadow-indigo-glow transition-all active:scale-[0.98]"
              >
                <Share2 className="w-4 h-4" />
                <span>{isCapturing ? 'Génération en cours...' : "Générer l'image"}</span>
              </button>

              {preview && (
                <button
                  onClick={handleDownload}
                  className="w-full py-3 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center space-x-2 transition-all active:scale-[0.98]"
                >
                  <Download className="w-4 h-4" />
                  <span>Télécharger en PNG</span>
                </button>
              )}
            </div>
          </div>

          {/* Card preview */}
          <div className="flex flex-col space-y-3">
            <p className="text-[10px] uppercase tracking-wider text-white/30">Aperçu de la carte</p>

            {/* Hidden card to capture */}
            <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
              <ShareCardVisual ref={cardRef} stats={stats} period={period} account={selectedAccount} trades={filteredTrades} />
            </div>

            {/* Preview image or placeholder */}
            {preview ? (
              <div className="rounded-xl overflow-hidden border border-white/10">
                <img src={preview} alt="Preview" className="w-full" />
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-white/10 flex flex-col items-center justify-center py-16 space-y-3 bg-white/[0.02]">
                <Camera className="w-8 h-8 text-white/10" />
                <p className="text-[11px] text-white/20 text-center">
                  Cliquez sur "Générer l'image"<br />pour voir l'aperçu
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

// ─── Share Button (reusable) ──────────────────────────────────────────────────────
export const ShareButton: React.FC = () => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center space-x-1.5 border border-white/15 bg-white/5 hover:bg-white/10 hover:border-[#0075ff]/40 text-white/60 hover:text-[#0075ff] text-[10px] font-bold px-3 py-1.5 rounded-xl transition-all uppercase tracking-wider"
      >
        <Share2 className="w-3.5 h-3.5" />
        <span>Partager</span>
      </button>
      {open && <ShareModal onClose={() => setOpen(false)} />}
    </>
  );
};
