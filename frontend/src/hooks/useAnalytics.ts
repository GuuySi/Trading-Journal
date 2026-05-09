import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '@/lib/api';
import type { AnalyticsFilters } from '@/types';

export const analyticsKeys = {
  all: ['analytics'] as const,
  summary: (f?: AnalyticsFilters) => [...analyticsKeys.all, 'summary', f] as const,
  equityCurve: (f?: AnalyticsFilters) => [...analyticsKeys.all, 'equity', f] as const,
  dailyPnl: (f?: AnalyticsFilters) => [...analyticsKeys.all, 'daily', f] as const,
  strategy: (f?: AnalyticsFilters) => [...analyticsKeys.all, 'strategy', f] as const,
  hourly: (f?: AnalyticsFilters) => [...analyticsKeys.all, 'hourly', f] as const,
  symbols: (f?: AnalyticsFilters) => [...analyticsKeys.all, 'symbols', f] as const,
  rr: (f?: AnalyticsFilters) => [...analyticsKeys.all, 'rr', f] as const,
};

export function useSummary(filters?: AnalyticsFilters) {
  return useQuery({
    queryKey: analyticsKeys.summary(filters),
    queryFn: () => analyticsApi.summary(filters),
  });
}

export function useEquityCurve(filters?: AnalyticsFilters) {
  return useQuery({
    queryKey: analyticsKeys.equityCurve(filters),
    queryFn: () => analyticsApi.equityCurve(filters),
  });
}

export function useDailyPnl(filters?: AnalyticsFilters) {
  return useQuery({
    queryKey: analyticsKeys.dailyPnl(filters),
    queryFn: () => analyticsApi.dailyPnl(filters),
  });
}

export function useStrategyPerformance(filters?: AnalyticsFilters) {
  return useQuery({
    queryKey: analyticsKeys.strategy(filters),
    queryFn: () => analyticsApi.strategyPerformance(filters),
  });
}

export function useHourlyStats(filters?: AnalyticsFilters) {
  return useQuery({
    queryKey: analyticsKeys.hourly(filters),
    queryFn: () => analyticsApi.hourly(filters),
  });
}

export function useSymbolPerformance(filters?: AnalyticsFilters) {
  return useQuery({
    queryKey: analyticsKeys.symbols(filters),
    queryFn: () => analyticsApi.symbolPerformance(filters),
  });
}

export function useRRDistribution(filters?: AnalyticsFilters) {
  return useQuery({
    queryKey: analyticsKeys.rr(filters),
    queryFn: () => analyticsApi.rrDistribution(filters),
  });
}
