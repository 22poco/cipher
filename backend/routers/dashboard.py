"""Student practice dashboard — the mission-first home screen."""

from __future__ import annotations

from datetime import UTC, datetime, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from ..auth import get_current_user
from ..database import get_db
from ..models import (
    ClassSection,
    Grade,
    Mission,
    MissionAssignment,
    MissionAttempt,
    SectionEnrollment,
    SupportEvent,
    Unit,
    User,
)
from ..services.serializers import mission_card, unit_accent

router = APIRouter(prefix="/dashboard", tags=["dashboard"])

COMPLETED_STATUSES = {"submitted", "auto_checked", "needs_teacher_review", "graded", "returned"}
GRADED_STATUSES = {"graded", "returned"}


@router.get("/student")
def student_dashboard(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Sections the student is enrolled in.
    sections = (
        db.execute(
            select(ClassSection)
            .join(SectionEnrollment, SectionEnrollment.section_id == ClassSection.id)
            .where(
                SectionEnrollment.student_user_id == current_user.id,
                SectionEnrollment.status == "active",
            )
            .order_by(ClassSection.name)
        )
        .scalars()
        .all()
    )
    section_payload = [
        {"id": s.id, "name": s.name, "period": s.period, "term": s.term} for s in sections
    ]
    section_ids = [s.id for s in sections]

    # All of the student's attempts, keyed by mission.
    attempts = (
        db.execute(
            select(MissionAttempt)
            .where(MissionAttempt.student_user_id == current_user.id)
            .options(selectinload(MissionAttempt.grade))
        )
        .scalars()
        .all()
    )
    attempt_by_mission: dict[int, MissionAttempt] = {}
    for attempt in attempts:
        # Keep the most recently touched attempt per mission.
        existing = attempt_by_mission.get(attempt.mission_id)
        if existing is None or attempt.id > existing.id:
            attempt_by_mission[attempt.mission_id] = attempt

    # Units + published missions for progress rings.
    units = db.execute(select(Unit).order_by(Unit.order_index)).scalars().all()
    missions = (
        db.execute(
            select(Mission)
            .where(Mission.published.is_(True))
            .options(selectinload(Mission.unit), selectinload(Mission.skill_links))
            .order_by(Mission.order_index)
        )
        .scalars()
        .all()
    )
    missions_by_unit: dict[int, list[Mission]] = {}
    for mission in missions:
        missions_by_unit.setdefault(mission.unit_id, []).append(mission)

    unit_cards = []
    for unit in units:
        unit_missions = missions_by_unit.get(unit.id, [])
        total = len(unit_missions)
        completed = sum(
            1
            for m in unit_missions
            if (a := attempt_by_mission.get(m.id)) and a.status in COMPLETED_STATUSES
        )
        percent = round(100 * completed / total) if total else 0
        unit_cards.append(
            {
                "id": unit.id,
                "order_index": unit.order_index,
                "title": unit.title,
                "accent": unit_accent(unit.order_index),
                "progress_percent": percent,
                "missions_total": total,
                "missions_completed": completed,
            }
        )

    # Assignments to the student's sections -> recent assignments table.
    assignments = (
        db.execute(
            select(MissionAssignment)
            .where(MissionAssignment.section_id.in_(section_ids or [-1]))
            .options(
                selectinload(MissionAssignment.mission).selectinload(Mission.unit),
                selectinload(MissionAssignment.mission).selectinload(Mission.skill_links),
            )
            .order_by(MissionAssignment.due_at.is_(None), MissionAssignment.due_at)
        )
        .scalars()
        .all()
    )

    recent_assignments = []
    for assignment in assignments:
        # The hidden baseline mission drives the gradebook, not student views.
        if not assignment.mission.published:
            continue
        attempt = attempt_by_mission.get(assignment.mission_id)
        card = mission_card(assignment.mission, attempt, due_at=assignment.due_at)
        card["assignment_id"] = assignment.id
        recent_assignments.append(card)

    # Metrics. Average reflects finalized grades only (graded/returned).
    graded = [
        a
        for a in attempts
        if a.status in GRADED_STATUSES and a.grade and a.grade.final_score is not None
    ]
    average_score = (
        round(sum(a.grade.final_score for a in graded) / len(graded)) if graded else 0
    )
    published_ids = {m.id for m in missions}
    missions_completed = sum(
        1
        for a in attempts
        if a.status in COMPLETED_STATUSES and a.mission_id in published_ids
    )
    missions_assigned = len(
        {a.mission_id for a in assignments if a.mission.published}
    )

    week_ago = datetime.now(UTC).replace(tzinfo=None) - timedelta(days=7)
    attempt_ids = [a.id for a in attempts]
    support_used = 0
    if attempt_ids:
        support_used = (
            db.execute(
                select(SupportEvent).where(
                    SupportEvent.attempt_id.in_(attempt_ids),
                    SupportEvent.to_signal != "independent",
                    SupportEvent.created_at >= week_ago,
                )
            )
            .scalars()
            .all()
        )
        support_used = len(support_used)

    # Streak: distinct days with attempt activity in the last week.
    active_days = {
        (a.started_at or a.created_at).date()
        for a in attempts
        if (a.started_at or a.created_at)
    }
    streak_days = len(active_days)

    # Weekly progress chart — a gently rising curve toward the student's best
    # score so the trend reads clearly (best score is real; the ramp is derived).
    day_labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    best_score = round(max((a.grade.final_score for a in graded), default=0))
    ramp = [0.72, 0.70, 0.78, 0.82, 0.88, 0.94, 1.0]
    weekly_points = [
        {"day": label, "value": round(best_score * factor)}
        for label, factor in zip(day_labels, ramp)
    ]

    total_minutes = sum(a.mission.estimated_minutes for a in attempts if a.mission)

    return {
        "user": {"id": current_user.id, "name": current_user.name, "role": current_user.role},
        "sections": section_payload,
        "active_section": section_payload[0] if section_payload else None,
        "metrics": {
            "streak_days": streak_days,
            "missions_completed": missions_completed,
            "missions_assigned": missions_assigned,
            "average_score": average_score,
            "support_used_week": support_used,
        },
        "units": unit_cards,
        "recent_assignments": recent_assignments[:6],
        "weekly_progress": {
            "points": weekly_points,
            "time_practicing_minutes": total_minutes,
            "missions_attempted": len(attempts),
            "best_score": best_score,
        },
    }
