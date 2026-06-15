import type { ErrorRequestHandler } from 'express';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import { HttpError } from '../utils/http-error.js';

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof HttpError) {
    res.status(error.statusCode).json({ error: error.code, message: error.message });
    return;
  }

  if (error instanceof ZodError) {
    res.status(400).json({
      error: 'VALIDATION_ERROR',
      message: 'Request validation failed.',
      issues: error.flatten()
    });
    return;
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
    res.status(409).json({
      error: 'CONFLICT',
      message: 'A conflicting record already exists.'
    });
    return;
  }

  console.error(error);
  res.status(500).json({ error: 'INTERNAL_SERVER_ERROR', message: 'Unexpected server error.' });
};
