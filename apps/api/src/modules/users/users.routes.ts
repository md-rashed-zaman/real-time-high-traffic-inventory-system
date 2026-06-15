import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../db/prisma.js';

const router = Router();

const upsertUserSchema = z.object({
  username: z.string().trim().min(2).max(32).regex(/^[a-zA-Z0-9_-]+$/)
});

router.post('/', async (req, res, next) => {
  try {
    const { username } = upsertUserSchema.parse(req.body);
    const user = await prisma.user.upsert({
      where: { username },
      update: {},
      create: { username }
    });

    res.status(201).json(user);
  } catch (error) {
    next(error);
  }
});

export { router as usersRouter };
