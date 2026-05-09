import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { requireAuth, type AuthRequest } from '../middleware/auth';

const router = Router();

const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  displayName: z.string().min(1).optional(),
});

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

function signToken(userId: string): string {
  return jwt.sign({ userId }, process.env.JWT_SECRET!, { expiresIn: '30d' });
}

router.post('/register', async (req, res, next) => {
  try {
    const { email, password, displayName } = RegisterSchema.parse(req.body);

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      res.status(409).json({ error: 'Email already registered' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { email, passwordHash, displayName },
    });

    const token = signToken(user.id);
    res.status(201).json({
      token,
      user: { id: user.id, email: user.email, displayName: user.displayName },
    });
  } catch (err) {
    next(err);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = LoginSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const token = signToken(user.id);
    res.json({
      token,
      user: { id: user.id, email: user.email, displayName: user.displayName },
    });
  } catch (err) {
    next(err);
  }
});

router.get('/me', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId! },
      select: { id: true, email: true, displayName: true, createdAt: true },
    });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json({ user });
  } catch (err) {
    next(err);
  }
});

router.patch('/me', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const Schema = z.object({
      displayName: z.string().min(1).optional(),
      password: z.string().min(8).optional(),
    });
    const { displayName, password } = Schema.parse(req.body);

    const data: Record<string, unknown> = {};
    if (displayName) data.displayName = displayName;
    if (password) data.passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.update({
      where: { id: req.userId! },
      data,
      select: { id: true, email: true, displayName: true },
    });
    res.json({ user });
  } catch (err) {
    next(err);
  }
});

export default router;
