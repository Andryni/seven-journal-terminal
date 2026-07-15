import React, { useState } from 'react';
import { useAccounts } from './useAccounts';
import type { TradingAccount } from './useAccounts';
import { useTrades } from '../trades/useTrades';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/Input';
import { Plus, AlertCircle, Trash2, Edit3, TrendingUp, DollarSign, Wallet, CheckCircle } from 'lucide-react';

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
  const [error, setError] = useState('');

  const handleEditClick = (acc: TradingAccount) => {
    setEditingAccount(acc);
    setName(acc.name);
    setType(acc.type);
    setBalance(acc.balance.toString());
    setInitialBalance(acc.initial_balance.toString());
    setCurrency(acc.currency);
    setMaxDailyLoss(acc.max_daily_loss_limit !== null ? acc.max_daily_loss_limit.toString() : '');
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
      <div className="flex items-center justify-between border-b border-bloomberg-border pb-4">
        <div>
          <h2 className="text-sm font-extrabold uppercase tracking-widest text-white">
            COMPTES DE TRADING
          </h2>
          <p className="text-[10px] text-bloomberg-text-secondary">
            Gérez vos différents portefeuilles Prop Firms (Challenge, Funded) et comptes personnels
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => {
            if (showAddForm) handleCancelEdit();
            else setShowAddForm(true);
          }}
          className="flex items-center space-x-1.5"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{showAddForm ? 'ANNULER' : 'AJOUTER UN COMPTE'}</span>
        </Button>
      </div>

      {/* FORMULAIRE DE CRÉATION ET MODIFICATION */}
      {showAddForm && (
        <Card title={editingAccount ? "MODIFIER LE COMPTE" : "NOUVEAU COMPTE"} className="max-w-md mx-auto">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-2.5 bg-bloomberg-red/10 border border-bloomberg-red text-bloomberg-red-light text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
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
            
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Solde initial / Balance *"
                placeholder="ex: 100000"
                value={initialBalance}
                onChange={(e) => setInitialBalance(e.target.value)}
                type="number"
                step="0.01"
                required
              />
              <Input
                label="Solde actuel / Balance *"
                placeholder="ex: 102500"
                value={balance}
                onChange={(e) => setBalance(e.target.value)}
                type="number"
                step="0.01"
                required
              />
            </div>

            <Input
              label="Limite de Perte Quotidienne Max ($) — Prop Firm Rule"
              placeholder="ex: 2500 (laisser vide pour désactiver)"
              value={maxDailyLoss}
              onChange={(e) => setMaxDailyLoss(e.target.value)}
              type="number"
              step="0.01"
            />

            <div className="flex items-center space-x-3 pt-2">
              <Button type="submit" className="flex-1 py-2">
                {editingAccount ? "SAUVEGARDER LES MODIFICATIONS" : "ENREGISTRER LE COMPTE"}
              </Button>
              {editingAccount && (
                <Button type="button" variant="outline" onClick={handleCancelEdit}>
                  ANNULER
                </Button>
              )}
            </div>
          </form>
        </Card>
      )}

      {/* COMPTES GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {accounts.map((acc: TradingAccount) => {
          const accountTrades = trades.filter(t => t.account_id === acc.id);
          const closedTrades = accountTrades.filter(t => t.exit_time !== null && t.pnl !== null);
          const winTrades = closedTrades.filter(t => t.pnl !== null && t.pnl > 0);
          
          const pnl = acc.balance - acc.initial_balance;
          const pnlPercent = acc.initial_balance > 0 ? (pnl / acc.initial_balance) * 100 : 0;
          const winRate = closedTrades.length > 0 ? (winTrades.length / closedTrades.length) * 100 : 0;
          
          // Cumulative R-multiple for this specific account
          const totalR = closedTrades.reduce((sum, t) => sum + (t.r_multiple || 0), 0);

          return (
            <Card 
              key={acc.id}
              title={acc.name.toUpperCase()}
              headerAction={
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
              }
            >
              <div className="space-y-4 font-mono text-xs">
                
                {/* SOLDE ACTUEL */}
                <div className="flex justify-between border-b border-bloomberg-border/50 pb-1.5">
                  <span className="text-bloomberg-text-secondary flex items-center gap-1">
                    <Wallet className="w-3.5 h-3.5 shrink-0" />
                    <span>SOLDE ACTUEL :</span>
                  </span>
                  <span className="text-white font-bold text-sm">
                    {acc.currency} {acc.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
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
                  <span className={`font-bold ${pnl >= 0 ? 'text-bloomberg-green-light' : 'text-bloomberg-red-light'}`}>
                    {pnl >= 0 ? '+' : ''}{pnl.toLocaleString('en-US', { minimumFractionDigits: 2 })} ({pnlPercent.toFixed(2)}%)
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
            </Card>
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
