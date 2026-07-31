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
import { Goals } from './features/goals/Goals';
import type { Session } from '@supabase/supabase-js';

import { ErrorBoundary } from './components/common/ErrorBoundary';
import LoginCardSection from './components/ui/LoginCardSection';

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

  // If not logged in, show Nova / LoginCardSection Auth Page (21st.dev Style)
  if (!session) {
    return (
      <LoginCardSection
        email={email}
        setEmail={setEmail}
        password={password}
        setPassword={setPassword}
        isSignUp={isSignUp}
        setIsSignUp={setIsSignUp}
        authError={authError}
        onSubmit={handleAuth}
      />
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
        {currentTab === 'goals' && <Goals />}
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
