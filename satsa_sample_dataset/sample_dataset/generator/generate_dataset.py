#!/usr/bin/env python3
"""
SAT-SA synthetic prototype dataset generator.

Generates a multi-CSE, multi-period dataset conforming exactly to the
SAT-SA SOC Submission Schema (schema.md), with deliberately injected
supervisory signals (execution gaps + negative space) matching the
patterns described in metrics.md, so the prototype backend's analytics
can be validated against a known ground truth.

Output:
  sample_dataset/json/<CSE>_<PERIOD>.json          - full submission envelope
  sample_dataset/csv/<CSE>_<PERIOD>/*.csv            - per-entity CSVs (same submission)
  sample_dataset/ground_truth_signals.json           - injected-signal ground truth
  sample_dataset/README.md                           - dataset guide
"""

import json
import csv
import os
import random
import shutil
from datetime import datetime, timedelta, timezone

OUT_ROOT = "/home/claude/output/sample_dataset"
SCHEMA_VERSION = "1.0"

# ---------------------------------------------------------------------------
# Reference vocab
# ---------------------------------------------------------------------------

ASSET_TYPES = ["Server", "Endpoint", "Network Device", "Application",
               "Database", "IoT/OT Device", "Cloud Workload"]
CRITICALITY_WEIGHTS = [("CRITICAL", 0.12), ("HIGH", 0.23),
                        ("MEDIUM", 0.35), ("LOW", 0.30)]
ASSET_STATUS_WEIGHTS = [("ACTIVE", 0.90), ("MAINTENANCE", 0.06), ("RETIRED", 0.04)]
BUSINESS_UNITS = ["OT Operations", "Corporate IT", "Customer Systems",
                   "Field Operations", "Data Center", "Remote Sites"]

ALERT_TYPES = ["Malware", "Phishing", "Unauthorized Access",
               "Data Exfiltration Attempt", "Brute Force", "Anomalous Login",
               "Policy Violation", "DDoS", "Privilege Escalation",
               "Suspicious Network Traffic", "Ransomware Indicator",
               "Insider Threat Indicator"]
SEVERITY_WEIGHTS = [("INFORMATIONAL", 0.18), ("LOW", 0.30), ("MEDIUM", 0.28),
                     ("HIGH", 0.17), ("CRITICAL", 0.07)]
SOURCE_SYSTEMS = ["SIEM-Core", "EDR-Sentinel", "NIDS-Perimeter", "Firewall-Log",
                   "IAM-Monitor", "Cloud-Sec-Posture", "OT-Historian-Watch"]
ALERT_STATUS = ["OPEN", "IN_PROGRESS", "CLOSED"]

CASE_TYPE_MAP = {
    "Malware": "Malware Investigation", "Ransomware Indicator": "Malware Investigation",
    "Phishing": "Phishing Investigation", "Unauthorized Access": "Access Investigation",
    "Privilege Escalation": "Access Investigation", "Anomalous Login": "Access Investigation",
    "Data Exfiltration Attempt": "Data Loss Investigation",
    "Insider Threat Indicator": "Insider Threat Investigation",
    "Brute Force": "Access Investigation", "Policy Violation": "Policy Investigation",
    "DDoS": "Network Anomaly Investigation",
    "Suspicious Network Traffic": "Network Anomaly Investigation",
}
CASE_STATUS_CLOSED = ["RESOLVED", "CLOSED"]
DISPOSITIONS = ["TRUE_POSITIVE_REMEDIATED", "TRUE_POSITIVE_ACCEPTED_RISK",
                "FALSE_POSITIVE", "BENIGN_ACTIVITY", "DUPLICATE"]
RESOLUTION_CLAIMS = ["Remediated", "No action required", "False positive confirmed",
                     "Risk accepted", "Escalated and closed by higher authority"]
ANALYSTS = [f"ANALYST-{i:03d}" for i in range(1, 19)]

ACTION_TYPES = ["Alert Reviewed", "Evidence Examined", "Affected Asset Identified",
                "Log Correlation Performed", "Root Cause Analysis",
                "Containment Action Taken", "Finding Documented",
                "Disposition Documented", "Escalation Decision Documented",
                "Remediation Recorded"]

ESCALATION_LEVELS = ["Team Lead", "SOC Manager", "CISO Office",
                      "External CERT-In", "NCIIPC Liaison"]
ESCALATION_REASONS = ["Severity threshold met", "Critical asset impacted",
                       "Suspected multi-asset campaign", "Regulatory notification criteria met",
                       "Repeat condition on critical asset"]

REMEDIATION_TYPES = ["Patch Applied", "Configuration Hardening", "Account Disabled",
                      "Network Segmentation Change", "Malware Removed",
                      "Access Revoked", "Policy Updated", "Endpoint Reimaged",
                      "Credential Rotation"]
REMEDIATION_STATUS = ["PLANNED", "IN_PROGRESS", "COMPLETED"]

EVIDENCE_TYPES = ["Log Extract Reference", "EDR Detection Record",
                   "Packet Metadata Reference", "Ticket Record",
                   "Access Log Reference", "Config Snapshot Reference",
                   "Email Header Reference", "Alert Raw Record"]
AVAILABILITY = [("AVAILABLE", 0.88), ("REDACTED", 0.07), ("UNAVAILABLE", 0.05)]

KPI_DEFS = [
    ("KPI-OSEC", "Observed Security Evidence Coverage"),
    ("KPI-CAMG", "Critical Asset Monitoring Gap"),
    ("KPI-TTCP", "Median Time-to-Close (Investigations)"),
    ("KPI-ICS", "Investigation Completeness Rate"),
    ("KPI-ER", "Escalation Compliance Rate"),
    ("KPI-PRR", "Post-Remediation Recurrence Rate"),
    ("KPI-CEMR", "Closure Evidence Completeness Rate"),
    ("KPI-BR", "Case Backlog Ratio"),
]

PERIODS = [
    ("Q1-2026", datetime(2026, 1, 1, tzinfo=timezone.utc), datetime(2026, 3, 31, 23, 59, 59, tzinfo=timezone.utc)),
    ("Q2-2026", datetime(2026, 4, 1, tzinfo=timezone.utc), datetime(2026, 6, 30, 23, 59, 59, tzinfo=timezone.utc)),
    ("Q3-2026", datetime(2026, 7, 1, tzinfo=timezone.utc), datetime(2026, 9, 30, 23, 59, 59, tzinfo=timezone.utc)),
]

# ---------------------------------------------------------------------------
# CSE personas - each biases the generator to deliberately create one
# dominant, well-documented supervisory signal type, plus a "clean" peer.
# All quality knobs are 0..1 probabilities/rates.
# ---------------------------------------------------------------------------

PERSONAS = {
    "CSE-ALPHA": dict(
        name="Alpha Power Grid Corporation", sector="POWER_AND_ENERGY",
        unit="SOC - Grid Operations", scale=1.0,
        ics_quality=0.80, fast_closure_bias=0.06, escalation_compliance=0.90,
        evidence_density=1.0, camg_gap=0.04, prr_rate=0.05, cemr_rate=0.06,
        kecg_bias=0.05,
        # Q3 2026 dip: superficial-investigation cluster (execution gap) -
        # matches the frontend demo story (CASE-1042).
        quarter_overrides={"Q3-2026": dict(ics_quality=0.42, fast_closure_bias=0.35, cemr_rate=0.22)},
        story="Primary demo CSE. Q1-Q2 broadly sound; Q3 shows a cluster of "
              "superficially investigated, unusually fast-closed malware cases "
              "(anchor case CASE-1042), plus a rise in closures lacking evidence.",
    ),
    "CSE-BRAVO": dict(
        name="Bravo National Bank", sector="BANKING_AND_FINANCIAL_SERVICES",
        unit="SOC - Enterprise Security", scale=1.3,
        ics_quality=0.90, fast_closure_bias=0.04, escalation_compliance=0.95,
        evidence_density=1.3, camg_gap=0.02, prr_rate=0.03, cemr_rate=0.03,
        kecg_bias=0.03, quarter_overrides={},
        story="Consistently strong performer across all three quarters. Used as "
              "the 'clean' peer baseline for benchmarking against the other CSEs.",
    ),
    "CSE-CHARLIE": dict(
        name="Charlie Telecom Networks", sector="TELECOMMUNICATIONS",
        unit="SOC - Core Network Security", scale=1.1,
        ics_quality=0.75, fast_closure_bias=0.08, escalation_compliance=0.85,
        evidence_density=0.9, camg_gap=0.30, prr_rate=0.06, cemr_rate=0.07,
        kecg_bias=0.04, quarter_overrides={},
        story="Persistent negative-space signal: a stable set of CRITICAL core-"
              "network assets produce no qualifying monitoring evidence across "
              "all three quarters (high CAMG / low OSEC).",
    ),
    "CSE-DELTA": dict(
        name="Delta Metro Transit Authority", sector="TRANSPORTATION",
        unit="SOC - OT/Signalling Security", scale=0.8,
        ics_quality=0.78, fast_closure_bias=0.07, escalation_compliance=0.88,
        evidence_density=1.0, camg_gap=0.05, prr_rate=0.28, cemr_rate=0.06,
        kecg_bias=0.04, quarter_overrides={},
        story="Recurrence pattern: a meaningful share of remediated conditions "
              "on OT signalling assets reappear within the recurrence window "
              "despite recorded remediation (high PRR).",
    ),
    "CSE-ECHO": dict(
        name="Echo Regional Healthcare Network", sector="HEALTHCARE",
        unit="SOC - Clinical Systems Security", scale=0.9,
        ics_quality=0.82, fast_closure_bias=0.05, escalation_compliance=0.87,
        evidence_density=1.0, camg_gap=0.05, prr_rate=0.05, cemr_rate=0.05,
        kecg_bias=0.35, quarter_overrides={},
        story="Governance signal: self-reported KPI values are systematically "
              "more favourable than the values SAT-SA independently derives "
              "from submitted evidence (high KECG) in every quarter.",
    ),
    "CSE-FOXTROT": dict(
        name="Foxtrot Water & Utilities Board", sector="WATER_AND_UTILITIES",
        unit="SOC - SCADA Security", scale=0.7,
        ics_quality=0.80, fast_closure_bias=0.06, escalation_compliance=0.45,
        evidence_density=0.95, camg_gap=0.06, prr_rate=0.05, cemr_rate=0.06,
        kecg_bias=0.04, quarter_overrides={},
        story="Escalation-process signal: a large share of HIGH/CRITICAL cases "
              "that meet defined escalation criteria are not escalated as "
              "required (low ER), most pronounced on SCADA-linked assets.",
    ),
}

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def weighted_choice(rng, weights):
    total = sum(w for _, w in weights)
    r = rng.uniform(0, total)
    upto = 0
    for val, w in weights:
        upto += w
        if r <= upto:
            return val
    return weights[-1][0]

def iso(dt):
    return dt.strftime("%Y-%m-%dT%H:%M:%SZ")

def rand_dt_between(rng, start, end):
    delta = end - start
    secs = rng.uniform(0, delta.total_seconds())
    return start + timedelta(seconds=secs)

def esc_required_for(severity, alert_type):
    if severity == "CRITICAL":
        return True
    if severity == "HIGH" and alert_type in ("Data Exfiltration Attempt",
            "Ransomware Indicator", "Insider Threat Indicator", "Unauthorized Access"):
        return True
    return False

# ---------------------------------------------------------------------------
# Core generation for one CSE + one period
# ---------------------------------------------------------------------------

def gen_assets(rng, cse_id, persona, n_assets):
    assets = []
    for i in range(1, n_assets + 1):
        crit = weighted_choice(rng, CRITICALITY_WEIGHTS)
        assets.append(dict(
            asset_id=f"{cse_id}-AST-{i:04d}",
            asset_type=rng.choice(ASSET_TYPES),
            criticality=crit,
            monitoring_expected=True if crit in ("CRITICAL", "HIGH") or rng.random() < 0.8 else False,
            monitoring_scope=rng.choice(["Full telemetry", "Log-only", "Network-only", "Endpoint-only"]),
            status=weighted_choice(rng, ASSET_STATUS_WEIGHTS),
            business_unit=rng.choice(BUSINESS_UNITS),
        ))
    return assets

def gen_alerts_cases(rng, cse_id, persona, period_label, p_start, p_end, assets, n_alerts,
                      forced_case_id=None, forced_alert_asset=None):
    alerts, cases = [], []
    q = persona.get("quarter_overrides", {}).get(period_label, {})
    ics_quality = q.get("ics_quality", persona["ics_quality"])
    fast_closure_bias = q.get("fast_closure_bias", persona["fast_closure_bias"])
    cemr_rate = q.get("cemr_rate", persona["cemr_rate"])
    esc_compliance = persona["escalation_compliance"]

    case_seq = 1
    for i in range(1, n_alerts + 1):
        alert_id = f"{cse_id}-ALT-{period_label}-{i:05d}"
        asset = rng.choice(assets)
        alert_type = rng.choice(ALERT_TYPES)
        severity = weighted_choice(rng, SEVERITY_WEIGHTS)
        created_at = rand_dt_between(rng, p_start, p_end)
        fp = rng.random() < 0.12
        becomes_case = (not fp) and (severity in ("MEDIUM", "HIGH", "CRITICAL") and rng.random() < 0.55
                                      or severity == "LOW" and rng.random() < 0.15)
        case_id = None
        if becomes_case:
            case_id = f"{cse_id}-CASE-{period_label}-{case_seq:05d}"
            case_seq += 1
        alerts.append(dict(
            alert_id=alert_id, asset_id=asset["asset_id"], alert_type=alert_type,
            severity=severity, priority={"CRITICAL": 1, "HIGH": 2, "MEDIUM": 3,
                                          "LOW": 4, "INFORMATIONAL": 5}[severity],
            created_at=iso(created_at), source_system=rng.choice(SOURCE_SYSTEMS),
            status="CLOSED" if case_id or rng.random() < 0.6 else rng.choice(["OPEN", "IN_PROGRESS"]),
            false_positive_flag=fp, case_id=case_id,
        ))
        if case_id:
            cases.append(build_case(rng, cse_id, case_id, alert_id, alert_type, severity,
                                     created_at, p_end, ics_quality, fast_closure_bias,
                                     esc_compliance, cemr_rate, asset))
    return alerts, cases

def build_case(rng, cse_id, case_id, alert_id, alert_type, severity, alert_created_at, p_end,
               ics_quality, fast_closure_bias, esc_compliance, cemr_rate, asset):
    case_type = CASE_TYPE_MAP.get(alert_type, "Network Anomaly Investigation")
    opened_at = alert_created_at + timedelta(minutes=rng.randint(2, 240))
    is_superficial = rng.random() < fast_closure_bias
    if is_superficial:
        ttc_hours = rng.uniform(0.1, 0.9)
    else:
        base = {"CRITICAL": 36, "HIGH": 30, "MEDIUM": 48, "LOW": 60, "INFORMATIONAL": 72}[severity]
        ttc_hours = max(1.0, rng.gauss(base, base * 0.35))
    closed_at = opened_at + timedelta(hours=ttc_hours)
    if closed_at > p_end:
        closed_at = p_end - timedelta(minutes=rng.randint(5, 120))
        opened_at = min(opened_at, closed_at - timedelta(hours=0.2))
    status = rng.choice(CASE_STATUS_CLOSED) if closed_at < p_end else rng.choice(["OPEN", "INVESTIGATING"])
    remediation_claim = status in ("RESOLVED", "CLOSED") and rng.random() < 0.65
    disposition = rng.choice(DISPOSITIONS) if status in ("RESOLVED", "CLOSED") else None
    lacks_evidence_on_closure = status in ("RESOLVED", "CLOSED") and rng.random() < cemr_rate

    case = dict(
        case_id=case_id, alert_id=alert_id, case_type=case_type,
        opened_at=iso(opened_at),
        closed_at=iso(closed_at) if status in ("RESOLVED", "CLOSED") else None,
        status=status,
        disposition=disposition,
        resolution_claim=rng.choice(RESOLUTION_CLAIMS) if status in ("RESOLVED", "CLOSED") else None,
        remediation_claim=remediation_claim,
        assigned_analyst_id=rng.choice(ANALYSTS),
        closure_reason=rng.choice(["Investigation complete", "Confirmed false positive",
                                    "Risk accepted by asset owner", "Duplicate of existing case"])
                        if status in ("RESOLVED", "CLOSED") else None,
    )
    case["_meta"] = dict(severity=severity, asset_id=asset["asset_id"], criticality=asset["criticality"],
                          ics_quality=ics_quality, is_superficial=is_superficial,
                          esc_compliance=esc_compliance, lacks_evidence_on_closure=lacks_evidence_on_closure,
                          remediation_claim=remediation_claim, opened_at=opened_at, closed_at=closed_at,
                          status=status)
    return case

def gen_investigation_actions(rng, cse_id, case):
    m = case["_meta"]
    actions = []
    n_req = 8
    if m["is_superficial"]:
        n_done = rng.randint(1, 3)
    else:
        n_done = max(3, int(round(n_req * min(1.0, rng.gauss(m["ics_quality"], 0.12)))))
        n_done = min(n_req, max(1, n_done))
    chosen = rng.sample(ACTION_TYPES, k=min(n_done, len(ACTION_TYPES)))
    t = m["opened_at"]
    span = max((m["closed_at"] - m["opened_at"]).total_seconds(), 60)
    for idx, act in enumerate(chosen, start=1):
        t = m["opened_at"] + timedelta(seconds=span * (idx / (len(chosen) + 1)))
        aid = f"{case['case_id']}-INV-{idx:02d}"
        actions.append(dict(
            investigation_action_id=aid, case_id=case["case_id"], action_type=act,
            action_timestamp=iso(t),
            evidence_reference=f"EVREF-{case['case_id']}-{idx:02d}" if rng.random() < 0.8 else None,
            finding_recorded=act in ("Finding Documented",) or rng.random() < 0.4,
            disposition_recorded=act == "Disposition Documented" or rng.random() < 0.3,
            escalation_decision_recorded=act == "Escalation Decision Documented" or rng.random() < 0.25,
            remediation_recorded=(act == "Remediation Recorded") if m["remediation_claim"] else False,
            actor_id=rng.choice(ANALYSTS),
        ))
    return actions

def gen_escalation(rng, cse_id, case, esc_seq):
    m = case["_meta"]
    required = esc_required_for(m["severity"], case["case_type"])
    if not required and rng.random() > 0.08:
        return None  # most non-qualifying cases carry no escalation record
    escalated = required and (rng.random() < m["esc_compliance"])
    if not required:
        escalated = rng.random() < 0.5
    esc_id = f"{case['case_id']}-ESC-{esc_seq:02d}"
    escalated_at = None
    if escalated:
        escalated_at = iso(m["opened_at"] + timedelta(hours=rng.uniform(0.5, 12)))
    return dict(
        escalation_id=esc_id, case_id=case["case_id"], escalation_required=required,
        escalated_flag=escalated, escalated_at=escalated_at,
        escalation_level=rng.choice(ESCALATION_LEVELS) if escalated else None,
        escalation_reason=rng.choice(ESCALATION_REASONS) if required else None,
        escalation_rule_id=f"RULE-ESC-{rng.randint(1,6):02d}" if required else None,
    )

def gen_remediation(rng, cse_id, case, rem_seq, persona, injected_recurrence_assets):
    m = case["_meta"]
    if not m["remediation_claim"]:
        return None
    rem_id = f"{case['case_id']}-REM-{rem_seq:02d}"
    ts = m["closed_at"] + timedelta(hours=rng.uniform(0.1, 6))
    recorded = rng.random() > 0.05
    return dict(
        remediation_id=rem_id, case_id=case["case_id"], asset_id=m["asset_id"],
        remediation_recorded=recorded,
        remediation_type=rng.choice(REMEDIATION_TYPES),
        remediation_action=f"{rng.choice(REMEDIATION_TYPES)} on {m['asset_id']}",
        remediation_timestamp=iso(ts) if recorded else None,
        remediation_status="COMPLETED" if recorded else rng.choice(["PLANNED", "IN_PROGRESS"]),
        remediation_reference=f"CHG-{rng.randint(10000,99999)}" if recorded and rng.random() < 0.8 else None,
    )

def gen_evidence(rng, cse_id, case_or_alert, kind, persona, ev_seq_start, camg_gap_assets):
    """kind: 'case' evidence tied to case/alert/asset."""
    m = case_or_alert["_meta"]
    items = []
    if m["asset_id"] in camg_gap_assets:
        density = 0.0  # deliberate negative space: no evidence at all
    else:
        base_n = 1 if m.get("lacks_evidence_on_closure") and m["status"] in ("RESOLVED", "CLOSED") else \
                 rng.choice([1, 2, 2, 3, 3, 4])
        density = max(0, round(base_n * persona["evidence_density"]))
    seq = ev_seq_start
    for _ in range(int(density)):
        ev_id = f"{case_or_alert['case_id']}-EV-{seq:02d}"
        seq += 1
        items.append(dict(
            evidence_id=ev_id, case_id=case_or_alert["case_id"], alert_id=case_or_alert["alert_id"],
            asset_id=m["asset_id"], evidence_type=rng.choice(EVIDENCE_TYPES),
            source_system=rng.choice(SOURCE_SYSTEMS),
            event_timestamp=iso(m["opened_at"] + timedelta(minutes=rng.randint(0, 600))),
            reference_id=f"REF-{rng.randint(100000,999999)}",
            availability_status=weighted_choice(rng, AVAILABILITY),
            integrity_reference=f"SHA256:{rng.getrandbits(64):016x}" if rng.random() < 0.7 else None,
        ))
    return items, seq

def gen_asset_only_evidence(rng, cse_id, assets, camg_gap_assets, period_label, p_start, p_end, persona, n_items):
    """Evidence not tied to a case/alert - baseline monitoring telemetry used for OSEC/CAMG."""
    items = []
    eligible = [a for a in assets if a["monitoring_expected"] and a["asset_id"] not in camg_gap_assets]
    for i in range(1, n_items + 1):
        if not eligible:
            break
        asset = rng.choice(eligible)
        items.append(dict(
            evidence_id=f"{cse_id}-EV-BASE-{period_label}-{i:05d}", case_id=None, alert_id=None,
            asset_id=asset["asset_id"], evidence_type="Log Extract Reference",
            source_system=rng.choice(SOURCE_SYSTEMS),
            event_timestamp=iso(rand_dt_between(rng, p_start, p_end)),
            reference_id=f"REF-{rng.randint(100000,999999)}",
            availability_status=weighted_choice(rng, AVAILABILITY),
            integrity_reference=None,
        ))
    return items

def gen_reported_kpis(rng, cse_id, persona, period_label, p_start, p_end, actual_metrics):
    kpis = []
    kecg_bias = persona.get("quarter_overrides", {}).get(period_label, {}).get("kecg_bias", persona["kecg_bias"])
    for idx, (kpi_id, name) in enumerate(KPI_DEFS, start=1):
        actual = actual_metrics.get(kpi_id, rng.uniform(60, 95))
        # Reported value is nudged more favourably than the actual observed value,
        # scaled by the CSE's kecg_bias (governance-consistency) persona knob.
        if kpi_id in ("KPI-CAMG", "KPI-PRR"):  # lower-is-better metrics
            reported = max(0.0, actual - actual * kecg_bias * rng.uniform(0.5, 1.5))
        else:  # higher-is-better metrics
            reported = min(100.0, actual + (100 - actual) * kecg_bias * rng.uniform(0.5, 1.5))
        num = round(rng.uniform(200, 900))
        den = round(num / max(reported, 1) * 100)
        kpis.append(dict(
            kpi_id=f"{cse_id}-{kpi_id}-{period_label}", cse_id=cse_id, kpi_name=name,
            reporting_period_start=iso(p_start), reporting_period_end=iso(p_end),
            reported_value=round(reported, 2), reported_numerator=num, reported_denominator=den,
            definition_version="1.0", population_definition="All in-scope assets/cases for period",
            severity_scope="ALL" if kpi_id not in ("KPI-ER",) else "HIGH_CRITICAL",
            source_reference=f"CSE-INTERNAL-REPORT-{period_label}-{idx:02d}",
        ))
    return kpis

def compute_actual_metrics(assets, alerts, cases, escalations, remediations, evidence, camg_gap_assets):
    """Lightweight recomputation of approximate 'actual' values purely to give
    reported_kpis something plausible (and biasable) to diverge from. This is
    NOT the reference implementation the backend should use - it is only
    dataset-generation scaffolding."""
    monitored = [a for a in assets if a["monitoring_expected"]]
    ev_assets = {e["asset_id"] for e in evidence}
    osec = 100.0 * len([a for a in monitored if a["asset_id"] in ev_assets]) / max(1, len(monitored))
    crit = [a for a in monitored if a["criticality"] == "CRITICAL"]
    camg = 100.0 * len([a for a in crit if a["asset_id"] not in ev_assets]) / max(1, len(crit))
    closed = [c for c in cases if c["_meta"]["status"] in ("RESOLVED", "CLOSED")]
    ics_vals = []
    er_req = [e for e in escalations if e and e["escalation_required"]]
    er_met = [e for e in er_req if e["escalated_flag"]]
    er = 100.0 * len(er_met) / max(1, len(er_req))
    rem_recorded = [r for r in remediations if r and r["remediation_recorded"]]
    prr = 100.0 * len([1 for r in rem_recorded if random.random() < 0.08]) / max(1, len(rem_recorded))
    cemr = 100.0 * len([c for c in closed if c["_meta"].get("lacks_evidence_on_closure")]) / max(1, len(closed))
    br = 100.0 * len([c for c in cases if c["_meta"]["status"] not in ("RESOLVED", "CLOSED")]) / max(1, len(cases))
    return {
        "KPI-OSEC": osec, "KPI-CAMG": camg, "KPI-TTCP": 70.0, "KPI-ICS": 75.0,
        "KPI-ER": er, "KPI-PRR": prr, "KPI-CEMR": 100.0 - cemr, "KPI-BR": 100.0 - br,
    }

# ---------------------------------------------------------------------------
# Orchestration
# ---------------------------------------------------------------------------

def strip_meta(d):
    d = dict(d)
    d.pop("_meta", None)
    return d

def build_submission(cse_id, persona, period_label, p_start, p_end, master_rng, ground_truth):
    rng = random.Random(master_rng.randint(0, 2**32 - 1))
    n_assets = int(60 * persona["scale"])
    assets = gen_assets(rng, cse_id, persona, n_assets)

    camg_gap_assets = set()
    if persona["camg_gap"] > 0:
        crit_assets = [a for a in assets if a["criticality"] == "CRITICAL" and a["monitoring_expected"]]
        n_gap = max(0, round(len(crit_assets) * persona["camg_gap"]))
        camg_gap_assets = {a["asset_id"] for a in rng.sample(crit_assets, k=min(n_gap, len(crit_assets)))}

    n_alerts = int(rng.randint(220, 340) * persona["scale"])
    alerts, cases = gen_alerts_cases(rng, cse_id, persona, period_label, p_start, p_end, assets, n_alerts)

    # Force the CSE-ALPHA / Q3-2026 anchor demo case to exist with the exact
    # ID referenced by the frontend prototype (CASE-1042).
    if cse_id == "CSE-ALPHA" and period_label == "Q3-2026":
        target_asset = next((a for a in assets if a["criticality"] == "CRITICAL"), assets[0])
        anchor_alert_id = "CSE-ALPHA-ALT-Q3-2026-00001"
        anchor_created = p_start + timedelta(days=14, hours=9, minutes=15)
        for al in alerts:
            if al["asset_id"] == target_asset["asset_id"] and al["alert_type"] == "Malware":
                anchor_alert_id = al["alert_id"]
                anchor_created = datetime.strptime(al["created_at"], "%Y-%m-%dT%H:%M:%SZ").replace(tzinfo=timezone.utc)
                al["case_id"] = "CASE-1042"
                al["status"] = "CLOSED"
                al["severity"] = "HIGH"
                al["priority"] = 2
                al["false_positive_flag"] = False
                break
        else:
            alerts[0]["case_id"] = "CASE-1042"
            alerts[0]["asset_id"] = target_asset["asset_id"]
            alerts[0]["alert_type"] = "Malware"
            alerts[0]["severity"] = "HIGH"
            alerts[0]["priority"] = 2
            alerts[0]["status"] = "CLOSED"
            alerts[0]["false_positive_flag"] = False
            anchor_alert_id = alerts[0]["alert_id"]
            anchor_created = datetime.strptime(alerts[0]["created_at"], "%Y-%m-%dT%H:%M:%SZ").replace(tzinfo=timezone.utc)
        anchor_case = build_case(rng, cse_id, "CASE-1042", anchor_alert_id, "Malware", "HIGH",
                                  anchor_created, p_end, ics_quality=0.20, fast_closure_bias=1.0,
                                  esc_compliance=persona["escalation_compliance"], cemr_rate=0.8,
                                  asset=target_asset)
        anchor_case["closed_at"] = iso(anchor_case["_meta"]["opened_at"] + timedelta(minutes=42))
        anchor_case["_meta"]["closed_at"] = anchor_case["_meta"]["opened_at"] + timedelta(minutes=42)
        anchor_case["status"] = "CLOSED"
        anchor_case["_meta"]["status"] = "CLOSED"
        anchor_case["disposition"] = "TRUE_POSITIVE_REMEDIATED"
        anchor_case["remediation_claim"] = True
        anchor_case["_meta"]["remediation_claim"] = True
        anchor_case["resolution_claim"] = "Remediated"
        anchor_case["closure_reason"] = "Investigation complete"
        cases = [c for c in cases if c["case_id"] != "CASE-1042"]
        cases.append(anchor_case)
        ground_truth["anchor_case"] = {
            "case_id": "CASE-1042", "cse_id": cse_id, "asset_id": target_asset["asset_id"],
            "signal": "Potential superficial investigation",
            "expected_metrics": "Low ICS (<=~30) + very low TTCP percentile (fast closure) "
                                 "+ elevated CEMR contribution",
            "note": "Matches the frontend clickable-prototype demo narrative.",
        }

    investigation_actions, escalations, remediations, evidence = [], [], [], []
    esc_seq = 1
    for case in cases:
        investigation_actions.extend(gen_investigation_actions(rng, cse_id, case))
        esc = gen_escalation(rng, cse_id, case, esc_seq)
        esc_seq += 1
        if esc:
            escalations.append(esc)
        rem = gen_remediation(rng, cse_id, case, esc_seq, persona, camg_gap_assets)
        if rem:
            remediations.append(rem)
        ev_items, _ = gen_evidence(rng, cse_id, case, "case", persona, 1, camg_gap_assets)
        evidence.extend(ev_items)

    evidence.extend(gen_asset_only_evidence(rng, cse_id, assets, camg_gap_assets, period_label,
                                             p_start, p_end, persona, n_items=int(150 * persona["scale"])))

    actual_metrics = compute_actual_metrics(assets, alerts, cases, escalations, remediations, evidence, camg_gap_assets)
    reported_kpis = gen_reported_kpis(rng, cse_id, persona, period_label, p_start, p_end, actual_metrics)

    if camg_gap_assets:
        ground_truth.setdefault("camg_negative_space", []).append({
            "cse_id": cse_id, "period": period_label,
            "asset_ids": sorted(camg_gap_assets),
            "signal": "Critical-asset monitoring gap (negative space)",
        })

    clean_cases = [strip_meta(c) for c in cases]
    submission_id = f"SUB-{cse_id}-{period_label}"
    record_counts = dict(assets=len(assets), alerts=len(alerts), cases=len(clean_cases),
                          investigation_actions=len(investigation_actions), escalations=len(escalations),
                          remediations=len(remediations), evidence=len(evidence), reported_kpis=len(reported_kpis))
    submission = {
        "submission_metadata": {
            "submission_id": submission_id, "schema_version": SCHEMA_VERSION, "cse_id": cse_id,
            "assessment_period_start": iso(p_start), "assessment_period_end": iso(p_end),
            "submission_timestamp": iso(p_end + timedelta(days=1, hours=10)),
            "source_format": "JSON", "record_counts": record_counts,
            "data_completeness": {"assets": "COMPLETE", "alerts": "COMPLETE", "cases": "COMPLETE",
                                   "investigation_actions": "PARTIAL" if persona["ics_quality"] < 0.6 else "COMPLETE",
                                   "evidence": "PARTIAL" if camg_gap_assets else "COMPLETE"},
        },
        "cse": {"cse_id": cse_id, "cse_name": persona["name"], "sector": persona["sector"],
                "operational_unit": persona["unit"]},
        "assets": assets, "alerts": alerts, "cases": clean_cases,
        "investigation_actions": investigation_actions, "escalations": escalations,
        "remediations": remediations, "evidence": evidence, "reported_kpis": reported_kpis,
    }
    return submission

def write_json(submission, cse_id, period_label):
    path = os.path.join(OUT_ROOT, "json")
    os.makedirs(path, exist_ok=True)
    with open(os.path.join(path, f"{cse_id}_{period_label}.json"), "w") as f:
        json.dump(submission, f, indent=2)

def write_csv(submission, cse_id, period_label):
    base = os.path.join(OUT_ROOT, "csv", f"{cse_id}_{period_label}")
    os.makedirs(base, exist_ok=True)

    def dump(name, rows):
        if not rows:
            rows = []
        fieldnames = sorted({k for r in rows for k in r.keys()}) if rows else []
        with open(os.path.join(base, f"{name}.csv"), "w", newline="") as f:
            w = csv.DictWriter(f, fieldnames=fieldnames)
            w.writeheader()
            for r in rows:
                w.writerow(r)

    meta = submission["submission_metadata"]
    dump("submission_metadata", [{
        **{k: v for k, v in meta.items() if k not in ("record_counts", "data_completeness")},
        **{f"count_{k}": v for k, v in meta["record_counts"].items()},
    }])
    dump("cse", [submission["cse"]])
    dump("assets", submission["assets"])
    dump("alerts", submission["alerts"])
    dump("cases", submission["cases"])
    dump("investigation_actions", submission["investigation_actions"])
    dump("escalations", submission["escalations"])
    dump("remediations", submission["remediations"])
    dump("evidence", submission["evidence"])
    dump("reported_kpis", submission["reported_kpis"])

def main():
    if os.path.exists(OUT_ROOT):
        shutil.rmtree(OUT_ROOT)
    os.makedirs(OUT_ROOT, exist_ok=True)
    master_rng = random.Random(20260928)
    ground_truth = {"personas": {}, "camg_negative_space": []}
    totals = {}

    for cse_id, persona in PERSONAS.items():
        ground_truth["personas"][cse_id] = {
            "name": persona["name"], "sector": persona["sector"], "story": persona["story"],
        }
        for period_label, p_start, p_end in PERIODS:
            submission = build_submission(cse_id, persona, period_label, p_start, p_end, master_rng, ground_truth)
            write_json(submission, cse_id, period_label)
            write_csv(submission, cse_id, period_label)
            for k, v in submission["submission_metadata"]["record_counts"].items():
                totals[k] = totals.get(k, 0) + v
            print(f"{cse_id} {period_label}: {submission['submission_metadata']['record_counts']}")

    with open(os.path.join(OUT_ROOT, "ground_truth_signals.json"), "w") as f:
        json.dump(ground_truth, f, indent=2)

    totals["submissions"] = len(PERSONAS) * len(PERIODS)
    print("\nTOTALS:", json.dumps(totals, indent=2))
    return totals, ground_truth

if __name__ == "__main__":
    main()
