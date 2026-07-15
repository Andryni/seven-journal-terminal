-- 1. EXTENSIONS & PRÉREQUIS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Fonction utilitaire pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 2. TABLE DES COMPTES DE TRADING
CREATE TABLE public.trading_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('challenge', 'funded', 'personal', 'demo')),
    balance NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    initial_balance NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    currency TEXT NOT NULL DEFAULT 'USD',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index pour accélérer les requêtes par utilisateur et compte actif
CREATE INDEX idx_trading_accounts_user ON public.trading_accounts(user_id);
CREATE INDEX idx_trading_accounts_active ON public.trading_accounts(user_id) WHERE is_active = true;

ALTER TABLE public.trading_accounts ENABLE ROW LEVEL SECURITY;

-- Policies RLS pour trading_accounts
CREATE POLICY "Users can manage their own accounts" 
    ON public.trading_accounts
    FOR ALL 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_trading_accounts_modtime
    BEFORE UPDATE ON public.trading_accounts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- 3. TABLE DES TRADES (Journal principal)
CREATE TABLE public.trades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES public.trading_accounts(id) ON DELETE CASCADE,
    pair TEXT NOT NULL,
    direction TEXT NOT NULL CHECK (direction IN ('BUY', 'SELL')),
    entry_price NUMERIC(15, 5) NOT NULL,
    exit_price NUMERIC(15, 5),
    stop_loss NUMERIC(15, 5) NOT NULL,
    take_profit NUMERIC(15, 5) NOT NULL,
    size NUMERIC(10, 2) NOT NULL,
    entry_time TIMESTAMPTZ NOT NULL,
    exit_time TIMESTAMPTZ,
    pnl NUMERIC(15, 2),
    r_multiple NUMERIC(6, 2),
    timeframe TEXT NOT NULL CHECK (timeframe IN ('M1', 'M5', 'M15', 'H1', 'H4', 'D1')),
    
    -- SMC/ICT confirmations
    setup_structures TEXT[] DEFAULT '{}',
    setup_fvg BOOLEAN NOT NULL DEFAULT false,
    setup_ob BOOLEAN NOT NULL DEFAULT false,
    setup_liquidity_sweep BOOLEAN NOT NULL DEFAULT false,
    
    -- Bookmap Order Flow confirmations
    bookmap_absorption TEXT,
    bookmap_passive_orders TEXT,
    bookmap_aggressive_orders TEXT,
    bookmap_vwap_position TEXT CHECK (bookmap_vwap_position IN ('above', 'below', 'at')),
    
    -- Goggins / Mental State
    mental_state TEXT NOT NULL CHECK (mental_state IN ('focused', 'anxious', 'greedy', 'revenge', 'fomo', 'tired')),
    cookie_jar_ref BOOLEAN NOT NULL DEFAULT false,
    rule_40_percent BOOLEAN NOT NULL DEFAULT false,
    
    -- Médias & Remarques
    screenshot_before_url TEXT,
    screenshot_after_url TEXT,
    notes TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_trades_account ON public.trades(account_id);
CREATE INDEX idx_trades_user_date ON public.trades(user_id, entry_time DESC);

ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;

-- Policies RLS pour trades
CREATE POLICY "Users can manage their own trades" 
    ON public.trades
    FOR ALL 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_trades_modtime
    BEFORE UPDATE ON public.trades
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- 4. TABLE DES VERROUILLAGES DE SESSION
CREATE TABLE public.daily_session_locks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    sl_count INTEGER NOT NULL DEFAULT 0,
    is_locked BOOLEAN NOT NULL DEFAULT false,
    locked_at TIMESTAMPTZ,
    unlock_at TIMESTAMPTZ,
    lock_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT unique_user_daily_lock UNIQUE (user_id, date)
);

CREATE INDEX idx_daily_session_locks_user_date ON public.daily_session_locks(user_id, date);

ALTER TABLE public.daily_session_locks ENABLE ROW LEVEL SECURITY;

-- Policies RLS pour daily_session_locks
CREATE POLICY "Users can manage their own daily locks" 
    ON public.daily_session_locks
    FOR ALL 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_daily_session_locks_modtime
    BEFORE UPDATE ON public.daily_session_locks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
