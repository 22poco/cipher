from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..auth import get_current_user
from ..database import get_db
from ..models import CaseStudyPractice, Lesson, Module, Unit, User
from ..schemas import CaseStudyPracticeIndexRead, CaseStudyPracticeRead


router = APIRouter(prefix="/practice-cases", tags=["practice"])


@router.get("", response_model=list[CaseStudyPracticeIndexRead])
def list_all_practice_cases(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """index of every extra case study, ordered like the course.

    the extra tab groups these client-side by module; entries never carry
    answer keys or rubrics, same rule as the per-lesson route.
    """
    del current_user

    rows = db.execute(
        select(
            CaseStudyPractice.id,
            CaseStudyPractice.lesson_id,
            CaseStudyPractice.variant,
            CaseStudyPractice.title,
            CaseStudyPractice.points,
            Lesson.title.label("lesson_title"),
            Unit.order_index.label("unit_order"),
            Unit.title.label("unit_title"),
        )
        .join(Lesson, CaseStudyPractice.lesson_id == Lesson.id)
        .join(Module, Lesson.module_id == Module.id)
        .join(Unit, Module.unit_id == Unit.id)
        .where(Module.is_hidden.is_(False))
        .order_by(Unit.order_index, Lesson.order_index, CaseStudyPractice.variant)
    ).all()

    return [
        CaseStudyPracticeIndexRead(
            id=row.id,
            lesson_id=row.lesson_id,
            variant=row.variant,
            title=row.title,
            points=row.points,
            lesson_title=row.lesson_title,
            unit_order=row.unit_order,
            unit_title=row.unit_title,
        )
        for row in rows
    ]


@router.get("/lessons/{lesson_id}", response_model=list[CaseStudyPracticeRead])
def list_practice_cases(
    lesson_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """ungraded extra case studies for a topic, listed under the graded one.

    these are not lessons, so nothing here reaches progress or the gradebook,
    and the response carries no answer key or rubric.
    """
    del current_user

    lesson = db.get(Lesson, lesson_id)
    if lesson is None or lesson.module.is_hidden:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="lesson not found",
        )

    return db.scalars(
        select(CaseStudyPractice)
        .where(CaseStudyPractice.lesson_id == lesson_id)
        .order_by(CaseStudyPractice.variant)
    ).all()
