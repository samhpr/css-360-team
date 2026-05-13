# Local Live (CSS 360 Team Project)

Concert discovery web app. React frontend, FastAPI backend, Supabase (Postgres)
for storage.

## How it fits together

```
React (Vite)  ──HTTP──▶  FastAPI  ──supabase-py──▶  Supabase (Postgres)
```

The frontend talks only to the backend. The backend holds the Supabase
service-role key and is the only thing that writes to the database. Row Level
Security on the `events` table allows SELECT for the anon role and denies
writes to anyone except the service-role.

## Setup

### 1. Supabase

1. Create a Supabase project.
2. In the SQL Editor, run [database/supabase_schema.sql](database/supabase_schema.sql).
3. Copy the project URL and the `service_role` key from **Project Settings → API**.

### 2. Backend

Create `backend/.env` (gitignored) with:

```
SUPABASE_URL=https://YOUR-PROJECT-REF.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
TICKETMASTER_API_KEY=
```

Install and run:

```bash
cd backend
pip install fastapi 'uvicorn[standard]' httpx python-dotenv pydantic supabase
uvicorn main:app --reload --port 8000
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend defaults to `http://localhost:8000` for the API. To point at a
different host, set `VITE_API_BASE_URL` in `frontend/.env.local`.

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
