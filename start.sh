#!/usr/bin/env bash
# One-command launcher: serves the built UI *and* the API from a single offline process.
# UI + API -> http://127.0.0.1:8000
set -euo pipefail
cd "$(dirname "$0")"

PY="${PYTHON:-python3}"
command -v "$PY" >/dev/null || PY=python
command -v "$PY" >/dev/null || { echo "Python 3 not found. Install Python 3.10+ (see README)."; exit 1; }

if [ ! -f frontend/dist/index.html ]; then
  command -v npm >/dev/null || { echo "frontend/dist is missing and npm is not installed. Install Node.js 20+ and run: cd frontend && npm ci && npm run build"; exit 1; }
  echo "Building frontend (first run only)..."
  (cd frontend && npm ci --no-audit --no-fund && npm run build)
fi

cd backend
echo "Starting SAT-SA on http://${SATSA_HOST:-127.0.0.1}:${SATSA_PORT:-8000}  (Ctrl+C to stop)"
exec "$PY" -m sat_sa
