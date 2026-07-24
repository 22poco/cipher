"""Teacher assessment hub: sections, gradebook, review queue, attempt review,
and hybrid grading with override auditing."""

from __future__ import annotations

from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from ..auth import require_teacher
from ..database import get_db
from ..models import (
    ApSkill,
    ClassSection,
    Grade,
    GradeAuditEvent,
    GradeCriterionScore,
    Mission,
    MissionAssignment,
    MissionAttempt,
    RubricCriterion,
    SectionEnrollment,
    SectionTeacher,
    SupportEvent,
    User,
)
from ..services.permissions import assert_teacher_can_review, teacher_section_ids
from ..services.serializers import (
    grade_summary,
    serialize_evidence,
    serialize_support_event,
    serialize_unit_ref,
)

router = APIRouter(prefix="/teacher", tags=["teacher"])

GRADED_STATUSES = {"graded", "returned"}
REVIEW_STATUSES = {"submitted", "auto_checked", "needs_teacher_review"}
SKILL_ORDER = ["analyze_risk", "mitigate_risk", "detect_attacks", "collaborate"]


def _now() -> datetime:
    return datetime.now(UTC).replace(tzinfo=None)


def _visible_sections(db: Session, user: User) -> list[ClassSection]:
    ids = teacher_section_ids(db, user)
    query = select(ClassSection).where(ClassSection.archived_at.is_(None))
    if ids is not None:
        query = query.where(ClassSection.id.in_(ids or [-1]))
    return db.execute(query.order_by(ClassSection.name)).scalars().all()


def _section_ids(db: Session, user: User) -> list[int]:
    return [s.id for s in _visible_sections(db, user)]


# --------------------------------------------------------------------------- #
# Sections
# --------------------------------------------------------------------------- #


@router.get("/sections")
def list_sections(
    current_user: User = Depends(require_teacher),
    db: Session = Depends(get_db),
):
    sections = _visible_sections(db, current_user)
    section_ids = [s.id for s in sections]

    enrollment_counts: dict[int, int] = {}
    for section_id, in db.execute(
        select(SectionEnrollment.section_id).where(
            SectionEnrollment.section_id.in_(section_ids or [-1]),
            SectionEnrollment.status == "active",
        )
    ).all():
        enrollment_counts[section_id] = enrollment_counts.get(section_id, 0) + 1

    assignment_counts: dict[int, int] = {}
    for section_id, in db.execute(
        select(MissionAssignment.section_id).where(
            MissionAssignment.section_id.in_(section_ids or [-1])
        )
    ).all():
        assignment_counts[section_id] = assignment_counts.get(section_id, 0) + 1

    # Average score + last activity per section, from graded attempts.
    attempts = (
        db.execute(
            select(MissionAttempt, MissionAssignment.section_id)
            .join(MissionAssignment, MissionAttempt.assignment_id == MissionAssignment.id)
            .where(MissionAssignment.section_id.in_(section_ids or [-1]))
            .options(selectinload(MissionAttempt.grade))
        ).all()
    )
    scores: dict[int, list[float]] = {}
    last_active: dict[int, datetime] = {}
    for attempt, section_id in attempts:
        stamp = attempt.submitted_at or attempt.started_at or attempt.created_at
        if stamp and (section_id not in last_active or stamp > last_active[section_id]):
            last_active[section_id] = stamp
        if attempt.grade and attempt.grade.final_score is not None:
            scores.setdefault(section_id, []).append(attempt.grade.final_score)

    section_rows = []
    for section in sections:
        skill_scores = scores.get(section.id, [])
        section_rows.append(
            {
                "id": section.id,
                "name": section.name,
                "period": section.period,
                "students": enrollment_counts.get(section.id, 0),
                "missions_assigned": assignment_counts.get(section.id, 0),
                "average_score": round(sum(skill_scores) / len(skill_scores))
                if skill_scores
                else None,
                "last_active": last_active.get(section.id),
            }
        )

    return {"sections": section_rows, "recent_activity": _recent_activity(db, section_ids)}


def _recent_activity(db: Session, section_ids: list[int]) -> list[dict]:
    activity: list[dict] = []

    assignments = (
        db.execute(
            select(MissionAssignment)
            .where(MissionAssignment.section_id.in_(section_ids or [-1]))
            .options(
                selectinload(MissionAssignment.mission),
                selectinload(MissionAssignment.section),
            )
            .order_by(MissionAssignment.created_at.desc())
            .limit(6)
        )
        .scalars()
        .all()
    )
    for a in assignments:
        activity.append(
            {
                "type": "assigned",
                "text": f"{a.mission.title} assigned to {a.section.name}",
                "at": a.created_at,
            }
        )

    graded = (
        db.execute(
            select(Grade, MissionAttempt, Mission, ClassSection)
            .join(MissionAttempt, Grade.attempt_id == MissionAttempt.id)
            .join(Mission, MissionAttempt.mission_id == Mission.id)
            .join(MissionAssignment, MissionAttempt.assignment_id == MissionAssignment.id)
            .join(ClassSection, MissionAssignment.section_id == ClassSection.id)
            .where(
                MissionAssignment.section_id.in_(section_ids or [-1]),
                Grade.finalized_at.is_not(None),
            )
            .order_by(Grade.finalized_at.desc())
            .limit(4)
        ).all()
    )
    for grade, _attempt, mission, section in graded:
        activity.append(
            {
                "type": "graded",
                "text": f"{mission.title} graded in {section.name}",
                "at": grade.finalized_at,
            }
        )

    activity.sort(key=lambda item: item["at"] or datetime.min, reverse=True)
    return activity[:6]


# --------------------------------------------------------------------------- #
# Overview + review queue
# --------------------------------------------------------------------------- #


def _review_queue(db: Session, section_ids: list[int], limit: int | None = None) -> list[dict]:
    rows = (
        db.execute(
            select(MissionAttempt, Mission, ClassSection, User)
            .join(Mission, MissionAttempt.mission_id == Mission.id)
            .join(MissionAssignment, MissionAttempt.assignment_id == MissionAssignment.id)
            .join(ClassSection, MissionAssignment.section_id == ClassSection.id)
            .join(User, MissionAttempt.student_user_id == User.id)
            .where(
                MissionAssignment.section_id.in_(section_ids or [-1]),
                MissionAttempt.status.in_(REVIEW_STATUSES),
            )
            .options(selectinload(MissionAttempt.auto_check))
            .order_by(MissionAttempt.submitted_at.desc())
        ).all()
    )
    queue = []
    for attempt, mission, section, student in rows:
        queue.append(
            {
                "attempt_id": attempt.id,
                "student": student.name,
                "mission": mission.title,
                "unit": serialize_unit_ref(mission.unit),
                "section": section.name,
                "submitted_at": attempt.submitted_at,
                "auto_check_passed": attempt.auto_check.passed if attempt.auto_check else None,
                "status": attempt.status,
            }
        )
    return queue[:limit] if limit else queue


@router.get("/overview")
def teacher_overview(
    current_user: User = Depends(require_teacher),
    db: Session = Depends(get_db),
):
    sections = _visible_sections(db, current_user)
    section_ids = [s.id for s in sections]

    assignments = db.execute(
        select(MissionAssignment).where(MissionAssignment.section_id.in_(section_ids or [-1]))
    ).scalars().all()

    all_attempts = (
        db.execute(
            select(MissionAttempt)
            .join(MissionAssignment, MissionAttempt.assignment_id == MissionAssignment.id)
            .where(MissionAssignment.section_id.in_(section_ids or [-1]))
            .options(selectinload(MissionAttempt.grade))
        )
        .scalars()
        .all()
    )
    awaiting = sum(1 for a in all_attempts if a.status in REVIEW_STATUSES)
    returned = sum(1 for a in all_attempts if a.status == "returned")
    graded_scores = [
        a.grade.final_score
        for a in all_attempts
        if a.grade and a.grade.final_score is not None
    ]

    return {
        "cards": {
            "active_sections": len(sections),
            "missions_assigned": len(assignments),
            "awaiting_review": awaiting,
            "returned_week": returned,
            "average_score": round(sum(graded_scores) / len(graded_scores))
            if graded_scores
            else None,
        },
        "review_queue": _review_queue(db, section_ids, limit=8),
    }


@router.get("/review-queue")
def review_queue(
    current_user: User = Depends(require_teacher),
    db: Session = Depends(get_db),
):
    return {"queue": _review_queue(db, _section_ids(db, current_user))}


# --------------------------------------------------------------------------- #
# Gradebook
# --------------------------------------------------------------------------- #


@router.get("/gradebook")
def gradebook(
    section_id: int | None = None,
    current_user: User = Depends(require_teacher),
    db: Session = Depends(get_db),
):
    sections = _visible_sections(db, current_user)
    if not sections:
        return {"sections": [], "skills": [], "students": [], "active_section_id": None}

    section_ids_list = [s.id for s in sections]
    if section_id in section_ids_list:
        active_id = section_id
    else:
        # Default to the busiest section so the gradebook opens with data.
        counts: dict[int, int] = {}
        for (sid,) in db.execute(
            select(SectionEnrollment.section_id).where(
                SectionEnrollment.section_id.in_(section_ids_list),
                SectionEnrollment.status == "active",
            )
        ).all():
            counts[sid] = counts.get(sid, 0) + 1
        active_id = max(section_ids_list, key=lambda sid: counts.get(sid, 0))

    skills = db.execute(select(ApSkill).order_by(ApSkill.order_index)).scalars().all()
    skill_codes = [s.code for s in skills]

    students = (
        db.execute(
            select(User)
            .join(SectionEnrollment, SectionEnrollment.student_user_id == User.id)
            .where(
                SectionEnrollment.section_id == active_id,
                SectionEnrollment.status == "active",
            )
            .order_by(User.name)
        )
        .scalars()
        .all()
    )

    rows = []
    for student in students:
        # Graded attempts by this student inside this section.
        grades = (
            db.execute(
                select(Grade)
                .join(MissionAttempt, Grade.attempt_id == MissionAttempt.id)
                .join(MissionAssignment, MissionAttempt.assignment_id == MissionAssignment.id)
                .where(
                    MissionAttempt.student_user_id == student.id,
                    MissionAssignment.section_id == active_id,
                    MissionAttempt.status.in_(GRADED_STATUSES),
                )
                .options(
                    selectinload(Grade.criterion_scores)
                    .selectinload(GradeCriterionScore.criterion)
                    .selectinload(RubricCriterion.skill)
                )
            )
            .scalars()
            .all()
        )
        skill_pcts: dict[str, list[float]] = {code: [] for code in skill_codes}
        for grade in grades:
            for cs in grade.criterion_scores:
                code = cs.criterion.skill.code
                possible = cs.criterion.points or 1
                skill_pcts.setdefault(code, []).append(100 * cs.points_awarded / possible)

        skill_scores = {
            code: (round(sum(vals) / len(vals)) if vals else None)
            for code, vals in skill_pcts.items()
        }
        present = [v for v in skill_scores.values() if v is not None]
        rows.append(
            {
                "student_id": student.id,
                "student": student.name,
                "skills": skill_scores,
                "average": round(sum(present) / len(present)) if present else None,
            }
        )

    return {
        "sections": [{"id": s.id, "name": s.name, "period": s.period} for s in sections],
        "active_section_id": active_id,
        "skills": [{"code": s.code, "title": s.title} for s in skills],
        "students": rows,
    }


# --------------------------------------------------------------------------- #
# Attempt review + grading
# --------------------------------------------------------------------------- #


class CriterionScoreIn(BaseModel):
    criterion_id: int
    points_awarded: float


class GradeIn(BaseModel):
    final_score: float
    max_score: float = 100
    comment: str | None = None
    criterion_scores: list[CriterionScoreIn] = []
    finalize: bool = False


class GradeOverrideIn(BaseModel):
    final_score: float
    reason: str
    comment: str | None = None


@router.get("/attempts/{attempt_id}")
def review_attempt(
    attempt_id: int,
    current_user: User = Depends(require_teacher),
    db: Session = Depends(get_db),
):
    attempt = db.get(MissionAttempt, attempt_id)
    if attempt is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="attempt not found")
    assert_teacher_can_review(db, current_user, attempt)

    mission = attempt.mission
    student = attempt.student
    section = None
    if attempt.assignment_id:
        assignment = db.get(MissionAssignment, attempt.assignment_id)
        section = assignment.section if assignment else None

    rubric = mission.rubric
    rubric_payload = None
    if rubric:
        rubric_payload = {
            "id": rubric.id,
            "title": rubric.title,
            "total_points": rubric.total_points,
            "criteria": [
                {
                    "id": c.id,
                    "title": c.title,
                    "description": c.description,
                    "points": c.points,
                    "skill_code": c.skill.code,
                    "skill_title": c.skill.title,
                }
                for c in rubric.criteria
            ],
        }

    grade = attempt.grade
    auto = attempt.auto_check

    return {
        "attempt": {
            "id": attempt.id,
            "status": attempt.status,
            "submitted_at": attempt.submitted_at,
            "active_support_signal": attempt.active_support_signal,
        },
        "student": {"id": student.id, "name": student.name},
        "section": {"id": section.id, "name": section.name} if section else None,
        "mission": {
            "id": mission.id,
            "title": mission.title,
            "mission_type": mission.mission_type,
            "unit": serialize_unit_ref(mission.unit),
        },
        "evidence": [serialize_evidence(e) for e in attempt.evidence],
        "support_events": [serialize_support_event(e) for e in attempt.support_events],
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
        "rubric": rubric_payload,
        "grade": grade_summary(grade),
        "grade_audit": [
            {
                "old_value": e.old_value_json,
                "new_value": e.new_value_json,
                "reason": e.reason,
                "created_at": e.created_at,
            }
            for e in (grade.audit_events if grade else [])
        ],
    }


@router.post("/attempts/{attempt_id}/grade")
def grade_attempt(
    attempt_id: int,
    body: GradeIn,
    current_user: User = Depends(require_teacher),
    db: Session = Depends(get_db),
):
    attempt = db.get(MissionAttempt, attempt_id)
    if attempt is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="attempt not found")
    assert_teacher_can_review(db, current_user, attempt)

    grade = attempt.grade
    if grade is None:
        grade = Grade(attempt_id=attempt.id)
        db.add(grade)
        db.flush()

    grade.teacher_user_id = current_user.id
    grade.final_score = body.final_score
    grade.max_score = body.max_score
    grade.comment = body.comment

    # Replace criterion scores.
    for existing in list(grade.criterion_scores):
        db.delete(existing)
    db.flush()
    for cs in body.criterion_scores:
        db.add(
            GradeCriterionScore(
                grade_id=grade.id,
                rubric_criterion_id=cs.criterion_id,
                points_awarded=cs.points_awarded,
            )
        )

    if body.finalize:
        grade.finalized_at = _now()
        attempt.status = "returned"
        attempt.returned_at = _now()
    else:
        attempt.status = "graded"

    db.commit()
    db.refresh(grade)
    return {"status": attempt.status, "grade": grade_summary(grade)}


@router.patch("/grades/{grade_id}")
def override_grade(
    grade_id: int,
    body: GradeOverrideIn,
    current_user: User = Depends(require_teacher),
    db: Session = Depends(get_db),
):
    grade = db.get(Grade, grade_id)
    if grade is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="grade not found")
    assert_teacher_can_review(db, current_user, grade.attempt)

    if not body.reason.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="a reason is required to override a finalized grade",
        )

    old_value = {"final_score": grade.final_score, "comment": grade.comment}
    db.add(
        GradeAuditEvent(
            grade_id=grade.id,
            changed_by_user_id=current_user.id,
            old_value_json=old_value,
            new_value_json={"final_score": body.final_score, "comment": body.comment},
            reason=body.reason,
        )
    )
    grade.final_score = body.final_score
    if body.comment is not None:
        grade.comment = body.comment
    grade.finalized_at = _now()
    db.commit()
    db.refresh(grade)
    return {"grade": grade_summary(grade)}
