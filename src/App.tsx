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
      <div className="min-h-screen bg-[#07080a] text-slate-100 font-sans flex items-center justify-center p-4 relative overflow-hidden">
        {/* Background Trading Graphic Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-20 mix-blend-luminosity scale-105" 
          style={{ backgroundImage: `url('/assets/trading_auth_bg.png')` }}
        />

        {/* Animated SVG Particles */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
          {[
            { cx: '10%',  cy: '20%', r: 2,   dur: '7s',  color: '#6366f1', delay: '0s'   },
            { cx: '85%',  cy: '15%', r: 1.5, dur: '9s',  color: '#8b5cf6', delay: '1s'   },
            { cx: '20%',  cy: '75%', r: 3,   dur: '6s',  color: '#06b6d4', delay: '2s'   },
            { cx: '70%',  cy: '60%', r: 2,   dur: '8s',  color: '#10b981', delay: '0.5s' },
            { cx: '50%',  cy: '30%', r: 1,   dur: '10s', color: '#818cf8', delay: '3s'   },
            { cx: '30%',  cy: '50%', r: 2.5, dur: '7s',  color: '#6366f1', delay: '1.5s' },
            { cx: '90%',  cy: '80%', r: 1.5, dur: '9s',  color: '#34d399', delay: '4s'   },
            { cx: '60%',  cy: '90%', r: 2,   dur: '6s',  color: '#8b5cf6', delay: '2.5s' },
          ].map((p, i) => (
            <circle key={i} cx={p.cx} cy={p.cy} r={p.r} fill={p.color} opacity="0.5"
              style={{ animation: `particleFloat ${p.dur} ease-in-out ${p.delay} infinite`, '--dur': p.dur } as React.CSSProperties} />
          ))}
        </svg>

        {/* Dynamic Glowing Orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#6366f1]/12 rounded-full blur-3xl pointer-events-none animate-pulse-glow" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#8b5cf6]/08 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-3/4 left-3/4 w-64 h-64 bg-[#06b6d4]/06 rounded-full blur-3xl pointer-events-none" />

        <div className="relative w-full max-w-md animate-scale-up z-10">
          <div className="bg-[#181920]/85 border border-white/[0.08] backdrop-blur-2xl rounded-2xl p-8 space-y-6 shadow-card-premium">
            
            {/* Logo & Branding */}
            <div className="text-center space-y-3">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[#6366f1] via-[#4f46e5] to-[#10b981] p-0.5 shadow-indigo-glow group">
                <div className="w-full h-full bg-[#121318] rounded-[14px] flex items-center justify-center">
                  <TrendingUp className="w-8 h-8 text-[#818cf8] group-hover:scale-110 transition-transform duration-300" />
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-heading font-black tracking-tight text-white flex items-center justify-center gap-1.5">
                  SEVEN<span className="text-[#6366f1] bg-clip-text text-transparent bg-gradient-to-r from-[#6366f1] to-[#818cf8]">TRACKING</span>
                </h1>
                <p className="text-xs font-sans font-medium text-slate-400 mt-1">
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

              <Button type="submit" className="w-full py-3 mt-2 text-xs font-heading font-bold tracking-wider uppercase bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] hover:from-[#4f46e5] hover:to-[#7c3aed] shadow-indigo-glow transition-all rounded-xl shimmer-btn">
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
