import axios from 'axios';
import type {
  Trade,
  TradeFormData,
  AnalyticsSummary,
  EquityPoint,
  DailyPnL,
  StrategyStats,
  HourlyStats,
  SymbolStats,
  Strategy,
  AnalyticsFilters,
  User,
} from '@/types';

const api = axios.create({ baseURL: '/api' });

// Inject token on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-logout on 401
api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// ──────────────────────────────────────────────
// Auth
// ──────────────────────────────────────────────
export const authApi = {
  register: (data: { email: string; password: string; displayName?: string }) =>
    api.post<{ token: string; user: User }>('/auth/register', data).then((r) => r.data),

  login: (data: { email: string; password: string }) =>
    api.post<{ token: string; user: User }>('/auth/login', data).then((r) => r.data),

  me: () => api.get<{ user: User }>('/auth/me').then((r) => r.data.user),

  updateProfile: (data: { displayName?: string; password?: string }) =>
    api.patch<{ user: User }>('/auth/me', data).then((r) => r.data.user),
};

// ──────────────────────────────────────────────
// Trades
// ──────────────────────────────────────────────
export interface TradeListParams {
  page?: number;
  limit?: number;
  mode?: string;
  result?: string;
  symbol?: string;
  strategyId?: string;
  from?: string;
  to?: string;
}

export interface TradeListResponse {
  total: number;
  page: number;
  limit: number;
  trades: Trade[];
}

export const tradesApi = {
  list: (params?: TradeListParams) =>
    api.get<TradeListResponse>('/trades', { params }).then((r) => r.data),

  get: (id: string) =>
    api.get<{ trade: Trade }>(`/trades/${id}`).then((r) => r.data.trade),

  create: (data: TradeFormData) =>
    api.post<{ trade: Trade }>('/trades', data).then((r) => r.data.trade),

  update: (id: string, data: Partial<TradeFormData>) =>
    api.put<{ trade: Trade }>(`/trades/${id}`, data).then((r) => r.data.trade),

  delete: (id: string) => api.delete(`/trades/${id}`).then((r) => r.data),

  uploadScreenshot: (id: string, file: File) => {
    const form = new FormData();
    form.append('screenshot', file);
    return api
      .post<{ screenshotUrl: string }>(`/trades/${id}/screenshot`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data.screenshotUrl);
  },

  exportCsv: () =>
    api
      .get('/trades/export/csv', { responseType: 'blob' })
      .then((r) => {
        const url = window.URL.createObjectURL(new Blob([r.data]));
        const a = document.createElement('a');
        a.href = url;
        a.download = `trades-${Date.now()}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
      }),

  importCsv: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return api
      .post<{ imported: number; errors: string[] }>('/trades/import/csv', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data);
  },
};

// ──────────────────────────────────────────────
// Analytics
// ──────────────────────────────────────────────
function filterParams(f?: AnalyticsFilters) {
  if (!f) return {};
  const p: Record<string, string> = {};
  if (f.mode && f.mode !== 'ALL') p.mode = f.mode;
  if (f.strategyId) p.strategyId = f.strategyId;
  if (f.symbol) p.symbol = f.symbol;
  if (f.from) p.from = f.from;
  if (f.to) p.to = f.to;
  return p;
}

export const analyticsApi = {
  summary: (f?: AnalyticsFilters) =>
    api
      .get<AnalyticsSummary>('/analytics/summary', { params: filterParams(f) })
      .then((r) => r.data),

  equityCurve: (f?: AnalyticsFilters) =>
    api
      .get<{ points: EquityPoint[] }>('/analytics/equity-curve', {
        params: filterParams(f),
      })
      .then((r) => r.data.points),

  dailyPnl: (f?: AnalyticsFilters) =>
    api
      .get<{ days: DailyPnL[] }>('/analytics/daily-pnl', {
        params: filterParams(f),
      })
      .then((r) => r.data.days),

  strategyPerformance: (f?: AnalyticsFilters) =>
    api
      .get<{ strategies: StrategyStats[] }>('/analytics/strategy-performance', {
        params: filterParams(f),
      })
      .then((r) => r.data.strategies),

  hourly: (f?: AnalyticsFilters) =>
    api
      .get<{ hours: HourlyStats[] }>('/analytics/hourly', {
        params: filterParams(f),
      })
      .then((r) => r.data.hours),

  symbolPerformance: (f?: AnalyticsFilters) =>
    api
      .get<{ symbols: SymbolStats[] }>('/analytics/symbol-performance', {
        params: filterParams(f),
      })
      .then((r) => r.data.symbols),

  rrDistribution: (f?: AnalyticsFilters) =>
    api
      .get<{ data: { rr: number; result: string }[] }>('/analytics/rr-distribution', {
        params: filterParams(f),
      })
      .then((r) => r.data.data),
};

// ──────────────────────────────────────────────
// Strategies
// ──────────────────────────────────────────────
export const strategiesApi = {
  list: () =>
    api.get<{ strategies: Strategy[] }>('/strategies').then((r) => r.data.strategies),

  create: (data: { name: string; description?: string }) =>
    api.post<{ strategy: Strategy }>('/strategies', data).then((r) => r.data.strategy),

  update: (id: string, data: { name?: string; description?: string }) =>
    api.put(`/strategies/${id}`, data).then((r) => r.data),

  delete: (id: string) => api.delete(`/strategies/${id}`).then((r) => r.data),
};
