# Implementation Plan

## Phase 1: Foundation

- Create monorepo structure.
- Add TypeScript configs.
- Add root package scripts.
- Add API and web packages.
- Add env examples.

## Phase 2: Database

- Add Prisma schema.
- Add migrations.
- Add manual partial unique index.
- Add seed data.

## Phase 3: Backend

- Add Express app.
- Add env validation.
- Add error middleware.
- Add Prisma client.
- Add users routes.
- Add drops routes.
- Add reservation transaction.
- Add purchase transaction.
- Add expiration worker.
- Add Socket.io server.

## Phase 4: Frontend

- Add React app.
- Add API client.
- Add Socket.io client.
- Add dashboard page.
- Add drop card.
- Add loading and error feedback.
- Add countdown behavior.

## Phase 5: Verification

- Run migrations and seed.
- Run API and web locally.
- Test two browser windows.
- Run concurrency script with stock of 1.
- Confirm no negative stock.
- Confirm expired reservations return stock.
- Confirm latest purchasers update.
