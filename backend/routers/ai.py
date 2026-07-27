"""AI tutor — formative, assessment-mode guardrails only.

V1 ships a deterministic Socratic responder so the panel is fully functional
without an OpenAI key. Using the tutor records an `AI` support event, and every
interaction is stored in the AI tables, kept separate from final evidence.
"""

from __future__ import annotations

from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..auth import get_current_user
from ..database import get_db
from ..models import AiTutorMessage, AiTutorSession, MissionAttempt, SupportEvent, User
from ..services.permissions import assert_owns_attempt, assert_teacher_can_review

router = APIRouter(prefix="/ai", tags=["ai"])


def _assert_can_view(db: Session, user: User, attempt: MissionAttempt) -> None:
    """Owner may view their own tutor session; teachers/admins may view a
    session on an attempt in one of their sections."""

    if user.role in ("teacher", "admin"):
        assert_teacher_can_review(db, user, attempt)
    else:
        assert_owns_attempt(user, attempt)


def _serialize_session(session: AiTutorSession | None) -> dict:
    if session is None:
        return {"session": None, "messages": []}
    return {
        "session": {
            "id": session.id,
            "model": session.model,
            "assessment_mode": session.assessment_mode,
            "created_at": session.created_at,
        },
        "messages": [
            {
                "id": message.id,
                "role": message.role,
                "content": message.content,
                "refused": bool((message.metadata_json or {}).get("refused")),
                "created_at": message.created_at,
            }
            for message in session.messages
        ],
    }

# Phrases that indicate a request for the final answer -> Socratic refusal.
DIRECT_ANSWER_TRIGGERS = (
    "answer",
    "just tell me",
    "give me the solution",
    "what should i write",
    "write it for me",
    "do it for me",
)


class MessageBody(BaseModel):
    content: str


def _now() -> datetime:
    return datetime.now(UTC).replace(tzinfo=None)


def _formative_reply(prompt: str) -> tuple[str, bool]:
    """Return (reply, refused). Refuses direct-answer requests with a hint."""

    lowered = prompt.lower()
    if any(trigger in lowered for trigger in DIRECT_ANSWER_TRIGGERS):
        return (
            "I can't write your submission for you — the evidence you turn in "
            "needs to be your own work. Let's get you there instead: which piece "
            "of the scenario evidence points most directly at the risk, and what "
            "makes you say so?",
            True,
        )
    return (
        "Good question. Before I add anything, walk me through what you already "
        "notice in the evidence. What stands out, and which rubric skill "
        "(Analyze Risk, Mitigate Risk, Detect Attacks, Collaborate) does it map to?",
        False,
    )


@router.get("/attempts/{attempt_id}/session")
def get_session(
    attempt_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    attempt = db.get(MissionAttempt, attempt_id)
    if attempt is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="attempt not found")
    _assert_can_view(db, current_user, attempt)

    session = db.execute(
        select(AiTutorSession).where(AiTutorSession.attempt_id == attempt_id)
    ).scalar_one_or_none()
    return _serialize_session(session)


@router.post("/attempts/{attempt_id}/messages", status_code=status.HTTP_201_CREATED)
def send_message(
    attempt_id: int,
    body: MessageBody,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    attempt = db.get(MissionAttempt, attempt_id)
    if attempt is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="attempt not found")
    assert_owns_attempt(current_user, attempt)

    session = db.execute(
        select(AiTutorSession).where(AiTutorSession.attempt_id == attempt_id)
    ).scalar_one_or_none()
    if session is None:
        session = AiTutorSession(
            attempt_id=attempt_id,
            student_user_id=current_user.id,
            model="cipher-socratic-v1",
            assessment_mode=attempt.mission.assessment_mode,
        )
        db.add(session)
        db.flush()

    reply, refused = _formative_reply(body.content)

    db.add(AiTutorMessage(session_id=session.id, role="student", content=body.content))
    db.add(
        AiTutorMessage(
            session_id=session.id,
            role="tutor",
            content=reply,
            metadata_json={"refused": refused, "formative_only": True},
        )
    )

    # Using the tutor automatically records an AI support event.
    if attempt.active_support_signal != "ai":
        db.add(
            SupportEvent(
                attempt_id=attempt.id,
                from_signal=attempt.active_support_signal,
                to_signal="ai",
                source="ai",
                note="Used the AI tutor",
            )
        )
        attempt.active_support_signal = "ai"

    db.commit()
    return {"reply": reply, "refused": refused, "session_id": session.id}
