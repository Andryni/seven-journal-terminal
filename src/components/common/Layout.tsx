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

  const activeAccount = accounts.find(acc => acc.id === activeAccountId);

  return (
    <div className="min-h-screen bg-[#0e0f12] text-slate-100 flex font-sans selection:bg-[#6366f1]/30 selection:text-white">
      
      {/* ── DESKTOP SIDEBAR ────────────────────────────────────────────── */}
      <aside className="w-64 bg-[#121318] border-r border-[#262833] hidden md:flex flex-col shrink-0 z-20">
        
        {/* Logo Seven Tracking */}
        <div className="h-16 px-6 flex items-center gap-3 border-b border-[#262833]">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#6366f1] to-[#4f46e5] flex items-center justify-center shadow-indigo-glow">
            <BarChart3 className="w-4.5 h-4.5 text-white" />
          </div>
          <div>
            <div className="text-sm font-black tracking-tight text-white flex items-center gap-1">
              SEVEN<span className="text-[#6366f1]">TRACKING</span>
            </div>
            <div className="text-[10px] font-medium text-slate-400">Journal & Analytics</div>
          </div>
        </div>

        {/* Action Button "+ Ajouter Trade" */}
        <div className="p-4">
          <button
            onClick={() => setCurrentTab('trades')}
            className="w-full bg-[#6366f1] hover:bg-[#4f46e5] text-white font-semibold text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-indigo-glow transition-all active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span>Ajouter un trade</span>
          </button>
        </div>

        {/* Navigation items */}
        <nav className="flex-1 px-3 space-y-1 py-2">
          {NAV_ITEMS.map(({ id, name, icon: Icon }) => {
            const active = currentTab === id;
            return (
              <button
                key={id}
                onClick={() => setCurrentTab(id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  active
                    ? 'bg-[#6366f1]/10 text-[#818cf8] border border-[#6366f1]/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#181920]'
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? 'text-[#818cf8]' : 'text-slate-400'}`} />
                <span>{name}</span>
              </button>
            );
          })}
        </nav>

        {/* Account Selector in Sidebar Bottom */}
        <div className="p-4 border-t border-[#262833] space-y-3">
          <div className="space-y-1">
            <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Compte Actif</label>
            <select
              value={activeAccountId || ''}
              onChange={(e) => setActiveAccountId(e.target.value || null)}
              className="w-full bg-[#181920] border border-[#262833] rounded-xl px-3 py-2 text-xs font-medium text-white focus:outline-none focus:border-[#6366f1] transition-colors cursor-pointer"
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
            className="w-full flex items-center justify-center gap-2 text-xs text-slate-400 hover:text-red-400 py-1.5 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Déconnexion</span>
          </button>
        </div>
      </aside>

      {/* ── MAIN CONTENT AREA ────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* ── HEADER BAR ──────────────────────────────────────────────── */}
        <header className="h-16 bg-[#121318] border-b border-[#262833] px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <h1 className="text-base font-bold text-white tracking-tight capitalize">
              {NAV_ITEMS.find(n => n.id === currentTab)?.name}
            </h1>
            {activeAccount && (
              <span className="text-xs font-medium px-2.5 py-1 rounded-lg bg-[#181920] border border-[#262833] text-slate-300">
                {activeAccount.name} · ${activeAccount.balance.toLocaleString()}
              </span>
            )}
          </div>

          {/* Locked status banner indicator */}
          {isLocked && (
            <div className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400">
              <Lock className="w-3.5 h-3.5" />
              <span>Session Verrouillée</span>
            </div>
          )}
        </header>

        {/* ── PAGE CONTENT ────────────────────────────────────────────── */}
        <main className="flex-1 overflow-hidden flex flex-col min-h-0 p-4 md:p-6 pb-20 md:pb-6">
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
