# SAT-SA — Supervisory Analytics Tool for SOC Assessment

Combined, working project: the **React 19 + Vite + Tailwind v4 frontend** wired to the
**offline Python backend**. Every screen now loads real data from the API instead of hard-coded mock values.

```
Login → Dashboard → Submissions (upload / validate / process) → CSE Assessment
      → Review Worklist → Case Investigation Detail → Supervisor Decision → Assessment Report
```

- **Fully offline / air-gapped.** No CDN, no web fonts, no telemetry, no external calls. The UI talks only to its own origin (`/api/v1/*`).
- **Backend has zero third-party Python dependencies** (standard library + SQLite only).
- **Pre-seeded** with the synthetic dataset (6 CSEs × 3 quarters, 18 submissions), so it works the moment it starts.
- **Pre-built UI included** (`frontend/dist`), so you do **not** need Node.js just to run it.

---

## 1. Requirements

| To do this | You need |
|---|---|
| **Run the app** (most people) | **Python 3.10 or newer** (developed for 3.14, tested on 3.12) |
| Rebuild / modify the frontend | Node.js 20+ and npm |

Nothing else. No `pip install` is needed for the backend.

---

## 2. Quick start (one command)

**Linux / macOS**
```bash
cd SAT-SA
./start.sh
```

**Windows**
```bat
cd SAT-SA
start.bat
```

Then open **http://127.0.0.1:8000** and sign in with the demo account:

| Supervisor ID | Password |
|---|---|
| `SUP-2741` | `demo-access` |

That single process serves both the UI and the API. Stop it with `Ctrl+C`.

> No launcher? Run it manually: `cd backend && python -m sat_sa` (use `python3` on Linux/macOS).

Optional environment variables: `SATSA_HOST` (default `127.0.0.1`), `SATSA_PORT` (default `8000`),
`SATSA_DB_PATH` (default `backend/data/satsa.db`).

---

## 3. Try the demo flow

1. **Dashboard** – portfolio for Q3 2026 (switch period top-right). Click a CSE row to open it.
2. **CSE Assessment** – the 8 core metrics (OSEC, CAMG, TTCP, ICS, ER, PRR, CEMR, KECG), each with its sample-size check, the signal list, and signal distribution. "Configure thresholds" shows the active, versioned thresholds.
3. **Review Worklist** – ranked signals. Filter by CSE / priority / category / status or search. Find **`CASE-1042`** (Alpha, malware, low ICS + unusually fast closure) and click **Review case**.
4. **Case detail** – TTCP and ICS, investigation timeline, checklist of recorded vs missing items, evidence drill-down, and the metric → deviation → signal → evidence → explanation chain.
5. **Supervisor decision** – choose *Confirm concern / Dismiss signal / Request further review*, write a comment, submit. This writes an audited record (decision ID, supervisor, timestamp, audit reference).
6. **Report** – findings and decisions (your decision now appears, and the worklist status changes to *In review / Confirmed / Dismissed*), recommendations, **Export report** (JSON download) and **Print / save PDF**.

### Uploading your own data (Submissions screen)
- Pick **one `.json` envelope**, *or* select the **per-entity `.csv` files together** (`submission_metadata.csv`, `cse.csv`, `assets.csv`, `alerts.csv`, `cases.csv`, `investigation_actions.csv`, `escalations.csv`, `remediations.csv`, `evidence.csv`, `reported_kpis.csv`) — format per `frontend/schema.md`.
- The file is validated immediately. Data-quality **errors** block processing (the file is rejected and not stored); **warnings** are shown but never treated as SOC weaknesses.
- Click **Process submission** → the metrics/signals engine runs and the new assessment opens.
- Ready-made files to try: JSON in `backend/tests/fixtures/sample_dataset/json/`, and CSV bundles (one folder per CSE/quarter — select all 10 files in a folder) in `backend/sample_data/csv/`. Re-uploading an existing CSE/quarter replaces it.

---

## 4. Development mode (hot reload)

```bash
cd SAT-SA
./dev.sh          # backend on :8000 + Vite on http://127.0.0.1:5173
```
or in two terminals:
```bash
cd backend  && python -m sat_sa            # API  :8000
cd frontend && npm ci && npm run dev       # UI   :5173 (proxies /api → :8000)
```
Point the UI at a backend elsewhere with `SATSA_API=http://host:port npm run dev`.

Rebuild the production UI after frontend changes: `cd frontend && npm run build` (also type-checks). `start.sh` serves `frontend/dist`.

---

## 5. Project layout

```
SAT-SA/
├── start.sh / start.bat / dev.sh     launchers
├── backend/
│   ├── sat_sa/                       api.py (HTTP + service), analytics.py (metrics, baselines, signals, CEGS),
│   │                                 validation.py, db.py (SQLite)
│   ├── config/default.json           thresholds, baseline windows, ICS/CEGS weights (versioned in the DB once loaded)
│   ├── data/satsa.db                 pre-seeded database (18 submissions)
│   ├── scripts/                      seed_sample.py, reset_db.py
│   ├── sample_data/                  CSV bundles + ground_truth_signals.json for trying uploads
│   ├── tests/                        unittest suite (8 tests) + fixtures
│   └── docs/, VALIDATION_REPORT.md   architecture, metric lineage, ground-truth validation
└── frontend/
    ├── src/App.tsx                   all screens (data-driven)
    ├── src/api.ts                    typed API client (same-origin /api/v1)
    ├── dist/                         pre-built production UI
    └── schema.md, metrics.md         reference specs
```

## 6. API overview (`/api/v1`)

| Screen | Endpoint |
|---|---|
| Dashboard | `GET /dashboard?period=Q3-2026` |
| Submissions | `GET /submissions` · `POST /submissions/json` · `POST /submissions/csv` (multipart) · `POST /submissions/{id}/process` |
| CSE Assessment | `GET /assessments/{cse_id}?period=Q3-2026` |
| Worklist | `GET /worklist?period=…` (also `priority`, `cse`, `category`, `status`, `q`) |
| Case detail | `GET /cases/{case_id}` |
| Decision | `POST /cases/{case_id}/decisions` `{decision, comment, actor_id, actor_name}` |
| Report | `GET /reports/{cse_id}?period=…` · `GET /reports/{cse_id}/export?format=json` |
| Config | `GET/PUT /config` |
| Health | `GET /health` |

Explore it directly, e.g. `curl http://127.0.0.1:8000/api/v1/cases/CASE-1042`.

## 7. Tests

```bash
cd backend && python -m unittest discover -s tests -v      # 8 backend tests
cd frontend && npm run typecheck                           # TypeScript check
```

## 8. Reset / reseed the database

```bash
cd backend
python scripts/reset_db.py                                            # delete data/satsa.db
python scripts/seed_sample.py tests/fixtures/sample_dataset           # ingest the 18 sample submissions + run analytics
```
Deleting `data/satsa.db` and restarting also gives you an empty system you can fill via the Submissions screen.

## 9. Air-gapped / offline install notes

- **Running** needs only Python 3.10+ — the backend uses no third-party packages and the UI is pre-built.
- **Rebuilding the UI** offline: on a connected machine run `cd frontend && npm ci`, then copy the whole `frontend/` folder (including `node_modules/`) to the isolated machine, or simply ship `frontend/dist`.
- The original Google Fonts import was **removed**; the UI uses the system font stack. To use DM Sans / Manrope, self-host the font files and reference them in `frontend/src/index.css`.
- Bind address defaults to loopback. For a shared secured network set `SATSA_HOST` to an approved interface and enforce access control outside the app.

## 10. What was changed when combining the two projects

**Frontend** (`App.tsx`, new `api.ts`): every screen now uses `fetch` against the API — dashboard stats/table/category bars/ICS trend/recent submissions, real upload + validation + process flow, live 8-metric assessment cards, filterable worklist, full case detail, decision submission, and report with findings/decisions/export. Login validates the demo credential; the sign-in user name flows into decisions. `vite.config.ts` simplified (Figma tooling removed, `/api` proxy added); Google Fonts CDN import removed for offline use.

**Backend** (small, targeted changes):
- Worklist `status` now reflects supervisor decisions (*Not started → In review / Confirmed / Dismissed*).
- Decision response includes an `audit_reference`.
- **Invalid submissions are no longer stored.** Previously a structurally invalid upload was saved and then broke processing for every other CSE; it is now rejected with a `422` + validation report.
- Optionally serves the built frontend (`frontend/dist`) so one process delivers UI + API (`SATSA_STATIC_DIR` to override).
- Default DB path is now absolute, so it works from any working directory.

## 11. Known limitations (prototype)

- **Login is a demo check in the browser**; the backend has no authentication layer. Put it behind your organisation's identity/access controls for real use.
- Report export is **JSON** (plus browser Print → PDF); no server-side PDF generation.
- Signals that are CSE-level (not tied to one case) appear in the worklist as "CSE-level signal" and open the assessment; supervisor decisions are recorded per case.
- Data is synthetic; metric thresholds are configurable defaults, not validated benchmarks. Signals prioritise human review — they are not findings.
- Verification done in the build environment: backend unit tests, TypeScript type-check, production build, and a scripted end-to-end run of every API call the UI makes (upload JSON/CSV, process, worklist, case, decision, report, export, static hosting). A visual browser walkthrough was not possible in that environment, so give the UI a quick click-through on first run.

See `backend/README.md`, `backend/docs/`, and `backend/VALIDATION_REPORT.md` for architecture, metric lineage, and how the output was checked against the synthetic ground truth.
