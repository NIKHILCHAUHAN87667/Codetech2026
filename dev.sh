#!/usr/bin/env bash
# Development mode: backend on :8000 + Vite dev server (hot reload) on http://127.0.0.1:5173
set -euo pipefail
cd "$(dirname "$0")"
PY="${PYTHON:-python3}"; command -v "$PY" >/dev/null || PY=python
[ -d frontend/node_modules ] || (cd frontend && npm ci --no-audit --no-fund)
(cd backend && "$PY" -m sat_sa) &
BACK=$!
trap 'kill $BACK 2>/dev/null || true' EXIT INT TERM
cd frontend && npm run dev
