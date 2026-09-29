
import json, os, unittest, tempfile
from pathlib import Path
import sys
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from sat_sa.validation import validate_submission

# Portable by default: uses the sample dataset bundled under tests/fixtures/.
# Override with SATSA_TEST_DATASET=/path/to/sample_dataset to test against a
# different dataset without editing this file.
ROOT=Path(os.environ.get("SATSA_TEST_DATASET") or Path(__file__).resolve().parent/"fixtures"/"sample_dataset")
class ValidationTests(unittest.TestCase):
    def setUp(self):
        p=ROOT/"json/CSE-ALPHA_Q3-2026.json"
        self.sub=json.loads(p.read_text())
    def test_sample_validates(self):
        v=validate_submission(self.sub,"JSON")
        self.assertTrue(v["valid"],v["errors"][:10])
        self.assertEqual(v["record_counts"]["cases"],101)
    def test_missing_closed_timestamp_is_warning(self):
        c=self.sub["cases"][0]
        old=c["status"]; old_closed=c.get("closed_at")
        c["status"]="CLOSED"; c["closed_at"]=None
        v=validate_submission(self.sub,"JSON")
        self.assertTrue(v["valid"], v["errors"][:5])
        self.assertTrue(any("missing closed_at" in x for x in v["warnings"]))
        c["status"]=old;c["closed_at"]=old_closed
    def test_broken_reference_is_error(self):
        self.sub["alerts"][0]["asset_id"]="NOPE"
        v=validate_submission(self.sub,"JSON")
        self.assertFalse(v["valid"])
        self.assertTrue(any("Broken reference" in x for x in v["errors"]))
if __name__=="__main__": unittest.main()
