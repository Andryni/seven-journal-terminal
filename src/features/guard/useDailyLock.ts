import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabaseClient';
import { useUIStore } from '../../store/uiStore';
import { useEffect } from 'react';

export interface DailySessionLock {
  id: string;
  user_id: string;
  date: string;
  sl_count: number;
  is_locked: boolean;
  locked_at: string | null;
  unlock_at: string | null;
  lock_reason: string | null;
}

export function useDailyLock() {
  const queryClient = useQueryClient();
  const setDailySessionLocked = useUIStore((state) => state.setDailySessionLocked);
  
  // Get today's date formatted as YYYY-MM-DD
  const todayStr = new Date().toISOString().split('T')[0];

  // Fetch lock status for today
  const { data: lock, isLoading } = useQuery<DailySessionLock | null>({
    queryKey: ['daily_lock', todayStr],
    queryFn: async () => {
      // 1. Get current authenticated user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      // 2. Fetch today's lock record
      const { data, error } = await supabase
        .from('daily_session_locks')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', todayStr)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });

  // Keep Zustand UI store in sync
  useEffect(() => {
    if (lock) {
      setDailySessionLocked(lock.is_locked);
    } else {
      setDailySessionLocked(false);
    }
  }, [lock, setDailySessionLocked]);

  // Mutation to lock the session
  const lockSessionMutation = useMutation({
    mutationFn: async ({ reason, slCount }: { reason: string; slCount: number }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Utilisateur non authentifié');

      const { data, error } = await supabase
        .from('daily_session_locks')
        .upsert({
          user_id: user.id,
          date: todayStr,
          sl_count: slCount,
          is_locked: true,
          locked_at: new Date().toISOString(),
          lock_reason: reason,
        }, {
          onConflict: 'user_id,date'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily_lock', todayStr] });
    },
  });

  return {
    lock,
    isLoading,
    isLocked: lock?.is_locked || false,
    lockSession: lockSessionMutation.mutateAsync,
    isLocking: lockSessionMutation.isPending,
  };
}
