// Types partagés du domaine Seven Journal
// Servir de source unique de vérité pour les enums utilisés en DB et en UI

export type TradePair = 'XAUUSD' | 'NAS100' | 'EURUSD' | 'GBPUSD' | 'BTCUSD';

export type TradeDirection = 'BUY' | 'SELL';

export type TradeTimeframe = 'M1' | 'M5' | 'M15' | 'H1' | 'H4' | 'D1';

export type SmcStructure = 'BOS' | 'CHoCH';

export type BookmapVwapPosition = 'above' | 'below' | 'at';

export type MentalState =
  | 'focused'
  | 'anxious'
  | 'greedy'
  | 'revenge'
  | 'fomo'
  | 'tired';

export type AccountType = 'challenge' | 'funded' | 'personal' | 'demo';

export const MENTAL_STATE_LABELS: Record<MentalState, string> = {
  focused: 'FOCUSED — Concentré, calme',
  anxious: 'ANXIOUS — Stressé, peur de perdre',
  greedy: 'GREEDY — Envie de forcer la taille',
  revenge: 'REVENGE — Veut se refaire',
  fomo: 'FOMO — Peur de rater le move',
  tired: 'TIRED — Fatigue physique / visuelle',
};

export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  challenge: 'CHALLENGE PROP',
  funded: 'FUNDED PROP',
  personal: 'COMPTE PERSONNEL',
  demo: 'COMPTE DEMO',
};

export const TRADE_PAIRS: TradePair[] = [
  'XAUUSD',
  'NAS100',
  'EURUSD',
  'GBPUSD',
  'BTCUSD',
];
