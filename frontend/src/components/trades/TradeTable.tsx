import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Trash2, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
import { ResultBadge, DirectionBadge, ModeBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { fmtPnl, fmtPct, fmtDateTime, fmtRR, pnlColor, fmt } from '@/lib/utils';
import { useDeleteTrade } from '@/hooks/useTrades';
import type { Trade } from '@/types';

type SortKey = 'entryTime' | 'symbol' | 'pnl' | 'rr' | 'result';

interface Props {
  trades: Trade[];
}

export function TradeTable({ trades }: Props) {
  const deleteTrade = useDeleteTrade();
  const [sortKey, setSortKey] = useState<SortKey>('entryTime');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  }

  const sorted = [...trades].sort((a, b) => {
    let va: unknown = a[sortKey];
    let vb: unknown = b[sortKey];
    if (sortKey === 'entryTime') {
      va = new Date(a.entryTime).getTime();
      vb = new Date(b.entryTime).getTime();
    }
    if (va == null) return 1;
    if (vb == null) return -1;
    const cmp = va < vb ? -1 : va > vb ? 1 : 0;
    return sortDir === 'asc' ? cmp : -cmp;
  });

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col) return <ChevronDown className="h-3 w-3 opacity-0 group-hover:opacity-40" />;
    return sortDir === 'asc' ? (
      <ChevronUp className="h-3 w-3 text-accent" />
    ) : (
      <ChevronDown className="h-3 w-3 text-accent" />
    );
  }

  function TH({ col, children }: { col: SortKey; children: React.ReactNode }) {
    return (
      <th
        onClick={() => handleSort(col)}
        className="group px-3 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wide cursor-pointer hover:text-zinc-300 transition-colors select-none"
      >
        <span className="inline-flex items-center gap-1">
          {children}
          <SortIcon col={col} />
        </span>
      </th>
    );
  }

  if (!trades.length) {
    return (
      <div className="text-center py-16 text-zinc-600">
        <p className="text-base">No trades yet</p>
        <p className="text-sm mt-1">Log your first trade to get started</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <TH col="entryTime">Date</TH>
            <TH col="symbol">Symbol</TH>
            <th className="px-3 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wide">Dir</th>
            <th className="px-3 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wide">Mode</th>
            <th className="px-3 py-3 text-right text-xs font-medium text-zinc-500 uppercase tracking-wide">Entry</th>
            <th className="px-3 py-3 text-right text-xs font-medium text-zinc-500 uppercase tracking-wide">Exit</th>
            <th className="px-3 py-3 text-right text-xs font-medium text-zinc-500 uppercase tracking-wide">Risk</th>
            <TH col="rr">R:R</TH>
            <TH col="pnl">PnL</TH>
            <TH col="result">Result</TH>
            <th className="px-3 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">Strategy</th>
            <th className="w-16" />
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {sorted.map((t) => (
            <tr
              key={t.id}
              className="hover:bg-surface-2 transition-colors group"
            >
              <td className="px-3 py-3 text-zinc-400 text-xs whitespace-nowrap">
                {fmtDateTime(t.entryTime)}
              </td>
              <td className="px-3 py-3">
                <Link
                  to={`/trade/${t.id}`}
                  className="font-mono font-semibold text-zinc-100 hover:text-accent transition-colors"
                >
                  {t.symbol}
                </Link>
              </td>
              <td className="px-3 py-3">
                <DirectionBadge direction={t.direction} />
              </td>
              <td className="px-3 py-3">
                <ModeBadge mode={t.mode} />
              </td>
              <td className="px-3 py-3 text-right font-mono text-zinc-300 text-xs">
                {fmt(t.entryPrice, 5)}
              </td>
              <td className="px-3 py-3 text-right font-mono text-zinc-300 text-xs">
                {t.exitPrice ? fmt(t.exitPrice, 5) : '—'}
              </td>
              <td className="px-3 py-3 text-right font-mono text-zinc-400 text-xs">
                {t.riskAmount != null ? `$${t.riskAmount}` : '—'}
              </td>
              <td className="px-3 py-3 text-right font-mono text-zinc-300 text-xs">
                {fmtRR(t.rr)}
              </td>
              <td className={`px-3 py-3 text-right font-mono font-semibold text-sm ${pnlColor(t.pnl)}`}>
                {fmtPnl(t.pnl)}
                {t.pnlPercent != null && (
                  <span className="block text-xs font-normal opacity-70">
                    {fmtPct(t.pnlPercent)}
                  </span>
                )}
              </td>
              <td className="px-3 py-3">
                <ResultBadge result={t.result} />
              </td>
              <td className="px-3 py-3 text-zinc-500 text-xs">
                {t.strategy?.name ?? '—'}
              </td>
              <td className="px-3 py-3">
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Link
                    to={`/trade/${t.id}`}
                    className="p-1.5 text-zinc-500 hover:text-zinc-100 hover:bg-surface-3 rounded transition-colors"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Link>
                  {confirmDelete === t.id ? (
                    <div className="flex gap-1">
                      <button
                        onClick={() => {
                          deleteTrade.mutate(t.id);
                          setConfirmDelete(null);
                        }}
                        className="px-2 py-1 text-xs bg-loss text-white rounded"
                      >
                        Del
                      </button>
                      <button
                        onClick={() => setConfirmDelete(null)}
                        className="px-2 py-1 text-xs bg-surface-3 text-zinc-400 rounded"
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDelete(t.id)}
                      className="p-1.5 text-zinc-500 hover:text-loss hover:bg-loss-muted rounded transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
