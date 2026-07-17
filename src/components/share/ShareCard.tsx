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

// ─── Mini Equity Curve SVG ───────────────────────────────────────────────────────
const EquityCurveSVG: React.FC<{ data: number[]; positive: boolean }> = ({ data, positive }) => {
  if (data.length < 2) return null;
  const w = 280, h = 60;
  const min = Math.min(...data, 0);
  const max = Math.max(...data, 0.01);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * h;
    return `${x},${y}`;
  });
  const fillPts = `0,${h} ${pts.join(' ')} ${w},${h}`;
  const color = positive ? '#01b574' : '#e53e3e';
  const fillColor = positive ? 'rgba(1,181,116,0.12)' : 'rgba(229,62,62,0.12)';

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} fill="none">
      <polygon points={fillPts} fill={fillColor} />
      <polyline points={pts.join(' ')} stroke={color} strokeWidth="1.5" fill="none" strokeLinejoin="round" />
    </svg>
  );
};

// ─── Share Card (the visual to be captured) ──────────────────────────────────────
const ShareCardVisual = React.forwardRef<HTMLDivElement, {
  stats: PeriodStats;
  period: Period;
  account: TradingAccount | null;
}>(({ stats, period, account }, ref) => {
  const isPositive = stats.totalPnl >= 0;
  const profitColor = isPositive ? '#01b574' : '#e53e3e';
  const winColor = stats.winRate >= 50 ? '#01b574' : '#e53e3e';

  const periodEmoji: Record<Period, string> = {
    daily: '📅', weekly: '📆', monthly: '🗓️', yearly: '📊'
  };

  return (
    <div
      ref={ref}
      style={{
        width: '600px',
        background: 'linear-gradient(135deg, #020515 0%, #0a1035 50%, #020515 100%)',
        fontFamily: '"Inter", sans-serif',
        padding: '32px',
        position: 'relative',
        overflow: 'hidden',
        borderRadius: '20px',
      }}
    >
      {/* Background glow */}
      <div style={{
        position: 'absolute', top: '-80px', right: '-80px',
        width: '300px', height: '300px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(0,117,255,0.15) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: '-60px', left: '-60px',
        width: '200px', height: '200px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(1,181,116,0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ fontSize: '16px', fontWeight: 900, color: '#fff', letterSpacing: '3px' }}>SEVEN</span>
            <span style={{ fontSize: '16px', fontWeight: 900, color: '#0075ff', letterSpacing: '3px' }}>JOURNAL</span>
          </div>
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', letterSpacing: '2px', textTransform: 'uppercase' }}>
            {periodEmoji[period]} {stats.periodLabel}
          </div>
        </div>
        <div style={{
          background: 'rgba(0,117,255,0.1)', border: '1px solid rgba(0,117,255,0.3)',
          borderRadius: '10px', padding: '8px 14px',
          display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-end',
        }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#fff', letterSpacing: '1px', lineHeight: 1.2 }}>
            {account ? account.name.toUpperCase() : 'TOUS LES COMPTES'}
          </div>
          {account && (
            <div style={{ fontSize: '9px', fontWeight: 600, color: '#0075ff', letterSpacing: '1px', marginTop: '2px', lineHeight: 1 }}>
              {account.type.toUpperCase()}
            </div>
          )}
        </div>
      </div>

      {/* Main P&L */}
      <div style={{ textAlign: 'center', marginBottom: '28px' }}>
        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', letterSpacing: '2px', marginBottom: '6px' }}>
          P&L NET
        </div>
        <div style={{ fontSize: '52px', fontWeight: 900, color: profitColor, lineHeight: 1, letterSpacing: '-2px' }}>
          {stats.totalPnl >= 0 ? '+' : ''}{stats.totalPnl.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}$
        </div>
        <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.3)', marginTop: '4px' }}>
          {stats.avgR >= 0 ? '+' : ''}{stats.avgR.toFixed(2)} R moyen · {stats.tradeCount} trade{stats.tradeCount > 1 ? 's' : ''}
        </div>
      </div>

      {/* Equity Curve */}
      {stats.equityCurve.length >= 2 && (
        <div style={{
          background: 'rgba(255,255,255,0.03)', borderRadius: '12px',
          padding: '12px 16px', marginBottom: '20px',
          border: `1px solid ${isPositive ? 'rgba(1,181,116,0.2)' : 'rgba(229,62,62,0.2)'}`,
        }}>
          <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)', letterSpacing: '2px', marginBottom: '8px' }}>
            EQUITY CURVE
          </div>
          <EquityCurveSVG data={stats.equityCurve} positive={isPositive} />
        </div>
      )}

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '20px' }}>
        {[
          { label: 'WIN RATE', value: `${stats.winRate.toFixed(1)}%`, color: winColor },
          { label: 'WINS', value: stats.wins.toString(), color: '#01b574' },
          { label: 'LOSSES', value: stats.losses.toString(), color: '#e53e3e' },
          { label: 'BEST TRADE', value: `+${stats.bestTrade.toFixed(2)}$`, color: '#01b574' },
          { label: 'WORST TRADE', value: `${stats.worstTrade.toFixed(2)}$`, color: '#e53e3e' },
          { label: 'INSTRUMENTS', value: stats.pairs.length > 0 ? stats.pairs.slice(0, 2).join(', ') : '—', color: '#fff' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{
            background: 'rgba(255,255,255,0.03)', borderRadius: '10px',
            padding: '10px', border: '1px solid rgba(255,255,255,0.06)',
          }}>
            <div style={{ fontSize: '8px', color: 'rgba(255,255,255,0.3)', letterSpacing: '1.5px', marginBottom: '4px' }}>
              {label}
            </div>
            <div style={{ fontSize: '14px', fontWeight: 700, color }}>
              {value}
            </div>
          </div>
        ))}
      </div>

      {/* Sessions */}
      {stats.sessions.length > 0 && (
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '24px' }}>
          {stats.sessions.map(s => (
            <span key={s} style={{
              fontSize: '10px', fontWeight: 800, height: '22px', padding: '0 10px',
              borderRadius: '6px', border: '1px solid rgba(0,117,255,0.3)',
              background: 'rgba(0,117,255,0.08)', color: '#0075ff', letterSpacing: '1px',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              lineHeight: 1,
            }}>
              {s.toUpperCase()}
            </span>
          ))}
        </div>
      )}

      {/* Footer */}
      <div style={{
        borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '14px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.2)', letterSpacing: '1px' }}>
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
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[9999] p-4 overflow-y-auto">
      <div className="bg-[#0a1035] border border-white/10 rounded-[24px] w-full max-w-3xl shadow-2xl">

        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/5">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-[#0075ff]/10 border border-[#0075ff]/20 flex items-center justify-center">
              <Camera className="w-4 h-4 text-[#0075ff]" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-widest">Partager le Journal</h2>
              <p className="text-[10px] text-white/30">Génère une image stylée de vos performances</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/5 text-white/40 hover:text-white transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Controls */}
          <div className="space-y-5">
            {/* Period */}
            <div>
              <label className="text-[10px] uppercase tracking-wider text-white/40 block mb-2">Période</label>
              <div className="grid grid-cols-2 gap-2">
                {PERIODS.map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => { setPeriod(key); setPreview(null); }}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                      period === key
                        ? 'border-[#0075ff] bg-[#0075ff]/10 text-[#0075ff]'
                        : 'border-white/10 text-white/40 hover:border-white/30 hover:text-white'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Account */}
            <div>
              <label className="text-[10px] uppercase tracking-wider text-white/40 block mb-2">Compte</label>
              <select
                value={selectedAccountId}
                onChange={e => { setSelectedAccountId(e.target.value); setPreview(null); }}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#0075ff] transition-colors"
              >
                <option value="all">Tous les comptes</option>
                {accounts.map(a => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>

            {/* Stats preview */}
            <div className="bg-white/[0.03] border border-white/5 rounded-xl p-4 space-y-2">
              <p className="text-[10px] uppercase tracking-wider text-white/30 mb-3">Aperçu des données</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-white/40">Période :</span>{' '}
                  <span className="text-white font-mono">{stats.periodLabel}</span>
                </div>
                <div>
                  <span className="text-white/40">Trades :</span>{' '}
                  <span className="text-white font-bold">{stats.tradeCount}</span>
                </div>
                <div>
                  <span className="text-white/40">P&L :</span>{' '}
                  <span className={`font-bold ${stats.totalPnl >= 0 ? 'text-[#01b574]' : 'text-red-400'}`}>
                    {stats.totalPnl >= 0 ? '+' : ''}{stats.totalPnl.toFixed(2)}$
                  </span>
                </div>
                <div>
                  <span className="text-white/40">Win Rate :</span>{' '}
                  <span className="text-white font-bold">{stats.winRate.toFixed(1)}%</span>
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="space-y-2">
              <button
                onClick={handleCapture}
                disabled={isCapturing}
                className="w-full bg-[#0075ff] hover:bg-[#0060cc] text-white font-bold text-xs py-3 rounded-xl transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {isCapturing ? (
                  <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /><span>Génération...</span></>
                ) : (
                  <><Share2 className="w-4 h-4" /><span>GÉNÉRER L'IMAGE</span></>
                )}
              </button>
              {preview && (
                <button
                  onClick={handleDownload}
                  className="w-full border border-[#01b574]/40 bg-[#01b574]/10 text-[#01b574] font-bold text-xs py-3 rounded-xl transition-all flex items-center justify-center space-x-2 hover:bg-[#01b574]/20"
                >
                  <Download className="w-4 h-4" />
                  <span>TÉLÉCHARGER EN PNG</span>
                </button>
              )}
            </div>
          </div>

          {/* Card preview */}
          <div className="flex flex-col space-y-3">
            <p className="text-[10px] uppercase tracking-wider text-white/30">Aperçu de la carte</p>

            {/* Hidden card to capture */}
            <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
              <ShareCardVisual ref={cardRef} stats={stats} period={period} account={selectedAccount} />
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
