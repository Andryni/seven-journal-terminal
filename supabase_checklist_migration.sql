-- ==============================================================================
-- TABLE: user_checklists (Checklist Pré-Session Personnalisable Multi-Appareils)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.user_checklists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    is_done BOOLEAN DEFAULT FALSE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour requêtes rapides par utilisateur
CREATE INDEX IF NOT EXISTS idx_user_checklists_user_id ON public.user_checklists(user_id);
CREATE INDEX IF NOT EXISTS idx_user_checklists_sort_order ON public.user_checklists(sort_order ASC);

-- Activer Row Level Security (RLS)
ALTER TABLE public.user_checklists ENABLE ROW LEVEL SECURITY;

-- Politique : chaque utilisateur a le contrôle total sur ses propres items
CREATE POLICY "Users can manage their own checklist"
    ON public.user_checklists
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Trigger pour mise à jour automatique de updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_user_checklists_updated_at ON public.user_checklists;
CREATE TRIGGER set_user_checklists_updated_at
    BEFORE UPDATE ON public.user_checklists
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();
