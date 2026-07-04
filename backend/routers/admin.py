from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from ..auth import require_admin
from ..database import get_db
from ..models import Lesson, Module, Quiz, QuizOption, QuizQuestion, Unit, User
from ..schemas import (
    DeleteResponse,
    LessonCreate,
    LessonRead,
    LessonUpdate,
    ModuleCreate,
    ModuleRead,
    ModuleUpdate,
    QuizAdminRead,
    QuizCreate,
    QuizOptionAdminRead,
    QuizOptionCreate,
    QuizOptionUpdate,
    QuizQuestionAdminRead,
    QuizQuestionCreate,
    QuizQuestionUpdate,
    QuizUpdate,
    UnitCreate,
    UnitRead,
    UnitUpdate,
)


router = APIRouter(prefix="/admin", tags=["admin"])


def get_unit_or_404(db: Session, unit_id: int) -> Unit:
    unit = db.get(Unit, unit_id)

    if unit is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="unit not found",
        )

    return unit


def get_module_or_404(db: Session, module_id: int) -> Module:
    module = db.get(Module, module_id)

    if module is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="module not found",
        )

    return module


def get_lesson_or_404(db: Session, lesson_id: int) -> Lesson:
    lesson = db.get(Lesson, lesson_id)

    if lesson is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="lesson not found",
        )

    return lesson


def get_quiz_or_404(db: Session, quiz_id: int) -> Quiz:
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


def get_question_or_404(db: Session, question_id: int) -> QuizQuestion:
    statement = (
        select(QuizQuestion)
        .where(QuizQuestion.id == question_id)
        .options(selectinload(QuizQuestion.options))
    )
    question = db.scalar(statement)

    if question is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="quiz question not found",
        )

    return question


def get_option_or_404(db: Session, option_id: int) -> QuizOption:
    option = db.get(QuizOption, option_id)

    if option is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="quiz option not found",
        )

    return option


def keep_single_correct_option(db: Session, option: QuizOption) -> None:
    if not option.is_correct:
        return

    question = get_question_or_404(db, option.question_id)

    for other_option in question.options:
        if other_option.id != option.id:
            other_option.is_correct = False


@router.post("/units", response_model=UnitRead, status_code=status.HTTP_201_CREATED)
def create_unit(
    unit_data: UnitCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    del current_user

    unit = Unit(**unit_data.model_dump())
    db.add(unit)
    db.commit()
    db.refresh(unit)

    return unit


@router.patch("/units/{unit_id}", response_model=UnitRead)
def update_unit(
    unit_id: int,
    unit_data: UnitUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    del current_user

    unit = get_unit_or_404(db, unit_id)

    for field, value in unit_data.model_dump(exclude_unset=True).items():
        setattr(unit, field, value)

    db.commit()
    db.refresh(unit)

    return unit


@router.delete("/units/{unit_id}", response_model=DeleteResponse)
def delete_unit(
    unit_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    del current_user

    unit = get_unit_or_404(db, unit_id)
    db.delete(unit)
    db.commit()

    return DeleteResponse(message="unit deleted")


@router.post("/modules", response_model=ModuleRead, status_code=status.HTTP_201_CREATED)
def create_module(
    module_data: ModuleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    del current_user

    get_unit_or_404(db, module_data.unit_id)
    module = Module(**module_data.model_dump())
    db.add(module)
    db.commit()
    db.refresh(module)

    return module


@router.patch("/modules/{module_id}", response_model=ModuleRead)
def update_module(
    module_id: int,
    module_data: ModuleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    del current_user

    module = get_module_or_404(db, module_id)
    update_data = module_data.model_dump(exclude_unset=True)

    if "unit_id" in update_data and update_data["unit_id"] is not None:
        get_unit_or_404(db, update_data["unit_id"])

    for field, value in update_data.items():
        setattr(module, field, value)

    db.commit()
    db.refresh(module)

    return module


@router.delete("/modules/{module_id}", response_model=DeleteResponse)
def delete_module(
    module_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    del current_user

    module = get_module_or_404(db, module_id)
    db.delete(module)
    db.commit()

    return DeleteResponse(message="module deleted")


@router.post("/lessons", response_model=LessonRead, status_code=status.HTTP_201_CREATED)
def create_lesson(
    lesson_data: LessonCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    del current_user

    get_module_or_404(db, lesson_data.module_id)
    lesson = Lesson(**lesson_data.model_dump())
    db.add(lesson)
    db.commit()
    db.refresh(lesson)

    return lesson


@router.patch("/lessons/{lesson_id}", response_model=LessonRead)
def update_lesson(
    lesson_id: int,
    lesson_data: LessonUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    del current_user

    lesson = get_lesson_or_404(db, lesson_id)
    update_data = lesson_data.model_dump(exclude_unset=True)

    if "module_id" in update_data and update_data["module_id"] is not None:
        get_module_or_404(db, update_data["module_id"])

    for field, value in update_data.items():
        setattr(lesson, field, value)

    db.commit()
    db.refresh(lesson)

    return lesson


@router.delete("/lessons/{lesson_id}", response_model=DeleteResponse)
def delete_lesson(
    lesson_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    del current_user

    lesson = get_lesson_or_404(db, lesson_id)
    db.delete(lesson)
    db.commit()

    return DeleteResponse(message="lesson deleted")


@router.get("/lessons/{lesson_id}/quiz", response_model=QuizAdminRead)
def read_lesson_quiz(
    lesson_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    del current_user

    get_lesson_or_404(db, lesson_id)
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


@router.post("/quizzes", response_model=QuizAdminRead, status_code=status.HTTP_201_CREATED)
def create_quiz(
    quiz_data: QuizCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    del current_user

    get_lesson_or_404(db, quiz_data.lesson_id)
    existing_quiz = db.scalar(select(Quiz).where(Quiz.lesson_id == quiz_data.lesson_id))

    if existing_quiz is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="lesson already has a quiz",
        )

    quiz = Quiz(**quiz_data.model_dump())
    db.add(quiz)
    db.commit()
    db.refresh(quiz)

    return get_quiz_or_404(db, quiz.id)


@router.patch("/quizzes/{quiz_id}", response_model=QuizAdminRead)
def update_quiz(
    quiz_id: int,
    quiz_data: QuizUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    del current_user

    quiz = get_quiz_or_404(db, quiz_id)
    update_data = quiz_data.model_dump(exclude_unset=True)

    if "lesson_id" in update_data and update_data["lesson_id"] is not None:
        get_lesson_or_404(db, update_data["lesson_id"])

    for field, value in update_data.items():
        setattr(quiz, field, value)

    db.commit()
    db.refresh(quiz)

    return get_quiz_or_404(db, quiz.id)


@router.delete("/quizzes/{quiz_id}", response_model=DeleteResponse)
def delete_quiz(
    quiz_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    del current_user

    quiz = get_quiz_or_404(db, quiz_id)
    db.delete(quiz)
    db.commit()

    return DeleteResponse(message="quiz deleted")


@router.post(
    "/quiz-questions",
    response_model=QuizQuestionAdminRead,
    status_code=status.HTTP_201_CREATED,
)
def create_quiz_question(
    question_data: QuizQuestionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    del current_user

    get_quiz_or_404(db, question_data.quiz_id)
    question = QuizQuestion(
        quiz_id=question_data.quiz_id,
        question_text=question_data.question_text,
        question_type=question_data.question_type,
        order_index=question_data.order_index,
    )
    db.add(question)
    db.flush()

    for option_data in question_data.options:
        option = QuizOption(question_id=question.id, **option_data.model_dump())
        db.add(option)
        db.flush()
        keep_single_correct_option(db, option)

    db.commit()

    return get_question_or_404(db, question.id)


@router.patch("/quiz-questions/{question_id}", response_model=QuizQuestionAdminRead)
def update_quiz_question(
    question_id: int,
    question_data: QuizQuestionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    del current_user

    question = get_question_or_404(db, question_id)

    for field, value in question_data.model_dump(exclude_unset=True).items():
        setattr(question, field, value)

    db.commit()

    return get_question_or_404(db, question.id)


@router.delete("/quiz-questions/{question_id}", response_model=DeleteResponse)
def delete_quiz_question(
    question_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    del current_user

    question = get_question_or_404(db, question_id)
    db.delete(question)
    db.commit()

    return DeleteResponse(message="quiz question deleted")


@router.post(
    "/quiz-questions/{question_id}/options",
    response_model=QuizOptionAdminRead,
    status_code=status.HTTP_201_CREATED,
)
def create_quiz_option(
    question_id: int,
    option_data: QuizOptionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    del current_user

    get_question_or_404(db, question_id)
    option = QuizOption(question_id=question_id, **option_data.model_dump())
    db.add(option)
    db.flush()
    keep_single_correct_option(db, option)
    db.commit()
    db.refresh(option)

    return option


@router.patch("/quiz-options/{option_id}", response_model=QuizOptionAdminRead)
def update_quiz_option(
    option_id: int,
    option_data: QuizOptionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    del current_user

    option = get_option_or_404(db, option_id)

    for field, value in option_data.model_dump(exclude_unset=True).items():
        setattr(option, field, value)

    keep_single_correct_option(db, option)
    db.commit()
    db.refresh(option)

    return option


@router.delete("/quiz-options/{option_id}", response_model=DeleteResponse)
def delete_quiz_option(
    option_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    del current_user

    option = get_option_or_404(db, option_id)
    db.delete(option)
    db.commit()

    return DeleteResponse(message="quiz option deleted")
