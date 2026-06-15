import { ReservationStatus } from '@prisma/client';
import { prisma } from '../../db/prisma.js';
import { emitActivityUpdated } from '../../realtime/socket.js';
import { HttpError } from '../../utils/http-error.js';
import { getLatestPurchasers } from '../drops/drops.service.js';

export async function completePurchase(input: { reservationId: string; userId: string }) {
  const result = await prisma.$transaction(async (tx) => {
    const reservation = await tx.reservation.findUnique({ where: { id: input.reservationId } });

    if (!reservation || reservation.userId !== input.userId) {
      throw new HttpError(404, 'RESERVATION_NOT_FOUND', 'Reservation was not found.');
    }

    if (reservation.status !== ReservationStatus.ACTIVE || reservation.expiresAt <= new Date()) {
      throw new HttpError(409, 'RESERVATION_NOT_ACTIVE', 'Reservation is no longer active.');
    }

    const updated = await tx.reservation.updateMany({
      where: {
        id: input.reservationId,
        userId: input.userId,
        status: ReservationStatus.ACTIVE,
        expiresAt: { gt: new Date() }
      },
      data: { status: ReservationStatus.PURCHASED }
    });

    if (updated.count !== 1) {
      throw new HttpError(409, 'RESERVATION_NOT_ACTIVE', 'Reservation is no longer active.');
    }

    const purchase = await tx.purchase.create({
      data: {
        dropId: reservation.dropId,
        userId: reservation.userId,
        reservationId: reservation.id
      }
    });

    return { purchaseId: purchase.id, dropId: reservation.dropId };
  });

  const latestPurchasers = await getLatestPurchasers(result.dropId);
  emitActivityUpdated({ dropId: result.dropId, latestPurchasers });

  return { purchaseId: result.purchaseId };
}
