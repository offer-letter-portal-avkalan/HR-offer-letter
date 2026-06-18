import uuid
from datetime import datetime
from typing import Any
from pydantic import BaseModel, Field
from models.question import QuestionType


class QuestionCreate(BaseModel):
    title: str = Field(min_length=5, max_length=1000)
    description: str | None = None
    question_type: QuestionType = QuestionType.TEXT
    options: list[str] | None = None
    is_required: bool = True
    display_order: int = 0


class QuestionUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=5, max_length=1000)
    description: str | None = None
    question_type: QuestionType | None = None
    options: list[str] | None = None
    is_required: bool | None = None
    is_active: bool | None = None
    display_order: int | None = None


class QuestionResponse(BaseModel):
    id: uuid.UUID
    title: str
    description: str | None
    question_type: QuestionType
    options: Any | None
    is_required: bool
    is_active: bool
    display_order: int
    created_at: datetime

    model_config = {"from_attributes": True}


class QuestionListResponse(BaseModel):
    questions: list[QuestionResponse]
    total: int
