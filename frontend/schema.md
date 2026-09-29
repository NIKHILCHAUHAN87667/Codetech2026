# SAT-SA SOC Submission Schema

## 1. Purpose

This document defines the canonical structured submission schema for
SAT-SA.

The CSE submits **underlying operational evidence**. SAT-SA
independently derives metrics, baselines, supervisory signals,
explanations and prioritization scores.

## 2. Submission Envelope

``` text
submission
├── submission_metadata
├── cse
├── assets[]
├── alerts[]
├── cases[]
├── investigation_actions[]
├── escalations[]
├── remediations[]
├── evidence[]
└── reported_kpis[]
```

## 3. Submission Metadata

  Field                     Type            Required Description
  ------------------------- ---------- ------------- ------------------------------
  submission_id             String               Yes Unique batch identifier
  schema_version            String               Yes Schema version
  cse_id                    String               Yes Submitting CSE
  assessment_period_start   DateTime             Yes Period start
  assessment_period_end     DateTime             Yes Period end
  submission_timestamp      DateTime             Yes Submission time
  source_format             Enum                 Yes CSV / JSON / DB_EXPORT / API
  record_counts             Object       Recommended Counts by entity
  data_completeness         Object       Recommended Completeness metadata

## 4. CSE

  Field              Type               Required Description
  ------------------ ------------- ------------- -------------------------
  cse_id             String                  Yes Unique CSE identifier
  cse_name           String             Optional Name/label
  sector             String/Enum     Recommended Critical sector
  operational_unit   String             Optional SOC/organizational unit

## 5. Asset

Supports OSEC and CAMG.

  ----------------------------------------------------------------------------------
  Field                 Type                          Required Description
  --------------------- ---------------- --------------------- ---------------------
  asset_id              String                             Yes Unique asset

  asset_type            Enum/String                Recommended Server, endpoint,
                                                               network device,
                                                               application, etc.

  criticality           Enum                               Yes CRITICAL / HIGH /
                                                               MEDIUM / LOW

  monitoring_expected   Boolean                            Yes Whether
                                                               monitoring/evidence
                                                               is expected

  monitoring_scope      String/Enum                Recommended Expected
                                                               monitoring/evidence
                                                               scope

  status                Enum                       Recommended ACTIVE / MAINTENANCE
                                                               / RETIRED

  business_unit         String                        Optional Organizational
                                                               context
  ----------------------------------------------------------------------------------

## 6. Alert

  -----------------------------------------------------------------------------
  Field                 Type                          Required Description
  --------------------- ---------------- --------------------- ----------------
  alert_id              String                             Yes Unique alert

  asset_id              String                     Recommended Associated asset

  alert_type            String/Enum                        Yes Detection
                                                               category

  severity              Enum                               Yes INFORMATIONAL /
                                                               LOW / MEDIUM /
                                                               HIGH / CRITICAL

  priority              Enum/Number                Recommended Operational
                                                               priority

  created_at            DateTime                           Yes Creation
                                                               timestamp

  source_system         String                     Recommended Detection/SIEM
                                                               source

  status                Enum                               Yes Alert status

  false_positive_flag   Boolean                    Recommended Final
                                                               classification

  case_id               String                        Optional Associated case
  -----------------------------------------------------------------------------

## 7. Case

  -----------------------------------------------------------------------------
  Field                 Type                          Required Description
  --------------------- ---------------- --------------------- ----------------
  case_id               String                             Yes Unique case

  alert_id              String                     Recommended Triggering alert

  case_type             String/Enum                        Yes Investigation
                                                               category

  opened_at             DateTime                           Yes Opening
                                                               timestamp

  closed_at             DateTime                   Conditional Required for
                                                               closed cases

  status                Enum                               Yes OPEN /
                                                               INVESTIGATING /
                                                               RESOLVED /
                                                               CLOSED

  disposition           Enum                       Recommended Final
                                                               disposition

  resolution_claim      String/Enum                Recommended Closure claim

  remediation_claim     Boolean                    Recommended Whether
                                                               remediation was
                                                               claimed

  assigned_analyst_id   String                        Optional Analyst
                                                               identifier

  closure_reason        String                     Recommended Closure
                                                               rationale
  -----------------------------------------------------------------------------

## 8. Investigation Action

  --------------------------------------------------------------------------------------
  Field                          Type                          Required Description
  ------------------------------ ---------------- --------------------- ----------------
  investigation_action_id        String                             Yes Unique action

  case_id                        String                             Yes Parent case

  action_type                    Enum/String                        Yes Investigation
                                                                        activity

  action_timestamp               DateTime                   Recommended Action timestamp

  evidence_reference             String                     Recommended Supporting
                                                                        evidence

  finding_recorded               Boolean                    Recommended Finding
                                                                        documented

  disposition_recorded           Boolean                    Recommended Disposition
                                                                        documented

  escalation_decision_recorded   Boolean                    Recommended Escalation
                                                                        decision
                                                                        documented

  remediation_recorded           Boolean                    Conditional Remediation
                                                                        recorded

  actor_id                       String                        Optional Analyst/actor
  --------------------------------------------------------------------------------------

## 9. Escalation

  --------------------------------------------------------------------------------
  Field                 Type                          Required Description
  --------------------- ---------------- --------------------- -------------------
  escalation_id         String                             Yes Unique escalation

  case_id               String                             Yes Parent case

  escalation_required   Boolean                            Yes Whether rules
                                                               require escalation

  escalated_flag        Boolean                            Yes Whether escalation
                                                               occurred

  escalated_at          DateTime                   Conditional Escalation
                                                               timestamp

  escalation_level      Enum/String                Recommended Destination/level

  escalation_reason     String                     Recommended Reason

  escalation_rule_id    String                     Recommended Rule determining
                                                               requirement
  --------------------------------------------------------------------------------

## 10. Remediation

  -------------------------------------------------------------------------------
  Field                   Type                          Required Description
  ----------------------- ---------------- --------------------- ----------------
  remediation_id          String                             Yes Unique
                                                                 remediation

  case_id                 String                             Yes Parent case

  asset_id                String                     Recommended Affected asset

  remediation_recorded    Boolean                            Yes Whether
                                                                 remediation was
                                                                 recorded

  remediation_type        Enum/String                Recommended Remediation
                                                                 category

  remediation_action      String                     Recommended Action
                                                                 description

  remediation_timestamp   DateTime                   Recommended Remediation time

  remediation_status      Enum                       Recommended PLANNED /
                                                                 IN_PROGRESS /
                                                                 COMPLETED

  remediation_reference   String                        Optional Change/ticket
                                                                 reference
  -------------------------------------------------------------------------------

## 11. Evidence

Supports OSEC, CAMG, ICS, CEMR and explainability.

  -----------------------------------------------------------------------------
  Field                 Type                          Required Description
  --------------------- ---------------- --------------------- ----------------
  evidence_id           String                             Yes Unique evidence

  case_id               String                     Recommended Related case

  alert_id              String                     Recommended Related alert

  asset_id              String                     Recommended Related asset

  evidence_type         Enum                               Yes Evidence
                                                               category

  source_system         String                     Recommended Source

  event_timestamp       DateTime                           Yes Evidence
                                                               timestamp

  reference_id          String                     Recommended Original record
                                                               reference

  availability_status   Enum                       Recommended AVAILABLE /
                                                               UNAVAILABLE /
                                                               REDACTED

  integrity_reference   String                        Optional Hash/signature
                                                               reference
  -----------------------------------------------------------------------------

Raw packet captures and full customer content are not required for the
prototype; structured evidence and references are sufficient for
supervisory analytics.

## 12. Reported KPI

Reported KPIs are kept separate from SAT-SA-derived metrics.

  Field                    Type            Required Description
  ------------------------ ---------- ------------- -------------------------
  kpi_id                   String               Yes KPI identifier
  cse_id                   String               Yes CSE
  kpi_name                 String               Yes KPI name
  reporting_period_start   DateTime             Yes KPI period start
  reporting_period_end     DateTime             Yes KPI period end
  reported_value           Numeric              Yes Reported value
  reported_numerator       Numeric      Recommended Numerator
  reported_denominator     Numeric      Recommended Denominator
  definition_version       String       Recommended KPI definition
  population_definition    String       Recommended Population
  severity_scope           String          Optional Scope
  source_reference         String       Recommended Source report/reference

## 13. Complete JSON Envelope

``` json
{
  "submission_metadata": {
    "submission_id": "SUB-2026-Q3-001",
    "schema_version": "1.0",
    "cse_id": "CSE-001",
    "assessment_period_start": "2026-07-01T00:00:00Z",
    "assessment_period_end": "2026-09-30T23:59:59Z",
    "submission_timestamp": "2026-10-01T10:00:00Z",
    "source_format": "JSON"
  },
  "cse": {
    "cse_id": "CSE-001",
    "cse_name": "Example CSE",
    "sector": "CRITICAL_INFRASTRUCTURE"
  },
  "assets": [],
  "alerts": [],
  "cases": [],
  "investigation_actions": [],
  "escalations": [],
  "remediations": [],
  "evidence": [],
  "reported_kpis": []
}
```

## 14. Entity Relationships

``` text
CSE
│
├───────────────┐
│               │
▼               ▼
ASSET        REPORTED_KPI
│
▼
ALERT
│
▼
CASE
├───────────────┬──────────────┬───────────────┐
▼               ▼              ▼               ▼
INVESTIGATION  ESCALATION    REMEDIATION     EVIDENCE
```

Recommended identifiers:

``` text
cse_id
  │
  ├── asset_id
  │      │
  │      └── alert_id
  │             │
  │             └── case_id
  │                    ├── investigation_action_id
  │                    ├── escalation_id
  │                    ├── remediation_id
  │                    └── evidence_id
  │
  └── kpi_id
```

## 15. Metric-to-Schema Mapping

  Metric                                Required entities
  ------------------------------------- ----------------------------------------------------
  OSEC                                  Asset + Evidence
  CAMG                                  Asset + Evidence
  TTCP                                  Case + Alert
  ICS                                   Case + Investigation Action + Evidence
  ER                                    Case + Escalation
  PRR                                   Case + Alert + Asset + Remediation
  CEMR                                  Case + Evidence + Remediation
  KECG                                  Reported KPI + operational evidence
  CALR                                  Case + analyst/workforce context
  ACCR                                  Alert + Case
  BR                                    Case
  Investigation Pattern Concentration   Investigation Action
  Evidence Sufficiency/Density          Evidence + Investigation Action
  CEGS                                  Derived supervisory signals + SAT-SA configuration

## 16. Submitted vs Derived Data

### Submitted by CSE

``` text
CSE metadata
Assets
Alerts
Cases
Investigation actions
Escalations
Remediations
Evidence
Reported KPIs
```

### Derived by SAT-SA

``` text
OSEC
CAMG
TTCP
ICS
ER
PRR
CEMR
KECG
Historical baselines
Peer baselines
Metric deviations
Trends
Supervisory signals
Explanations
CEGS
Prioritized worklist
```

## 17. Data Quality

SAT-SA should validate:

-   missing required identifiers
-   invalid timestamps
-   broken entity references
-   duplicate identifiers
-   missing assessment periods
-   inconsistent alert/case relationships
-   missing closure timestamps for closed cases
-   missing remediation linkage
-   missing investigation records
-   evidence coverage limitations
-   KPI definition/population mismatches

A data-quality limitation must be distinguished from an operational
weakness.

For example:

> "Insufficient evidence to assess investigation completeness"

is different from:

> "Investigation completeness is low despite sufficient submitted
> evidence."

## 18. Schema Versioning

Use an explicit `schema_version`, for example:

`"1.0"`

Changes to field definitions, enumerations, required fields or
relationships should result in a new schema version.

## 19. End-to-End Data Flow

``` text
CSE operational evidence
        ↓
Schema validation
        ↓
Entity resolution
        ↓
Raw + normalized storage
        ↓
Measurements
        ↓
SAT-SA metrics
        ↓
Historical / peer baselines
        ↓
Supervisory signals
        ↓
Evidence-backed explanations
        ↓
Prioritized worklist
        ↓
Human examiner
```
