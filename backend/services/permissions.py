"""Section- and role-aware authorization helpers.

Students may only touch their own attempts. Teachers may only reach attempts in
sections they teach. Admins bypass section scoping.
"""

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..models import (
    MissionAssignment,
    MissionAttempt,
    SectionEnrollment,
    SectionTeacher,
    User,
)


def teacher_section_ids(db: Session, user: User) -> list[int]:
    """Section ids a teacher can see. Admins get every section."""

    if user.role == "admin":
        return [s_id for (s_id,) in db.execute(select(SectionTeacher.section_id)).all()] or None
    rows = db.execute(
        select(SectionTeacher.section_id).where(SectionTeacher.teacher_user_id == user.id)
    ).all()
    return [section_id for (section_id,) in rows]


def student_section_ids(db: Session, user: User) -> list[int]:
    rows = db.execute(
        select(SectionEnrollment.section_id).where(
            SectionEnrollment.student_user_id == user.id,
            SectionEnrollment.status == "active",
        )
    ).all()
    return [section_id for (section_id,) in rows]


def assert_owns_attempt(user: User, attempt: MissionAttempt) -> None:
    if attempt.student_user_id != user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="you can only access your own attempts",
        )


def assert_teacher_can_review(db: Session, user: User, attempt: MissionAttempt) -> None:
    """Reject cross-section review unless the user is an admin."""

    if user.role == "admin":
        return

    allowed = teacher_section_ids(db, user) or []
    assignment = (
        db.get(MissionAssignment, attempt.assignment_id) if attempt.assignment_id else None
    )
    section_id = assignment.section_id if assignment else None

    if section_id is None or section_id not in allowed:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="this attempt is not in one of your sections",
        )
