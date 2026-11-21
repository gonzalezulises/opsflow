#!/usr/bin/env python3
"""Eval: a run cut in the middle of a build leaves state the next run resumes.

Usage: factory/evals/interrupt.py <issue>

Starts `factory/bin/run --manual`, waits until job <issue> reaches the build
stage, kills the whole run (claude and its agents), then starts a second run.
Passes when the second run picks the job up in build (no new job, history
intact) and leaves it in a terminal or waiting stage.
"""

import json
import os
import signal
import subprocess
import sys
import time
from pathlib import Path

REPO = Path(__file__).resolve().parents[2]
RUN = [str(REPO / "factory" / "bin" / "run"), "--manual"]
WAIT_FOR_BUILD = 20 * 60
SETTLED = {"merged", "rejected", "needs-human", "needs-info"}


def stage(n):
    f = REPO / "factory" / "jobs" / str(n) / "job.json"
    return json.loads(f.read_text()) if f.exists() else None


def main(argv):
    n = int(argv[0])
    first = subprocess.Popen(RUN, cwd=REPO, start_new_session=True,
                             stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    deadline = time.time() + WAIT_FOR_BUILD
    while time.time() < deadline and first.poll() is None:
        job = stage(n)
        if job and job["stage"] == "build":
            break
        time.sleep(10)
    job = stage(n)
    if not job or job["stage"] != "build":
        os.killpg(first.pid, signal.SIGTERM)
        print(f"FALLA: el job nunca llegó a build (etapa: {job and job['stage']})")
        return 1
    time.sleep(60)  # let the builder get some work in before the cut
    os.killpg(first.pid, signal.SIGKILL)
    first.wait()
    before = stage(n)
    print(f"corte: #{n} en {before['stage']}, ronda {before['round']}, {len(before['history'])} movimientos")
    second = subprocess.run(RUN, cwd=REPO, capture_output=True, text=True)
    after = stage(n)
    resumed = after["created"] == before["created"] and after["history"][:len(before["history"])] == before["history"]
    ok = resumed and after["stage"] in SETTLED
    print(f"segunda corrida: #{n} en {after['stage']}, ronda {after['round']}")
    print(("PASA" if ok else "FALLA") + ": retomó el mismo job" if resumed else "FALLA: el job se recreó o perdió historia")
    print("\n".join(second.stdout.strip().splitlines()[-15:]))
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
