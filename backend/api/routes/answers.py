import uuid
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from config.database import get_db
from middleware.auth import require_candidate, require_hr_admin
from models.user import User
from services.answer_service import AnswerService
from schemas.answer import AnswerUpsert, AnswerBulkUpsert, AnswerResponse, AnswerListResponse

router = APIRouter(prefix="/answers", tags=["Answers"])


@router.get("/candidate/{candidate_id}", response_model=AnswerListResponse)
async def get_candidate_answers(
    candidate_id: uuid.UUID,
    _: User = Depends(require_hr_admin),
    db: AsyncSession = Depends(get_db),
):
    service = AnswerService(db)
    return await service.get_candidate_answers(candidate_id)


@router.get("", response_model=AnswerListResponse)
async def get_my_answers(
    current_user: User = Depends(require_candidate),
    db: AsyncSession = Depends(get_db),
):
    service = AnswerService(db)
    return await service.get_my_answers(current_user.id)


@router.put("", response_model=AnswerResponse, status_code=status.HTTP_200_OK)
async def upsert_answer(
    body: AnswerUpsert,
    current_user: User = Depends(require_candidate),
    db: AsyncSession = Depends(get_db),
):
    service = AnswerService(db)
    return await service.upsert(current_user.id, body)


@router.put("/bulk", response_model=AnswerListResponse, status_code=status.HTTP_200_OK)
async def bulk_upsert_answers(
    body: AnswerBulkUpsert,
    current_user: User = Depends(require_candidate),
    db: AsyncSession = Depends(get_db),
):
    service = AnswerService(db)
    return await service.bulk_upsert(current_user.id, body)
