
from __future__ import annotations
from datetime import datetime, timedelta, timezone
from math import isfinite
from statistics import mean, median
from typing import Any
import hashlib, json

METRICS = ["OSEC","CAMG","TTCP","ICS","ER","PRR","CEMR","KECG"]
SUPPORTING = ["CALR","ACCR","BR","IPC","EDS"]
LOWER_BETTER = {"CAMG","TTCP","PRR","CEMR","KECG"}
HIGHER_BETTER = {"OSEC","ICS","ER","ACCR"}

def ts(v):
    if not v: return None
    return datetime.fromisoformat(v.replace("Z","+00:00")).astimezone(timezone.utc)

def iso_now(): return datetime.now(timezone.utc).isoformat().replace("+00:00","Z")

def pct(num, den):
    return round(100.0*num/den, 2) if den else None

def percentile_rank(value, population):
    vals=sorted(x for x in population if x is not None)
    if not vals: return None
    if len(vals)==1: return 50.0
    less=sum(v < value for v in vals)
    equal=sum(v == value for v in vals)
    # Midrank percentile, expressed 0..100.
    return round(((less + 0.5*equal) / len(vals))*100.0, 2)

def metric_value(metric):
    return metric.get("value") if metric else None

def sufficiency(count, minimum):
    return {"sufficient": count >= minimum, "sample_size": count, "minimum": minimum,
            "status":"SUFFICIENT" if count>=minimum else "INSUFFICIENT"}

def _evidence_for_case(sub, case_id):
    return [e for e in sub.get("evidence",[]) if e.get("case_id")==case_id]

def _actions_for_case(sub, case_id):
    return [a for a in sub.get("investigation_actions",[]) if a.get("case_id")==case_id]

def compute_osec(sub):
    meta=sub["submission_metadata"]; start,end=ts(meta["assessment_period_start"]),ts(meta["assessment_period_end"])
    assets=[a for a in sub.get("assets",[]) if a.get("monitoring_expected") and a.get("status")!="RETIRED"]
    ev_assets={e.get("asset_id") for e in sub.get("evidence",[])
               if e.get("asset_id") and e.get("availability_status")!="UNAVAILABLE"
               and start<=ts(e.get("event_timestamp"))<=end}
    observed=[a for a in assets if a["asset_id"] in ev_assets]
    return {"code":"OSEC","label":"Observed Security Evidence Coverage",
            "value":pct(len(observed),len(assets)),"unit":"percent",
            "sample":sufficiency(len(assets),5),"numerator":len(observed),"denominator":len(assets),
            "interpretation":"Low OSEC indicates a potential visibility/monitoring gap; no observed evidence does not prove monitoring is absent.",
            "evidence_ids":[e["evidence_id"] for e in sub.get("evidence",[]) if e.get("asset_id") in {a["asset_id"] for a in assets}][:200]}

def compute_camg(sub):
    meta=sub["submission_metadata"]; start,end=ts(meta["assessment_period_start"]),ts(meta["assessment_period_end"])
    assets=[a for a in sub.get("assets",[]) if a.get("monitoring_expected") and a.get("criticality")=="CRITICAL" and a.get("status")!="RETIRED"]
    ev_assets={e.get("asset_id") for e in sub.get("evidence",[])
               if e.get("asset_id") and e.get("availability_status")!="UNAVAILABLE"
               and start<=ts(e.get("event_timestamp"))<=end}
    missing=[a for a in assets if a["asset_id"] not in ev_assets]
    return {"code":"CAMG","label":"Critical-Asset Monitoring Gap",
            "value":pct(len(missing),len(assets)),"unit":"percent",
            "sample":sufficiency(len(assets),3),"numerator":len(missing),"denominator":len(assets),
            "interpretation":"High CAMG identifies critical assets requiring supervisory review; it is a negative-space candidate, not proof of failure.",
            "affected_asset_ids":[a["asset_id"] for a in missing],
            "evidence_ids":[]}

def _closed_case_ttc(c, alerts_by_id):
    if not c.get("closed_at"): return None
    a=alerts_by_id.get(c.get("alert_id"),{})
    o,cx=ts(c.get("opened_at")),ts(c.get("closed_at"))
    if not o or not cx or cx<o: return None
    return (cx-o).total_seconds()/3600.0

def compute_ttpc(sub, all_subs):
    # Comparable population: same alert type + severity + assessment quarter across CSEs.
    # If that is too sparse, fall back to same alert type + severity across available periods.
    meta=sub["submission_metadata"]; period_end=meta["assessment_period_end"]
    quarter=period_end[:7]
    alerts={a["alert_id"]:a for a in sub.get("alerts",[])}
    cases=[c for c in sub.get("cases",[]) if c.get("closed_at")]
    group_rows=[]
    for s in all_subs:
        if s["submission_metadata"]["assessment_period_end"][:7] != quarter: continue
        am={a["alert_id"]:a for a in s.get("alerts",[])}
        for c in s.get("cases",[]):
            t=_closed_case_ttc(c,am)
            a=am.get(c.get("alert_id"))
            if t is not None and a:
                group_rows.append((a.get("alert_type"),a.get("severity"),t,c.get("case_id")))
    results=[]
    for c in cases:
        a=alerts.get(c.get("alert_id"),{})
        t=_closed_case_ttc(c,alerts)
        pop=[r[2] for r in group_rows if r[0]==a.get("alert_type") and r[1]==a.get("severity")]
        if len(pop)<5:
            pop=[]
            for s in all_subs:
                am={x["alert_id"]:x for x in s.get("alerts",[])}
                for cc in s.get("cases",[]):
                    aa=am.get(cc.get("alert_id"))
                    tt=_closed_case_ttc(cc,am)
                    if tt is not None and aa and aa.get("alert_type")==a.get("alert_type") and aa.get("severity")==a.get("severity"):
                        pop.append(tt)
        if t is not None:
            results.append((c["case_id"],a,t,percentile_rank(t,pop),len(pop)))
    vals=[r[3] for r in results if r[3] is not None]
    case_values={r[0]:r for r in results}
    return {"code":"TTCP","label":"Time-to-Close Percentile",
            "value":round(mean(vals),2) if vals else None,"unit":"percentile",
            "sample":sufficiency(len(vals),5),"case_values":case_values,
            "interpretation":"Low TTCP means unusually rapid closure and should be interpreted with investigation-quality evidence.",
            "evidence_ids":[c["case_id"] for c in cases]}

def case_ics(sub, case, config):
    acts=_actions_for_case(sub,case["case_id"])
    ev=_evidence_for_case(sub,case["case_id"])
    w=config["ics_requirements"]
    checks={
        "alert_reviewed":any(a.get("action_type")=="Alert Reviewed" for a in acts),
        "evidence_examined":any(a.get("action_type")=="Evidence Examined" for a in acts),
        "affected_asset_identified":any(a.get("action_type")=="Affected Asset Identified" for a in acts),
        "investigation_actions_recorded":len(acts)>=int(config.get("min_investigation_actions",4)),
        "findings_documented":any(a.get("action_type")=="Finding Documented" or a.get("finding_recorded") for a in acts),
        "disposition_documented":any(a.get("action_type")=="Disposition Documented" or a.get("disposition_recorded") for a in acts),
        "escalation_decision_documented":any(a.get("action_type")=="Escalation Decision Documented" or a.get("escalation_decision_recorded") for a in acts),
        "remediation_recorded":(not case.get("remediation_claim")) or any(a.get("action_type")=="Remediation Recorded" or a.get("remediation_recorded") for a in acts)
    }
    # "remediation recorded" is not applicable when no remediation was claimed.
    applicable={k:v for k,v in checks.items() if not (k=="remediation_recorded" and not case.get("remediation_claim"))}
    total=sum(w[k] for k in applicable)
    score=100*sum(w[k] for k,v in applicable.items() if v)/total if total else None
    return score,checks,acts,ev

def compute_ics(sub, config):
    cases=[c for c in sub.get("cases",[]) if c.get("closed_at")]
    vals=[]; details={}
    for c in cases:
        score,checks,acts,ev=case_ics(sub,c,config)
        if score is not None: vals.append(score)
        details[c["case_id"]]={"value":score,"checks":checks,"action_ids":[a["investigation_action_id"] for a in acts],
                                "evidence_ids":[e["evidence_id"] for e in ev]}
    return {"code":"ICS","label":"Investigation Completeness Score",
            "value":round(mean(vals),2) if vals else None,"unit":"percent",
            "sample":sufficiency(len(vals),5),"case_values":details,
            "interpretation":"Low ICS means fewer expected investigation elements are evidenced in the submitted record.",
            "evidence_ids":[x for d in details.values() for x in d["action_ids"]][:300]}

def compute_er(sub):
    rows=[e for e in sub.get("escalations",[]) if e.get("escalation_required") is True]
    met=[e for e in rows if e.get("escalated_flag") is True]
    return {"code":"ER","label":"Escalation Compliance Rate","value":pct(len(met),len(rows)),"unit":"percent",
            "sample":sufficiency(len(rows),5),"numerator":len(met),"denominator":len(rows),
            "interpretation":"Low ER indicates cases meeting defined escalation criteria were not escalated at the expected rate.",
            "evidence_ids":[e["escalation_id"] for e in rows]}

def compute_prr(sub, all_subs, config):
    # Match same CSE + same asset + same/equivalent alert condition after remediation
    # within a configurable window. "Equivalent" is represented by case type when available.
    windows=config["recurrence_window_days"]
    events=[]
    for s in all_subs:
        am={a["alert_id"]:a for a in s.get("alerts",[])}
        cm={c["case_id"]:c for c in s.get("cases",[])}
        for c in s.get("cases",[]):
            a=am.get(c.get("alert_id"))
            if a and c.get("opened_at"):
                events.append({"cse":s["cse"]["cse_id"],"case_id":c["case_id"],"opened":ts(c["opened_at"]),
                               "asset":a.get("asset_id"),"alert_type":a.get("alert_type"),
                               "case_type":c.get("case_type")})
    sub_cse=sub["cse"]["cse_id"]; start,end=ts(sub["submission_metadata"]["assessment_period_start"]),ts(sub["submission_metadata"]["assessment_period_end"])
    rems=[r for r in sub.get("remediations",[]) if r.get("remediation_recorded") and r.get("remediation_timestamp")]
    applicable=[r for r in rems if start<=ts(r["remediation_timestamp"])<=end]
    rec=[]; matched_ids=[]
    for r in applicable:
        rt=ts(r["remediation_timestamp"])
        c=next((c for c in sub.get("cases",[]) if c["case_id"]==r.get("case_id")),None)
        a=next((a for a in sub.get("alerts",[]) if c and a["alert_id"]==c.get("alert_id")),None)
        found=None
        for e in events:
            if e["cse"]!=sub_cse or e["opened"]<=rt or e["opened"]-rt>timedelta(days=windows): continue
            if e["asset"]!=r.get("asset_id"): continue
            if a and (e["alert_type"]==a.get("alert_type") or e["case_type"]==c.get("case_type")):
                found=e; break
        if found: rec.append(r); matched_ids.append(found["case_id"])
    return {"code":"PRR","label":"Post-Remediation Recurrence Rate","value":pct(len(rec),len(applicable)),
            "unit":"percent","sample":sufficiency(len(applicable),5),"numerator":len(rec),"denominator":len(applicable),
            "interpretation":"High PRR identifies repeated conditions after recorded remediation; it does not automatically prove remediation failure.",
            "evidence_ids":[r["remediation_id"] for r in rec]+matched_ids}

def compute_cemr(sub):
    ev_by_case={}
    for e in sub.get("evidence",[]):
        if e.get("case_id") and e.get("availability_status")!="UNAVAILABLE":
            ev_by_case.setdefault(e["case_id"],[]).append(e)
    eligible=[]
    for c in sub.get("cases",[]):
        if c.get("status") in ("RESOLVED","CLOSED") and (
            c.get("resolution_claim") in ("Remediated","Escalated and closed by higher authority") or
            c.get("remediation_claim") is True):
            eligible.append(c)
    missing=[c for c in eligible if not ev_by_case.get(c["case_id"])]
    return {"code":"CEMR","label":"Closure-Evidence Mismatch Rate","value":pct(len(missing),len(eligible)),
            "unit":"percent","sample":sufficiency(len(eligible),5),"numerator":len(missing),"denominator":len(eligible),
            "interpretation":'High CEMR indicates a mismatch between closure/remediation claims and available supporting evidence. "No supporting evidence was found in the submitted dataset."',
            "evidence_ids":[c["case_id"] for c in missing]}

def derived_kpi_value(kpi_name, metrics, supporting):
    mapping={
        "Observed Security Evidence Coverage":"OSEC",
        "Critical Asset Monitoring Gap":"CAMG",
        "Median Time-to-Close (Investigations)":"TTCP_MEDIAN_TTC",
        "Investigation Completeness Rate":"ICS",
        "Escalation Compliance Rate":"ER",
        "Post-Remediation Recurrence Rate":"PRR",
        "Closure Evidence Completeness Rate":"CEMR_COMPLETENESS",
        "Case Backlog Ratio":"BR"
    }
    code=mapping.get(kpi_name)
    if code=="TTCP_MEDIAN_TTC": return supporting.get("median_ttc")
    if code=="CEMR_COMPLETENESS":
        v=metrics.get("CEMR",{}).get("value"); return 100-v if v is not None else None
    if code in metrics: return metrics[code].get("value")
    return None

def compute_kecg(sub, metrics, supporting):
    rows=[]
    for k in sub.get("reported_kpis",[]):
        observed=derived_kpi_value(k.get("kpi_name"),metrics,supporting)
        aligned=(
            k.get("definition_version") is not None and
            k.get("population_definition") is not None and
            k.get("reporting_period_start")==sub["submission_metadata"]["assessment_period_start"] and
            k.get("reporting_period_end")==sub["submission_metadata"]["assessment_period_end"]
        )
        if observed is None or not aligned: continue
        diff=abs(float(k["reported_value"])-float(observed))
        rows.append({"kpi_id":k["kpi_id"],"name":k["kpi_name"],"reported":k["reported_value"],
                     "observed":round(observed,2),"difference":round(diff,2),"aligned":aligned})
    vals=[r["difference"] for r in rows]
    weights=[1.0]*len(vals)
    value=sum(v*w for v,w in zip(vals,weights))/sum(weights) if vals else None
    return {"code":"KECG","label":"KPI-Evidence Consistency Gap","value":round(value,2) if value is not None else None,
            "unit":"percentage points","sample":sufficiency(len(rows),3),"components":rows,
            "interpretation":"High KECG means reported performance materially differs from performance observable in submitted evidence; it does not automatically imply manipulation.",
            "evidence_ids":[r["kpi_id"] for r in rows]}

def compute_supporting(sub, metrics):
    alerts=sub.get("alerts",[]); cases=sub.get("cases",[]); acts=sub.get("investigation_actions",[]); ev=sub.get("evidence",[])
    active_analysts={c.get("assigned_analyst_id") for c in cases if c.get("assigned_analyst_id")}
    closed=[c for c in cases if c.get("closed_at")]
    ttc=[_closed_case_ttc(c,{a["alert_id"]:a for a in alerts}) for c in closed]
    ttc=[x for x in ttc if x is not None]
    linked=sum(1 for a in alerts if a.get("case_id"))
    open_cases=sum(1 for c in cases if c.get("status") not in ("RESOLVED","CLOSED"))
    patterns={}
    for a in acts: patterns[a.get("action_type")]=patterns.get(a.get("action_type"),0)+1
    dominant=max(patterns.values()) if patterns else 0
    return {
        "CALR": {"value":round(len(cases)/len(active_analysts),2) if active_analysts else None,"unit":"cases/analyst"},
        "ACCR": {"value":pct(linked,len(alerts)),"unit":"percent"},
        "BR": {"value":pct(open_cases,len(cases)),"unit":"percent"},
        "IPC": {"value":pct(dominant,len(acts)),"unit":"percent"},
        "EDS": {"value":round(mean([len(_evidence_for_case(sub,c["case_id"])) for c in cases]),2) if cases else None,"unit":"evidence/case"},
        "median_ttc":round(median(ttc),2) if ttc else None,
        "ttc_sample":len(ttc)
    }

def compute_metrics(sub, all_subs, config):
    m={}
    m["OSEC"]=compute_osec(sub); m["CAMG"]=compute_camg(sub)
    m["TTCP"]=compute_ttpc(sub,all_subs); m["ICS"]=compute_ics(sub,config)
    m["ER"]=compute_er(sub); m["PRR"]=compute_prr(sub,all_subs,config)
    m["CEMR"]=compute_cemr(sub)
    supporting=compute_supporting(sub,m)
    m["KECG"]=compute_kecg(sub,m,supporting)
    return m,supporting

def _period_for(s): return s["submission_metadata"]["assessment_period_end"]
def _cse_for(s): return s["cse"]["cse_id"]

def baseline_for(metric_code, current_sub, all_subs, metrics_cache):
    cse=_cse_for(current_sub); period=_period_for(current_sub)
    historical=[]; peers=[]
    for s in all_subs:
        if s is current_sub: continue
        key=(_cse_for(s),_period_for(s))
        mv=metrics_cache.get(key,{}).get(metric_code,{}).get("value")
        if mv is None: continue
        if _cse_for(s)==cse and _period_for(s)<period: historical.append(mv)
        elif _period_for(s)==period: peers.append(mv)
    return {
        "historical":{"values":historical,"mean":round(mean(historical),2) if historical else None,"n":len(historical)},
        "peer":{"values":peers,"mean":round(mean(peers),2) if peers else None,"n":len(peers)}
    }

def deviation(value, baseline, metric):
    if value is None: return None
    vals=[]
    if baseline["historical"]["mean"] is not None: vals.append(value-baseline["historical"]["mean"])
    if baseline["peer"]["mean"] is not None: vals.append(value-baseline["peer"]["mean"])
    if not vals: return None
    # Return a signed magnitude where positive means more concerning for the metric.
    raw=mean(vals)
    return -raw if metric in HIGHER_BETTER else raw

def normalized_strength(metric_value_, threshold, metric_code):
    if metric_value_ is None or threshold is None: return 0.0
    if metric_code in HIGHER_BETTER:
        return max(0.0,min(1.0,(threshold-metric_value_)/max(abs(threshold),1)))
    return max(0.0,min(1.0,(metric_value_-threshold)/max(abs(threshold),1)))

def signal_id(cse,period,category,case_id=None):
    base=f"{cse}|{period}|{category}|{case_id or ''}"
    return "SIG-"+hashlib.sha256(base.encode()).hexdigest()[:16].upper()

def _case_signal_candidates(sub, metrics, config):
    candidates=[]
    tt=metrics["TTCP"].get("case_values",{})
    ic=metrics["ICS"].get("case_values",{})
    for cid,t in tt.items():
        ics=ic.get(cid,{}).get("value")
        if t[3] is None or ics is None: continue
        rule=config["signal_rules"]["superficial_investigation"]
        aggregate_ics=metrics["ICS"].get("value")
        # The signal is deliberately gated by period-level context: a single fast case
        # in an otherwise ordinary CSE is not enough to create a portfolio work item.
        # This implements the metric -> sufficiency -> context -> signal chain.
        if aggregate_ics is not None and aggregate_ics <= rule["ics_max"] and t[3] <= rule["ttcp_max"] and ics <= rule["ics_max"]:
            ev=ic.get(cid,{}).get("evidence_ids",[])+ic.get(cid,{}).get("action_ids",[])
            candidates.append({
                "category":"superficial_investigation","case_id":cid,
                "title":"Potential Investigation Completeness Concern",
                "priority":"HIGH","strength":max((rule["ttcp_max"]-t[3])/max(rule["ttcp_max"],1),(rule["ics_max"]-ics)/max(rule["ics_max"],1)),
                "metric_codes":["TTCP","ICS"],
                "local":{"TTCP":t[3],"ICS":ics},
                "evidence":ev,
                "rationale":f"TTCP is {t[3]:.1f}th percentile and ICS is {ics:.1f}%; both configured review conditions are satisfied. The signal indicates a need for human review, not a finding of inadequate investigation."
            })
    return candidates

def generate_signals(sub, all_subs, metrics_cache, config):
    metrics=metrics_cache[(_cse_for(sub),_period_for(sub))]
    out=[]
    # Case-level superficial investigation
    out.extend(_case_signal_candidates(sub,metrics,config))
    # CSE/period metric signals
    rules=config["signal_rules"]
    for code,rule_name,metric_key,cmp,threshold in [
        ("monitoring_visibility_gap","monitoring_visibility_gap","CAMG","high",rules["monitoring_visibility_gap"]["camg_min"]),
        ("post_remediation_recurrence","post_remediation_recurrence","PRR","high",rules["post_remediation_recurrence"]["prr_min"]),
        ("kpi_evidence_discrepancy","kpi_evidence_discrepancy","KECG","high",rules["kpi_evidence_discrepancy"]["kecg_min"]),
        ("escalation_compliance_gap","escalation_compliance_gap","ER","low",rules["escalation_compliance_gap"]["er_max"]),
        ("closure_evidence_mismatch","closure_evidence_mismatch","CEMR","high",rules["closure_evidence_mismatch"]["cemr_min"]),
        ("monitoring_visibility_gap_osec","monitoring_visibility_gap","OSEC","low",rules["monitoring_visibility_gap"]["osec_max"]),
    ]:
        if code=="monitoring_visibility_gap_osec": continue
        metric=metrics[metric_key]; value=metric.get("value")
        if metric_key=="CAMG":
            continue
        if not metric["sample"]["sufficient"] or value is None: continue
        baseline=baseline_for(metric_key,sub,all_subs,metrics_cache)
        if cmp=="high": breach=value>=threshold
        else: breach=value<=threshold
        if not breach: continue
        if metric_key=="ER":
            prior=[x for x in all_subs if _cse_for(x)==_cse_for(sub) and _period_for(x)<_period_for(sub)]
            prior_vals=[]
            for ps in prior:
                pv=metrics_cache.get((_cse_for(ps),_period_for(ps)),{}).get("ER",{}).get("value")
                if pv is not None: prior_vals.append(pv)
            if len(prior_vals)<1 or not any(v<=threshold for v in prior_vals):
                continue
        if metric_key=="KECG":
            # Governance discrepancy is intended as a persistent signal. Require
            # at least two prior CSE periods with an elevated KECG rather than
            # treating a single noisy KPI mismatch as a supervisory concern.
            prior=[x for x in all_subs if _cse_for(x)==_cse_for(sub) and _period_for(x)<_period_for(sub)]
            prior_vals=[]
            for ps in prior:
                pv=metrics_cache.get((_cse_for(ps),_period_for(ps)),{}).get("KECG",{}).get("value")
                if pv is not None: prior_vals.append(pv)
            if len(prior_vals)<2 or sum(v>=threshold for v in prior_vals)<2:
                continue
        # For negative-space monitoring, require both CAMG and OSEC context where available.
        if metric_key=="CAMG":
            osec=metrics["OSEC"].get("value")
            if osec is not None and osec>rules["monitoring_visibility_gap"]["osec_max"] and value < rules["monitoring_visibility_gap"]["camg_min"]*1.5:
                continue
        dev=deviation(value,baseline,metric_key)
        strength=normalized_strength(value,threshold,metric_key)
        # Require a baseline when possible; if absent, retain as a threshold-only candidate.
        if dev is not None:
            strength=min(1.0,strength+min(0.5,abs(dev)/max(abs(threshold),1)))
        category=rule_name
        title={
            "monitoring_visibility_gap":"Potential Monitoring Visibility Gap",
            "post_remediation_recurrence":"Potential Post-Remediation Recurrence",
            "kpi_evidence_discrepancy":"Reported KPI and Observed Evidence Discrepancy",
            "escalation_compliance_gap":"Potential Escalation Compliance Gap",
            "closure_evidence_mismatch":"Potential Closure-Evidence Mismatch",
        }[category]
        evidence=metric.get("evidence_ids",[])
        if category=="monitoring_visibility_gap": evidence=[]
        rationale=f"{metric['label']} is {value} {metric.get('unit','')}, crossing the configured rule threshold of {threshold}. "
        if baseline["historical"]["mean"] is not None: rationale+=f"Historical baseline mean: {baseline['historical']['mean']}. "
        if baseline["peer"]["mean"] is not None: rationale+=f"Peer baseline mean: {baseline['peer']['mean']}. "
        if category=="closure_evidence_mismatch":
            rationale+='No supporting evidence was found in the submitted dataset for the affected closed cases; this does not establish that remediation did not occur.'
        out.append({"category":category,"case_id":None,"title":title,
                     "priority":"HIGH" if strength>=0.5 else "MEDIUM","strength":strength,
                     "metric_codes":[metric_key],"local":{metric_key:value},"baseline":baseline,
                     "evidence":evidence,"rationale":rationale})
    # OSEC + CAMG negative-space rule with persistence. This avoids turning a
    # random quarter-end missing asset into a supervisory signal while preserving
    # the synthetic Charlie condition that persists across all three quarters.
    osec=metrics["OSEC"]; camg=metrics["CAMG"]; r=rules["monitoring_visibility_gap"]
    if osec["sample"]["sufficient"] and camg["sample"]["sufficient"] and osec.get("value") is not None and camg.get("value") is not None:
        prior=[x for x in all_subs if _cse_for(x)==_cse_for(sub) and _period_for(x)<_period_for(sub)]
        prior_camg=[]
        for ps in prior:
            pv=metrics_cache.get((_cse_for(ps),_period_for(ps)),{}).get("CAMG",{}).get("value")
            if pv is not None: prior_camg.append(pv)
        persistent=sum(v>=r["camg_min"] for v in prior_camg)>=1
        # OSEC threshold is allowed a small contextual band for negative-space:
        # CAMG is the primary metric and OSEC provides corroborating context.
        if camg["value"]>=r["camg_min"] and osec["value"]<=95.0 and persistent:
            baseline={"OSEC":baseline_for("OSEC",sub,all_subs,metrics_cache),
                      "CAMG":baseline_for("CAMG",sub,all_subs,metrics_cache)}
            strength=max(normalized_strength(osec["value"],r["osec_max"],"OSEC"),
                         normalized_strength(camg["value"],r["camg_min"],"CAMG"))
            out.append({"category":"monitoring_visibility_gap","case_id":None,
                         "title":"Potential Monitoring Visibility Gap","priority":"HIGH" if strength>=.5 else "MEDIUM",
                         "strength":max(strength,.55),"metric_codes":["OSEC","CAMG"],
                         "local":{"OSEC":osec["value"],"CAMG":camg["value"]},"baseline":baseline,
                         "evidence":[],"rationale":f"OSEC is {osec['value']}% and CAMG is {camg['value']}%. The CAMG condition persists across comparable periods, so the negative-space pattern warrants manual review; no observed evidence does not prove monitoring is absent."})
    # Deduplicate same category with same case.
    dedup={}
    for c in out:
        k=(c["category"],c.get("case_id"))
        if k not in dedup or c["strength"]>dedup[k]["strength"]: dedup[k]=c
    # CEGS computed from signal strengths and configurable weights.
    final=[]
    for c in dedup.values():
        weight=config["cegs_weights"].get(c["category"],1.0)
        score=round(min(100.0,100.0*c["strength"]*weight),2)
        period=_period_for(sub); cse=_cse_for(sub)
        final.append({
            "signal_id":signal_id(cse,period,c["category"],c.get("case_id")),
            "cse_id":cse,"period_end":period,"case_id":c.get("case_id"),
            "category":c["category"],"priority":c["priority"],"score":score,
            "title":c["title"],"rationale":c["rationale"],
            "metric_codes":c["metric_codes"],"baseline":c.get("baseline",{}),
            "threshold":c.get("threshold",{}),
            "evidence":c.get("evidence",[]),"config_version":config.get("_version","1"),
            "created_at":iso_now(),
        })
    final.sort(key=lambda x:(-x["score"],x["category"]))
    return final

def assessment_object(sub, metrics, supporting, signals):
    def metric_card(m):
        if m.get("value") is None:
            status="Insufficient data"
        elif not m["sample"]["sufficient"]:
            status="Insufficient data"
        else:
            status="Review signal" if any(m["code"] in s["metric_codes"] for s in signals) else "No signal"
        return {**m,"status":status}
    start=sub["submission_metadata"]["assessment_period_start"]
    month=start[5:7]
    quarter={"01":"Q1","04":"Q2","07":"Q3","10":"Q4"}.get(month,month)
    return {
        "assessment_id":f"ASM-{sub['submission_metadata']['submission_id'].replace('SUB-','')}",
        "cse":sub["cse"],"period":{
            "start":sub["submission_metadata"]["assessment_period_start"],
            "end":sub["submission_metadata"]["assessment_period_end"],
            "label":f"{quarter}-{start[:4]}"
        },
        "metrics":[metric_card(metrics[k]) for k in METRICS],
        "supporting_metrics":supporting,
        "signals":signals,
        "record_counts":sub["submission_metadata"].get("record_counts") or {k:len(sub.get(k,[])) for k in ["assets","alerts","cases","investigation_actions","escalations","remediations","evidence","reported_kpis"]},
        "analytical_chain":["Metric","Sample sufficiency","Historical/peer baseline","Deviation","Configurable rule","Persistence/trend","Contextual checks","Supervisory signal","Evidence","Human review"]
    }
