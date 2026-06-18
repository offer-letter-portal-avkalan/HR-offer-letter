import uuid
from datetime import datetime
from sqlalchemy import Boolean, DateTime, Text, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB
from config.database import Base


class Answer(Base):
    __tablename__ = "answers"

    __table_args__ = (
        UniqueConstraint("candidate_id", "question_id", name="uq_answer_candidate_question"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    candidate_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    question_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("questions.id"), nullable=False)
    response_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    response_json: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    is_draft: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    candidate = relationship("User", back_populates="answers")
    question = relationship("Question", back_populates="answers")
