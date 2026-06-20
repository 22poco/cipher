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
