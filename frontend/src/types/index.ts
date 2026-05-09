export type Direction = 'LONG' | 'SHORT';
export type TradeMode = 'LIVE' | 'PAPER';
export type TradeResult = 'WIN' | 'LOSS' | 'BREAKEVEN' | 'OPEN';
export type MistakeTag =
  | 'FOMO'
  | 'REVENGE'
  | 'EARLY_EXIT'
  | 'OVERSIZE'
  | 'NO_PLAN'
  | 'MOVED_SL'
  | 'CHASED';

export interface Strategy {
  id: string;
  name: string;
  description?: string | null;
  _count?: { trades: number };
  createdAt: string;
}

export interface Trade {
  id: string;
  userId: string;
  symbol: string;
  direction: Direction;
  mode: TradeMode;
  entryTime: string;
  exitTime: string | null;
  entryPrice: number;
  exitPrice: number | null;
  stopLoss: number | null;
  takeProfit: number | null;
  positionSize: number;
  accountBalance: number | null;
  fees: number;
  pnl: number | null;
  pnlPercent: number | null;
  riskAmount: number | null;
  rewardAmount: number | null;
  rr: number | null;
  result: TradeResult;
  strategyId: string | null;
  strategy: { id: string; name: string } | null;
  tags: string[];
  mistakeTags: MistakeTag[];
  notes: string | null;
  executionRating: number | null;
  screenshotUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TradeFormData {
  symbol: string;
  direction: Direction;
  mode: TradeMode;
  entryTime: string;
  exitTime?: string;
  entryPrice: number;
  exitPrice?: number;
  stopLoss?: number;
  takeProfit?: number;
  positionSize: number;
  accountBalance?: number;
  fees: number;
  strategyId?: string;
  tags: string[];
  mistakeTags: MistakeTag[];
  notes?: string;
  executionRating?: number;
}

export interface AnalyticsSummary {
  totalTrades: number;
  openTrades: number;
  winRate: number;
  totalPnl: number;
  totalFees: number;
  avgWin: number;
  avgLoss: number;
  profitFactor: number;
  expectancy: number;
  avgRR: number;
  maxDrawdownPct: number;
  bestTrade: number;
  worstTrade: number;
  avgHoldMinutes: number;
  currentStreak: number;
  currentStreakType: 'WIN' | 'LOSS' | 'NONE';
  longestWinStreak: number;
  longestLossStreak: number;
}

export interface EquityPoint {
  date: string;
  equity: number;
  drawdownPct: number;
  tradeId: string;
}

export interface DailyPnL {
  date: string;
  pnl: number;
  trades: number;
}

export interface StrategyStats {
  strategyId: string | null;
  strategyName: string;
  trades: number;
  winRate: number;
  totalPnl: number;
  avgRR: number;
  profitFactor: number;
}

export interface HourlyStats {
  hour: number;
  trades: number;
  winRate: number;
  totalPnl: number;
}

export interface SymbolStats {
  symbol: string;
  trades: number;
  winRate: number;
  totalPnl: number;
  avgRR: number;
}

export interface AnalyticsFilters {
  mode?: TradeMode | 'ALL';
  strategyId?: string;
  symbol?: string;
  from?: string;
  to?: string;
}

export interface User {
  id: string;
  email: string;
  displayName: string | null;
}
