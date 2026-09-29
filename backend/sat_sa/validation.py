
from __future__ import annotations
from datetime import datetime, timezone
from typing import Any

ENTITY_ID = {
    "assets":"asset_id","alerts":"alert_id","cases":"case_id",
    "investigation_actions":"investigation_action_id","escalations":"escalation_id",
    "remediations":"remediation_id","evidence":"evidence_id","reported_kpis":"kpi_id"
}
REQUIRED = {
    "submission_metadata":["submission_id","schema_version","cse_id","assessment_period_start",
                           "assessment_period_end","submission_timestamp","source_format"],
    "cse":["cse_id"],
    "assets":["asset_id","criticality","monitoring_expected"],
    "alerts":["alert_id","alert_type","severity","created_at","status"],
    "cases":["case_id","case_type","opened_at","status"],
    "investigation_actions":["investigation_action_id","case_id","action_type"],
    "escalations":["escalation_id","case_id","escalation_required","escalated_flag"],
    "remediations":["remediation_id","case_id","remediation_recorded"],
    "evidence":["evidence_id","evidence_type","event_timestamp"],
    "reported_kpis":["kpi_id","cse_id","kpi_name","reporting_period_start",
                     "reporting_period_end","reported_value"]
}
DATE_FIELDS = {
    "submission_metadata":["assessment_period_start","assessment_period_end","submission_timestamp"],
    "alerts":["created_at"], "cases":["opened_at","closed_at"],
    "investigation_actions":["action_timestamp"], "escalations":["escalated_at"],
    "remediations":["remediation_timestamp"], "evidence":["event_timestamp"],
    "reported_kpis":["reporting_period_start","reporting_period_end"]
}
ENUMS = {
    "source_format":{"CSV","JSON","DB_EXPORT","API"},
    "criticality":{"CRITICAL","HIGH","MEDIUM","LOW"},
    "status":{"ACTIVE","MAINTENANCE","RETIRED"},
    "severity":{"INFORMATIONAL","LOW","MEDIUM","HIGH","CRITICAL"},
    "case_status":{"OPEN","INVESTIGATING","RESOLVED","CLOSED"},
    "availability_status":{"AVAILABLE","UNAVAILABLE","REDACTED"}
}
RELATION_FIELDS = [
    ("alerts","asset_id","assets","asset_id"),
    ("alerts","case_id","cases","case_id"),
    ("cases","alert_id","alerts","alert_id"),
    ("investigation_actions","case_id","cases","case_id"),
    ("escalations","case_id","cases","case_id"),
    ("remediations","case_id","cases","case_id"),
    ("remediations","asset_id","assets","asset_id"),
    ("evidence","case_id","cases","case_id"),
    ("evidence","alert_id","alerts","alert_id"),
    ("evidence","asset_id","assets","asset_id"),
    ("reported_kpis","cse_id","cse","cse_id"),
]

def parse_ts(v: Any) -> datetime | None:
    if not isinstance(v,str) or not v.strip(): return None
    try:
        x=datetime.fromisoformat(v.replace("Z","+00:00"))
        if x.tzinfo is None: x=x.replace(tzinfo=timezone.utc)
        return x
    except ValueError:
        return None

def validate_submission(s: dict[str,Any], source_format: str | None=None) -> dict[str,Any]:
    errors=[]; warnings=[]
    meta=s.get("submission_metadata")
    if not isinstance(meta,dict):
        return {"valid":False,"errors":["submission_metadata is required"],"warnings":[],"record_counts":{}}
    sf=source_format or meta.get("source_format")
    if sf: meta["source_format"]=sf
    for k in REQUIRED["submission_metadata"]:
        if not meta.get(k): errors.append(f"submission_metadata.{k} is required")
    start=parse_ts(meta.get("assessment_period_start")); end=parse_ts(meta.get("assessment_period_end"))
    sub_ts=parse_ts(meta.get("submission_timestamp"))
    if meta.get("assessment_period_start") and not start: errors.append("Invalid assessment_period_start timestamp")
    if meta.get("assessment_period_end") and not end: errors.append("Invalid assessment_period_end timestamp")
    if meta.get("submission_timestamp") and not sub_ts: errors.append("Invalid submission_timestamp timestamp")
    if start and end and start>=end: errors.append("assessment_period_start must precede assessment_period_end")
    if sf not in ENUMS["source_format"]: errors.append(f"Invalid source_format: {sf}")

    for entity, reqs in REQUIRED.items():
        if entity in ("submission_metadata","cse"): continue
        rows=s.get(entity)
        if not isinstance(rows,list): errors.append(f"{entity} must be an array"); continue
        seen=set()
        for i,row in enumerate(rows):
            if not isinstance(row,dict): errors.append(f"{entity}[{i}] must be an object"); continue
            for f in reqs:
                if f not in row or row[f] in (None,""): errors.append(f"{entity}[{i}].{f} is required")
            rid=row.get(ENTITY_ID.get(entity,""))
            if rid in seen: errors.append(f"Duplicate {entity} identifier: {rid}")
            if rid: seen.add(rid)
            for f in DATE_FIELDS.get(entity,[]):
                if row.get(f) is not None and parse_ts(row[f]) is None:
                    errors.append(f"Invalid timestamp: {entity}[{i}].{f}")
        # duplicate IDs across a submission are a hard data-quality error
    if not isinstance(s.get("cse"),dict): errors.append("cse is required")
    else:
        if not s["cse"].get("cse_id"): errors.append("cse.cse_id is required")
        if meta.get("cse_id") and s["cse"].get("cse_id") != meta["cse_id"]:
            errors.append("cse.cse_id does not match submission_metadata.cse_id")

    ids={e:{r.get(ENTITY_ID[e]) for r in s.get(e,[]) if r.get(ENTITY_ID[e])} for e in ENTITY_ID}
    ids["cse"]={s.get("cse",{}).get("cse_id")} if s.get("cse") else set()
    for child,field,parent,pfield in RELATION_FIELDS:
        for row in s.get(child,[]):
            val=row.get(field)
            if val is not None and val not in ids.get(parent,set()):
                errors.append(f"Broken reference: {child}.{field}={val} not found in {parent}")
    # Alert/case consistency.
    alerts={r.get("alert_id"):r for r in s.get("alerts",[])}
    cases={r.get("case_id"):r for r in s.get("cases",[])}
    for a in s.get("alerts",[]):
        cid=a.get("case_id")
        if cid and cid in cases and cases[cid].get("alert_id") not in (None,a.get("alert_id")):
            errors.append(f"Inconsistent alert/case relationship: {a.get('alert_id')} -> {cid}")
    for c in s.get("cases",[]):
        if c.get("status") in ("CLOSED","RESOLVED") and not c.get("closed_at"):
            warnings.append(f"Closed case {c.get('case_id')} is missing closed_at")
        if c.get("closed_at") and c.get("opened_at") and parse_ts(c["closed_at"]) < parse_ts(c["opened_at"]):
            errors.append(f"Case {c.get('case_id')} has closed_at before opened_at")
        if c.get("remediation_claim") and not any(r.get("case_id")==c.get("case_id") for r in s.get("remediations",[])):
            warnings.append(f"Case {c.get('case_id')} claims remediation but has no remediation record")
    case_ids=set(cases)
    for c in case_ids:
        if not any(a.get("case_id")==c for a in s.get("investigation_actions",[])):
            warnings.append(f"Missing investigation records for case {c}")
    # Evidence coverage limitations are warnings, not performance failures.
    monitored=[a for a in s.get("assets",[]) if a.get("monitoring_expected")]
    if monitored:
        ev_assets={e.get("asset_id") for e in s.get("evidence",[]) if e.get("asset_id")}
        missing=sum(1 for a in monitored if a.get("asset_id") not in ev_assets)
        if missing:
            warnings.append(f"Evidence coverage limitation: {missing}/{len(monitored)} monitored assets have no submitted evidence")
    # KPI alignment warnings.
    for k in s.get("reported_kpis",[]):
        if k.get("definition_version") is None or k.get("population_definition") is None:
            warnings.append(f"KPI definition/population metadata incomplete for {k.get('kpi_id')}")
        if k.get("reported_denominator") is not None and k.get("reported_denominator")==0:
            warnings.append(f"KPI {k.get('kpi_id')} has zero denominator")
    if meta.get("assessment_period_start") and meta.get("assessment_period_end"):
        if meta["assessment_period_start"] >= meta["assessment_period_end"]:
            warnings.append("Assessment period is not chronologically ordered")
    counts={e:len(s.get(e,[])) for e in ["assets","alerts","cases","investigation_actions","escalations","remediations","evidence","reported_kpis"]}
    return {"valid":not errors,"errors":errors,"warnings":warnings,"record_counts":counts}
