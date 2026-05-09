import { useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Edit3, Image, Trash2 } from 'lucide-react';
import { useTrade, useUpdateTrade, useDeleteTrade } from '@/hooks/useTrades';
import { TradeForm } from '@/components/trades/TradeForm';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { ResultBadge, DirectionBadge, ModeBadge } from '@/components/ui/Badge';
import { Badge } from '@/components/ui/Badge';
import { fmtPnl, fmtPct, fmtDateTime, fmtDuration, fmtRR, fmt, pnlColor } from '@/lib/utils';
import { tradesApi } from '@/lib/api';
import type { Trade, TradeFormData } from '@/types';

function DetailRow({ label, value, className = '' }: { label: string; value: React.ReactNode; className?: string }) {
  return (
    <div className="flex justify-between items-center py-2.5 border-b border-border/50 last:border-0">
      <span className="text-xs text-zinc-500">{label}</span>
      <span className={`text-sm font-medium ${className}`}>{value}</span>
    </div>
  );
}

export function TradeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [editModal, setEditModal] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: trade, isLoading } = useTrade(id!);
  const updateTrade = useUpdateTrade(id!);
  const deleteTrade = useDeleteTrade();

  async function handleUpdate(data: Trade) {
    await updateTrade.mutateAsync(data as unknown as Partial<TradeFormData>);
    setEditModal(false);
  }

  async function handleDelete() {
    await deleteTrade.mutateAsync(id!);
    navigate('/journal');
  }

  async function handleScreenshot(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !id) return;
    await tradesApi.uploadScreenshot(id, file);
    e.target.value = '';
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-zinc-600">
        Loading trade...
      </div>
    );
  }

  if (!trade) {
    return (
      <div className="text-center py-20">
        <p className="text-zinc-500">Trade not found</p>
        <Link to="/journal" className="text-accent text-sm mt-2 inline-block hover:underline">
          Back to journal
        </Link>
      </div>
    );
  }

  const pnlStyle = pnlColor(trade.pnl);

  return (
    <div className="space-y-5 max-w-4xl animate-fade-in">
      {/* Back nav */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-zinc-400 hover:text-zinc-100 transition-colors text-sm"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
          >
            <Image className="h-3.5 w-3.5" /> Screenshot
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleScreenshot}
          />
          <Button variant="outline" size="sm" onClick={() => setEditModal(true)}>
            <Edit3 className="h-3.5 w-3.5" /> Edit
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => setConfirmDelete(true)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Title row */}
      <div className="card">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-mono font-bold text-zinc-50">{trade.symbol}</h1>
            <DirectionBadge direction={trade.direction} />
            <ModeBadge mode={trade.mode} />
            <ResultBadge result={trade.result} />
          </div>
          <div className="text-right">
            <p className={`text-2xl font-mono font-bold ${pnlStyle}`}>
              {fmtPnl(trade.pnl)}
            </p>
            {trade.pnlPercent != null && (
              <p className={`text-sm font-mono ${pnlStyle}`}>
                {fmtPct(trade.pnlPercent)}
              </p>
            )}
          </div>
        </div>

        {trade.strategy && (
          <p className="mt-2 text-xs text-zinc-500">
            Strategy: <span className="text-accent">{trade.strategy.name}</span>
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Trade details */}
        <div className="card">
          <h2 className="card-header">Trade Details</h2>
          <DetailRow label="Entry Time" value={fmtDateTime(trade.entryTime)} />
          <DetailRow
            label="Exit Time"
            value={trade.exitTime ? fmtDateTime(trade.exitTime) : 'Open'}
          />
          {trade.entryTime && trade.exitTime && (
            <DetailRow
              label="Hold Time"
              value={fmtDuration(trade.entryTime, trade.exitTime)}
            />
          )}
          <DetailRow
            label="Entry Price"
            value={<span className="font-mono">{fmt(trade.entryPrice, 5)}</span>}
          />
          <DetailRow
            label="Exit Price"
            value={
              <span className="font-mono">
                {trade.exitPrice ? fmt(trade.exitPrice, 5) : '—'}
              </span>
            }
          />
          <DetailRow
            label="Stop Loss"
            value={
              <span className="font-mono text-loss">
                {trade.stopLoss ? fmt(trade.stopLoss, 5) : '—'}
              </span>
            }
          />
          <DetailRow
            label="Take Profit"
            value={
              <span className="font-mono text-profit">
                {trade.takeProfit ? fmt(trade.takeProfit, 5) : '—'}
              </span>
            }
          />
          <DetailRow
            label="Position Size"
            value={<span className="font-mono">{fmt(trade.positionSize, 2)}</span>}
          />
          <DetailRow
            label="Fees"
            value={<span className="font-mono text-zinc-400">{fmtPnl(trade.fees)}</span>}
          />
        </div>

        {/* Performance */}
        <div className="card">
          <h2 className="card-header">Performance</h2>
          <DetailRow
            label="Net PnL"
            value={<span className={`font-mono font-semibold ${pnlStyle}`}>{fmtPnl(trade.pnl)}</span>}
          />
          <DetailRow
            label="PnL %"
            value={<span className={`font-mono ${pnlStyle}`}>{fmtPct(trade.pnlPercent)}</span>}
          />
          <DetailRow
            label="Risk Amount"
            value={
              <span className="font-mono text-loss">
                {trade.riskAmount ? fmtPnl(-trade.riskAmount) : '—'}
              </span>
            }
          />
          <DetailRow
            label="Reward Amount"
            value={
              <span className="font-mono text-profit">
                {trade.rewardAmount ? fmtPnl(trade.rewardAmount) : '—'}
              </span>
            }
          />
          <DetailRow
            label="R:R"
            value={<span className="font-mono font-semibold text-accent">{fmtRR(trade.rr)}</span>}
          />
          {trade.executionRating != null && (
            <DetailRow
              label="Execution"
              value={
                <div className="flex items-center gap-2">
                  <div className="flex gap-0.5">
                    {Array.from({ length: 10 }).map((_, i) => (
                      <div
                        key={i}
                        className={`w-2 h-2 rounded-full ${
                          i < trade.executionRating!
                            ? 'bg-accent'
                            : 'bg-surface-4'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-zinc-400">{trade.executionRating}/10</span>
                </div>
              }
            />
          )}
        </div>
      </div>

      {/* Tags */}
      {(trade.tags.length > 0 || trade.mistakeTags.length > 0) && (
        <div className="card">
          <h2 className="card-header">Tags</h2>
          <div className="space-y-3">
            {trade.tags.length > 0 && (
              <div>
                <p className="text-xs text-zinc-600 mb-2">Setup</p>
                <div className="flex flex-wrap gap-2">
                  {trade.tags.map((tag) => (
                    <Badge key={tag}>{tag}</Badge>
                  ))}
                </div>
              </div>
            )}
            {trade.mistakeTags.length > 0 && (
              <div>
                <p className="text-xs text-zinc-600 mb-2">Mistakes</p>
                <div className="flex flex-wrap gap-2">
                  {trade.mistakeTags.map((tag) => (
                    <Badge key={tag} variant="loss">{tag.replace(/_/g, ' ')}</Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Notes */}
      {trade.notes && (
        <div className="card">
          <h2 className="card-header">Notes</h2>
          <p className="text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed">
            {trade.notes}
          </p>
        </div>
      )}

      {/* Screenshot */}
      {trade.screenshotUrl && (
        <div className="card">
          <h2 className="card-header">Screenshot</h2>
          <img
            src={trade.screenshotUrl}
            alt="Trade screenshot"
            className="w-full rounded-lg max-h-[500px] object-contain bg-surface-1"
          />
        </div>
      )}

      {/* Edit modal */}
      <Modal
        open={editModal}
        onClose={() => setEditModal(false)}
        title="Edit Trade"
        size="lg"
      >
        <TradeForm
          trade={trade}
          onSuccess={handleUpdate}
          onCancel={() => setEditModal(false)}
        />
      </Modal>

      {/* Delete confirmation */}
      <Modal
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Delete Trade"
        size="sm"
      >
        <p className="text-sm text-zinc-400 mb-4">
          Are you sure you want to delete this{' '}
          <span className="font-mono font-semibold text-zinc-200">{trade.symbol}</span> trade?
          This cannot be undone.
        </p>
        <div className="flex gap-3">
          <Button
            variant="danger"
            onClick={handleDelete}
            loading={deleteTrade.isPending}
            className="flex-1"
          >
            Delete
          </Button>
          <Button variant="ghost" onClick={() => setConfirmDelete(false)}>
            Cancel
          </Button>
        </div>
      </Modal>
    </div>
  );
}
