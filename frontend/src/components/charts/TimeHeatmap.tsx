import type { HourlyStats } from '@/types';

interface Props {
  data: HourlyStats[];
}

function hourLabel(h: number): string {
  if (h === 0) return '12am';
  if (h === 12) return '12pm';
  return h < 12 ? `${h}am` : `${h - 12}pm`;
}

export function TimeHeatmap({ data }: Props) {
  const maxTrades = Math.max(...data.map((d) => d.trades), 1);
  const maxPnl = Math.max(...data.map((d) => Math.abs(d.totalPnl)), 1);

  return (
    <div>
      <div className="grid grid-cols-12 gap-1.5">
        {data.map((h) => {
          const intensity = h.trades / maxTrades;
          const isPositive = h.totalPnl >= 0;
          const pnlIntensity = Math.abs(h.totalPnl) / maxPnl;

          return (
            <div
              key={h.hour}
              className="group relative"
            >
              <div
                className="h-10 rounded-md transition-all cursor-default"
                style={{
                  backgroundColor:
                    h.trades === 0
                      ? '#1a1a20'
                      : isPositive
                      ? `rgba(34, 197, 94, ${0.15 + pnlIntensity * 0.7})`
                      : `rgba(239, 68, 68, ${0.15 + pnlIntensity * 0.7})`,
                  opacity: h.trades === 0 ? 0.4 : 1,
                }}
              />
              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10 pointer-events-none">
                <div className="bg-surface-3 border border-border rounded-lg px-2.5 py-2 text-xs whitespace-nowrap shadow-xl">
                  <p className="font-medium text-zinc-200">{hourLabel(h.hour)}</p>
                  <p className="text-zinc-400">{h.trades} trades</p>
                  {h.trades > 0 && (
                    <>
                      <p className={`font-mono ${isPositive ? 'text-profit' : 'text-loss'}`}>
                        {isPositive ? '+' : ''}${h.totalPnl.toFixed(2)}
                      </p>
                      <p className="text-zinc-400">WR: {(h.winRate * 100).toFixed(0)}%</p>
                    </>
                  )}
                </div>
              </div>
              <p className="text-center text-zinc-600 text-[9px] mt-1 leading-none">
                {hourLabel(h.hour)}
              </p>
            </div>
          );
        })}
      </div>
      <div className="flex justify-end gap-4 mt-2">
        <span className="flex items-center gap-1 text-xs text-zinc-500">
          <span className="w-3 h-3 rounded-sm bg-profit/40 inline-block" /> Profit
        </span>
        <span className="flex items-center gap-1 text-xs text-zinc-500">
          <span className="w-3 h-3 rounded-sm bg-loss/40 inline-block" /> Loss
        </span>
      </div>
    </div>
  );
}
