-- 1. ENRICHISSEMENT DE LA TABLE TRADES
ALTER TABLE public.trades 
ADD COLUMN IF NOT EXISTS result TEXT CHECK (result IN ('TP', 'SL', 'BE', 'OPEN')) DEFAULT 'OPEN';

-- 2. TABLE POUR LE DEBRIEFING QUOTIDIEN
CREATE TABLE IF NOT EXISTS public.daily_debriefs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    market_sentiment TEXT,
    lessons_learned TEXT,
    mistakes_committed TEXT[] DEFAULT '{}',
    mental_score INTEGER CHECK (mental_score BETWEEN 1 AND 10),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT unique_user_daily_debrief UNIQUE (user_id, date)
);

-- Indexation
CREATE INDEX IF NOT EXISTS idx_daily_debriefs_user_date ON public.daily_debriefs(user_id, date);

-- RLS
ALTER TABLE public.daily_debriefs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own debriefs"
    ON public.daily_debriefs
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Trigger updated_at
CREATE TRIGGER update_daily_debriefs_modtime
    BEFORE UPDATE ON public.daily_debriefs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
