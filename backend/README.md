# SAT-SA Backend

Offline backend for the **Supervisory Analytics Tool for SOC Assessment (SAT-SA)**.

This implementation is deliberately dependency-free at runtime: it uses Python's
standard library (`http.server`, `sqlite3`, `csv`, `json`, `email`, `statistics`,
etc.) so an air-gapped deployment does not need package installation or external
services.

## Target runtime

- CPython **3.14.7** (current stable 3.14 maintenance release targeted by this build)
- HTTP API: Python `http.server.ThreadingHTTPServer`
- Storage: SQLite 3 via Python `sqlite3`
- Analytics: deterministic rule/statistics engine; no TensorFlow, GPU or external AI
- Runtime third-party dependencies: **none**

The API is JSON/HTTP and is designed to map directly to the existing React/Vite
screens.

## Quick start

```bash
cd SAT-SA-backend
python -m sat_sa
```

The server listens on `127.0.0.1:8000` by default.

Health:
`GET http://127.0.0.1:8000/api/v1/health`

API documentation:
`GET http://127.0.0.1:8000/api/v1`

## Seed the supplied synthetic dataset

From the project root:

```bash
python scripts/seed_sample.py /path/to/satsa_sample_dataset
```

Or:

```bash
python scripts/seed_sample.py /path/to/satsa_sample_dataset/json
```

The seed script ingests all JSON envelopes and runs batch analytics.

## Run tests

```bash
python -m unittest discover -s tests -v
```

The test suite is self-contained: it ships its own copy of the synthetic
sample dataset under `tests/fixtures/sample_dataset/`, so this works on a
fresh checkout with no seeding step and no environment-specific paths. To
run the same tests against a different dataset instead, set
`SATSA_TEST_DATASET=/path/to/sample_dataset` before running.

## API endpoints

- `GET /api/v1/health`
- `GET /api/v1/dashboard?period=Q3-2026`
- `GET /api/v1/submissions`
- `GET /api/v1/submissions/{submission_id}`
- `POST /api/v1/submissions/json`
- `POST /api/v1/submissions/csv` (multipart per-entity CSV upload)
- `POST /api/v1/submissions/{submission_id}/process`
- `GET /api/v1/assessments/{cse_id}?period=Q3-2026`
- `GET /api/v1/worklist?...filters...`
- `GET /api/v1/cases/{case_id}`
- `POST /api/v1/cases/{case_id}/decisions`
- `GET /api/v1/reports/{cse_id}?period=Q3-2026`
- `GET /api/v1/reports/{cse_id}/export?period=Q3-2026&format=json`
- `GET /api/v1/config`
- `PUT /api/v1/config`

## Frontend integration

See `docs/frontend-integration.md`. The existing frontend can replace mock
constants with `fetch('/api/v1/...')` calls without changing its screen model.

## Offline deployment

No code performs DNS resolution, HTTP calls, telemetry, cloud API access, CDN
fetching, or external model calls. Bind to loopback by default. For a secured
isolated deployment, bind to the approved local interface and enforce host/network
controls outside the application.

The database is created locally at `data/satsa.db`. Raw submissions are retained
in SQLite as received JSON and normalized entity rows are stored separately.

## Architecture

`HTTP API -> validation -> raw+normalized SQLite -> metrics -> baselines -> signals
-> evidence chain -> worklist -> human decision/audit -> report`

CEGS is only a configurable prioritization aid. It is not presented as a
definitive SOC-quality or compliance score.
