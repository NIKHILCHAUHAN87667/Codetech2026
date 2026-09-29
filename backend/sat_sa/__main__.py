from .api import run, DB_PATH
import os
if __name__ == "__main__":
    run(os.environ.get("SATSA_HOST","127.0.0.1"),int(os.environ.get("SATSA_PORT","8000")),
        os.environ.get("SATSA_DB_PATH",DB_PATH))
