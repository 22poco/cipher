from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field


UserRole = Literal["student", "teacher", "admin"]


class UserCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    email: EmailStr
    password: str = Field(min_length=8)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    email: EmailStr
    role: UserRole
    created_at: datetime


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserRead


class LessonSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    module_id: int
    title: str
    lesson_type: str
    order_index: int
    video_url: str | None = None


class LessonRead(LessonSummary):
    content: str | None = None


class ModuleSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    unit_id: int
    title: str
    description: str | None = None
    order_index: int
    lessons: list[LessonSummary] = []


class ModuleRead(ModuleSummary):
    lessons: list[LessonSummary] = []


class UnitSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    description: str | None = None
    order_index: int
    modules: list[ModuleSummary] = []


class UnitRead(UnitSummary):
    modules: list[ModuleSummary] = []


class UnitCreate(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    description: str | None = None
    order_index: int = Field(ge=0)


class UnitUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = None
    order_index: int | None = Field(default=None, ge=0)


class ModuleCreate(BaseModel):
    unit_id: int
    title: str = Field(min_length=1, max_length=255)
    description: str | None = None
    order_index: int = Field(ge=0)


class ModuleUpdate(BaseModel):
    unit_id: int | None = None
    title: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = None
    order_index: int | None = Field(default=None, ge=0)


LessonType = Literal["reading", "video", "case_study", "code_activity"]


class LessonCreate(BaseModel):
    module_id: int
    title: str = Field(min_length=1, max_length=255)
    content: str | None = None
    video_url: str | None = None
    lesson_type: LessonType = "reading"
    order_index: int = Field(ge=0)


class LessonUpdate(BaseModel):
    module_id: int | None = None
    title: str | None = Field(default=None, min_length=1, max_length=255)
    content: str | None = None
    video_url: str | None = None
    lesson_type: LessonType | None = None
    order_index: int | None = Field(default=None, ge=0)


class DeleteResponse(BaseModel):
    message: str


class QuizOptionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    question_id: int
    option_text: str


class QuizOptionAdminRead(QuizOptionRead):
    is_correct: bool


class QuizQuestionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    quiz_id: int
    question_text: str
    question_type: str
    order_index: int
    options: list[QuizOptionRead] = []


class QuizQuestionAdminRead(QuizQuestionRead):
    options: list[QuizOptionAdminRead] = []


class QuizRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    lesson_id: int
    title: str
    description: str | None = None
    questions: list[QuizQuestionRead] = []


class QuizAdminRead(QuizRead):
    questions: list[QuizQuestionAdminRead] = []


class QuizCreate(BaseModel):
    lesson_id: int
    title: str = Field(min_length=1, max_length=255)
    description: str | None = None


class QuizUpdate(BaseModel):
    lesson_id: int | None = None
    title: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = None


class QuizOptionCreate(BaseModel):
    option_text: str = Field(min_length=1)
    is_correct: bool = False


class QuizOptionUpdate(BaseModel):
    option_text: str | None = Field(default=None, min_length=1)
    is_correct: bool | None = None


class QuizQuestionCreate(BaseModel):
    quiz_id: int
    question_text: str = Field(min_length=1)
    question_type: Literal["multiple_choice"] = "multiple_choice"
    order_index: int = Field(ge=0)
    options: list[QuizOptionCreate] = Field(default_factory=list)


class QuizQuestionUpdate(BaseModel):
    question_text: str | None = Field(default=None, min_length=1)
    question_type: Literal["multiple_choice"] | None = None
    order_index: int | None = Field(default=None, ge=0)


class QuizAnswerSubmit(BaseModel):
    question_id: int
    option_id: int


class QuizSubmit(BaseModel):
    answers: list[QuizAnswerSubmit]


class QuizAnswerResult(BaseModel):
    question_id: int
    selected_option_id: int | None
    correct_option_id: int | None
    is_correct: bool


class QuizSubmitResult(BaseModel):
    attempt_id: int
    quiz_id: int
    score: float
    correct_count: int
    total_questions: int
    results: list[QuizAnswerResult]


class QuizAttemptRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    quiz_id: int
    score: float
    submitted_at: datetime


class LessonProgressRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    lesson_id: int
    completed: bool
    completed_at: datetime | None = None


class ProgressSummary(BaseModel):
    completed_lessons: int
    total_lessons: int
    unit_1_progress_percent: float
    lesson_progress: list[LessonProgressRead]
    quiz_attempts: list[QuizAttemptRead]
