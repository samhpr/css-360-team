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

## Observability lab (Prometheus + Grafana)

A self-contained local monitoring stack for the backend, modeled on the
structure of Grafana's *Grafana Fundamentals* tutorial: stand up a sample app,
scrape it with Prometheus, then visualize the metrics in a pre-provisioned
Grafana dashboard.

### The stack

Four containers on a shared Docker network (`obs-net`), defined in
[docker-compose.yml](docker-compose.yml):

| Service | Image | Port | Role |
| --- | --- | --- | --- |
| `app` | built from this repo's [Dockerfile](Dockerfile) | 8000 | The FastAPI backend. `prometheus-fastapi-instrumentator` exposes metrics at `/metrics`. |
| `prometheus` | `prom/prometheus` | 9090 | Scrapes the targets every 15s and stores the time series. |
| `grafana` | `grafana/grafana` | 3000 | Queries Prometheus and renders the dashboard. |
| `node-exporter` | `prom/node-exporter` | 9100 | Exposes host CPU / memory / disk / network metrics. |

```
node-exporter ─┐
               ├─ scraped by ─▶  Prometheus  ──queried by──▶  Grafana
app /metrics ──┘                 (:9090)                       (:3000)
```

Metric and dashboard state persist across restarts via the named volumes
`prometheus_data` and `grafana_data`.

### What's instrumented

The only application change is two lines in [backend/main.py](backend/main.py)
(plus `prometheus-fastapi-instrumentator` in `requirements.txt`):

```python
from prometheus_fastapi_instrumentator import Instrumentator
Instrumentator().instrument(app).expose(app)
```

This adds a `/metrics` endpoint with, among others:

- `http_requests_total{handler,status,method}` — request counter → **request rate**
- `http_request_duration_seconds_bucket{handler,method}` — latency histogram → **p95 latency**

No routes, handlers, or data logic were modified.

### Bring it up

From this directory (`css-360-team/`, the repo root):

```bash
docker compose up -d --build
```

That one command builds the app image and starts all four services.

> **Note:** the `app` container needs valid `SUPABASE_URL` and
> `SUPABASE_SERVICE_ROLE_KEY` in `backend/.env` to boot — its startup hook pings
> Supabase (see [Setup → Backend](#2-backend)). Without them the app target
> shows **DOWN**, but Prometheus, Grafana, and node-exporter still come up fine.

### Verify

1. **Prometheus targets** — open <http://localhost:9090/targets>. The
   `node-exporter`, `prometheus`, and `local-live-api` jobs should all read
   **UP**.
2. **Grafana dashboard** — open <http://localhost:3000> (login `admin` /
   `admin`). The data source and the **Local Live API — Overview** dashboard are
   provisioned automatically — no manual setup. The dashboard shows request
   rate, p95 latency, CPU %, and memory %.
3. **Generate some traffic** so the request-rate and latency panels have data:

   ```bash
   for i in $(seq 1 200); do curl -s localhost:8000/api/genres > /dev/null; done
   ```

### How provisioning works

Grafana is configured entirely from files (no clicking), mounted read-only:

- [observability/grafana/provisioning/datasources/datasource.yml](observability/grafana/provisioning/datasources/datasource.yml) — registers Prometheus as the default data source.
- [observability/grafana/provisioning/dashboards/dashboards.yml](observability/grafana/provisioning/dashboards/dashboards.yml) — tells Grafana to load every dashboard JSON in the mounted folder.
- [observability/grafana/dashboards/local-live-overview.json](observability/grafana/dashboards/local-live-overview.json) — the starter dashboard.

Prometheus scrape jobs live in [observability/prometheus/prometheus.yml](observability/prometheus/prometheus.yml).

### Tear down

```bash
docker compose down            # stop containers, keep metric history
docker compose down -v         # also delete the prometheus_data / grafana_data volumes
```

## Suggested branching

1. Create feature branches from `main` (example: `feature/story-sort-by-date`).
2. Open a pull request to `main`.
3. Require CI to pass before merge.
