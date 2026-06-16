# Real-Time High-Traffic Inventory System

Backend and frontend implementation for a limited edition sneaker drop. Users can reserve high-demand inventory for 60 seconds, complete purchase while the reservation is active, and see stock/activity updates in real time across connected browsers.

## Deliverables

- GitHub repository: `https://github.com/md-rashed-zaman/real-time-high-traffic-inventory-system`
- Live URL: `https://real-time-high-traffic-inventory-sy-theta.vercel.app`
- Demo video: add Loom/video URL showing two browser windows with realtime stock sync.

## Tech Stack

- Frontend: React, Vite, TypeScript, TanStack Query, Socket.io client, plain CSS
- Backend: Node.js, Express, TypeScript, Socket.io
- Database: PostgreSQL
- ORM: Prisma
- Validation: Zod

## Local Setup

Requirements:

- Node.js 20+
- pnpm 9+
- PostgreSQL

Optional local PostgreSQL with Docker:

```bash
docker run --name sneaker-drop-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=sneaker_drop \
  -p 5432:5432 \
  -d postgres:16
```

Install dependencies:

```bash
pnpm install
```

Create env files:

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```

Run database migrations:

```bash
pnpm --filter @sneaker-drop/api prisma:migrate
```

Seed sample data:

```bash
pnpm --filter @sneaker-drop/api seed
```

Run the app:

```bash
pnpm dev
```

Default URLs:

- Frontend: `http://localhost:5173`
- API: `http://localhost:4000`
- Health check: `http://localhost:4000/api/health`

## Environment Variables

API env file: `apps/api/.env`

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/sneaker_drop"
PORT=4000
CLIENT_URL="http://localhost:5173"
RESERVATION_TTL_SECONDS=60
EXPIRATION_WORKER_INTERVAL_MS=5000
```

Web env file: `apps/web/.env`

```env
VITE_API_URL="http://localhost:4000/api"
VITE_SOCKET_URL="http://localhost:4000"
```

`.env` files are intentionally ignored. Only `.env.example` files should be committed.

## Architecture

![System architecture](assets/diagrams/architecture.svg)

The frontend uses HTTP requests for business operations and Socket.io for live UI updates. PostgreSQL is the source of truth. Socket.io events are emitted only after database transactions commit.

## Data Model

![Data model](assets/diagrams/data-model.svg)

Core relationships:

- A `User` can create many `Reservation` rows.
- A `User` can complete many `Purchase` rows.
- A `Drop` has many reservations and purchases.
- A `Reservation` can convert to one `Purchase`.
- `Purchase` powers the latest purchasers activity feed.

Important partial unique index:

```sql
CREATE UNIQUE INDEX reservation_unique_active_user_drop
ON "Reservation" ("userId", "dropId")
WHERE "status" = 'ACTIVE';
```

This prevents one user from holding multiple active reservations for the same drop.

## API Summary

- `GET /api/health`: service health check.
- `POST /api/users`: create or return a demo user by username.
- `POST /api/drops`: create a new merch drop and initialize stock.
- `GET /api/drops`: list drops with the latest 3 purchasers nested per drop.
- `POST /api/drops/:dropId/reserve`: reserve one unit for 60 seconds.
- `POST /api/reservations/:reservationId/purchase`: complete purchase for an active reservation.

Example `GET /api/drops` response:

```json
[
  {
    "id": "drop_id",
    "name": "Air Jordan 1 Retro High OG",
    "totalStock": 100,
    "availableStock": 42,
    "startsAt": "2026-06-15T18:00:00.000Z",
    "endsAt": null,
    "latestPurchasers": [
      { "username": "alex", "purchasedAt": "2026-06-15T18:04:12.000Z" }
    ]
  }
]
```

## Reservation Flow

![Reservation flow](assets/diagrams/reservation-flow.svg)

## Purchase Flow

![Purchase flow](assets/diagrams/purchase-flow.svg)

## Stock Recovery Flow

![Stock recovery flow](assets/diagrams/stock-recovery-flow.svg)

## Architecture Choice: 60-Second Expiration

Each reservation stores an `expiresAt` timestamp in PostgreSQL. The backend runs a periodic expiration worker every `EXPIRATION_WORKER_INTERVAL_MS` milliseconds.

The worker finds expired active reservations, marks them `EXPIRED`, increments the related drop stock, and broadcasts the updated stock count with Socket.io.

This is intentionally database-driven instead of relying only on `setTimeout`. In-memory timers are lost on server restart and do not coordinate well across multiple backend instances. Persisting `expiresAt` keeps expiration recoverable and makes PostgreSQL the source of truth.

## Concurrency: Preventing Overselling

Overselling is prevented at the database level with an atomic conditional update inside a transaction:

```sql
UPDATE "Drop"
SET "availableStock" = "availableStock" - 1,
    "updatedAt" = NOW()
WHERE "id" = $1
  AND "availableStock" > 0
RETURNING "id", "availableStock";
```

The reservation row is created only if this update returns a row. If 100 users attempt to reserve the last item at the same time, only one transaction can decrement stock from `1` to `0`. The rest receive `409 DROP_SOLD_OUT`, and `availableStock` never becomes negative.

## Frontend Behavior

- User enters a demo username and clicks `Use`.
- Reserve buttons show loading states and disable invalid actions.
- Active reservations show a countdown based on the server-provided `expiresAt`.
- Complete purchase is enabled only while the reservation is active.
- Toast messages show success and failure states.
- Stock and latest purchasers update through Socket.io.
- The app refetches drops on socket reconnect to recover missed events.

## Demo Checklist

1. Open `http://localhost:5173` in two browser windows.
2. Enter a username and click `Use` in both windows.
3. Reserve a drop in one window.
4. Confirm stock updates in both windows.
5. Wait 60 seconds without purchasing and confirm stock returns.
6. Reserve again and click `Complete Purchase`.
7. Confirm the username appears in the latest purchasers list.

## Verification

```bash
pnpm typecheck
pnpm build
```

Optional concurrency check:

```bash
DROP_ID=<drop-id> ATTEMPTS=100 pnpm --filter @sneaker-drop/api stress:reserve
```

For a drop with stock `1`, the expected result is one successful reservation, all other requests failing with conflict, and stock never going below zero.

## Deployment Notes

Recommended production-like deployment:

- Frontend: Vercel
- Backend: Render, Railway, or Fly.io
- Database: Neon Postgres

The assessment recommends Vercel and Neon. Vercel is a good fit for the frontend, but a traditional Socket.io server and the expiration worker are better suited to a persistent Node.js backend. If the backend is deployed on Vercel serverless functions, realtime and expiration should be handled with a managed realtime service and scheduled/background jobs.

Detailed deployment steps are available in `DEPLOYMENT.md`.
