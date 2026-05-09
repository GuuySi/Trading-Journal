import { Router } from 'express';
import { z } from 'zod';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { parse } from 'csv-parse/sync';
import { prisma } from '../lib/prisma';
import { requireAuth, type AuthRequest } from '../middleware/auth';
import { calculateTradePnL } from '../utils/calculations';

const router = Router();
router.use(requireAuth);

// File upload config
const uploadDir = process.env.UPLOAD_DIR ?? './uploads';
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
    cb(null, allowed.includes(path.extname(file.originalname).toLowerCase()));
  },
});

// ──────────────────────────────────────────────
// Validation
// ──────────────────────────────────────────────
const TradeSchema = z.object({
  symbol: z.string().min(1).max(20).transform((v) => v.toUpperCase()),
  direction: z.enum(['LONG', 'SHORT']),
  mode: z.enum(['LIVE', 'PAPER']).default('LIVE'),
  entryTime: z.string().datetime(),
  exitTime: z.string().datetime().optional().nullable(),
  entryPrice: z.number().positive(),
  exitPrice: z.number().positive().optional().nullable(),
  stopLoss: z.number().positive().optional().nullable(),
  takeProfit: z.number().positive().optional().nullable(),
  positionSize: z.number().positive(),
  accountBalance: z.number().positive().optional().nullable(),
  fees: z.number().min(0).default(0),
  strategyId: z.string().cuid().optional().nullable(),
  tags: z.array(z.string()).default([]),
  mistakeTags: z
    .array(z.enum(['FOMO', 'REVENGE', 'EARLY_EXIT', 'OVERSIZE', 'NO_PLAN', 'MOVED_SL', 'CHASED']))
    .default([]),
  notes: z.string().max(5000).optional().nullable(),
  executionRating: z.number().int().min(1).max(10).optional().nullable(),
});

function serializeTrade(raw: Record<string, unknown>) {
  return {
    ...raw,
    tags: typeof raw.tags === 'string' ? JSON.parse(raw.tags as string) : raw.tags,
    mistakeTags:
      typeof raw.mistakeTags === 'string'
        ? JSON.parse(raw.mistakeTags as string)
        : raw.mistakeTags,
  };
}

// ──────────────────────────────────────────────
// List trades
// ──────────────────────────────────────────────
router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const {
      mode,
      result,
      symbol,
      strategyId,
      from,
      to,
      page = '1',
      limit = '50',
    } = req.query as Record<string, string>;

    const where: Record<string, unknown> = { userId: req.userId! };
    if (mode) where.mode = mode;
    if (result) where.result = result;
    if (symbol) where.symbol = symbol.toUpperCase();
    if (strategyId) where.strategyId = strategyId;
    if (from || to) {
      where.entryTime = {
        ...(from ? { gte: new Date(from) } : {}),
        ...(to ? { lte: new Date(to) } : {}),
      };
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(200, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const [total, trades] = await Promise.all([
      prisma.trade.count({ where }),
      prisma.trade.findMany({
        where,
        include: { strategy: { select: { id: true, name: true } } },
        orderBy: { entryTime: 'desc' },
        skip,
        take: limitNum,
      }),
    ]);

    res.json({
      total,
      page: pageNum,
      limit: limitNum,
      trades: trades.map(serializeTrade),
    });
  } catch (err) {
    next(err);
  }
});

// ──────────────────────────────────────────────
// Get single trade
// ──────────────────────────────────────────────
router.get('/:id', async (req: AuthRequest, res, next) => {
  try {
    const trade = await prisma.trade.findFirst({
      where: { id: req.params.id, userId: req.userId! },
      include: { strategy: { select: { id: true, name: true } } },
    });
    if (!trade) {
      res.status(404).json({ error: 'Trade not found' });
      return;
    }
    res.json({ trade: serializeTrade(trade as unknown as Record<string, unknown>) });
  } catch (err) {
    next(err);
  }
});

// ──────────────────────────────────────────────
// Create trade
// ──────────────────────────────────────────────
router.post('/', async (req: AuthRequest, res, next) => {
  try {
    const data = TradeSchema.parse(req.body);

    const { pnl, pnlPercent, rr, result } = calculateTradePnL({
      direction: data.direction,
      entryPrice: data.entryPrice,
      exitPrice: data.exitPrice ?? null,
      positionSize: data.positionSize,
      fees: data.fees,
      stopLoss: data.stopLoss ?? null,
      accountBalance: data.accountBalance ?? null,
    });

    const riskAmount =
      data.stopLoss != null
        ? Math.abs(data.entryPrice - data.stopLoss) * data.positionSize
        : null;

    const rewardAmount =
      data.takeProfit != null
        ? Math.abs(data.takeProfit - data.entryPrice) * data.positionSize
        : null;

    const trade = await prisma.trade.create({
      data: {
        userId: req.userId!,
        symbol: data.symbol,
        direction: data.direction,
        mode: data.mode,
        entryTime: new Date(data.entryTime),
        exitTime: data.exitTime ? new Date(data.exitTime) : null,
        entryPrice: data.entryPrice,
        exitPrice: data.exitPrice ?? null,
        stopLoss: data.stopLoss ?? null,
        takeProfit: data.takeProfit ?? null,
        positionSize: data.positionSize,
        accountBalance: data.accountBalance ?? null,
        fees: data.fees,
        pnl,
        pnlPercent,
        rr,
        riskAmount,
        rewardAmount,
        result,
        strategyId: data.strategyId ?? null,
        tags: data.tags,
        mistakeTags: data.mistakeTags,
        notes: data.notes ?? null,
        executionRating: data.executionRating ?? null,
      },
      include: { strategy: { select: { id: true, name: true } } },
    });

    res.status(201).json({ trade: serializeTrade(trade as unknown as Record<string, unknown>) });
  } catch (err) {
    next(err);
  }
});

// ──────────────────────────────────────────────
// Update trade
// ──────────────────────────────────────────────
router.put('/:id', async (req: AuthRequest, res, next) => {
  try {
    const existing = await prisma.trade.findFirst({
      where: { id: req.params.id, userId: req.userId! },
    });
    if (!existing) {
      res.status(404).json({ error: 'Trade not found' });
      return;
    }

    const data = TradeSchema.partial().parse(req.body);

    const merged = {
      direction: (data.direction ?? existing.direction) as string,
      entryPrice: data.entryPrice ?? existing.entryPrice,
      exitPrice: data.exitPrice !== undefined ? data.exitPrice : existing.exitPrice,
      positionSize: data.positionSize ?? existing.positionSize,
      fees: data.fees ?? existing.fees,
      stopLoss: data.stopLoss !== undefined ? data.stopLoss : existing.stopLoss,
      accountBalance:
        data.accountBalance !== undefined ? data.accountBalance : existing.accountBalance,
    };

    const { pnl, pnlPercent, rr, result } = calculateTradePnL(merged);

    const riskAmount =
      merged.stopLoss != null
        ? Math.abs(merged.entryPrice - merged.stopLoss) * merged.positionSize
        : existing.riskAmount;

    const rewardAmount =
      data.takeProfit != null
        ? Math.abs(data.takeProfit - merged.entryPrice) * merged.positionSize
        : existing.rewardAmount;

    const updateData: Record<string, unknown> = {};
    if (data.symbol !== undefined) updateData.symbol = data.symbol;
    if (data.direction !== undefined) updateData.direction = data.direction;
    if (data.mode !== undefined) updateData.mode = data.mode;
    if (data.entryTime !== undefined) updateData.entryTime = new Date(data.entryTime);
    if (data.exitTime !== undefined)
      updateData.exitTime = data.exitTime ? new Date(data.exitTime) : null;
    if (data.entryPrice !== undefined) updateData.entryPrice = data.entryPrice;
    if (data.exitPrice !== undefined) updateData.exitPrice = data.exitPrice;
    if (data.stopLoss !== undefined) updateData.stopLoss = data.stopLoss;
    if (data.takeProfit !== undefined) updateData.takeProfit = data.takeProfit;
    if (data.positionSize !== undefined) updateData.positionSize = data.positionSize;
    if (data.accountBalance !== undefined) updateData.accountBalance = data.accountBalance;
    if (data.fees !== undefined) updateData.fees = data.fees;
    if (data.strategyId !== undefined) updateData.strategyId = data.strategyId;
    if (data.tags !== undefined) updateData.tags = data.tags;
    if (data.mistakeTags !== undefined) updateData.mistakeTags = data.mistakeTags;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.executionRating !== undefined) updateData.executionRating = data.executionRating;

    updateData.pnl = pnl;
    updateData.pnlPercent = pnlPercent;
    updateData.rr = rr;
    updateData.result = result;
    updateData.riskAmount = riskAmount;
    updateData.rewardAmount = rewardAmount;

    const trade = await prisma.trade.update({
      where: { id: req.params.id },
      data: updateData,
      include: { strategy: { select: { id: true, name: true } } },
    });

    res.json({ trade: serializeTrade(trade as unknown as Record<string, unknown>) });
  } catch (err) {
    next(err);
  }
});

// ──────────────────────────────────────────────
// Delete trade
// ──────────────────────────────────────────────
router.delete('/:id', async (req: AuthRequest, res, next) => {
  try {
    const deleted = await prisma.trade.deleteMany({
      where: { id: req.params.id, userId: req.userId! },
    });
    if (deleted.count === 0) {
      res.status(404).json({ error: 'Trade not found' });
      return;
    }
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// ──────────────────────────────────────────────
// Screenshot upload
// ──────────────────────────────────────────────
router.post(
  '/:id/screenshot',
  upload.single('screenshot'),
  async (req: AuthRequest, res, next) => {
    try {
      if (!req.file) {
        res.status(400).json({ error: 'No file provided' });
        return;
      }

      const trade = await prisma.trade.findFirst({
        where: { id: req.params.id, userId: req.userId! },
      });
      if (!trade) {
        fs.unlinkSync(req.file.path);
        res.status(404).json({ error: 'Trade not found' });
        return;
      }

      const screenshotUrl = `/uploads/${req.file.filename}`;
      await prisma.trade.update({
        where: { id: req.params.id },
        data: { screenshotUrl },
      });

      res.json({ screenshotUrl });
    } catch (err) {
      next(err);
    }
  }
);

// ──────────────────────────────────────────────
// CSV Export
// ──────────────────────────────────────────────
router.get('/export/csv', async (req: AuthRequest, res, next) => {
  try {
    const trades = await prisma.trade.findMany({
      where: { userId: req.userId! },
      include: { strategy: { select: { name: true } } },
      orderBy: { entryTime: 'asc' },
    });

    const headers = [
      'id',
      'symbol',
      'direction',
      'mode',
      'entryTime',
      'exitTime',
      'entryPrice',
      'exitPrice',
      'stopLoss',
      'takeProfit',
      'positionSize',
      'fees',
      'pnl',
      'pnlPercent',
      'rr',
      'result',
      'strategy',
      'tags',
      'mistakeTags',
      'notes',
      'executionRating',
    ];

    const rows = trades.map((t) =>
      [
        t.id,
        t.symbol,
        t.direction,
        t.mode,
        t.entryTime.toISOString(),
        t.exitTime?.toISOString() ?? '',
        t.entryPrice,
        t.exitPrice ?? '',
        t.stopLoss ?? '',
        t.takeProfit ?? '',
        t.positionSize,
        t.fees,
        t.pnl ?? '',
        t.pnlPercent ?? '',
        t.rr ?? '',
        t.result,
        t.strategy?.name ?? '',
        t.tags,
        t.mistakeTags,
        `"${(t.notes ?? '').replace(/"/g, '""')}"`,
        t.executionRating ?? '',
      ].join(',')
    );

    const csv = [headers.join(','), ...rows].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="trades-${Date.now()}.csv"`
    );
    res.send(csv);
  } catch (err) {
    next(err);
  }
});

// ──────────────────────────────────────────────
// CSV Import
// ──────────────────────────────────────────────
router.post('/import/csv', multer({ storage: multer.memoryStorage() }).single('file'), async (req: AuthRequest, res, next) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No file provided' });
      return;
    }

    const records = parse(req.file.buffer.toString(), {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    }) as Record<string, string>[];

    let imported = 0;
    const errors: string[] = [];

    for (const [i, row] of records.entries()) {
      try {
        const data = TradeSchema.parse({
          symbol: row.symbol,
          direction: row.direction,
          mode: row.mode ?? 'LIVE',
          entryTime: row.entryTime,
          exitTime: row.exitTime || undefined,
          entryPrice: parseFloat(row.entryPrice),
          exitPrice: row.exitPrice ? parseFloat(row.exitPrice) : undefined,
          stopLoss: row.stopLoss ? parseFloat(row.stopLoss) : undefined,
          takeProfit: row.takeProfit ? parseFloat(row.takeProfit) : undefined,
          positionSize: parseFloat(row.positionSize),
          fees: row.fees ? parseFloat(row.fees) : 0,
          tags: row.tags ? JSON.parse(row.tags) : [],
          mistakeTags: row.mistakeTags ? JSON.parse(row.mistakeTags) : [],
          notes: row.notes || undefined,
          executionRating: row.executionRating ? parseInt(row.executionRating) : undefined,
        });

        const { pnl, pnlPercent, rr, result } = calculateTradePnL({
          direction: data.direction,
          entryPrice: data.entryPrice,
          exitPrice: data.exitPrice ?? null,
          positionSize: data.positionSize,
          fees: data.fees,
          stopLoss: data.stopLoss ?? null,
        });

        await prisma.trade.create({
          data: {
            userId: req.userId!,
            symbol: data.symbol,
            direction: data.direction,
            mode: data.mode,
            entryTime: new Date(data.entryTime),
            exitTime: data.exitTime ? new Date(data.exitTime) : null,
            entryPrice: data.entryPrice,
            exitPrice: data.exitPrice ?? null,
            stopLoss: data.stopLoss ?? null,
            takeProfit: data.takeProfit ?? null,
            positionSize: data.positionSize,
            fees: data.fees,
            pnl,
            pnlPercent,
            rr,
            result,
            tags: data.tags,
            mistakeTags: data.mistakeTags,
            notes: data.notes ?? null,
            executionRating: data.executionRating ?? null,
          },
        });
        imported++;
      } catch {
        errors.push(`Row ${i + 2}: invalid data`);
      }
    }

    res.json({ imported, errors });
  } catch (err) {
    next(err);
  }
});

export default router;
