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

function CustomTooltip({ active, payload }: { active?: boolean; payload?: { value: number; payload: EquityPoint }[] }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="bg-surface-3 border border-border rounded-lg px-3 py-2 text-xs shadow-xl">
      <p className="text-zinc-400">{format(new Date(p.date), 'MMM d, yyyy HH:mm')}</p>
      <p className="font-mono font-semibold mt-1" style={{ color: p.equity >= 0 ? '#22c55e' : '#ef4444' }}>
        {p.equity >= 0 ? '+' : ''}${p.equity.toFixed(2)}
      </p>
      <p className="text-zinc-500">DD: -{p.drawdownPct.toFixed(1)}%</p>
    </div>
  );
}

export function EquityCurve({ data }: Props) {
  if (!data.length) {
    return (
      <div className="flex items-center justify-center h-48 text-zinc-600 text-sm">
        No closed trades yet
      </div>
    );
  }

  const isPositive = data[data.length - 1]?.equity >= 0;

  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
        <defs>
          <linearGradient id="equityGrad" x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="5%"
              stopColor={isPositive ? '#22c55e' : '#ef4444'}
              stopOpacity={0.2}
            />
            <stop
              offset="95%"
              stopColor={isPositive ? '#22c55e' : '#ef4444'}
              stopOpacity={0}
            />
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
          tickFormatter={(v) => `$${v}`}
          tick={{ fontSize: 10, fill: '#71717a' }}
          axisLine={false}
          tickLine={false}
          width={60}
        />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="equity"
          stroke={isPositive ? '#22c55e' : '#ef4444'}
          strokeWidth={2}
          fill="url(#equityGrad)"
          dot={false}
          activeDot={{ r: 4, strokeWidth: 0 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
