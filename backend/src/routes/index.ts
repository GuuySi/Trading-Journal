import { Router } from 'express';
import authRoutes from './auth';
import tradeRoutes from './trades';
import analyticsRoutes from './analytics';
import strategyRoutes from './strategies';

const router = Router();

router.use('/auth', authRoutes);
router.use('/trades', tradeRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/strategies', strategyRoutes);

export default router;
