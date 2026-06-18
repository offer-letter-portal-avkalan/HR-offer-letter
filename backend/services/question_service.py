import uuid
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from repositories import QuestionRepository
from models.question import Question
from schemas.question import QuestionCreate, QuestionUpdate, QuestionResponse, QuestionListResponse


class QuestionService:
    def __init__(self, db: AsyncSession):
        self.repo = QuestionRepository(db)

    async def create(self, data: QuestionCreate, created_by: uuid.UUID) -> QuestionResponse:
        question = Question(
            created_by=created_by,
            title=data.title,
            description=data.description,
            question_type=data.question_type,
            options=data.options,
            is_required=data.is_required,
            display_order=data.display_order,
        )
        created = await self.repo.create(question)
        return QuestionResponse.model_validate(created)

    async def get_all(self, skip: int = 0, limit: int = 50) -> QuestionListResponse:
        questions, total = await self.repo.get_all(skip=skip, limit=limit)
        return QuestionListResponse(
            questions=[QuestionResponse.model_validate(q) for q in questions],
            total=total,
        )

    async def get_active(self) -> list[QuestionResponse]:
        questions = await self.repo.get_all_active()
        return [QuestionResponse.model_validate(q) for q in questions]

    async def update(self, question_id: uuid.UUID, data: QuestionUpdate) -> QuestionResponse:
        existing = await self.repo.get_by_id(question_id)
        if not existing:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Question not found")
        updated = await self.repo.update(question_id, data.model_dump(exclude_unset=True))
        return QuestionResponse.model_validate(updated)

    async def delete(self, question_id: uuid.UUID) -> None:
        existing = await self.repo.get_by_id(question_id)
        if not existing:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Question not found")
        await self.repo.soft_delete(question_id)
