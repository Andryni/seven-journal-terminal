import React, { useState, useEffect } from 'react';
import { useAccounts } from '../accounts/useAccounts';
import { useUIStore } from '../../store/uiStore';
import { Calculator, Info } from 'lucide-react';

const INSTRUMENTS: Record<string, { pip: number; contractSize: number; label: string }> = {
  XAUUSD: { pip: 0.01,   contractSize: 100,    label: 'Or (XAUUSD)' },
  EURUSD: { pip: 0.0001, contractSize: 100000,  label: 'EUR/USD' },
  GBPUSD: { pip: 0.0001, contractSize: 100000,  label: 'GBP/USD' },
  USDJPY: { pip: 0.01,   contractSize: 100000,  label: 'USD/JPY' },
  GBPJPY: { pip: 0.01,   contractSize: 100000,  label: 'GBP/JPY' },
  US30:   { pip: 1,      contractSize: 1,       label: 'US30 (Dow Jones)' },
  NAS100: { pip: 0.25,   contractSize: 20,      label: 'NAS100 (Nasdaq)' },
  BTCUSD: { pip: 1,      contractSize: 1,       label: 'Bitcoin (BTC/USD)' },
};

export const PositionCalculator: React.FC = () => {
  const { accounts } = useAccounts();
  const activeAccountId = useUIStore(s => s.activeAccountId);
  
  const [instrument, setInstrument] = useState('XAUUSD');
  const [accountId, setAccountId] = useState(activeAccountId || (accounts[0]?.id ?? ''));
  const [riskType, setRiskType] = useState<'percent' | 'usd'>('percent');
  const [riskValue, setRiskValue] = useState('1');
  const [entryPrice, setEntryPrice] = useState('');
  const [stopLossPrice, setStopLossPrice] = useState('');

  const [lotSize, setLotSize] = useState<number | null>(null);
  const [riskUsd, setRiskUsd] = useState<number | null>(null);
  const [pipValue, setPipValue] = useState<number | null>(null);
  const [slPips, setSlPips] = useState<number | null>(null);

  useEffect(() => {
    if (activeAccountId && !accountId) setAccountId(activeAccountId);
  }, [activeAccountId, accountId]);

  useEffect(() => {
    const entry = Number(entryPrice);
    const sl = Number(stopLossPrice);
    const risk = Number(riskValue);
    const acc = accounts.find(a => a.id === accountId);
    const balance = acc ? acc.balance : 0;
    const inst = INSTRUMENTS[instrument];

    if (!inst || entry <= 0 || sl <= 0 || entry === sl || risk <= 0 || balance <= 0) {
      setLotSize(null); setRiskUsd(null); setPipValue(null); setSlPips(null);
      return;
    }

    // Risk in USD
    const computedRiskUsd = riskType === 'percent' ? balance * (risk / 100) : risk;

    // SL distance in pips
    const slDistance = Math.abs(entry - sl);
    const slInPips = slDistance / inst.pip;

    // Pip value per lot in USD (approximation: for gold/forex quoted vs USD)
    const pipValuePerLot = inst.pip * inst.contractSize;

    // Lot size = Risk / (SL in pips * pip value per lot)
    const computedLotSize = computedRiskUsd / (slInPips * pipValuePerLot);

    setRiskUsd(computedRiskUsd);
    setSlPips(Math.round(slInPips * 10) / 10);
    setPipValue(pipValuePerLot);
    setLotSize(Math.round(computedLotSize * 100) / 100);
  }, [entryPrice, stopLossPrice, riskValue, riskType, instrument, accountId, accounts]);

  const activeAccount = accounts.find(a => a.id === accountId);

  return (
    <div className="bg-[#0a0a0d] border border-[#1a1a1f] overflow-hidden">
      <div className="h-px bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />
      <div className="px-4 py-3 border-b border-[#1a1a1f] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-1 h-3 bg-amber-500 rounded-full" />
          <Calculator className="w-3.5 h-3.5 text-amber-500" />
          <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-amber-500">Position Size Calculator</span>
        </div>
        <span className="text-[9px] text-[#52525b] uppercase tracking-widest">Calcul automatique du lot</span>
      </div>

      <div className="p-4 space-y-4">
        {/* Row 1: Account + Instrument */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-[9px] uppercase tracking-[0.14em] text-[#71717a] font-semibold">Compte</label>
            <select
              value={accountId}
              onChange={e => setAccountId(e.target.value)}
              className="bg-[#050506] border border-[#1a1a1f] text-[10px] font-mono text-white px-2.5 py-1.5 focus:outline-none focus:border-amber-500 transition-colors"
            >
              {accounts.map(a => (
                <option key={a.id} value={a.id}>{a.name.toUpperCase()} — {a.currency} {a.balance.toLocaleString()}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[9px] uppercase tracking-[0.14em] text-[#71717a] font-semibold">Instrument</label>
            <select
              value={instrument}
              onChange={e => setInstrument(e.target.value)}
              className="bg-[#050506] border border-[#1a1a1f] text-[10px] font-mono text-white px-2.5 py-1.5 focus:outline-none focus:border-amber-500 transition-colors"
            >
              {Object.entries(INSTRUMENTS).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Row 2: Risk */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-[9px] uppercase tracking-[0.14em] text-[#71717a] font-semibold">Type de Risque</label>
            <div className="flex">
              {(['percent', 'usd'] as const).map(rt => (
                <button
                  key={rt}
                  onClick={() => setRiskType(rt)}
                  className={`flex-1 text-[10px] font-bold py-1.5 border uppercase tracking-wider transition-all ${
                    riskType === rt
                      ? 'bg-amber-500/20 border-amber-500 text-amber-400'
                      : 'bg-transparent border-[#1a1a1f] text-[#52525b] hover:text-white'
                  }`}
                >
                  {rt === 'percent' ? '%' : '$'}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[9px] uppercase tracking-[0.14em] text-[#71717a] font-semibold">
              Valeur du Risque ({riskType === 'percent' ? '%' : '$'})
            </label>
            <input
              type="number"
              step="0.1"
              value={riskValue}
              onChange={e => setRiskValue(e.target.value)}
              className="bg-[#050506] border border-[#1a1a1f] text-xs font-mono text-white px-2.5 py-1.5 focus:outline-none focus:border-amber-500 transition-colors"
              placeholder="1"
            />
          </div>
        </div>

        {/* Row 3: Entry + SL */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-[9px] uppercase tracking-[0.14em] text-[#71717a] font-semibold">Prix d'Entrée</label>
            <input
              type="number"
              step="0.00001"
              value={entryPrice}
              onChange={e => setEntryPrice(e.target.value)}
              className="bg-[#050506] border border-[#1a1a1f] text-xs font-mono text-white px-2.5 py-1.5 focus:outline-none focus:border-amber-500 transition-colors"
              placeholder="ex: 2350.50"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[9px] uppercase tracking-[0.14em] text-[#71717a] font-semibold">Stop Loss</label>
            <input
              type="number"
              step="0.00001"
              value={stopLossPrice}
              onChange={e => setStopLossPrice(e.target.value)}
              className="bg-[#050506] border border-[#1a1a1f] text-xs font-mono text-white px-2.5 py-1.5 focus:outline-none focus:border-amber-500 transition-colors"
              placeholder="ex: 2345.00"
            />
          </div>
        </div>

        {/* RESULT */}
        {lotSize !== null ? (
          <div className="border border-amber-500/30 bg-amber-950/20 p-4 space-y-3">
            <div className="text-center">
              <div className="text-[9px] uppercase tracking-widest text-amber-500/70 mb-1">Taille de Lot Recommandée</div>
              <div className="text-4xl font-black text-amber-400 tabular-nums" style={{ textShadow: '0 0 20px rgba(245,158,11,0.4)' }}>
                {lotSize.toFixed(2)}
              </div>
              <div className="text-[9px] text-[#71717a] mt-1">lots</div>
            </div>
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-amber-500/20">
              <div className="text-center">
                <div className="text-[8px] text-[#52525b] uppercase tracking-wider">Risque $</div>
                <div className="text-sm font-bold text-red-400 tabular-nums">${riskUsd?.toFixed(2)}</div>
                {activeAccount && <div className="text-[8px] text-[#52525b]">{((riskUsd! / activeAccount.balance) * 100).toFixed(2)}%</div>}
              </div>
              <div className="text-center">
                <div className="text-[8px] text-[#52525b] uppercase tracking-wider">SL en Pips</div>
                <div className="text-sm font-bold text-white tabular-nums">{slPips}</div>
              </div>
              <div className="text-center">
                <div className="text-[8px] text-[#52525b] uppercase tracking-wider">Valeur pip/lot</div>
                <div className="text-sm font-bold text-amber-400 tabular-nums">${pipValue?.toFixed(2)}</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="border border-[#1a1a1f] p-3 flex items-center gap-2 text-[#52525b]">
            <Info className="w-3.5 h-3.5 shrink-0" />
            <span className="text-[9px] uppercase tracking-wider">Renseignez le compte, l'instrument, le risque et les prix pour calculer automatiquement.</span>
          </div>
        )}
      </div>
    </div>
  );
};
