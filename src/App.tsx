import { useState, useEffect } from 'react';
import { supabase } from './lib/supabaseClient';
import { AppProviders } from './providers/AppProviders';
import { Layout } from './components/common/Layout';
import type { TabType } from './components/common/Layout';
import { Dashboard } from './features/dashboard/Dashboard';
import { Trades } from './features/trades/Trades';
import { Accounts } from './features/accounts/Accounts';
import { Analytics } from './features/analytics/Analytics';
import { Calendar } from './features/calendar/Calendar';
import { Playbook } from './features/playbook/Playbook';
import { Button } from './components/ui/Button';
import { Input } from './components/ui/Input';
import { TrendingUp, AlertTriangle } from 'lucide-react';
import type { Session } from '@supabase/supabase-js';

import { ErrorBoundary } from './components/common/ErrorBoundary';

function AppContent() {
  const [session, setSession] = useState<Session | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [authError, setAuthError] = useState('');
  const [currentTab, setCurrentTab] = useState<TabType>('dashboard');

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        alert('Inscription réussie ! Veuillez vérifier vos e-mails pour confirmer.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err: any) {
      setAuthError(err.message || 'Erreur d\'authentification');
    }
  };

  // If not logged in, show Auth form (Bloomberg Terminal style premium)
  if (!session) {
    return (
      <div className="min-h-screen bg-bloomberg-bg font-mono flex items-center justify-center p-4 relative overflow-hidden">
        {/* Background grid */}
        <div className="absolute inset-0 bg-grid opacity-40" />

        {/* Radial glow center */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_50%,rgba(217,119,6,0.06)_0%,transparent_60%)]" />

        {/* Scan line */}
        <div className="scan-overlay absolute inset-0 pointer-events-none" />

        {/* Corner accents */}
        <div className="absolute top-0 left-0 w-16 h-16 border-t-2 border-l-2 border-bloomberg-gold/30 pointer-events-none" />
        <div className="absolute top-0 right-0 w-16 h-16 border-t-2 border-r-2 border-bloomberg-gold/30 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-16 h-16 border-b-2 border-l-2 border-bloomberg-gold/30 pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-16 h-16 border-b-2 border-r-2 border-bloomberg-gold/30 pointer-events-none" />

        <div className="relative w-full max-w-sm animate-fade-in-up">
          {/* Card top accent */}
          <div className="h-px bg-gradient-to-r from-transparent via-bloomberg-gold to-transparent mb-px" />

          <div className="bg-bloomberg-surface/90 border border-bloomberg-border backdrop-blur-md p-8 space-y-7">
            {/* Logo block */}
            <div className="text-center space-y-3">
              <div className="inline-flex items-center justify-center w-14 h-14 border border-bloomberg-gold/30 bg-bloomberg-gold/5 mb-1 animate-float relative">
                <TrendingUp className="w-7 h-7 text-bloomberg-gold" />
                <div className="absolute inset-0 bg-bloomberg-gold/5 blur-xl animate-glow-pulse" />
              </div>
              <div>
                <h1 className="text-lg font-extrabold tracking-[0.25em] text-white">
                  SEVEN <span className="shimmer-text">JOURNAL</span>
                </h1>
                <p className="text-[9px] text-bloomberg-text-secondary uppercase tracking-[0.2em] mt-1">
                  Terminal de Trading Discipliné · V2.0
                </p>
              </div>
              <div className="flex items-center justify-center gap-3 text-[8px] text-bloomberg-text-muted uppercase tracking-widest">
                <span>SMC/ICT</span>
                <span className="w-1 h-1 rounded-full bg-bloomberg-gold/40 inline-block" />
                <span>Bookmap</span>
                <span className="w-1 h-1 rounded-full bg-bloomberg-gold/40 inline-block" />
                <span>Goggins</span>
              </div>
            </div>

            {/* Separator */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-bloomberg-border" />
              <span className="text-[9px] text-bloomberg-text-muted uppercase tracking-widest">
                {isSignUp ? 'Créer un compte' : 'Connexion sécurisée'}
              </span>
              <div className="flex-1 h-px bg-bloomberg-border" />
            </div>

            <form onSubmit={handleAuth} className="space-y-4">
              {authError && (
                <div className="p-3 bg-bloomberg-red/8 border border-bloomberg-red/40 text-bloomberg-red-light text-[10px] flex items-start space-x-2 animate-fade-in">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>{authError}</span>
                </div>
              )}

              <Input
                label="Adresse email"
                placeholder="trader@seven-journal.com"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <Input
                label="Mot de passe"
                placeholder="••••••••••••"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

              <Button type="submit" className="w-full py-2 mt-2 tracking-[0.2em]">
                {isSignUp ? "CRÉER LE COMPTE" : "CONNEXION →"}
              </Button>
            </form>

            <div className="text-center border-t border-bloomberg-border/40 pt-4">
              <button
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-[9px] text-bloomberg-text-secondary hover:text-bloomberg-gold transition-colors uppercase tracking-widest"
              >
                {isSignUp ? "Déjà membre ? Se connecter" : "Nouveau ? Créer un compte"}
              </button>
            </div>
          </div>

          {/* Bottom accent */}
          <div className="h-px bg-gradient-to-r from-transparent via-bloomberg-gold/30 to-transparent mt-px" />
        </div>
      </div>
    );
  }

  // Render view wrapped in ErrorBoundary
  return (
    <Layout currentTab={currentTab} setCurrentTab={setCurrentTab}>
      <ErrorBoundary>
        {currentTab === 'dashboard' && <Dashboard />}
        {currentTab === 'trades' && <Trades />}
        {currentTab === 'accounts' && <Accounts />}
        {currentTab === 'analytics' && <Analytics />}
        {currentTab === 'calendar' && <Calendar />}
        {currentTab === 'playbook' && <Playbook />}
      </ErrorBoundary>
    </Layout>
  );
}

function App() {
  return (
    <AppProviders>
      <AppContent />
    </AppProviders>
  );
}

export default App;
