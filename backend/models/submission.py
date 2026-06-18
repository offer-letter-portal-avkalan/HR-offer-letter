import uuid
import enum
from datetime import datetime
from sqlalchemy import DateTime, Text, ForeignKey, UniqueConstraint, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from config.database import Base


class SubmissionStatus(str, enum.Enum):
    PENDING = "pending"
    SUBMITTED = "submitted"
    ACCEPTED = "accepted"
    REJECTED = "rejected"


class SignatureType(str, enum.Enum):
    DRAWN = "drawn"
    TYPED = "typed"


class Submission(Base):
    __tablename__ = "submissions"

    __table_args__ = (
        UniqueConstraint("candidate_id", "offer_letter_id", name="uq_submission_candidate_offer"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    candidate_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    offer_letter_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("offer_letters.id"), nullable=False)
    signature_type: Mapped[SignatureType] = mapped_column(SAEnum(SignatureType, values_callable=lambda x: [e.value for e in x]), nullable=False)
    signature_data: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[SubmissionStatus] = mapped_column(SAEnum(SubmissionStatus, values_callable=lambda x: [e.value for e in x]), nullable=False, default=SubmissionStatus.PENDING)
    submitted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    ip_address: Mapped[str | None] = mapped_column(Text, nullable=True)
    user_agent: Mapped[str | None] = mapped_column(Text, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    candidate = relationship("User", back_populates="submissions")
    offer_letter = relationship("OfferLetter", back_populates="submissions")
