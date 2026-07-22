import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useAccounts } from './useAccounts';
import type { TradingAccount } from './useAccounts';
import { useTrades } from '../trades/useTrades';
import { Input, Select } from '../../components/ui/Input';
import { Plus, AlertCircle, Trash2, Edit3, TrendingUp, DollarSign, Wallet, CheckCircle, X } from 'lucide-react';

export const Accounts: React.FC = () => {
  const { accounts, isLoading, createAccount, updateAccount, deleteAccount } = useAccounts();
  const { trades } = useTrades();
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState<TradingAccount | null>(null);
  
  const [name, setName] = useState('');
  const [type, setType] = useState<'challenge' | 'funded' | 'personal' | 'demo'>('challenge');
  const [balance, setBalance] = useState('');
  const [initialBalance, setInitialBalance] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [maxDailyLoss, setMaxDailyLoss] = useState('');
  const [maxDrawdownLimit, setMaxDrawdownLimit] = useState('');
  const [profitTarget, setProfitTarget] = useState('');
  const [consistencyRulePercent, setConsistencyRulePercent] = useState('15');
  const [error, setError] = useState('');

  const handleEditClick = (acc: TradingAccount) => {
    setEditingAccount(acc);
    setName(acc.name);
    setType(acc.type);
    setBalance(acc.balance.toString());
    setInitialBalance(acc.initial_balance.toString());
    setCurrency(acc.currency);
    setMaxDailyLoss(acc.max_daily_loss_limit !== null && acc.max_daily_loss_limit !== undefined ? acc.max_daily_loss_limit.toString() : '');
    setMaxDrawdownLimit(acc.max_drawdown_limit !== null && acc.max_drawdown_limit !== undefined ? acc.max_drawdown_limit.toString() : '');
    setProfitTarget(acc.profit_target !== null && acc.profit_target !== undefined ? acc.profit_target.toString() : '');
    setConsistencyRulePercent(acc.consistency_rule_percent !== null && acc.consistency_rule_percent !== undefined ? acc.consistency_rule_percent.toString() : '15');
    setShowAddForm(true);
  };

  const handleCancelEdit = () => {
    setEditingAccount(null);
    setShowAddForm(false);
    clearForm();
  };

  const clearForm = () => {
    setName('');
    setBalance('');
    setInitialBalance('');
    setMaxDailyLoss('');
    setMaxDrawdownLimit('');
    setProfitTarget('');
    setConsistencyRulePercent('15');
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim() || !balance.trim()) {
      setError('Veuillez remplir tous les champs obligatoires.');
      return;
    }

    const balanceNum = Number(balance);
    const initialBalanceNum = initialBalance ? Number(initialBalance) : balanceNum;
    
    if (isNaN(balanceNum) || balanceNum < 0 || isNaN(initialBalanceNum) || initialBalanceNum < 0) {
      setError('Les soldes doivent être des nombres positifs.');
      return;
    }

    try {
      if (editingAccount) {
        await updateAccount({
          id: editingAccount.id,
          name,
          type,
          balance: balanceNum,
          initial_balance: initialBalanceNum,
          currency,
          max_daily_loss_limit: maxDailyLoss ? Number(maxDailyLoss) : null,
          max_drawdown_limit: maxDrawdownLimit ? Number(maxDrawdownLimit) : null,
          profit_target: profitTarget ? Number(profitTarget) : null,
          consistency_rule_percent: consistencyRulePercent ? Number(consistencyRulePercent) : null,
        });
        setEditingAccount(null);
      } else {
        await createAccount({
          name,
          type,
          balance: balanceNum,
          initial_balance: initialBalanceNum,
          currency,
          is_active: true,
          max_daily_loss_limit: maxDailyLoss ? Number(maxDailyLoss) : null,
          max_drawdown_limit: maxDrawdownLimit ? Number(maxDrawdownLimit) : null,
          profit_target: profitTarget ? Number(profitTarget) : null,
          consistency_rule_percent: consistencyRulePercent ? Number(consistencyRulePercent) : null,
        });
      }

      clearForm();
      setShowAddForm(false);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'enregistrement du compte.');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Voulez-vous vraiment supprimer ce compte de trading ? Cela supprimera l\'association de tous ses trades.')) {
      try {
        await deleteAccount(id);
      } catch (err) {
        alert('Erreur lors de la suppression du compte.');
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-bloomberg-text-secondary font-mono text-xs">
        CHARGEMENT DES COMPTES...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* PAGE HEADER */}
      <div className="flex items-center justify-between border-b border-[#262833] pb-4">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-white">
            COMPTES DE TRADING
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Gérez vos portefeuilles Prop Firms (Challenge, Funded) et comptes personnels
          </p>
        </div>
        <button 
          onClick={() => setShowAddForm(true)}
          className="flex items-center space-x-2 bg-[#6366f1] hover:bg-[#4f46e5] text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-indigo-glow transition-all active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          <span>Ajouter un compte</span>
        </button>
      </div>

      {/* MODAL FORMULAIRE COMPTE — STYLE TRADEZELLA / SEVEN TRACKING */}
      {showAddForm && createPortal(
        <div className="fixed inset-0 bg-black/85 flex items-center justify-center p-4 z-[9999] overflow-y-auto backdrop-blur-sm animate-scale-up">
          <div className="bg-[#181920] border border-[#262833] w-full max-w-xl p-6 relative rounded-2xl shadow-2xl my-8">
            {/* Header */}
            <button
              type="button"
              onClick={handleCancelEdit}
              className="absolute top-5 right-5 text-slate-400 hover:text-white transition-colors p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="border-b border-[#262833] pb-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-1 h-6 bg-[#6366f1] rounded-full" />
                <div>
                  <h2 className="text-sm font-bold tracking-wider text-white uppercase">
                    {editingAccount ? 'Modifier le compte' : 'Nouveau compte'}
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {editingAccount ? `Édition : ${editingAccount.name}` : 'Prop Firm / Compte Personnel / Demo'}
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-xl flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Section 1 — Identité */}
              <div className="bg-[#121318] border border-[#262833] p-4 rounded-xl space-y-4">
                <p className="text-xs font-bold text-[#818cf8] uppercase tracking-wider border-b border-[#262833] pb-2">1. Identité du Compte</p>
                <Input
                  label="Nom du compte *"
                  placeholder="ex: Challenge FTMO 100K"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
                <div className="grid grid-cols-2 gap-4">
                  <Select
                    label="Type de compte"
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    options={[
                      { value: 'challenge', label: 'CHALLENGE PROP' },
                      { value: 'funded', label: 'FUNDED PROP' },
                      { value: 'personal', label: 'COMPTE PERSONNEL' },
                      { value: 'demo', label: 'COMPTE DEMO' },
                    ]}
                  />
                  <Select
                    label="Devise"
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    options={[
                      { value: 'USD', label: 'USD ($)' },
                      { value: 'EUR', label: 'EUR (€)' },
                      { value: 'GBP', label: 'GBP (£)' },
                    ]}
                  />
                </div>
              </div>

              {/* Section 2 — Capital */}
              <div className="bg-[#121318] border border-[#262833] p-4 rounded-xl space-y-4">
                <p className="text-xs font-bold text-[#818cf8] uppercase tracking-wider border-b border-[#262833] pb-2">2. Capital</p>
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Capital Initial *"
                    placeholder="ex: 100000"
                    value={initialBalance}
                    onChange={(e) => setInitialBalance(e.target.value)}
                    type="number"
                    step="0.01"
                    required
                  />
                  <Input
                    label="Solde Actuel *"
                    placeholder="ex: 100000"
                    value={balance}
                    onChange={(e) => setBalance(e.target.value)}
                    type="number"
                    step="0.01"
                    required
                  />
                </div>
              </div>

              {/* Section 3 — Règles Prop Firm (Affiché uniquement pour Challenge Prop & Funded Prop) */}
              {(type === 'challenge' || type === 'funded') && (
                <div className="bg-[#121318] border border-[#262833] p-4 rounded-xl space-y-4 animate-scale-up">
                  <p className="text-xs font-bold text-amber-400 uppercase tracking-wider border-b border-[#262833] pb-2 flex items-center justify-between">
                    <span>3. Paramètres Prop Firm Tracker</span>
                    <span className="text-[10px] text-slate-500 font-normal">Requis pour l'analyse Prop Firm</span>
                  </p>

                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Profit Target / Objectif ($) *"
                      placeholder="ex: 10000"
                      value={profitTarget}
                      onChange={(e) => setProfitTarget(e.target.value)}
                      type="number"
                      step="0.01"
                    />
                    <Input
                      label="Max Drawdown Limite ($) *"
                      placeholder="ex: 10000"
                      value={maxDrawdownLimit}
                      onChange={(e) => setMaxDrawdownLimit(e.target.value)}
                      type="number"
                      step="0.01"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Daily Drawdown / Perte Quotidienne Max ($)"
                      placeholder="ex: 5000 (optionnel)"
                      value={maxDailyLoss}
                      onChange={(e) => setMaxDailyLoss(e.target.value)}
                      type="number"
                      step="0.01"
                    />
                    <Input
                      label="Règle de Consistance / Régularité (%)"
                      placeholder="ex: 15 (ex: FTMO 15%, FundedNext 20%)"
                      value={consistencyRulePercent}
                      onChange={(e) => setConsistencyRulePercent(e.target.value)}
                      type="number"
                      step="1"
                    />
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-3 pt-2 border-t border-[#262833]">
                <button
                  type="submit"
                  className="flex-1 bg-[#6366f1] hover:bg-[#4f46e5] text-white text-xs font-bold py-3 px-6 rounded-xl shadow-indigo-glow transition-all active:scale-[0.99]"
                >
                  {editingAccount ? 'SAUVEGARDER LES MODIFICATIONS' : 'CRÉER LE COMPTE'}
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

      {/* COMPTES GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {accounts.map((acc: TradingAccount) => {
          const accountTrades = trades.filter(t => t.account_id === acc.id);
          const closedTrades = accountTrades.filter(t => t.pnl !== null);
          const winTrades = closedTrades.filter(t => t.pnl !== null && t.pnl > 0);
          
          // Calcul dynamique du P&L à partir des trades réels
          const cumulativePnl = closedTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
          const computedBalance = acc.initial_balance + cumulativePnl;
          const pnlPercent = acc.initial_balance > 0 ? (cumulativePnl / acc.initial_balance) * 100 : 0;
          const winRate = closedTrades.length > 0 ? (winTrades.length / closedTrades.length) * 100 : 0;
          
          // Cumulative R-multiple for this specific account
          const totalR = closedTrades.reduce((sum, t) => sum + (t.r_multiple || 0), 0);

          return (
            <div
              key={acc.id}
              className="bg-bloomberg-surface border border-bloomberg-border p-4 space-y-0 hover:border-bloomberg-border-bright transition-colors"
            >
              {/* Card Header */}
              <div className="flex items-center justify-between border-b border-bloomberg-border pb-3 mb-4">
                <span className="text-[11px] font-extrabold tracking-widest text-white uppercase">{acc.name.toUpperCase()}</span>
                <div className="flex items-center space-x-2">
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase ${
                    acc.type === 'funded' 
                      ? 'bg-emerald-950/30 border-emerald-500/50 text-emerald-400' 
                      : acc.type === 'challenge' 
                      ? 'bg-amber-950/30 border-amber-500/50 text-amber-400' 
                      : 'bg-bloomberg-border border-bloomberg-border text-bloomberg-text-secondary'
                  }`}>
                    {acc.type}
                  </span>
                  {acc.type === 'funded' && pnlPercent >= 0 && (
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                  )}
                </div>
              </div>
              <div className="space-y-4 font-mono text-xs">
                
                {/* SOLDE ACTUEL */}
                <div className="flex justify-between border-b border-bloomberg-border/50 pb-1.5">
                  <span className="text-bloomberg-text-secondary flex items-center gap-1">
                    <Wallet className="w-3.5 h-3.5 shrink-0" />
                    <span>SOLDE ACTUEL :</span>
                  </span>
                  <span className="text-white font-bold text-sm">
                    {acc.currency} {computedBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>

                {/* CAPITAL INITIAL */}
                <div className="flex justify-between border-b border-bloomberg-border/50 pb-1.5">
                  <span className="text-bloomberg-text-secondary flex items-center gap-1">
                    <DollarSign className="w-3.5 h-3.5 shrink-0" />
                    <span>CAPITAL INITIAL :</span>
                  </span>
                  <span className="text-bloomberg-text-primary font-semibold">
                    {acc.currency} {acc.initial_balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>

                {/* P&L GLOBAL */}
                <div className="flex justify-between border-b border-bloomberg-border/50 pb-1.5">
                  <span className="text-bloomberg-text-secondary flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5 shrink-0" />
                    <span>P&L NET CUMULÉ :</span>
                  </span>
                  <span className={`font-bold ${cumulativePnl >= 0 ? 'text-bloomberg-green-light' : 'text-bloomberg-red-light'}`}>
                    {cumulativePnl >= 0 ? '+' : ''}{cumulativePnl.toLocaleString('en-US', { minimumFractionDigits: 2 })} ({pnlPercent.toFixed(2)}%)
                  </span>
                </div>

                {/* STATISTIQUES SUPPLÉMENTAIRES */}
                <div className="grid grid-cols-3 gap-2 pt-1.5 text-center text-[10px] text-bloomberg-text-secondary">
                  <div className="bg-[#0b0b0e] border border-bloomberg-border/40 p-1.5 rounded-sm">
                    <div className="text-[8px] uppercase">Positions</div>
                    <div className="font-bold text-white text-xs mt-0.5">{accountTrades.length}</div>
                  </div>
                  <div className="bg-[#0b0b0e] border border-bloomberg-border/40 p-1.5 rounded-sm">
                    <div className="text-[8px] uppercase">Win Rate</div>
                    <div className="font-bold text-white text-xs mt-0.5">{winRate.toFixed(0)}%</div>
                  </div>
                  <div className="bg-[#0b0b0e] border border-bloomberg-border/40 p-1.5 rounded-sm">
                    <div className="text-[8px] uppercase">Cumul R</div>
                    <div className={`font-bold text-xs mt-0.5 ${totalR >= 0 ? 'text-bloomberg-green-light' : 'text-bloomberg-red-light'}`}>
                      {totalR >= 0 ? '+' : ''}{totalR.toFixed(1)}R
                    </div>
                  </div>
                </div>

                {/* DAILY LOSS LIMIT */}
                {acc.max_daily_loss_limit !== null && acc.max_daily_loss_limit > 0 && (
                  <div className="border border-red-500/20 bg-red-950/10 p-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <AlertCircle className="w-3 h-3 text-red-400 shrink-0" />
                      <span className="text-[9px] uppercase tracking-wider text-[#71717a]">Limite Perte / Jour</span>
                    </div>
                    <span className="text-xs font-bold text-red-400 font-mono">
                      {acc.currency} {acc.max_daily_loss_limit.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                )}

                {/* ACTIONS */}
                <div className="flex items-center justify-between pt-3 border-t border-bloomberg-border/50">
                  <div className="text-[9px] text-bloomberg-text-muted">
                    Créé le {new Date(acc.created_at).toLocaleDateString('fr-FR')}
                  </div>
                  <div className="flex space-x-3">
                    <button 
                      onClick={() => handleEditClick(acc)} 
                      className="text-bloomberg-text-secondary hover:text-bloomberg-gold-light transition-colors flex items-center space-x-1"
                      title="Modifier le compte"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={() => handleDelete(acc.id)} 
                      className="text-bloomberg-text-secondary hover:text-bloomberg-red-light transition-colors flex items-center space-x-1"
                      title="Supprimer le compte"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

              </div>
            </div>
          );
        })}

        {accounts.length === 0 && (
          <div className="col-span-full border border-dashed border-bloomberg-border p-8 text-center text-bloomberg-text-secondary rounded-sm font-mono text-xs">
            AUCUN COMPTE DE TRADING CONFIGURÉ. VEUILLEZ EN AJOUTER UN POUR COMMENCER.
          </div>
        )}
      </div>
    </div>
  );
};
