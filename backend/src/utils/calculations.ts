import type { Trade } from '@prisma/client';

export function calculateTradePnL(trade: {
  direction: string;
  entryPrice: number;
  exitPrice: number | null;
  fees: number;
  stopLoss?: number | null;
  riskAmount?: number | null;
}): {
  pnl: number | null;
  pnlPercent: null;
  rr: number | null;
  result: string;
} {
  if (!trade.exitPrice) {
    return { pnl: null, pnlPercent: null, rr: null, result: 'OPEN' };
  }

  const dirMultiplier = trade.direction === 'LONG' ? 1 : -1;
  const epsilon = 0.0001;

  if (!trade.stopLoss || !trade.riskAmount || trade.riskAmount <= 0 || trade.stopLoss === trade.entryPrice) {
    const move = (trade.exitPrice - trade.entryPrice) * dirMultiplier;
    const result = Math.abs(move) < epsilon ? 'BREAKEVEN' : move > 0 ? 'WIN' : 'LOSS';
    return { pnl: null, pnlPercent: null, rr: null, result };
  }

  const riskPerUnit = Math.abs(trade.entryPrice - trade.stopLoss);
  const movePerUnit = (trade.exitPrice - trade.entryPrice) * dirMultiplier;
  const rr = movePerUnit / riskPerUnit;
  const pnl = trade.riskAmount * rr - trade.fees;

  let result: string;
  if (Math.abs(pnl) < epsilon) result = 'BREAKEVEN';
  else if (pnl > 0) result = 'WIN';
  else result = 'LOSS';

  return {
    pnl: Math.round(pnl * 100) / 100,
    pnlPercent: null,
    rr: Math.round(rr * 100) / 100,
    result,
  };
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

export function computeSummary(trades: Trade[]): AnalyticsSummary {
  const closed = trades.filter((t) => t.result !== 'OPEN' && t.pnl != null);
  const wins = closed.filter((t) => t.result === 'WIN');
  const losses = closed.filter((t) => t.result === 'LOSS');

  const totalPnl = closed.reduce((s, t) => s + (t.pnl ?? 0), 0);
  const totalFees = trades.reduce((s, t) => s + t.fees, 0);
  const winRate = closed.length > 0 ? wins.length / closed.length : 0;

  const winSum = wins.reduce((s, t) => s + (t.pnl ?? 0), 0);
  const lossSum = Math.abs(losses.reduce((s, t) => s + (t.pnl ?? 0), 0));

  const avgWin = wins.length > 0 ? winSum / wins.length : 0;
  const avgLoss = losses.length > 0 ? lossSum / losses.length : 0;
  const profitFactor = lossSum > 0 ? winSum / lossSum : winSum > 0 ? 9999 : 0;
  const expectancy = winRate * avgWin - (1 - winRate) * avgLoss;

  const rrTrades = closed.filter((t) => t.rr != null);
  const avgRR =
    rrTrades.length > 0
      ? rrTrades.reduce((s, t) => s + (t.rr ?? 0), 0) / rrTrades.length
      : 0;

  // Drawdown
  const sorted = [...closed].sort(
    (a, b) =>
      new Date(a.exitTime!).getTime() - new Date(b.exitTime!).getTime()
  );
  let equity = 0;
  let peak = 0;
  let maxDrawdownPct = 0;
  for (const t of sorted) {
    equity += t.pnl ?? 0;
    if (equity > peak) peak = equity;
    if (peak > 0) {
      const dd = ((peak - equity) / peak) * 100;
      if (dd > maxDrawdownPct) maxDrawdownPct = dd;
    }
  }

  const bestTrade = closed.length > 0 ? Math.max(...closed.map((t) => t.pnl ?? 0)) : 0;
  const worstTrade = closed.length > 0 ? Math.min(...closed.map((t) => t.pnl ?? 0)) : 0;

  // Hold time
  const withExit = closed.filter((t) => t.exitTime != null);
  const avgHoldMinutes =
    withExit.length > 0
      ? withExit.reduce((s, t) => {
          const ms = new Date(t.exitTime!).getTime() - new Date(t.entryTime).getTime();
          return s + ms / 60000;
        }, 0) / withExit.length
      : 0;

  // Streaks
  let longestWinStreak = 0;
  let longestLossStreak = 0;
  let curWin = 0;
  let curLoss = 0;
  let currentStreak = 0;
  let currentStreakType: 'WIN' | 'LOSS' | 'NONE' = 'NONE';

  for (const t of sorted) {
    if (t.result === 'WIN') {
      curWin++;
      curLoss = 0;
      if (curWin > longestWinStreak) longestWinStreak = curWin;
    } else if (t.result === 'LOSS') {
      curLoss++;
      curWin = 0;
      if (curLoss > longestLossStreak) longestLossStreak = curLoss;
    }
  }

  if (sorted.length > 0) {
    const last = sorted[sorted.length - 1];
    if (last.result === 'WIN') {
      currentStreakType = 'WIN';
      currentStreak = curWin;
    } else if (last.result === 'LOSS') {
      currentStreakType = 'LOSS';
      currentStreak = curLoss;
    }
  }

  return {
    totalTrades: closed.length,
    openTrades: trades.filter((t) => t.result === 'OPEN').length,
    winRate,
    totalPnl,
    totalFees,
    avgWin,
    avgLoss,
    profitFactor,
    expectancy,
    avgRR,
    maxDrawdownPct,
    bestTrade,
    worstTrade,
    avgHoldMinutes,
    currentStreak,
    currentStreakType,
    longestWinStreak,
    longestLossStreak,
  };
}

export function computeEquityCurve(trades: Trade[]): EquityPoint[] {
  const closed = trades
    .filter((t) => t.result !== 'OPEN' && t.pnl != null && t.exitTime != null)
    .sort(
      (a, b) =>
        new Date(a.exitTime!).getTime() - new Date(b.exitTime!).getTime()
    );

  let equity = 0;
  let peak = 0;

  return closed.map((t) => {
    equity += t.pnl ?? 0;
    if (equity > peak) peak = equity;
    const drawdownPct = peak > 0 ? ((peak - equity) / peak) * 100 : 0;
    return {
      date: t.exitTime!.toISOString(),
      equity: Math.round(equity * 100) / 100,
      drawdownPct: Math.round(drawdownPct * 100) / 100,
      tradeId: t.id,
    };
  });
}

export function computeDailyPnL(trades: Trade[]): DailyPnL[] {
  const map = new Map<string, { pnl: number; trades: number }>();

  for (const t of trades) {
    if (t.result === 'OPEN' || t.pnl == null || !t.exitTime) continue;
    const day = t.exitTime.toISOString().slice(0, 10);
    const existing = map.get(day) ?? { pnl: 0, trades: 0 };
    map.set(day, { pnl: existing.pnl + t.pnl, trades: existing.trades + 1 });
  }

  return Array.from(map.entries())
    .map(([date, v]) => ({ date, pnl: Math.round(v.pnl * 100) / 100, trades: v.trades }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function computeStrategyStats(
  trades: Trade[],
  strategyNames: Map<string, string>
): StrategyStats[] {
  const map = new Map<
    string,
    { name: string; trades: Trade[] }
  >();

  for (const t of trades) {
    const key = t.strategyId ?? '__none__';
    const name = t.strategyId
      ? (strategyNames.get(t.strategyId) ?? 'Unknown')
      : 'Untagged';
    if (!map.has(key)) map.set(key, { name, trades: [] });
    map.get(key)!.trades.push(t);
  }

  return Array.from(map.entries()).map(([strategyId, { name, trades: ts }]) => {
    const closed = ts.filter((t) => t.result !== 'OPEN' && t.pnl != null);
    const wins = closed.filter((t) => t.result === 'WIN');
    const losses = closed.filter((t) => t.result === 'LOSS');
    const winSum = wins.reduce((s, t) => s + (t.pnl ?? 0), 0);
    const lossSum = Math.abs(losses.reduce((s, t) => s + (t.pnl ?? 0), 0));
    const rrTrades = closed.filter((t) => t.rr != null);
    return {
      strategyId: strategyId === '__none__' ? null : strategyId,
      strategyName: name,
      trades: closed.length,
      winRate: closed.length > 0 ? wins.length / closed.length : 0,
      totalPnl: Math.round(closed.reduce((s, t) => s + (t.pnl ?? 0), 0) * 100) / 100,
      avgRR:
        rrTrades.length > 0
          ? rrTrades.reduce((s, t) => s + (t.rr ?? 0), 0) / rrTrades.length
          : 0,
      profitFactor: lossSum > 0 ? winSum / lossSum : winSum > 0 ? 9999 : 0,
    };
  });
}

export function computeHourlyStats(trades: Trade[]): HourlyStats[] {
  const buckets: { wins: number; losses: number; pnl: number; total: number }[] =
    Array.from({ length: 24 }, () => ({
      wins: 0,
      losses: 0,
      pnl: 0,
      total: 0,
    }));

  for (const t of trades) {
    if (t.result === 'OPEN' || t.pnl == null) continue;
    const hour = new Date(t.entryTime).getUTCHours();
    buckets[hour].total++;
    buckets[hour].pnl += t.pnl;
    if (t.result === 'WIN') buckets[hour].wins++;
    if (t.result === 'LOSS') buckets[hour].losses++;
  }

  return buckets.map((b, hour) => ({
    hour,
    trades: b.total,
    winRate: b.total > 0 ? b.wins / b.total : 0,
    totalPnl: Math.round(b.pnl * 100) / 100,
  }));
}

export function computeSymbolStats(trades: Trade[]): SymbolStats[] {
  const map = new Map<string, Trade[]>();

  for (const t of trades) {
    const sym = t.symbol.toUpperCase();
    if (!map.has(sym)) map.set(sym, []);
    map.get(sym)!.push(t);
  }

  return Array.from(map.entries()).map(([symbol, ts]) => {
    const closed = ts.filter((t) => t.result !== 'OPEN' && t.pnl != null);
    const wins = closed.filter((t) => t.result === 'WIN');
    const rrTrades = closed.filter((t) => t.rr != null);
    return {
      symbol,
      trades: closed.length,
      winRate: closed.length > 0 ? wins.length / closed.length : 0,
      totalPnl: Math.round(closed.reduce((s, t) => s + (t.pnl ?? 0), 0) * 100) / 100,
      avgRR:
        rrTrades.length > 0
          ? rrTrades.reduce((s, t) => s + (t.rr ?? 0), 0) / rrTrades.length
          : 0,
    };
  });
}
