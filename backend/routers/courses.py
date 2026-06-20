from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from ..auth import get_current_user
from ..database import get_db
from ..models import Lesson, Module, Unit, User
from ..schemas import LessonRead, ModuleRead, UnitRead, UnitSummary


router = APIRouter(prefix="/courses", tags=["courses"])


@router.get("/units", response_model=list[UnitSummary])
def list_units(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    del current_user

    statement = (
        select(Unit)
        .options(selectinload(Unit.modules).selectinload(Module.lessons))
        .order_by(Unit.order_index)
    )

    return db.scalars(statement).all()


@router.get("/units/{unit_id}", response_model=UnitRead)
def read_unit(
    unit_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    del current_user

    statement = (
        select(Unit)
        .where(Unit.id == unit_id)
        .options(selectinload(Unit.modules).selectinload(Module.lessons))
    )
    unit = db.scalar(statement)

    if unit is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="unit not found",
        )

    return unit


@router.get("/modules/{module_id}", response_model=ModuleRead)
def read_module(
    module_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    del current_user

    statement = (
        select(Module)
        .where(Module.id == module_id)
        .options(selectinload(Module.lessons))
    )
    module = db.scalar(statement)

    if module is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="module not found",
        )

    return module


@router.get("/lessons/{lesson_id}", response_model=LessonRead)
def read_lesson(
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

    return lesson
