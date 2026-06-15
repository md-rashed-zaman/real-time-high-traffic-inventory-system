import { ReservationStatus } from '@prisma/client';
import { env } from '../config/env.js';
import { prisma } from '../db/prisma.js';
import { emitStockUpdated } from '../realtime/socket.js';

export async function expireReservations() {
  const expired = await prisma.$transaction(async (tx) => {
    const reservations = await tx.reservation.findMany({
      where: {
        status: ReservationStatus.ACTIVE,
        expiresAt: { lte: new Date() }
      },
      select: { id: true, dropId: true }
    });

    if (reservations.length === 0) {
      return [];
    }

    await tx.reservation.updateMany({
      where: { id: { in: reservations.map((reservation) => reservation.id) } },
      data: { status: ReservationStatus.EXPIRED }
    });

    const expirationsByDrop = new Map<string, number>();

    for (const reservation of reservations) {
      expirationsByDrop.set(reservation.dropId, (expirationsByDrop.get(reservation.dropId) ?? 0) + 1);
    }

    const updates = [];

    for (const [dropId, count] of expirationsByDrop) {
      const drop = await tx.drop.update({
        where: { id: dropId },
        data: { availableStock: { increment: count } },
        select: { id: true, availableStock: true }
      });

      updates.push(drop);
    }

    return updates;
  });

  for (const drop of expired) {
    emitStockUpdated({ dropId: drop.id, availableStock: drop.availableStock });
  }
}

export function startExpirationWorker() {
  const interval = setInterval(() => {
    expireReservations().catch((error) => {
      console.error('Reservation expiration worker failed', error);
    });
  }, env.EXPIRATION_WORKER_INTERVAL_MS);

  interval.unref();
}
