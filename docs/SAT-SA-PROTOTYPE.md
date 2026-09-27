# SAT-SA clickable prototype

## Demo objective

The prototype tells one complete supervisory-assessment story:

1. An NCIIPC supervisor signs in.
2. SOC records for the fictional `CSE Alpha` are submitted for `Q3 2026`.
3. SAT-SA validates and processes the records.
4. The assessment identifies explainable supervisory signals.
5. The review worklist prioritizes `CASE-1042`.
6. The supervisor follows the signal to its supporting records.
7. The supervisor requests further review.
8. The assessment report records the decision and audit trail.

All values are illustrative and are not NCIIPC statistics or validated benchmarks.

## Information architecture

The authenticated application uses a persistent left navigation and contextual top bar:

- **Dashboard:** portfolio-level assessment summary and recent activity.
- **Submissions:** upload, validate, and process periodic SOC evidence.
- **CSE Assessments:** inspect calculated metrics, trends, and supervisory signals.
- **Review Worklist:** prioritize cases that warrant human examination.
- **Reports:** summarize signals, decisions, and recommendations.

Case investigation and supervisor decision are contextual steps reached from the worklist.

## Screen inventory

### 1. Login

- Controlled-access introduction for an NCIIPC supervisor.
- Pre-filled demonstration credentials.
- Clear secure/offline environment indicator.
- Primary action opens the dashboard.

### 2. Supervisor dashboard

- Portfolio counts: assessed CSEs, CSEs requiring review, prioritized cases, and pending reviews.
- CSE assessment table with separate signal counts and statuses.
- Supervisory-signal category summary.
- Assessment trend visualization.
- Recent-submission status.

The dashboard intentionally avoids reducing a CSE to one red/green score.

### 3. Submission management

- CSE and assessment-period controls.
- CSV/JSON upload surface.
- Validation summary that separates data-quality warnings from operational weaknesses.
- Five-stage processing flow.
- Simulated processing action leading to the CSE assessment.

### 4. CSE assessment overview

- CSE profile and submission context.
- Eight core metrics with signal or no-signal states.
- Configurable-threshold explanation.
- Historical trends, category distribution, and case status.
- Signals with direct routes to evidence and the review worklist.

### 5. Prioritized review worklist

- Filterable review queue with priority, CSE, category, rationale, and status.
- Plain-language explanation of why the selected case was prioritized.
- Review Priority Score labelled as configurable, not as a SOC quality score.

### 6. Case investigation detail

- Case metadata and supervisory-signal summary.
- Metric, deviation, signal, evidence, and explanation sequence.
- Activity timeline.
- Investigation checklist showing recorded and missing evidence.
- Evidence records with inspectable metadata.
- Caution that the signal warrants review but does not prove inadequacy.

### 7. Supervisor decision

- Supporting evidence remains visible during decision-making.
- Three outcomes: confirm concern, dismiss signal, or request further review.
- Required comments and simulated audited submission.
- Completion leads to the assessment report.

### 8. Assessment report

- Assessment and submission summary.
- Findings and human decisions.
- Recommendations.
- Simulated export/download controls.
- Return path to dashboard and review queue.

## Primary click path

`Login → Dashboard → Submissions → Process submission → CSE assessment → Review worklist → CASE-1042 → Supervisor decision → Assessment report`

Alternative navigation paths remain available in the authenticated shell.

## Interaction states

- Upload selection changes the submission state to ready for validation.
- Processing displays a short progress state before opening the assessment.
- Worklist filters update the visible rows.
- Evidence records expand in place.
- Decision options behave as a single selection.
- Submitting a decision adds the supervisor, timestamp, and audit reference to the report.
- Export controls show a lightweight completion notice.

## Visual direction

- Restrained public-sector supervisory interface.
- Deep navy application shell, cool neutral workspace, and blue primary actions.
- Amber identifies review attention; red is reserved for critical/high-priority evidence.
- Green communicates completed processing or recorded evidence.
- Dense data surfaces remain readable through strong hierarchy, generous spacing, and consistent status chips.

## Demo data and responsible framing

- `CSE Alpha` is fictional.
- All metrics, thresholds, records, and decisions are illustrative.
- Data-quality warnings are explicitly separated from operational signals.
- Every signal includes a reason and route to supporting evidence.
- SAT-SA supports supervisory judgment; it does not make the final determination.
- No single score claims to represent overall cyber resilience or SOC quality.

## Acceptance checklist

- All eight screens are reachable.
- Primary demo flow can be completed without a dead end.
- Buttons and table rows provide visible hover/focus feedback.
- Layout remains usable on laptop and narrow viewport widths.
- Signals always expose rationale and evidence.
- The submitted human decision appears in the report.
