from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field


UserRole = Literal["student", "admin"]


class UserCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    email: EmailStr
    password: str = Field(min_length=8)
    role: UserRole = "student"


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
