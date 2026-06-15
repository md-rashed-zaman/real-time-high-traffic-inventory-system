import { Router } from 'express';
import { z } from 'zod';
import { completePurchase } from './purchases.service.js';

const router = Router();

const purchaseSchema = z.object({ userId: z.string().min(1) });

router.post('/reservations/:reservationId/purchase', async (req, res, next) => {
  try {
    const { userId } = purchaseSchema.parse(req.body);
    const result = await completePurchase({ reservationId: req.params.reservationId, userId });
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

export { router as purchasesRouter };
