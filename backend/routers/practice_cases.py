from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..auth import get_current_user
from ..database import get_db
from ..models import CaseStudyPractice, Lesson, User
from ..schemas import CaseStudyPracticeRead


router = APIRouter(prefix="/practice-cases", tags=["practice"])


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
