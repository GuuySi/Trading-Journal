import { useState } from 'react';
import { Select, Input } from '@/components/ui/Input';
import {
  useSummary,
  useEquityCurve,
  useDailyPnl,
  useStrategyPerformance,
  useHourlyStats,
  useSymbolPerformance,
  useRRDistribution,
} from '@/hooks/useAnalytics';
import { useStrategies } from '@/hooks/useTrades';
import { StatCard } from '@/components/dashboard/StatCard';
import { EquityCurve } from '@/components/charts/EquityCurve';
import { DrawdownChart } from '@/components/charts/DrawdownChart';
import { PnLHistogram } from '@/components/charts/PnLHistogram';
import { StrategyBreakdown, StrategyBarChart } from '@/components/charts/StrategyBreakdown';
import { TimeHeatmap } from '@/components/charts/TimeHeatmap';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { fmtPnl, fmt, fmtHold } from '@/lib/utils';
import type { AnalyticsFilters } from '@/types';

export function AnalyticsPage() {
  const [filters, setFilters] = useState<AnalyticsFilters>({ mode: 'ALL' });
  const { data: strategies } = useStrategies();

  function set(key: keyof AnalyticsFilters, value: string) {
    setFilters((f) => ({ ...f, [key]: value || undefined }));
  }

  const { data: summary } = useSummary(filters);
  const { data: equity } = useEquityCurve(filters);
  const { data: daily } = useDailyPnl(filters);
  const { data: strategyStats } = useStrategyPerformance(filters);
  const { data: hourly } = useHourlyStats(filters);
  const { data: symbols } = useSymbolPerformance(filters);
  const { data: rrData } = useRRDistribution(filters);

  const pfDisplay = summary
    ? isFinite(summary.profitFactor)
      ? summary.profitFactor.toFixed(2)
      : '∞'
    : '—';

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header + Filters */}
      <div className="flex flex-wrap items-end gap-3 justify-between">
        <h1 className="text-xl font-semibold text-zinc-100">Analytics</h1>
        <div className="flex flex-wrap gap-3">
          <div className="w-28">
            <Select
              label="Mode"
              value={filters.mode ?? 'ALL'}
              onChange={(e) => set('mode', e.target.value)}
            >
              <option value="ALL">All</option>
              <option value="LIVE">Live</option>
              <option value="PAPER">Paper</option>
            </Select>
          </div>
          <div className="w-40">
            <Select
              label="Strategy"
              value={filters.strategyId ?? ''}
              onChange={(e) => set('strategyId', e.target.value)}
            >
              <option value="">All strategies</option>
              {strategies?.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="w-32">
            <Input
              type="date"
              label="From"
              value={filters.from ?? ''}
              onChange={(e) => set('from', e.target.value)}
            />
          </div>
          <div className="w-32">
            <Input
              type="date"
              label="To"
              value={filters.to ?? ''}
              onChange={(e) => set('to', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-3">
        {[
          { label: 'Net PnL', value: fmtPnl(summary?.totalPnl) },
          { label: 'Win Rate', value: `${((summary?.winRate ?? 0) * 100).toFixed(1)}%` },
          { label: 'Profit Factor', value: pfDisplay },
          { label: 'Expectancy', value: fmtPnl(summary?.expectancy) },
          { label: 'Avg RR', value: `${fmt(summary?.avgRR)}R` },
          { label: 'Max Drawdown', value: `${fmt(summary?.maxDrawdownPct)}%` },
          { label: 'Best Trade', value: fmtPnl(summary?.bestTrade) },
          { label: 'Avg Hold', value: fmtHold(summary?.avgHoldMinutes ?? 0) },
        ].map(({ label, value }) => (
          <div key={label} className="card py-3">
            <p className="text-xs text-zinc-500 uppercase tracking-wide">{label}</p>
            <p className="font-mono text-sm font-semibold text-zinc-100 mt-1">{value}</p>
          </div>
        ))}
      </div>

      {/* Equity + Drawdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card lg:col-span-2">
          <h2 className="card-header">Equity Curve</h2>
          <EquityCurve data={equity ?? []} />
        </div>
        <div className="card">
          <h2 className="card-header">Drawdown</h2>
          <DrawdownChart data={equity ?? []} />
        </div>
      </div>

      {/* Daily PnL + RR Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card">
          <h2 className="card-header">Daily PnL</h2>
          <PnLHistogram data={daily ?? []} />
        </div>

        <div className="card">
          <h2 className="card-header">R:R Distribution</h2>
          {rrData && rrData.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <ScatterChart margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a32" />
                <XAxis
                  dataKey="rr"
                  name="RR"
                  tick={{ fontSize: 10, fill: '#71717a' }}
                  axisLine={false}
                  tickLine={false}
                  type="number"
                  label={{ value: 'R:R', position: 'insideBottom', offset: -2, fontSize: 10, fill: '#71717a' }}
                />
                <YAxis hide />
                <Tooltip
                  cursor={{ strokeDasharray: '3 3' }}
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0].payload as { rr: number; result: string };
                    return (
                      <div className="bg-surface-3 border border-border rounded-lg px-3 py-2 text-xs">
                        <p className={d.result === 'WIN' ? 'text-profit' : 'text-loss'}>
                          {d.result} · {d.rr.toFixed(2)}R
                        </p>
                      </div>
                    );
                  }}
                />
                <Scatter
                  data={rrData.map((d, i) => ({ ...d, y: i % 10 }))}
                  fill="#6366f1"
                  shape={(props: { cx?: number; cy?: number; payload?: { result: string } }) => (
                    <circle
                      cx={props.cx}
                      cy={props.cy}
                      r={4}
                      fill={props.payload?.result === 'WIN' ? '#22c55e' : '#ef4444'}
                      fillOpacity={0.7}
                    />
                  )}
                />
              </ScatterChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-40 text-zinc-600 text-sm">
              No R:R data
            </div>
          )}
        </div>
      </div>

      {/* Strategy + Time heatmap */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card">
          <h2 className="card-header">Strategy Performance</h2>
          <StrategyBreakdown data={strategyStats ?? []} />
        </div>

        <div className="card">
          <h2 className="card-header">Time of Day (UTC)</h2>
          <TimeHeatmap data={hourly ?? Array.from({ length: 24 }, (_, i) => ({ hour: i, trades: 0, winRate: 0, totalPnl: 0 }))} />
        </div>
      </div>

      {/* Symbol performance */}
      <div className="card">
        <h2 className="card-header">Symbol Performance</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {['Symbol', 'Trades', 'Win Rate', 'Net PnL', 'Avg R:R'].map((h) => (
                  <th
                    key={h}
                    className="px-3 py-2 text-left text-xs font-medium text-zinc-500 uppercase tracking-wide"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {(symbols ?? [])
                .sort((a, b) => b.totalPnl - a.totalPnl)
                .map((s) => (
                  <tr key={s.symbol} className="hover:bg-surface-2">
                    <td className="px-3 py-2 font-mono font-semibold text-zinc-100">
                      {s.symbol}
                    </td>
                    <td className="px-3 py-2 text-zinc-400">{s.trades}</td>
                    <td className="px-3 py-2 text-zinc-300">
                      {(s.winRate * 100).toFixed(1)}%
                    </td>
                    <td
                      className={`px-3 py-2 font-mono font-semibold ${
                        s.totalPnl >= 0 ? 'text-profit' : 'text-loss'
                      }`}
                    >
                      {fmtPnl(s.totalPnl)}
                    </td>
                    <td className="px-3 py-2 font-mono text-zinc-300">
                      {s.avgRR.toFixed(2)}R
                    </td>
                  </tr>
                ))}
              {!symbols?.length && (
                <tr>
                  <td colSpan={5} className="px-3 py-8 text-center text-zinc-600 text-sm">
                    No data
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
