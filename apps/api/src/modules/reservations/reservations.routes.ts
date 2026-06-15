import { Router } from 'express';
import { z } from 'zod';
import { reserveDrop, getActiveReservation } from './reservations.service.js';

const router = Router();

const reserveSchema = z.object({ userId: z.string().min(1) });

router.post('/drops/:dropId/reserve', async (req, res, next) => {
  try {
    const { userId } = reserveSchema.parse(req.body);
    const result = await reserveDrop({ dropId: req.params.dropId, userId });
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

router.get('/drops/:dropId/reservations/active', async (req, res, next) => {
  try {
    const query = z.object({ userId: z.string().min(1) }).parse(req.query);
    res.json(await getActiveReservation(query.userId, req.params.dropId));
  } catch (error) {
    next(error);
  }
});

export { router as reservationsRouter };
