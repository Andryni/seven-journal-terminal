import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabaseClient';

export interface DailyDebrief {
  id: string;
  user_id: string;
  date: string;
  market_sentiment: string | null;
  lessons_learned: string | null;
  mistakes_committed: string[];
  mental_score: number | null;
  // Nouveaux champs
  htf_analysis: string | null;
  htf_image_url: string | null;
  rules_followed: string[];
  objective_tomorrow: string | null;
  emotion_before: string | null;
  day_rating: number | null;
  created_at: string;
  updated_at: string;
}

export interface PlaybookSetup {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  timeframes: string[]; // ex: ['m5', 'm15']
  validation_rules: string[]; // ex: ['Identification prise de liquidité (BSL/SSL)']
  tags: string[]; // ex: ['#Indices', '#Forex']
  image_url: string | null;
  created_at: string;
}

export type DebriefPayload = Omit<DailyDebrief, 'id' | 'user_id' | 'created_at' | 'updated_at'> & { id?: string };
export type SetupPayload = Omit<PlaybookSetup, 'id' | 'user_id' | 'created_at'> & { id?: string };

export function usePlaybookSetups() {
  const queryClient = useQueryClient();

  const { data: setups = [], isLoading } = useQuery<PlaybookSetup[]>({
    queryKey: ['playbook_setups'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('playbook_setups')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        // En cas d'absence de la table sur Supabase, on retourne les setups par défaut
        return [];
      }
      return data || [];
    },
  });

  const saveSetupMutation = useMutation({
    mutationFn: async (setup: SetupPayload) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Utilisateur non authentifié');

      const payload = { ...setup, user_id: user.id };

      let { data, error } = await supabase
        .from('playbook_setups')
        .upsert(payload)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playbook_setups'] });
    },
  });

  const deleteSetupMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('playbook_setups')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playbook_setups'] });
    },
  });

  return {
    setups,
    isLoading,
    saveSetup: saveSetupMutation.mutateAsync,
    isSaving: saveSetupMutation.isPending,
    deleteSetup: deleteSetupMutation.mutateAsync,
  };
}

export function usePlaybook() {
  const queryClient = useQueryClient();

  // Fetch all debriefs
  const { data: debriefs = [], isLoading } = useQuery<DailyDebrief[]>({
    queryKey: ['debriefs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('daily_debriefs')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  // Save/Upsert debrief
  const saveDebriefMutation = useMutation({
    mutationFn: async (debrief: DebriefPayload) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Utilisateur non authentifié');

      const payload = { ...debrief, user_id: user.id };

      const { data, error } = await supabase
        .from('daily_debriefs')
        .upsert(payload, { onConflict: 'user_id,date' })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['debriefs'] });
    },
  });

  // Delete debrief
  const deleteDebriefMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('daily_debriefs')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['debriefs'] });
    },
  });

  // Upload HTF image to Supabase Storage
  const uploadHtfImage = async (file: File, date: string): Promise<string> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Utilisateur non authentifié');

    const ext = file.name.split('.').pop();
    const path = `${user.id}/${date}_htf.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('playbook-htf')
      .upload(path, file, { upsert: true });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from('playbook-htf').getPublicUrl(path);
    return data.publicUrl;
  };

  return {
    debriefs,
    isLoading,
    saveDebrief: saveDebriefMutation.mutateAsync,
    isSaving: saveDebriefMutation.isPending,
    deleteDebrief: deleteDebriefMutation.mutateAsync,
    isDeleting: deleteDebriefMutation.isPending,
    uploadHtfImage,
  };
}
