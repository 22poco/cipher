from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String, Text, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String, nullable=False)
    role: Mapped[str] = mapped_column(String(20), nullable=False, default="student")
    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        server_default=func.now(),
        nullable=False,
    )

    quiz_attempts: Mapped[list["QuizAttempt"]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
    )
    lesson_progress: Mapped[list["LessonProgress"]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
    )


class Unit(Base):
    __tablename__ = "units"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    order_index: Mapped[int] = mapped_column(Integer, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        server_default=func.now(),
        nullable=False,
    )

    modules: Mapped[list["Module"]] = relationship(
        back_populates="unit",
        cascade="all, delete-orphan",
        order_by="Module.order_index",
    )


class Module(Base):
    __tablename__ = "modules"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    unit_id: Mapped[int] = mapped_column(
        ForeignKey("units.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    order_index: Mapped[int] = mapped_column(Integer, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        server_default=func.now(),
        nullable=False,
    )

    unit: Mapped[Unit] = relationship(back_populates="modules")
    lessons: Mapped[list["Lesson"]] = relationship(
        back_populates="module",
        cascade="all, delete-orphan",
        order_by="Lesson.order_index",
    )


class Lesson(Base):
    __tablename__ = "lessons"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    module_id: Mapped[int] = mapped_column(
        ForeignKey("modules.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    content: Mapped[str | None] = mapped_column(Text)
    video_url: Mapped[str | None] = mapped_column(Text)
    lesson_type: Mapped[str] = mapped_column(String(50), nullable=False, default="reading")
    order_index: Mapped[int] = mapped_column(Integer, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        server_default=func.now(),
        nullable=False,
    )

    module: Mapped[Module] = relationship(back_populates="lessons")
    quiz: Mapped["Quiz | None"] = relationship(
        back_populates="lesson",
        cascade="all, delete-orphan",
    )
    progress_entries: Mapped[list["LessonProgress"]] = relationship(
        back_populates="lesson",
        cascade="all, delete-orphan",
    )


class Quiz(Base):
    __tablename__ = "quizzes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    lesson_id: Mapped[int] = mapped_column(
        ForeignKey("lessons.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        server_default=func.now(),
        nullable=False,
    )

    lesson: Mapped[Lesson] = relationship(back_populates="quiz")
    questions: Mapped[list["QuizQuestion"]] = relationship(
        back_populates="quiz",
        cascade="all, delete-orphan",
        order_by="QuizQuestion.order_index",
    )
    attempts: Mapped[list["QuizAttempt"]] = relationship(
        back_populates="quiz",
        cascade="all, delete-orphan",
    )


class QuizQuestion(Base):
    __tablename__ = "quiz_questions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    quiz_id: Mapped[int] = mapped_column(
        ForeignKey("quizzes.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    question_text: Mapped[str] = mapped_column(Text, nullable=False)
    question_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default="multiple_choice",
    )
    order_index: Mapped[int] = mapped_column(Integer, nullable=False)

    quiz: Mapped[Quiz] = relationship(back_populates="questions")
    options: Mapped[list["QuizOption"]] = relationship(
        back_populates="question",
        cascade="all, delete-orphan",
        order_by="QuizOption.id",
    )


class QuizOption(Base):
    __tablename__ = "quiz_options"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    question_id: Mapped[int] = mapped_column(
        ForeignKey("quiz_questions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    option_text: Mapped[str] = mapped_column(Text, nullable=False)
    is_correct: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    question: Mapped[QuizQuestion] = relationship(back_populates="options")


class QuizAttempt(Base):
    __tablename__ = "quiz_attempts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    quiz_id: Mapped[int] = mapped_column(
        ForeignKey("quizzes.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    score: Mapped[float] = mapped_column(Float, nullable=False)
    submitted_at: Mapped[datetime] = mapped_column(
        DateTime,
        server_default=func.now(),
        nullable=False,
    )

    user: Mapped[User] = relationship(back_populates="quiz_attempts")
    quiz: Mapped[Quiz] = relationship(back_populates="attempts")


class LessonProgress(Base):
    __tablename__ = "lesson_progress"
    __table_args__ = (UniqueConstraint("user_id", "lesson_id"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    lesson_id: Mapped[int] = mapped_column(
        ForeignKey("lessons.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    completed: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime)

    user: Mapped[User] = relationship(back_populates="lesson_progress")
    lesson: Mapped[Lesson] = relationship(back_populates="progress_entries")
