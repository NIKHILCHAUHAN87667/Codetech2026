
import json, os, unittest, sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from sat_sa.api import SATSAService

# Portable by default: uses the sample dataset bundled under tests/fixtures/.
# Override with SATSA_TEST_DATASET=/path/to/sample_dataset to test against a
# different dataset without editing this file.
ROOT=Path(os.environ.get("SATSA_TEST_DATASET") or Path(__file__).resolve().parent/"fixtures"/"sample_dataset")
class ServiceTests(unittest.TestCase):
    def test_full_batch_and_case_api(self):
        svc=SATSAService(":memory:")
        for p in sorted((ROOT/"json").glob("*.json")):
            svc.ingest(json.loads(p.read_text()),p.read_text(),"JSON")
        svc.process_all()
        d=svc.dashboard("Q3-2026")
        self.assertEqual(d["stats"]["cse_assessed"],6)
        detail=svc.case_detail("CASE-1042")
        self.assertIsNotNone(detail)
        self.assertEqual(detail["case_id"],"CASE-1042")
        self.assertTrue(detail["signals"])
        report=svc.report("CSE-ALPHA","Q3-2026")
        self.assertEqual(report["metrics_calculated"],8)
    def test_decision_audit(self):
        svc=SATSAService(":memory:")
        for p in sorted((ROOT/"json").glob("*.json")):
            svc.ingest(json.loads(p.read_text()),p.read_text(),"JSON")
        svc.process_all()
        d=svc.decision("CASE-1042",{"decision":"Request further review","comment":"Need more evidence.","actor_id":"SUP-2741"})
        self.assertTrue(d["decision_id"].startswith("DEC-"))
        self.assertEqual(len(svc.case_detail("CASE-1042")["decisions"]),1)
if __name__=="__main__": unittest.main()
