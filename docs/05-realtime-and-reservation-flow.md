# Realtime And Reservation Flow

## Reserve Flow

1. User clicks Reserve.
2. API validates request.
3. API starts a database transaction.
4. API atomically decrements stock only if `availableStock > 0`.
5. API creates an active reservation expiring in 60 seconds.
6. API commits the transaction.
7. API emits `drop:stock-updated`.

## Expiration Flow

1. Worker runs every few seconds.
2. Worker finds active reservations where `expiresAt <= now`.
3. Worker marks them as expired.
4. Worker increments drop stock by the number of expired reservations.
5. Worker emits `drop:stock-updated` for affected drops.

## Purchase Flow

1. User clicks Complete Purchase.
2. API validates user and reservation.
3. API marks active, non-expired reservation as purchased.
4. API creates purchase row.
5. API emits `drop:activity-updated`.

## Socket Events

```text
drop:stock-updated
drop:activity-updated
```

Events are emitted after successful commits only. The frontend refetches on socket reconnect to recover missed events.
