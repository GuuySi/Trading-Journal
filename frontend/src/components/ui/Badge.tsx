import { cn, resultBadgeClass } from '@/lib/utils';
import type { TradeResult, Direction, TradeMode } from '@/types';

interface BadgeProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'win' | 'loss' | 'open' | 'breakeven' | 'long' | 'short' | 'live' | 'paper';
}

export function Badge({ children, className, variant = 'default' }: BadgeProps) {
  const variants = {
    default: 'bg-surface-4 text-zinc-300',
    win: 'bg-profit-muted text-profit',
    loss: 'bg-loss-muted text-loss',
    open: 'bg-accent-muted text-accent',
    breakeven: 'bg-zinc-800 text-zinc-400',
    long: 'bg-profit-muted text-profit',
    short: 'bg-loss-muted text-loss',
    live: 'bg-blue-500/10 text-blue-400',
    paper: 'bg-yellow-500/10 text-yellow-400',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wide',
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

export function ResultBadge({ result }: { result: TradeResult }) {
  const v =
    result === 'WIN'
      ? 'win'
      : result === 'LOSS'
      ? 'loss'
      : result === 'OPEN'
      ? 'open'
      : 'breakeven';
  return <Badge variant={v as BadgeProps['variant']}>{result}</Badge>;
}

export function DirectionBadge({ direction }: { direction: Direction }) {
  return (
    <Badge variant={direction === 'LONG' ? 'long' : 'short'}>{direction}</Badge>
  );
}

export function ModeBadge({ mode }: { mode: TradeMode }) {
  return <Badge variant={mode === 'LIVE' ? 'live' : 'paper'}>{mode}</Badge>;
}
