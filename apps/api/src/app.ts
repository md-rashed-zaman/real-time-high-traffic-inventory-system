import express from 'express';
import cors from 'cors';
import { corsOptions } from './config/cors.js';
import { dropsRouter } from './modules/drops/drops.routes.js';
import { usersRouter } from './modules/users/users.routes.js';
import { reservationsRouter } from './modules/reservations/reservations.routes.js';
import { purchasesRouter } from './modules/purchases/purchases.routes.js';
import { errorHandler } from './middleware/error-handler.js';

export function createApp() {
  const app = express();

  app.use(cors(corsOptions));
  app.use(express.json());

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });

  app.use('/api/users', usersRouter);
  app.use('/api/drops', dropsRouter);
  app.use('/api', reservationsRouter);
  app.use('/api', purchasesRouter);
  app.use(errorHandler);

  return app;
}
