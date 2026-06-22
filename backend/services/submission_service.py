import uuid
from datetime import datetime, timezone
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from repositories import SubmissionRepository, OfferLetterRepository, QuestionRepository, AnswerRepository, AuditLogRepository
from models.submission import Submission, SubmissionStatus
from schemas.submission import SubmissionCreate, SubmissionStatusUpdate, SubmissionResponse, SubmissionListResponse
from utils.logger import get_logger

logger = get_logger(__name__)


class SubmissionService:
    def __init__(self, db: AsyncSession):
        self.repo = SubmissionRepository(db)
        self.offer_repo = OfferLetterRepository(db)
        self.question_repo = QuestionRepository(db)
        self.answer_repo = AnswerRepository(db)
        self.audit_repo = AuditLogRepository(db)

    async def submit(
        self,
        candidate_id: uuid.UUID,
        data: SubmissionCreate,
        ip_address: str | None,
        user_agent: str | None,
    ) -> SubmissionResponse:
        offer_letter = await self.offer_repo.get_by_id(data.offer_letter_id)
        if not offer_letter or not offer_letter.is_active:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Offer letter not found")

        if offer_letter.candidate_id != candidate_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

        existing = await self.repo.get_by_candidate(candidate_id)
        if existing and existing.status == SubmissionStatus.SUBMITTED:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Offer letter already submitted",
            )

        required_questions = await self.question_repo.get_all_active()
        required_count = sum(1 for q in required_questions if q.is_required)
        completed_count = await self.answer_repo.count_completed_by_candidate(candidate_id)

        if completed_count < required_count:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"All {required_count} required questions must be answered before submitting",
            )

        submission = Submission(
            candidate_id=candidate_id,
            offer_letter_id=data.offer_letter_id,
            signature_type=data.signature_type,
            signature_data=data.signature_data,
            status=SubmissionStatus.SUBMITTED,
            submitted_at=datetime.now(timezone.utc),
            ip_address=ip_address,
            user_agent=user_agent,
        )
        created = await self.repo.create(submission)
        await self.audit_repo.log("submission_created", user_id=candidate_id, resource_type="submission", resource_id=created.id)
        logger.info("submission_created", submission_id=str(created.id), candidate_id=str(candidate_id))
        return SubmissionResponse.model_validate(created)

    async def update_status(
        self, submission_id: uuid.UUID, data: SubmissionStatusUpdate
    ) -> SubmissionResponse:
        submission = await self.repo.get_by_id(submission_id)
        if not submission:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Submission not found")
        updated = await self.repo.update_status(submission_id, data.status, data.notes)
        return SubmissionResponse.model_validate(updated)

    async def get_my_submission(self, candidate_id: uuid.UUID) -> SubmissionResponse | None:
        submission = await self.repo.get_by_candidate(candidate_id)
        if not submission:
            return None
        return SubmissionResponse.model_validate(submission)

    async def get_all(self, skip: int = 0, limit: int = 50) -> SubmissionListResponse:
        submissions, total = await self.repo.get_all(skip=skip, limit=limit)
        return SubmissionListResponse(
            submissions=[SubmissionResponse.model_validate(s) for s in submissions],
            total=total,
        )
