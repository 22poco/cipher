from datetime import datetime
from typing import Any

from sqlalchemy import (
    JSON,
    Boolean,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
    func,
)
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


# ---------------------------------------------------------------------------
# Practice-first mission domain (AP Cybersecurity foundation)
# ---------------------------------------------------------------------------


class ApSkill(Base):
    """College Board CED skill anchor (Analyze Risk, Mitigate Risk, ...)."""

    __tablename__ = "ap_skills"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    code: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    title: Mapped[str] = mapped_column(String(120), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    order_index: Mapped[int] = mapped_column(Integer, nullable=False, default=0)


class ClassSection(Base):
    __tablename__ = "class_sections"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    term: Mapped[str | None] = mapped_column(String(60))
    period: Mapped[str | None] = mapped_column(String(60))
    join_code: Mapped[str] = mapped_column(String(20), unique=True, index=True, nullable=False)
    created_by_user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=False)
    archived_at: Mapped[datetime | None] = mapped_column(DateTime)

    teachers: Mapped[list["SectionTeacher"]] = relationship(
        cascade="all, delete-orphan", back_populates="section"
    )
    enrollments: Mapped[list["SectionEnrollment"]] = relationship(
        cascade="all, delete-orphan", back_populates="section"
    )
    lab_settings: Mapped["SectionLabSettings | None"] = relationship(
        cascade="all, delete-orphan", back_populates="section", uselist=False
    )


class SectionTeacher(Base):
    __tablename__ = "section_teachers"
    __table_args__ = (UniqueConstraint("section_id", "teacher_user_id"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    section_id: Mapped[int] = mapped_column(
        ForeignKey("class_sections.id", ondelete="CASCADE"), nullable=False, index=True
    )
    teacher_user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )

    section: Mapped[ClassSection] = relationship(back_populates="teachers")
    teacher: Mapped[User] = relationship()


class SectionEnrollment(Base):
    __tablename__ = "section_enrollments"
    __table_args__ = (UniqueConstraint("section_id", "student_user_id"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    section_id: Mapped[int] = mapped_column(
        ForeignKey("class_sections.id", ondelete="CASCADE"), nullable=False, index=True
    )
    student_user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="active")
    joined_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=False)

    section: Mapped[ClassSection] = relationship(back_populates="enrollments")
    student: Mapped[User] = relationship()


class Mission(Base):
    __tablename__ = "missions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    unit_id: Mapped[int] = mapped_column(
        ForeignKey("units.id", ondelete="CASCADE"), nullable=False, index=True
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    summary: Mapped[str] = mapped_column(Text, nullable=False, default="")
    context_brief: Mapped[str | None] = mapped_column(Text)
    # multiple_choice | written_response | case_investigation | bash_simulation | network_simulation
    mission_type: Mapped[str] = mapped_column(String(40), nullable=False, default="written_response")
    difficulty: Mapped[str] = mapped_column(String(20), nullable=False, default="Intermediate")
    estimated_minutes: Mapped[int] = mapped_column(Integer, nullable=False, default=30)
    order_index: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    assessment_mode: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    published: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    # Optional structured seed content for the activity renderer (topology, rules, terminal, etc.)
    activity_json: Mapped[dict[str, Any] | None] = mapped_column(JSON)
    steps_json: Mapped[list[Any] | None] = mapped_column(JSON)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=False)

    unit: Mapped[Unit] = relationship()
    skill_links: Mapped[list["MissionSkillLink"]] = relationship(
        cascade="all, delete-orphan", back_populates="mission"
    )
    rubric: Mapped["MissionRubric | None"] = relationship(
        cascade="all, delete-orphan", back_populates="mission", uselist=False
    )


class MissionSkillLink(Base):
    __tablename__ = "mission_skill_links"
    __table_args__ = (UniqueConstraint("mission_id", "ap_skill_id"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    mission_id: Mapped[int] = mapped_column(
        ForeignKey("missions.id", ondelete="CASCADE"), nullable=False, index=True
    )
    ap_skill_id: Mapped[int] = mapped_column(
        ForeignKey("ap_skills.id", ondelete="CASCADE"), nullable=False, index=True
    )

    mission: Mapped[Mission] = relationship(back_populates="skill_links")
    skill: Mapped[ApSkill] = relationship()


class MissionRubric(Base):
    __tablename__ = "mission_rubrics"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    mission_id: Mapped[int] = mapped_column(
        ForeignKey("missions.id", ondelete="CASCADE"), nullable=False, unique=True, index=True
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False, default="Rubric")
    total_points: Mapped[int] = mapped_column(Integer, nullable=False, default=100)

    mission: Mapped[Mission] = relationship(back_populates="rubric")
    criteria: Mapped[list["RubricCriterion"]] = relationship(
        cascade="all, delete-orphan",
        back_populates="rubric",
        order_by="RubricCriterion.order_index",
    )


class RubricCriterion(Base):
    __tablename__ = "rubric_criteria"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    rubric_id: Mapped[int] = mapped_column(
        ForeignKey("mission_rubrics.id", ondelete="CASCADE"), nullable=False, index=True
    )
    ap_skill_id: Mapped[int] = mapped_column(
        ForeignKey("ap_skills.id", ondelete="CASCADE"), nullable=False, index=True
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    points: Mapped[int] = mapped_column(Integer, nullable=False, default=25)
    order_index: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    rubric: Mapped[MissionRubric] = relationship(back_populates="criteria")
    skill: Mapped[ApSkill] = relationship()


class MissionAssignment(Base):
    __tablename__ = "mission_assignments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    mission_id: Mapped[int] = mapped_column(
        ForeignKey("missions.id", ondelete="CASCADE"), nullable=False, index=True
    )
    section_id: Mapped[int] = mapped_column(
        ForeignKey("class_sections.id", ondelete="CASCADE"), nullable=False, index=True
    )
    assigned_by_user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    due_at: Mapped[datetime | None] = mapped_column(DateTime)
    # Nullable override used only by attack_simulation lab assignments:
    # "transparent" | "surprise". Non-lab assignments leave this NULL.
    lab_disclosure_mode: Mapped[str | None] = mapped_column(String(20))
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=False)

    mission: Mapped[Mission] = relationship()
    section: Mapped[ClassSection] = relationship()


class SectionLabSettings(Base):
    """Per-section enablement for simulated attack labs.

    Simulated attack labs require an explicit teacher acknowledgement before
    they can be assigned or attempted in a section. One row per section.
    """

    __tablename__ = "section_lab_settings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    section_id: Mapped[int] = mapped_column(
        ForeignKey("class_sections.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
    )
    enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    enabled_by_user_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL")
    )
    enabled_at: Mapped[datetime | None] = mapped_column(DateTime)
    acknowledgement_version: Mapped[str] = mapped_column(String(20), nullable=False, default="v1")
    retention_mode: Mapped[str] = mapped_column(String(30), nullable=False, default="teacher_cleared")
    last_reset_at: Mapped[datetime | None] = mapped_column(DateTime)
    last_reset_by_user_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL")
    )

    section: Mapped[ClassSection] = relationship(back_populates="lab_settings")


class MissionAttempt(Base):
    __tablename__ = "mission_attempts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    mission_id: Mapped[int] = mapped_column(
        ForeignKey("missions.id", ondelete="CASCADE"), nullable=False, index=True
    )
    assignment_id: Mapped[int | None] = mapped_column(
        ForeignKey("mission_assignments.id", ondelete="SET NULL"), index=True
    )
    student_user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    # assigned | started | draft_saved | submitted | auto_checked | needs_teacher_review | graded | returned
    status: Mapped[str] = mapped_column(String(30), nullable=False, default="assigned")
    active_support_signal: Mapped[str] = mapped_column(String(20), nullable=False, default="independent")
    started_at: Mapped[datetime | None] = mapped_column(DateTime)
    submitted_at: Mapped[datetime | None] = mapped_column(DateTime)
    returned_at: Mapped[datetime | None] = mapped_column(DateTime)
    progress_percent: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=False)

    mission: Mapped[Mission] = relationship()
    student: Mapped[User] = relationship()
    assignment: Mapped[MissionAssignment | None] = relationship()
    evidence: Mapped[list["AttemptEvidence"]] = relationship(
        cascade="all, delete-orphan", back_populates="attempt"
    )
    support_events: Mapped[list["SupportEvent"]] = relationship(
        cascade="all, delete-orphan",
        back_populates="attempt",
        order_by="SupportEvent.created_at",
    )
    auto_check: Mapped["AutoCheckResult | None"] = relationship(
        cascade="all, delete-orphan", back_populates="attempt", uselist=False
    )
    grade: Mapped["Grade | None"] = relationship(
        cascade="all, delete-orphan", back_populates="attempt", uselist=False
    )


class AttemptEvidence(Base):
    __tablename__ = "attempt_evidence"
    __table_args__ = (UniqueConstraint("attempt_id", "evidence_type"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    attempt_id: Mapped[int] = mapped_column(
        ForeignKey("mission_attempts.id", ondelete="CASCADE"), nullable=False, index=True
    )
    # written_response | case_evidence | bash_transcript | network_topology | reflection | ...
    evidence_type: Mapped[str] = mapped_column(String(40), nullable=False)
    payload_json: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=False, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now(), nullable=False
    )

    attempt: Mapped[MissionAttempt] = relationship(back_populates="evidence")


class AutoCheckResult(Base):
    __tablename__ = "auto_check_results"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    attempt_id: Mapped[int] = mapped_column(
        ForeignKey("mission_attempts.id", ondelete="CASCADE"), nullable=False, unique=True, index=True
    )
    score: Mapped[float] = mapped_column(Float, nullable=False, default=0)
    max_score: Mapped[float] = mapped_column(Float, nullable=False, default=0)
    passed: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    details_json: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=False, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=False)

    attempt: Mapped[MissionAttempt] = relationship(back_populates="auto_check")


class Grade(Base):
    __tablename__ = "grades"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    attempt_id: Mapped[int] = mapped_column(
        ForeignKey("mission_attempts.id", ondelete="CASCADE"), nullable=False, unique=True, index=True
    )
    teacher_user_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL")
    )
    final_score: Mapped[float | None] = mapped_column(Float)
    max_score: Mapped[float] = mapped_column(Float, nullable=False, default=100)
    comment: Mapped[str | None] = mapped_column(Text)
    finalized_at: Mapped[datetime | None] = mapped_column(DateTime)

    attempt: Mapped[MissionAttempt] = relationship(back_populates="grade")
    criterion_scores: Mapped[list["GradeCriterionScore"]] = relationship(
        cascade="all, delete-orphan", back_populates="grade"
    )
    audit_events: Mapped[list["GradeAuditEvent"]] = relationship(
        cascade="all, delete-orphan",
        back_populates="grade",
        order_by="GradeAuditEvent.created_at",
    )


class GradeCriterionScore(Base):
    __tablename__ = "grade_criterion_scores"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    grade_id: Mapped[int] = mapped_column(
        ForeignKey("grades.id", ondelete="CASCADE"), nullable=False, index=True
    )
    rubric_criterion_id: Mapped[int] = mapped_column(
        ForeignKey("rubric_criteria.id", ondelete="CASCADE"), nullable=False, index=True
    )
    points_awarded: Mapped[float] = mapped_column(Float, nullable=False, default=0)

    grade: Mapped[Grade] = relationship(back_populates="criterion_scores")
    criterion: Mapped[RubricCriterion] = relationship()


class GradeAuditEvent(Base):
    __tablename__ = "grade_audit_events"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    grade_id: Mapped[int] = mapped_column(
        ForeignKey("grades.id", ondelete="CASCADE"), nullable=False, index=True
    )
    changed_by_user_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL")
    )
    old_value_json: Mapped[dict[str, Any] | None] = mapped_column(JSON)
    new_value_json: Mapped[dict[str, Any] | None] = mapped_column(JSON)
    reason: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=False)

    grade: Mapped[Grade] = relationship(back_populates="audit_events")


class SupportEvent(Base):
    __tablename__ = "support_events"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    attempt_id: Mapped[int] = mapped_column(
        ForeignKey("mission_attempts.id", ondelete="CASCADE"), nullable=False, index=True
    )
    from_signal: Mapped[str | None] = mapped_column(String(20))
    to_signal: Mapped[str] = mapped_column(String(20), nullable=False)
    note: Mapped[str | None] = mapped_column(Text)
    source: Mapped[str] = mapped_column(String(20), nullable=False, default="student")
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=False)

    attempt: Mapped[MissionAttempt] = relationship(back_populates="support_events")


class AiTutorSession(Base):
    __tablename__ = "ai_tutor_sessions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    attempt_id: Mapped[int] = mapped_column(
        ForeignKey("mission_attempts.id", ondelete="CASCADE"), nullable=False, index=True
    )
    student_user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    model: Mapped[str | None] = mapped_column(String(80))
    assessment_mode: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=False)
    ended_at: Mapped[datetime | None] = mapped_column(DateTime)

    messages: Mapped[list["AiTutorMessage"]] = relationship(
        cascade="all, delete-orphan",
        back_populates="session",
        order_by="AiTutorMessage.created_at",
    )


class AiTutorMessage(Base):
    __tablename__ = "ai_tutor_messages"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    session_id: Mapped[int] = mapped_column(
        ForeignKey("ai_tutor_sessions.id", ondelete="CASCADE"), nullable=False, index=True
    )
    role: Mapped[str] = mapped_column(String(20), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    metadata_json: Mapped[dict[str, Any] | None] = mapped_column(JSON)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=False)

    session: Mapped[AiTutorSession] = relationship(back_populates="messages")
