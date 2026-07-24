"""Mission catalogue — published missions grouped by AP unit, plus detail."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from ..auth import get_current_user
from ..database import get_db
from ..models import (
    Mission,
    MissionAssignment,
    MissionAttempt,
    SectionEnrollment,
    Unit,
    User,
)
from ..services.serializers import (
    mission_card,
    public_activity,
    serialize_rubric,
    serialize_unit_ref,
)

router = APIRouter(prefix="/missions", tags=["missions"])


def _student_section_ids(db: Session, user: User) -> list[int]:
    rows = db.execute(
        select(SectionEnrollment.section_id).where(
            SectionEnrollment.student_user_id == user.id,
            SectionEnrollment.status == "active",
        )
    ).all()
    return [section_id for (section_id,) in rows]


@router.get("")
def list_missions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    section_ids = _student_section_ids(db, current_user)

    # Due dates from assignments to the student's sections.
    due_by_mission: dict[int, object] = {}
    assignment_by_mission: dict[int, int] = {}
    if section_ids:
        assignments = (
            db.execute(
                select(MissionAssignment).where(
                    MissionAssignment.section_id.in_(section_ids)
                )
            )
            .scalars()
            .all()
        )
        for a in assignments:
            due_by_mission[a.mission_id] = a.due_at
            assignment_by_mission[a.mission_id] = a.id

    attempts = (
        db.execute(
            select(MissionAttempt).where(MissionAttempt.student_user_id == current_user.id)
        )
        .scalars()
        .all()
    )
    attempt_by_mission = {}
    for attempt in attempts:
        existing = attempt_by_mission.get(attempt.mission_id)
        if existing is None or attempt.id > existing.id:
            attempt_by_mission[attempt.mission_id] = attempt

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

    groups = []
    for unit in units:
        unit_missions = [m for m in missions if m.unit_id == unit.id]
        if not unit_missions:
            continue
        cards = []
        for mission in unit_missions:
            card = mission_card(
                mission,
                attempt_by_mission.get(mission.id),
                due_at=due_by_mission.get(mission.id),
            )
            card["assignment_id"] = assignment_by_mission.get(mission.id)
            card["assigned"] = mission.id in assignment_by_mission
            cards.append(card)
        groups.append(
            {
                "unit": serialize_unit_ref(unit),
                "missions": cards,
            }
        )

    return {"groups": groups}


@router.get("/{mission_id}")
def get_mission(
    mission_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    mission = db.get(Mission, mission_id)
    if mission is None or not mission.published:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="mission not found")

    attempt = (
        db.execute(
            select(MissionAttempt)
            .where(
                MissionAttempt.mission_id == mission_id,
                MissionAttempt.student_user_id == current_user.id,
            )
            .order_by(MissionAttempt.id.desc())
        )
        .scalars()
        .first()
    )

    return {
        "id": mission.id,
        "title": mission.title,
        "summary": mission.summary,
        "context_brief": mission.context_brief,
        "mission_type": mission.mission_type,
        "difficulty": mission.difficulty,
        "estimated_minutes": mission.estimated_minutes,
        "assessment_mode": mission.assessment_mode,
        "unit": serialize_unit_ref(mission.unit),
        "skills": [
            {"code": link.skill.code, "title": link.skill.title}
            for link in mission.skill_links
        ],
        "rubric": serialize_rubric(mission),
        "steps": mission.steps_json or [],
        "activity": public_activity(mission),
        "attempt_id": attempt.id if attempt else None,
        "attempt_status": attempt.status if attempt else "not_started",
    }
