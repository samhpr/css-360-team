# Local Live (CSS 360 Team Project)

Concert discovery web app. A React (Vite) frontend reads events directly from
Supabase. An optional FastAPI service syncs new events from Ticketmaster into
Supabase.

## How it fits together

```
React (Vite)  ──reads (publishable key)──▶  Supabase (Postgres)
                                                  ▲
                                                  │ writes (service-role key)
                                                  │
                                            FastAPI (optional)
                                                  ▲
                                                  │
                                            Ticketmaster API
```

The frontend uses the Supabase **publishable** (anon) key to `SELECT` from
`public.events`. Row Level Security on that table allows `SELECT` for the anon
role and denies all writes — so the publishable key is safe to ship in the
browser.

The FastAPI backend is only needed to sync new concerts from Ticketmaster. It
uses the Supabase `service_role` key (server-side only, never exposed to the
browser) to upsert rows.

## Setup

### 1. Supabase

1. Create a Supabase project.
2. In the SQL Editor, run [database/supabase_schema.sql](database/supabase_schema.sql)
   — this creates the `events` table with RLS and seeds 5 rows.
3. From **Project Settings → API**, grab:
   - Project URL
   - `publishable` (anon) key — for the frontend
   - `service_role` key — for the optional backend

### 2. Frontend

Create `frontend/.env.local` (gitignored) with:

```
VITE_SUPABASE_URL=https://YOUR-PROJECT-REF.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

Then:

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173/` — you should see the 5 seeded events.

### 3. Backend (optional — only for Ticketmaster syncs)

The frontend doesn't need the backend to run. Only set this up if you want to
pull fresh events from Ticketmaster into Supabase.

Create `backend/.env` (gitignored) with:

```
SUPABASE_URL=https://YOUR-PROJECT-REF.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
TICKETMASTER_API_KEY=your-ticketmaster-key
```

Install and run:

```bash
cd backend
pip install fastapi 'uvicorn[standard]' httpx python-dotenv pydantic supabase
uvicorn main:app --reload --port 8000
```

On startup, if `TICKETMASTER_API_KEY` is set, the backend pulls music events
from Ticketmaster (25-mile radius around Seattle) and upserts them into
Supabase. You can also trigger a sync on demand by hitting
`GET http://localhost:8000/api/events?refresh=true`.

## Tests

```bash
cd frontend
npm test
```

## CI

GitHub Actions workflow is at [.github/workflows/ci.yml](.github/workflows/ci.yml).
It runs on push and pull request to `main` and does:

1. `npm install`
2. `npm test`
3. `npm run build`

## Suggested branching

1. Create feature branches from `main` (example: `feature/story-sort-by-date`).
2. Open a pull request to `main`.
3. Require CI to pass before merge.
