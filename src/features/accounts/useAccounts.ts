import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabaseClient';

export interface TradingAccount {
  id: string;
  user_id: string;
  name: string;
  type: 'challenge' | 'funded' | 'personal' | 'demo';
  balance: number;
  initial_balance: number;
  currency: string;
  is_active: boolean;
  max_daily_loss_limit: number | null;
  created_at: string;
}

export function useAccounts() {
  const queryClient = useQueryClient();

  const { data: accounts = [], isLoading } = useQuery<TradingAccount[]>({
    queryKey: ['trading_accounts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trading_accounts')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });

  const createAccountMutation = useMutation({
    mutationFn: async (newAccount: Omit<TradingAccount, 'id' | 'user_id' | 'created_at'>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Utilisateur non authentifié');

      const { data, error } = await supabase
        .from('trading_accounts')
        .insert({
          ...newAccount,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trading_accounts'] });
    },
  });

  const updateAccountMutation = useMutation({
    mutationFn: async (updatedAccount: Partial<TradingAccount> & { id: string }) => {
      const { data, error } = await supabase
        .from('trading_accounts')
        .update(updatedAccount)
        .eq('id', updatedAccount.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trading_accounts'] });
    },
  });

  const deleteAccountMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('trading_accounts')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trading_accounts'] });
    },
  });

  return {
    accounts,
    isLoading,
    createAccount: createAccountMutation.mutateAsync,
    isCreating: createAccountMutation.isPending,
    updateAccount: updateAccountMutation.mutateAsync,
    isUpdating: updateAccountMutation.isPending,
    deleteAccount: deleteAccountMutation.mutateAsync,
    isDeleting: deleteAccountMutation.isPending,
  };
}
