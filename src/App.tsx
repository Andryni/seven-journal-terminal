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
import type { Session } from '@supabase/supabase-js';

import { ErrorBoundary } from './components/common/ErrorBoundary';
import {
  AuthTabs,
  Ripple,
  TechOrbitDisplay,
  type IconConfig,
} from './components/ui/ModernAnimatedSignIn';

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

  // If not logged in, show Modern Animated Auth Page (21st.dev Style)
  if (!session) {
    const tradingIcons: IconConfig[] = [
      {
        component: () => (
          <div className="w-9 h-9 rounded-xl bg-[#6366f1]/20 border border-[#6366f1]/40 flex items-center justify-center text-emerald-400 font-bold font-mono text-xs shadow-indigo-glow">
            +R
          </div>
        ),
        className: 'size-[36px] border-none bg-transparent',
        duration: 25,
        delay: 0,
        radius: 110,
        path: true,
        reverse: false,
      },
      {
        component: () => (
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold font-mono text-xs shadow-green-glow">
            TP
          </div>
        ),
        className: 'size-[36px] border-none bg-transparent',
        duration: 20,
        delay: 5,
        radius: 170,
        path: true,
        reverse: true,
      },
      {
        component: () => (
          <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300 font-bold font-mono text-xs">
            BOS
          </div>
        ),
        className: 'size-[36px] border-none bg-transparent',
        duration: 30,
        delay: 10,
        radius: 230,
        path: true,
        reverse: false,
      },
      {
        component: () => (
          <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300 font-bold font-mono text-xs">
            FVG
          </div>
        ),
        className: 'size-[36px] border-none bg-transparent',
        duration: 22,
        delay: 15,
        radius: 290,
        path: true,
        reverse: true,
      },
    ];

    const formFields = {
      header: isSignUp ? 'Créer un compte' : 'Bon retour',
      subHeader: isSignUp
        ? 'Rejoignez Seven Tracking pour suivre vos performances'
        : 'Connectez-vous à votre terminal de trading',
      fields: [
        {
          label: 'Email',
          required: true,
          type: 'email' as const,
          placeholder: 'trader@seventracking.com',
          value: email,
          onChange: (e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value),
        },
        {
          label: 'Mot de passe',
          required: true,
          type: 'password' as const,
          placeholder: '••••••••••••',
          value: password,
          onChange: (e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value),
        },
      ],
      submitButton: isSignUp ? "S'inscrire" : 'Se connecter',
      textVariantButton: isSignUp
        ? 'Déjà un compte ? Connectez-vous'
        : "Pas encore de compte ? S'inscrire",
      errorField: authError,
    };

    return (
      <div className="min-h-screen bg-[#07080a] text-slate-100 font-sans relative overflow-hidden flex">
        {/* Modern Animated Sign In Component */}
        <section className="flex w-full min-h-screen">
          {/* Left Side: Tech/Trading Orbit Display & Ripples */}
          <span className="relative flex flex-col justify-center w-1/2 max-lg:hidden bg-slate-950/40 border-r border-white/[0.06]">
            <Ripple mainCircleSize={120} />
            <TechOrbitDisplay
              iconsArray={tradingIcons}
              text="SEVEN TRACKING"
              subtext="Terminal de Trading & Analytics"
            />
          </span>

          {/* Right Side: Animated Form */}
          <span className="w-1/2 h-screen flex flex-col justify-center items-center max-lg:w-full max-lg:px-[10%] bg-[#08090d]/90 backdrop-blur-xl">
            <AuthTabs
              formFields={formFields}
              goTo={() => {
                setAuthError('');
                setIsSignUp(!isSignUp);
              }}
              handleSubmit={(e) => handleAuth(e)}
            />
          </span>
        </section>
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
