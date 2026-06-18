import uuid
from datetime import datetime
from pydantic import BaseModel


class OfferLetterResponse(BaseModel):
    id: uuid.UUID
    candidate_id: uuid.UUID
    original_filename: str
    file_size_bytes: int | None
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class OfferLetterSignedUrl(BaseModel):
    signed_url: str
    expires_in: int


class OfferLetterListResponse(BaseModel):
    offer_letters: list[OfferLetterResponse]
    total: int
