import { useState } from 'react';
import type { Drop, Reservation, User } from '../types/domain';
import { completePurchase, reserveDrop } from '../api/client';
import { useCountdown } from '../hooks/useCountdown';

type DropCardProps = {
  drop: Drop;
  user: User | null;
  onMessage: (message: string, tone?: 'success' | 'error') => void;
  onLocalStockUpdate: (dropId: string, availableStock: number) => void;
  onPurchased: () => void;
};

export function DropCard({ drop, user, onMessage, onLocalStockUpdate, onPurchased }: DropCardProps) {
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [isReserving, setIsReserving] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const secondsLeft = useCountdown(reservation?.expiresAt);
  const hasActiveReservation = reservation && secondsLeft > 0;
  const isSoldOut = drop.availableStock <= 0;

  async function handleReserve() {
    if (!user) {
      onMessage('Enter a username before reserving.', 'error');
      return;
    }

    setIsReserving(true);

    try {
      const result = await reserveDrop(drop.id, user.id);
      setReservation({ reservationId: result.reservationId, expiresAt: result.expiresAt });
      onLocalStockUpdate(drop.id, result.availableStock);
      onMessage(`Reserved ${drop.name} for 60 seconds.`, 'success');
    } catch (error) {
      onMessage(error instanceof Error ? error.message : 'Reservation failed.', 'error');
    } finally {
      setIsReserving(false);
    }
  }

  async function handlePurchase() {
    if (!user || !reservation) {
      return;
    }

    setIsPurchasing(true);

    try {
      await completePurchase(reservation.reservationId, user.id);
      setReservation(null);
      onPurchased();
      onMessage('Purchase completed.', 'success');
    } catch (error) {
      onMessage(error instanceof Error ? error.message : 'Purchase failed.', 'error');
    } finally {
      setIsPurchasing(false);
    }
  }

  return (
    <article className="drop-card">
      <div className="drop-card__topline">
        <span>{new Date(drop.startsAt).toLocaleString()}</span>
        <span className={isSoldOut ? 'status status--sold-out' : 'status'}>{isSoldOut ? 'Sold out' : 'Live'}</span>
      </div>

      <h2>{drop.name}</h2>

      <div className="stock-panel">
        <span>Available stock</span>
        <strong>{drop.availableStock}</strong>
        <small>of {drop.totalStock}</small>
      </div>

      {hasActiveReservation ? (
        <div className="reservation-panel">
          <span>Reservation expires in</span>
          <strong>{secondsLeft}s</strong>
        </div>
      ) : null}

      <div className="actions">
        <button disabled={!user || isSoldOut || isReserving || Boolean(hasActiveReservation)} onClick={handleReserve}>
          {isReserving ? 'Reserving...' : hasActiveReservation ? 'Reserved' : 'Reserve'}
        </button>
        <button className="secondary" disabled={!hasActiveReservation || isPurchasing} onClick={handlePurchase}>
          {isPurchasing ? 'Completing...' : 'Complete Purchase'}
        </button>
      </div>

      <section className="activity-feed">
        <h3>Latest purchasers</h3>
        {drop.latestPurchasers.length > 0 ? (
          <ol>
            {drop.latestPurchasers.map((purchase) => (
              <li key={`${purchase.username}-${purchase.purchasedAt}`}>
                <span>{purchase.username}</span>
                <time>{new Date(purchase.purchasedAt).toLocaleTimeString()}</time>
              </li>
            ))}
          </ol>
        ) : (
          <p>No purchases yet.</p>
        )}
      </section>
    </article>
  );
}
