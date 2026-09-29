
import json, os, unittest, sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from sat_sa.api import SATSAService
from sat_sa.analytics import compute_metrics

# Portable by default: uses the sample dataset bundled under tests/fixtures/.
# Override with SATSA_TEST_DATASET=/path/to/sample_dataset to test against a
# different dataset without editing this file.
ROOT=Path(os.environ.get("SATSA_TEST_DATASET") or Path(__file__).resolve().parent/"fixtures"/"sample_dataset")
class MetricsTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.subs=[json.loads(p.read_text()) for p in (ROOT/"json").glob("*.json")]
        cls.svc=SATSAService(":memory:")
    def test_anchor_case_is_fast(self):
        s=next(x for x in self.subs if x["cse"]["cse_id"]=="CSE-ALPHA" and x["submission_metadata"]["assessment_period_end"].startswith("2026-09"))
        m,_=compute_metrics(s,self.subs,self.svc.config)
        tt=m["TTCP"]["case_values"]["CASE-1042"]
        ic=m["ICS"]["case_values"]["CASE-1042"]
        self.assertLessEqual(tt[3],20.0)
        self.assertLess(ic["value"],70.0)
    def test_charlie_negative_space(self):
        s=next(x for x in self.subs if x["cse"]["cse_id"]=="CSE-CHARLIE" and x["submission_metadata"]["assessment_period_end"].startswith("2026-09"))
        m,_=compute_metrics(s,self.subs,self.svc.config)
        self.assertGreaterEqual(m["CAMG"]["value"],10.0)
        self.assertGreaterEqual(len(m["CAMG"]["affected_asset_ids"]),1)
    def test_all_eight_metrics_present(self):
        for s in self.subs:
            m,_=compute_metrics(s,self.subs,self.svc.config)
            self.assertEqual(set(m),{"OSEC","CAMG","TTCP","ICS","ER","PRR","CEMR","KECG"})
if __name__=="__main__": unittest.main()
