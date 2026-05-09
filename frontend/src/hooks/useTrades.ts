import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tradesApi, strategiesApi, type TradeListParams } from '@/lib/api';
import type { TradeFormData } from '@/types';

export const tradeKeys = {
  all: ['trades'] as const,
  lists: () => [...tradeKeys.all, 'list'] as const,
  list: (params?: TradeListParams) => [...tradeKeys.lists(), params] as const,
  detail: (id: string) => [...tradeKeys.all, 'detail', id] as const,
  strategies: ['strategies'] as const,
};

export function useTrades(params?: TradeListParams) {
  return useQuery({
    queryKey: tradeKeys.list(params),
    queryFn: () => tradesApi.list(params),
  });
}

export function useTrade(id: string) {
  return useQuery({
    queryKey: tradeKeys.detail(id),
    queryFn: () => tradesApi.get(id),
    enabled: !!id,
  });
}

export function useStrategies() {
  return useQuery({
    queryKey: tradeKeys.strategies,
    queryFn: strategiesApi.list,
  });
}

export function useCreateTrade() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: TradeFormData) => tradesApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: tradeKeys.lists() });
      qc.invalidateQueries({ queryKey: ['analytics'] });
    },
  });
}

export function useUpdateTrade(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<TradeFormData>) => tradesApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: tradeKeys.lists() });
      qc.invalidateQueries({ queryKey: tradeKeys.detail(id) });
      qc.invalidateQueries({ queryKey: ['analytics'] });
    },
  });
}

export function useDeleteTrade() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => tradesApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: tradeKeys.lists() });
      qc.invalidateQueries({ queryKey: ['analytics'] });
    },
  });
}

export function useCreateStrategy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; description?: string }) =>
      strategiesApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: tradeKeys.strategies });
    },
  });
}
