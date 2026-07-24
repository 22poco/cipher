"""Attempt lifecycle: start, workspace read, draft save, support events, submit."""

from __future__ import annotations

from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from ..auth import get_current_user
from ..database import get_db
from ..models import (
    AttemptEvidence,
    Mission,
    MissionAssignment,
    MissionAttempt,
    SectionEnrollment,
    SupportEvent,
    User,
)
from ..services.autocheck import run_auto_check
from ..services.permissions import assert_owns_attempt
from ..services.serializers import (
    public_activity,
    serialize_evidence,
    serialize_support_event,
    serialize_unit_ref,
)

SUPPORT_ONLY_STATUSES = {"graded", "returned"}
EDITABLE_ATTEMPT_STATUSES = {"assigned", "started", "draft_saved"}

router = APIRouter(prefix="/attempts", tags=["attempts"])

SUPPORT_SIGNALS = ["independent", "ai", "teacher", "others"]


class StartAttemptBody(BaseModel):
    mission_id: int
    assignment_id: int | None = None


class DraftBody(BaseModel):
    evidence_type: str
    payload: dict
    progress_percent: int | None = None


class SupportEventBody(BaseModel):
    to_signal: str
    note: str | None = None


def _now() -> datetime:
    return datetime.now(UTC).replace(tzinfo=None)


def _load_attempt(db: Session, attempt_id: int) -> MissionAttempt:
    attempt = db.get(
        MissionAttempt,
        attempt_id,
    )
    if attempt is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="attempt not found")
    return attempt


def _ensure_editable(attempt: MissionAttempt) -> None:
    if attempt.status not in EDITABLE_ATTEMPT_STATUSES:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="this attempt is locked and can no longer be edited",
        )


def _resolve_assignment_id(
    db: Session,
    user: User,
    mission_id: int,
    assignment_id: int | None,
) -> int | None:
    query = (
        select(MissionAssignment.id)
        .join(
            SectionEnrollment,
            SectionEnrollment.section_id == MissionAssignment.section_id,
        )
        .where(
            MissionAssignment.mission_id == mission_id,
            SectionEnrollment.student_user_id == user.id,
            SectionEnrollment.status == "active",
        )
    )
    if assignment_id is not None:
        query = query.where(MissionAssignment.id == assignment_id)

    resolved = db.execute(query.limit(1)).scalar_one_or_none()
    if assignment_id is not None and resolved is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="assignment is not available for this mission and student",
        )
    return resolved


def _workspace_payload(db: Session, attempt: MissionAttempt) -> dict:
    mission = attempt.mission
    evidence = {e.evidence_type: e.payload_json for e in attempt.evidence}
    steps = None
    # A primary evidence blob may carry per-attempt step state.
    for payload in evidence.values():
        if isinstance(payload, dict) and "steps" in payload:
            steps = payload["steps"]
            break
    if steps is None:
        steps = mission.steps_json or []

    due_at = None
    if attempt.assignment_id:
        assignment = db.get(MissionAssignment, attempt.assignment_id)
        due_at = assignment.due_at if assignment else None

    auto = attempt.auto_check
    return {
        "attempt": {
            "id": attempt.id,
            "status": attempt.status,
            "progress_percent": attempt.progress_percent,
            "active_support_signal": attempt.active_support_signal,
            "started_at": attempt.started_at,
            "submitted_at": attempt.submitted_at,
            "returned_at": attempt.returned_at,
            "due_at": due_at,
        },
        "mission": {
            "id": mission.id,
            "title": mission.title,
            "summary": mission.summary,
            "context_brief": mission.context_brief,
            "mission_type": mission.mission_type,
            "difficulty": mission.difficulty,
            "estimated_minutes": mission.estimated_minutes,
            "unit": serialize_unit_ref(mission.unit),
            "skills": [
                {"code": link.skill.code, "title": link.skill.title}
                for link in mission.skill_links
            ],
        },
        "steps": steps,
        "activity": public_activity(mission),
        "evidence": [serialize_evidence(e) for e in attempt.evidence],
        "support": {
            "signals": SUPPORT_SIGNALS,
            "active": attempt.active_support_signal,
            "events": [serialize_support_event(e) for e in attempt.support_events],
        },
        "auto_check": (
            {
                "score": auto.score,
                "max_score": auto.max_score,
                "passed": auto.passed,
                "details": auto.details_json,
            }
            if auto
            else None
        ),
    }


@router.post("", status_code=status.HTTP_201_CREATED)
def start_attempt(
    body: StartAttemptBody,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    mission = db.get(Mission, body.mission_id)
    if mission is None or not mission.published:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="mission not found")

    # Resolve the assignment for this mission in one of the student's sections so
    # the attempt is section-scoped and reachable by the section's teacher.
    assignment_id = _resolve_assignment_id(
        db,
        current_user,
        body.mission_id,
        body.assignment_id,
    )

    existing = (
        db.execute(
            select(MissionAttempt)
            .where(
                MissionAttempt.mission_id == body.mission_id,
                MissionAttempt.student_user_id == current_user.id,
            )
            .order_by(MissionAttempt.id.desc())
        )
        .scalars()
        .first()
    )
    if existing is not None and existing.status not in ("returned",):
        # Resume the in-flight attempt rather than creating a duplicate.
        if existing.status == "assigned":
            existing.status = "started"
            existing.started_at = existing.started_at or _now()
            db.commit()
        db.refresh(existing)
        return _workspace_payload(db, existing)

    attempt = MissionAttempt(
        mission_id=body.mission_id,
        assignment_id=assignment_id,
        student_user_id=current_user.id,
        status="started",
        started_at=_now(),
        active_support_signal="independent",
    )
    db.add(attempt)
    db.flush()
    # Every attempt starts in Independent mode with a support event on record.
    db.add(
        SupportEvent(
            attempt_id=attempt.id,
            from_signal=None,
            to_signal="independent",
            source="system",
        )
    )
    # Seed the interactive network simulator's starting state so a fresh attempt
    # renders the topology/rules (MCQ missions read questions from the mission).
    if mission.mission_type == "network_simulation" and mission.activity_json:
        db.add(
            AttemptEvidence(
                attempt_id=attempt.id,
                evidence_type="network",
                payload_json=mission.activity_json,
            )
        )
    db.commit()
    db.refresh(attempt)
    return _workspace_payload(db, attempt)


def _serialize_auto(attempt: MissionAttempt) -> dict | None:
    auto = attempt.auto_check
    if auto is None:
        return None
    return {
        "score": auto.score,
        "max_score": auto.max_score,
        "passed": auto.passed,
        "details": auto.details_json,
    }


@router.get("")
def list_attempts(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Every attempt the student has touched, newest first, for /attempts."""

    attempts = (
        db.execute(
            select(MissionAttempt)
            .where(MissionAttempt.student_user_id == current_user.id)
            .options(
                selectinload(MissionAttempt.grade),
                selectinload(MissionAttempt.auto_check),
                selectinload(MissionAttempt.mission).selectinload(Mission.unit),
                selectinload(MissionAttempt.mission).selectinload(Mission.skill_links),
            )
            .order_by(MissionAttempt.id.desc())
        )
        .scalars()
        .all()
    )

    # Due dates come from the linked assignment, if any.
    assignment_ids = [a.assignment_id for a in attempts if a.assignment_id]
    due_by_assignment: dict[int, object] = {}
    if assignment_ids:
        for aid, due in db.execute(
            select(MissionAssignment.id, MissionAssignment.due_at).where(
                MissionAssignment.id.in_(assignment_ids)
            )
        ).all():
            due_by_assignment[aid] = due

    rows = []
    for attempt in attempts:
        mission = attempt.mission
        # Hidden baseline mission is a gradebook mechanism, not a student view.
        if not mission.published:
            continue
        grade = attempt.grade
        rows.append(
            {
                "attempt_id": attempt.id,
                "mission_id": mission.id,
                "mission_title": mission.title,
                "mission_type": mission.mission_type,
                "unit": serialize_unit_ref(mission.unit),
                "skills": [
                    {"code": link.skill.code, "title": link.skill.title}
                    for link in mission.skill_links
                ],
                "status": attempt.status,
                "active_support_signal": attempt.active_support_signal,
                "progress_percent": attempt.progress_percent,
                "started_at": attempt.started_at,
                "submitted_at": attempt.submitted_at,
                "returned_at": attempt.returned_at,
                "due_at": due_by_assignment.get(attempt.assignment_id),
                "auto_check_passed": attempt.auto_check.passed if attempt.auto_check else None,
                "final_score": grade.final_score
                if grade and grade.final_score is not None and attempt.status in SUPPORT_ONLY_STATUSES
                else None,
            }
        )
    return {"attempts": rows}


@router.get("/support-summary")
def support_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Cross-attempt support behaviour for the student's Support Timeline page."""

    attempts = (
        db.execute(
            select(MissionAttempt)
            .where(MissionAttempt.student_user_id == current_user.id)
            .options(
                selectinload(MissionAttempt.support_events),
                selectinload(MissionAttempt.mission).selectinload(Mission.unit),
            )
            .order_by(MissionAttempt.id.desc())
        )
        .scalars()
        .all()
    )

    counts = {"independent": 0, "ai": 0, "teacher": 0, "others": 0}
    threads = []
    total_changes = 0
    for attempt in attempts:
        if not attempt.mission.published:
            continue
        events = list(attempt.support_events)
        for event in events:
            if event.to_signal in counts:
                counts[event.to_signal] += 1
            # A "change" is a student-driven signal switch (not the system seed).
            if event.source != "system":
                total_changes += 1
        # Skip attempts whose only event is the automatic Independent seed.
        meaningful = [e for e in events if e.source != "system"]
        if not meaningful:
            continue
        threads.append(
            {
                "attempt_id": attempt.id,
                "mission_id": attempt.mission.id,
                "mission_title": attempt.mission.title,
                "unit": serialize_unit_ref(attempt.mission.unit),
                "status": attempt.status,
                "events": [serialize_support_event(e) for e in events],
            }
        )

    return {
        "counts": counts,
        "total_changes": total_changes,
        "attempts_with_support": len(threads),
        "threads": threads,
    }


@router.get("/{attempt_id}")
def get_attempt(
    attempt_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    attempt = _load_attempt(db, attempt_id)
    assert_owns_attempt(current_user, attempt)
    return _workspace_payload(db, attempt)


@router.patch("/{attempt_id}/draft")
def save_draft(
    attempt_id: int,
    body: DraftBody,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    attempt = _load_attempt(db, attempt_id)
    assert_owns_attempt(current_user, attempt)
    _ensure_editable(attempt)

    evidence = db.execute(
        select(AttemptEvidence).where(
            AttemptEvidence.attempt_id == attempt.id,
            AttemptEvidence.evidence_type == body.evidence_type,
        )
    ).scalar_one_or_none()

    if evidence is None:
        evidence = AttemptEvidence(
            attempt_id=attempt.id,
            evidence_type=body.evidence_type,
            payload_json=body.payload,
        )
        db.add(evidence)
    else:
        evidence.payload_json = body.payload

    if attempt.status in ("assigned", "started"):
        attempt.status = "draft_saved"
    if body.progress_percent is not None:
        attempt.progress_percent = max(0, min(100, body.progress_percent))

    db.commit()
    return {"status": "saved", "attempt_status": attempt.status}


@router.post("/{attempt_id}/support-events", status_code=status.HTTP_201_CREATED)
def add_support_event(
    attempt_id: int,
    body: SupportEventBody,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    attempt = _load_attempt(db, attempt_id)
    assert_owns_attempt(current_user, attempt)

    if body.to_signal not in SUPPORT_SIGNALS:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="unsupported support signal",
        )

    event = SupportEvent(
        attempt_id=attempt.id,
        from_signal=attempt.active_support_signal,
        to_signal=body.to_signal,
        note=body.note,
        source="student",
    )
    attempt.active_support_signal = body.to_signal
    db.add(event)
    db.commit()
    db.refresh(event)
    return serialize_support_event(event)


@router.post("/{attempt_id}/submit")
def submit_attempt(
    attempt_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    attempt = _load_attempt(db, attempt_id)
    assert_owns_attempt(current_user, attempt)
    _ensure_editable(attempt)

    if not attempt.evidence:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="add your evidence before submitting",
        )

    attempt.submitted_at = _now()
    attempt.progress_percent = 100
    # Objective missions are scored first; every attempt still lands in the
    # teacher queue for the hybrid (auto-check + rubric) grade.
    auto = run_auto_check(db, attempt)
    attempt.status = "needs_teacher_review"
    db.commit()
    return {
        "status": attempt.status,
        "submitted_at": attempt.submitted_at,
        "auto_check": _serialize_auto(attempt) if auto else None,
    }


@router.post("/{attempt_id}/auto-check")
def auto_check_attempt(
    attempt_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Run (or re-run) the objective auto-check for an attempt.

    Usable as a pre-submit self-check by the student who owns the attempt. Does
    not change the attempt status — grading remains a submit-then-review flow.
    """

    attempt = _load_attempt(db, attempt_id)
    assert_owns_attempt(current_user, attempt)
    _ensure_editable(attempt)
    auto = run_auto_check(db, attempt)
    if auto is None:
        db.rollback()
        return {"auto_check": None, "checked": False}
    db.commit()
    return {"auto_check": _serialize_auto(attempt), "checked": True}
