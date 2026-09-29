> **Status:** this mapping is now implemented in `frontend/src/api.ts` and `frontend/src/App.tsx` (see the root README).

# Frontend integration map

The supplied React prototype already has these screens:

`Login -> Dashboard -> Submissions -> CSE Assessment -> Review Worklist ->
Case Investigation Detail -> Supervisor Decision -> Assessment Report`

Replace mock constants with calls to:

| Existing screen | Backend |
|---|---|
| Dashboard | `GET /api/v1/dashboard?period=Q3-2026` |
| Submissions list | `GET /api/v1/submissions` |
| Upload JSON | `POST /api/v1/submissions/json` with the full submission envelope |
| Upload CSV | `POST /api/v1/submissions/csv` as multipart with the per-entity CSV files |
| Process submission | `POST /api/v1/submissions/{submission_id}/process` |
| CSE Assessment | `GET /api/v1/assessments/{cse_id}?period=Q3-2026` |
| Worklist | `GET /api/v1/worklist?period=Q3-2026&priority=HIGH` |
| Case detail | `GET /api/v1/cases/CASE-1042` |
| Decision | `POST /api/v1/cases/CASE-1042/decisions` |
| Report | `GET /api/v1/reports/CSE-ALPHA?period=Q3-2026` |
| Export | `GET /api/v1/reports/CSE-ALPHA/export?period=Q3-2026&format=json` |

The response objects intentionally contain screen-oriented fields such as
`metrics`, `signals`, `priority`, `reason`, `status`, `evidence_chain`,
`checklist`, `decision`, and `report`, rather than exposing only database rows.
