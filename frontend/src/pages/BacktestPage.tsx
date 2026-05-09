import { useState } from 'react';
import { FlaskConical, Plus } from 'lucide-react';
import { useTrades, useCreateTrade } from '@/hooks/useTrades';
import { useSummary, useEquityCurve } from '@/hooks/useAnalytics';
import { TradeTable } from '@/components/trades/TradeTable';
import { StatCard } from '@/components/dashboard/StatCard';
import { EquityCurve } from '@/components/charts/EquityCurve';
import { TradeForm } from '@/components/trades/TradeForm';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { fmtPnl, fmt } from '@/lib/utils';
import type { Trade, TradeFormData } from '@/types';

export function BacktestPage() {
  const [showModal, setShowModal] = useState(false);
  const createTrade = useCreateTrade();
  const paperFilters = { mode: 'PAPER', limit: 100 };
  const analyticsFilters = { mode: 'PAPER' as const };

  const { data: trades } = useTrades(paperFilters);
  const { data: summary } = useSummary(analyticsFilters);
  const { data: equity } = useEquityCurve(analyticsFilters);

  async function handleCreate(data: Trade) {
    await createTrade.mutateAsync({
      ...(data as unknown as TradeFormData),
      mode: 'PAPER',
    });
    setShowModal(false);
  }

  const pfDisplay = summary
    ? isFinite(summary.profitFactor)
      ? summary.profitFactor.toFixed(2)
      : '∞'
    : '—';

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-yellow-500/20 flex items-center justify-center">
            <FlaskConical className="h-4 w-4 text-yellow-400" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-zinc-100">Paper / Backtest</h1>
            <p className="text-sm text-zinc-500 mt-0.5">
              Simulate trades without real money — results separated from live P&L
            </p>
          </div>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <Plus className="h-4 w-4" /> Log Paper Trade
        </Button>
      </div>

      {/* Info banner */}
      <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl px-4 py-3">
        <p className="text-sm text-yellow-300">
          <strong>Paper Mode</strong> — All trades here are simulated. Analytics are calculated
          separately from live trades. Use this to backtest strategies, practice setups, or replay
          past market conditions.
        </p>
      </div>

      {/* Stats */}
      {summary && summary.totalTrades > 0 && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Net PnL (Paper)"
              value={fmtPnl(summary.totalPnl)}
              trend={summary.totalPnl >= 0 ? 'up' : 'down'}
            />
            <StatCard
              label="Win Rate"
              value={`${(summary.winRate * 100).toFixed(1)}%`}
              sub={`${summary.totalTrades} trades`}
            />
            <StatCard label="Profit Factor" value={pfDisplay} />
            <StatCard
              label="Avg R:R"
              value={`${fmt(summary.avgRR)}R`}
              sub={`Max DD: ${fmt(summary.maxDrawdownPct)}%`}
            />
          </div>

          <div className="card">
            <h2 className="card-header">Paper Equity Curve</h2>
            <EquityCurve data={equity ?? []} />
          </div>
        </>
      )}

      {/* Strategy comparison guide */}
      <div className="card">
        <h2 className="card-header">How to Use This Mode</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
          {[
            {
              step: '1',
              title: 'Mark Your Setups',
              desc: 'Log entries and exits as you replay charts. Tag each with a strategy to compare performance.',
            },
            {
              step: '2',
              title: 'Add Context',
              desc: 'Use notes and mistake tags to document what you saw vs what happened.',
            },
            {
              step: '3',
              title: 'Review Analytics',
              desc: 'Filter the Analytics page by "Paper" mode to see your backtest results in isolation.',
            },
          ].map(({ step, title, desc }) => (
            <div key={step} className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-yellow-500/20 text-yellow-400 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                {step}
              </div>
              <div>
                <p className="text-sm font-semibold text-zinc-200">{title}</p>
                <p className="text-xs text-zinc-500 mt-1">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Paper trades table */}
      <div className="card">
        <h2 className="card-header">Paper Trades</h2>
        <TradeTable trades={trades?.trades ?? []} />
      </div>

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title="Log Paper Trade"
        size="lg"
      >
        <TradeForm
          defaultMode="PAPER"
          onSuccess={handleCreate}
          onCancel={() => setShowModal(false)}
        />
      </Modal>
    </div>
  );
}
