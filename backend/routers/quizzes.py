from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from ..auth import get_current_user
from ..database import get_db
from ..models import Lesson, Quiz, QuizAttempt, QuizOption, QuizQuestion, User
from ..schemas import QuizRead, QuizSubmit, QuizSubmitResult


router = APIRouter(prefix="/quizzes", tags=["quizzes"])


def get_quiz_with_questions(db: Session, quiz_id: int) -> Quiz:
    statement = (
        select(Quiz)
        .where(Quiz.id == quiz_id)
        .options(selectinload(Quiz.questions).selectinload(QuizQuestion.options))
    )
    quiz = db.scalar(statement)

    if quiz is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="quiz not found",
        )

    return quiz


@router.get("/lesson/{lesson_id}", response_model=QuizRead)
def read_lesson_quiz(
    lesson_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    del current_user

    lesson = db.get(Lesson, lesson_id)

    if lesson is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="lesson not found",
        )

    statement = (
        select(Quiz)
        .where(Quiz.lesson_id == lesson_id)
        .options(selectinload(Quiz.questions).selectinload(QuizQuestion.options))
    )
    quiz = db.scalar(statement)

    if quiz is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="quiz not found",
        )

    return quiz


@router.post("/{quiz_id}/submit", response_model=QuizSubmitResult)
def submit_quiz(
    quiz_id: int,
    submission: QuizSubmit,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    quiz = get_quiz_with_questions(db, quiz_id)

    if not quiz.questions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="quiz has no questions",
        )

    submitted_answers = {
        answer.question_id: answer.option_id for answer in submission.answers
    }
    correct_count = 0
    results = []

    for question in quiz.questions:
        selected_option_id = submitted_answers.get(question.id)
        selected_option = None

        if selected_option_id is not None:
            selected_option = db.get(QuizOption, selected_option_id)

        if selected_option is None or selected_option.question_id != question.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="invalid quiz answer",
            )

        correct_option = next(
            (option for option in question.options if option.is_correct),
            None,
        )
        is_correct = bool(correct_option and selected_option.id == correct_option.id)

        if is_correct:
            correct_count += 1

        results.append(
            {
                "question_id": question.id,
                "selected_option_id": selected_option.id,
                "correct_option_id": correct_option.id if correct_option else None,
                "is_correct": is_correct,
            }
        )

    score = round((correct_count / len(quiz.questions)) * 100, 2)
    attempt = QuizAttempt(
        user_id=current_user.id,
        quiz_id=quiz.id,
        score=score,
    )
    db.add(attempt)
    db.commit()
    db.refresh(attempt)

    return {
        "attempt_id": attempt.id,
        "quiz_id": quiz.id,
        "score": score,
        "correct_count": correct_count,
        "total_questions": len(quiz.questions),
        "results": results,
    }
