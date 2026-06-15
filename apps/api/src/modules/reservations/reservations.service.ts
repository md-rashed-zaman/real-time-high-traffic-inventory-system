import { Prisma, ReservationStatus } from '@prisma/client';
import { env } from '../../config/env.js';
import { prisma } from '../../db/prisma.js';
import { emitStockUpdated } from '../../realtime/socket.js';
import { HttpError } from '../../utils/http-error.js';
import { expireReservations } from '../../jobs/expire-reservations.js';

type UpdatedDrop = {
  id: string;
  availableStock: number;
};

export async function reserveDrop(input: { dropId: string; userId: string }) {
  await expireReservations();

  const expiresAt = new Date(Date.now() + env.RESERVATION_TTL_SECONDS * 1000);

  const result = await prisma.$transaction(async (tx) => {
    const drop = await tx.drop.findUnique({ where: { id: input.dropId } });

    if (!drop) {
      throw new HttpError(404, 'DROP_NOT_FOUND', 'Drop was not found.');
    }

    if (drop.startsAt > new Date()) {
      throw new HttpError(409, 'DROP_NOT_STARTED', 'This drop has not started yet.');
    }

    const existingReservation = await tx.reservation.findFirst({
      where: {
        dropId: input.dropId,
        userId: input.userId,
        status: ReservationStatus.ACTIVE,
        expiresAt: { gt: new Date() }
      }
    });

    if (existingReservation) {
      throw new HttpError(409, 'ACTIVE_RESERVATION_EXISTS', 'You already have an active reservation for this drop.');
    }

    const updatedDrops = await tx.$queryRaw<UpdatedDrop[]>`
      UPDATE "Drop"
      SET "availableStock" = "availableStock" - 1,
          "updatedAt" = NOW()
      WHERE "id" = ${input.dropId}
        AND "availableStock" > 0
      RETURNING "id", "availableStock"
    `;

    const updatedDrop = updatedDrops[0];

    if (!updatedDrop) {
      throw new HttpError(409, 'DROP_SOLD_OUT', 'No stock is available for this drop.');
    }

    try {
      const reservation = await tx.reservation.create({
        data: {
          dropId: input.dropId,
          userId: input.userId,
          expiresAt
        }
      });

      return { reservation, availableStock: updatedDrop.availableStock };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new HttpError(409, 'ACTIVE_RESERVATION_EXISTS', 'You already have an active reservation for this drop.');
      }

      throw error;
    }
  });

  emitStockUpdated({ dropId: input.dropId, availableStock: result.availableStock });

  return {
    reservationId: result.reservation.id,
    expiresAt: result.reservation.expiresAt.toISOString(),
    availableStock: result.availableStock
  };
}

export async function getActiveReservation(userId: string, dropId: string) {
  const reservation = await prisma.reservation.findFirst({
    where: {
      userId,
      dropId,
      status: ReservationStatus.ACTIVE,
      expiresAt: { gt: new Date() }
    }
  });

  if (!reservation) {
    return null;
  }

  return {
    reservationId: reservation.id,
    expiresAt: reservation.expiresAt.toISOString()
  };
}
