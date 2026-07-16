import React from 'react';
import { useUIStore } from '../../store/uiStore';
import { useAccounts } from '../../features/accounts/useAccounts';
import { useDailyLock } from '../../features/guard/useDailyLock';
import { 
  LayoutDashboard, 
  BookOpen, 
  Wallet, 
  Lock, 
  TrendingUp,
  BarChart3,
  CalendarRange,
  BookMarked,
  ChevronRight,
  Signal,
  LogOut
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

export type TabType = 'dashboard' | 'trades' | 'accounts' | 'analytics' | 'calendar' | 'playbook';

interface LayoutProps {
  children: React.ReactNode;
  currentTab: TabType;
  setCurrentTab: (tab: TabType) => void;
}

const NAV_ITEMS = [
  { id: 'dashboard' as const, name: 'DASHBOARD', icon: LayoutDashboard, label: 'Vue globale' },
  { id: 'trades'    as const, name: 'JOURNAL', icon: BookOpen,        label: 'Historique des trades' },
  { id: 'analytics' as const, name: 'ANALYTICS', icon: BarChart3,      label: 'Performance avancée' },
  { id: 'calendar'  as const, name: 'CALENDRIER', icon: CalendarRange,  label: 'Vue journalière' },
  { id: 'playbook'  as const, name: 'PLAYBOOK', icon: BookMarked,      label: 'Notes & Débrief' },
  { id: 'accounts'  as const, name: 'COMPTES', icon: Wallet,           label: 'Gestion des comptes' },
] as const;

export const Layout: React.FC<LayoutProps> = ({ children, currentTab, setCurrentTab }) => {
  const { activeAccountId, setActiveAccountId, sidebarOpen } = useUIStore();
  const { accounts } = useAccounts();
  const { isLocked, lock } = useDailyLock();

  const activeAccount = accounts.find(acc => acc.id === activeAccountId);

  return (
    <div className="min-h-screen bg-[#020515] text-bloomberg-text-primary flex flex-col font-sans selection:bg-[#0075ff]/30 selection:text-white relative overflow-hidden">
      
      {/* Background gradients for vision UI */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-gradient-to-br from-[#0075ff]/10 to-transparent rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-gradient-to-tl from-[#8400ff]/5 to-transparent rounded-full blur-[100px] pointer-events-none" />
      
      {/* ── DANGER BANNER ─────────────────────────────────────────────── */}
      {isLocked && (
        <div className="bg-bloomberg-red/10 border-b border-bloomberg-red/40 px-3 md:px-5 py-2 flex items-center justify-between text-[10px] animate-fade-in">
          <div className="flex items-center space-x-2">
            <div className="w-1.5 h-1.5 rounded-full bg-bloomberg-red-light animate-blink shrink-0" />
            <Lock className="w-3.5 h-3.5 text-bloomberg-red-light shrink-0" />
            <span className="font-bold text-bloomberg-red-light tracking-widest uppercase text-[9px] md:text-[10px]">
              SESSION VERROUILLÉE
            </span>
            <span className="hidden md:inline text-bloomberg-red/70 italic">
              "{lock?.lock_reason || 'La discipline avant tout.'}"
            </span>
          </div>
          <span className="text-bloomberg-red-light font-bold uppercase tracking-widest border border-bloomberg-red/30 px-2 py-0.5 text-[9px] hidden sm:block">
            ⛔ PAS DE REVENGE TRADING
          </span>
        </div>
      )}

      {/* ── TOPBAR ────────────────────────────────────────────────────── */}
      <header className="h-11 border-b border-bloomberg-border bg-bloomberg-surface/60 backdrop-blur-xl flex items-center justify-between px-3 md:px-5 shrink-0 relative z-10">
        {/* Top accent line */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-bloomberg-gold/40 to-transparent" />

        {/* Logo */}
        <div className="flex items-center gap-2 md:gap-3">
          <div className="flex items-center gap-1.5 group">
            <div className="relative">
              <TrendingUp className="w-4 h-4 text-bloomberg-gold transition-transform duration-300 group-hover:scale-110" />
            </div>
            <span className="text-[11px] font-extrabold tracking-[0.15em] md:tracking-[0.2em] text-white">
              SEVEN<span className="text-bloomberg-gold ml-1">JOURNAL</span>
            </span>
          </div>
          <span className="hidden sm:inline text-[8px] text-bloomberg-text-muted border border-bloomberg-border px-1.5 py-0.5 tracking-widest">
            TERMINAL&nbsp;V2
          </span>
        </div>

        {/* Account selector + live indicator + logout */}
        <div className="flex items-center gap-2 md:gap-4">
          <div className="hidden sm:flex items-center gap-1.5 text-[9px] text-bloomberg-text-secondary">
            <Signal className="w-3 h-3 text-bloomberg-green-light animate-pulse" />
            <span className="text-bloomberg-green-light font-bold">LIVE</span>
          </div>
          <div className="flex items-center gap-1 md:gap-2">
            <span className="text-[9px] text-bloomberg-text-secondary uppercase tracking-wider hidden lg:block">Compte :</span>
            <select
              value={activeAccountId || ''}
              onChange={(e) => setActiveAccountId(e.target.value || null)}
              className="bg-bloomberg-bg border border-bloomberg-border text-[9px] md:text-[10px] px-1.5 md:px-2.5 py-1 font-mono text-white focus:outline-none focus:border-bloomberg-gold cursor-pointer transition-colors hover:border-bloomberg-border-bright max-w-[110px] md:max-w-none truncate"
            >
              <option value="">[ TOUS ]</option>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name.toUpperCase().substring(0, 12)}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => supabase.auth.signOut()}
            className="flex items-center gap-1 md:gap-1.5 border border-bloomberg-border hover:border-bloomberg-red-light/50 hover:bg-bloomberg-red/10 text-bloomberg-text-secondary hover:text-bloomberg-red-light transition-all text-[10px] px-2 md:px-2.5 py-1 font-mono uppercase tracking-wider"
            title="Déconnexion sécurisée"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden md:inline">DECONNEXION</span>
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        
        {/* ── SIDEBAR (desktop only) ───────────────────────────────────── */}
        <aside className={`hidden md:flex border-r border-bloomberg-border bg-bloomberg-surface/30 backdrop-blur-xl flex-col justify-between shrink-0 transition-all duration-300 ease-out ${sidebarOpen ? 'w-52' : 'w-14'}`}>
          
          <nav className="p-2 space-y-0.5 mt-1">
            {NAV_ITEMS.map((item, idx) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentTab(item.id)}
                  style={{ animationDelay: `${idx * 40}ms` }}
                  className={[
                    'w-full flex items-center gap-3 px-3 py-2.5 text-left transition-all duration-150 relative group animate-slide-in-left',
                    isActive
                      ? 'nav-active-indicator bg-[#0075ff]/10 text-bloomberg-gold border-r-0'
                      : 'text-bloomberg-text-secondary hover:text-white hover:bg-white/5',
                  ].join(' ')}
                  title={!sidebarOpen ? item.name : undefined}
                >
                  <Icon className={`w-4 h-4 shrink-0 transition-colors duration-150 ${isActive ? 'text-bloomberg-gold' : 'text-bloomberg-text-secondary group-hover:text-white'}`} />
                  {sidebarOpen && (
                    <div className="flex flex-col min-w-0">
                      <span className={`text-[10px] font-bold tracking-widest truncate ${isActive ? 'text-bloomberg-gold' : ''}`}>
                        {item.name}
                      </span>
                    </div>
                  )}
                  {sidebarOpen && isActive && (
                    <ChevronRight className="w-3 h-3 text-bloomberg-gold/50 ml-auto shrink-0" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Sidebar footer */}
          <div className="p-3 border-t border-bloomberg-border text-[9px] text-bloomberg-text-secondary bg-bloomberg-bg/40">
            {sidebarOpen ? (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-bloomberg-text-muted uppercase tracking-widest">Status</span>
                  <div className="flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isLocked ? 'bg-bloomberg-red animate-blink' : 'bg-bloomberg-green'}`} />
                    <span className={`font-bold uppercase ${isLocked ? 'text-bloomberg-red' : 'text-bloomberg-green-light'}`}>
                      {isLocked ? 'LOCK' : 'OK'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-bloomberg-text-muted uppercase tracking-widest">Compte</span>
                  <span className="text-white font-semibold truncate max-w-[90px] text-right">
                    {activeAccount ? activeAccount.name.toUpperCase().substring(0, 10) : 'ALL'}
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex justify-center">
                <span className={`w-2 h-2 rounded-full ${isLocked ? 'bg-bloomberg-red animate-blink' : 'bg-bloomberg-green animate-glow-pulse'}`} />
              </div>
            )}
          </div>
        </aside>

        {/* ── MAIN CONTENT ──────────────────────────────────────────── */}
        <main className="flex-1 overflow-y-auto bg-transparent bg-grid relative">
          <div className="ambient-glow-1" />
          <div className="ambient-glow-2" />
          {/* Subtle vignette overlay */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#020515]/30 via-transparent to-[#020515]/10 z-0" />
          
          <div className="relative z-10 max-w-screen-2xl mx-auto p-3 md:p-6 pb-20 md:pb-6">
            <div className="page-enter">
              {children}
            </div>
          </div>
        </main>
      </div>

      {/* ── BOTTOM NAV (mobile only) ───────────────────────────────────── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#060b28]/80 backdrop-blur-xl border-t border-bloomberg-border z-50 flex items-center justify-around px-1 py-1.5 safe-area-bottom">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              className={`flex flex-col items-center gap-0.5 px-2 py-1 min-w-0 flex-1 transition-all duration-150 ${
                isActive ? 'text-bloomberg-gold' : 'text-bloomberg-text-secondary'
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-bloomberg-gold' : ''}`} />
              <span className={`text-[8px] font-bold tracking-wider truncate w-full text-center ${isActive ? 'text-bloomberg-gold' : 'text-bloomberg-text-muted'}`}>
                {item.name}
              </span>
              {isActive && <div className="w-4 h-0.5 bg-bloomberg-gold rounded-full" />}
            </button>
          );
        })}
      </nav>
    </div>
  );
};
