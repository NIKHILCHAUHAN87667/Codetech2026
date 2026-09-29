
from __future__ import annotations
import csv, io, json, os, traceback
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse, parse_qs, unquote
from email.parser import BytesParser
from email.policy import default
from typing import Any
import uuid

from .db import connect, insert_submission, list_submissions, get_submission, all_submissions, mark_processed, replace_signals, get_signals, get_signal, insert_decision, insert_audit, decisions_for_case, records_for_case, load_config, upsert_config
from .validation import validate_submission
from .analytics import compute_metrics, generate_signals, assessment_object, METRICS, iso_now

def period_label(sub):
    p=sub["submission_metadata"]
    start=p.get("assessment_period_start","")
    if start[5:7]=="01": q="Q1"
    elif start[5:7]=="04": q="Q2"
    elif start[5:7]=="07": q="Q3"
    elif start[5:7]=="10": q="Q4"
    else: q=""
    return f"{q}-{start[:4]}" if q else p.get("assessment_period_end","")[:7]

BASE = os.path.dirname(os.path.dirname(__file__))
DEFAULT_CONFIG_PATH = os.path.join(BASE, "config", "default.json")
DB_PATH = os.environ.get("SATSA_DB_PATH", os.path.join(BASE, "data", "satsa.db"))

def read_default_config():
    with open(DEFAULT_CONFIG_PATH, encoding="utf-8") as f: return json.load(f)

class SATSAService:
    def __init__(self, db_path=DB_PATH):
        self.con=connect(db_path)
        defaults=read_default_config()
        if not self.con.execute("SELECT 1 FROM config LIMIT 1").fetchone():
            cfg={"baseline":defaults["baseline"],"recurrence_window_days":defaults["recurrence_window_days"],
                 "metric_thresholds":defaults["metric_thresholds"],"signal_rules":defaults["signal_rules"],
                 "ics_requirements":defaults["ics_requirements"],"cegs_weights":defaults["cegs_weights"],
                 "min_investigation_actions":4}
            upsert_config(self.con,cfg,iso_now())
        self.config=load_config(self.con,defaults)
        self.config.setdefault("min_investigation_actions",4)
        self.config["_version"]=str(max([0]+[int(r["version"]) for r in self.con.execute("SELECT version FROM config").fetchall()]))

    def ingest(self, submission, raw_text=None, source_format=None):
        fmt=source_format or submission.get("submission_metadata",{}).get("source_format")
        validation=validate_submission(submission,fmt)
        if raw_text is None: raw_text=json.dumps(submission)
        # Only valid submissions are persisted: a structurally broken submission stored in the database
        # would break batch processing for every other CSE. Invalid uploads get a 422 + report instead.
        if validation["valid"]:
            insert_submission(self.con,submission,validation,raw_text,iso_now())
        return validation

    def process(self, sid):
        sub=get_submission(self.con,sid)
        if not sub: raise KeyError(sid)
        raw=sub["raw"]
        allsubs=all_submissions(self.con)
        # Replace current raw with normalized all-submissions view; compute metrics for every
        # ingested submission so baselines are always consistent after a batch.
        cache={}
        support={}
        for s in allsubs:
            m,sp=compute_metrics(s,allsubs,self.config)
            cache[(s["cse"]["cse_id"],s["submission_metadata"]["assessment_period_end"])]=m
            support[(s["cse"]["cse_id"],s["submission_metadata"]["assessment_period_end"])]=sp
        for s in allsubs:
            key=(s["cse"]["cse_id"],s["submission_metadata"]["assessment_period_end"])
            sigs=generate_signals(s,allsubs,cache,self.config)
            replace_signals(self.con,s["cse"]["cse_id"],s["submission_metadata"]["assessment_period_end"],sigs)
            mark_processed(self.con,s["submission_metadata"]["submission_id"],iso_now())
        return self.assessment(raw,cache,support)

    def process_all(self):
        subs=all_submissions(self.con)
        cache={}; support={}
        for s in subs:
            m,sp=compute_metrics(s,subs,self.config)
            cache[(s["cse"]["cse_id"],s["submission_metadata"]["assessment_period_end"])]=m
            support[(s["cse"]["cse_id"],s["submission_metadata"]["assessment_period_end"])]=sp
        for s in subs:
            key=(s["cse"]["cse_id"],s["submission_metadata"]["assessment_period_end"])
            sigs=generate_signals(s,subs,cache,self.config)
            replace_signals(self.con,s["cse"]["cse_id"],s["submission_metadata"]["assessment_period_end"],sigs)
            mark_processed(self.con,s["submission_metadata"]["submission_id"],iso_now())
        return len(subs)

    def _load_target(self,cse_id,period=None):
        subs=all_submissions(self.con)
        candidates=[s for s in subs if s["cse"]["cse_id"]==cse_id]
        if period:
            candidates=[s for s in candidates if period_label(s)==period or period in s["submission_metadata"]["assessment_period_end"]]
        if not candidates: return None,subs
        candidates.sort(key=lambda s:s["submission_metadata"]["assessment_period_end"])
        return candidates[-1],subs

    def assessment(self,curr,cache=None,support=None):
        subs=all_submissions(self.con)
        if cache is None:
            cache={};support={}
            for s in subs:
                m,sp=compute_metrics(s,subs,self.config)
                cache[(s["cse"]["cse_id"],s["submission_metadata"]["assessment_period_end"])]=m;support[(s["cse"]["cse_id"],s["submission_metadata"]["assessment_period_end"])]=sp
        key=(curr["cse"]["cse_id"],curr["submission_metadata"]["assessment_period_end"])
        sigs=get_signals(self.con,curr["cse"]["cse_id"],curr["submission_metadata"]["assessment_period_end"])
        if not sigs:
            sigs=generate_signals(curr,subs,cache,self.config)
        return assessment_object(curr,cache[key],support[key],sigs)

    def dashboard(self,period=None):
        subs=all_submissions(self.con)
        if not subs: return {"period":period,"stats":{"cse_assessed":0,"requiring_review":0,"cases_prioritized":0,"pending_reviews":0},"cse_rows":[]}
        periods=sorted({s["submission_metadata"]["assessment_period_end"] for s in subs})
        target=max([p for p in periods if not period or period in p] or periods)
        target_subs=[s for s in subs if s["submission_metadata"]["assessment_period_end"]==target]
        rows=[]; cases=0; signals=0
        for s in target_subs:
            ss=get_signals(self.con,s["cse"]["cse_id"],target)
            signals+=len(ss)
            cases+=len({x.get("case_id") for x in ss if x.get("case_id")})
            rows.append({"name":s["cse"]["cse_name"],"cse_id":s["cse"]["cse_id"],"sector":s["cse"].get("sector"),
                         "period":period_label(s),"signals":len(ss),
                         "status":"Review required" if ss else "No priority signals",
                         "tone":"red" if ss else "green"})
        return {"period":next((period_label(s) for s in target_subs), target[:7]),"stats":{"cse_assessed":len(target_subs),
            "requiring_review":sum(1 for r in rows if r["signals"]),
            "cases_prioritized":cases,"pending_reviews":signals},
            "cse_rows":rows}

    def worklist(self,params):
        period=params.get("period",[None])[0]
        rows=[]
        for s in all_submissions(self.con):
            p=s["submission_metadata"]["assessment_period_end"]
            if period and period_label(s)!=period: continue
            ss=get_signals(self.con,s["cse"]["cse_id"],p)
            cases_by_id={c["case_id"]:c for c in s.get("cases",[])}
            alerts={a["alert_id"]:a for a in s.get("alerts",[])}
            for sig in ss:
                c=cases_by_id.get(sig.get("case_id"))
                a=alerts.get(c.get("alert_id")) if c else None
                decided=decisions_for_case(self.con,sig["case_id"]) if sig.get("case_id") else []
                status="Not started"
                if decided:
                    status={"Confirm concern":"Confirmed","Dismiss signal":"Dismissed","Request further review":"In review"}.get(decided[-1]["decision"],"In review")
                rows.append({"priority":sig["priority"],"priority_score":sig["score"],"id":sig.get("case_id") or sig["signal_id"],
                             "signal_id":sig["signal_id"],"cse":s["cse"]["cse_name"],"cse_id":s["cse"]["cse_id"],
                             "type":a.get("alert_type") if a else sig["category"],
                             "signal":sig["title"],"category":sig["category"],
                             "reason":sig["rationale"],"status":status,
                             "metric_codes":sig["metric_codes"]})
        for key in ["priority","cse","category","status"]:
            val=params.get(key,[None])[0]
            if val:
                rows=[r for r in rows if str(r.get(key,"")).upper()==val.upper()]
        q=params.get("q",[None])[0]
        if q:
            q=q.lower(); rows=[r for r in rows if q in json.dumps(r).lower()]
        rows.sort(key=lambda r:(0 if r["priority"]=="HIGH" else 1,-r["priority_score"]))
        return {"rows":rows,"count":len(rows),"filters":{k:v[0] for k,v in params.items()}}

    def case_detail(self,case_id):
        subs=all_submissions(self.con)
        target=None
        for s in subs:
            c=next((c for c in s.get("cases",[]) if c.get("case_id")==case_id),None)
            if c: target=(s,c);break
        if not target: return None
        s,c=target
        am={a["alert_id"]:a for a in s.get("alerts",[])}
        a=am.get(c.get("alert_id"),{})
        ev=[e for e in s.get("evidence",[]) if e.get("case_id")==case_id]
        acts=[x for x in s.get("investigation_actions",[]) if x.get("case_id")==case_id]
        esc=[x for x in s.get("escalations",[]) if x.get("case_id")==case_id]
        rem=[x for x in s.get("remediations",[]) if x.get("case_id")==case_id]
        ss=[x for x in get_signals(self.con,s["cse"]["cse_id"],s["submission_metadata"]["assessment_period_end"]) if x.get("case_id")==case_id]
        m,sp=compute_metrics(s,subs,self.config)
        ics=m["ICS"]["case_values"].get(case_id)
        tt=m["TTCP"]["case_values"].get(case_id)
        checklist=ics["checks"] if ics else {}
        labels={
            "alert_reviewed":"Alert reviewed","evidence_examined":"Evidence examined",
            "affected_asset_identified":"Affected asset identified","investigation_actions_recorded":"Investigation actions recorded",
            "findings_documented":"Findings documented","disposition_documented":"Disposition documented",
            "escalation_decision_documented":"Escalation decision documented","remediation_recorded":"Remediation recorded"
        }
        return {"case_id":case_id,"cse":s["cse"],"period":s["submission_metadata"]["assessment_period_end"][:7],
                "case":c,"alert":a,"metrics":{"TTCP":tt[3] if tt else None,"ICS":ics["value"] if ics else None},
                "signals":ss,"evidence_chain":{"metrics":["TTCP","ICS"],"signals":ss,"evidence_ids":[e["evidence_id"] for e in ev],
                                                "explanation":ss[0]["rationale"] if ss else "No supervisory signal is currently attached to this case."},
                "timeline":sorted(
                    [{"timestamp":c.get("opened_at"),"activity":"Case opened","record_id":case_id,"type":"Case record"}]+
                    [{"timestamp":x.get("action_timestamp"),"activity":x.get("action_type"),"record_id":x.get("investigation_action_id"),"type":"Investigation record"} for x in acts]+
                    [{"timestamp":x.get("event_timestamp"),"activity":"Evidence available","record_id":x.get("evidence_id"),"type":"Evidence record"} for x in ev]+
                    ([{"timestamp":c.get("closed_at"),"activity":"Case closed","record_id":"CLS-"+case_id,"type":"Closure record"}] if c.get("closed_at") else [])
                    ,key=lambda x:x["timestamp"] or ""),
                "checklist":[{"key":k,"label":labels[k],"recorded":v} for k,v in checklist.items()],
                "evidence":ev,"investigation_actions":acts,"escalations":esc,"remediations":rem,
                "decisions":decisions_for_case(self.con,case_id),
                "comparison_group":"same alert type + severity + assessment quarter across CSEs"
                }

    def decision(self,case_id,payload):
        required={"decision","comment","actor_id"}
        missing=required-set(payload)
        if missing or payload.get("decision") not in ("Confirm concern","Dismiss signal","Request further review") or not str(payload.get("comment","")).strip():
            raise ValueError("decision, comment and actor_id are required; decision must be one of the three supported values")
        detail=self.case_detail(case_id)
        if not detail: raise KeyError(case_id)
        sigs=detail["signals"]
        if not sigs: raise ValueError("Case has no supervisory signal to decide")
        sig=sigs[0]; now=iso_now()
        d={"decision_id":"DEC-"+uuid.uuid4().hex[:16].upper(),"signal_id":sig["signal_id"],"case_id":case_id,
           "decision":payload["decision"],"comment":payload["comment"].strip(),"actor_id":payload["actor_id"],
           "actor_name":payload.get("actor_name"),"created_at":now}
        insert_decision(self.con,d)
        audit_id="AUD-"+uuid.uuid4().hex[:16].upper()
        insert_audit(self.con,{"event_id":audit_id,"event_type":"SUPERVISOR_DECISION",
                              "reference_type":"CASE","reference_id":case_id,"actor_id":payload["actor_id"],
                              "payload":d,"created_at":now})
        d["audit_reference"]=audit_id
        return d

    def report(self,cse_id,period=None):
        s,subs=self._load_target(cse_id,period)
        if not s: return None
        a=self.assessment(s)
        reviewed=sum(len([d for d in decisions_for_case(self.con,c["case_id"])])>0 for c in s.get("cases",[]))
        return {"assessment_id":a["assessment_id"],"cse":a["cse"],"period":a["period"],
                "records_analyzed":sum(a["record_counts"].values()),"metrics_calculated":len(a["metrics"]),
                "signals_generated":len(a["signals"]),"cases_reviewed":reviewed,
                "findings":[{"signal_id":x["signal_id"],"title":x["title"],"priority":x["priority"],
                             "case_id":x.get("case_id"),"rationale":x["rationale"],"evidence":x["evidence"]} for x in a["signals"]],
                "decisions":[d for x in a["signals"] if x.get("case_id") for d in decisions_for_case(self.con,x["case_id"])],
                "recommendations":[
                    "Review evidence linked to all high-priority signals.",
                    "Distinguish data-sufficiency limitations from operational execution signals.",
                    "Use CEGS only as a configurable worklist prioritization aid."
                ],
                "audit_note":"Human supervisor decisions are persisted with actor, timestamp and stable references."}

def csv_submission_from_multipart(content_type, body):
    # Parse multipart/form-data using the standard-library MIME parser.
    raw_headers=(f"Content-Type: {content_type}\r\nMIME-Version: 1.0\r\n\r\n").encode()
    msg=BytesParser(policy=default).parsebytes(raw_headers+body)
    parts={}
    for part in msg.iter_parts():
        name=part.get_param("name",header="content-disposition")
        filename=part.get_filename()
        payload=part.get_payload(decode=True) or b""
        if filename:
            parts[filename]=payload.decode("utf-8-sig")
    if not parts: raise ValueError("No CSV files found in multipart request")
    # Accept names like assets.csv, cse.csv, submission_metadata.csv.
    parsed={}
    aliases={"metadata":"submission_metadata","submission_metadata":"submission_metadata"}
    for filename,text in parts.items():
        stem=os.path.splitext(os.path.basename(filename))[0]
        key=aliases.get(stem,stem)
        if key not in {"submission_metadata","cse","assets","alerts","cases","investigation_actions","escalations","remediations","evidence","reported_kpis"}:
            continue
        reader=csv.DictReader(io.StringIO(text))
        rows=[]
        for r in reader:
            row={k:(None if v in ("",None) else _coerce(v)) for k,v in r.items()}
            rows.append(row)
        parsed[key]=rows
    meta_rows=parsed.get("submission_metadata",[])
    cse_rows=parsed.get("cse",[])
    if len(meta_rows)!=1 or len(cse_rows)!=1: raise ValueError("CSV submission requires exactly one submission_metadata.csv row and one cse.csv row")
    meta=meta_rows[0]; cse=cse_rows[0]
    for k in list(meta):
        if k.startswith("count_"): meta.pop(k)
    meta["source_format"]="CSV"
    return {"submission_metadata":meta,"cse":cse,
            "assets":parsed.get("assets",[]),"alerts":parsed.get("alerts",[]),"cases":parsed.get("cases",[]),
            "investigation_actions":parsed.get("investigation_actions",[]),"escalations":parsed.get("escalations",[]),
            "remediations":parsed.get("remediations",[]),"evidence":parsed.get("evidence",[]),
            "reported_kpis":parsed.get("reported_kpis",[])}

def _coerce(v):
    lv=v.lower() if isinstance(v,str) else v
    if lv in ("true","false"): return lv=="true"
    try:
        if isinstance(v,str) and "." in v: return float(v)
        if isinstance(v,str) and v.isdigit(): return int(v)
    except Exception: pass
    return v

class Handler(BaseHTTPRequestHandler):
    server_version="SAT-SA/1.0"
    def _json(self,status,obj):
        data=json.dumps(obj,default=str,ensure_ascii=False).encode()
        self.send_response(status); self.send_header("Content-Type","application/json; charset=utf-8")
        self.send_header("Content-Length",str(len(data))); self.send_header("Access-Control-Allow-Origin","*")
        self.send_header("Access-Control-Allow-Headers","Content-Type, Authorization"); self.send_header("Access-Control-Allow-Methods","GET,POST,PUT,OPTIONS")
        self.end_headers(); self.wfile.write(data)
    def _body(self):
        n=int(self.headers.get("Content-Length","0")); return self.rfile.read(n)
    def _static(self,path):
        """Serve the built React app (frontend/dist) so one process serves UI + API."""
        root=self.server.static_dir
        if not root or not os.path.isdir(root): return False
        rel=path.lstrip("/") or "index.html"
        full=os.path.normpath(os.path.join(root,rel))
        if not full.startswith(os.path.normpath(root)): return False
        if not os.path.isfile(full): full=os.path.join(root,"index.html")  # SPA fallback
        if not os.path.isfile(full): return False
        import mimetypes
        ctype=mimetypes.guess_type(full)[0] or "application/octet-stream"
        data=open(full,"rb").read()
        self.send_response(200); self.send_header("Content-Type",ctype); self.send_header("Content-Length",str(len(data)))
        self.end_headers(); self.wfile.write(data); return True
    def do_OPTIONS(self): self._json(204,{})
    def do_GET(self): self._dispatch("GET")
    def do_POST(self): self._dispatch("POST")
    def do_PUT(self): self._dispatch("PUT")
    def _dispatch(self,method):
        try:
            u=urlparse(self.path); path=unquote(u.path); qs=parse_qs(u.query)
            svc=self.server.service
            if method=="GET" and not path.startswith("/api/") and self._static(path): return
            if method=="GET" and path=="/api/v1/health":
                return self._json(200,{"status":"ok","offline":True,"service":"SAT-SA backend"})
            if method=="GET" and path=="/api/v1":
                return self._json(200,{"service":"SAT-SA","version":"1.0","offline":True,"endpoints":["/dashboard","/submissions","/assessments/{cse_id}","/worklist","/cases/{case_id}","/reports/{cse_id}"]})
            if method=="GET" and path=="/api/v1/dashboard":
                return self._json(200,svc.dashboard(qs.get("period",[None])[0]))
            if method=="GET" and path=="/api/v1/submissions":
                return self._json(200,{"submissions":list_submissions(svc.con)})
            if method=="GET" and path.startswith("/api/v1/submissions/"):
                sid=path.rsplit("/",1)[1]; x=get_submission(svc.con,sid)
                return self._json(200,x) if x else self._json(404,{"error":"submission not found"})
            if method=="POST" and path=="/api/v1/submissions/json":
                body=self._body(); sub=json.loads(body.decode()); v=svc.ingest(sub,body.decode(),"JSON")
                status=200 if v["valid"] else 422
                return self._json(status,{"validation":v,"submission_id":sub.get("submission_metadata",{}).get("submission_id")})
            if method=="POST" and path=="/api/v1/submissions/csv":
                ctype=self.headers.get("Content-Type","")
                sub=csv_submission_from_multipart(ctype,self._body()); v=svc.ingest(sub,json.dumps(sub),"CSV")
                return self._json(200 if v["valid"] else 422,{"validation":v,"submission_id":sub.get("submission_metadata",{}).get("submission_id")})
            if method=="POST" and path.startswith("/api/v1/submissions/") and path.endswith("/process"):
                sid=path.split("/")[-2]; return self._json(200,svc.process(sid))
            if method=="GET" and path.startswith("/api/v1/assessments/"):
                cse=path.split("/")[-1]; s,_=svc._load_target(cse,qs.get("period",[None])[0])
                return self._json(200,svc.assessment(s)) if s else self._json(404,{"error":"assessment not found"})
            if method=="GET" and path=="/api/v1/worklist":
                return self._json(200,svc.worklist(qs))
            if method=="GET" and path.startswith("/api/v1/cases/"):
                cid=path.split("/")[-1]; x=svc.case_detail(cid)
                return self._json(200,x) if x else self._json(404,{"error":"case not found"})
            if method=="POST" and path.startswith("/api/v1/cases/") and path.endswith("/decisions"):
                cid=path.split("/")[-2]; payload=json.loads(self._body().decode()); return self._json(201,svc.decision(cid,payload))
            if method=="GET" and path.startswith("/api/v1/reports/") and path.endswith("/export"):
                cse=path.split("/")[-2]; report=svc.report(cse,qs.get("period",[None])[0])
                if not report: return self._json(404,{"error":"report not found"})
                fmt=qs.get("format",["json"])[0]
                if fmt=="json": return self._json(200,report)
                return self._json(400,{"error":"Only JSON export is built in; secure PDF generation can be layered outside the offline analytics core."})
            if method=="GET" and path.startswith("/api/v1/reports/"):
                cse=path.split("/")[-1]; report=svc.report(cse,qs.get("period",[None])[0])
                return self._json(200,report) if report else self._json(404,{"error":"report not found"})
            if method=="GET" and path=="/api/v1/config":
                return self._json(200,svc.config)
            if method=="PUT" and path=="/api/v1/config":
                payload=json.loads(self._body().decode())
                now=iso_now(); upsert_config(svc.con,payload,now,"SUP-LOCAL")
                svc.config=load_config(svc.con,read_default_config()); svc.config["_version"]=str(max([0]+[int(r["version"]) for r in svc.con.execute("SELECT version FROM config").fetchall()]))
                insert_audit(svc.con,{"event_id":"AUD-"+uuid.uuid4().hex[:16].upper(),"event_type":"CONFIG_UPDATE",
                    "reference_type":"CONFIG","reference_id":svc.config["_version"],"actor_id":"SUP-LOCAL","payload":payload,"created_at":now})
                return self._json(200,svc.config)
            return self._json(404,{"error":"not found"})
        except KeyError as e:
            self._json(404,{"error":f"not found: {e.args[0] if e.args else ''}"})
        except ValueError as e:
            self._json(400,{"error":str(e)})
        except Exception as e:
            traceback.print_exc()
            self._json(500,{"error":"internal server error","detail":str(e)})
    def log_message(self,format,*args):
        # Keep stdout quiet for an offline demo service.
        return

def run(host="127.0.0.1",port=8000,db_path=DB_PATH):
    service=SATSAService(db_path)
    server=ThreadingHTTPServer((host,port),Handler)
    server.service=service
    server.static_dir=os.environ.get("SATSA_STATIC_DIR",os.path.join(os.path.dirname(BASE),"frontend","dist"))
    print(f"SAT-SA backend listening on http://{host}:{port}")
    if os.path.isdir(server.static_dir): print(f"Serving built frontend from {server.static_dir}")
    print("Offline mode: no external network calls are made by the application.")
    server.serve_forever()
