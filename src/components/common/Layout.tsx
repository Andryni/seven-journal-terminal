import React from 'react';
import { useUIStore } from '../../store/uiStore';
import { useAccounts } from '../../features/accounts/useAccounts';
import { useDailyLock } from '../../features/guard/useDailyLock';
import { 
  LayoutDashboard, 
  BookOpen, 
  Wallet, 
  Lock, 
  BarChart3,
  CalendarRange,
  BookMarked,
  LogOut,
  Plus
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

export type TabType = 'dashboard' | 'trades' | 'accounts' | 'analytics' | 'calendar' | 'playbook';

interface LayoutProps {
  children: React.ReactNode;
  currentTab: TabType;
  setCurrentTab: (tab: TabType) => void;
}

const NAV_ITEMS = [
  { id: 'dashboard' as const, name: 'Dashboard', icon: LayoutDashboard },
  { id: 'trades'    as const, name: 'Journal / Trades', icon: BookOpen },
  { id: 'analytics' as const, name: 'Analytics', icon: BarChart3 },
  { id: 'calendar'  as const, name: 'Calendrier', icon: CalendarRange },
  { id: 'playbook'  as const, name: 'Playbook', icon: BookMarked },
  { id: 'accounts'  as const, name: 'Comptes', icon: Wallet },
] as const;

export const Layout: React.FC<LayoutProps> = ({ children, currentTab, setCurrentTab }) => {
  const { activeAccountId, setActiveAccountId } = useUIStore();
  const { accounts } = useAccounts();
  const { isLocked } = useDailyLock();

  return (
    <div className="min-h-screen bg-[#07080a] text-slate-100 flex font-sans selection:bg-[#6366f1]/30 selection:text-white">
      
      {/* ── DESKTOP SIDEBAR ────────────────────────────────────────────── */}
      <aside className="w-64 bg-[#0d0e14]/90 border-r border-white/[0.07] hidden md:flex flex-col shrink-0 z-20 backdrop-blur-xl">
        
        {/* Logo Seven Tracking */}
        <div className="h-16 px-5 flex items-center gap-3 border-b border-white/[0.07] bg-[#07080a]/60 backdrop-blur-md">
          <div className="relative group cursor-pointer" onClick={() => setCurrentTab('dashboard')}>
            <div className="absolute -inset-0.5 bg-gradient-to-r from-[#6366f1] via-[#06b6d4] to-[#10b981] rounded-xl blur opacity-60 group-hover:opacity-100 transition duration-300 animate-pulse-glow" />
            <img 
              src="/assets/seven_tracking_logo.png" 
              alt="Seven Tracking Logo" 
              className="relative w-9 h-9 rounded-xl object-cover border border-white/10 shadow-lg group-hover:scale-105 transition-transform duration-300"
            />
          </div>
          <div className="cursor-pointer" onClick={() => setCurrentTab('dashboard')}>
            <div className="text-sm font-black tracking-tight text-white flex items-center gap-1">
              <span className="tracking-wider">SEVEN</span>
              <span className="bg-gradient-to-r from-[#818cf8] via-[#06b6d4] to-[#34d399] bg-clip-text text-transparent font-black tracking-widest animate-shimmer">
                TRACKING
              </span>
            </div>
            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              FINTECH TERMINAL 2026
            </div>
          </div>
        </div>

        {/* Action Button "+ Ajouter Trade" */}
        <div className="p-4">
          <button
            onClick={() => setCurrentTab('trades')}
            className="w-full bg-gradient-to-r from-[#6366f1] to-[#4f46e5] hover:from-[#4f46e5] hover:to-[#4338ca] text-white font-bold text-xs py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-indigo-glow transition-all active:scale-[0.98] border border-indigo-400/30"
          >
            <Plus className="w-4 h-4" />
            <span>Ajouter un trade</span>
          </button>
        </div>

        {/* Navigation items */}
        <nav className="flex-1 px-3 space-y-1.5 py-2">
          {NAV_ITEMS.map(({ id, name, icon: Icon }) => {
            const active = currentTab === id;
            return (
              <button
                key={id}
                onClick={() => setCurrentTab(id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all relative ${
                  active
                    ? 'bg-[#6366f1]/15 text-[#818cf8] border border-[#6366f1]/30 shadow-indigo-glow font-bold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? 'text-[#818cf8]' : 'text-slate-400'}`} />
                <span>{name}</span>
                {active && (
                  <div className="absolute right-2 w-1.5 h-1.5 rounded-full bg-[#818cf8] shadow-[0_0_8px_#818cf8]" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Account Selector in Sidebar Bottom */}
        <div className="p-4 border-t border-white/[0.07] space-y-3">
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Compte Actif</label>
            <select
              value={activeAccountId || ''}
              onChange={(e) => setActiveAccountId(e.target.value || null)}
              className="w-full bg-[#14161f] border border-white/10 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-[#6366f1] transition-all cursor-pointer"
            >
              <option value="">Tous les comptes</option>
              {accounts.map(acc => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} ({acc.currency})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => supabase.auth.signOut()}
            className="w-full flex items-center justify-center gap-2 text-xs font-semibold text-slate-400 hover:text-red-400 py-1.5 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Déconnexion</span>
          </button>
        </div>
      </aside>

      {/* ── MAIN CONTENT AREA ────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* ── HEADER BAR ──────────────────────────────────────────────── */}
        <header className="h-16 bg-[#0d0e14]/80 border-b border-white/[0.07] px-4 md:px-6 flex items-center justify-between shrink-0 gap-2 backdrop-blur-xl">
          <div className="flex items-center gap-3 min-w-0">
            <h1 className="text-sm md:text-base font-bold text-white tracking-tight capitalize truncate">
              {NAV_ITEMS.find(n => n.id === currentTab)?.name}
            </h1>
            
            {/* Account Selector dropdown in Mobile & Desktop Header */}
            <div className="flex items-center gap-2">
              <select
                value={activeAccountId || ''}
                onChange={(e) => setActiveAccountId(e.target.value || null)}
                className="bg-[#14161f] border border-white/10 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-white focus:outline-none focus:border-[#6366f1] transition-colors cursor-pointer max-w-[150px] md:max-w-[200px] truncate"
              >
                <option value="">Tous les comptes</option>
                {accounts.map(acc => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} ({acc.currency})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Locked status banner indicator */}
            {isLocked && (
              <div className="flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 shadow-red-500/10">
                <Lock className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Session Verrouillée</span>
              </div>
            )}

            {/* Logout button mobile */}
            <button
              onClick={() => supabase.auth.signOut()}
              className="md:hidden p-2 text-slate-400 hover:text-red-400 hover:bg-white/5 rounded-xl transition-colors"
              title="Déconnexion"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* ── PAGE CONTENT ────────────────────────────────────────────── */}
        <main className="flex-1 p-4 md:p-6 overflow-y-auto pb-20 md:pb-6">
          {children}
        </main>
      </div>

      {/* ── MOBILE BOTTOM NAVIGATION ─────────────────────────────────── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#121318] border-t border-[#262833] z-50 flex justify-around p-2">
        {NAV_ITEMS.map(({ id, name, icon: Icon }) => {
          const active = currentTab === id;
          return (
            <button
              key={id}
              onClick={() => setCurrentTab(id)}
              className={`flex flex-col items-center gap-1 p-2 rounded-xl text-[10px] font-semibold transition-colors ${
                active ? 'text-[#818cf8]' : 'text-slate-400'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{name.split(' ')[0]}</span>
            </button>
          );
        })}
      </nav>

    </div>
  );
};
