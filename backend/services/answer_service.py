import uuid
from datetime import datetime, timezone
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from repositories import AnswerRepository, QuestionRepository
from schemas.answer import AnswerUpsert, AnswerBulkUpsert, AnswerResponse, AnswerListResponse


class AnswerService:
    def __init__(self, db: AsyncSession):
        self.repo = AnswerRepository(db)
        self.question_repo = QuestionRepository(db)

    async def upsert(self, candidate_id: uuid.UUID, data: AnswerUpsert) -> AnswerResponse:
        question = await self.question_repo.get_by_id(data.question_id)
        if not question or not question.is_active:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Question not found")

        answer_data = {
            "candidate_id": candidate_id,
            "question_id": data.question_id,
            "response_text": data.response_text,
            "response_json": data.response_json,
            "is_draft": data.is_draft,
            "updated_at": datetime.now(timezone.utc),
        }
        answer = await self.repo.upsert(answer_data)
        return AnswerResponse.model_validate(answer)

    async def bulk_upsert(self, candidate_id: uuid.UUID, data: AnswerBulkUpsert) -> AnswerListResponse:
        results = []
        for item in data.answers:
            question = await self.question_repo.get_by_id(item.question_id)
            if not question or not question.is_active:
                continue
            answer_data = {
                "candidate_id": candidate_id,
                "question_id": item.question_id,
                "response_text": item.response_text,
                "response_json": item.response_json,
                "is_draft": item.is_draft,
                "updated_at": datetime.now(timezone.utc),
            }
            answer = await self.repo.upsert(answer_data)
            results.append(AnswerResponse.model_validate(answer))
        return AnswerListResponse(answers=results)

    async def get_my_answers(self, candidate_id: uuid.UUID) -> AnswerListResponse:
        answers = await self.repo.get_by_candidate(candidate_id)
        return AnswerListResponse(answers=[AnswerResponse.model_validate(a) for a in answers])

    async def get_candidate_answers(self, candidate_id: uuid.UUID) -> AnswerListResponse:
        answers = await self.repo.get_by_candidate(candidate_id)
        return AnswerListResponse(answers=[AnswerResponse.model_validate(a) for a in answers])

    async def count_completed(self, candidate_id: uuid.UUID) -> int:
        return await self.repo.count_completed_by_candidate(candidate_id)
