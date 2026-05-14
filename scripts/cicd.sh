#!/usr/bin/env bash

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FRONTEND_DIR="$ROOT/frontend"
BACKEND_DIR="$ROOT/backend"
ARTIFACT_DIR="$ROOT/artifacts"
RELEASE_BUNDLE="$ARTIFACT_DIR/local-live-release-$(date +%Y%m%d-%H%M%S).tgz"
BACKEND_PORT="${BACKEND_PORT:-8000}"
BACKEND_URL="http://127.0.0.1:${BACKEND_PORT}"
FRONTEND_ONLY=0
ALLOW_DIRTY_WORKTREE="${ALLOW_DIRTY_WORKTREE:-0}"
SKIP_PULL="${SKIP_PULL:-0}"
BACKEND_PID=""
BACKEND_LOG="$ARTIFACT_DIR/backend-smoke.log"
IMAGE_NAME="${IMAGE_NAME:-local-live}"
IMAGE_TAG="${IMAGE_TAG:-latest}"
CONTAINER_NAME="local-live-deployment-$(date +%s)"
DEPLOYMENT_PORT="${DEPLOYMENT_PORT:-8000}"
REGISTRY="${REGISTRY:-}"
DOCKER_SKIP="${DOCKER_SKIP:-0}"
log() {
  printf '\n==> %s\n' "$*"
}

warn() {
  printf '\n[warn] %s\n' "$*" >&2
}

usage() {
  cat <<'EOF'
Usage: scripts/cicd.sh [--frontend-only] [--docker-skip]

Runs the local build-and-deploy workflow used for the Sprint 2 handoff.
Options:
  --frontend-only     Skip backend smoke checks (no Docker build).
  --docker-skip       Skip Docker image build; use local dev runner only.

Environment variables:
  IMAGE_NAME          Docker image name (default: local-live)
  IMAGE_TAG           Docker image tag (default: latest)
  DEPLOYMENT_PORT     Port to run smoke tests on (default: 8000)
  REGISTRY            Registry to push image to (e.g., docker.io/myuser)
EOF
}

wait_for_url() {
  local url="$1"
  local attempt

  for attempt in $(seq 1 30); do
    if curl -fsS "$url" >/dev/null; then
      return 0
    fi
    sleep 1
  done

  return 1
}

cleanup() {
  if [[ -n "$BACKEND_PID" ]]; then
    kill "$BACKEND_PID" >/dev/null 2>&1 || true
    wait "$BACKEND_PID" >/dev/null 2>&1 || true
  fi
}

trap cleanup EXIT

if [[ $# -gt 1 ]]; then
  usage
  exit 1
fi

if [[ $# -eq 1 ]]; then
  case "$1" in
    --frontend-only)
      FRONTEND_ONLY=1
      ;;  
    --docker-skip)
      DOCKER_SKIP=1
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      usage
      exit 1
      ;;
  esac
fi

if [[ ! -d "$ROOT/.git" ]]; then
  echo "This script must be run from inside the repository." >&2
  exit 1
fi

if [[ "$ALLOW_DIRTY_WORKTREE" != "1" ]]; then
  if ! git -C "$ROOT" diff --quiet || ! git -C "$ROOT" diff --cached --quiet; then
    echo "Please run this from a clean worktree before syncing main." >&2
    exit 1
  fi
fi

if [[ "$SKIP_PULL" != "1" ]]; then
  log "Switching to main and pulling the latest origin/main"
  current_branch="$(git -C "$ROOT" rev-parse --abbrev-ref HEAD)"
  if [[ "$current_branch" != "main" ]]; then
    git -C "$ROOT" switch main
  fi
  git -C "$ROOT" pull --ff-only origin main
else
  warn "Skipping git switch/pull because SKIP_PULL=1 was provided."
fi

log "Installing frontend dependencies"
(cd "$FRONTEND_DIR" && npm ci)

log "Running ESLint"
(cd "$FRONTEND_DIR" && npm run lint)

log "Checking Prettier formatting"
(cd "$FRONTEND_DIR" && npm run format:check)

log "Running security audit"
(cd "$FRONTEND_DIR" && npm audit --audit-level=high)

log "Running frontend tests"
(cd "$FRONTEND_DIR" && npm test)

log "Building the frontend"
(cd "$FRONTEND_DIR" && npm run build)

if [[ "$DOCKER_SKIP" -eq 0 && "$FRONTEND_ONLY" -eq 0 ]]; then
  if command -v docker &>/dev/null; then
    log "Building Docker image"
    docker build -t "${IMAGE_NAME}:${IMAGE_TAG}" "$ROOT"

    log "Running Docker container for smoke tests"
    CONTAINER_ID=$(docker run -d \
      --name "$CONTAINER_NAME" \
      -p "${DEPLOYMENT_PORT}:8000" \
      "${IMAGE_NAME}:${IMAGE_TAG}")
    trap "docker rm -f '$CONTAINER_ID' >/dev/null 2>&1 || true" EXIT

    if wait_for_url "http://127.0.0.1:${DEPLOYMENT_PORT}/health"; then
      log "Docker container smoke tests passed"
      curl -fsS "http://127.0.0.1:${DEPLOYMENT_PORT}/health" >/dev/null
      curl -fsS "http://127.0.0.1:${DEPLOYMENT_PORT}/api/genres" >/dev/null
      curl -fsS "http://127.0.0.1:${DEPLOYMENT_PORT}/api/events" >/dev/null
    else
      warn "Docker container health check failed"
      docker logs "$CONTAINER_ID" >&2 || true
      exit 1
    fi

    if [[ -n "$REGISTRY" ]]; then
      FULL_IMAGE="${REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG}"
      log "Pushing image to $FULL_IMAGE"
      docker tag "${IMAGE_NAME}:${IMAGE_TAG}" "$FULL_IMAGE"
      docker push "$FULL_IMAGE"
    fi
  else
    warn "Docker is not installed; skipping Docker build."
  fi
elif [[ "$DOCKER_SKIP" -eq 1 ]]; then
  warn "Docker build skipped due to DOCKER_SKIP=1."
else
  warn "Docker build skipped because --frontend-only was requested."
fi
mkdir -p "$ARTIFACT_DIR"
log "Packaging a release bundle"
RELEASE_STAGING="$ARTIFACT_DIR/release"
rm -rf "$RELEASE_STAGING"
mkdir -p "$RELEASE_STAGING"
cp "$ROOT/README.md" "$RELEASE_STAGING/"
cp "$ROOT/.gitignore" "$RELEASE_STAGING/"
cp -R "$ROOT/.github" "$RELEASE_STAGING/"
cp -R "$ROOT/database" "$RELEASE_STAGING/"
cp -R "$ROOT/docs" "$RELEASE_STAGING/"
cp -R "$ROOT/frontend" "$RELEASE_STAGING/"
cp -R "$ROOT/backend" "$RELEASE_STAGING/"
rm -rf \
  "$RELEASE_STAGING/frontend/node_modules" \
  "$RELEASE_STAGING/frontend/dist" \
  "$RELEASE_STAGING/frontend/.env" \
  "$RELEASE_STAGING/frontend/.env.local" \
  "$RELEASE_STAGING/backend/.venv" \
  "$RELEASE_STAGING/backend/.env" \
  "$RELEASE_STAGING/backend/__pycache__"
cp -R "$FRONTEND_DIR/dist" "$RELEASE_STAGING/frontend/"
tar -czf "$RELEASE_BUNDLE" -C "$ARTIFACT_DIR" release

if [[ "$FRONTEND_ONLY" -eq 0 ]]; then
  if [[ -f "$BACKEND_DIR/.env" && -f "$BACKEND_DIR/requirements.txt" ]]; then
    log "Preparing backend smoke environment"
    python3 -m venv "$BACKEND_DIR/.venv/cicd"
    "$BACKEND_DIR/.venv/cicd/bin/pip" install --upgrade pip >/dev/null
    "$BACKEND_DIR/.venv/cicd/bin/pip" install -r "$BACKEND_DIR/requirements.txt"

    log "Starting backend for smoke checks"
    (
      cd "$BACKEND_DIR"
      nohup "$BACKEND_DIR/.venv/cicd/bin/uvicorn" main:app --host 127.0.0.1 --port "$BACKEND_PORT" > "$BACKEND_LOG" 2>&1 &
      echo $! > "$ARTIFACT_DIR/backend.pid"
    )
    BACKEND_PID="$(cat "$ARTIFACT_DIR/backend.pid")"

    log "Waiting for backend health endpoint"
    if ! wait_for_url "$BACKEND_URL/health"; then
      warn "Backend did not start cleanly. Last log lines:"
      tail -n 50 "$BACKEND_LOG" >&2 || true
      exit 1
    fi

    log "Running backend smoke and integration checks"
    curl -fsS "$BACKEND_URL/health" >/dev/null
    curl -fsS "$BACKEND_URL/api/genres" >/dev/null
    curl -fsS "$BACKEND_URL/api/events" >/dev/null
  else
    warn "Skipping backend smoke checks because backend/.env or backend/requirements.txt is missing."
  fi
else
  warn "Skipping backend smoke checks because --frontend-only was requested."
fi

if [[ -n "${DEPLOY_DIR:-}" ]]; then
  log "Deploying release bundle to $DEPLOY_DIR"
  mkdir -p "$DEPLOY_DIR"
  tar -xzf "$RELEASE_BUNDLE" -C "$DEPLOY_DIR"
else
  warn "No DEPLOY_DIR set, so the deploy step was packaged but not copied to a release target."
fi

if [[ -n "${DEPLOY_URL:-}" ]]; then
  log "Verifying deployment at $DEPLOY_URL"
  curl -fsS "${DEPLOY_URL%/}/health" >/dev/null
else
  warn "No DEPLOY_URL set, so live deployment verification was skipped."
fi

log "Pipeline complete"
