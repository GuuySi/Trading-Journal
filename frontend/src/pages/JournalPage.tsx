import { useState } from 'react';
import { Plus, Download, Upload } from 'lucide-react';
import { useTrades, useCreateTrade } from '@/hooks/useTrades';
import { TradeTable } from '@/components/trades/TradeTable';
import { TradeFilters } from '@/components/trades/TradeFilters';
import { TradeForm } from '@/components/trades/TradeForm';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { tradesApi, type TradeListParams } from '@/lib/api';
import type { Trade, TradeFormData } from '@/types';

const PAGE_SIZE = 50;

export function JournalPage() {
  const [showModal, setShowModal] = useState(false);
  const [filters, setFilters] = useState<TradeListParams>({ page: 1, limit: PAGE_SIZE });
  const createTrade = useCreateTrade();

  const { data, isLoading, isFetching } = useTrades(filters);

  async function handleCreate(formData: Trade) {
    await createTrade.mutateAsync(formData as unknown as TradeFormData);
    setShowModal(false);
  }

  async function handleExport() {
    await tradesApi.exportCsv();
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const result = await tradesApi.importCsv(file);
    alert(`Imported ${result.imported} trades${result.errors.length ? `\n${result.errors.join('\n')}` : ''}`);
    e.target.value = '';
    setFilters((f) => ({ ...f })); // trigger refetch
  }

  const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 1;
  const currentPage = filters.page ?? 1;

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-zinc-100">Trade Journal</h1>
          <p className="text-sm text-zinc-500 mt-0.5">
            {data ? `${data.total} trades total` : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-3.5 w-3.5" /> Export CSV
          </Button>
          <label className="cursor-pointer">
            <input
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleImport}
            />
            <span className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium border border-border rounded-lg text-zinc-300 hover:border-zinc-500 hover:text-zinc-100 transition-colors cursor-pointer">
              <Upload className="h-3.5 w-3.5" /> Import CSV
            </span>
          </label>
          <Button onClick={() => setShowModal(true)}>
            <Plus className="h-4 w-4" /> Log Trade
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <TradeFilters filters={filters} onChange={setFilters} />
      </div>

      {/* Table */}
      <div className="card">
        {isLoading ? (
          <div className="py-16 text-center text-zinc-600 text-sm">Loading trades...</div>
        ) : (
          <TradeTable trades={data?.trades ?? []} />
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
            <p className="text-xs text-zinc-500">
              Page {currentPage} of {totalPages} · {data?.total} trades
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage <= 1}
                onClick={() => setFilters((f) => ({ ...f, page: (f.page ?? 1) - 1 }))}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage >= totalPages}
                onClick={() => setFilters((f) => ({ ...f, page: (f.page ?? 1) + 1 }))}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title="Log New Trade"
        size="lg"
      >
        <TradeForm
          onSuccess={handleCreate}
          onCancel={() => setShowModal(false)}
        />
      </Modal>
    </div>
  );
}
