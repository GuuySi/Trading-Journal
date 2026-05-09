import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { format } from 'date-fns';
import type { DailyPnL } from '@/types';

interface Props {
  data: DailyPnL[];
}

export function PnLHistogram({ data }: Props) {
  if (!data.length) {
    return (
      <div className="flex items-center justify-center h-48 text-zinc-600 text-sm">
        No data yet
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#2a2a32" vertical={false} />
        <XAxis
          dataKey="date"
          tickFormatter={(v) => format(new Date(v), 'MMM d')}
          tick={{ fontSize: 10, fill: '#71717a' }}
          axisLine={false}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tickFormatter={(v) => `$${v}`}
          tick={{ fontSize: 10, fill: '#71717a' }}
          axisLine={false}
          tickLine={false}
          width={60}
        />
        <ReferenceLine y={0} stroke="#3a3a44" strokeWidth={1} />
        <Tooltip
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            const p = payload[0].payload as DailyPnL;
            return (
              <div className="bg-surface-3 border border-border rounded-lg px-3 py-2 text-xs">
                <p className="text-zinc-400">{format(new Date(p.date), 'MMM d, yyyy')}</p>
                <p
                  className={`font-mono font-semibold ${p.pnl >= 0 ? 'text-profit' : 'text-loss'}`}
                >
                  {p.pnl >= 0 ? '+' : ''}${p.pnl.toFixed(2)}
                </p>
                <p className="text-zinc-500">{p.trades} trade{p.trades !== 1 ? 's' : ''}</p>
              </div>
            );
          }}
        />
        <Bar dataKey="pnl" radius={[3, 3, 0, 0]} maxBarSize={24}>
          {data.map((entry, i) => (
            <Cell
              key={i}
              fill={entry.pnl >= 0 ? '#22c55e' : '#ef4444'}
              fillOpacity={0.85}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
