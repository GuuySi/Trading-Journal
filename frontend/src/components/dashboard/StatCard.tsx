import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
  icon?: LucideIcon;
  trend?: 'up' | 'down' | 'neutral';
  className?: string;
  valueClassName?: string;
}

export function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  trend,
  className,
  valueClassName,
}: StatCardProps) {
  return (
    <div className={cn('card', className)}>
      <div className="flex items-start justify-between">
        <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide">{label}</p>
        {Icon && (
          <div className="w-7 h-7 rounded-md bg-surface-3 flex items-center justify-center">
            <Icon className="h-3.5 w-3.5 text-zinc-400" />
          </div>
        )}
      </div>
      <p
        className={cn(
          'mt-2 font-mono text-xl font-semibold',
          trend === 'up'
            ? 'text-profit'
            : trend === 'down'
            ? 'text-loss'
            : 'text-zinc-50',
          valueClassName
        )}
      >
        {value}
      </p>
      {sub && <p className="mt-0.5 text-xs text-zinc-500">{sub}</p>}
    </div>
  );
}
