# Code Reading Guide

Read this project by execution flow, not by file tree. The goal is to understand how a user action moves from frontend to backend, database, realtime event, and back to the UI.

## Best Reading Order

1. `README.md`
2. `apps/api/src/server.ts`
3. `apps/api/src/app.ts`
4. `apps/api/prisma/schema.prisma`
5. `apps/api/prisma/migrations/0001_init/migration.sql`
6. `apps/api/src/modules/reservations/reservations.service.ts`
7. `apps/api/src/modules/purchases/purchases.service.ts`
8. `apps/api/src/jobs/expire-reservations.ts`
9. `apps/api/src/realtime/socket.ts`
10. `apps/web/src/main.tsx`
11. `apps/web/src/pages/Dashboard.tsx`
12. `apps/web/src/components/DropCard.tsx`
13. `apps/web/src/api/client.ts`
14. `apps/web/src/hooks/useSocketUpdates.ts`
15. `apps/web/src/hooks/useCountdown.ts`

## Start With The README

Read `README.md` first. Focus on:

- Architecture
- Data model
- API summary
- Reservation flow
- Purchase flow
- Stock recovery flow
- Expiration explanation
- Concurrency explanation

This gives you the mental model before reading implementation details.

## Backend Entry Point

Start with `apps/api/src/server.ts`.

This file shows:

- Express app creation
- HTTP server creation
- Socket.io setup
- expiration worker startup
- server listening on `PORT`

Then read `apps/api/src/app.ts`.

This file shows route registration:

- `/api/users`
- `/api/drops`
- `/api/drops/:dropId/reserve`
- `/api/reservations/:reservationId/purchase`

Pattern to notice:

```text
server.ts starts infrastructure
app.ts wires middleware and routes
routes validate HTTP input
services contain business logic
```

## Database Models

Read `apps/api/prisma/schema.prisma`.

Understand these models first:

- `User`
- `Drop`
- `Reservation`
- `Purchase`
- `ReservationStatus`

Then read `apps/api/prisma/migrations/0001_init/migration.sql`.

Most important part:

```sql
CREATE UNIQUE INDEX reservation_unique_active_user_drop
ON "Reservation" ("userId", "dropId")
WHERE "status" = 'ACTIVE';
```

This prevents one user from holding multiple active reservations for the same drop.

## Core Backend Business Logic

Read `apps/api/src/modules/reservations/reservations.service.ts` carefully.

Focus on `reserveDrop()`:

- calls `expireReservations()` first to recover stale stock
- creates `expiresAt` based on `RESERVATION_TTL_SECONDS`
- starts a Prisma transaction
- checks drop existence
- checks drop start time
- checks whether the user already has an active reservation
- runs atomic SQL update to decrement stock only if stock is available
- creates the reservation
- emits `drop:stock-updated`

This file is the heart of the assessment.

Next read `apps/api/src/modules/purchases/purchases.service.ts`.

Focus on `completePurchase()`:

- validates reservation ownership
- checks `status === ACTIVE`
- checks `expiresAt > now`
- conditionally marks reservation as `PURCHASED`
- creates a `Purchase`
- fetches latest purchasers
- emits `drop:activity-updated`

Then read `apps/api/src/jobs/expire-reservations.ts`.

Focus on:

- finding expired active reservations
- marking them `EXPIRED`
- grouping expirations by `dropId`
- incrementing stock by expired count
- emitting stock updates

## Realtime Connection

Backend Socket.io file:

```text
apps/api/src/realtime/socket.ts
```

Frontend Socket.io listener:

```text
apps/web/src/hooks/useSocketUpdates.ts
```

Backend emits:

```text
drop:stock-updated
drop:activity-updated
```

Frontend listens and updates TanStack Query cache.

Important idea:

```text
Socket.io is for realtime UX, not correctness.
PostgreSQL remains the source of truth.
```

## Frontend Reading Order

Start with `apps/web/src/main.tsx`.

This mounts React and provides TanStack Query.

Then read `apps/web/src/pages/Dashboard.tsx`.

Focus on:

- `fetchDrops()`
- `upsertUser()`
- `useSocketUpdates(queryClient)`
- `queryClient.setQueryData()`
- rendering `DropCard`

Then read `apps/web/src/components/DropCard.tsx`.

Focus on:

- `handleReserve()`
- `handlePurchase()`
- loading states
- disabled button logic
- countdown display
- latest purchasers display

Then read `apps/web/src/api/client.ts`.

This maps frontend actions to backend endpoints:

```text
fetchDrops -> GET /drops
upsertUser -> POST /users
reserveDrop -> POST /drops/:dropId/reserve
completePurchase -> POST /reservations/:reservationId/purchase
```

## Trace The Reserve Flow

Follow this exact path:

```text
DropCard.tsx
handleReserve()
```

calls:

```text
api/client.ts
reserveDrop()
```

calls backend:

```text
reservations.routes.ts
POST /drops/:dropId/reserve
```

calls service:

```text
reservations.service.ts
reserveDrop()
```

updates database:

```text
Drop.availableStock
Reservation
```

emits realtime event:

```text
socket.ts
emitStockUpdated()
```

frontend receives:

```text
useSocketUpdates.ts
socket.on('drop:stock-updated')
```

updates UI:

```text
Dashboard.tsx / DropCard.tsx
```

## Trace The Purchase Flow

Follow this exact path:

```text
DropCard.tsx
handlePurchase()
```

then:

```text
api/client.ts
completePurchase()
```

then:

```text
purchases.routes.ts
```

then:

```text
purchases.service.ts
completePurchase()
```

then:

```text
drops.service.ts
getLatestPurchasers()
```

then:

```text
socket.ts
emitActivityUpdated()
```

then:

```text
useSocketUpdates.ts
drop:activity-updated
```

## Trace The Expiration Flow

Follow this exact path:

```text
server.ts
startExpirationWorker()
```

then:

```text
jobs/expire-reservations.ts
expireReservations()
```

then:

```text
socket.ts
emitStockUpdated()
```

then:

```text
useSocketUpdates.ts
drop:stock-updated
```

## What To Understand Deeply

- Why stock decrements during reservation
- Why transaction is needed
- Why atomic `UPDATE` prevents overselling
- Why expiration is database-driven
- Why Socket.io is not the source of truth
- How latest 3 purchasers are queried
- How frontend recovers missed socket events

## Practice Method

Run the app:

```bash
pnpm dev
```

Open:

```text
http://localhost:5173
```

Click these actions and trace code side by side:

1. Enter username and click `Use`.
2. Click `Reserve`.
3. Watch stock decrement and countdown appear.
4. Click `Complete Purchase`.
5. Watch latest purchasers update.
6. Open a second browser window and repeat to see realtime sync.
