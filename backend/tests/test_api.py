"""api behavior tests: quiz scoring, mock-exam frq grading math, and
per-user authorization on attempts and responses.

these run each request through the real fastapi app against a throwaway
database, so what they pin is the shipped interface, not internals.
"""

import datetime
from contextlib import contextmanager

import pytest
from sqlalchemy import select

from backend.database import SessionLocal
from backend.models import MockExamAttempt, Quiz, User

STUDENT2_EMAIL = "student2@example.com"


def _lesson_of_quiz(quiz_id: int) -> int:
    with SessionLocal() as db:
        return db.get(Quiz, quiz_id).lesson_id


@contextmanager
def fresh_mock_attempts(owner_email: str, count: int = 1):
    """hydrated mock-exam attempt rows (score 40, ungraded frq), cleaned up."""
    with SessionLocal() as db:
        owner = db.scalar(select(User).where(User.email == owner_email))
        assert owner is not None

        attempts = [
            MockExamAttempt(
                user_id=owner.id,
                exam_kind="unit",
                unit_id=unit,
                score=40.0,
                total_questions=30,
                correct_count=12,
                duration_seconds=600,
                frq_response="test frq response",
                submitted_at=datetime.datetime.utcnow(),
            )
            for unit in range(1, count + 1)
        ]
        db.add_all(attempts)
        db.commit()
        ids = [attempt.id for attempt in attempts]
    try:
        yield ids if count > 1 else ids[0]
    finally:
        with SessionLocal() as db:
            for attempt_id in ids:
                row = db.get(MockExamAttempt, attempt_id)
                if row is not None:
                    db.delete(row)
            db.commit()


# --- quiz scoring -----------------------------------------------------------


def test_submit_quiz_all_correct_scores_100(client, student_auth, topic_quiz):
    answers = [
        {"question_id": answer["question_id"], "option_id": answer["option_id"]}
        for answer in topic_quiz["answers"]
    ]
    response = client.post(
        f"/quizzes/{topic_quiz['id']}/submit",
        json={"answers": answers},
        headers=student_auth,
    )

    assert response.status_code == 200, response.text
    body = response.json()
    assert body["score"] == 100
    assert body["correct_count"] == body["total_questions"] == len(answers)
    assert all(result["is_correct"] for result in body["results"])


def test_submit_quiz_one_wrong_scores_rounded(client, student_auth, topic_quiz):
    answers = [
        {
            "question_id": answer["question_id"],
            "option_id": (
                answer["wrong_option_id"] if index == 0 else answer["option_id"]
            ),
        }
        for index, answer in enumerate(topic_quiz["answers"])
    ]
    response = client.post(
        f"/quizzes/{topic_quiz['id']}/submit",
        json={"answers": answers},
        headers=student_auth,
    )

    assert response.status_code == 200, response.text
    body = response.json()
    expected = round((body["correct_count"] / body["total_questions"]) * 100, 2)
    assert body["score"] == expected
    assert body["correct_count"] == len(topic_quiz["answers"]) - 1


def test_submit_quiz_answer_from_other_question_rejected(
    client, student_auth, topic_quiz
):
    # the option belongs to a different question: never count it
    answers = [
        {
            "question_id": topic_quiz["answers"][0]["question_id"],
            "option_id": topic_quiz["answers"][1]["option_id"],
        }
    ]
    response = client.post(
        f"/quizzes/{topic_quiz['id']}/submit",
        json={"answers": answers},
        headers=student_auth,
    )

    assert response.status_code == 400


def test_submit_quiz_requires_auth(client, topic_quiz):
    response = client.post(
        f"/quizzes/{topic_quiz['id']}/submit",
        json={"answers": []},
    )
    assert response.status_code in (401, 403)


def test_quiz_attempts_are_scoped_to_their_owner(
    client, student_auth, student2_auth, topic_quiz
):
    lesson_id = _lesson_of_quiz(topic_quiz["id"])
    mine = client.get(f"/quizzes/lesson/{lesson_id}/attempts", headers=student_auth)
    theirs = client.get(f"/quizzes/lesson/{lesson_id}/attempts", headers=student2_auth)

    assert mine.status_code == 200 and theirs.status_code == 200
    # student1 submitted above; student2 submitted nothing on this quiz
    assert mine.json() != []
    assert theirs.json() == []


# --- per-user authorization -------------------------------------------------


def test_foreign_mock_exam_attempt_returns_404(
    client, student_auth, student2_auth
):
    with fresh_mock_attempts(STUDENT2_EMAIL) as attempt_id:
        foreign = client.get(
            f"/mock-exams/attempts/{attempt_id}", headers=student_auth
        )
        own = client.get(f"/mock-exams/attempts/{attempt_id}", headers=student2_auth)

    assert foreign.status_code == 404, foreign.text
    assert own.status_code == 200, own.text


def test_student_cannot_grade_attempt(client, student_auth):
    with fresh_mock_attempts(STUDENT2_EMAIL) as attempt_id:
        response = client.patch(
            f"/mock-exams/grading/{attempt_id}",
            json={"frq_score": 7, "frq_score_set": True},
            headers=student_auth,
        )

    assert response.status_code == 403, response.text


# --- mock-exam frq grading math ---------------------------------------------


def _grade(client, teacher_auth, attempt_id, frq_score):
    return client.patch(
        f"/mock-exams/grading/{attempt_id}",
        json={
            "frq_score": frq_score,
            "frq_score_set": True,
            "frq_reviewed": True,
            "frq_feedback": "good reasoning on part 2",
        },
        headers=teacher_auth,
    )


def test_frq_grading_replaces_not_compounds(client, teacher_auth):
    """score under frq grading: mcq raw * 70% + frq points / 14 * 30%,
    and regrading swaps the frq part instead of stacking it."""
    with fresh_mock_attempts(STUDENT2_EMAIL, count=1) as attempt_id:
        first = _grade(client, teacher_auth, attempt_id, 7).json()
        assert first["score"] == 55.0  # 40 (mcq part) + (7/14)*30
        assert first["frq_contribution"] == 15.0

        second = _grade(client, teacher_auth, attempt_id, 14).json()
        assert second["score"] == 70.0  # 40 + 30, not 40 + 30 + 15
        assert second["frq_contribution"] == 30.0


def test_clearing_frq_grade_restores_raw_score(client, teacher_auth):
    with fresh_mock_attempts(STUDENT2_EMAIL, count=1) as attempt_id:
        graded = _grade(client, teacher_auth, attempt_id, 7).json()
        assert graded["score"] == 55.0

        cleared = client.patch(
            f"/mock-exams/grading/{attempt_id}",
            json={"frq_reviewed": False, "frq_score_set": True},
            headers=teacher_auth,
        ).json()

        assert cleared["frq_score"] is None
        assert cleared["frq_reviewed"] is False
        assert cleared["frq_contribution"] == 0.0
        assert cleared["score"] == 40.0
