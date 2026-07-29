from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..auth import get_current_user
from ..database import get_db
from ..models import CaseStudyResponse, Lesson, User
from ..schemas import CaseStudyResponseCreate, CaseStudyResponseRead


router = APIRouter(prefix="/responses", tags=["responses"])


@router.get("/lessons/{lesson_id}/me", response_model=CaseStudyResponseRead)
def read_my_response(
    lesson_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    response = db.scalar(
        select(CaseStudyResponse).where(
            CaseStudyResponse.lesson_id == lesson_id,
            CaseStudyResponse.user_id == current_user.id,
        )
    )

    if response is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="response not found",
        )

    return response


@router.post("/lessons/{lesson_id}", response_model=CaseStudyResponseRead)
def submit_response(
    lesson_id: int,
    submission: CaseStudyResponseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    lesson = db.get(Lesson, lesson_id)

    if lesson is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="assessment not found",
        )

    response = db.scalar(
        select(CaseStudyResponse).where(
            CaseStudyResponse.lesson_id == lesson_id,
            CaseStudyResponse.user_id == current_user.id,
        )
    )

    if response is None:
        response = CaseStudyResponse(
            user_id=current_user.id,
            lesson_id=lesson_id,
            response_text=submission.response_text,
        )
        db.add(response)
    else:
        response.response_text = submission.response_text
        response.submitted_at = datetime.utcnow()

    db.commit()
    db.refresh(response)

    return response
