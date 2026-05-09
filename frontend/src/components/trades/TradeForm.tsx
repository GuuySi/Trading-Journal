import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { cn, toInputDateTime } from '@/lib/utils';
import { Input, Select, Textarea } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useStrategies, useCreateStrategy } from '@/hooks/useTrades';
import type { Trade, TradeFormData, MistakeTag, Direction, TradeMode } from '@/types';
import { Plus } from 'lucide-react';

const schema = z.object({
  symbol: z.string().min(1, 'Required').max(20),
  direction: z.enum(['LONG', 'SHORT']),
  mode: z.enum(['LIVE', 'PAPER']),
  entryTime: z.string().min(1, 'Required'),
  exitTime: z.string().optional(),
  entryPrice: z.coerce.number().positive('Must be positive'),
  exitPrice: z.coerce.number().positive().optional().or(z.literal('')),
  stopLoss: z.coerce.number().positive().optional().or(z.literal('')),
  takeProfit: z.coerce.number().positive().optional().or(z.literal('')),
  positionSize: z.coerce.number().positive('Must be positive'),
  accountBalance: z.coerce.number().positive().optional().or(z.literal('')),
  fees: z.coerce.number().min(0).default(0),
  strategyId: z.string().optional(),
  notes: z.string().max(5000).optional(),
  executionRating: z.coerce.number().int().min(1).max(10).optional().or(z.literal('')),
});

type FormValues = z.infer<typeof schema>;

const MISTAKE_TAGS: { value: MistakeTag; label: string }[] = [
  { value: 'FOMO', label: 'FOMO' },
  { value: 'REVENGE', label: 'Revenge Trade' },
  { value: 'EARLY_EXIT', label: 'Early Exit' },
  { value: 'OVERSIZE', label: 'Oversized' },
  { value: 'NO_PLAN', label: 'No Plan' },
  { value: 'MOVED_SL', label: 'Moved SL' },
  { value: 'CHASED', label: 'Chased Entry' },
];

const POPULAR_SYMBOLS = ['EURUSD', 'GBPUSD', 'XAUUSD', 'NAS100', 'SPX500', 'BTCUSD', 'ETHUSD', 'USDJPY'];

interface Props {
  trade?: Trade;
  onSuccess?: (trade: Trade) => void;
  onCancel?: () => void;
  defaultMode?: TradeMode;
}

export function TradeForm({ trade, onSuccess, onCancel, defaultMode = 'LIVE' }: Props) {
  const { data: strategies } = useStrategies();
  const createStrategy = useCreateStrategy();
  const [selectedTags, setSelectedTags] = useState<string[]>(trade?.tags ?? []);
  const [selectedMistakes, setSelectedMistakes] = useState<MistakeTag[]>(
    (trade?.mistakeTags ?? []) as MistakeTag[]
  );
  const [newStrategyName, setNewStrategyName] = useState('');
  const [showNewStrategy, setShowNewStrategy] = useState(false);
  const [previewRR, setPreviewRR] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    control,
    formState: { errors, isSubmitting },
    setValue,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      symbol: trade?.symbol ?? '',
      direction: trade?.direction ?? 'LONG',
      mode: trade?.mode ?? defaultMode,
      entryTime: trade?.entryTime ? toInputDateTime(trade.entryTime) : toInputDateTime(),
      exitTime: trade?.exitTime ? toInputDateTime(trade.exitTime) : '',
      entryPrice: trade?.entryPrice ?? ('' as unknown as number),
      exitPrice: trade?.exitPrice ?? ('' as unknown as number),
      stopLoss: trade?.stopLoss ?? ('' as unknown as number),
      takeProfit: trade?.takeProfit ?? ('' as unknown as number),
      positionSize: trade?.positionSize ?? ('' as unknown as number),
      accountBalance: trade?.accountBalance ?? ('' as unknown as number),
      fees: trade?.fees ?? 0,
      strategyId: trade?.strategyId ?? '',
      notes: trade?.notes ?? '',
      executionRating: trade?.executionRating ?? ('' as unknown as number),
    },
  });

  const [entry, exit, sl, tp, direction, size] = watch([
    'entryPrice',
    'exitPrice',
    'stopLoss',
    'takeProfit',
    'direction',
    'positionSize',
  ]);

  // Live RR preview
  useEffect(() => {
    if (!entry || !sl || !exit) {
      setPreviewRR(null);
      return;
    }
    const risk = Math.abs(entry - sl);
    const reward = Math.abs((exit || tp || 0) - entry);
    if (risk > 0 && reward > 0) {
      setPreviewRR((reward / risk).toFixed(2));
    } else {
      setPreviewRR(null);
    }
  }, [entry, exit, sl, tp]);

  function toggleTag(tag: string) {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }

  function toggleMistake(tag: MistakeTag) {
    setSelectedMistakes((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }

  async function addStrategy() {
    if (!newStrategyName.trim()) return;
    const s = await createStrategy.mutateAsync({ name: newStrategyName.trim() });
    setValue('strategyId', s.id);
    setNewStrategyName('');
    setShowNewStrategy(false);
  }

  async function onSubmit(values: FormValues) {
    const payload: TradeFormData = {
      symbol: values.symbol.toUpperCase(),
      direction: values.direction,
      mode: values.mode,
      entryTime: new Date(values.entryTime).toISOString(),
      exitTime: values.exitTime ? new Date(values.exitTime).toISOString() : undefined,
      entryPrice: values.entryPrice,
      exitPrice: values.exitPrice || undefined,
      stopLoss: values.stopLoss || undefined,
      takeProfit: values.takeProfit || undefined,
      positionSize: values.positionSize,
      accountBalance: values.accountBalance || undefined,
      fees: values.fees,
      strategyId: values.strategyId || undefined,
      tags: selectedTags,
      mistakeTags: selectedMistakes,
      notes: values.notes || undefined,
      executionRating: values.executionRating ? Number(values.executionRating) : undefined,
    };

    // Parent handles the actual API call (create or update)
    onSuccess?.(payload as unknown as Trade);
  }

  const directionValue = watch('direction');
  const modeValue = watch('mode');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      {/* Row 1: Symbol + Direction + Mode */}
      <div className="grid grid-cols-12 gap-2">
        <div className="col-span-4">
          <Input
            label="Symbol"
            list="symbols"
            placeholder="EURUSD"
            error={errors.symbol?.message}
            {...register('symbol')}
          />
          <datalist id="symbols">
            {POPULAR_SYMBOLS.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
        </div>

        <div className="col-span-4 flex flex-col gap-1">
          <label className="text-xs font-medium text-zinc-400 uppercase tracking-wide">Direction</label>
          <div className="flex rounded-lg overflow-hidden border border-border h-[34px]">
            {(['LONG', 'SHORT'] as Direction[]).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setValue('direction', d)}
                className={cn(
                  'flex-1 text-xs font-semibold transition-colors',
                  directionValue === d
                    ? d === 'LONG' ? 'bg-profit text-black' : 'bg-loss text-white'
                    : 'bg-surface-3 text-zinc-500 hover:text-zinc-300'
                )}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        <div className="col-span-4 flex flex-col gap-1">
          <label className="text-xs font-medium text-zinc-400 uppercase tracking-wide">Mode</label>
          <div className="flex rounded-lg overflow-hidden border border-border h-[34px]">
            {(['LIVE', 'PAPER'] as TradeMode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setValue('mode', m)}
                className={cn(
                  'flex-1 text-xs font-semibold transition-colors',
                  modeValue === m
                    ? m === 'LIVE' ? 'bg-blue-500 text-white' : 'bg-yellow-500 text-black'
                    : 'bg-surface-3 text-zinc-500 hover:text-zinc-300'
                )}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Row 2: Times */}
      <div className="grid grid-cols-2 gap-2">
        <Input type="datetime-local" label="Entry Time" error={errors.entryTime?.message} {...register('entryTime')} />
        <Input type="datetime-local" label="Exit Time" {...register('exitTime')} />
      </div>

      {/* Row 3: Entry / Exit / SL / TP in one row */}
      <div className="grid grid-cols-4 gap-2">
        <Input type="number" step="any" label="Entry" placeholder="0.00" error={errors.entryPrice?.message} {...register('entryPrice')} />
        <Input type="number" step="any" label="Exit" placeholder="0.00" {...register('exitPrice')} />
        <Input type="number" step="any" label="Stop Loss" placeholder="0.00" {...register('stopLoss')} />
        <Input type="number" step="any" label="Take Profit" placeholder="0.00" {...register('takeProfit')} />
      </div>

      {/* Row 4: Size + Balance + Fees + RR inline */}
      <div className="grid grid-cols-4 gap-2">
        <Input type="number" step="any" label="Size" placeholder="1.00" error={errors.positionSize?.message} {...register('positionSize')} />
        <Input type="number" step="any" label="Balance" placeholder="10000" {...register('accountBalance')} />
        <Input type="number" step="any" label="Fees" placeholder="0.00" {...register('fees')} />
        <div className="flex flex-col gap-1 justify-end">
          <label className="text-xs font-medium text-zinc-400 uppercase tracking-wide">R:R</label>
          <div className="h-[34px] flex items-center px-3 bg-surface-3 border border-border rounded-lg">
            <span className="font-mono text-sm font-semibold text-accent">
              {previewRR ? `${previewRR}R` : '—'}
            </span>
          </div>
        </div>
      </div>

      {/* Strategy */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-zinc-400 uppercase tracking-wide">Strategy</label>
          <button
            type="button"
            onClick={() => setShowNewStrategy((v) => !v)}
            className="flex items-center gap-1 text-xs text-accent hover:text-accent/80 transition-colors"
          >
            <Plus className="h-3 w-3" /> New
          </button>
        </div>
        {showNewStrategy ? (
          <div className="flex gap-2">
            <input
              className="input-base flex-1"
              placeholder="Strategy name..."
              value={newStrategyName}
              onChange={(e) => setNewStrategyName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addStrategy(); } }}
              autoFocus
            />
            <Button type="button" size="sm" onClick={addStrategy} loading={createStrategy.isPending}>Add</Button>
          </div>
        ) : (
          <Select {...register('strategyId')}>
            <option value="">— No strategy —</option>
            {strategies?.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </Select>
        )}
      </div>

      {/* Tags + Mistakes side by side */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide mb-1.5">Setup Tags</p>
          <div className="flex flex-wrap gap-1.5">
            {['SMC', 'Breakout', 'Liq. Grab', 'OB', 'FVG', 'BOS', 'CHOCH', 'Trend', 'Range', 'News'].map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                className={cn(
                  'px-2 py-0.5 rounded-full text-xs transition-colors border',
                  selectedTags.includes(tag)
                    ? 'bg-accent border-accent text-white'
                    : 'bg-surface-3 border-border text-zinc-400 hover:text-zinc-200'
                )}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide mb-1.5">Mistakes</p>
          <div className="flex flex-wrap gap-1.5">
            {MISTAKE_TAGS.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => toggleMistake(value)}
                className={cn(
                  'px-2 py-0.5 rounded-full text-xs transition-colors border',
                  selectedMistakes.includes(value)
                    ? 'bg-loss-muted border-loss/50 text-loss'
                    : 'bg-surface-3 border-border text-zinc-400 hover:text-zinc-200'
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Notes + Rating side by side */}
      <div className="grid grid-cols-3 gap-2">
        <div className="col-span-2">
          <Textarea
            label="Notes"
            rows={2}
            placeholder="What happened? Psychology? Lessons?"
            {...register('notes')}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-zinc-400 uppercase tracking-wide">Execution (1–10)</label>
          <div className="flex-1 flex flex-col justify-center gap-1">
            <input type="range" min={1} max={10} step={1} className="w-full accent-accent" {...register('executionRating')} />
            <span className="text-center font-mono text-sm text-zinc-200">{watch('executionRating') || '—'}</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-1">
        <Button type="submit" loading={isSubmitting} className="flex-1">
          {trade ? 'Update Trade' : 'Log Trade'}
        </Button>
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
        )}
      </div>
    </form>
  );
}
