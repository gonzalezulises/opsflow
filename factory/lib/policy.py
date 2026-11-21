"""Merge policy: the rules that decide whether a job may merge without a human.

Pure functions only. The models give opinions; this module decides. Its inputs
are facts read from git and from the job's evidence files, never model prose.

  classify()   risk class of a diff: A fix, B feature, C sensitive, D controls
  may_merge()  every reason the current commit can't merge (empty list = it can)

Run `python3 factory/lib/policy.py` to run its self-test.
"""

import fnmatch
import re
import json

CLASSES = "ABCD"
AUTO = {"A", "B"}  # the only classes that merge without a human


def matches(path, patterns):
    # fnmatch's `*` also matches `/`, so "src/server/auth/*" covers subfolders.
    return any(fnmatch.fnmatch(path, p) for p in patterns)


DEP_FIELDS = ("dependencies", "devDependencies", "optionalDependencies", "peerDependencies")
OPAQUE_FIELDS = ("overrides", "resolutions", "bundleDependencies", "bundledDependencies", "workspaces",
                 "packageManager", "engines")
INSTALL_SCRIPTS = ("preinstall", "install", "postinstall", "prepare", "prepack", "postpack")
PLAIN = re.compile(r"[\^~]?\d+(\.\d+){0,2}(-[0-9A-Za-z.-]+)?")  # 1, ^1.2, ~1.2.3, 1.2.3-beta.1


def dep_changes(base_pkg, head_pkg, base_lock=None, head_lock=None):
    """Added dependencies, major bumps and unreadable specs between two package.json texts.

    Majors come from the versions the lockfiles resolve when both are given, so a
    spec like `npm:x@2` or `1 || 2` can't hide a major bump. A changed spec that
    isn't a plain version is reported too: the policy can't reason about it.
    """
    def deps(text):
        if not text:
            return {}
        data = json.loads(text)
        return {k: v for field in DEP_FIELDS for k, v in data.get(field, {}).items()}

    def other(text):
        """Install-affecting fields the policy doesn't model: any change to them is reported."""
        data = json.loads(text) if text else {}
        scripts = data.get("scripts", {})
        return {**{f: data.get(f) for f in OPAQUE_FIELDS}, **{f"scripts.{s}": scripts.get(s) for s in INSTALL_SCRIPTS}}

    def resolved(lock):
        packages = json.loads(lock).get("packages", {}) if lock else {}
        return {k[len("node_modules/"):]: v.get("version", "") for k, v in packages.items()
                if k.startswith("node_modules/") and "/node_modules/" not in k}

    def major(version):
        digits = version.lstrip("^~>=< v").split(".")[0]
        return int(digits) if digits.isdigit() else None

    base, head = deps(base_pkg), deps(head_pkg)
    added = sorted(set(head) - set(base))
    unreadable = sorted(n for n in set(head) & set(base)
                        if head[n] != base[n] and not PLAIN.fullmatch(head[n]))
    unreadable += sorted(f for f, v in other(head_pkg).items() if v != other(base_pkg).get(f))
    base_v, head_v = (resolved(base_lock), resolved(head_lock)) if base_lock and head_lock else (base, head)
    bumped = sorted(n for n in set(head) & set(base)
                    if major(head_v.get(n, "")) is not None and major(base_v.get(n, "")) is not None
                    and major(head_v[n]) > major(base_v[n]))
    return added, bumped, unreadable


def lock_changes(base_lock, head_lock):
    """Packages new to the lockfile and majors that went up, per install path (transitive included)."""
    def by_path(lock):
        out = {}
        for key, entry in (json.loads(lock).get("packages", {}) if lock else {}).items():
            if "node_modules/" in key:
                digits = str(entry.get("version", "")).split(".")[0]
                out[key] = (key.rsplit("node_modules/", 1)[1], int(digits) if digits.isdigit() else -1)
        return out

    base, head = by_path(base_lock), by_path(head_lock)
    base_majors = {}
    for name, major in base.values():
        base_majors.setdefault(name, set()).add(major)
    new, up = set(), set()
    for path, (name, major) in head.items():
        if name not in base_majors:
            new.add(name)
        elif path in base and major > base[path][1]:
            up.add(name)  # this install moved to a higher major
        elif path not in base and major not in base_majors[name]:
            up.add(name)  # a new install of a major the base never had
    return sorted(new), sorted(up)


def classify(paths, config, intake_class="B", base_pkg=None, head_pkg=None, base_lock=None, head_lock=None):
    """Return (class, reasons). Paths and dependencies can raise intake's class, never lower it."""
    if intake_class not in CLASSES:
        intake_class = "C"  # an unreadable intake is treated as sensitive
    found, reasons = intake_class, [f"intake: {intake_class}"]

    def raise_to(cls, why):
        nonlocal found
        reasons.append(why)
        if CLASSES.index(cls) > CLASSES.index(found):
            found = cls

    for path in paths:
        if matches(path, config["classes"]["D"]):
            raise_to("D", f"{path}: control de la fábrica")
        elif matches(path, config["classes"]["C"]):
            raise_to("C", f"{path}: ruta sensible")
    scripts = lambda text: json.loads(text).get("scripts", {}) if text else {}
    if scripts(base_pkg) != scripts(head_pkg):  # checks.sh runs these: changing them changes the checks
        raise_to("D", "package.json: cambian los scripts que corren las verificaciones")
    added, bumped, unreadable = dep_changes(base_pkg, head_pkg, base_lock, head_lock)
    for name in added:
        raise_to("C", f"dependencia nueva: {name}")
    for name in bumped:
        raise_to("C", f"cambio de versión mayor: {name}")
    for name in unreadable:
        raise_to("C", f"versión que la política no sabe leer: {name}")
    if base_lock and head_lock:
        new, up = lock_changes(base_lock, head_lock)
        for name in new:
            raise_to("C", f"paquete nuevo en el lockfile: {name}")
        for name in up:
            raise_to("C", f"versión mayor nueva en el lockfile: {name}")
    return found, reasons


def may_merge(cls, evidence, current):
    """Reasons the job can't merge now. Empty means the policy allows it.

    evidence: {"gate": {"sha", "checks", "acceptance", "protected"},
               "reviews": {lens: {"fingerprint", "verdict"}},
               "required": [lens, ...],
               "decision": {"fingerprint", "verdict"} or None}
    current:  {"sha", "fingerprint"} of the branch as it would merge.
    """
    reasons = []
    if cls not in AUTO:
        reasons.append(f"clase {cls}: la decide una persona")
    gate = evidence.get("gate") or {}
    if gate.get("sha") != current["sha"]:
        reasons.append("el gate no corrió sobre el commit que se fusionaría")
    if gate.get("checks") != "PASS":
        reasons.append("los checks no pasaron")
    if gate.get("protected"):
        reasons.append("el diff toca controles de la fábrica")
    if gate.get("acceptance") not in {"PASS", "EXEMPT"}:
        reasons.append("falta la prueba de aceptación (falla antes del cambio, pasa después)")
    for lens in evidence.get("required", []):
        review = (evidence.get("reviews") or {}).get(lens)
        if not review:
            reasons.append(f"falta la revisión {lens}")
        elif review.get("fingerprint") != current["fingerprint"]:
            reasons.append(f"la revisión {lens} es de otra versión del cambio")
        elif review.get("verdict") != "PASS":
            reasons.append(f"la revisión {lens} no aprobó")
    decision = evidence.get("decision") or {}
    if decision.get("verdict") != "APPROVE":
        reasons.append("el approver no aprobó")
    elif decision.get("fingerprint") != current["fingerprint"]:
        reasons.append("la aprobación es de otra versión del cambio")
    return reasons


def _self_test():
    config = {"classes": {"D": ["factory/*", ".github/*"], "C": ["src/server/auth/*"]}}
    assert classify(["src/lib/x.ts"], config, "A")[0] == "A"
    assert classify(["src/lib/x.ts"], config, "Z")[0] == "C"
    assert classify(["src/server/auth/roles.ts"], config, "A")[0] == "C"
    assert classify([".github/workflows/ci.yml", "src/server/auth/a.ts"], config, "A")[0] == "D"
    assert classify(["src/lib/x.ts"], config, "C")[0] == "C"  # paths never lower intake
    pkg = lambda deps: json.dumps({"dependencies": deps})
    assert classify(["package.json"], config, "A", pkg({"a": "^1.0.0"}), pkg({"a": "^1.2.0"}))[0] == "A"
    assert classify(["package.json"], config, "A", pkg({"a": "^1.0.0"}), pkg({"a": "^2.0.0"}))[0] == "C"
    assert classify(["package.json"], config, "A", pkg({}), pkg({"b": "1.0.0"}))[0] == "C"
    for spec in ("npm:a@2.0.0", "1.0.0 || 2.0.0", "*"):  # specs that hid a major bump (audit 2026-11-21)
        assert classify(["package.json"], config, "A", pkg({"a": "1.0.0"}), pkg({"a": spec}))[0] == "C"
    assert classify(["package.json"], config, "A", pkg({}),
                    json.dumps({"optionalDependencies": {"x": "1.0.0"}}))[0] == "C"  # audit round 2
    assert classify(["package.json"], config, "A", json.dumps({"scripts": {}}),
                    json.dumps({"scripts": {"postinstall": "node x.js"}}))[0] == "D"
    assert classify(["package.json"], config, "A", json.dumps({"scripts": {"test": "vitest run"}}),
                    json.dumps({"scripts": {"test": "true"}}))[0] == "D"  # audit round 3
    two = lambda a, b: (json.dumps({"packages": {"node_modules/x/node_modules/t": {"version": a}}}),
                        json.dumps({"packages": {"node_modules/x/node_modules/t": {"version": b}}}))
    assert classify(["package-lock.json"], config, "A", None, None, *two("1.2.0", "2.0.0"))[0] == "C"  # audit round 4
    assert classify(["package-lock.json"], config, "A", None, None, *two("1.2.0", "1.3.0"))[0] == "A"
    coexist = lambda a: json.dumps({"packages": {"node_modules/a/node_modules/t": {"version": a},
                                                 "node_modules/b/node_modules/t": {"version": "3.0.0"}}})
    assert classify(["package-lock.json"], config, "A", None, None, coexist("1.0.0"), coexist("2.0.0"))[0] == "C"  # round 5
    lock = lambda v: json.dumps({"packages": {"node_modules/a": {"version": v}}})
    assert classify(["package.json"], config, "A", pkg({"a": "^1.0.0"}), pkg({"a": "^1.0.0"}),
                    lock("1.4.0"), lock("2.0.0"))[0] == "C"  # the lockfile resolved a new major

    cur = {"sha": "s1", "fingerprint": "f1"}
    good = {"gate": {"sha": "s1", "checks": "PASS", "acceptance": "PASS", "protected": []},
            "required": ["code"], "reviews": {"code": {"fingerprint": "f1", "verdict": "PASS"}},
            "decision": {"fingerprint": "f1", "verdict": "APPROVE"}}
    assert may_merge("A", good, cur) == []
    assert may_merge("C", good, cur)
    assert may_merge("B", good, {"sha": "s2", "fingerprint": "f1"})  # code changed after the gate
    assert may_merge("B", good, {"sha": "s1", "fingerprint": "f2"})  # reviews are stale
    assert may_merge("A", {**good, "gate": {**good["gate"], "acceptance": "FAIL"}}, cur)
    assert may_merge("A", {**good, "reviews": {}}, cur)
    assert may_merge("A", {**good, "decision": None}, cur)
    print("policy: self-test OK")


if __name__ == "__main__":
    _self_test()
