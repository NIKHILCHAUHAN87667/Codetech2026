# SAT-SA dependency/version matrix

Checked against current public release information on 2026-09-28.

| Component | Target | Why |
|---|---|---|
| CPython | 3.14.7 | Current stable Python 3.14 maintenance release; standard-library runtime only. |
| HTTP server | `http.server` from CPython 3.14.7 | Standard library, no external runtime dependency, suitable for a local prototype API. |
| Database | `sqlite3` from CPython 3.14.7 / bundled SQLite | Local embedded relational storage; no server or network dependency. |
| JSON/CSV/multipart parsing | CPython standard library | Offline and auditable. |
| Analytics | CPython `statistics`, `math`, `datetime` | Deterministic, explainable, CPU-only. |

No third-party runtime library is selected. Therefore there is no FastAPI/Pydantic/Uvicorn
package installation step in the air-gapped environment.

The user-facing frontend remains React 19 + Vite + Tailwind v4 as supplied; this
backend does not replace or modify that frontend.
