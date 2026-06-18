import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, func
from models.submission import Submission, SubmissionStatus


class SubmissionRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, submission_id: uuid.UUID) -> Submission | None:
        result = await self.db.execute(
            select(Submission).where(Submission.id == submission_id)
        )
        return result.scalar_one_or_none()

    async def get_by_candidate(self, candidate_id: uuid.UUID) -> Submission | None:
        result = await self.db.execute(
            select(Submission).where(Submission.candidate_id == candidate_id)
        )
        return result.scalar_one_or_none()

    async def get_all(self, skip: int = 0, limit: int = 50) -> tuple[list[Submission], int]:
        total_result = await self.db.execute(select(func.count()).select_from(Submission))
        total = total_result.scalar_one()

        result = await self.db.execute(
            select(Submission)
            .order_by(Submission.created_at.desc())
            .offset(skip).limit(limit)
        )
        return list(result.scalars().all()), total

    async def create(self, submission: Submission) -> Submission:
        self.db.add(submission)
        await self.db.flush()
        await self.db.refresh(submission)
        return submission

    async def update_status(
        self, submission_id: uuid.UUID, status: SubmissionStatus, notes: str | None
    ) -> Submission | None:
        updates: dict = {"status": status}
        if notes is not None:
            updates["notes"] = notes
        await self.db.execute(
            update(Submission)
            .where(Submission.id == submission_id)
            .values(**updates)
        )
        return await self.get_by_id(submission_id)
