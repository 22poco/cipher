"""Objective auto-checks for mission attempts.

Deterministic scoring for the objective mission types — network firewall-rule
evaluation and multiple-choice answer keys — persisted as an `AutoCheckResult`.
Subjective types (written_response, case_investigation) and the not-yet-built
bash simulator return ``None`` and fall through to teacher review untouched.
"""

from __future__ import annotations

from datetime import UTC, datetime

from sqlalchemy.orm import Session

from . import labs
from ..models import AutoCheckResult, MissionAttempt

# Mission types that carry an objective, machine-checkable component.
AUTO_CHECKED_TYPES = {"network_simulation", "multiple_choice", "attack_simulation"}


def _now() -> datetime:
    return datetime.now(UTC).replace(tzinfo=None)


def _evidence_payload(attempt: MissionAttempt, evidence_type: str) -> dict | None:
    for evidence in attempt.evidence:
        if evidence.evidence_type == evidence_type:
            return evidence.payload_json
    return None


def _norm(value: object) -> str:
    return str(value or "").strip().lower()


# --------------------------------------------------------------------------- #
# Network firewall-rule evaluation
# --------------------------------------------------------------------------- #


def _rule_matches(rule: dict, test: dict) -> bool:
    src, dst, svc = _norm(rule.get("source")), _norm(rule.get("destination")), _norm(rule.get("service"))
    t_src, t_dst, t_svc = _norm(test.get("source")), _norm(test.get("destination")), _norm(test.get("service"))
    if src not in ("any", t_src):
        return False
    if dst not in ("any", t_dst):
        return False
    if svc in ("any", "all") or t_svc in ("any", "all"):
        return True
    return svc == t_svc


def evaluate_network(
    student_payload: dict,
    mission_activity: dict | None,
) -> tuple[float, float, dict]:
    """Walk student firewall rules against mission-owned traffic tests.

    Student evidence is intentionally limited to submitted rules. Expected
    outcomes are read from the immutable mission activity so a client cannot
    self-award credit by changing ``traffic_tests[*].expected`` in draft JSON.
    """

    rules = sorted(student_payload.get("firewall_rules") or [], key=lambda r: r.get("order", 0))
    tests = (mission_activity or {}).get("traffic_tests") or []
    checks: list[dict] = []
    passed = 0
    for test in tests:
        action = "deny"
        for rule in rules:
            if _rule_matches(rule, test):
                action = _norm(rule.get("action")) or "deny"
                break
        computed = "allowed" if action == "allow" else "blocked"
        expected = _norm(test.get("expected")) or "blocked"
        ok = computed == expected
        passed += 1 if ok else 0
        checks.append(
            {
                "name": f"{test.get('source')} → {test.get('destination')} "
                f"({test.get('service')}) — {computed}",
                "passed": ok,
            }
        )
    return passed, len(tests), {"label": "Firewall rule evaluation", "checks": checks}


# --------------------------------------------------------------------------- #
# Multiple-choice answer key
# --------------------------------------------------------------------------- #


def evaluate_lab(attempt: MissionAttempt) -> tuple[float, float, dict]:
    """Completeness-only check for a simulated attack lab.

    Scores whether the student produced the required analysis artifacts (debrief
    unlocked, prompts answered, a mitigation chosen). It never scores whether the
    student fell for the simulation — that is evidence, not a penalty.
    """

    report = labs.lab_analysis_complete(attempt.mission, attempt)
    checks = report["checks"]
    labels = {
        "debrief_unlocked": "Reviewed the debrief",
        "analysis_present": "Started the analysis",
        "prompts_answered": "Answered the required analysis prompts",
        "mitigations_selected": "Selected at least one mitigation",
    }
    detail_checks = [
        {"name": labels.get(key, key), "passed": bool(value)}
        for key, value in checks.items()
    ]
    passed = sum(1 for c in detail_checks if c["passed"])
    return (
        float(passed),
        float(len(detail_checks)),
        {"label": "Lab analysis completeness", "checks": detail_checks},
    )


def evaluate_mcq(activity: dict | None, payload: dict) -> tuple[float, float, dict]:
    questions = (activity or {}).get("questions") or []
    answers = payload.get("answers") or {}
    checks: list[dict] = []
    passed = 0
    for question in questions:
        qid = question.get("id")
        chosen = answers.get(str(qid), answers.get(qid))
        try:
            ok = chosen is not None and int(chosen) == int(question.get("answer_index"))
        except (TypeError, ValueError):
            ok = False
        passed += 1 if ok else 0
        checks.append({"name": question.get("prompt", f"Question {qid}"), "passed": ok})
    return passed, len(questions), {"label": "Answer key", "checks": checks}


# --------------------------------------------------------------------------- #
# Entry point
# --------------------------------------------------------------------------- #


def run_auto_check(db: Session, attempt: MissionAttempt) -> AutoCheckResult | None:
    """Score an attempt's objective component and upsert its AutoCheckResult.

    Returns the persisted result, or ``None`` for mission types without an
    objective check (or when the student hasn't produced checkable evidence).
    """

    mission_type = attempt.mission.mission_type
    scored: tuple[float, float, dict] | None = None

    if mission_type == "network_simulation":
        payload = _evidence_payload(attempt, "network")
        if payload:
            scored = evaluate_network(payload, attempt.mission.activity_json)
    elif mission_type == "multiple_choice":
        payload = _evidence_payload(attempt, "mcq")
        if payload is not None:
            scored = evaluate_mcq(attempt.mission.activity_json, payload)
    elif mission_type == labs.ATTACK_SIMULATION_TYPE:
        scored = evaluate_lab(attempt)

    if scored is None:
        return None

    score, max_score, details = scored
    result = attempt.auto_check
    if result is None:
        result = AutoCheckResult(attempt_id=attempt.id)
        db.add(result)
    result.score = score
    result.max_score = max_score
    result.passed = bool(max_score) and score == max_score
    result.details_json = details
    result.created_at = _now()
    db.flush()
    return result
