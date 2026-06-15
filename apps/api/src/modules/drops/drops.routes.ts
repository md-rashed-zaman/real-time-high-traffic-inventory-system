import { Router } from 'express';
import { z } from 'zod';
import { createDrop, listDrops } from './drops.service.js';

const router = Router();

const createDropSchema = z.object({
  name: z.string().trim().min(1).max(120),
  totalStock: z.number().int().positive(),
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date().optional()
});

router.get('/', async (_req, res, next) => {
  try {
    res.json(await listDrops());
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const input = createDropSchema.parse(req.body);
    const drop = await createDrop(input);
    res.status(201).json(drop);
  } catch (error) {
    next(error);
  }
});

export { router as dropsRouter };
