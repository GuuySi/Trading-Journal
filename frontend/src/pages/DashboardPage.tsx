import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  TrendingDown,
  Target,
  Zap,
  BarChart3,
  Clock,
  Plus,
} from 'lucide-react';
import { useSummary, useEquityCurve, useDailyPnl } from '@/hooks/useAnalytics';
import { useTrades } from '@/hooks/useTrades';
import { StatCard } from '@/components/dashboard/StatCard';
import { EquityCurve } from '@/components/charts/EquityCurve';
import { PnLHistogram } from '@/components/charts/PnLHistogram';
import { TradeTable } from '@/components/trades/TradeTable';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { TradeForm } from '@/components/trades/TradeForm';
import { useCreateTrade } from '@/hooks/useTrades';
import {
  fmtPnl,
  fmtPct,
  fmt,
  fmtHold,
  pnlColor,
} from '@/lib/utils';
import type { TradeFormData, Trade } from '@/types';
import { useAuth } from '@/hooks/useAuth';

export function DashboardPage() {
  const { user } = useAuth();
  const [showTradeModal, setShowTradeModal] = useState(false);
  const createTrade = useCreateTrade();

  const { data: summary, isLoading: summaryLoading } = useSummary();
  const { data: equityPoints } = useEquityCurve();
  const { data: dailyPnl } = useDailyPnl();
  const { data: recentTrades } = useTrades({ limit: 10 });

  async function handleNewTrade(data: Trade) {
    await createTrade.mutateAsync(data as unknown as TradeFormData);
    setShowTradeModal(false);
  }

  const winRatePct = summary ? (summary.winRate * 100).toFixed(1) : '—';
  const pfDisplay = summary
    ? isFinite(summary.profitFactor)
      ? summary.profitFactor.toFixed(2)
      : '∞'
    : '—';

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-zinc-100">
            Welcome back, {user?.displayName ?? user?.email}
          </h1>
          <p className="text-sm text-zinc-500 mt-0.5">
            {summary
              ? `${summary.totalTrades} closed trades · ${summary.openTrades} open`
              : 'Loading...'}
          </p>
        </div>
        <Button onClick={() => setShowTradeModal(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Log Trade
        </Button>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Net PnL"
          value={summary ? fmtPnl(summary.totalPnl) : '—'}
          icon={TrendingUp}
          trend={
            summary
              ? summary.totalPnl > 0
                ? 'up'
                : summary.totalPnl < 0
                ? 'down'
                : 'neutral'
              : 'neutral'
          }
          sub={`Fees: ${fmtPnl(summary?.totalFees)}`}
        />
        <StatCard
          label="Win Rate"
          value={`${winRatePct}%`}
          icon={Target}
          sub={`${summary?.totalTrades ?? 0} closed trades`}
        />
        <StatCard
          label="Profit Factor"
          value={pfDisplay}
          icon={BarChart3}
          sub={`Expectancy: ${fmtPnl(summary?.expectancy)}`}
        />
        <StatCard
          label="Avg R:R"
          value={summary ? `${fmt(summary.avgRR)}R` : '—'}
          icon={Zap}
          sub={`Max DD: ${fmt(summary?.maxDrawdownPct)}%`}
        />
      </div>

      {/* Secondary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Best Trade"
          value={summary ? fmtPnl(summary.bestTrade) : '—'}
          trend="up"
        />
        <StatCard
          label="Worst Trade"
          value={summary ? fmtPnl(summary.worstTrade) : '—'}
          trend="down"
        />
        <StatCard
          label="Avg Hold Time"
          value={summary ? fmtHold(summary.avgHoldMinutes) : '—'}
          icon={Clock}
        />
        <div className="card">
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide">
            Current Streak
          </p>
          <p
            className={`mt-2 font-mono text-xl font-semibold ${
              summary?.currentStreakType === 'WIN'
                ? 'text-profit'
                : summary?.currentStreakType === 'LOSS'
                ? 'text-loss'
                : 'text-zinc-400'
            }`}
          >
            {summary?.currentStreak ?? 0}
            {summary?.currentStreakType !== 'NONE' && (
              <span className="text-sm ml-1">
                {summary?.currentStreakType === 'WIN' ? '🏆' : '📉'}
              </span>
            )}
          </p>
          <p className="mt-0.5 text-xs text-zinc-500">
            Best: {summary?.longestWinStreak ?? 0}W / Worst: {summary?.longestLossStreak ?? 0}L
          </p>
        </div>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="card-header mb-0">Equity Curve</h2>
            <Link to="/analytics" className="text-xs text-accent hover:underline">
              Full view →
            </Link>
          </div>
          <EquityCurve data={equityPoints ?? []} />
        </div>

        <div className="card">
          <h2 className="card-header">Daily PnL</h2>
          <PnLHistogram data={dailyPnl ?? []} />
        </div>
      </div>

      {/* Recent trades */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="card-header mb-0">Recent Trades</h2>
          <Link to="/journal" className="text-xs text-accent hover:underline">
            All trades →
          </Link>
        </div>
        <TradeTable trades={recentTrades?.trades ?? []} />
      </div>

      {/* New trade modal */}
      <Modal
        open={showTradeModal}
        onClose={() => setShowTradeModal(false)}
        title="Log New Trade"
        size="lg"
      >
        <TradeForm
          onSuccess={handleNewTrade}
          onCancel={() => setShowTradeModal(false)}
        />
      </Modal>
    </div>
  );
}
