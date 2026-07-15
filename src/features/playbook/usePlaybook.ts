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
  created_at: string;
  updated_at: string;
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
    mutationFn: async (debrief: Omit<DailyDebrief, 'id' | 'user_id' | 'created_at' | 'updated_at'> & { id?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Utilisateur non authentifié');

      const payload = {
        ...debrief,
        user_id: user.id,
      };

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

  return {
    debriefs,
    isLoading,
    saveDebrief: saveDebriefMutation.mutateAsync,
    isSaving: saveDebriefMutation.isPending,
  };
}
