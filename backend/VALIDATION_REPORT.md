# SAT-SA synthetic dataset validation

## Run

Dataset: supplied `satsa_sample_dataset` (18 JSON submissions, 6 CSEs × 3 quarters).

Result:
- JSON submissions ingested: **18/18**
- Validation errors: **0**
- Batch analytics processed: **18/18**
- Core metrics computed: **8/8 per submission**
- API/service tests: **8/8 passed**

## Known-condition checks

| Ground-truth condition | Backend result |
|---|---|
| CSE Alpha Q3 superficial-investigation cluster | **Detected**. `CASE-1042` has TTCP 16.7th percentile and ICS 38.9% under the configured weighted checklist; signal is evidence-linked. |
| CSE Charlie negative-space monitoring gap | **Detected**. Persistent critical-asset CAMG pattern is surfaced as a monitoring-visibility signal. |
| CSE Echo KPI/evidence discrepancy | **Detected**. Persistent elevated KECG across prior periods produces the governance signal. |
| CSE Foxtrot escalation-compliance gap | **Detected**. Q3 ER falls below the configured threshold with a prior-period low-ER context. |
| CSE Bravo clean peer | **No Q3 priority signal generated** by the configured rules. |
| CSE Delta recurrence | **Not asserted from this supplied dataset**. The generator exposes a `prr_rate` persona parameter, but the supplied records do not consistently encode same/equivalent conditions recurring within the configured 30-day window after recorded remediation. The backend still implements the PRR formula exactly against the records that are actually present. |

## Important interpretation

The synthetic `ground_truth_signals.json` describes intended injected conditions, but SAT-SA
must independently derive metrics from operational evidence. The backend therefore does not
hard-code persona IDs or ground-truth labels into the analytics engine.

Where the evidence does not support a condition under the specified formula, the backend
does not manufacture a positive signal.

## Anchor case

`CASE-1042` is preserved as the frontend demo anchor. The supplied dataset README states
that it is a Malware case closed in 42 minutes with only 3 of 8 investigation requirements
evidenced. The backend calculates its own checklist from `investigation_actions`, evidence,
and case/remediation fields.

## CSV parity

The API has a multipart CSV ingestion endpoint that accepts the ten per-entity files
specified by the supplied dataset. JSON and CSV are normalized into the same internal
submission envelope before validation and storage.
