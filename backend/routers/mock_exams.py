import random

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from ..auth import get_current_user
from ..database import get_db
from ..models import (
    Lesson,
    MockExamAttempt,
    MockExamAttemptAnswer,
    Module,
    Quiz,
    QuizOption,
    QuizQuestion,
    Unit,
    User,
)
from ..schemas import (
    MockExamAttemptRead,
    MockExamQuestionRead,
    MockExamRead,
    MockExamResultRead,
    MockExamSubmit,
    QuizAnswerResult,
)

router = APIRouter(prefix="/mock-exams", tags=["mock-exams"])

QUESTIONS_PER_MODULE = 4
EXAM_TIME_LIMIT_SECONDS = 40 * 60


def load_module_question_pool(db: Session) -> dict[int, list[QuizQuestion]]:
    statement = (
        select(QuizQuestion)
        .join(Quiz, QuizQuestion.quiz_id == Quiz.id)
        .join(Lesson, Quiz.lesson_id == Lesson.id)
        .join(Module, Lesson.module_id == Module.id)
        .join(Unit, Module.unit_id == Unit.id)
        .options(
            selectinload(QuizQuestion.options),
            selectinload(QuizQuestion.quiz)
            .selectinload(Quiz.lesson)
            .selectinload(Lesson.module)
            .selectinload(Module.unit),
        )
        .order_by(Unit.order_index, QuizQuestion.order_index)
    )
    questions = db.scalars(statement).all()

    pool: dict[int, list[QuizQuestion]] = {}
    for question in questions:
        has_correct_option = any(option.is_correct for option in question.options)
        if not has_correct_option:
            continue
        unit_id = question.quiz.lesson.module.unit_id
        pool.setdefault(unit_id, []).append(question)

    return pool


def build_exam_questions(db: Session, seed: int) -> list[QuizQuestion]:
    pool = load_module_question_pool(db)

    if not pool:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="no quiz questions available yet. ask your teacher to add assessments first.",
        )

    # a client-provided seed makes the exam deterministic: the submit call
    # rebuilds the exact same paper the student saw and answered.
    rng = random.Random(seed)

    exam_questions: list[QuizQuestion] = []
    for unit_questions in pool.values():
        shuffled = list(unit_questions)
        rng.shuffle(shuffled)
        exam_questions.extend(shuffled[:QUESTIONS_PER_MODULE])

    if not exam_questions:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="no quiz questions available yet. ask your teacher to add assessments first.",
        )

    rng.shuffle(exam_questions)
    return exam_questions


@router.get("", response_model=MockExamRead)
def read_mock_exam(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    del current_user

    seed = random.randrange(2**31)
    exam_questions = build_exam_questions(db, seed)

    return MockExamRead(
        seed=seed,
        total_questions=len(exam_questions),
        time_limit_seconds=EXAM_TIME_LIMIT_SECONDS,
        questions=[
            MockExamQuestionRead(
                id=question.id,
                question_text=question.question_text,
                module_title=question.quiz.lesson.module.unit.title,
                module_order_index=question.quiz.lesson.module.unit.order_index,
                options=question.options,
            )
            for question in exam_questions
        ],
    )


@router.post("/submit", response_model=MockExamResultRead)
def submit_mock_exam(
    submission: MockExamSubmit,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    exam_questions = build_exam_questions(db, submission.seed)

    if not exam_questions:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="no quiz questions available",
        )

    submitted_answers = {
        answer.question_id: answer.option_id for answer in submission.answers
    }

    attempt = MockExamAttempt(
        user_id=current_user.id,
        score=0,
        total_questions=len(exam_questions),
        correct_count=0,
        duration_seconds=submission.duration_seconds,
    )
    db.add(attempt)
    db.flush()

    correct_count = 0
    results = []

    for question in exam_questions:
        selected_option_id = submitted_answers.get(question.id)
        correct_option = next(
            (option for option in question.options if option.is_correct),
            None,
        )

        if selected_option_id is None:
            # unanswered: store the row so the teacher sees which questions
            # were skipped, but no selected option.
            db.add(
                MockExamAttemptAnswer(
                    attempt_id=attempt.id,
                    question_id=question.id,
                    selected_option_id=None,
                    correct_option_id=correct_option.id if correct_option else None,
                    is_correct=False,
                )
            )
            results.append(
                QuizAnswerResult(
                    question_id=question.id,
                    selected_option_id=None,
                    correct_option_id=correct_option.id if correct_option else None,
                    is_correct=False,
                )
            )
            continue

        selected_option = db.get(QuizOption, selected_option_id)

        if selected_option is None or selected_option.question_id != question.id:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="invalid mock exam answer",
            )

        correct_option = next(
            (option for option in question.options if option.is_correct),
            None,
        )
        is_correct = bool(correct_option and selected_option.id == correct_option.id)

        if is_correct:
            correct_count += 1

        db.add(
            MockExamAttemptAnswer(
                attempt_id=attempt.id,
                question_id=question.id,
                selected_option_id=selected_option.id,
                correct_option_id=correct_option.id if correct_option else None,
                is_correct=is_correct,
            )
        )
        results.append(
            QuizAnswerResult(
                question_id=question.id,
                selected_option_id=selected_option.id,
                correct_option_id=correct_option.id if correct_option else None,
                is_correct=is_correct,
            )
        )

    score = round((correct_count / len(exam_questions)) * 100, 2)
    attempt.score = score
    attempt.correct_count = correct_count
    db.commit()

    return MockExamResultRead(
        attempt_id=attempt.id,
        score=score,
        correct_count=correct_count,
        total_questions=len(exam_questions),
        results=results,
    )


@router.get("/attempts", response_model=list[MockExamAttemptRead])
def read_my_mock_exam_attempts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    attempts = db.scalars(
        select(MockExamAttempt)
        .where(MockExamAttempt.user_id == current_user.id)
        .order_by(MockExamAttempt.submitted_at.desc())
    ).all()

    return attempts
