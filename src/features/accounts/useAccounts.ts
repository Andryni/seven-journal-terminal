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
  max_drawdown_limit?: number | null;
  profit_target?: number | null;
  consistency_rule_percent?: number | null;
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

      const payload: any = {
        name: newAccount.name,
        type: newAccount.type,
        balance: newAccount.balance,
        initial_balance: newAccount.initial_balance,
        currency: newAccount.currency,
        is_active: newAccount.is_active,
        max_daily_loss_limit: newAccount.max_daily_loss_limit,
        user_id: user.id,
      };

      if (newAccount.max_drawdown_limit !== undefined && newAccount.max_drawdown_limit !== null) {
        payload.max_drawdown_limit = newAccount.max_drawdown_limit;
      }
      if (newAccount.profit_target !== undefined && newAccount.profit_target !== null) {
        payload.profit_target = newAccount.profit_target;
      }
      if (newAccount.consistency_rule_percent !== undefined && newAccount.consistency_rule_percent !== null) {
        payload.consistency_rule_percent = newAccount.consistency_rule_percent;
      }

      let { data, error } = await supabase
        .from('trading_accounts')
        .insert(payload)
        .select()
        .single();

      // Si les colonnes n'existent pas encore dans Postgres, réessayer sans ces colonnes facultatives
      if (error && error.message?.includes('column')) {
        delete payload.max_drawdown_limit;
        delete payload.profit_target;
        delete payload.consistency_rule_percent;
        const res = await supabase
          .from('trading_accounts')
          .insert(payload)
          .select()
          .single();
        data = res.data;
        error = res.error;
      }

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trading_accounts'] });
    },
  });

  const updateAccountMutation = useMutation({
    mutationFn: async (updatedAccount: Partial<TradingAccount> & { id: string }) => {
      const payload: any = { ...updatedAccount };

      let { data, error } = await supabase
        .from('trading_accounts')
        .update(payload)
        .eq('id', updatedAccount.id)
        .select()
        .single();

      if (error && error.message?.includes('column')) {
        delete payload.max_drawdown_limit;
        delete payload.profit_target;
        delete payload.consistency_rule_percent;
        const res = await supabase
          .from('trading_accounts')
          .update(payload)
          .eq('id', updatedAccount.id)
          .select()
          .single();
        data = res.data;
        error = res.error;
      }

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
