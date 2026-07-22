import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useTrades } from './useTrades';
import type { Trade } from './useTrades';
import { useAccounts } from '../accounts/useAccounts';
import { useDailyLock } from '../guard/useDailyLock';

import { Button } from '../../components/ui/Button';
import { Input, Select, Textarea } from '../../components/ui/Input';
import { Table, TableRow, TableCell } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { 
  Plus, 
  AlertTriangle, 
  ShieldAlert, 
  Trash2, 
  Edit3, 
  Eye, 
  Download, 
  Upload,
  X,
  ExternalLink,
  Calculator
} from 'lucide-react';
import { PositionCalculator } from './PositionCalculator';
import { ShareButton } from '../../components/share/ShareCard';

export const Trades: React.FC = () => {
  const { trades, createTrade, updateTrade, deleteTrade, isLoading, error: createError } = useTrades();
  const { accounts } = useAccounts();
  const { isLocked } = useDailyLock();
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter states
  const [filterPair, setFilterPair] = useState('');
  const [filterDirection, setFilterDirection] = useState<'' | 'BUY' | 'SELL'>('');
  const [filterResult, setFilterResult] = useState<'' | 'TP' | 'SL' | 'BE' | 'OPEN'>('');
  const [filterMental, setFilterMental] = useState('');
  const [filterSearch, setFilterSearch] = useState('');

  // UI Control states
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingTrade, setEditingTrade] = useState<Trade | null>(null);
  const [viewingTrade, setViewingTrade] = useState<Trade | null>(null);
  const [showCalculator, setShowCalculator] = useState(false);

  // Form State
  const [accountId, setAccountId] = useState('');
  const [pair, setPair] = useState('XAUUSD');
  const [entryDate, setEntryDate] = useState(() => new Date().toISOString().slice(0, 16));
  const [direction, setDirection] = useState<'BUY' | 'SELL'>('BUY');
  const [entryPrice, setEntryPrice] = useState('');
  const [exitPrice, setExitPrice] = useState('');
  const [stopLoss, setStopLoss] = useState('');
  const [takeProfit, setTakeProfit] = useState('');
  const [size, setSize] = useState('');
  const [timeframe, setTimeframe] = useState<'M1' | 'M5' | 'M15' | 'H1' | 'H4' | 'D1'>('M5');
  const [session, setSession] = useState<'Asia' | 'London' | 'New York' | 'Over Session' | ''>('');
  const [result, setResult] = useState<'TP' | 'SL' | 'BE' | 'OPEN'>('OPEN');
  
  // Custom manual overwrite inputs
  const [manualPnl, setManualPnl] = useState('');
  const [manualRMultiple, setManualRMultiple] = useState('');
  
  // Screenshots TradingView / Local Upload
  const [screenshotBefore, setScreenshotBefore] = useState('');
  const [screenshotAfter, setScreenshotAfter] = useState('');
  const [screenshotBeforeType, setScreenshotBeforeType] = useState<'url' | 'file'>('url');
  const [screenshotAfterType, setScreenshotAfterType] = useState<'url' | 'file'>('url');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, target: 'before' | 'after') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (target === 'before') {
          setScreenshotBefore(reader.result as string);
        } else {
          setScreenshotAfter(reader.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Risk parameters for auto calculation
  const [riskType, setRiskType] = useState<'percent' | 'usd'>('percent');
  const [riskValue, setRiskValue] = useState('');

  // SMC confirmations (BOS, OB, FVG, Liquidity Sweep)
  const [bos, setBos] = useState(false);
  const [fvg, setFvg] = useState(false);
  const [ob, setOb] = useState(false);
  const [liquiditySweep, setLiquiditySweep] = useState(false);

  // Goggins / Mental
  const [mentalState, setMentalState] = useState<'focused' | 'anxious' | 'greedy' | 'revenge' | 'fomo' | 'tired'>('focused');
  const [cookieJar, setCookieJar] = useState(false);
  const [rule40, setRule40] = useState(false);

  // Notes
  const [notes, setNotes] = useState('');

  const [validationError, setValidationError] = useState('');

  // Auto fill account if there's only one or pre-selected
  React.useEffect(() => {
    if (accounts.length > 0 && !accountId) {
      setAccountId(accounts[0].id);
    }
  }, [accounts, accountId]);

  // Live Auto-Calculation Effect
  React.useEffect(() => {
    const entry = Number(entryPrice);
    const sl = Number(stopLoss);
    const tp = Number(takeProfit);
    const exit = exitPrice ? Number(exitPrice) : null;
    const rVal = Number(riskValue);

    if (!isNaN(entry) && !isNaN(sl) && entry > 0 && sl > 0 && entry !== sl) {
      const selectedAccount = accounts.find(acc => acc.id === accountId);
      const balance = selectedAccount ? selectedAccount.balance : 100000; // fallback standard balance

      // 1. Calculate risk in USD
      let calculatedRiskUsd = 0;
      if (!isNaN(rVal) && rVal > 0) {
        if (riskType === 'percent') {
          calculatedRiskUsd = balance * (rVal / 100);
        } else {
          calculatedRiskUsd = rVal;
        }
      }

      // 2. Auto calculate Lot Size based on risk and SL distance (Assuming standard Gold/FX contract size as approximation)
      // distance in pips/ticks
      const slDistance = Math.abs(entry - sl);
      
      // 3. Auto calculate R-Multiple
      let calculatedR = 0;
      if (result === 'TP') {
        calculatedR = Math.abs(tp - entry) / slDistance;
      } else if (result === 'SL') {
        calculatedR = -1;
      } else if (result === 'BE') {
        calculatedR = 0;
      } else if (exit !== null && exit > 0) {
        calculatedR = (exit - entry) / (direction === 'BUY' ? slDistance : -slDistance);
      }
      
      if (calculatedR !== 0 && !isNaN(calculatedR)) {
        setManualRMultiple(calculatedR.toFixed(2));
        
        // 4. Auto calculate P&L ($) based on R-multiple and Risk Usd
        if (calculatedRiskUsd > 0) {
          const calculatedPnl = calculatedRiskUsd * calculatedR;
          setManualPnl(calculatedPnl.toFixed(2));
        }
      }
    }
  }, [entryPrice, stopLoss, takeProfit, exitPrice, riskType, riskValue, result, accountId, accounts, direction]);

  // Load editing trade info
  const handleEditClick = (trade: Trade) => {
    setEditingTrade(trade);
    setAccountId(trade.account_id);
    setPair(trade.pair);
    if (trade.entry_time) {
      const dt = new Date(trade.entry_time);
      if (!isNaN(dt.getTime())) {
        setEntryDate(dt.toISOString().slice(0, 16));
      }
    }
    setDirection(trade.direction);
    setEntryPrice(trade.entry_price.toString());
    setExitPrice(trade.exit_price ? trade.exit_price.toString() : '');
    setStopLoss(trade.stop_loss.toString());
    setTakeProfit(trade.take_profit.toString());
    setSize(trade.size.toString());
    setTimeframe(trade.timeframe);
    setSession(trade.session || '');
    setResult(trade.result);
    setManualPnl(trade.pnl !== null ? trade.pnl.toString() : '');
    setManualRMultiple(trade.r_multiple !== null ? trade.r_multiple.toString() : '');
    setScreenshotBefore(trade.screenshot_before_url || '');
    setScreenshotAfter(trade.screenshot_after_url || '');
    setScreenshotBeforeType(trade.screenshot_before_url?.startsWith('data:') ? 'file' : 'url');
    setScreenshotAfterType(trade.screenshot_after_url?.startsWith('data:') ? 'file' : 'url');
    setBos(trade.setup_structures.includes('BOS'));
    setOb(trade.setup_ob);
    setFvg(trade.setup_fvg);
    setLiquiditySweep(trade.setup_liquidity_sweep);
    setMentalState(trade.mental_state);
    setCookieJar(trade.cookie_jar_ref);
    setRule40(trade.rule_40_percent);
    setNotes(trade.notes || '');
    setShowAddForm(true);
  };

  const handleCancelEdit = () => {
    setEditingTrade(null);
    setShowAddForm(false);
    clearForm();
  };

  const clearForm = () => {
    setEntryDate(new Date().toISOString().slice(0, 16));
    setEntryPrice('');
    setExitPrice('');
    setStopLoss('');
    setTakeProfit('');
    setSize('');
    setManualPnl('');
    setManualRMultiple('');
    setScreenshotBefore('');
    setScreenshotAfter('');
    setScreenshotBeforeType('url');
    setScreenshotAfterType('url');
    setNotes('');
    setBos(false);
    setFvg(false);
    setOb(false);
    setLiquiditySweep(false);
    setCookieJar(false);
    setRule40(false);
    setResult('OPEN');
    setSession('');
    setRiskValue('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    if (isLocked && !editingTrade) {
      setValidationError('Compte verrouillé ! Respectez la discipline.');
      return;
    }

    if (!accountId || !pair || !entryPrice || !stopLoss || !takeProfit || !size) {
      setValidationError('Veuillez remplir tous les champs requis (*).');
      return;
    }

    const entry = Number(entryPrice);
    const sl = Number(stopLoss);
    const tp = Number(takeProfit);
    const lotSize = Number(size);
    const exit = exitPrice ? Number(exitPrice) : null;
    const finalPnl = manualPnl ? Number(manualPnl) : null;
    const finalRMultiple = manualRMultiple ? Number(manualRMultiple) : null;

    if (isNaN(entry) || isNaN(sl) || isNaN(tp) || isNaN(lotSize)) {
      setValidationError('Les prix et tailles de lots doivent être des nombres.');
      return;
    }

    // Set structures array
    const setup_structures: string[] = [];
    if (bos) setup_structures.push('BOS');

    const formattedEntryTime = entryDate ? new Date(entryDate).toISOString() : new Date().toISOString();

    const tradeData: any = {
      account_id: accountId,
      pair,
      direction,
      entry_price: entry,
      exit_price: exit,
      stop_loss: sl,
      take_profit: tp,
      size: lotSize,
      entry_time: formattedEntryTime,
      exit_time: exit ? (editingTrade?.exit_time || new Date().toISOString()) : null,
      pnl: finalPnl,
      r_multiple: finalRMultiple,
      timeframe,
      setup_structures,
      setup_fvg: fvg,
      setup_ob: ob,
      setup_liquidity_sweep: liquiditySweep,
      bookmap_absorption: null,
      bookmap_passive_orders: null,
      bookmap_aggressive_orders: null,
      bookmap_vwap_position: null,
      mental_state: mentalState,
      cookie_jar_ref: cookieJar,
      rule_40_percent: rule40,
      screenshot_before_url: screenshotBefore || null,
      screenshot_after_url: screenshotAfter || null,
      notes: notes || null,
      result,
      session: session ? (session as 'Asia' | 'London' | 'New York' | 'Over Session') : null,
    };

    try {
      if (editingTrade) {
        await updateTrade({ ...tradeData, id: editingTrade.id });
        setEditingTrade(null);
      } else {
        await createTrade(tradeData);
      }
      clearForm();
      setShowAddForm(false);
    } catch (err: any) {
      setValidationError(err.message || 'Erreur lors de la journalisation.');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Voulez-vous vraiment supprimer ce trade de votre journal ?')) {
      try {
        await deleteTrade(id);
      } catch (err) {
        alert('Erreur lors de la suppression.');
      }
    }
  };

  // EXPORT TO JSON
  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(trades, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `seven_journal_export_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // EXPORT TO CSV
  const handleExportCSV = () => {
    const headers = ['Date', 'Instrument', 'Direction', 'Lots', 'Timeframe', 'Entry', 'SL', 'TP', 'Exit', 'Result', 'PnL', 'R-Multiple', 'Mental State', 'Notes'];
    const rows = trades.map(t => [
      new Date(t.entry_time).toLocaleDateString('fr-FR'),
      t.pair,
      t.direction,
      t.size,
      t.timeframe,
      t.entry_price,
      t.stop_loss,
      t.take_profit,
      t.exit_price ?? '',
      t.result,
      t.pnl ?? '',
      t.r_multiple ?? '',
      t.mental_state,
      `"${(t.notes || '').replace(/"/g, '""')}"`
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `seven_journal_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // IMPORT FROM JSON
  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], "UTF-8");
      fileReader.onload = async (event) => {
        try {
          const parsedTrades = JSON.parse(event.target?.result as string);
          if (Array.isArray(parsedTrades)) {
            for (const t of parsedTrades) {
              // Create trade from parsed schema
              await createTrade({
                account_id: accountId || accounts[0].id,
                pair: t.pair || 'XAUUSD',
                direction: t.direction || 'BUY',
                entry_price: Number(t.entry_price),
                exit_price: t.exit_price ? Number(t.exit_price) : null,
                stop_loss: Number(t.stop_loss),
                take_profit: Number(t.take_profit),
                size: Number(t.size),
                entry_time: t.entry_time || new Date().toISOString(),
                exit_time: t.exit_time || null,
                pnl: t.pnl ? Number(t.pnl) : null,
                r_multiple: t.r_multiple ? Number(t.r_multiple) : null,
                timeframe: t.timeframe || 'M5',
                setup_structures: t.setup_structures || [],
                setup_fvg: !!t.setup_fvg,
                setup_ob: !!t.setup_ob,
                setup_liquidity_sweep: !!t.setup_liquidity_sweep,
                bookmap_absorption: t.bookmap_absorption || null,
                bookmap_passive_orders: t.bookmap_passive_orders || null,
                bookmap_aggressive_orders: t.bookmap_aggressive_orders || null,
                bookmap_vwap_position: t.bookmap_vwap_position || null,
                mental_state: t.mental_state || 'focused',
                cookie_jar_ref: !!t.cookie_jar_ref,
                rule_40_percent: !!t.rule_40_percent,
                screenshot_before_url: t.screenshot_before_url || null,
                screenshot_after_url: t.screenshot_after_url || null,
                notes: t.notes || null,
                result: t.result || 'OPEN',
                session: t.session || null,
              });
            }
            alert('Importation réussie de vos trades.');
          }
        } catch (err) {
          alert('Format JSON non valide.');
        }
      };
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-bloomberg-text-secondary font-mono text-xs">
        CHARGEMENT DU JOURNAL DE TRADES...
      </div>
    );
  }

  // Filtered trades (derived)
  const filteredTrades = trades.filter(t => {
    if (filterPair && !t.pair.toUpperCase().includes(filterPair.toUpperCase())) return false;
    if (filterDirection && t.direction !== filterDirection) return false;
    if (filterResult && t.result !== filterResult) return false;
    if (filterMental && t.mental_state !== filterMental) return false;
    if (filterSearch) {
      const q = filterSearch.toLowerCase();
      if (!t.pair.toLowerCase().includes(q) && !(t.notes || '').toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const hasActiveFilters = !!(filterPair || filterDirection || filterResult || filterMental || filterSearch);

  return (
    <div className="space-y-6">
      
      {/* HEADER ACTIONS */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-extrabold uppercase tracking-widest text-white">
            JOURNAL DE BORD GÉNÉRAL
          </h2>
          <p className="text-[10px] text-bloomberg-text-secondary">
            {filteredTrades.length} trade{filteredTrades.length !== 1 ? 's' : ''} affichés{hasActiveFilters ? ' (filtrés)' : ''} · {trades.length} total
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* IMPORT BUTTON */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImportJSON}
            accept=".json"
            className="hidden"
          />
          <Button 
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center space-x-1"
          >
            <Upload className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">IMPORT</span>
          </Button>

          <Button 
            variant="outline"
            size="sm"
            onClick={handleExportJSON}
            className="flex items-center space-x-1"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">JSON</span>
          </Button>

          <Button 
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            className="flex items-center space-x-1"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">CSV</span>
          </Button>

          <ShareButton />

          {!isLocked ? (
            <Button 
              variant="outline" 
              onClick={() => {
                if (showAddForm) handleCancelEdit();
                else setShowAddForm(true);
              }}
              className="flex items-center space-x-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{showAddForm ? 'ANNULER' : 'AJOUTER UN TRADE'}</span>
            </Button>
          ) : (
            <div className="flex items-center space-x-2 text-bloomberg-red border border-bloomberg-red px-3 py-1.5 text-xs font-bold uppercase bg-bloomberg-red/10">
              <ShieldAlert className="w-4 h-4" />
              <span>Session Daily Bloquée</span>
            </div>
          )}
        </div>
      </div>

      {/* FILTRES MULTI-CRITÈRES */}
      <div className="bg-[#0a0a0d] border border-[#1a1a1f] p-3">
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-[9px] text-[#52525b] uppercase tracking-widest font-bold shrink-0">Filtres :</span>
          
          <input
            type="text"
            placeholder="Rechercher (paire, notes...)"
            value={filterSearch}
            onChange={e => setFilterSearch(e.target.value)}
            className="bg-[#050506] border border-[#1a1a1f] text-xs font-mono text-white px-2.5 py-1 focus:outline-none focus:border-amber-500 w-40 placeholder-[#3f3f46] transition-colors"
          />

          <input
            type="text"
            placeholder="Instrument (XAUUSD...)"
            value={filterPair}
            onChange={e => setFilterPair(e.target.value)}
            className="bg-[#050506] border border-[#1a1a1f] text-xs font-mono text-white px-2.5 py-1 focus:outline-none focus:border-amber-500 w-32 placeholder-[#3f3f46] transition-colors"
          />

          {(['', 'BUY', 'SELL'] as const).map(d => (
            <button
              key={d}
              onClick={() => setFilterDirection(d)}
              className={`text-[10px] font-bold px-2.5 py-1 border uppercase tracking-wider transition-all ${
                filterDirection === d
                  ? d === 'BUY' ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                    : d === 'SELL' ? 'bg-red-500/20 border-red-500 text-red-400'
                    : 'bg-amber-500/20 border-amber-500 text-amber-400'
                  : 'bg-transparent border-[#1a1a1f] text-[#52525b] hover:border-[#2a2a32] hover:text-white'
              }`}
            >
              {d || 'ALL'}
            </button>
          ))}

          {(['', 'TP', 'SL', 'BE', 'OPEN'] as const).map(r => (
            <button
              key={r}
              onClick={() => setFilterResult(r)}
              className={`text-[10px] font-bold px-2.5 py-1 border uppercase tracking-wider transition-all ${
                filterResult === r
                  ? r === 'TP' ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                    : r === 'SL' ? 'bg-red-500/20 border-red-500 text-red-400'
                    : r === 'BE' ? 'bg-[#2a2a32] border-[#3a3a42] text-white'
                    : 'bg-amber-500/20 border-amber-500 text-amber-400'
                  : 'bg-transparent border-[#1a1a1f] text-[#52525b] hover:border-[#2a2a32] hover:text-white'
              }`}
            >
              {r || 'TOUS'}
            </button>
          ))}

          <select
            value={filterMental}
            onChange={e => setFilterMental(e.target.value)}
            className="bg-[#050506] border border-[#1a1a1f] text-[10px] font-mono text-white px-2 py-1 focus:outline-none focus:border-amber-500 transition-colors"
          >
            <option value="">Psychologie (tous)</option>
            <option value="focused">FOCUSED</option>
            <option value="anxious">ANXIOUS</option>
            <option value="greedy">GREEDY</option>
            <option value="revenge">REVENGE</option>
            <option value="fomo">FOMO</option>
            <option value="tired">TIRED</option>
          </select>

          {hasActiveFilters && (
            <button
              onClick={() => { setFilterPair(''); setFilterDirection(''); setFilterResult(''); setFilterMental(''); setFilterSearch(''); }}
              className="text-[10px] text-red-400 hover:text-red-300 border border-red-500/30 hover:border-red-400 px-2 py-1 transition-all flex items-center gap-1"
            >
              <X className="w-3 h-3" /> RESET
            </button>
          )}
        </div>
      </div>

      {/* POSITION SIZE CALCULATOR TOGGLE */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowCalculator(v => !v)}
          className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 border transition-all ${
            showCalculator
              ? 'bg-amber-500/20 border-amber-500 text-amber-400'
              : 'bg-transparent border-[#1a1a1f] text-[#52525b] hover:border-[#2a2a32] hover:text-amber-400'
          }`}
        >
          <Calculator className="w-3 h-3" />
          {showCalculator ? 'Masquer le calculateur' : 'Calculateur de Lot'}
        </button>
      </div>

      {showCalculator && <PositionCalculator />}

      {/* NOUVEAU FORMULAIRE EN MODAL STYLE TRADEZELLA / SEVEN TRACKING */}
      {showAddForm && createPortal(
        <div className="fixed inset-0 bg-black/85 flex items-center justify-center p-4 z-[9999] overflow-y-auto backdrop-blur-sm animate-scale-up">
          <div className="bg-[#181920] border border-[#262833] w-full max-w-4xl p-6 relative rounded-2xl my-8 max-h-[90vh] overflow-y-auto shadow-2xl">
            <button 
              type="button"
              onClick={handleCancelEdit} 
              className="absolute top-5 right-5 text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-[#20222c] z-10"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 border-b border-[#262833] pb-4 mb-6">
              <div className="w-2.5 h-6 bg-gradient-to-b from-[#6366f1] to-[#10b981] rounded-full" />
              <div>
                <h3 className="text-sm font-extrabold uppercase text-white tracking-wider">
                  {editingTrade ? "ÉDITION DU TRADE" : "ENREGISTRER UN NOUVEAU TRADE"}
                </h3>
                <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                  Renseignez les métriques et configurations pour votre journal Seven Tracking
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {(validationError || createError) && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-xl flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{validationError || (createError as Error).message}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* SECTION 1: PARAMÈTRES PRINCIPAUX */}
                <div className="space-y-4 bg-[#121318] p-4 rounded-xl border border-[#262833]">
                  <h4 className="text-xs font-bold text-[#818cf8] uppercase tracking-wider flex items-center gap-2 border-b border-[#262833] pb-2">
                    <span className="w-2 h-2 rounded-full bg-[#6366f1]" />
                    1. Paramètres Principaux & Date
                  </h4>

                  <div className="grid grid-cols-2 gap-3">
                    <Select
                      label="Compte *"
                      value={accountId}
                      onChange={(e) => setAccountId(e.target.value)}
                      options={accounts.map(acc => ({ value: acc.id, label: acc.name.toUpperCase() }))}
                    />
                    <Input 
                      label="Instrument *" 
                      placeholder="ex: XAUUSD" 
                      value={pair} 
                      onChange={(e) => setPair(e.target.value.toUpperCase())} 
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-400 block">Date & Heure d'entrée *</label>
                      <input
                        type="datetime-local"
                        value={entryDate}
                        onChange={(e) => setEntryDate(e.target.value)}
                        className="w-full bg-[#181920] border border-[#262833] rounded-xl px-3 py-2 text-xs font-medium text-white focus:outline-none focus:border-[#6366f1] transition-colors"
                      />
                    </div>
                    <Select
                      label="Direction *"
                      value={direction}
                      onChange={(e) => setDirection(e.target.value as any)}
                      options={[
                        { value: 'BUY', label: 'BUY / LONG' },
                        { value: 'SELL', label: 'SELL / SHORT' },
                      ]}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Select
                      label="Timeframe *"
                      value={timeframe}
                      onChange={(e) => setTimeframe(e.target.value as 'M1' | 'M5' | 'M15' | 'H1' | 'H4' | 'D1')}
                      options={[
                        { value: 'M1', label: 'M1' },
                        { value: 'M5', label: 'M5' },
                        { value: 'M15', label: 'M15' },
                        { value: 'H1', label: 'H1' },
                        { value: 'H4', label: 'H4' },
                        { value: 'D1', label: 'D1' },
                      ]}
                    />
                    <Select
                      label="Session *"
                      value={session}
                      onChange={(e) => setSession(e.target.value as any)}
                      options={[
                        { value: '', label: '[ CHOISIR LA SESSION ]' },
                        { value: 'Asia', label: 'ASIA SESSION' },
                        { value: 'London', label: 'LONDON SESSION' },
                        { value: 'New York', label: 'NEW YORK SESSION' },
                        { value: 'Over Session', label: 'OVER SESSION' },
                      ]}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Input 
                      label="Volume (Lots) *" 
                      placeholder="1.0" 
                      value={size} 
                      onChange={(e) => setSize(e.target.value)} 
                      type="number" 
                      step="0.01" 
                    />
                    <Input 
                      label="Prix d'entrée *" 
                      placeholder="2350.50" 
                      value={entryPrice} 
                      onChange={(e) => setEntryPrice(e.target.value)} 
                      type="number" 
                      step="0.00001" 
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Input 
                      label="Stop Loss *" 
                      placeholder="2345.00" 
                      value={stopLoss} 
                      onChange={(e) => setStopLoss(e.target.value)} 
                      type="number" 
                      step="0.00001" 
                    />
                    <Input 
                      label="Take Profit *" 
                      placeholder="2365.00" 
                      value={takeProfit} 
                      onChange={(e) => setTakeProfit(e.target.value)} 
                      type="number" 
                      step="0.00001" 
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3 border-t border-[#262833] pt-3">
                    <Select
                      label="Résultat *"
                      value={result}
                      onChange={(e) => setResult(e.target.value as any)}
                      options={[
                        { value: 'OPEN', label: 'EN COURS (OPEN)' },
                        { value: 'TP', label: 'TAKE PROFIT (TP)' },
                        { value: 'SL', label: 'STOP LOSS (SL)' },
                        { value: 'BE', label: 'BREAK-EVEN (BE)' },
                      ]}
                    />
                    <Input 
                      label="Prix de Sortie" 
                      placeholder="2360.00" 
                      value={exitPrice} 
                      onChange={(e) => setExitPrice(e.target.value)} 
                      type="number" 
                      step="0.00001" 
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Select
                      label="Risque *"
                      value={riskType}
                      onChange={(e) => setRiskType(e.target.value as any)}
                      options={[
                        { value: 'percent', label: 'RISQUE %' },
                        { value: 'usd', label: 'RISQUE $' },
                      ]}
                    />
                    <Input 
                      label="Valeur du Risque *" 
                      placeholder="ex: 1" 
                      value={riskValue} 
                      onChange={(e) => setRiskValue(e.target.value)} 
                      type="number" 
                      step="0.01" 
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Input 
                      label="Gain en R (Auto/Manuel)" 
                      placeholder="ex: 2.50" 
                      value={manualRMultiple} 
                      onChange={(e) => setManualRMultiple(e.target.value)} 
                      type="number" 
                      step="0.01" 
                    />
                    <Input 
                      label="P&L Réalisé $ (Auto/Manuel)" 
                      placeholder="ex: 250.00" 
                      value={manualPnl} 
                      onChange={(e) => setManualPnl(e.target.value)} 
                      type="number" 
                      step="0.01" 
                    />
                  </div>
                </div>

                {/* SECTION 2: CONTEXTE & CONFIRMATIONS */}
                <div className="space-y-4 bg-[#121318] p-4 rounded-xl border border-[#262833]">
                  <h4 className="text-xs font-bold text-[#818cf8] uppercase tracking-wider flex items-center gap-2 border-b border-[#262833] pb-2">
                    <span className="w-2 h-2 rounded-full bg-[#10b981]" />
                    2. Contexte & Confirmations SMC / ICT
                  </h4>

                  <div className="space-y-2">
                    <label className="text-[11px] font-semibold text-slate-400 block">Structures de Prix & Confirmations</label>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <label className="flex items-center space-x-2 text-slate-200 cursor-pointer bg-[#181920] border border-[#262833] p-2 rounded-xl hover:border-[#363948] transition-all">
                        <input type="checkbox" checked={bos} onChange={(e) => setBos(e.target.checked)} className="rounded border-[#262833] bg-[#121318] text-[#6366f1] focus:ring-0" />
                        <span className="font-medium">BOS (Break of Structure)</span>
                      </label>
                      <label className="flex items-center space-x-2 text-slate-200 cursor-pointer bg-[#181920] border border-[#262833] p-2 rounded-xl hover:border-[#363948] transition-all">
                        <input type="checkbox" checked={ob} onChange={(e) => setOb(e.target.checked)} className="rounded border-[#262833] bg-[#121318] text-[#6366f1] focus:ring-0" />
                        <span className="font-medium">Order Block</span>
                      </label>
                      <label className="flex items-center space-x-2 text-slate-200 cursor-pointer bg-[#181920] border border-[#262833] p-2 rounded-xl hover:border-[#363948] transition-all">
                        <input type="checkbox" checked={fvg} onChange={(e) => setFvg(e.target.checked)} className="rounded border-[#262833] bg-[#121318] text-[#6366f1] focus:ring-0" />
                        <span className="font-medium">Fair Value Gap (FVG)</span>
                      </label>
                      <label className="flex items-center space-x-2 text-slate-200 cursor-pointer bg-[#181920] border border-[#262833] p-2 rounded-xl hover:border-[#363948] transition-all">
                        <input type="checkbox" checked={liquiditySweep} onChange={(e) => setLiquiditySweep(e.target.checked)} className="rounded border-[#262833] bg-[#121318] text-[#6366f1] focus:ring-0" />
                        <span className="font-medium">Liquidity Sweep</span>
                      </label>
                    </div>
                  </div>

                  <div className="space-y-3 border-t border-[#262833] pt-3">
                    <div className="grid grid-cols-2 gap-3">
                      <Select
                        label="Psychologie"
                        value={mentalState}
                        onChange={(e) => setMentalState(e.target.value as any)}
                        options={[
                          { value: 'focused', label: 'FOCUSED - Calme' },
                          { value: 'anxious', label: 'ANXIOUS - Stressé' },
                          { value: 'greedy', label: 'GREEDY - Cupide' },
                          { value: 'revenge', label: 'REVENGE - Vengeance' },
                          { value: 'fomo', label: 'FOMO - Peur de louper' },
                          { value: 'tired', label: 'TIRED - Fatigué' },
                        ]}
                      />
                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-slate-400 block">Frameworks Mentaux</label>
                        <div className="flex flex-col gap-2 pt-1">
                          <label className="flex items-center space-x-2 text-xs text-slate-200 cursor-pointer">
                            <input type="checkbox" checked={cookieJar} onChange={(e) => setCookieJar(e.target.checked)} className="rounded border-[#262833] bg-[#181920] text-[#6366f1] focus:ring-0" />
                            <span>Cookie Jar</span>
                          </label>
                          <label className="flex items-center space-x-2 text-xs text-slate-200 cursor-pointer">
                            <input type="checkbox" checked={rule40} onChange={(e) => setRule40(e.target.checked)} className="rounded border-[#262833] bg-[#181920] text-[#6366f1] focus:ring-0" />
                            <span>40% Rule</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 pt-3 border-t border-[#262833]">
                    <h4 className="text-xs font-bold text-[#818cf8] uppercase tracking-wider flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#818cf8]" />
                      3. Screenshots Graphiques TradingView
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {/* SCREENSHOT BEFORE */}
                      <div className="space-y-2 p-3 bg-[#181920] border border-[#262833] rounded-xl">
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-semibold text-slate-300">Screenshot Avant</label>
                          <div className="flex gap-1">
                            {(['url', 'file'] as const).map((type) => (
                              <button
                                key={type}
                                type="button"
                                onClick={() => {
                                  setScreenshotBeforeType(type);
                                  setScreenshotBefore('');
                                }}
                                className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-lg border transition-all ${
                                  screenshotBeforeType === type
                                    ? 'bg-[#6366f1]/20 border-[#6366f1] text-[#818cf8]'
                                    : 'bg-transparent border-[#262833] text-slate-400 hover:text-slate-200'
                                }`}
                              >
                                {type === 'url' ? 'Lien URL' : 'Fichier'}
                              </button>
                            ))}
                          </div>
                        </div>

                        {screenshotBeforeType === 'url' ? (
                          <Input 
                            placeholder="https://tradingview.com/x/..." 
                            value={screenshotBefore} 
                            onChange={(e) => setScreenshotBefore(e.target.value)} 
                          />
                        ) : (
                          <div className="space-y-2">
                            <input 
                              type="file" 
                              accept="image/*"
                              onChange={(e) => handleFileChange(e, 'before')} 
                              className="text-xs text-slate-400 bg-[#121318] border border-[#262833] rounded-xl p-2 w-full focus:outline-none"
                            />
                            {screenshotBefore && (
                              <div className="text-[10px] text-emerald-400 font-bold">
                                ✓ Image chargée avec succès !
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* SCREENSHOT AFTER */}
                      <div className="space-y-2 p-3 bg-[#181920] border border-[#262833] rounded-xl">
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-semibold text-slate-300">Screenshot Après</label>
                          <div className="flex gap-1">
                            {(['url', 'file'] as const).map((type) => (
                              <button
                                key={type}
                                type="button"
                                onClick={() => {
                                  setScreenshotAfterType(type);
                                  setScreenshotAfter('');
                                }}
                                className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-lg border transition-all ${
                                  screenshotAfterType === type
                                    ? 'bg-[#6366f1]/20 border-[#6366f1] text-[#818cf8]'
                                    : 'bg-transparent border-[#262833] text-slate-400 hover:text-slate-200'
                                }`}
                              >
                                {type === 'url' ? 'Lien URL' : 'Fichier'}
                              </button>
                            ))}
                          </div>
                        </div>

                        {screenshotAfterType === 'url' ? (
                          <Input 
                            placeholder="https://tradingview.com/x/..." 
                            value={screenshotAfter} 
                            onChange={(e) => setScreenshotAfter(e.target.value)} 
                          />
                        ) : (
                          <div className="space-y-2">
                            <input 
                              type="file" 
                              accept="image/*"
                              onChange={(e) => handleFileChange(e, 'after')} 
                              className="text-xs text-slate-400 bg-[#121318] border border-[#262833] rounded-xl p-2 w-full focus:outline-none"
                            />
                            {screenshotAfter && (
                              <div className="text-[10px] text-emerald-400 font-bold">
                                ✓ Image chargée avec succès !
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <Textarea label="Remarques & Leçons du Trade" placeholder="Analyse qualitative, psychologie, erreurs..." value={notes} onChange={(e) => setNotes(e.target.value)} />
                </div>
              </div>

              <div className="flex items-center space-x-3 pt-4 border-t border-[#262833]">
                <button
                  type="submit"
                  disabled={isLocked && !editingTrade}
                  className="flex-1 bg-[#6366f1] hover:bg-[#4f46e5] disabled:opacity-50 text-white font-bold text-xs py-3 px-6 rounded-xl shadow-indigo-glow transition-all active:scale-[0.99]"
                >
                  {editingTrade ? "SAUVEGARDER LES MODIFICATIONS" : "ENREGISTRER LA POSITION"}
                </button>
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="bg-[#181920] hover:bg-[#20222c] text-slate-300 font-semibold text-xs py-3 px-6 rounded-xl border border-[#262833] transition-all"
                >
                  ANNULER
                </button>
              </div>
            </form>
          </div>
        </div>
      , document.body)}

      {/* TABLEAU DES TRADES */}
      <Table headers={['DATE', 'INSTRUMENT', 'SESSION', 'TYPE', 'LOTS', 'RESULTAT', 'P&L ($)', 'R-MULTIPLE', 'LIENS IMAGES', 'ACTIONS']}>
        {filteredTrades.map((t: Trade) => (
          <TableRow key={t.id}>
            <TableCell>{new Date(t.entry_time).toLocaleDateString('fr-FR')} {new Date(t.entry_time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</TableCell>
            <TableCell className="font-bold text-white">{t.pair}</TableCell>
            <TableCell>
              {t.session ? (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border uppercase ${
                  t.session === 'Asia' ? 'bg-yellow-500/10 border-yellow-500 text-yellow-400' :
                  t.session === 'London' ? 'bg-blue-500/10 border-blue-500 text-blue-400' :
                  t.session === 'New York' ? 'bg-green-500/10 border-green-500 text-green-400' :
                  'bg-bloomberg-border text-bloomberg-text-secondary'
                }`}>
                  {t.session === 'New York' ? 'NY' : t.session === 'Over Session' ? 'OVER' : t.session}
                </span>
              ) : (
                <span className="text-bloomberg-text-muted">—</span>
              )}
            </TableCell>
            <TableCell>
              <Badge variant={t.direction === 'BUY' ? 'blue' : 'gold'}>
                {t.direction}
              </Badge>
            </TableCell>
            <TableCell>{t.size}</TableCell>
            <TableCell>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border uppercase ${
                t.result === 'TP' ? 'bg-bloomberg-green/10 border-bloomberg-green text-bloomberg-green-light' :
                t.result === 'SL' ? 'bg-bloomberg-red/10 border-bloomberg-red text-bloomberg-red-light' :
                t.result === 'BE' ? 'bg-bloomberg-border text-bloomberg-text-secondary' : 'bg-transparent text-bloomberg-text-primary'
              }`}>
                {t.result}
              </span>
            </TableCell>
            <TableCell className={`font-bold ${t.pnl === null ? 'text-bloomberg-text-secondary' : t.pnl >= 0 ? 'text-bloomberg-green-light' : 'text-bloomberg-red-light'}`}>
              {t.pnl !== null ? `${t.pnl >= 0 ? '+' : ''}${t.pnl.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : 'OPEN'}
            </TableCell>
            <TableCell className="font-semibold text-white">
              {t.r_multiple !== null ? `${t.r_multiple > 0 ? '+' : ''}${t.r_multiple} R` : '—'}
            </TableCell>
            <TableCell>
              <div className="flex space-x-1.5">
                {t.screenshot_before_url && (
                  <a href={t.screenshot_before_url} target="_blank" rel="noreferrer" className="text-[10px] text-bloomberg-gold hover:underline flex items-center space-x-0.5">
                    <span>AVANT</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                )}
                {t.screenshot_after_url && (
                  <a href={t.screenshot_after_url} target="_blank" rel="noreferrer" className="text-[10px] text-bloomberg-gold hover:underline flex items-center space-x-0.5">
                    <span>APRÈS</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                )}
                {!t.screenshot_before_url && !t.screenshot_after_url && <span className="text-bloomberg-text-muted">—</span>}
              </div>
            </TableCell>
            <TableCell>
              <div className="flex space-x-2">
                <button onClick={() => setViewingTrade(t)} className="text-bloomberg-text-secondary hover:text-white transition-colors" title="Détails">
                  <Eye className="w-4 h-4" />
                </button>
                <button onClick={() => handleEditClick(t)} className="text-bloomberg-text-secondary hover:text-bloomberg-gold-light transition-colors" title="Modifier">
                  <Edit3 className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(t.id)} className="text-bloomberg-text-secondary hover:text-bloomberg-red-light transition-colors" title="Supprimer">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </TableCell>
          </TableRow>
        ))}

        {trades.length === 0 && (
          <TableRow>
            <TableCell colSpan={9} className="text-center py-8 text-bloomberg-text-secondary">
              AUCUN TRADE TROUVÉ DANS LE JOURNAL.
            </TableCell>
          </TableRow>
        )}
      </Table>

      {/* DETAIL MODAL POPUP */}
      {viewingTrade && createPortal(
        <div className="fixed inset-0 bg-black/85 flex items-center justify-center p-4 z-[9999] overflow-y-auto backdrop-blur-sm animate-scale-up">
          <div className="bg-[#181920] border border-[#262833] w-full max-w-2xl p-6 relative rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setViewingTrade(null)} 
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 border-b border-[#262833] pb-3 mb-5">
              <div className="w-1 h-5 bg-[#6366f1] rounded-full" />
              <h3 className="text-sm font-bold uppercase text-white tracking-wider">
                DÉTAIL DU POSITIONNEMENT: <span className="text-[#818cf8]">{viewingTrade.pair}</span> ({viewingTrade.direction})
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-6 text-xs mb-6">
              <div className="space-y-1">
                <div className="flex justify-between border-b border-[#262833] pb-2">
                  <span className="text-slate-400">Date d'Entrée:</span>
                  <span className="text-white font-medium">{new Date(viewingTrade.entry_time).toLocaleString('fr-FR')}</span>
                </div>
                <div className="flex justify-between border-b border-[#262833] pb-2">
                  <span className="text-slate-400">Timeframe:</span>
                  <span className="text-white font-bold">{viewingTrade.timeframe}</span>
                </div>
                <div className="flex justify-between border-b border-[#262833] pb-2">
                  <span className="text-slate-400">Session de Trading:</span>
                  <span className="text-[#818cf8] font-bold">{viewingTrade.session || '—'}</span>
                </div>
                <div className="flex justify-between border-b border-[#262833] pb-2">
                  <span className="text-slate-400">Volume:</span>
                  <span className="text-white font-medium">{viewingTrade.size} Lots</span>
                </div>
                <div className="flex justify-between border-b border-[#262833] pb-2">
                  <span className="text-slate-400">Entrée / SL / TP:</span>
                  <span className="text-white font-mono">{viewingTrade.entry_price} / {viewingTrade.stop_loss} / {viewingTrade.take_profit}</span>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between border-b border-[#262833] pb-2">
                  <span className="text-slate-400">Statut du Trade:</span>
                  <span className="text-white font-bold">{viewingTrade.result}</span>
                </div>
                <div className="flex justify-between border-b border-[#262833] pb-2">
                  <span className="text-slate-400">R-Multiple Moyen:</span>
                  <span className="text-white font-bold">{viewingTrade.r_multiple !== null ? `${viewingTrade.r_multiple} R` : '—'}</span>
                </div>
                <div className="flex justify-between border-b border-[#262833] pb-2">
                  <span className="text-slate-400">P&L Net:</span>
                  <span className={`font-bold tabular-nums ${viewingTrade.pnl && viewingTrade.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {viewingTrade.pnl !== null ? `${viewingTrade.pnl >= 0 ? '+' : ''}$${viewingTrade.pnl.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : 'OPEN'}
                  </span>
                </div>
              </div>
            </div>

            {/* Confirmations techniques SMC */}
            <div className="space-y-2 mb-6">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Confirmations Techniques SMC/ICT</h4>
              <div className="flex flex-wrap gap-2">
                {viewingTrade.setup_structures.map(s => <span key={s} className="bg-[#121318] border border-[#262833] px-2.5 py-1 rounded-lg text-xs text-white font-semibold">{s}</span>)}
                {viewingTrade.setup_ob && <span className="bg-[#121318] border border-[#262833] px-2.5 py-1 rounded-lg text-xs text-white font-semibold">ORDER BLOCK</span>}
                {viewingTrade.setup_fvg && <span className="bg-[#121318] border border-[#262833] px-2.5 py-1 rounded-lg text-xs text-white font-semibold">FAIR VALUE GAP (FVG)</span>}
                {viewingTrade.setup_liquidity_sweep && <span className="bg-[#121318] border border-[#262833] px-2.5 py-1 rounded-lg text-xs text-white font-semibold">LIQUIDITY SWEEP</span>}
              </div>
            </div>

            {/* Bookmap order flow */}
            {(viewingTrade.bookmap_absorption || viewingTrade.bookmap_passive_orders || viewingTrade.bookmap_vwap_position) && (
              <div className="space-y-2 mb-6 border-t border-bloomberg-border/50 pt-4 text-xs">
                <h4 className="text-[10px] font-bold text-bloomberg-gold uppercase tracking-wider">Bookmap Order Flow Analysis</h4>
                {viewingTrade.bookmap_vwap_position && <p><span className="text-bloomberg-text-secondary">VWAP :</span> {viewingTrade.bookmap_vwap_position.toUpperCase()}</p>}
                {viewingTrade.bookmap_absorption && <p><span className="text-bloomberg-text-secondary">Absorption :</span> {viewingTrade.bookmap_absorption}</p>}
                {viewingTrade.bookmap_passive_orders && <p><span className="text-bloomberg-text-secondary">Liquidités passives :</span> {viewingTrade.bookmap_passive_orders}</p>}
                {viewingTrade.bookmap_aggressive_orders && <p><span className="text-bloomberg-text-secondary">Ordres agressifs :</span> {viewingTrade.bookmap_aggressive_orders}</p>}
              </div>
            )}

            {/* TradingView screenshots rendering - Direct Visual Display */}
            {(viewingTrade.screenshot_before_url || viewingTrade.screenshot_after_url) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 border-t border-bloomberg-border/50 pt-4">
                {viewingTrade.screenshot_before_url && (
                  <div className="space-y-1.5">
                    <h5 className="text-[9px] text-bloomberg-text-secondary uppercase">Graphique Avant Entrée</h5>
                    <div className="border border-bloomberg-border rounded bg-black/40 overflow-hidden group relative">
                      <img 
                        src={viewingTrade.screenshot_before_url} 
                        alt="Setup avant entrée" 
                        className="w-full h-auto max-h-[220px] object-contain mx-auto"
                        onError={(e) => {
                          // Fallback link if browser blocks hotlinking or link is not an img direct src
                          (e.target as HTMLElement).style.display = 'none';
                          const fallbackNode = document.getElementById('fb-before');
                          if (fallbackNode) fallbackNode.style.display = 'block';
                        }}
                      />
                      <div id="fb-before" className="hidden p-4 text-center text-[10px] text-bloomberg-text-muted">
                        Aperçu non disponible (Lien non-image direct).
                      </div>
                    </div>
                    <a href={viewingTrade.screenshot_before_url} target="_blank" rel="noreferrer" className="inline-flex items-center space-x-1 text-[10px] text-bloomberg-gold hover:underline">
                      <span>Ouvrir sur TradingView</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </div>
                )}
                {viewingTrade.screenshot_after_url && (
                  <div className="space-y-1.5">
                    <h5 className="text-[9px] text-bloomberg-text-secondary uppercase">Graphique Après Sortie</h5>
                    <div className="border border-bloomberg-border rounded bg-black/40 overflow-hidden group relative">
                      <img 
                        src={viewingTrade.screenshot_after_url} 
                        alt="Setup après sortie" 
                        className="w-full h-auto max-h-[220px] object-contain mx-auto"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                          const fallbackNode = document.getElementById('fb-after');
                          if (fallbackNode) fallbackNode.style.display = 'block';
                        }}
                      />
                      <div id="fb-after" className="hidden p-4 text-center text-[10px] text-bloomberg-text-muted">
                        Aperçu non disponible (Lien non-image direct).
                      </div>
                    </div>
                    <a href={viewingTrade.screenshot_after_url} target="_blank" rel="noreferrer" className="inline-flex items-center space-x-1 text-[10px] text-bloomberg-gold hover:underline">
                      <span>Ouvrir sur TradingView</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* Psychology & Notes */}
            <div className="space-y-2 border-t border-bloomberg-border/50 pt-4 text-xs">
              <h4 className="text-[10px] font-bold text-bloomberg-gold uppercase tracking-wider">État Mental & Commentaires</h4>
              <p><span className="text-bloomberg-text-secondary">Psychologie :</span> <span className="uppercase text-white font-bold">{viewingTrade.mental_state}</span></p>
              {viewingTrade.cookie_jar_ref && <p className="text-bloomberg-gold font-bold">✓ Framework Cookie Jar Activé</p>}
              {viewingTrade.rule_40_percent && <p className="text-bloomberg-gold font-bold">✓ 40% Rule Appliquée</p>}
              {viewingTrade.notes && <p className="text-bloomberg-text-secondary mt-2 border-l border-bloomberg-border pl-2 italic">"{viewingTrade.notes}"</p>}
            </div>

          </div>
        </div>
      , document.body)}

    </div>
  );
};
