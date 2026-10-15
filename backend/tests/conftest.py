"""api test fixtures.

runs against a throwaway copy of the schema (cipher_test_db) so tests can
register users, submit quizzes, and grade without touching dev data.
DATABASE_URL is set at the very top, before any backend import, so the
config/database engine binds to the test database.
"""

import os

TEST_DATABASE_URL = (
    "postgresql://cipher_user:cipher_password@localhost:5433/cipher_test_db"
)
POSTGRES_ADMIN_URL = (
    "postgresql://cipher_user:cipher_password@localhost:5433/postgres"
)
os.environ["DATABASE_URL"] = TEST_DATABASE_URL

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402
from sqlalchemy import create_engine, select, text  # noqa: E402

STUDENT_EMAIL = "student1@example.com"
STUDENT2_EMAIL = "student2@example.com"
TEACHER_EMAIL = "teacher@example.com"
TEST_PASSWORD = "test-password-123"


@pytest.fixture(scope="session", autouse=True)
def test_database():
    """recreate the throwaway test database and seed it once per run."""
    admin = create_engine(
        POSTGRES_ADMIN_URL.replace("postgresql://", "postgresql+psycopg://"),
        isolation_level="AUTOCOMMIT",
    )
    with admin.connect() as connection:
        connection.execute(
            text("DROP DATABASE IF EXISTS cipher_test_db WITH (FORCE)")
        )
        connection.execute(text("CREATE DATABASE cipher_test_db"))
    admin.dispose()

    from backend.auth import hash_password
    from backend.database import SessionLocal
    from backend.main import app  # noqa: F401  (binds the app to the test db)
    from backend.models import User
    from backend.seed_course import seed_course

    seed_course()

    with SessionLocal() as db:
        for name, email, role in (
            ("test student", STUDENT_EMAIL, "student"),
            ("test student 2", STUDENT2_EMAIL, "student"),
            ("test teacher", TEACHER_EMAIL, "admin"),
        ):
            db.add(
                User(
                    name=name,
                    email=email,
                    password_hash=hash_password(TEST_PASSWORD),
                    role=role,
                )
            )
        db.commit()

    yield


@pytest.fixture(scope="session")
def client(test_database):
    from backend.main import app

    with TestClient(app) as test_client:
        yield test_client


def login(client: TestClient, email: str) -> dict[str, str]:
    """bearer auth header for a seeded test account."""
    response = client.post(
        "/auth/login", json={"email": email, "password": TEST_PASSWORD}
    )
    assert response.status_code == 200, response.text
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture(scope="session")
def student_auth(client) -> dict[str, str]:
    return login(client, STUDENT_EMAIL)


@pytest.fixture(scope="session")
def student2_auth(client) -> dict[str, str]:
    return login(client, STUDENT2_EMAIL)


@pytest.fixture(scope="session")
def teacher_auth(client) -> dict[str, str]:
    return login(client, TEACHER_EMAIL)


@pytest.fixture(scope="session")
def topic_quiz(client):
    """a quiz from a visible module, with its correct option ids."""
    from sqlalchemy.orm import selectinload

    from backend.database import SessionLocal
    from backend.models import Lesson, Module, Quiz, QuizQuestion

    with SessionLocal() as db:
        quiz = db.scalars(
            select(Quiz)
            .join(Lesson, Quiz.lesson_id == Lesson.id)
            .join(Module, Lesson.module_id == Module.id)
            .where(Module.is_hidden.is_(False))
            .options(
                selectinload(Quiz.questions)
                .selectinload(QuizQuestion.options)
            )
            .order_by(Quiz.id)
        ).first()

        assert quiz is not None, "seeded course must contain a visible quiz"
        assert len(quiz.questions) >= 2, "picked a degenerate quiz"

        return {
            "id": quiz.id,
            "answers": [
                {
                    "question_id": question.id,
                    "option_id": next(
                        option.id
                        for option in question.options
                        if option.is_correct
                    ),
                    "wrong_option_id": next(
                        option.id
                        for option in question.options
                        if not option.is_correct
                    ),
                }
                for question in quiz.questions
            ],
        }
