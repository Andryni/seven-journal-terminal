import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabaseClient';

export interface ChecklistItem {
  id: string;
  user_id?: string;
  text: string;
  is_done: boolean;
  sort_order: number;
  created_at?: string;
}

const DEFAULT_ITEMS: Omit<ChecklistItem, 'id'>[] = [
  { text: 'Vérifier le calendrier économique (News high impact)', is_done: false, sort_order: 1 },
  { text: 'Valider le biais H4/H1 & Key Levels', is_done: false, sort_order: 2 },
  { text: 'Respecter le Stop Loss & Max 1% de risque', is_done: false, sort_order: 3 },
  { text: 'Pas de revenge trading après 1 perte', is_done: false, sort_order: 4 },
];

export function useChecklist() {
  const queryClient = useQueryClient();

  const { data: items = [], isLoading } = useQuery<ChecklistItem[]>({
    queryKey: ['user_checklists'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('user_checklists')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true });

      if (error) {
        // Si la table n'est pas encore créée, fallback gracieux
        console.warn('Checklist table not found or error:', error.message);
        return [];
      }

      // Si première utilisation, initialiser avec les règles par défaut
      if (data.length === 0) {
        const seeded = DEFAULT_ITEMS.map((item, idx) => ({
          user_id: user.id,
          text: item.text,
          is_done: false,
          sort_order: idx + 1,
        }));

        const { data: inserted } = await supabase
          .from('user_checklists')
          .insert(seeded)
          .select();

        return inserted || [];
      }

      return data;
    },
    staleTime: 1000 * 60 * 5,
  });

  // Toggle Check
  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_done }: { id: string; is_done: boolean }) => {
      const { error } = await supabase
        .from('user_checklists')
        .update({ is_done })
        .eq('id', id);
      if (error) throw error;
    },
    onMutate: async ({ id, is_done }) => {
      await queryClient.cancelQueries({ queryKey: ['user_checklists'] });
      const prev = queryClient.getQueryData<ChecklistItem[]>(['user_checklists']);
      queryClient.setQueryData<ChecklistItem[]>(['user_checklists'], old =>
        old ? old.map(item => (item.id === id ? { ...item, is_done } : item)) : []
      );
      return { prev };
    },
    onError: (_err, _vars, context) => {
      if (context?.prev) queryClient.setQueryData(['user_checklists'], context.prev);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['user_checklists'] }),
  });

  // Add Item
  const addItemMutation = useMutation({
    mutationFn: async (text: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const { data, error } = await supabase
        .from('user_checklists')
        .insert([{
          user_id: user.id,
          text: text.trim(),
          is_done: false,
          sort_order: (items.length || 0) + 1,
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['user_checklists'] }),
  });

  // Delete Item
  const deleteItemMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('user_checklists')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['user_checklists'] });
      const prev = queryClient.getQueryData<ChecklistItem[]>(['user_checklists']);
      queryClient.setQueryData<ChecklistItem[]>(['user_checklists'], old =>
        old ? old.filter(item => item.id !== id) : []
      );
      return { prev };
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['user_checklists'] }),
  });

  // Reset All checks (démarrage nouvelle session)
  const resetAllMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('user_checklists')
        .update({ is_done: false })
        .eq('user_id', user.id);
      if (error) throw error;
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['user_checklists'] });
      const prev = queryClient.getQueryData<ChecklistItem[]>(['user_checklists']);
      queryClient.setQueryData<ChecklistItem[]>(['user_checklists'], old =>
        old ? old.map(item => ({ ...item, is_done: false })) : []
      );
      return { prev };
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['user_checklists'] }),
  });

  return {
    items,
    isLoading,
    toggleItem: (id: string, is_done: boolean) => toggleMutation.mutate({ id, is_done }),
    addItem: (text: string) => addItemMutation.mutate(text),
    deleteItem: (id: string) => deleteItemMutation.mutate(id),
    resetAll: () => resetAllMutation.mutate(),
  };
}
