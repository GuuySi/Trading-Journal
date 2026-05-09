import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { format } from 'date-fns';
import type { EquityPoint } from '@/types';

interface Props {
  data: EquityPoint[];
}

export function DrawdownChart({ data }: Props) {
  if (!data.length) {
    return (
      <div className="flex items-center justify-center h-48 text-zinc-600 text-sm">
        No data yet
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={160}>
      <AreaChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
        <defs>
          <linearGradient id="ddGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
          </linearGradient>
        </defs>
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
          tickFormatter={(v) => `-${v}%`}
          tick={{ fontSize: 10, fill: '#71717a' }}
          axisLine={false}
          tickLine={false}
          width={50}
        />
        <Tooltip
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            const p = payload[0].payload as EquityPoint;
            return (
              <div className="bg-surface-3 border border-border rounded-lg px-3 py-2 text-xs">
                <p className="text-zinc-400">{format(new Date(p.date), 'MMM d')}</p>
                <p className="text-loss font-mono font-semibold">-{p.drawdownPct.toFixed(2)}%</p>
              </div>
            );
          }}
        />
        <Area
          type="monotone"
          dataKey="drawdownPct"
          stroke="#ef4444"
          strokeWidth={1.5}
          fill="url(#ddGrad)"
          dot={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
