import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { StrategyStats } from '@/types';

interface Props {
  data: StrategyStats[];
}

export function StrategyBreakdown({ data }: Props) {
  if (!data.length) {
    return (
      <div className="flex items-center justify-center h-48 text-zinc-600 text-sm">
        No strategy data
      </div>
    );
  }

  const sorted = [...data].sort((a, b) => b.totalPnl - a.totalPnl);

  return (
    <div className="space-y-3">
      {sorted.map((s) => (
        <div key={s.strategyId ?? 'none'} className="flex items-center gap-3">
          <div className="w-24 shrink-0">
            <p className="text-xs text-zinc-300 truncate font-medium">{s.strategyName}</p>
            <p className="text-xs text-zinc-500">{s.trades} trades</p>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <div
                className="h-1.5 rounded-full bg-accent"
                style={{ width: `${s.winRate * 100}%` }}
              />
              <span className="text-xs text-zinc-400 shrink-0">
                {(s.winRate * 100).toFixed(0)}%
              </span>
            </div>
          </div>
          <div className="text-right shrink-0">
            <p
              className={`text-xs font-mono font-semibold ${
                s.totalPnl >= 0 ? 'text-profit' : 'text-loss'
              }`}
            >
              {s.totalPnl >= 0 ? '+' : ''}${s.totalPnl.toFixed(2)}
            </p>
            <p className="text-xs text-zinc-500">PF: {isFinite(s.profitFactor) ? s.profitFactor.toFixed(2) : '∞'}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export function StrategyBarChart({ data }: Props) {
  if (!data.length) return null;

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 0, right: 20, left: 0, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#2a2a32" horizontal={false} />
        <XAxis
          type="number"
          tickFormatter={(v) => `$${v}`}
          tick={{ fontSize: 10, fill: '#71717a' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          dataKey="strategyName"
          type="category"
          tick={{ fontSize: 10, fill: '#a1a1aa' }}
          axisLine={false}
          tickLine={false}
          width={80}
        />
        <Tooltip
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            const s = payload[0].payload as StrategyStats;
            return (
              <div className="bg-surface-3 border border-border rounded-lg px-3 py-2 text-xs">
                <p className="font-medium text-zinc-200">{s.strategyName}</p>
                <p className={`font-mono font-semibold ${s.totalPnl >= 0 ? 'text-profit' : 'text-loss'}`}>
                  {s.totalPnl >= 0 ? '+' : ''}${s.totalPnl.toFixed(2)}
                </p>
                <p className="text-zinc-400">Win rate: {(s.winRate * 100).toFixed(1)}%</p>
                <p className="text-zinc-400">Avg RR: {s.avgRR.toFixed(2)}</p>
              </div>
            );
          }}
        />
        <Bar
          dataKey="totalPnl"
          radius={[0, 3, 3, 0]}
          fill="#6366f1"
          fillOpacity={0.8}
          maxBarSize={20}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
