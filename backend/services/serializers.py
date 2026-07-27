"""Shared constants and serializers that turn ORM objects into the JSON shapes
the Cipher frontend consumes. Routers stay thin by delegating here."""

from __future__ import annotations

from ..models import (
    ApSkill,
    AttemptEvidence,
    Grade,
    Mission,
    MissionAttempt,
    SupportEvent,
    Unit,
    User,
)

# One identifiable accent per AP unit (order_index -> token). The frontend maps
# these tokens to concrete colours so the accent stays a secondary identifier.
UNIT_ACCENTS = {1: "green", 2: "blue", 3: "purple", 4: "orange", 5: "teal"}

# Missions that objective auto-checks can score without teacher judgement.
AUTO_CHECKED_TYPES = {"multiple_choice", "bash_simulation", "network_simulation"}


def unit_accent(order_index: int) -> str:
    return UNIT_ACCENTS.get(order_index, "blue")


def serialize_user(user: User) -> dict:
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "role": user.role,
    }


def serialize_skill(skill: ApSkill) -> dict:
    return {
        "id": skill.id,
        "code": skill.code,
        "title": skill.title,
        "description": skill.description,
    }


def serialize_unit_ref(unit: Unit) -> dict:
    return {
        "id": unit.id,
        "order_index": unit.order_index,
        "title": unit.title,
        "accent": unit_accent(unit.order_index),
    }


def serialize_support_event(event: SupportEvent) -> dict:
    return {
        "id": event.id,
        "from_signal": event.from_signal,
        "to_signal": event.to_signal,
        "note": event.note,
        "source": event.source,
        "created_at": event.created_at,
    }


def serialize_evidence(evidence: AttemptEvidence) -> dict:
    return {
        "id": evidence.id,
        "evidence_type": evidence.evidence_type,
        "payload": evidence.payload_json,
        "updated_at": evidence.updated_at,
    }


def serialize_mission_skills(mission: Mission) -> list[dict]:
    return [
        {"code": link.skill.code, "title": link.skill.title}
        for link in mission.skill_links
    ]


def public_activity(mission: Mission) -> dict:
    """Student-visible activity payload with private answer keys removed."""

    activity = dict(mission.activity_json or {})
    questions = activity.get("questions")
    if isinstance(questions, list):
        activity["questions"] = [
            {k: v for k, v in q.items() if k != "answer_index"}
            if isinstance(q, dict)
            else q
            for q in questions
        ]
    return activity


def serialize_rubric(mission: Mission) -> dict | None:
    if mission.rubric is None:
        return None
    return {
        "id": mission.rubric.id,
        "title": mission.rubric.title,
        "total_points": mission.rubric.total_points,
        "criteria": [
            {
                "id": c.id,
                "title": c.title,
                "description": c.description,
                "points": c.points,
                "skill_code": c.skill.code,
                "skill_title": c.skill.title,
            }
            for c in mission.rubric.criteria
        ],
    }


def mission_card(
    mission: Mission,
    attempt: MissionAttempt | None = None,
    due_at=None,
) -> dict:
    """Compact mission representation for catalogue cards and dashboard rows."""

    return {
        "id": mission.id,
        "title": mission.title,
        "summary": mission.summary,
        "mission_type": mission.mission_type,
        "difficulty": mission.difficulty,
        "estimated_minutes": mission.estimated_minutes,
        "unit": serialize_unit_ref(mission.unit),
        "skills": serialize_mission_skills(mission),
        "status": attempt.status if attempt else "not_started",
        "attempt_id": attempt.id if attempt else None,
        "progress_percent": attempt.progress_percent if attempt else 0,
        "due_at": due_at,
    }


def grade_summary(grade: Grade | None) -> dict | None:
    if grade is None:
        return None
    return {
        "final_score": grade.final_score,
        "max_score": grade.max_score,
        "comment": grade.comment,
        "finalized_at": grade.finalized_at,
        "criterion_scores": [
            {
                "criterion_id": cs.rubric_criterion_id,
                "skill_code": cs.criterion.skill.code,
                "skill_title": cs.criterion.skill.title,
                "criterion_title": cs.criterion.title,
                "points_awarded": cs.points_awarded,
                "points_possible": cs.criterion.points,
            }
            for cs in grade.criterion_scores
        ],
    }
