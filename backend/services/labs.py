"""Simulated attack lab service.

Everything specific to ``attack_simulation`` missions lives here so the mission
and attempt routers stay thin. The two load-bearing safety rules are enforced in
this module:

1. Section lab mode must be enabled before a lab can be assigned or attempted.
2. Only sanitized, synthetic event evidence is ever persisted. Raw credentials,
   typed input, tokens, and session material are rejected before they can be
   written to ``lab_events``.
"""

from __future__ import annotations

from datetime import UTC, datetime

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..models import (
    AttemptEvidence,
    ClassSection,
    Mission,
    MissionAssignment,
    MissionAttempt,
    SectionEnrollment,
    SectionLabSettings,
    User,
)
from .permissions import teacher_section_ids

# --------------------------------------------------------------------------- #
# Constants
# --------------------------------------------------------------------------- #

ATTACK_SIMULATION_TYPE = "attack_simulation"

LAB_EVENTS_EVIDENCE = "lab_events"
LAB_ANALYSIS_EVIDENCE = "lab_analysis"
LAB_REFLECTION_EVIDENCE = "reflection"

DISCLOSURE_MODES = {"transparent", "surprise"}
DEFAULT_DISCLOSURE_MODE = "transparent"

ACKNOWLEDGEMENT_VERSION = "v1"

# Any of these keys appearing anywhere in an inbound lab event means a client is
# trying to send raw secret/input material. Reject the whole event.
FORBIDDEN_EVENT_KEYS = {
    "password",
    "passphrase",
    "token",
    "cookie",
    "session",
    "secret",
    "credential",
    "value",
    "text",
    "raw",
    "input",
}

# Lab events carry no client metadata. Debrief unlock is derived server-side from
# the mission config, so ``debrief_unlocked`` is intentionally NOT accepted here —
# any metadata content is rejected.
ALLOWED_METADATA_KEYS: set[str] = set()

# Attempt statuses that count a lab attempt as "completed" for aggregate reporting.
COMPLETED_STATUSES = {"submitted", "auto_checked", "needs_teacher_review", "graded", "returned"}
REVIEW_STATUSES = {"submitted", "auto_checked", "needs_teacher_review"}
EDITABLE_STATUSES = {"assigned", "started", "draft_saved"}

DEFAULT_TRANSPARENCY_NOTICE = (
    "This is a safe, simulated attack lab for class. It uses only generated lab "
    "data — never enter a real password or personal account details."
)


def _now() -> datetime:
    return datetime.now(UTC).replace(tzinfo=None)


def _now_iso() -> str:
    return _now().isoformat()


# --------------------------------------------------------------------------- #
# Mission helpers
# --------------------------------------------------------------------------- #


def is_attack_simulation(mission: Mission | None) -> bool:
    return bool(mission and mission.mission_type == ATTACK_SIMULATION_TYPE)


def _config(mission: Mission) -> dict:
    return dict(mission.activity_json or {})


def _dummy_identities(config: dict) -> list[dict]:
    identity = config.get("dummy_identity")
    if isinstance(identity, list):
        return [d for d in identity if isinstance(d, dict)]
    if isinstance(identity, dict):
        return [identity]
    return []


def _allowed_indicator_ids(config: dict) -> set[str]:
    return {i.get("id") for i in (config.get("indicators") or []) if isinstance(i, dict)}


def _allowed_choice_ids(config: dict) -> set[str]:
    return {c.get("id") for c in (config.get("mitigation_choices") or []) if isinstance(c, dict)}


def _required_prompt_ids(config: dict) -> list[str]:
    return [
        p.get("id")
        for p in (config.get("analysis_prompts") or [])
        if isinstance(p, dict) and p.get("id") and p.get("required", True)
    ]


def _unlock_event_types(config: dict) -> set[str]:
    schema = config.get("event_schema") or {}
    return set(schema.get("unlocks_debrief") or [])


# --------------------------------------------------------------------------- #
# Section lab settings + permission gates
# --------------------------------------------------------------------------- #


def get_or_create_lab_settings(db: Session, section_id: int) -> SectionLabSettings:
    settings = db.execute(
        select(SectionLabSettings).where(SectionLabSettings.section_id == section_id)
    ).scalar_one_or_none()
    if settings is None:
        settings = SectionLabSettings(section_id=section_id)
        db.add(settings)
        db.flush()
    return settings


def assert_teacher_can_manage_lab_section(db: Session, user: User, section_id: int) -> ClassSection:
    """Teacher/admin gate for lab management scoped to a single section."""

    section = db.get(ClassSection, section_id)
    if section is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="section not found")

    if user.role == "admin":
        return section

    allowed = teacher_section_ids(db, user) or []
    if section_id not in allowed:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="this section is not one of yours",
        )
    return section


def lab_mode_enabled(db: Session, section_id: int) -> bool:
    settings = db.execute(
        select(SectionLabSettings).where(SectionLabSettings.section_id == section_id)
    ).scalar_one_or_none()
    return bool(settings and settings.enabled)


def assert_lab_enabled_for_assignment(
    db: Session, mission: Mission, assignment_id: int | None
) -> MissionAssignment:
    """Every lab attempt must run against an assignment in a lab-enabled section."""

    if assignment_id is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="simulated attack labs must be opened from a teacher assignment",
        )
    assignment = db.get(MissionAssignment, assignment_id)
    if assignment is None or assignment.mission_id != mission.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="assignment is not available for this lab",
        )
    if not lab_mode_enabled(db, assignment.section_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="lab mode is not enabled for this section",
        )
    return assignment


def resolve_lab_disclosure_mode(
    mission: Mission, assignment: MissionAssignment | None
) -> str:
    config = _config(mission)
    if assignment and assignment.lab_disclosure_mode in DISCLOSURE_MODES:
        return assignment.lab_disclosure_mode
    default = config.get("default_disclosure_mode")
    if default in DISCLOSURE_MODES:
        return default
    return DEFAULT_DISCLOSURE_MODE


# --------------------------------------------------------------------------- #
# Student-facing activity filtering
# --------------------------------------------------------------------------- #


def _public_event_schema(config: dict) -> dict:
    """Only the event vocabulary the client legitimately needs to submit events.

    The ``unlocks_debrief`` list is intentionally withheld so surprise-mode
    clients cannot enumerate which action triggers the reveal.
    """

    schema = config.get("event_schema") or {}
    return {
        "allowed_event_types": list(schema.get("allowed_event_types") or []),
        "indicator_ids": sorted(i for i in _allowed_indicator_ids(config) if i),
    }


def lab_public_detail(mission: Mission) -> dict:
    """Non-sensitive lab activity for mission-detail reads (no attempt context).

    Deliberately omits the debrief, indicator cards, mitigation catalog, analysis
    prompts, and the debrief-trigger vocabulary so a public mission read can never
    leak the reveal — even for a transparent lab.
    """

    config = _config(mission)
    return {
        "lab_type": config.get("lab_type"),
        "unit_alignment": config.get("unit_alignment"),
        "default_disclosure_mode": config.get("default_disclosure_mode") or DEFAULT_DISCLOSURE_MODE,
        "allowed_disclosure_modes": list(config.get("allowed_disclosure_modes") or []),
        "scenario": config.get("scenario"),
        "safe_actions": list(config.get("safe_actions") or []),
    }


def student_can_access_lab(db: Session, user: User, mission: Mission) -> bool:
    """A student may reach a lab only via an assignment in a lab-enabled section."""

    rows = db.execute(
        select(MissionAssignment.section_id)
        .join(
            SectionEnrollment,
            SectionEnrollment.section_id == MissionAssignment.section_id,
        )
        .where(
            MissionAssignment.mission_id == mission.id,
            SectionEnrollment.student_user_id == user.id,
            SectionEnrollment.status == "active",
        )
    ).all()
    return any(lab_mode_enabled(db, section_id) for (section_id,) in rows)


def get_lab_events(attempt: MissionAttempt) -> list[dict]:
    for evidence in attempt.evidence:
        if evidence.evidence_type == LAB_EVENTS_EVIDENCE:
            payload = evidence.payload_json or {}
            events = payload.get("events")
            return list(events) if isinstance(events, list) else []
    return []


def has_lab_debrief_unlocked(attempt: MissionAttempt) -> bool:
    return any(bool(e.get("debrief_unlocked")) for e in get_lab_events(attempt))


# The only keys a persisted lab event should ever expose to a teacher review.
SAFE_EVENT_KEYS = (
    "event_type",
    "lab_type",
    "dummy_identity_id",
    "indicator_ids",
    "choice_ids",
    "debrief_unlocked",
    "at",
)


def sanitize_lab_events_payload(payload: dict | None) -> dict:
    """Re-project stored lab events to safe keys only.

    Applied when serving lab events to a teacher so that even malformed or legacy
    rows can never surface an unexpected raw key.
    """

    events = (payload or {}).get("events") or []
    safe_events = [
        {key: event.get(key) for key in SAFE_EVENT_KEYS}
        for event in events
        if isinstance(event, dict)
    ]
    return {"events": safe_events}


def student_lab_activity(
    mission: Mission,
    attempt: MissionAttempt,
    disclosure_mode: str = DEFAULT_DISCLOSURE_MODE,
) -> dict:
    """Server-filtered lab activity payload.

    Before the simulated event unlocks the debrief, hidden content (debrief
    panels, indicator cards, mitigation catalog, analysis prompts) is withheld so
    surprise-reveal labs do not leak the trap. Transparent labs still get an
    up-front safety notice but not the specific indicators.
    """

    config = _config(mission)
    unlocked = has_lab_debrief_unlocked(attempt)

    activity: dict = {
        "lab_type": config.get("lab_type"),
        "unit_alignment": config.get("unit_alignment"),
        "disclosure_mode": disclosure_mode,
        "allowed_disclosure_modes": list(config.get("allowed_disclosure_modes") or []),
        "scenario": config.get("scenario"),
        "dummy_identity": config.get("dummy_identity"),
        "safe_actions": list(config.get("safe_actions") or []),
        "event_schema": _public_event_schema(config),
        "debrief_unlocked": unlocked,
        "lab_events": get_lab_events(attempt),
        "transparency_notice": (
            config.get("transparency_notice") or DEFAULT_TRANSPARENCY_NOTICE
            if disclosure_mode == "transparent"
            else None
        ),
    }

    if unlocked:
        activity["debrief"] = config.get("debrief")
        activity["indicators"] = config.get("indicators") or []
        activity["mitigation_choices"] = config.get("mitigation_choices") or []
        activity["analysis_prompts"] = config.get("analysis_prompts") or []
    else:
        activity["debrief"] = None
        activity["indicators"] = None
        activity["mitigation_choices"] = None
        activity["analysis_prompts"] = None

    return activity


# --------------------------------------------------------------------------- #
# Event validation + persistence
# --------------------------------------------------------------------------- #


def _contains_forbidden_key(obj: object) -> bool:
    if isinstance(obj, dict):
        for key, value in obj.items():
            if str(key).lower() in FORBIDDEN_EVENT_KEYS:
                return True
            if _contains_forbidden_key(value):
                return True
    elif isinstance(obj, (list, tuple)):
        return any(_contains_forbidden_key(item) for item in obj)
    return False


def validate_lab_event(mission: Mission, event: dict) -> dict:
    """Validate + sanitize an inbound lab event against the mission's own config.

    Returns a clean event dict safe to persist. Raises 422 on anything that is
    not an allow-listed, synthetic label.
    """

    if _contains_forbidden_key(event):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="lab events may not contain raw credential, token, or input fields",
        )

    config = _config(mission)
    schema = config.get("event_schema") or {}

    event_type = event.get("event_type")
    allowed_types = set(schema.get("allowed_event_types") or [])
    if not event_type or event_type not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="unknown lab event type",
        )

    ev_lab_type = event.get("lab_type")
    if ev_lab_type is not None and ev_lab_type != config.get("lab_type"):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="lab event does not match this mission",
        )

    indicator_ids = list(event.get("indicator_ids") or [])
    if not set(indicator_ids) <= _allowed_indicator_ids(config):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="unknown indicator id in lab event",
        )

    choice_ids = list(event.get("choice_ids") or [])
    if not set(choice_ids) <= _allowed_choice_ids(config):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="unknown mitigation choice id in lab event",
        )

    # A dummy identity id is only ever valid when the mission actually defines it.
    # Labs without a dummy identity (network/physical/app-data) must send none;
    # any non-null value is rejected rather than persisted as arbitrary text.
    dummy_identity_id = event.get("dummy_identity_id")
    allowed_identities = {d.get("id") for d in _dummy_identities(config)}
    if dummy_identity_id is not None and dummy_identity_id not in allowed_identities:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="unknown dummy identity id in lab event",
        )

    metadata = event.get("metadata") or {}
    if not isinstance(metadata, dict) or (set(metadata) - ALLOWED_METADATA_KEYS):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="lab event metadata contains unsupported fields",
        )

    # Debrief unlock is a server-only decision driven by the mission's configured
    # unlock event types. Clients cannot force it (e.g. via metadata), so
    # surprise-mode students can't reveal the debrief without the real interaction.
    unlocked = event_type in _unlock_event_types(config)

    return {
        "event_type": event_type,
        "lab_type": config.get("lab_type"),
        "dummy_identity_id": dummy_identity_id,
        "indicator_ids": indicator_ids,
        "choice_ids": choice_ids,
        "debrief_unlocked": unlocked,
        "at": _now_iso(),
    }


def append_lab_event(db: Session, attempt: MissionAttempt, event: dict) -> AttemptEvidence:
    """Append a validated event to the attempt's single ``lab_events`` record."""

    evidence = db.execute(
        select(AttemptEvidence).where(
            AttemptEvidence.attempt_id == attempt.id,
            AttemptEvidence.evidence_type == LAB_EVENTS_EVIDENCE,
        )
    ).scalar_one_or_none()

    if evidence is None:
        evidence = AttemptEvidence(
            attempt_id=attempt.id,
            evidence_type=LAB_EVENTS_EVIDENCE,
            payload_json={"events": [event]},
        )
        db.add(evidence)
    else:
        events = list((evidence.payload_json or {}).get("events") or [])
        events.append(event)
        # Reassign so SQLAlchemy detects the JSON mutation.
        evidence.payload_json = {"events": events}

    return evidence


# --------------------------------------------------------------------------- #
# Analysis completeness (used by submit gate + auto-check)
# --------------------------------------------------------------------------- #


def _lab_analysis_payload(attempt: MissionAttempt) -> dict | None:
    for evidence in attempt.evidence:
        if evidence.evidence_type == LAB_ANALYSIS_EVIDENCE:
            return evidence.payload_json or {}
    return None


def lab_analysis_complete(mission: Mission, attempt: MissionAttempt) -> dict:
    """Objective completeness signals for a lab attempt (never a correctness score).

    Falling for the simulation is never penalized; this only records whether the
    student produced the analysis artifacts the debrief asks for.
    """

    config = _config(mission)
    payload = _lab_analysis_payload(attempt)
    responses = (payload or {}).get("responses") or {}
    chosen = (payload or {}).get("mitigation_choice_ids") or []

    required = _required_prompt_ids(config)
    answered = [pid for pid in required if str(responses.get(pid, "")).strip()]

    checks = {
        "analysis_present": payload is not None,
        "debrief_unlocked": has_lab_debrief_unlocked(attempt),
        "prompts_answered": len(answered) == len(required) and bool(required),
        "mitigations_selected": len(chosen) > 0,
    }
    return {
        "checks": checks,
        "required_prompts": len(required),
        "answered_prompts": len(answered),
        "mitigations_selected": len(chosen),
        "complete": all(checks.values()),
    }


# --------------------------------------------------------------------------- #
# Teacher aggregate reporting
# --------------------------------------------------------------------------- #


def _lab_attempts_for_section(
    db: Session, section_id: int, assignment_id: int | None
) -> list[MissionAttempt]:
    query = (
        select(MissionAttempt)
        .join(MissionAssignment, MissionAttempt.assignment_id == MissionAssignment.id)
        .join(Mission, MissionAttempt.mission_id == Mission.id)
        .where(
            MissionAssignment.section_id == section_id,
            Mission.mission_type == ATTACK_SIMULATION_TYPE,
        )
    )
    if assignment_id is not None:
        query = query.where(MissionAttempt.assignment_id == assignment_id)
    return list(db.execute(query).scalars().all())


def aggregate_lab_summary(
    db: Session, section_id: int, assignment_id: int | None = None
) -> dict:
    """Aggregate-only lab reporting for a section. Never exposes dummy secrets.

    Reports completion/needs-review counts, the most commonly missed indicators,
    mitigation-choice distribution, and per-unit lab coverage — all from indicator
    ids, event labels, and mitigation ids only.
    """

    attempts = _lab_attempts_for_section(db, section_id, assignment_id)

    completed = 0
    needs_review = 0
    missed_counts: dict[str, int] = {}
    mitigation_counts: dict[str, int] = {}
    unit_coverage: dict[int, dict] = {}

    # Cache mission config per mission id for indicator labels + unit alignment.
    mission_cache: dict[int, Mission] = {}

    for attempt in attempts:
        if attempt.status in COMPLETED_STATUSES:
            completed += 1
        if attempt.status in REVIEW_STATUSES:
            needs_review += 1

        mission = mission_cache.get(attempt.mission_id)
        if mission is None:
            mission = db.get(Mission, attempt.mission_id)
            mission_cache[attempt.mission_id] = mission
        config = _config(mission) if mission else {}

        # Unit coverage.
        if mission is not None:
            unit = mission.unit
            coverage = unit_coverage.setdefault(
                unit.order_index,
                {"unit_order": unit.order_index, "unit_title": unit.title, "attempts": 0, "completed": 0},
            )
            coverage["attempts"] += 1
            if attempt.status in COMPLETED_STATUSES:
                coverage["completed"] += 1

        payload = _lab_analysis_payload(attempt)

        # Missed indicators = all indicators minus those the student noticed.
        # "Noticed" comes from interaction events and/or the debrief self-check
        # recorded in lab_analysis, so both seed and live data are covered.
        all_indicators = _allowed_indicator_ids(config)
        noticed: set[str] = set()
        for event in get_lab_events(attempt):
            noticed.update(event.get("indicator_ids") or [])
        noticed.update((payload or {}).get("noticed_indicator_ids") or [])
        # Only count missed indicators once the student engaged with the lab.
        if get_lab_events(attempt) or payload is not None:
            for indicator_id in all_indicators - noticed:
                if indicator_id:
                    missed_counts[indicator_id] = missed_counts.get(indicator_id, 0) + 1

        # Mitigation-choice distribution from submitted analysis.
        for choice_id in (payload or {}).get("mitigation_choice_ids") or []:
            mitigation_counts[choice_id] = mitigation_counts.get(choice_id, 0) + 1

    # Attach human-readable labels from any mission that defines them.
    indicator_labels = _label_lookup(mission_cache, "indicators")
    choice_labels = _label_lookup(mission_cache, "mitigation_choices", label_key="label")

    most_missed = [
        {
            "id": indicator_id,
            "label": indicator_labels.get(indicator_id, indicator_id),
            "count": count,
        }
        for indicator_id, count in sorted(missed_counts.items(), key=lambda kv: (-kv[1], kv[0]))
    ]
    mitigation_distribution = [
        {
            "id": choice_id,
            "label": choice_labels.get(choice_id, choice_id),
            "count": count,
        }
        for choice_id, count in sorted(mitigation_counts.items(), key=lambda kv: (-kv[1], kv[0]))
    ]

    settings = db.execute(
        select(SectionLabSettings).where(SectionLabSettings.section_id == section_id)
    ).scalar_one_or_none()

    return {
        "section_id": section_id,
        "assignment_id": assignment_id,
        "total_attempts": len(attempts),
        "completed": completed,
        "needs_review": needs_review,
        "most_missed_indicators": most_missed,
        "mitigation_distribution": mitigation_distribution,
        "unit_coverage": [unit_coverage[k] for k in sorted(unit_coverage)],
        "reset_state": {
            "last_reset_at": settings.last_reset_at if settings else None,
            "last_reset_by_user_id": settings.last_reset_by_user_id if settings else None,
        },
    }


def _label_lookup(
    mission_cache: dict[int, Mission], list_key: str, label_key: str = "title"
) -> dict[str, str]:
    labels: dict[str, str] = {}
    for mission in mission_cache.values():
        if mission is None:
            continue
        for item in _config(mission).get(list_key) or []:
            if isinstance(item, dict) and item.get("id"):
                labels[item["id"]] = item.get(label_key) or item.get("title") or item["id"]
    return labels


# --------------------------------------------------------------------------- #
# Reset
# --------------------------------------------------------------------------- #


def reset_lab_events(
    db: Session, section_id: int, assignment_id: int, user: User
) -> dict:
    """Clear ``lab_events`` for a section's lab assignment; keep analysis + grades.

    Assignment-scoped for V1. Submitted ``lab_analysis``, reflections, grades, and
    grade audit events are preserved so the gradebook is unaffected.
    """

    attempts = _lab_attempts_for_section(db, section_id, assignment_id)
    cleared = 0
    for attempt in attempts:
        for evidence in list(attempt.evidence):
            if evidence.evidence_type == LAB_EVENTS_EVIDENCE:
                db.delete(evidence)
                cleared += 1

    settings = get_or_create_lab_settings(db, section_id)
    settings.last_reset_at = _now()
    settings.last_reset_by_user_id = user.id

    return {"cleared_attempts": cleared, "reset_at": settings.last_reset_at}
