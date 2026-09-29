
from __future__ import annotations
import json
import sqlite3
from pathlib import Path
from typing import Any, Iterable

ENTITY_TABLES = [
    "assets", "alerts", "cases", "investigation_actions",
    "escalations", "remediations", "evidence", "reported_kpis"
]

SCHEMA = """
PRAGMA foreign_keys = OFF;

CREATE TABLE IF NOT EXISTS submissions (
    submission_id TEXT PRIMARY KEY,
    cse_id TEXT NOT NULL,
    period_start TEXT NOT NULL,
    period_end TEXT NOT NULL,
    schema_version TEXT NOT NULL,
    source_format TEXT NOT NULL,
    submission_timestamp TEXT NOT NULL,
    raw_json TEXT NOT NULL,
    validation_json TEXT NOT NULL,
    processed_at TEXT,
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS records (
    entity_type TEXT NOT NULL,
    record_id TEXT NOT NULL,
    submission_id TEXT NOT NULL,
    cse_id TEXT NOT NULL,
    period_start TEXT NOT NULL,
    period_end TEXT NOT NULL,
    payload_json TEXT NOT NULL,
    PRIMARY KEY(entity_type, record_id, submission_id)
);

CREATE INDEX IF NOT EXISTS idx_records_entity ON records(entity_type, cse_id, period_end);
CREATE INDEX IF NOT EXISTS idx_records_id ON records(entity_type, record_id);
CREATE INDEX IF NOT EXISTS idx_submissions_cse_period ON submissions(cse_id, period_end);

CREATE TABLE IF NOT EXISTS signals (
    signal_id TEXT PRIMARY KEY,
    cse_id TEXT NOT NULL,
    period_end TEXT NOT NULL,
    case_id TEXT,
    category TEXT NOT NULL,
    priority TEXT NOT NULL,
    score REAL NOT NULL,
    title TEXT NOT NULL,
    rationale TEXT NOT NULL,
    metric_codes TEXT NOT NULL,
    baseline_json TEXT NOT NULL,
    threshold_json TEXT NOT NULL,
    evidence_json TEXT NOT NULL,
    config_version TEXT NOT NULL,
    created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_signals_cse_period ON signals(cse_id, period_end, score DESC);
CREATE INDEX IF NOT EXISTS idx_signals_case ON signals(case_id);

CREATE TABLE IF NOT EXISTS decisions (
    decision_id TEXT PRIMARY KEY,
    signal_id TEXT NOT NULL,
    case_id TEXT NOT NULL,
    decision TEXT NOT NULL,
    comment TEXT NOT NULL,
    actor_id TEXT NOT NULL,
    actor_name TEXT,
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS audit_events (
    event_id TEXT PRIMARY KEY,
    event_type TEXT NOT NULL,
    reference_type TEXT NOT NULL,
    reference_id TEXT NOT NULL,
    actor_id TEXT NOT NULL,
    payload_json TEXT NOT NULL,
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS config (
    key TEXT PRIMARY KEY,
    value_json TEXT NOT NULL,
    version INTEGER NOT NULL,
    updated_at TEXT NOT NULL,
    updated_by TEXT NOT NULL
);
"""

def connect(path: str | Path) -> sqlite3.Connection:
    p = Path(path)
    p.parent.mkdir(parents=True, exist_ok=True)
    con = sqlite3.connect(p, check_same_thread=False)
    con.row_factory = sqlite3.Row
    con.executescript(SCHEMA)
    return con

def upsert_config(con: sqlite3.Connection, config: dict[str, Any], now: str, actor: str="SYSTEM") -> None:
    cur = con.execute("SELECT COALESCE(MAX(version), 0) FROM config")
    version = int(cur.fetchone()[0]) + 1
    for k, v in config.items():
        con.execute(
            """INSERT INTO config(key,value_json,version,updated_at,updated_by)
               VALUES(?,?,?,?,?)
               ON CONFLICT(key) DO UPDATE SET value_json=excluded.value_json,
               version=excluded.version,updated_at=excluded.updated_at,updated_by=excluded.updated_by""",
            (k, json.dumps(v), version, now, actor)
        )
    con.commit()

def load_config(con: sqlite3.Connection, defaults: dict[str, Any]) -> dict[str, Any]:
    rows = con.execute("SELECT key,value_json FROM config").fetchall()
    if not rows:
        return defaults
    result = dict(defaults)
    for row in rows:
        result[row["key"]] = json.loads(row["value_json"])
    return result

def insert_submission(con: sqlite3.Connection, submission: dict[str, Any],
                      validation: dict[str, Any], raw_text: str, now: str) -> None:
    meta = submission["submission_metadata"]
    sid = meta["submission_id"]
    con.execute(
        """INSERT INTO submissions
           (submission_id,cse_id,period_start,period_end,schema_version,source_format,
            submission_timestamp,raw_json,validation_json,created_at)
           VALUES(?,?,?,?,?,?,?,?,?,?)
           ON CONFLICT(submission_id) DO UPDATE SET raw_json=excluded.raw_json,
           validation_json=excluded.validation_json, source_format=excluded.source_format""",
        (sid, meta["cse_id"], meta["assessment_period_start"], meta["assessment_period_end"],
         meta["schema_version"], meta["source_format"], meta["submission_timestamp"],
         raw_text, json.dumps(validation), now)
    )
    for table in ENTITY_TABLES:
        for row in submission.get(table, []):
            rid = row.get(_ID_FIELD[table])
            if not rid:
                continue
            con.execute(
                """INSERT OR REPLACE INTO records
                   (entity_type,record_id,submission_id,cse_id,period_start,period_end,payload_json)
                   VALUES(?,?,?,?,?,?,?)""",
                (table, rid, sid, meta["cse_id"], meta["assessment_period_start"],
                 meta["assessment_period_end"], json.dumps(row, separators=(",", ":")))
            )
    # CSE and submission_metadata are retained inside raw_json; they are also indexed
    # in submissions for query/report purposes.
    con.commit()

def _rows(con: sqlite3.Connection, entity_type: str, cse_id: str | None=None,
          period_end: str | None=None) -> list[dict[str, Any]]:
    q = "SELECT payload_json FROM records WHERE entity_type=?"
    args: list[Any] = [entity_type]
    if cse_id:
        q += " AND cse_id=?"; args.append(cse_id)
    if period_end:
        q += " AND period_end=?"; args.append(period_end)
    return [json.loads(r["payload_json"]) for r in con.execute(q, args)]

def load_submission_records(con: sqlite3.Connection, submission_id: str) -> dict[str, Any]:
    s = con.execute("SELECT * FROM submissions WHERE submission_id=?", (submission_id,)).fetchone()
    if not s:
        raise KeyError(submission_id)
    result = json.loads(s["raw_json"])
    result["_validation"] = json.loads(s["validation_json"])
    return result

def list_submissions(con: sqlite3.Connection) -> list[dict[str, Any]]:
    rows = con.execute("""SELECT submission_id,cse_id,period_start,period_end,schema_version,
                          source_format,submission_timestamp,validation_json,processed_at,created_at
                          FROM submissions ORDER BY period_end DESC,cse_id""").fetchall()
    out=[]
    for r in rows:
        d=dict(r); d["validation"]=json.loads(d.pop("validation_json")); out.append(d)
    return out

def get_submission(con: sqlite3.Connection, sid: str) -> dict[str, Any] | None:
    r=con.execute("SELECT * FROM submissions WHERE submission_id=?", (sid,)).fetchone()
    if not r: return None
    d=dict(r); d["validation"]=json.loads(d.pop("validation_json")); d["raw"]=json.loads(d.pop("raw_json")); return d

def all_submissions(con: sqlite3.Connection) -> list[dict[str, Any]]:
    rows=con.execute("SELECT raw_json FROM submissions ORDER BY period_end,cse_id").fetchall()
    return [json.loads(r["raw_json"]) for r in rows]

def mark_processed(con: sqlite3.Connection, sid: str, now: str) -> None:
    con.execute("UPDATE submissions SET processed_at=? WHERE submission_id=?", (now,sid)); con.commit()

def replace_signals(con: sqlite3.Connection, cse_id: str, period_end: str, signals: Iterable[dict[str, Any]]) -> None:
    con.execute("DELETE FROM signals WHERE cse_id=? AND period_end=?", (cse_id,period_end))
    for s in signals:
        con.execute("""INSERT INTO signals
            (signal_id,cse_id,period_end,case_id,category,priority,score,title,rationale,
             metric_codes,baseline_json,threshold_json,evidence_json,config_version,created_at)
            VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
            (s["signal_id"],s["cse_id"],s["period_end"],s.get("case_id"),s["category"],
             s["priority"],s["score"],s["title"],s["rationale"],json.dumps(s["metric_codes"]),
             json.dumps(s["baseline"]),json.dumps(s["threshold"]),json.dumps(s["evidence"]),
             s["config_version"],s["created_at"]))
    con.commit()

def get_signals(con: sqlite3.Connection, cse_id: str, period_end: str | None=None) -> list[dict[str, Any]]:
    q="SELECT * FROM signals WHERE cse_id=?"; args=[cse_id]
    if period_end: q+=" AND period_end=?"; args.append(period_end)
    q+=" ORDER BY score DESC"
    out=[]
    for r in con.execute(q,args):
        d=dict(r)
        for k in ("metric_codes","baseline_json","threshold_json","evidence_json"):
            d[k.replace("_json","")]=json.loads(d.pop(k))
        out.append(d)
    return out

def get_signal(con: sqlite3.Connection, signal_id: str) -> dict[str, Any] | None:
    r=con.execute("SELECT * FROM signals WHERE signal_id=?", (signal_id,)).fetchone()
    if not r: return None
    d=dict(r)
    for k in ("metric_codes","baseline_json","threshold_json","evidence_json"):
        d[k.replace("_json","")]=json.loads(d.pop(k))
    return d

def insert_decision(con: sqlite3.Connection, d: dict[str, Any]) -> None:
    con.execute("""INSERT INTO decisions
        (decision_id,signal_id,case_id,decision,comment,actor_id,actor_name,created_at)
        VALUES(?,?,?,?,?,?,?,?)""",
        (d["decision_id"],d["signal_id"],d["case_id"],d["decision"],d["comment"],
         d["actor_id"],d.get("actor_name"),d["created_at"]))
    con.commit()

def insert_audit(con: sqlite3.Connection, event: dict[str, Any]) -> None:
    con.execute("""INSERT INTO audit_events
        (event_id,event_type,reference_type,reference_id,actor_id,payload_json,created_at)
        VALUES(?,?,?,?,?,?,?)""",
        (event["event_id"],event["event_type"],event["reference_type"],event["reference_id"],
         event["actor_id"],json.dumps(event["payload"]),event["created_at"]))
    con.commit()

def decisions_for_case(con: sqlite3.Connection, case_id: str) -> list[dict[str,Any]]:
    return [dict(r) for r in con.execute(
        "SELECT * FROM decisions WHERE case_id=? ORDER BY created_at", (case_id,)).fetchall()]

def records_for_case(con: sqlite3.Connection, case_id: str, entity_type: str) -> list[dict[str,Any]]:
    rows=con.execute("SELECT payload_json FROM records WHERE entity_type=? AND json_extract(payload_json,'$.case_id')=?",
                     (entity_type,case_id)).fetchall()
    return [json.loads(r["payload_json"]) for r in rows]

_ID_FIELD = {
    "assets":"asset_id","alerts":"alert_id","cases":"case_id",
    "investigation_actions":"investigation_action_id","escalations":"escalation_id",
    "remediations":"remediation_id","evidence":"evidence_id","reported_kpis":"kpi_id"
}
