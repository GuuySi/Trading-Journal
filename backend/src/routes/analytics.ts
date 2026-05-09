import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth, type AuthRequest } from '../middleware/auth';
import {
  computeSummary,
  computeEquityCurve,
  computeDailyPnL,
  computeStrategyStats,
  computeHourlyStats,
  computeSymbolStats,
} from '../utils/calculations';

const router = Router();
router.use(requireAuth);

function buildWhere(
  userId: string,
  query: Record<string, string>
): Record<string, unknown> {
  const { mode, strategyId, symbol, from, to } = query;
  const where: Record<string, unknown> = { userId };
  if (mode) where.mode = mode;
  if (strategyId) where.strategyId = strategyId;
  if (symbol) where.symbol = symbol.toUpperCase();
  if (from || to) {
    where.entryTime = {
      ...(from ? { gte: new Date(from) } : {}),
      ...(to ? { lte: new Date(to) } : {}),
    };
  }
  return where;
}

// GET /api/analytics/summary
router.get('/summary', async (req: AuthRequest, res, next) => {
  try {
    const trades = await prisma.trade.findMany({
      where: buildWhere(req.userId!, req.query as Record<string, string>),
    });
    res.json(computeSummary(trades));
  } catch (err) {
    next(err);
  }
});

// GET /api/analytics/equity-curve
router.get('/equity-curve', async (req: AuthRequest, res, next) => {
  try {
    const trades = await prisma.trade.findMany({
      where: buildWhere(req.userId!, req.query as Record<string, string>),
    });
    res.json({ points: computeEquityCurve(trades) });
  } catch (err) {
    next(err);
  }
});

// GET /api/analytics/daily-pnl
router.get('/daily-pnl', async (req: AuthRequest, res, next) => {
  try {
    const trades = await prisma.trade.findMany({
      where: buildWhere(req.userId!, req.query as Record<string, string>),
    });
    res.json({ days: computeDailyPnL(trades) });
  } catch (err) {
    next(err);
  }
});

// GET /api/analytics/strategy-performance
router.get('/strategy-performance', async (req: AuthRequest, res, next) => {
  try {
    const [trades, strategies] = await Promise.all([
      prisma.trade.findMany({
        where: buildWhere(req.userId!, req.query as Record<string, string>),
      }),
      prisma.strategy.findMany({ where: { userId: req.userId! } }),
    ]);

    const nameMap = new Map(strategies.map((s) => [s.id, s.name]));
    res.json({ strategies: computeStrategyStats(trades, nameMap) });
  } catch (err) {
    next(err);
  }
});

// GET /api/analytics/hourly
router.get('/hourly', async (req: AuthRequest, res, next) => {
  try {
    const trades = await prisma.trade.findMany({
      where: buildWhere(req.userId!, req.query as Record<string, string>),
    });
    res.json({ hours: computeHourlyStats(trades) });
  } catch (err) {
    next(err);
  }
});

// GET /api/analytics/symbol-performance
router.get('/symbol-performance', async (req: AuthRequest, res, next) => {
  try {
    const trades = await prisma.trade.findMany({
      where: buildWhere(req.userId!, req.query as Record<string, string>),
    });
    res.json({ symbols: computeSymbolStats(trades) });
  } catch (err) {
    next(err);
  }
});

// GET /api/analytics/rr-distribution
router.get('/rr-distribution', async (req: AuthRequest, res, next) => {
  try {
    const trades = await prisma.trade.findMany({
      where: {
        ...buildWhere(req.userId!, req.query as Record<string, string>),
        rr: { not: null },
        result: { not: 'OPEN' },
      },
      select: { rr: true, result: true },
    });
    res.json({
      data: trades.map((t) => ({ rr: t.rr, result: t.result })),
    });
  } catch (err) {
    next(err);
  }
});

export default router;
