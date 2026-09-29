
from pathlib import Path
import sys, os
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
p=Path(os.environ.get("SATSA_DB_PATH","data/satsa.db"))
if p.exists(): p.unlink()
print("Removed",p)
