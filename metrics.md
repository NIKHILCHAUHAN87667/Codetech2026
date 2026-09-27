# SAT-SA Metrics Specification

## Purpose

This document defines the eight core supervisory metrics,
supporting/contextual metrics, and the composite prioritization score
used by SAT-SA.

**Analytics chain:** Raw operational evidence → measurements → metrics →
baselines/context → supervisory signals → evidence-backed explanation →
human review.

> A metric is not itself a supervisory finding.

## 1. Core Supervisory Metrics

### 1.1 OSEC --- Observed Security Evidence Coverage

**Definition:** Proportion of assets expected to produce security
evidence that have at least one qualifying evidence record during the
assessment period.

**Formula:**

`OSEC = (assets with expected security evidence observed / assets expected to produce security evidence) × 100`

**Required data:** `asset_id`, `monitoring_expected`,
`evidence_asset_id`, `evidence_timestamp`, `evidence_type`,
`period_start`, `period_end`.

**Interpretation:** Low OSEC indicates a potential visibility/monitoring
gap. No observed evidence does not automatically mean no monitoring
exists.

**Use:** Detection/monitoring coverage and negative-space analysis.

### 1.2 CAMG --- Critical-Asset Monitoring Gap

**Definition:** Proportion of critical assets expected to be monitored
but having no qualifying evidence during the assessment period.

**Formula:**

`CAMG = (critical assets without qualifying evidence / critical assets expected to be monitored) × 100`

**Required data:** `asset_id`, `criticality`, `monitoring_expected`,
`evidence_asset_id`, `evidence_timestamp`, `evidence_type`.

**Interpretation:** High CAMG identifies critical assets requiring
supervisory review. It is a negative-space candidate, not proof of
failure.

**Use:** Critical-asset visibility and monitoring blind-spot detection.

### 1.3 TTCP --- Time-to-Close Percentile

**Definition:** Relative position of a case's time-to-close within a
comparable population.

**Formula:**

`TTC_i = closed_at_i − opened_at_i`

`TTCP_i = PercentileRank(TTC_i | comparable group G_i)`

Initial comparison group: CSE + alert type + severity + comparable
period.

**Required data:** `case_id`, `alert_id`, `alert_type`, `severity`,
`opened_at`, `closed_at`, `cse_id`, `case_status`.

**Interpretation:** An unusually low TTCP means unusually rapid closure.
It should be interpreted with investigation quality/evidence metrics.

**Use:** Investigation execution analysis.

### 1.4 ICS --- Investigation Completeness Score

**Definition:** Degree to which applicable investigation requirements
were completed.

**Formula:**

`ICS_i = [Σ(w_j × I_ij) / Σw_j] × 100`

where `I_ij = 1` when requirement j is satisfied and `0` otherwise;
`w_j` is a configurable importance weight.

**Example requirements:** alert reviewed, evidence examined, affected
asset identified, investigation actions recorded, findings documented,
disposition documented, escalation decision documented, remediation
recorded where applicable.

**Required data:** `case_id`, `alert_id`, `case_type`, `severity`,
`investigation_action_id`, `action_type`, `action_timestamp`,
`evidence_reference`, `finding_recorded`, `disposition_recorded`,
`escalation_decision_recorded`, `remediation_recorded` where applicable.

**Interpretation:** Low ICS indicates fewer expected investigation
elements are evidenced in the submitted record.

**Use:** Investigation execution and superficial-investigation signals.

### 1.5 ER --- Escalation Compliance Rate

**Definition:** Proportion of cases meeting defined escalation criteria
that were actually escalated.

**Formula:**

`ER = (qualifying cases actually escalated / cases meeting escalation criteria) × 100`

**Required data:** `case_id`, `severity`, `case_type`,
`escalation_required`, `escalated_flag`, `escalated_at`,
`escalation_level`, `escalation_reason`, `escalation_rule_id`.

**Interpretation:** Low ER indicates cases meeting defined criteria were
not escalated at the expected rate. The denominator is qualifying cases,
not all cases.

**Use:** Escalation-process assessment.

### 1.6 PRR --- Post-Remediation Recurrence Rate

**Definition:** Proportion of remediated conditions that recur within a
configured recurrence window.

**Formula:**

`PRR = (conditions recurring after recorded remediation / conditions with recorded remediation) × 100`

A qualifying recurrence normally requires the same asset,
same/equivalent alert condition, prior recorded remediation, and
occurrence within the configured window.

**Required data:** `case_id`, `alert_id`, `asset_id`, `alert_type`,
`opened_at`, `closure_status`, `remediation_recorded`,
`remediation_timestamp`, `remediation_type`, `remediation_status`,
`remediation_reference`.

**Interpretation:** High PRR identifies repeated conditions after
recorded remediation. It does not automatically prove remediation
failure.

**Use:** Response effectiveness and recurring-condition detection.

### 1.7 CEMR --- Closure-Evidence Mismatch Rate

**Definition:** Proportion of cases closed as resolved/remediated for
which the submitted dataset lacks expected supporting evidence.

**Formula:**

`CEMR = (resolved/remediated cases lacking supporting evidence / resolved/remediated cases) × 100`

**Required data:** case closure/resolution fields; `evidence_id`,
`case_id`, `evidence_type`, `evidence_timestamp`, `evidence_reference`;
remediation fields where applicable.

**Interpretation:** High CEMR indicates a mismatch between
closure/remediation claims and available supporting evidence.

**Required wording:** "No supporting evidence was found in the submitted
dataset." Do not automatically conclude remediation did not occur.

**Use:** Closure-quality and execution-gap analysis.

### 1.8 KECG --- KPI--Evidence Consistency Gap

**Definition:** Discrepancy between CSE-reported KPI values and KPI
values independently derived by SAT-SA.

**Prerequisite:** Reported and observed KPIs must be aligned on
definition, population, period, denominator and scope.

**Formula:**

`D_k = |ReportedKPI_k − ObservedKPI_k|`

`KECG = Σ(w_k × D_k) / Σw_k`

**Required reported data:** `kpi_id`, `kpi_name`, reporting period,
`reported_value`, `reported_numerator`, `reported_denominator`,
`definition_version`, `population_definition`, `severity_scope`.

SAT-SA independently derives the observed value from operational
evidence.

**Interpretation:** High KECG means reported performance materially
differs from performance observable in the submitted evidence. It does
not automatically imply manipulation.

**Use:** Governance, oversight and KPI--evidence consistency.

## 2. Supporting / Contextual Metrics

### CALR --- Case-per-Analyst Load Ratio

`CALR = cases assigned during period / active analysts during period`

Provides workload context for interpreting investigation and closure
patterns.

### ACCR --- Alert-to-Case Conversion Ratio

`ACCR = alerts linked to cases / alerts × 100`

Provides triage/workflow context. It is not inherently good or bad.

### BR --- Backlog Ratio

`BR = open cases at period end / cases opened during period`

Provides workload and operational-capacity context.

### Investigation Pattern Concentration

Example:

`IPC = investigation actions in dominant pattern / total investigation actions × 100`

Can identify unusually repetitive investigation workflows. Must be
interpreted by case type.

### Evidence Sufficiency / Evidence Density

Simple form:

`EDS_i = number of distinct evidence items associated with case i`

Normalized form:

`EDS*_i = evidence items / applicable investigation requirements`

Provides context for TTCP, ICS and CEMR. Quantity alone is not evidence
quality.

## 3. CEGS --- Composite Execution-Gap Score

**Purpose:** Worklist prioritization, not a universal SOC-quality score.

`CEGS_e = Σ(w_k × S_e,k)`

where `S_e,k` is normalized supervisory signal strength and `w_k` is a
configurable weight.

Possible inputs include monitoring, investigation, escalation,
recurrence, closure-evidence and KPI-evidence signals.

Weights belong in SAT-SA configuration, not the CSE submission.

**Interpretation:** Higher CEGS means higher review priority; it is not
a definitive judgment of SOC quality or compliance.

## 4. Signal Generation

`Metric → sample sufficiency → historical/peer baseline → deviation → configurable rule → persistence/trend → contextual checks → supervisory signal → evidence → human review`

Conceptually:

`Signal = f(Metric, HistoricalBaseline, PeerBaseline, Threshold, Context)`

## 5. Key Signal Examples

**Potential superficial investigation:** unusually low TTCP + low ICS +
sufficient sample.

**Potential monitoring blind spot:** low OSEC + high CAMG +
historical/peer deviation.

**KPI--evidence discrepancy:** elevated KECG + aligned definitions +
sufficient evidence.

**Post-remediation recurrence:** elevated PRR + sufficient recurrence
sample + persistent trend.

## 6. Data Sufficiency

SAT-SA must distinguish insufficient submitted evidence from poor
operational performance.

Example:

-   "ICS is low despite sufficient investigation records" → performance
    signal.
-   "ICS cannot be reliably assessed because investigation records are
    missing" → data-sufficiency limitation.

## 7. Metric Lineage

  Metric                                Primary data
  ------------------------------------- ---------------------------------------------
  OSEC                                  Asset + Evidence
  CAMG                                  Asset + Evidence
  TTCP                                  Case + Alert
  ICS                                   Case + Investigation + Evidence
  ER                                    Case + Escalation
  PRR                                   Case + Alert + Asset + Remediation
  CEMR                                  Case + Evidence + Remediation
  KECG                                  Reported KPI + independently derived KPI
  CALR                                  Case + analyst/workforce context
  ACCR                                  Alert + Case
  BR                                    Case
  Investigation Pattern Concentration   Investigation
  Evidence Sufficiency/Density          Evidence + Investigation
  CEGS                                  Derived supervisory signals + configuration
