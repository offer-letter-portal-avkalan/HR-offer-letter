import uuid
from datetime import datetime
from pydantic import BaseModel, Field
from models.submission import SubmissionStatus, SignatureType


class SubmissionCreate(BaseModel):
    offer_letter_id: uuid.UUID
    signature_type: SignatureType
    signature_data: str = Field(min_length=10)


class SubmissionStatusUpdate(BaseModel):
    status: SubmissionStatus
    notes: str | None = None


class SubmissionResponse(BaseModel):
    id: uuid.UUID
    candidate_id: uuid.UUID
    offer_letter_id: uuid.UUID
    signature_type: SignatureType
    signature_data: str
    status: SubmissionStatus
    submitted_at: datetime | None
    notes: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class SubmissionListResponse(BaseModel):
    submissions: list[SubmissionResponse]
    total: int
