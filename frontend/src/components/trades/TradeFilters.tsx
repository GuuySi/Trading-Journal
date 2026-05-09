import { Select, Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useStrategies } from '@/hooks/useTrades';
import type { TradeListParams } from '@/lib/api';

interface Props {
  filters: TradeListParams;
  onChange: (f: TradeListParams) => void;
}

export function TradeFilters({ filters, onChange }: Props) {
  const { data: strategies } = useStrategies();

  function set(key: keyof TradeListParams, value: string) {
    onChange({ ...filters, [key]: value || undefined, page: 1 });
  }

  function reset() {
    onChange({ page: 1, limit: filters.limit });
  }

  const hasFilters = !!(
    filters.mode ||
    filters.result ||
    filters.symbol ||
    filters.strategyId ||
    filters.from ||
    filters.to
  );

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="w-32">
        <Select
          label="Mode"
          value={filters.mode ?? ''}
          onChange={(e) => set('mode', e.target.value)}
        >
          <option value="">All modes</option>
          <option value="LIVE">Live</option>
          <option value="PAPER">Paper</option>
        </Select>
      </div>

      <div className="w-32">
        <Select
          label="Result"
          value={filters.result ?? ''}
          onChange={(e) => set('result', e.target.value)}
        >
          <option value="">All results</option>
          <option value="WIN">Win</option>
          <option value="LOSS">Loss</option>
          <option value="BREAKEVEN">Breakeven</option>
          <option value="OPEN">Open</option>
        </Select>
      </div>

      <div className="w-32">
        <Input
          label="Symbol"
          placeholder="EURUSD"
          value={filters.symbol ?? ''}
          onChange={(e) => set('symbol', e.target.value)}
        />
      </div>

      <div className="w-44">
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

      <div className="w-36">
        <Input
          type="date"
          label="From"
          value={filters.from ?? ''}
          onChange={(e) => set('from', e.target.value)}
        />
      </div>

      <div className="w-36">
        <Input
          type="date"
          label="To"
          value={filters.to ?? ''}
          onChange={(e) => set('to', e.target.value)}
        />
      </div>

      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={reset} className="self-end mb-0.5">
          Clear
        </Button>
      )}
    </div>
  );
}
