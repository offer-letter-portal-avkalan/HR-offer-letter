import uuid
from datetime import datetime
from typing import Any
from pydantic import BaseModel


class AnswerUpsert(BaseModel):
    question_id: uuid.UUID
    response_text: str | None = None
    response_json: Any | None = None
    is_draft: bool = True


class AnswerBulkUpsert(BaseModel):
    answers: list[AnswerUpsert]


class AnswerResponse(BaseModel):
    id: uuid.UUID
    question_id: uuid.UUID
    response_text: str | None
    response_json: Any | None
    is_draft: bool
    updated_at: datetime

    model_config = {"from_attributes": True}


class AnswerListResponse(BaseModel):
    answers: list[AnswerResponse]
