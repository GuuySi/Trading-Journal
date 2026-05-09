import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceStrict } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function fmt(value: number | null | undefined, decimals = 2): string {
  if (value == null) return '—';
  return value.toFixed(decimals);
}

export function fmtPnl(value: number | null | undefined): string {
  if (value == null) return '—';
  const sign = value >= 0 ? '+' : '';
  return `${sign}$${Math.abs(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function fmtPct(value: number | null | undefined, decimals = 1): string {
  if (value == null) return '—';
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(decimals)}%`;
}

export function fmtDate(date: string | Date): string {
  return format(new Date(date), 'MMM d, yyyy');
}

export function fmtDateTime(date: string | Date): string {
  return format(new Date(date), 'MMM d, yyyy HH:mm');
}

export function fmtTime(date: string | Date): string {
  return format(new Date(date), 'HH:mm');
}

export function fmtDuration(start: string | Date, end: string | Date): string {
  return formatDistanceStrict(new Date(start), new Date(end));
}

export function fmtHold(minutes: number): string {
  if (minutes < 60) return `${Math.round(minutes)}m`;
  if (minutes < 1440) return `${Math.round(minutes / 60)}h ${Math.round(minutes % 60)}m`;
  return `${Math.round(minutes / 1440)}d`;
}

export function fmtRR(rr: number | null | undefined): string {
  if (rr == null) return '—';
  return `${rr.toFixed(2)}R`;
}

export function pnlColor(value: number | null | undefined): string {
  if (value == null) return 'text-zinc-400';
  if (value > 0) return 'text-profit';
  if (value < 0) return 'text-loss';
  return 'text-zinc-400';
}

export function resultColor(result: string): string {
  switch (result) {
    case 'WIN':
      return 'text-profit';
    case 'LOSS':
      return 'text-loss';
    case 'OPEN':
      return 'text-accent';
    default:
      return 'text-zinc-400';
  }
}

export function resultBadgeClass(result: string): string {
  switch (result) {
    case 'WIN':
      return 'badge-win';
    case 'LOSS':
      return 'badge-loss';
    case 'OPEN':
      return 'badge-open';
    default:
      return 'badge-breakeven';
  }
}

// Local datetime input format: "YYYY-MM-DDTHH:mm"
export function toInputDateTime(date?: Date | string): string {
  const d = date ? new Date(date) : new Date();
  return format(d, "yyyy-MM-dd'T'HH:mm");
}
