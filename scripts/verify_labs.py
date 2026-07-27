#!/usr/bin/env python3
"""Regression check for the simulated attack lab feature.

Drives the real running API (no test framework, no extra dependencies — matching
this repo's script-driven validation style) to prove the load-bearing safety and
authorization rules hold:

- Section lab mode gates assignment creation and attempt start.
- Lab events accept only sanitized, synthetic labels (forbidden keys rejected).
- The generic draft endpoint refuses direct ``lab_events`` writes.
- Surprise/transparent activity filtering hides the debrief until it unlocks.
- Submit requires lab analysis; auto-check scores completeness only.
- Cross-student and cross-section access is blocked.
- Reset clears ``lab_events`` but preserves submitted analysis.

Usage:
    # 1. docker compose up -d && python -m backend.seed_course
    # 2. uvicorn backend.main:app --port 8000
    # 3. python scripts/verify_labs.py            (or BASE_URL=... python scripts/verify_labs.py)
"""

from __future__ import annotations

import json
import os
import sys
import urllib.error
import urllib.request

BASE = os.environ.get("BASE_URL", "http://127.0.0.1:8000").rstrip("/")

TEACHER = ("teacher@baisedu.org", "cipher-dev-2026")
ALEX = ("alex@baisedu.org", "cipher-dev-2026")
TAYLOR = ("taylor@baisedu.org", "cipher-student-2026")

PASS = 0
FAIL = 0


def req(method, path, token=None, body=None):
    data = json.dumps(body).encode() if body is not None else None
    r = urllib.request.Request(BASE + path, data=data, method=method)
    r.add_header("content-type", "application/json")
    if token:
        r.add_header("authorization", f"Bearer {token}")
    try:
        with urllib.request.urlopen(r) as resp:
            return resp.status, json.loads(resp.read() or "null")
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read() or "null")


def login(email, pw):
    status, body = req("POST", "/auth/login", body={"email": email, "password": pw})
    if status != 200:
        sys.exit(f"login failed for {email}: {body}")
    return body["access_token"]


def check(name, cond, extra=""):
    global PASS, FAIL
    if cond:
        PASS += 1
        print("PASS", name)
    else:
        FAIL += 1
        print("FAIL", name, "->", extra)


def find_lab(missions_body, title_fragment):
    for group in missions_body["groups"]:
        for mission in group["missions"]:
            if title_fragment in mission["title"]:
                return mission["id"], mission.get("assignment_id")
    return None, None


def main():
    teacher = login(*TEACHER)
    alex = login(*ALEX)
    taylor = login(*TAYLOR)

    # --- Teacher settings / catalog / summary ---
    s, b = req("GET", "/teacher/labs/sections/3/settings", teacher)
    check("teacher reads settings", s == 200 and b["settings"]["enabled"] is True, b)

    s, b = req("GET", "/teacher/labs/catalog?section_id=3", teacher)
    labs_count = sum(len(g["labs"]) for g in b["groups"]) if s == 200 else 0
    check("catalog lists 5 labs", labs_count == 5, (s, labs_count))

    s, summary = req("GET", "/teacher/labs/summary?section_id=3", teacher)
    check("summary aggregates present", s == 200 and summary["completed"] >= 1, summary)
    check("summary excludes secrets", "dummy_identity" not in json.dumps(summary).lower(), summary)

    # --- Authorization ---
    s, _ = req("GET", "/teacher/labs/sections/3/settings", taylor)
    check("student blocked from lab admin", s == 403, s)
    s, _ = req("GET", "/teacher/labs/sections/999/settings", teacher)
    check("missing section 404", s == 404, s)

    # --- Assignment gating on a lab-disabled section (Period 1 = id 1) ---
    s, cat1 = req("GET", "/teacher/labs/catalog?section_id=1", teacher)
    check("section 1 lab disabled", cat1.get("lab_enabled") is False, cat1)
    lab_mission_id = cat1["groups"][0]["labs"][0]["id"]
    s, _ = req("POST", "/teacher/labs/assignments", teacher,
               {"mission_id": lab_mission_id, "section_id": 1, "disclosure_mode": "transparent"})
    check("assign blocked when lab mode off", s == 403, s)
    s, _ = req("POST", "/teacher/labs/assignments", teacher,
               {"mission_id": 1, "section_id": 3, "disclosure_mode": "transparent"})
    check("non-lab mission rejected", s == 400, s)

    # --- Student sees + starts an assigned lab ---
    s, missions = req("GET", "/missions", taylor)
    mission_id, assignment_id = find_lab(missions, "Traffic Anomaly")
    check("assigned lab visible to student", mission_id is not None)

    s, ws = req("POST", "/attempts", taylor, {"mission_id": mission_id, "assignment_id": assignment_id})
    check("student starts lab", s in (200, 201), (s, ws))
    attempt_id = ws["attempt"]["id"]
    act = ws["activity"]
    check("debrief hidden pre-event",
          act.get("debrief") is None and act.get("debrief_unlocked") is False, act)
    check("debrief trigger withheld", "unlocks_debrief" not in act.get("event_schema", {}), act)

    # --- Sanitization ---
    s, _ = req("PATCH", f"/attempts/{attempt_id}/draft", taylor,
               {"evidence_type": "lab_events", "payload": {"x": 1}})
    check("draft lab_events blocked", s == 422, s)
    for bad in ({"event_type": "board_reviewed", "password": "x"},
                {"event_type": "board_reviewed", "metadata": {"raw": "typed"}},
                {"event_type": "totally_made_up"},
                {"event_type": "board_reviewed", "indicator_ids": ["nope"]}):
        s, _ = req("POST", f"/attempts/{attempt_id}/lab-events", taylor, bad)
        check(f"rejects unsafe event {list(bad)[1:] or ['bad-type']}", s == 422, (s, bad))

    # --- Clients cannot force a debrief unlock (P1) ---
    s, b = req("POST", f"/attempts/{attempt_id}/lab-events", taylor,
               {"event_type": "flow_classified", "metadata": {"debrief_unlocked": True}})
    check("metadata debrief_unlocked rejected", s == 422, (s, b))
    s, b = req("POST", f"/attempts/{attempt_id}/lab-events", taylor, {"event_type": "flow_classified"})
    check("non-unlock event keeps debrief hidden",
          s == 201 and b["activity"]["debrief_unlocked"] is False, (s, b))

    # --- A dummy identity id is rejected on labs that don't define one (P2a) ---
    s, b = req("POST", f"/attempts/{attempt_id}/lab-events", taylor,
               {"event_type": "flow_classified", "dummy_identity_id": "sneaky"})
    check("unconfigured dummy identity rejected", s == 422, (s, b))

    # --- Valid unlock event reveals debrief ---
    s, b = req("POST", f"/attempts/{attempt_id}/lab-events", taylor,
               {"event_type": "rule_proposed", "indicator_ids": ["unexpected_pair"]})
    check("valid event unlocks debrief",
          s == 201 and b["activity"]["debrief_unlocked"] is True and b["activity"]["debrief"], (s, b))

    # --- Multi-section student resolves to an enabled-section assignment (P2) ---
    jordan = login("jordan@baisedu.org", "cipher-student-2026")
    # Jordan is enrolled in Period 1 (id 1, lab-disabled) and Period 3 (id 3, enabled).
    # Give Period 1 the same lab, then disable it, so a start with no assignment_id
    # must still resolve to the enabled Period 3 assignment.
    req("PATCH", "/teacher/labs/sections/1/settings", teacher, {"enabled": True})
    req("POST", "/teacher/labs/assignments", teacher,
        {"mission_id": mission_id, "section_id": 1, "disclosure_mode": "transparent"})
    req("PATCH", "/teacher/labs/sections/1/settings", teacher, {"enabled": False})
    s, ws2 = req("POST", "/attempts", jordan, {"mission_id": mission_id})
    check("multi-section student starts via enabled section", s in (200, 201), (s, ws2))

    # --- Submit requires analysis; auto-check is completeness-only ---
    s, _ = req("POST", f"/attempts/{attempt_id}/submit", taylor)
    check("submit blocked without analysis", s == 400, s)
    req("PATCH", f"/attempts/{attempt_id}/draft", taylor,
        {"evidence_type": "lab_analysis",
         "payload": {"mitigation_choice_ids": ["default_deny"], "noticed_indicator_ids": ["unexpected_pair"],
                     "responses": {"identify_anomaly": "a", "explain_risk": "b", "best_change": "c"}}})
    s, b = req("POST", f"/attempts/{attempt_id}/submit", taylor)
    check("submit ok with analysis", s == 200 and b.get("auto_check") is not None, (s, b))

    # --- Cross-student access blocked ---
    s, _ = req("GET", f"/attempts/{attempt_id}", alex)
    check("cross-student attempt blocked", s == 403, s)

    # --- Reset clears events, preserves analysis ---
    s, _ = req("POST", "/teacher/labs/reset", teacher,
               {"section_id": 3, "assignment_id": assignment_id, "confirm": False})
    check("reset requires confirm", s == 400, s)
    s, _ = req("POST", "/teacher/labs/reset", teacher,
               {"section_id": 3, "assignment_id": assignment_id, "confirm": True})
    check("reset ok", s == 200, s)
    s, review = req("GET", f"/teacher/attempts/{attempt_id}", teacher)
    etypes = [e["evidence_type"] for e in review.get("evidence", [])]
    check("reset cleared lab_events", "lab_events" not in etypes, etypes)
    check("reset preserved lab_analysis", "lab_analysis" in etypes, etypes)

    print(f"\n{PASS} passed, {FAIL} failed")
    sys.exit(1 if FAIL else 0)


if __name__ == "__main__":
    main()
