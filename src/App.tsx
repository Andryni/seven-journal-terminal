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
        {/* Background Trading Graphic Image Overlay */}
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-15 mix-blend-luminosity scale-105 pointer-events-none" 
          style={{ backgroundImage: `url('/assets/trading_auth_bg.png')` }}
        />

        {/* Animated Cybernetic Grid Background */}
        <div 
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            backgroundImage: `linear-gradient(to right, rgba(99, 102, 241, 0.15) 1px, transparent 1px),
                              linear-gradient(to bottom, rgba(99, 102, 241, 0.15) 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
          }}
        />

        {/* Dynamic Animated Glowing Orbs & Beams */}
        <div className="absolute -top-32 -left-32 w-[500px] h-[500px] bg-[#6366f1]/20 rounded-full blur-[120px] pointer-events-none animate-pulse-glow" />
        <div className="absolute top-1/2 -right-32 w-[600px] h-[600px] bg-[#8b5cf6]/15 rounded-full blur-[140px] pointer-events-none animate-float" />
        <div className="absolute -bottom-40 left-1/3 w-[550px] h-[550px] bg-[#10b981]/15 rounded-full blur-[130px] pointer-events-none animate-pulse-glow" />
        <div className="absolute top-1/4 right-1/4 w-[350px] h-[350px] bg-[#06b6d4]/12 rounded-full blur-[100px] pointer-events-none animate-float" />

        {/* Floating Trading SVG Particles (Market Tickers / Dots) */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" xmlns="http://www.w3.org/2000/svg">
          {[
            { cx: '12%', cy: '18%', r: 2.5, dur: '7s', color: '#6366f1', delay: '0s' },
            { cx: '82%', cy: '14%', r: 2, dur: '9s', color: '#8b5cf6', delay: '1s' },
            { cx: '22%', cy: '78%', r: 3.5, dur: '6s', color: '#06b6d4', delay: '2s' },
            { cx: '68%', cy: '62%', r: 2.5, dur: '8s', color: '#10b981', delay: '0.5s' },
            { cx: '48%', cy: '28%', r: 1.5, dur: '10s', color: '#818cf8', delay: '3s' },
            { cx: '32%', cy: '48%', r: 3, dur: '7s', color: '#6366f1', delay: '1.5s' },
            { cx: '88%', cy: '82%', r: 2, dur: '9s', color: '#34d399', delay: '4s' },
            { cx: '58%', cy: '88%', r: 2.5, dur: '6s', color: '#8b5cf6', delay: '2.5s' },
          ].map((p, i) => (
            <circle
              key={i}
              cx={p.cx}
              cy={p.cy}
              r={p.r}
              fill={p.color}
              opacity="0.6"
              style={{
                animation: `particleFloat ${p.dur} ease-in-out ${p.delay} infinite`,
              }}
            />
          ))}
        </svg>

        {/* Modern Animated Sign In Component */}
        <section className="flex w-full min-h-screen z-10 relative">
          {/* Left Side: Tech/Trading Orbit Display & Ripples */}
          <span className="relative flex flex-col justify-center w-1/2 max-lg:hidden bg-slate-950/30 backdrop-blur-md border-r border-white/[0.08]">
            <Ripple mainCircleSize={120} />
            <TechOrbitDisplay
              iconsArray={tradingIcons}
              text="SEVEN TRACKING"
              subtext="Terminal de Trading & Analytics"
            />
          </span>

          {/* Right Side: Animated Form */}
          <span className="w-1/2 h-screen flex flex-col justify-center items-center max-lg:w-full max-lg:px-[10%] bg-[#08090d]/80 backdrop-blur-2xl">
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
