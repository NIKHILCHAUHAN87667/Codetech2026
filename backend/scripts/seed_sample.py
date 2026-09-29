
#!/usr/bin/env python3
from __future__ import annotations
import json, sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from sat_sa.api import SATSAService

def main():
    if len(sys.argv)!=2:
        print("Usage: python scripts/seed_sample.py <sample_dataset_root_or_json_dir>")
        raise SystemExit(2)
    root=Path(sys.argv[1])
    json_dir=root/"json" if (root/"json").is_dir() else root
    files=sorted(json_dir.glob("*.json"))
    if not files:
        raise SystemExit(f"No JSON submissions found in {json_dir}")
    svc=SATSAService()
    ok=bad=0
    for f in files:
        if f.name=="ground_truth_signals.json": continue
        sub=json.loads(f.read_text())
        v=svc.ingest(sub,f.read_text(),"JSON")
        if v["valid"]: ok+=1
        else:
            bad+=1
            print("INVALID",f.name,v["errors"][:5])
    n=svc.process_all()
    print(f"Ingested valid={ok}, invalid={bad}; processed={n}")
    dash=svc.dashboard("Q3-2026")
    print(json.dumps(dash,indent=2))
    print("\nQ3 signals:")
    for row in svc.worklist({"period":["Q3-2026"]})["rows"]:
        print(row["priority"],row["cse"],row["id"],row["category"],round(row["priority_score"],1))
if __name__=="__main__": main()
