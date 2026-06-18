import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, func
from models.question import Question


class QuestionRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, question_id: uuid.UUID) -> Question | None:
        result = await self.db.execute(select(Question).where(Question.id == question_id))
        return result.scalar_one_or_none()

    async def get_all_active(self) -> list[Question]:
        result = await self.db.execute(
            select(Question)
            .where(Question.is_active == True)
            .order_by(Question.display_order.asc(), Question.created_at.asc())
        )
        return list(result.scalars().all())

    async def get_all(self, skip: int = 0, limit: int = 100) -> tuple[list[Question], int]:
        total_result = await self.db.execute(select(func.count()).select_from(Question))
        total = total_result.scalar_one()

        result = await self.db.execute(
            select(Question)
            .order_by(Question.display_order.asc())
            .offset(skip).limit(limit)
        )
        return list(result.scalars().all()), total

    async def create(self, question: Question) -> Question:
        self.db.add(question)
        await self.db.flush()
        await self.db.refresh(question)
        return question

    async def update(self, question_id: uuid.UUID, updates: dict) -> Question | None:
        await self.db.execute(
            update(Question).where(Question.id == question_id).values(**updates)
        )
        return await self.get_by_id(question_id)

    async def soft_delete(self, question_id: uuid.UUID) -> bool:
        result = await self.db.execute(
            update(Question)
            .where(Question.id == question_id)
            .values(is_active=False)
        )
        return result.rowcount > 0
