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

  // If not logged in, show Auth form (TradeZella Pro Style)
  if (!session) {
    return (
      <div className="min-h-screen bg-[#0e0f12] text-slate-100 font-sans flex items-center justify-center p-4 relative overflow-hidden">
        {/* Background Trading Graphic Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-30 mix-blend-luminosity scale-105 animate-pulse-subtle" 
          style={{ backgroundImage: `url('/assets/trading_auth_bg.png')` }}
        />

        {/* Dynamic Glowing Gradients */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#6366f1]/15 rounded-full blur-3xl pointer-events-none animate-pulse-glow" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#10b981]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative w-full max-w-md animate-scale-up z-10">
          <div className="bg-[#181920]/90 border border-[#262833] backdrop-blur-xl rounded-2xl p-8 space-y-6 shadow-2xl shadow-black/80">
            
            {/* Logo & Branding */}
            <div className="text-center space-y-3">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[#6366f1] via-[#4f46e5] to-[#10b981] p-0.5 shadow-indigo-glow group">
                <div className="w-full h-full bg-[#121318] rounded-[14px] flex items-center justify-center">
                  <TrendingUp className="w-8 h-8 text-[#818cf8] group-hover:scale-110 transition-transform duration-300" />
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight text-white flex items-center justify-center gap-1.5">
                  SEVEN<span className="text-[#6366f1] bg-clip-text text-transparent bg-gradient-to-r from-[#6366f1] to-[#818cf8]">TRACKING</span>
                </h1>
                <p className="text-xs font-medium text-slate-400 mt-1">
                  Terminal de Trading & Analytics Professionnel
                </p>
              </div>
            </div>

            {/* Form Header */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-[#262833]" />
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                {isSignUp ? 'Créer un compte' : 'Connexion sécurisée'}
              </span>
              <div className="flex-1 h-px bg-[#262833]" />
            </div>

            <form onSubmit={handleAuth} className="space-y-4">
              {authError && (
                <div className="p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs flex items-start space-x-2 animate-fade-in">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{authError}</span>
                </div>
              )}

              <Input
                label="Adresse email"
                placeholder="trader@seventracking.com"
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

              <Button type="submit" className="w-full py-3 mt-2 text-xs font-bold tracking-wider uppercase bg-[#6366f1] hover:bg-[#4f46e5] shadow-indigo-glow transition-all rounded-xl">
                {isSignUp ? "Créer mon compte" : "Se connecter →"}
              </Button>
            </form>

            <div className="text-center border-t border-[#262833] pt-4">
              <button
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-xs font-medium text-slate-400 hover:text-[#818cf8] transition-colors"
              >
                {isSignUp ? "Déjà un compte ? Connectez-vous" : "Pas encore de compte ? S'inscrire"}
              </button>
            </div>
          </div>
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
