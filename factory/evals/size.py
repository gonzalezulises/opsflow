#!/usr/bin/env python3
"""Eval: el tamaño del intake cambia el camino, nunca la política.

Corre `cmd_advance` y `required` reales de factory/bin/factory sobre jobs falsos en una carpeta
temporal, sin GitHub (gh, comentarios y labels quedan anotados). Comprueba:
- un intake sin `Size:` no avanza;
- S con clase B se trata como M;
- un job L no pasa a build sin plan aprobado, y con `## Plan` espera a una persona con el plan publicado;
- S clase A se revisa solo con código, y vuelve a exigir security si el diff resulta ser clase B;
- la retro lista la ronda que pidió cambios.

Uso: factory/evals/size.py
"""

import importlib.machinery
import importlib.util
import json
import sys
import tempfile
from pathlib import Path

FACTORY = Path(__file__).resolve().parents[1]
loader = importlib.machinery.SourceFileLoader("factory_cli", str(FACTORY / "bin" / "factory"))
spec = importlib.util.spec_from_loader("factory_cli", loader)
F = importlib.util.module_from_spec(spec)
loader.exec_module(F)
loader = importlib.machinery.SourceFileLoader("retro", str(FACTORY / "bin" / "retro"))
spec = importlib.util.spec_from_loader("retro", loader)
R = importlib.util.module_from_spec(spec)
loader.exec_module(R)

posted = []
F.gh = lambda *a, **k: ""
F.comment = lambda kind, n, body: posted.append(body)
F.label = lambda *a, **k: None
F.ensure_label = lambda *a, **k: None
F.make_clone = lambda job: None
F.changed = lambda n: ["src/lib/calculations/vsm.ts"]
F.builder_model = lambda job: "claude"
fails = 0


def check(name, ok):
    global fails
    fails += 0 if ok else 1
    print(f"{'PASA ' if ok else 'FALLA'} {name}")


def job(n, intake, stage="intake", spec_text=None):
    d = F.jdir(n)
    d.mkdir(parents=True)
    (d / "intake.md").write_text(intake)
    if spec_text:
        (d / "spec.md").write_text(spec_text)
    F.save({"issue": n, "title": "t", "stage": stage, "round": 0, "round_limit": 3, "branch": f"factory/{n}",
            "pr": None, "intake_class": None, "created": "2026-11-26T00:00:00+00:00", "history": []})


def refused(fn):
    try:
        fn()
        return False
    except F.Refused:
        return True


with tempfile.TemporaryDirectory() as tmp:
    F.JOBS = Path(tmp)
    job(1, "ACCEPT\nClass: A\n\n## Resumen\n- x\n")
    check("intake sin Size no avanza", refused(lambda: F.cmd_advance(1, "spec")))

    job(2, "ACCEPT\nClass: B\nSize: S\n\n## Resumen\n- x\n")
    F.cmd_advance(2, "spec")
    check("S con clase B se trata como M", F.load(2)["size"] == "M")

    job(3, "ACCEPT\nClass: B\nSize: L\n\n## Resumen\n- x\n")
    F.cmd_advance(3, "spec")
    (F.jdir(3) / "spec.md").write_text("# t\n\n## Acceptance\n1. x\n")
    check("L no pasa a build sin plan aprobado", refused(lambda: F.cmd_advance(3, "build")))
    check("L sin ## Plan no espera a nadie", refused(lambda: F.cmd_advance(3, "needs-human")))
    (F.jdir(3) / "spec.md").write_text("# t\n\n## Acceptance\n1. x\n\n## Plan\n- tocar vsm.ts\n")
    F.cmd_advance(3, "needs-human")
    check("L con plan espera a una persona y publica el plan",
          F.load(3)["stage"] == "needs-human" and "tocar vsm.ts" in posted[-1])
    F.cmd_feedback(3, "aprobado")
    check("el feedback aprobado lo lleva a build, ronda 1", (F.load(3)["stage"], F.load(3)["round"]) == ("build", 1))

    job(4, "ACCEPT\nClass: A\nSize: M\n\n## Resumen\n- x\n")
    F.cmd_advance(4, "spec")
    check("M no espera plan", refused(lambda: F.cmd_advance(4, "needs-human")))

    job(5, "ACCEPT\nClass: A\nSize: S\n\n## Resumen\n- x\n")
    F.cmd_advance(5, "spec")
    s = F.load(5)
    check("S clase A: solo la lente de código", [l for l, _ in F.required(s)] == ["code"])
    s["class"] = "B"  # lo que hace `merge` cuando el diff resulta más riesgoso que el intake
    check("S que el diff sube a B vuelve a exigir security", "security" in [l for l, _ in F.required(s)])

    rd = F.jdir(5) / "round-1"
    rd.mkdir()
    (rd / "gate.md").write_text("GATE: PASS\n")
    (rd / "review-code.md").write_text("VERDICT: CHANGES\n\n## Hallazgos\n- [bloqueante] base cero sin prueba\n")
    check("la retro lista la ronda que pidió cambios", "#5 ronda 1 · code CHANGES: [bloqueante] base cero sin prueba"
          in R.retro(F.JOBS))

sys.exit(1 if fails else 0)
