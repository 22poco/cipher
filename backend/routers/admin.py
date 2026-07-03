from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..auth import require_admin
from ..database import get_db
from ..models import Lesson, Module, Unit, User
from ..schemas import (
    DeleteResponse,
    LessonCreate,
    LessonRead,
    LessonUpdate,
    ModuleCreate,
    ModuleRead,
    ModuleUpdate,
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
