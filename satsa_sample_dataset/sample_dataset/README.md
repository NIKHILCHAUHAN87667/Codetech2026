# SAT-SA Sample Dataset (Synthetic, Prototype-Grade)

This is a synthetic operational-evidence dataset generated to conform
exactly to `schema.md` (SAT-SA SOC Submission Schema, v1.0), sized and
structured for testing and demonstrating a SAT-SA prototype to NCIIPC.

**All entities, CSE names, IDs and events are fictional.** No real
organisation, incident or individual is represented.

## Why it's built this way

The problem statement's Performance Criteria explicitly reward
detection of execution gaps, detection of negative space, and
explainability/auditability — and Section 8 requires validating the
tool "against findings derived from expert manual review." A random
dataset can't demonstrate that. So every CSE here is a persona with
one dominant, documented, deliberately-injected supervisory condition,
so you can run your backend against it and check whether it recovers
the known answer. That known answer lives in `ground_truth_signals.json`.

## Contents

```
json/                      18 files - one full submission envelope per CSE per quarter
                            (exact structure of schema.md §13, ready for JSON upload/ingestion)
csv/<CSE>_<PERIOD>/         same 18 submissions, exploded into one CSV per entity table
                            (cse, assets, alerts, cases, investigation_actions,
                             escalations, remediations, evidence, reported_kpis,
                             submission_metadata) - for CSV ingestion testing
ground_truth_signals.json   machine-readable record of every deliberately injected
                            condition, for automated validation of your analytics
README.md                   this file
```

## Scale

| Entity | Total records |
|---|---|
| CSEs | 6 |
| Assessment periods | 3 (Q1, Q2, Q3 2026) |
| Submissions | 18 |
| Assets | 1,044 |
| Alerts | 4,731 |
| Cases | 1,378 |
| Investigation actions | 8,172 |
| Escalations | 254 |
| Remediations | 862 |
| Evidence records | 6,141 |
| Reported KPIs | 144 |
| **Total records** | **~22,700** |

This is large enough to compute every metric in `metrics.md` with
genuine peer and historical baselines (6 peers × 3 quarters), while
staying small enough to process, inspect and demo on a laptop-class
offline machine — matching the deployment constraints in the PS.

## The six CSEs and their injected signals

| CSE | Sector | Dominant injected condition | Metric it should move |
|---|---|---|---|
| **CSE-ALPHA** | Power & Energy | Q3 cluster of superficially investigated, fast-closed cases, anchored by `CASE-1042` (a Malware case — matches the frontend prototype's demo narrative) | Low ICS, low TTCP percentile, elevated CEMR, all concentrated in Q3 vs. clean Q1–Q2 |
| **CSE-BRAVO** | Banking & Financial Services | None — consistently strong performer | Used as the "clean" peer baseline |
| **CSE-CHARLIE** | Telecommunications | A stable set of CRITICAL core-network assets produce zero evidence, every quarter | High CAMG / low OSEC (negative space) |
| **CSE-DELTA** | Transportation (OT/signalling) | Elevated share of remediated conditions recur within the window | High PRR |
| **CSE-ECHO** | Healthcare | Self-reported KPIs consistently more favourable than what the evidence supports | High KECG |
| **CSE-FOXTROT** | Water & Utilities (SCADA) | Large share of HIGH/CRITICAL cases meeting escalation criteria are not escalated | Low ER |

Full detail, including the exact affected asset IDs for CSE-CHARLIE's
negative-space gap in every quarter, is in `ground_truth_signals.json`.

**`CASE-1042`** in `json/CSE-ALPHA_Q3-2026.json` is deliberately built to
match the clickable frontend prototype (`docs/SAT-SA-PROTOTYPE.md`):
CSE Alpha, Q3 2026, Malware, closed in 42 minutes with only 3 of 8
investigation requirements evidenced. Point your backend at this file
first to confirm end-to-end wiring before running the full set.

## How this maps to the schema and metrics

- Field names, enums and entity relationships follow `schema.md`
  exactly (§5–§12), including the envelope shape in §13.
- `reported_kpis` are intentionally **not** the same values your
  backend will independently derive — that gap is what KECG measures.
  Don't treat `reported_value` as ground truth; it's the CSE's claim.
- Each submission's `data_completeness` block flags where investigation
  or evidence records are partial, consistent with the schema's
  distinction between a data-sufficiency limitation and a genuine
  operational weakness (§17).
- Evidence, escalation, and remediation records are generated per case
  using the same requirement lists named in `metrics.md` §1.4 (ICS)
  and §1.5 (ER), so a correct implementation of those formulas should
  reproduce the injected signals.

## Suggested test sequence

1. Ingest `json/CSE-ALPHA_Q3-2026.json` alone; confirm `CASE-1042`
   surfaces as a high-priority investigation-completeness signal.
2. Ingest all three CSE-ALPHA quarters; confirm the Q3 dip shows up
   against the Q1–Q2 historical baseline (trend, not just a single-period
   threshold breach).
3. Ingest all 18 submissions; confirm CSE-BRAVO comes out clean, and
   each of CSE-CHARLIE/DELTA/ECHO/FOXTROT surfaces its one dominant
   signal type when benchmarked against the other five peers.
4. Diff `reported_kpis.reported_value` against your independently
   derived value per CSE; CSE-ECHO should show the largest KECG gap.
5. Re-run the CSV versions through your ingestion path to confirm
   parity with the JSON path.

## Regenerating or extending

The generator (`generate_dataset.py`) is deterministic (fixed seed) and
parameterised by a `PERSONAS` dict — add a CSE, change a quarter
override, or scale up asset/alert counts by editing that file and
re-running it. Ask if you'd like a larger or differently-shaped batch.
