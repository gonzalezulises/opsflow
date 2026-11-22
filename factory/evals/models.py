#!/usr/bin/env python3
"""Eval: which OpenCode Go models can build and audit class A/B jobs.

Builder: each model rebuilds #40 and #47 from the commit before their merge, with
the real spec, confined by sandbox-exec to its clone. It is graded by the test the
merged PR added (hidden from it), plus lint, typecheck and the full test suite,
and by the merge policy on the files it touched.

Auditor: each model reviews, read-only, a change with a planted defect (expected
CHANGES) and the merged change of #47 (expected PASS), with the factory's code prompt.

Usage: factory/evals/models.py [model ...]   (default: the four below)
Results: ~/.factory-gates/<repo>/models/results.json and a table on stdout.
"""

import json
import os
import re
import shutil
import subprocess
import sys
import time
from pathlib import Path

REPO = Path(__file__).resolve().parents[2]
FACTORY = REPO / "factory"
sys.path.insert(0, str(FACTORY / "lib"))
import policy  # noqa: E402

OPENCODE = Path.home() / ".opencode/bin/opencode"
WORK = Path.home() / ".factory-gates" / REPO.name / "models"
MODELS = ["kimi-k2.7-code", "glm-5.3", "minimax-m3", "qwen3.7-plus"]
CASES = {  # issue: (squash merge commit, hidden test)
    40: ("066938fe84c58a891cb0eac8bb02301f47f4c945", "src/lib/calculations/__tests__/tracking.test.ts"),
    47: ("cf0e4ad3c4b846321d3d2631db7808ae2db320d7", "src/lib/calculations/__tests__/vsm.test.ts"),
}
CONFIG = json.loads((FACTORY / "config.json").read_text())
HOME = Path.home().resolve()


def sh(*cmd, cwd=REPO, check=True):
    return subprocess.run(cmd, cwd=cwd, capture_output=True, text=True, check=check).stdout


def profile(writable, network=True, frozen=()):
    """Writes only to `writable` (never `frozen`), no credentials besides OpenCode's own, network only if asked."""
    q = lambda p: str(p).replace("\\", "\\\\").replace('"', '\\"')
    secrets = [HOME / p for p in (".ssh", ".codex", ".claude", ".aws", ".git-credentials", ".netrc", ".npmrc",
                                  ".config", "Library", ".local/share", ".docker", ".kube", ".gnupg", ".agents",
                                  ".gemini", ".cursor", ".codeium", ".zsh_history", ".bash_history")]
    readable = [HOME / ".config/opencode", HOME / ".local/share/opencode",
                HOME / ".local/share/fnm"]  # fnm keeps every Node version there
    own = [HOME / ".local/share/opencode", HOME / ".local/state/opencode", HOME / ".cache/opencode",
           HOME / ".bun", Path(os.environ.get("TMPDIR", "/tmp")).resolve(), Path("/dev")]
    return ("(version 1)(allow default)(deny file-write*)"
            "(allow file-write* " + " ".join(f'(subpath "{q(p)}")' for p in [*writable, *own]) + ")"
            + ("(deny file-write* " + " ".join(f'(subpath "{q(p)}")' for p in frozen) + ")" if frozen else "")
            + "(deny file-read-data " + " ".join(f'(subpath "{q(p)}")' for p in secrets) + ")"
            '(deny file-read* (regex #"/\\.env(\\.[^/]*)?$"))(allow file-read* (regex #"/\\.env\\.example$"))'
            "(allow file-read-data " + " ".join(f'(subpath "{q(p)}")' for p in readable) + ")"
            '(deny job-creation)(deny appleevent-send)'
            '(deny mach-lookup (global-name "com.apple.SecurityServer") (global-name "com.apple.securityd")'
            ' (global-name "com.apple.securityd.xpc"))'
            '(deny mach-lookup (global-name "com.apple.coreservices.launchservicesd") (global-name "com.apple.lsd.mapdb"))'
            + ("" if network else "(deny network*)"))


def clean_env():
    return {k: os.environ[k] for k in ("PATH", "HOME", "TMPDIR", "LANG", "TERM") if k in os.environ}


def opencode(model, where, prompt, writable, timeout):
    """One headless OpenCode run; returns (last text, tokens, cost, seconds, error)."""
    t0 = time.time()
    cmd = ["sandbox-exec", "-p", profile(writable), str(OPENCODE), "run", "--pure", "--auto", "--format", "json",
           "-m", f"opencode-go/{model}", "--dir", str(where), prompt]
    try:
        # stdin closed: with a pipe left open, `opencode run` waits on it before starting
        res = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout, env=clean_env(),
                             stdin=subprocess.DEVNULL)
        out, err = res.stdout, (res.stderr.strip()[-300:] if res.returncode else "")
    except subprocess.TimeoutExpired as e:
        out, err = (e.stdout or b"").decode() if isinstance(e.stdout, bytes) else (e.stdout or ""), "tiempo agotado"
    texts, tokens, cost = [], 0, 0.0
    for line in out.splitlines():
        try:
            ev = json.loads(line)
        except ValueError:
            continue
        part = ev.get("part", {})
        if ev.get("type") == "text":
            texts.append(part.get("text", ""))
        if ev.get("type") == "step_finish":
            tokens += part.get("tokens", {}).get("total", 0)
            cost += part.get("cost", 0) or 0
        if ev.get("type") == "error":
            err = json.dumps(ev.get("error", ev))[:300]
    return (texts[-1] if texts else ""), tokens, round(cost, 3), round(time.time() - t0), err


def clone(dest, sha):
    shutil.rmtree(dest, ignore_errors=True)
    sh("git", "clone", "-q", "--shared", "--no-checkout", str(REPO), str(dest))
    sh("git", "checkout", "-q", "--detach", sha, cwd=dest)
    sh("git", "config", "user.name", "factory-eval", cwd=dest)
    sh("git", "config", "user.email", "eval@localhost", cwd=dest)
    sh("git", "config", "core.hooksPath", "/dev/null", cwd=dest)
    # same lockfile as the main checkout: an APFS clone of its node_modules instead of npm ci
    assert not sh("git", "diff", "--name-only", sha, "HEAD", "--", "package-lock.json"), "lockfile differs"
    subprocess.run(["cp", "-cR", str(REPO / "node_modules"), str(dest / "node_modules")], check=True)


SAFE_GIT = "git -c core.fsmonitor= -c core.hooksPath=/dev/null -c core.sshCommand=false"


def checked(dest, cmd, timeout=600, tail=1500):
    """The model's code: confined, no network, node_modules frozen, npm's shell imposed (not an .npmrc's)."""
    env = {**clean_env(), "npm_config_script_shell": "/bin/sh", "npm_config_userconfig": "/dev/null"}
    res = subprocess.run(["sandbox-exec", "-p", profile([dest], network=False, frozen=[dest / "node_modules"]), *cmd],
                         cwd=dest, capture_output=True, text=True, timeout=timeout, env=env, stdin=subprocess.DEVNULL)
    if tail is None:
        return res.returncode == 0, res.stdout
    return res.returncode == 0, (res.stdout + res.stderr)[-tail:]


def builder_prompt(clone_dir, job_dir, n):
    body = (REPO / ".claude/agents/builder.md").read_text().split("---", 2)[2]
    return (f"Clon: {clone_dir}. Carpeta del job: {job_dir}/. Issue #{n}. Ronda 1. Clase B.\n"
            f"Usa la herramienta de edición de archivos para cambiar código; los comandos los corres en {clone_dir}.\n"
            + body)


def build_case(model, n):
    merge, hidden = CASES[n]
    base = sh("git", "rev-parse", f"{merge}^").strip()
    tag = f"{model}-{n}"
    dest, job = WORK / tag, WORK / f"{tag}-job"
    clone(dest, base)
    shutil.rmtree(job, ignore_errors=True)
    job.mkdir(parents=True)
    for f in ("issue.md", "intake.md", "spec.md"):
        shutil.copy(FACTORY / "jobs" / str(n) / f, job / f)
    text, tokens, cost, secs, err = opencode(model, dest, builder_prompt(dest, job, n), [dest, job], 1500)
    # Everything after the build treats the clone as hostile: git runs confined with its config
    # overridden (fsmonitor, hooks), and grading happens in a fresh clone that gets only the patch.
    ok, patch = checked(dest, ["bash", "-c", f"{SAFE_GIT} add -A && {SAFE_GIT} diff --no-ext-diff --no-textconv --cached --binary {base}"],
                        tail=None)
    if not ok:  # a harness failure must not read as "the model changed nothing"
        err = err or "no se pudo leer el cambio del clon"
    grade = WORK / f"{tag}-grade"
    clone(grade, base)
    patch_file = WORK / f"{tag}.patch"
    patch_file.write_text(patch if ok else "")
    applied, log_apply = checked(grade, ["bash", "-c", f"test ! -s {patch_file} || {SAFE_GIT} apply --index {patch_file}"])
    _, names = checked(grade, ["bash", "-c", f"{SAFE_GIT} diff --no-ext-diff --cached --name-only {base}"], tail=None)
    files = [f for f in names.split() if f] if applied else []
    cls, why = policy.classify(files, CONFIG, "B") if files else ("-", [])
    # the merged PR's test, under another name; copied in confined, so a planted symlink can't redirect it
    hidden_rel = hidden.replace(".test.ts", ".hidden-eval.test.ts")
    src_test = WORK / f"{tag}.hidden.ts"
    src_test.write_text(sh("git", "show", f"{merge}:{hidden}"))
    checked(grade, ["bash", "-c", f"rm -f {hidden_rel} && cp {src_test} {hidden_rel}"])
    ok_hidden, log_hidden = checked(grade, ["npx", "vitest", "run", hidden_rel]) if applied else (False, log_apply)
    checked(grade, ["rm", "-f", hidden_rel])
    ok_checks, log_checks = (checked(grade, ["bash", "-c", "npm run lint && npm run typecheck && npm run test"])
                             if applied else (False, log_apply))
    status = (job / "build.md").read_text().split("\n", 1)[0] if (job / "build.md").exists() else "sin build.md"
    return {"model": model, "case": f"#{n}", "role": "builder", "hidden_test": ok_hidden, "checks": ok_checks,
            "class": cls, "class_why": why, "files": files, "status": status, "tokens": tokens, "cost": cost,
            "seconds": secs, "error": err, "last_text": text[-400:],
            "log_hidden": "" if ok_hidden else log_hidden, "log_checks": "" if ok_checks else log_checks}


def audit_views():
    """(name, checkout, base sha, spec, expected verdict) for the two audits, built once."""
    views = []
    real = WORK / "audit-real"
    merge = CASES[47][0]
    clone(real, merge)
    views.append(("real #47", real, f"{merge}^", (FACTORY / "jobs/47/spec.md").read_text(), "PASS"))
    planted = WORK / "audit-planted"
    clone(planted, sh("git", "rev-parse", "origin/main").strip())
    import planted_defect as pd  # same defect and spec as the Codex eval
    src = planted / "src/lib/calculations/waste.ts"
    t = src.read_text()
    t = t.replace("  totalCostMonthly: number;\n}", "  totalCostMonthly: number;\n  totalCostYearly: number;\n}", 1)
    t = t.replace("    totalCostMonthly: round(totalCostMonthly),\n", "    totalCostMonthly: round(totalCostMonthly),\n"
                  "    totalCostYearly: round(laborCostMonthly * 12),\n", 1)
    assert "totalCostYearly: round(laborCostMonthly" in t, "planted defect no longer applies"
    src.write_text(t)
    test = planted / "src/lib/calculations/__tests__/waste.test.ts"
    test.write_text(test.read_text() + """
describe("totalCostYearly", () => {
  it("is twelve months of the total cost", () => {
    const r = calculateWasteCost({ frequencyPerWeek: 2, minutesLostPerEvent: 30, hourlyLaborCost: 10 });
    expect(r.totalCostYearly).toBe(Math.round(r.totalCostMonthly * 12 * 100) / 100);
  });
});
""")
    sh("git", "commit", "-qam", "feat: yearly waste cost", cwd=planted)
    views.append(("defecto plantado", planted, "HEAD^", pd.SPEC, "CHANGES"))
    return views


def audit_case(model, view):
    name, where, base, spec, expected = view
    diff = sh("git", "diff", f"{base}..HEAD", "--", ".", ":!node_modules", cwd=where)
    prompt = (f"Checkout con el cambio: {where}. Base: {base}. Ronda 1.\n\n"
              + (FACTORY / "prompts/code.md").read_text()
              + f"\n\nNo hay carpeta del job: la spec y el diff van aquí.\n\n## spec.md\n{spec}\n\n## diff\n```diff\n{diff}```\n\n"
              "Corres en modo solo lectura. Tu último mensaje es el contenido completo del archivo, "
              "empezando por la primera línea exigida, sin nada antes ni después.")
    text, tokens, cost, secs, err = opencode(model, where, prompt, [], 900)
    first = text.strip().split("\n", 1)[0].strip()
    found = re.search(r"VERDICT: (PASS|CHANGES)", text)
    verdict = found.group(1) if found else "sin veredicto"
    return {"model": model, "case": name, "role": "auditor", "expected": expected, "verdict": verdict,
            "correct": verdict == expected, "format_ok": bool(re.fullmatch(r"VERDICT: (PASS|CHANGES)", first)),
            "tokens": tokens, "cost": cost, "seconds": secs, "error": err, "review": text[:1500]}


def main(argv):
    models = argv or MODELS
    WORK.mkdir(parents=True, exist_ok=True)
    results = []
    views = audit_views()
    for m in models:
        for n in CASES:
            r = build_case(m, n)
            results.append(r)
            print(f"{m:16} builder {r['case']:5} oculta={'PASA' if r['hidden_test'] else 'FALLA'} "
                  f"checks={'PASA' if r['checks'] else 'FALLA'} clase={r['class']} {r['seconds']}s "
                  f"{r['tokens']} tok ${r['cost']} {r['error'][:80]}", flush=True)
        for v in views:
            r = audit_case(m, v)
            results.append(r)
            print(f"{m:16} auditor {r['case']:17} esperado={r['expected']} obtuvo={r['verdict']} "
                  f"formato={'ok' if r['format_ok'] else 'NO'} {r['seconds']}s ${r['cost']} {r['error'][:80]}", flush=True)
        (WORK / "results.json").write_text(json.dumps(results, indent=2, ensure_ascii=False) + "\n")
    print(f"detalle: {WORK / 'results.json'}")


if __name__ == "__main__":
    main(sys.argv[1:])
