import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabaseClient';
import { useUIStore } from '../../store/uiStore';
import { calculateRMultiple } from '../../utils/financials';

export interface Trade {
  id: string;
  user_id: string;
  account_id: string;
  pair: string;
  direction: 'BUY' | 'SELL';
  entry_price: number;
  exit_price: number | null;
  stop_loss: number;
  take_profit: number;
  size: number;
  entry_time: string;
  exit_time: string | null;
  pnl: number | null;
  r_multiple: number | null;
  timeframe: 'M1' | 'M5' | 'M15' | 'H1' | 'H4' | 'D1';
  setup_structures: string[];
  setup_fvg: boolean;
  setup_ob: boolean;
  setup_liquidity_sweep: boolean;
  bookmap_absorption: string | null;
  bookmap_passive_orders: string | null;
  bookmap_aggressive_orders: string | null;
  bookmap_vwap_position: 'above' | 'below' | 'at' | null;
  mental_state: 'focused' | 'anxious' | 'greedy' | 'revenge' | 'fomo' | 'tired';
  cookie_jar_ref: boolean;
  rule_40_percent: boolean;
  screenshot_before_url: string | null;
  screenshot_after_url: string | null;
  notes: string | null;
  result: 'TP' | 'SL' | 'BE' | 'OPEN';
  session: 'Asia' | 'London' | 'New York' | 'Over Session' | null;
  created_at: string;
}

export function useTrades() {
  const queryClient = useQueryClient();
  const activeAccountId = useUIStore((state) => state.activeAccountId);
  const isDailySessionLocked = useUIStore((state) => state.isDailySessionLocked);

  // Fetch trades
  const { data: trades = [], isLoading } = useQuery<Trade[]>({
    queryKey: ['trades', activeAccountId],
    queryFn: async () => {
      let query = supabase.from('trades').select('*').order('entry_time', { ascending: false });
      
      if (activeAccountId) {
        query = query.eq('account_id', activeAccountId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  // Helper check for daily stop losses & maximum daily loss limits
  const checkAndApplyDailyLock = async (userId: string) => {
    const todayStr = new Date().toISOString().split('T')[0];
    
    // 1. Fetch trades entered/exited today
    const { data: todayTrades, error: fetchError } = await supabase
      .from('trades')
      .select('*')
      .eq('user_id', userId)
      .gte('entry_time', `${todayStr}T00:00:00Z`);

    // 2. Fetch accounts to check max_daily_loss_limit
    const { data: accounts } = await supabase
      .from('trading_accounts')
      .select('*')
      .eq('user_id', userId);

    if (!fetchError && todayTrades && accounts) {
      let dailyLossExceeded = false;
      let exceededAccountName = '';
      let exceededAmount = 0;
      let limitAmount = 0;

      for (const acc of accounts) {
        // Effective daily loss limit in USD: configured limit OR default 1% of initial balance
        const effectiveLimitUsd = (acc.max_daily_loss_limit !== null && acc.max_daily_loss_limit > 0)
          ? acc.max_daily_loss_limit
          : (acc.initial_balance ? acc.initial_balance * 0.01 : 1000);

        // Calculate sum of P&L for this account today
        const accTodayTrades = todayTrades.filter(t => t.account_id === acc.id);
        const todayPnl = accTodayTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
        
        // Lock if daily net loss exceeds threshold
        if (todayPnl < 0 && Math.abs(todayPnl) >= effectiveLimitUsd) {
          dailyLossExceeded = true;
          exceededAccountName = acc.name;
          exceededAmount = Math.abs(todayPnl);
          limitAmount = effectiveLimitUsd;
          break;
        }
      }

      if (dailyLossExceeded) {
        const reason = `Limite de perte quotidienne ($ / %) atteinte sur ${exceededAccountName} (-$${exceededAmount.toFixed(2)} / max $${limitAmount.toFixed(2)}). Session verrouillée.`;

        await supabase.from('daily_session_locks').upsert({
          user_id: userId,
          date: todayStr,
          sl_count: todayTrades.filter(t => (t.pnl || 0) < 0).length,
          is_locked: true,
          locked_at: new Date().toISOString(),
          lock_reason: reason,
        }, {
          onConflict: 'user_id,date'
        });
        
        queryClient.invalidateQueries({ queryKey: ['daily_lock', todayStr] });
      }
    }
  };

  // Create trade mutation
  const createTradeMutation = useMutation({
    mutationFn: async (newTrade: Omit<Trade, 'id' | 'user_id' | 'created_at'>) => {
      if (isDailySessionLocked) {
        throw new Error('SESSION VERROUILLÉE : Discipline strict. Interdiction de trader aujourd\'hui.');
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Utilisateur non authentifié');

      // Calculate R-multiple if not explicitly provided and exited
      let rMultiple = newTrade.r_multiple;
      if (rMultiple === null && newTrade.exit_price !== null) {
        rMultiple = calculateRMultiple({
          direction: newTrade.direction,
          entryPrice: newTrade.entry_price,
          exitPrice: newTrade.exit_price,
          stopLoss: newTrade.stop_loss,
        });
      }

      const { data, error } = await supabase
        .from('trades')
        .insert({
          ...newTrade,
          user_id: user.id,
          r_multiple: rMultiple,
        })
        .select()
        .single();

      if (error) throw error;

      await checkAndApplyDailyLock(user.id);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trades'] });
      queryClient.invalidateQueries({ queryKey: ['trading_accounts'] });
    },
  });

  // Update trade mutation
  const updateTradeMutation = useMutation({
    mutationFn: async (updatedTrade: Partial<Trade> & { id: string }) => {
      const { data, error } = await supabase
        .from('trades')
        .update(updatedTrade)
        .eq('id', updatedTrade.id)
        .select()
        .single();

      if (error) throw error;
      
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await checkAndApplyDailyLock(user.id);
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trades'] });
      queryClient.invalidateQueries({ queryKey: ['trading_accounts'] });
    },
  });

  // Delete trade mutation
  const deleteTradeMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('trades')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trades'] });
      queryClient.invalidateQueries({ queryKey: ['trading_accounts'] });
    },
  });

  return {
    trades,
    isLoading,
    createTrade: createTradeMutation.mutateAsync,
    isCreating: createTradeMutation.isPending,
    updateTrade: updateTradeMutation.mutateAsync,
    isUpdating: updateTradeMutation.isPending,
    deleteTrade: deleteTradeMutation.mutateAsync,
    isDeleting: deleteTradeMutation.isPending,
    error: createTradeMutation.error || updateTradeMutation.error,
  };
}
