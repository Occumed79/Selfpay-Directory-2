# Stress Test Price Atlas

The existing `Stress_Test_Price_Atlas_EDITORIAL_CATALOGUE_v13.html` is the frontend. The repository now also contains a small Express server that makes it deployable as a Render **Web Service** and loads the live location dataset from Neon Postgres.

## Runtime

- Node.js 20+
- Express
- Neon Postgres
- MapTiler for the interactive location map

## Render Web Service settings

Create a normal **Web Service** from this GitHub repository.

- Repository: `Occumed79/Selfpay-Directory-2`
- Branch: `main`
- Runtime / Language: `Node`
- Build Command: `npm install`
- Start Command: `npm start`
- Health Check Path: `/health`

The app listens on Render's `PORT` and binds to `0.0.0.0`.

## Environment variables

Set these in the Render service environment:

- `DATABASE_URL` — Neon pooled Postgres connection string
- `MAPTILER_KEY` — MapTiler API key for the live location map
- `NODE_ENV=production`

Do not commit the real values to GitHub. `.env.example` contains the expected variable names only.

## Routes

- `/` — Stress Test Price Atlas
- `/catalogue` — same application entry point
- `/api/locations` — current Neon-backed location records
- `/api/stats` — registry totals and price statistics
- `/health` — Render health check and database connectivity state

## Database

The Neon schema is documented in `db/schema.sql`.

At runtime, `server.js` queries Neon and injects the latest database rows into the existing HTML before it is sent to the browser. If Neon is temporarily unavailable, the embedded data already present in the HTML remains the fallback so the site can still load.

## Local run

```bash
npm install
cp .env.example .env
# Add DATABASE_URL and MAPTILER_KEY to .env or export them in your shell.
npm start
```

Then open `http://localhost:3000`.
