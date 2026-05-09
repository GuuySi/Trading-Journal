import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { requireAuth, type AuthRequest } from '../middleware/auth';

const router = Router();
router.use(requireAuth);

const StrategySchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
});

router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const strategies = await prisma.strategy.findMany({
      where: { userId: req.userId! },
      include: { _count: { select: { trades: true } } },
      orderBy: { name: 'asc' },
    });
    res.json({ strategies });
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req: AuthRequest, res, next) => {
  try {
    const data = StrategySchema.parse(req.body);
    const strategy = await prisma.strategy.create({
      data: { ...data, userId: req.userId! },
    });
    res.status(201).json({ strategy });
  } catch (err) {
    next(err);
  }
});

router.put('/:id', async (req: AuthRequest, res, next) => {
  try {
    const data = StrategySchema.partial().parse(req.body);
    const strategy = await prisma.strategy.updateMany({
      where: { id: req.params.id, userId: req.userId! },
      data,
    });
    if (strategy.count === 0) {
      res.status(404).json({ error: 'Strategy not found' });
      return;
    }
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req: AuthRequest, res, next) => {
  try {
    await prisma.strategy.deleteMany({
      where: { id: req.params.id, userId: req.userId! },
    });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;
