# Deployment Plan

## Recommended Production-Like Setup

- Frontend: Vercel
- Backend: Render, Railway, or Fly.io
- Database: Neon Postgres

This is safer than putting the Socket.io backend and expiration worker on a serverless platform because WebSockets and long-running workers need a persistent process.

## Vercel Caveat

The assessment mentions Vercel for frontend and backend. Vercel is excellent for frontend and serverless APIs, but traditional Socket.io and background workers are better suited to a long-running Node process. If deploying backend to Vercel, the expiration worker and realtime layer need special handling.

## Environment Variables

API:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
PORT=4000
CLIENT_URL="http://localhost:5173"
RESERVATION_TTL_SECONDS=60
EXPIRATION_WORKER_INTERVAL_MS=5000
```

Web:

```env
VITE_API_URL="http://localhost:4000/api"
VITE_SOCKET_URL="http://localhost:4000"
```

## Deployment Checklist

- Create Neon database.
- Set API environment variables.
- Run Prisma migrations against production database.
- Deploy backend to a persistent Node host.
- Deploy frontend to Vercel.
- Set frontend API and socket URLs.
- Confirm CORS allows production frontend origin.
