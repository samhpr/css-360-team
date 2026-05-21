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

Where to get the values:

1. `SUPABASE_URL`
   - Go to [https://supabase.com](https://supabase.com) and sign in.
   - Open your project dashboard.
   - Go to **Project Settings → API** and copy the **Project URL**.
2. `SUPABASE_SERVICE_ROLE_KEY`
   - On the same **Project Settings → API** page, copy the **service_role** key.
   - Keep this key in `backend/.env`; do not put it in frontend code.
3. `TICKETMASTER_API_KEY`
   - Go to [https://developer.ticketmaster.com/](https://developer.ticketmaster.com/) and sign in or create an account.
   - Open your developer dashboard and create an app if needed.
   - Copy the API key shown for that app and place it in `backend/.env`.

If you only want the frontend-only path, you can leave `TICKETMASTER_API_KEY` blank and run `./scripts/cicd.sh --frontend-only`.

Install and run:

```bash
cd backend
pip install -r requirements.txt
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

## CI/CD pipeline

The repo includes a one-touch pipeline script at [scripts/cicd.sh](scripts/cicd.sh) that builds a Docker image and runs smoke tests.
Run it from the repository root:

```bash
./scripts/cicd.sh
```

### Docker deployment

The pipeline **builds a Docker image** that packages both the frontend (as a static dist build) and the backend FastAPI app.

What the script does:

1. Switches to `main` and fast-forwards from `origin/main`.
2. Installs frontend dependencies and runs static analysis: ESLint, Prettier check, `npm audit --audit-level=high`.
3. Runs unit tests and builds the frontend.
4. Builds a Docker image (`local-live:latest` by default) using the [Dockerfile](Dockerfile).
5. Runs a Docker container from that image and smoke-tests:
   - `GET /health` (liveness check)
   - `GET /api/genres` (API availability)
   - `GET /api/events` (event query availability)
6. (Optional) Pushes the image to a registry.

### Options

```bash
# Frontend-only (no Docker): skip backend and container tests
./scripts/cicd.sh --frontend-only

# Skip Docker build: run local backend instead
./scripts/cicd.sh --docker-skip
```

### Environment variables

```bash
# Customize image name/tag
export IMAGE_NAME=my-app
export IMAGE_TAG=v1.0.0

# Push to a registry after build
export REGISTRY=docker.io/myusername

# Change the port used for smoke tests
export DEPLOYMENT_PORT=9000

# Also set backend credentials if running the full pipeline
export SUPABASE_URL=https://...
export SUPABASE_SERVICE_ROLE_KEY=...
export TICKETMASTER_API_KEY=...
```

Then run:

```bash
./scripts/cicd.sh
```

### Secrets required for full CI→push→verify

If you want GitHub Actions to build, push, and verify Docker images automatically, add these repository secrets (Repository → Settings → Secrets → Actions):

- `DOCKER_USERNAME` — Docker registry username (or service account)
- `DOCKER_PASSWORD` — Docker registry password or access token

Optional values you can set as repository variables or secrets if you want the workflow to push/verify automatically:

- `REGISTRY` — Registry prefix (e.g. `docker.io/myuser` or `ghcr.io/myorg`)
- `DEPLOY_URL` — Public URL for deployment verification (used to curl `/health`)

Also add the backend runtime secrets if your pipeline will exercise the live backend or run smoke checks:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `TICKETMASTER_API_KEY`

Add these to the repository Secrets (recommended) or to an Environment for the `main` branch if you want approvals before deploys.

### Docker image contents

The [Dockerfile](Dockerfile) is a multi-stage build:

1. **Frontend stage**: Node.js builds the Vite app and produces `dist/`.
2. **Runtime stage**: Python 3.11 slim base, installs backend deps, copies the built frontend and backend code, and runs FastAPI on port 8000.

The image includes a health check, so Docker (or Kubernetes) can monitor it.
The backend should be configured via environment variables passed to `docker run`:

```bash
docker run -e SUPABASE_URL=... -e SUPABASE_SERVICE_ROLE_KEY=... -p 8000:8000 local-live:latest
```

## Suggested branching

1. Create feature branches from `main` (example: `feature/story-sort-by-date`).
2. Open a pull request to `main`.
3. Require CI to pass before merge.
