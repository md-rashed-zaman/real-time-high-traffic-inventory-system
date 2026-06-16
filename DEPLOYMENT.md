# Deployment Guide

This project needs three hosted pieces:

- PostgreSQL database: Neon free tier
- Backend API + Socket.io + expiration worker: Render free web service
- Frontend React app: Vercel free tier

The backend is intentionally deployed to a persistent Node.js host instead of Vercel serverless functions because this app uses Socket.io and a background expiration worker.

## Recommended Names And Values

Use these exact names to keep the deployment easy to reason about:

| Item | Recommended value |
|---|---|
| GitHub repository name | `sneaker-drop-inventory` |
| Neon project name | `sneaker-drop-inventory` |
| Neon database name | `sneaker_drop` |
| Render service name | `sneaker-drop-api` |
| Vercel project name | `sneaker-drop-inventory` |
| Backend public URL | `https://sneaker-drop-api.onrender.com` or Render-generated equivalent |
| Frontend public URL | `https://sneaker-drop-inventory.vercel.app` or Vercel-generated equivalent |

Your actual URLs may include suffixes if the name is already taken. Use the real generated URLs in environment variables.

Final Render environment variables:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST.neon.tech/sneaker_drop?sslmode=require"
CLIENT_URL="https://YOUR_VERCEL_PROJECT.vercel.app"
RESERVATION_TTL_SECONDS=60
EXPIRATION_WORKER_INTERVAL_MS=5000
```

Final Vercel environment variables:

```env
VITE_API_URL="https://YOUR_RENDER_SERVICE.onrender.com/api"
VITE_SOCKET_URL="https://YOUR_RENDER_SERVICE.onrender.com"
```

Do not use the local Docker Postgres URL in production. The local URL is only for local development:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/sneaker_drop"
```

## 1. Prepare GitHub

Commit only the app files. Do not commit `.env`, `node_modules`, `dist`, or local docs.

From the repository root:

```bash
git add .gitignore sneaker-drop-inventory
git status --short
git commit -m "Implement realtime sneaker drop inventory system"
git push origin main
```

Before committing, confirm no `.env` files appear in `git status --short`.

## 2. Create Neon PostgreSQL Database

1. Go to `https://neon.tech`.
2. Create a free account.
3. Create a new project.
4. Copy the pooled or direct PostgreSQL connection string.
5. Keep it private. It will be used as `DATABASE_URL` in Render.

The connection string looks like:

```text
postgresql://USER:PASSWORD@HOST.neon.tech/DBNAME?sslmode=require
```

## 3. Deploy Backend To Render

1. Go to `https://render.com`.
2. Create a free account.
3. Click `New` -> `Web Service`.
4. Connect the GitHub repository.
5. Set root directory to:

```text
sneaker-drop-inventory
```

6. Use these commands if Render does not auto-detect `render.yaml`:

Build command:

```bash
pnpm install && pnpm --filter @sneaker-drop/api prisma:generate && pnpm --filter @sneaker-drop/api build
```

Pre-deploy command:

```bash
pnpm --filter @sneaker-drop/api prisma:deploy
```

Start command:

```bash
pnpm --filter @sneaker-drop/api start
```

7. Add environment variables:

```env
DATABASE_URL="your Neon database URL"
CLIENT_URL="your Vercel frontend URL, after frontend deploy"
RESERVATION_TTL_SECONDS=60
EXPIRATION_WORKER_INTERVAL_MS=5000
```

If you do not know the Vercel URL yet, temporarily set:

```env
CLIENT_URL="http://localhost:5173"
```

After deploying the frontend, update `CLIENT_URL` to the real Vercel domain and redeploy the backend.

8. After deploy, verify:

```text
https://YOUR_RENDER_SERVICE.onrender.com/api/health
```

Expected response:

```json
{ "ok": true }
```

## 4. Seed Production Data

Render runs migrations during build, but it does not automatically run the seed script.

The easiest free approach is to seed locally against the Neon database:

1. Temporarily set `apps/api/.env` to your Neon `DATABASE_URL`.
2. Run:

```bash
pnpm --filter @sneaker-drop/api seed
```

3. Restore your local `.env` if needed.

Do not commit `.env`.

## 5. Deploy Frontend To Vercel

1. Go to `https://vercel.com`.
2. Create a free account.
3. Import the GitHub repository.
4. Set root directory to:

```text
sneaker-drop-inventory
```

5. Vercel can use `vercel.json`. If manual settings are needed:

Install command:

```bash
pnpm install
```

Build command:

```bash
pnpm --filter @sneaker-drop/web build
```

Output directory:

```text
apps/web/dist
```

6. Add frontend environment variables:

```env
VITE_API_URL="https://YOUR_RENDER_SERVICE.onrender.com/api"
VITE_SOCKET_URL="https://YOUR_RENDER_SERVICE.onrender.com"
```

7. Deploy.

## 6. Update Backend CORS

After Vercel gives you a frontend URL, update Render environment variable:

```env
CLIENT_URL="https://YOUR_VERCEL_APP.vercel.app"
```

Redeploy the Render backend after changing this.

## 7. Final Smoke Test

Open the Vercel frontend URL.

Test:

1. Enter a username and click `Use`.
2. Click `Reserve` on a drop.
3. Confirm stock decreases.
4. Open the same URL in a second browser window.
5. Reserve from one window and watch the other update.
6. Click `Complete Purchase`.
7. Confirm latest purchasers updates.
8. Reserve and wait 60 seconds to confirm stock returns.

## 8. Submission Values

After deployment, update `README.md` deliverables:

```text
GitHub repository: https://github.com/YOUR_USER/YOUR_REPO
Live URL: https://YOUR_VERCEL_APP.vercel.app
Demo video: https://loom.com/...
```

## Notes About Free Hosting

Render free services may sleep after inactivity. The first request after sleep can be slow. Mention this if needed in the submission.

Vercel is used for the frontend only. The backend is on Render because Socket.io and the expiration worker need a persistent process.
