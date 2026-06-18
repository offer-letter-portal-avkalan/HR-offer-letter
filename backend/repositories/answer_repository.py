import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.dialects.postgresql import insert
from models.answer import Answer


class AnswerRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_candidate(self, candidate_id: uuid.UUID) -> list[Answer]:
        result = await self.db.execute(
            select(Answer).where(Answer.candidate_id == candidate_id)
        )
        return list(result.scalars().all())

    async def get_by_candidate_and_question(
        self, candidate_id: uuid.UUID, question_id: uuid.UUID
    ) -> Answer | None:
        result = await self.db.execute(
            select(Answer).where(
                Answer.candidate_id == candidate_id,
                Answer.question_id == question_id,
            )
        )
        return result.scalar_one_or_none()

    async def count_completed_by_candidate(self, candidate_id: uuid.UUID) -> int:
        result = await self.db.execute(
            select(func.count())
            .select_from(Answer)
            .where(Answer.candidate_id == candidate_id, Answer.is_draft == False)
        )
        return result.scalar_one()

    async def upsert(self, answer_data: dict) -> Answer:
        stmt = insert(Answer).values(**answer_data)
        stmt = stmt.on_conflict_do_update(
            index_elements=["candidate_id", "question_id"],
            set_={
                "response_text": stmt.excluded.response_text,
                "response_json": stmt.excluded.response_json,
                "is_draft": stmt.excluded.is_draft,
                "updated_at": stmt.excluded.updated_at,
            }
        ).returning(Answer)

        result = await self.db.execute(stmt)
        return result.scalar_one()
