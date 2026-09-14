import random
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from ..auth import get_current_user, require_admin
from ..database import get_db
from ..exam_bank import (
    EXAM_MCQ_WEIGHT,
    EXAM_FRQ_WEIGHT,
    FRQ_BANK,
    FULL_MCQ_COUNT,
    FULL_TIME_LIMIT_MINUTES,
    UNIT_MCQ_COUNT,
    UNIT_TIME_LIMIT_MINUTES,
)
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
    AdminMockExamAttemptRead,
    AdminMockExamGradingUpdate,
    MockExamAttemptRead,
    MockExamDefinitionRead,
    MockExamExamPaperRead,
    MockExamFRQPartRead,
    MockExamFRQSourceRead,
    MockExamPaper,
    MockExamResultRead,
    MockExamSubmit,
    QuizAnswerResult,
    QuizAnswerSubmit,
)

router = APIRouter(prefix="/mock-exams", tags=["mock-exams"])


def load_bank_questions(db: Session, unit_id: int | None) -> list[QuizQuestion]:
    statement = (
        select(QuizQuestion)
        .join(Quiz, QuizQuestion.quiz_id == Quiz.id)
        .join(Lesson, Quiz.lesson_id == Lesson.id)
        .join(Module, Lesson.module_id == Module.id)
        .where(Module.title == "exam bank", QuizQuestion.order_index > 0)
        .options(selectinload(QuizQuestion.options))
    )
    if unit_id is not None:
        statement = statement.where(Module.unit_id == unit_id)
    questions = db.scalars(statement).all()

    valid = [
        question
        for question in questions
        if len(question.options) >= 2
        and any(option.is_correct for option in question.options)
    ]
    return valid


def get_exam_definition(unit_id: int | None) -> dict:
    if unit_id is None:
        return {
            "key": "full",
            "kind": "full",
            "title": "full course exam",
            "description": (
                "the complete practice exam: 60 multiple-choice questions across all "
                "five units plus the device security analysis free-response question. "
                "same structure and weighting as the real ap exam."
            ),
            "mcq_count": FULL_MCQ_COUNT,
            "time_limit_minutes": FULL_TIME_LIMIT_MINUTES,
        }
    return {
        "key": f"unit-{unit_id}",
        "kind": "unit",
        "unit_id": unit_id,
        "title": f"unit {unit_id} exam",
        "description": (
            "a unit practice exam: 30 hard multiple-choice questions plus the device "
            "security analysis free-response question. half length, full difficulty."
        ),
        "mcq_count": UNIT_MCQ_COUNT,
        "time_limit_minutes": UNIT_TIME_LIMIT_MINUTES,
    }


def build_paper(db: Session, unit_id: int | None, seed: int) -> list[QuizQuestion]:
    pool = load_bank_questions(db, unit_id)
    if not pool:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="the exam bank is empty. run the seed script first.",
        )

    count = get_exam_definition(unit_id)["mcq_count"]
    if len(pool) < count:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"exam bank has only {len(pool)} questions; needs {count}.",
        )

    rng = random.Random(seed)
    paper = list(pool)
    rng.shuffle(paper)
    return paper[:count]


def get_attempt_or_404(db: Session, attempt_id: int, user: User) -> MockExamAttempt:
    attempt = db.get(MockExamAttempt, attempt_id)
    if attempt is None or attempt.user_id != user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="exam attempt not found",
        )
    return attempt


@router.get("", response_model=list[MockExamDefinitionRead])
def list_mock_exams(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    del current_user

    definitions = [get_exam_definition(None)]
    definitions.extend(get_exam_definition(unit_id) for unit_id in range(1, 6))

    result = []
    for definition in definitions:
        unit_id = definition.get("unit_id")
        pool_size = len(load_bank_questions(db, unit_id))
        result.append(
            MockExamDefinitionRead(
                key=definition["key"],
                kind=definition["kind"],
                unit_id=unit_id,
                title=definition["title"],
                description=definition["description"],
                mcq_count=definition["mcq_count"],
                has_frq=True,
                time_limit_minutes=definition["time_limit_minutes"],
                questions_available=pool_size,
            )
        )
    return result


@router.get("/frq", response_model=MockExamPaper)
def read_frq(
    current_user: User = Depends(get_current_user),
):
    del current_user

    frq = FRQ_BANK[0]
    return MockExamPaper(
        title=frq["title"],
        prompt=frq["prompt"],
        sources=[
            MockExamFRQSourceRead(**source) for source in frq["sources"]
        ],
        parts=[MockExamFRQPartRead(**part) for part in frq["parts"]],
    )


def resolve_exam_key(exam_key: str) -> int | None:
    unit_id: int | None
    if exam_key == "full":
        unit_id = None
    elif exam_key.startswith("unit-"):
        try:
            unit_id = int(exam_key.removeprefix("unit-"))
        except ValueError as error:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="unknown exam",
            ) from error
        if unit_id < 1 or unit_id > 5:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="unknown exam",
            )
    else:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="unknown exam",
        )
    return unit_id


def paper_response(
    db: Session,
    exam_key: str,
    unit_id: int | None,
    seed: int,
) -> MockExamExamPaperRead:
    paper = build_paper(db, unit_id, seed)
    definition = get_exam_definition(unit_id)

    return MockExamExamPaperRead(
        seed=seed,
        exam_key=exam_key,
        kind=definition["kind"],
        unit_id=unit_id,
        time_limit_seconds=definition["time_limit_minutes"] * 60,
        frq_time_limit_seconds=50 * 60,
        questions=[
            {
                "id": question.id,
                "question_text": question.question_text,
                "module_title": "ap exam bank",
                "module_order_index": 0,
                "options": question.options,
            }
            for question in paper
        ],
    )


@router.post("/{exam_key}/start", response_model=MockExamExamPaperRead)
def start_exam(
    exam_key: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    del current_user

    unit_id = resolve_exam_key(exam_key)
    seed = random.randrange(2**31)
    return paper_response(db, exam_key, unit_id, seed)


@router.get("/{exam_key}/paper/{seed}", response_model=MockExamExamPaperRead)
def read_paper_by_seed(
    exam_key: str,
    seed: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """rebuild a paper deterministically so a saved attempt can resume."""
    del current_user

    unit_id = resolve_exam_key(exam_key)
    return paper_response(db, exam_key, unit_id, seed)


def _score_mcq(
    paper: list[QuizQuestion],
    submitted_answers: dict[int, int],
    attempt: MockExamAttempt,
    db: Session,
) -> tuple[int, list[QuizAnswerResult]]:
    correct_count = 0
    results = []

    for question in paper:
        selected_option_id = submitted_answers.get(question.id)
        correct_option = next(
            (option for option in question.options if option.is_correct),
            None,
        )

        if selected_option_id is None:
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

    return correct_count, results


@router.post("/{exam_key}/submit", response_model=MockExamResultRead)
def submit_exam(
    exam_key: str,
    submission: MockExamSubmit,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    unit_id: int | None
    if exam_key == "full":
        unit_id = None
    elif exam_key.startswith("unit-"):
        try:
            unit_id = int(exam_key.removeprefix("unit-"))
        except ValueError as error:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="unknown exam",
            ) from error
        if unit_id < 1 or unit_id > 5:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="unknown exam",
            )
    else:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="unknown exam",
        )

    paper = build_paper(db, unit_id, submission.seed)
    definition = get_exam_definition(unit_id)

    attempt = MockExamAttempt(
        user_id=current_user.id,
        exam_kind=definition["kind"],
        unit_id=unit_id,
        score=0,
        total_questions=len(paper),
        correct_count=0,
        duration_seconds=submission.duration_seconds,
        frq_response=submission.frq_response,
    )
    db.add(attempt)
    db.flush()

    submitted_answers = {
        answer.question_id: answer.option_id for answer in submission.answers
    }
    correct_count, results = _score_mcq(paper, submitted_answers, attempt, db)

    mcq_score = round((correct_count / len(paper)) * 100, 2)
    if submission.frq_response is not None:
        score = round(mcq_score * (EXAM_MCQ_WEIGHT / 100), 2)
    else:
        score = mcq_score
    attempt.score = score
    attempt.correct_count = correct_count
    db.commit()

    return MockExamResultRead(
        attempt_id=attempt.id,
        score=score,
        correct_count=correct_count,
        total_questions=len(paper),
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


@router.get("/attempts/{attempt_id}", response_model=MockExamResultRead)
def read_attempt_review(
    attempt_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    attempt = get_attempt_or_404(db, attempt_id, current_user)

    answers = db.scalars(
        select(MockExamAttemptAnswer)
        .where(MockExamAttemptAnswer.attempt_id == attempt.id)
        .options(selectinload(MockExamAttemptAnswer.question).selectinload(QuizQuestion.options))
    ).all()

    return MockExamResultRead(
        attempt_id=attempt.id,
        score=attempt.score,
        correct_count=attempt.correct_count,
        total_questions=attempt.total_questions,
        results=[
            QuizAnswerResult(
                question_id=answer.question_id,
                selected_option_id=answer.selected_option_id,
                correct_option_id=answer.correct_option_id,
                is_correct=answer.is_correct,
            )
            for answer in answers
        ],
    )


@router.get("/grading", response_model=list[AdminMockExamAttemptRead])
def read_attempts_for_grading(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    del current_user

    attempts = db.scalars(
        select(MockExamAttempt)
        .options(selectinload(MockExamAttempt.user))
        .order_by(MockExamAttempt.frq_reviewed.asc(), MockExamAttempt.submitted_at.desc())
        .limit(100)
    ).all()

    return [
        AdminMockExamAttemptRead(
            id=attempt.id,
            student_id=attempt.user.id,
            student_name=attempt.user.name,
            student_email=attempt.user.email,
            exam_kind=attempt.exam_kind,
            unit_id=attempt.unit_id,
            score=attempt.score,
            total_questions=attempt.total_questions,
            correct_count=attempt.correct_count,
            duration_seconds=attempt.duration_seconds,
            frq_response=attempt.frq_response,
            frq_score=attempt.frq_score,
            frq_feedback=attempt.frq_feedback,
            frq_part_scores=attempt.frq_part_scores,
            frq_reviewed=attempt.frq_reviewed,
            submitted_at=attempt.submitted_at,
        )
        for attempt in attempts
    ]


@router.patch("/grading/{attempt_id}", response_model=AdminMockExamAttemptRead)
def grade_attempt_frq(
    attempt_id: int,
    grading: AdminMockExamGradingUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    attempt = db.get(MockExamAttempt, attempt_id)
    if attempt is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="exam attempt not found",
        )

    if grading.frq_score is not None:
        attempt.frq_score = max(0.0, min(grading.frq_score, 14.0))
    if grading.frq_part_scores is not None:
        attempt.frq_part_scores = grading.frq_part_scores
    if grading.frq_feedback is not None:
        attempt.frq_feedback = grading.frq_feedback

    attempt.frq_reviewed = grading.frq_reviewed
    attempt.frq_reviewed_at = datetime.utcnow() if grading.frq_reviewed else None
    attempt.frq_reviewed_by_id = current_user.id if grading.frq_reviewed else None

    if attempt.frq_score is not None:
        frq_percentage = (attempt.frq_score / 14.0) * EXAM_FRQ_WEIGHT
        if attempt.frq_response is not None:
            # submitted with frq: mcq score is already on the 70% scale
            attempt.score = round(attempt.score + frq_percentage, 2)
        else:
            # defensive: attempt without an frq response is capped at 100
            attempt.score = round(min(100.0, attempt.score + frq_percentage), 2)

    db.commit()
    db.refresh(attempt)

    return AdminMockExamAttemptRead(
        id=attempt.id,
        student_id=attempt.user_id,
        student_name=attempt.user.name,
        student_email=attempt.user.email,
        exam_kind=attempt.exam_kind,
        unit_id=attempt.unit_id,
        score=attempt.score,
        total_questions=attempt.total_questions,
        correct_count=attempt.correct_count,
        duration_seconds=attempt.duration_seconds,
        frq_response=attempt.frq_response,
        frq_score=attempt.frq_score,
        frq_feedback=attempt.frq_feedback,
        frq_part_scores=attempt.frq_part_scores,
        frq_reviewed=attempt.frq_reviewed,
        submitted_at=attempt.submitted_at,
    )
