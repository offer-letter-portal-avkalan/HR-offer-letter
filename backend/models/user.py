import uuid
from datetime import datetime
from sqlalchemy import String, Boolean, DateTime, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from config.database import Base
import enum


class UserRole(str, enum.Enum):
    HR_ADMIN = "hr_admin"
    CANDIDATE = "candidate"


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    hashed_password: Mapped[str] = mapped_column(String, nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(SAEnum(UserRole, name="user_role", create_type=False, values_callable=lambda x: [e.value for e in x]), nullable=False, default=UserRole.CANDIDATE)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    questions = relationship("Question", back_populates="creator", foreign_keys="Question.created_by")
    offer_letters_as_candidate = relationship("OfferLetter", back_populates="candidate", foreign_keys="OfferLetter.candidate_id")
    offer_letters_uploaded = relationship("OfferLetter", back_populates="uploader", foreign_keys="OfferLetter.uploaded_by")
    answers = relationship("Answer", back_populates="candidate")
    submissions = relationship("Submission", back_populates="candidate")
    refresh_tokens = relationship("RefreshToken", back_populates="user")
