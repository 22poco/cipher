from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from ..auth import get_current_user
from ..database import get_db
from ..models import Lesson, LessonProgress, Quiz, QuizAttempt, Unit, User
from ..schemas import LessonProgressRead, ProgressSummary, QuizAttemptRead


router = APIRouter(prefix="/progress", tags=["progress"])


def unit_lesson_count(db: Session, unit_id: int) -> int:
    return db.scalar(
        select(func.count(Lesson.id))
        .join(Lesson.module)
        .where(Lesson.module.has(unit_id=unit_id))
    ) or 0


def quiz_attempt_with_title(attempt: QuizAttempt) -> QuizAttemptRead:
    return QuizAttemptRead(
        id=attempt.id,
        quiz_id=attempt.quiz_id,
        quiz_title=attempt.quiz.title if attempt.quiz else None,
        score=attempt.score,
        submitted_at=attempt.submitted_at,
    )


@router.post("/lessons/{lesson_id}/complete", response_model=LessonProgressRead)
def complete_lesson(
    lesson_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    lesson = db.get(Lesson, lesson_id)

    if lesson is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="lesson not found",
        )

    progress = db.scalar(
        select(LessonProgress).where(
            LessonProgress.user_id == current_user.id,
            LessonProgress.lesson_id == lesson_id,
        )
    )

    if progress is None:
        progress = LessonProgress(
            user_id=current_user.id,
            lesson_id=lesson_id,
            completed=True,
            completed_at=datetime.utcnow(),
        )
        db.add(progress)
    else:
        progress.completed = True
        progress.completed_at = progress.completed_at or datetime.utcnow()

    db.commit()
    db.refresh(progress)

    return progress


@router.get("/me", response_model=ProgressSummary)
def read_my_progress(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    total_lessons = db.scalar(select(func.count(Lesson.id))) or 0
    lesson_progress = db.scalars(
        select(LessonProgress)
        .where(
            LessonProgress.user_id == current_user.id,
            LessonProgress.completed.is_(True),
        )
        .order_by(LessonProgress.completed_at.desc())
    ).all()
    quiz_attempts = db.scalars(
        select(QuizAttempt)
        .options(selectinload(QuizAttempt.quiz))
        .where(QuizAttempt.user_id == current_user.id)
        .order_by(QuizAttempt.submitted_at.desc())
    ).all()
    unit_one = db.scalar(select(Unit).where(Unit.order_index == 1))
    unit_one_percent = 0.0

    if unit_one is not None:
        total_unit_lessons = unit_lesson_count(db, unit_one.id)
        completed_unit_lessons = db.scalar(
            select(func.count(LessonProgress.id))
            .join(LessonProgress.lesson)
            .join(Lesson.module)
            .where(
                Lesson.module.has(unit_id=unit_one.id),
                LessonProgress.user_id == current_user.id,
                LessonProgress.completed.is_(True),
            )
        ) or 0

        if total_unit_lessons:
            unit_one_percent = round(
                (completed_unit_lessons / total_unit_lessons) * 100,
                2,
            )

    return ProgressSummary(
        completed_lessons=len(lesson_progress),
        total_lessons=total_lessons,
        unit_1_progress_percent=unit_one_percent,
        lesson_progress=lesson_progress,
        quiz_attempts=[quiz_attempt_with_title(a) for a in quiz_attempts],
    )


@router.get("/units/{unit_id}", response_model=ProgressSummary)
def read_unit_progress(
    unit_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    unit = db.get(Unit, unit_id)

    if unit is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="unit not found",
        )

    total_lessons = unit_lesson_count(db, unit_id)
    lesson_progress = db.scalars(
        select(LessonProgress)
        .join(LessonProgress.lesson)
        .join(Lesson.module)
        .where(
            Lesson.module.has(unit_id=unit_id),
            LessonProgress.user_id == current_user.id,
            LessonProgress.completed.is_(True),
        )
        .order_by(LessonProgress.completed_at.desc())
    ).all()
    quiz_attempts = db.scalars(
        select(QuizAttempt)
        .options(selectinload(QuizAttempt.quiz))
        .where(QuizAttempt.user_id == current_user.id)
        .order_by(QuizAttempt.submitted_at.desc())
    ).all()
    progress_percent = 0.0

    if total_lessons:
        progress_percent = round((len(lesson_progress) / total_lessons) * 100, 2)

    return ProgressSummary(
        completed_lessons=len(lesson_progress),
        total_lessons=total_lessons,
        unit_1_progress_percent=progress_percent,
        lesson_progress=lesson_progress,
        quiz_attempts=[quiz_attempt_with_title(a) for a in quiz_attempts],
    )
