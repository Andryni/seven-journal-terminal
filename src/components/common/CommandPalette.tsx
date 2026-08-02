import React, { useState, useEffect } from 'react';
import {
  Search, LayoutDashboard, BookOpen, BarChart3, CalendarRange,
  BookMarked, Target, Wallet, Plus, ArrowRight, Shield
} from 'lucide-react';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTab: (tab: any) => void;
  onOpenAddTrade: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onSelectTab,
  onOpenAddTrade,
}) => {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else {
          setQuery('');
          // open signal
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const COMMANDS = [
    { id: 'dashboard', title: 'Aller au Dashboard', desc: 'Vue d\'ensemble & métriques', icon: LayoutDashboard, action: () => { onSelectTab('dashboard'); onClose(); } },
    { id: 'add_trade', title: 'Ajouter un nouveau Trade', desc: 'Journaliser une exécution', icon: Plus, action: () => { onSelectTab('trades'); onOpenAddTrade(); onClose(); } },
    { id: 'trades', title: 'Voir le Journal des Trades', desc: 'Liste & filtres de positions', icon: BookOpen, action: () => { onSelectTab('trades'); onClose(); } },
    { id: 'analytics', title: 'Ouvrir les Analytics Avancés', desc: 'Graphs, timing, psychology', icon: BarChart3, action: () => { onSelectTab('analytics'); onClose(); } },
    { id: 'calendar', title: 'Calendrier des Performances', desc: 'Heatmap des résultats', icon: CalendarRange, action: () => { onSelectTab('calendar'); onClose(); } },
    { id: 'playbook', title: 'Consulter le Playbook', desc: 'Setups & règles d\'invalidation', icon: BookMarked, action: () => { onSelectTab('playbook'); onClose(); } },
    { id: 'goals', title: 'Objectifs du Mois', desc: 'Suivi des targets financiers', icon: Target, action: () => { onSelectTab('goals'); onClose(); } },
    { id: 'accounts', title: 'Gestion des Comptes', desc: 'Prop Firms, Personal, Demo', icon: Wallet, action: () => { onSelectTab('accounts'); onClose(); } },
  ];

  const filteredCommands = COMMANDS.filter(c =>
    c.title.toLowerCase().includes(query.toLowerCase()) || c.desc.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[9999] flex items-start justify-center pt-24 px-4 animate-scale-up">
      <div className="bg-[#0e0f17] border border-white/10 rounded-2xl w-full max-w-xl shadow-[0_0_50px_rgba(99,102,241,0.25)] overflow-hidden">
        
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/[0.08] bg-[#12131f]/80">
          <Search className="w-4 h-4 text-[#818cf8]" />
          <input
            type="text"
            autoFocus
            placeholder="Rechercher une commande, page ou action... (Ctrl+K)"
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none font-mono"
          />
          <span className="text-[10px] font-mono font-bold text-slate-500 bg-white/[0.05] border border-white/10 px-2 py-0.5 rounded">
            ESC
          </span>
        </div>

        {/* Results list */}
        <div className="p-2 max-h-80 overflow-y-auto space-y-1">
          {filteredCommands.map(({ id, title, desc, icon: Icon, action }) => (
            <button
              key={id}
              onClick={action}
              className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-[#6366f1]/15 hover:border-[#6366f1]/30 border border-transparent text-left transition-all group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-white/[0.04] group-hover:bg-[#6366f1]/20 text-slate-400 group-hover:text-[#818cf8] transition-colors">
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-200 group-hover:text-white font-sans">{title}</div>
                  <div className="text-[10px] text-slate-500 font-mono">{desc}</div>
                </div>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-[#818cf8] opacity-0 group-hover:opacity-100 transition-all" />
            </button>
          ))}

          {filteredCommands.length === 0 && (
            <div className="p-6 text-center text-xs text-slate-500 font-mono">
              Aucune commande trouvée pour "{query}"
            </div>
          )}
        </div>

        <div className="p-2.5 bg-[#08090f] border-t border-white/[0.06] flex items-center justify-between text-[10px] font-mono text-slate-500 px-4">
          <span>Seven Tracking Terminal</span>
          <span className="flex items-center gap-1"><Shield className="w-3 h-3 text-emerald-400" /> Pro Edition 2026</span>
        </div>
      </div>
    </div>
  );
};
