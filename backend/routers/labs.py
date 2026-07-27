"""Teacher-facing simulated attack lab surface.

Section lab-mode settings, the five-lab catalog, narrow lab assignment, the
aggregate-first dashboard summary, and assignment-scoped reset. All routes are
teacher/admin gated and section-scoped; students never touch this router.
"""

from __future__ import annotations

from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from ..auth import require_teacher
from ..database import get_db
from ..models import (
    Mission,
    MissionAssignment,
    Unit,
    User,
)
from ..services import labs
from ..services.serializers import mission_card, serialize_unit_ref

router = APIRouter(prefix="/teacher/labs", tags=["labs"])

ACKNOWLEDGEMENT_TEXT = [
    "Labs use only synthetic data — never real credentials.",
    "Labs are for authorized classroom instruction only.",
    "Surprise-reveal mode must stay inside assigned lab missions.",
    "You are responsible for clearing retained lab events when they are no longer needed.",
    "Grades are based on analysis and mitigation quality, not whether a student fell for the simulation.",
]


def _now() -> datetime:
    return datetime.now(UTC).replace(tzinfo=None)


def _serialize_settings(settings) -> dict:
    return {
        "section_id": settings.section_id,
        "enabled": settings.enabled,
        "enabled_by_user_id": settings.enabled_by_user_id,
        "enabled_at": settings.enabled_at,
        "acknowledgement_version": settings.acknowledgement_version,
        "retention_mode": settings.retention_mode,
        "last_reset_at": settings.last_reset_at,
        "last_reset_by_user_id": settings.last_reset_by_user_id,
    }


# --------------------------------------------------------------------------- #
# Settings
# --------------------------------------------------------------------------- #


class LabSettingsIn(BaseModel):
    enabled: bool
    acknowledgement_version: str | None = None


@router.get("/sections/{section_id}/settings")
def get_lab_settings(
    section_id: int,
    current_user: User = Depends(require_teacher),
    db: Session = Depends(get_db),
):
    labs.assert_teacher_can_manage_lab_section(db, current_user, section_id)
    settings = labs.get_or_create_lab_settings(db, section_id)
    db.commit()
    return {
        "settings": _serialize_settings(settings),
        "acknowledgement": {
            "version": labs.ACKNOWLEDGEMENT_VERSION,
            "statements": ACKNOWLEDGEMENT_TEXT,
        },
    }


@router.patch("/sections/{section_id}/settings")
def update_lab_settings(
    section_id: int,
    body: LabSettingsIn,
    current_user: User = Depends(require_teacher),
    db: Session = Depends(get_db),
):
    labs.assert_teacher_can_manage_lab_section(db, current_user, section_id)
    settings = labs.get_or_create_lab_settings(db, section_id)

    if body.enabled and not settings.enabled:
        settings.enabled = True
        settings.enabled_by_user_id = current_user.id
        settings.enabled_at = _now()
        settings.acknowledgement_version = (
            body.acknowledgement_version or labs.ACKNOWLEDGEMENT_VERSION
        )
    elif not body.enabled:
        # Disabling prevents future starts but never deletes submitted analysis.
        settings.enabled = False

    db.commit()
    db.refresh(settings)
    return {"settings": _serialize_settings(settings)}


# --------------------------------------------------------------------------- #
# Catalog
# --------------------------------------------------------------------------- #


@router.get("/catalog")
def lab_catalog(
    section_id: int | None = None,
    current_user: User = Depends(require_teacher),
    db: Session = Depends(get_db),
):
    if section_id is not None:
        labs.assert_teacher_can_manage_lab_section(db, current_user, section_id)

    missions = (
        db.execute(
            select(Mission)
            .where(
                Mission.published.is_(True),
                Mission.mission_type == labs.ATTACK_SIMULATION_TYPE,
            )
            .options(selectinload(Mission.unit), selectinload(Mission.skill_links))
            .order_by(Mission.order_index)
        )
        .scalars()
        .all()
    )

    # Existing lab assignments for the selected section (mission_id -> assignment).
    assigned: dict[int, MissionAssignment] = {}
    if section_id is not None:
        for assignment in (
            db.execute(
                select(MissionAssignment).where(MissionAssignment.section_id == section_id)
            )
            .scalars()
            .all()
        ):
            assigned[assignment.mission_id] = assignment

    units = db.execute(select(Unit).order_by(Unit.order_index)).scalars().all()
    groups = []
    for unit in units:
        unit_missions = [m for m in missions if m.unit_id == unit.id]
        if not unit_missions:
            continue
        cards = []
        for mission in unit_missions:
            config = mission.activity_json or {}
            existing = assigned.get(mission.id)
            card = mission_card(mission)
            card.update(
                {
                    "lab_type": config.get("lab_type"),
                    "default_disclosure_mode": config.get("default_disclosure_mode")
                    or labs.DEFAULT_DISCLOSURE_MODE,
                    "allowed_disclosure_modes": config.get("allowed_disclosure_modes")
                    or list(labs.DISCLOSURE_MODES),
                    "assigned": existing is not None,
                    "assignment_id": existing.id if existing else None,
                    "assigned_disclosure_mode": existing.lab_disclosure_mode if existing else None,
                }
            )
            cards.append(card)
        groups.append({"unit": serialize_unit_ref(unit), "labs": cards})

    lab_enabled = labs.lab_mode_enabled(db, section_id) if section_id is not None else False
    return {"groups": groups, "section_id": section_id, "lab_enabled": lab_enabled}


# --------------------------------------------------------------------------- #
# Assignment
# --------------------------------------------------------------------------- #


class LabAssignmentIn(BaseModel):
    mission_id: int
    section_id: int
    disclosure_mode: str
    due_at: datetime | None = None


@router.post("/assignments", status_code=status.HTTP_201_CREATED)
def assign_lab(
    body: LabAssignmentIn,
    current_user: User = Depends(require_teacher),
    db: Session = Depends(get_db),
):
    labs.assert_teacher_can_manage_lab_section(db, current_user, body.section_id)

    mission = db.get(Mission, body.mission_id)
    if mission is None or not mission.published or not labs.is_attack_simulation(mission):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="this endpoint only assigns simulated attack labs",
        )

    if body.disclosure_mode not in labs.DISCLOSURE_MODES:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="disclosure mode must be transparent or surprise",
        )

    if not labs.lab_mode_enabled(db, body.section_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="enable lab mode for this section before assigning a lab",
        )

    existing = db.execute(
        select(MissionAssignment).where(
            MissionAssignment.mission_id == body.mission_id,
            MissionAssignment.section_id == body.section_id,
        )
    ).scalar_one_or_none()

    if existing is not None:
        existing.lab_disclosure_mode = body.disclosure_mode
        if body.due_at is not None:
            existing.due_at = body.due_at
        assignment = existing
    else:
        assignment = MissionAssignment(
            mission_id=body.mission_id,
            section_id=body.section_id,
            assigned_by_user_id=current_user.id,
            due_at=body.due_at,
            lab_disclosure_mode=body.disclosure_mode,
        )
        db.add(assignment)

    db.commit()
    db.refresh(assignment)
    return {
        "assignment": {
            "id": assignment.id,
            "mission_id": assignment.mission_id,
            "section_id": assignment.section_id,
            "disclosure_mode": assignment.lab_disclosure_mode,
            "due_at": assignment.due_at,
        },
        "mission": mission_card(mission),
    }


# --------------------------------------------------------------------------- #
# Summary + reset
# --------------------------------------------------------------------------- #


@router.get("/summary")
def lab_summary(
    section_id: int,
    assignment_id: int | None = None,
    current_user: User = Depends(require_teacher),
    db: Session = Depends(get_db),
):
    labs.assert_teacher_can_manage_lab_section(db, current_user, section_id)
    return labs.aggregate_lab_summary(db, section_id, assignment_id)


class LabResetIn(BaseModel):
    section_id: int
    assignment_id: int
    confirm: bool = False


@router.post("/reset")
def reset_lab(
    body: LabResetIn,
    current_user: User = Depends(require_teacher),
    db: Session = Depends(get_db),
):
    labs.assert_teacher_can_manage_lab_section(db, current_user, body.section_id)

    if not body.confirm:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="reset must be confirmed",
        )

    assignment = db.get(MissionAssignment, body.assignment_id)
    if assignment is None or assignment.section_id != body.section_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="lab assignment not found for this section",
        )

    result = labs.reset_lab_events(db, body.section_id, body.assignment_id, current_user)
    db.commit()
    # Recompute aggregate dashboard metrics after reset.
    summary = labs.aggregate_lab_summary(db, body.section_id, body.assignment_id)
    return {"reset": result, "summary": summary}
