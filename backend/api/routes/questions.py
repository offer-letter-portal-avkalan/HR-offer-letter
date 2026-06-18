import uuid
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from config.database import get_db
from middleware.auth import get_current_user, require_hr_admin
from models.user import User
from services.question_service import QuestionService
from schemas.question import QuestionCreate, QuestionUpdate, QuestionResponse, QuestionListResponse

router = APIRouter(prefix="/questions", tags=["Questions"])


@router.get("/active", response_model=list[QuestionResponse])
async def list_active_questions(
    _: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Returns all active questions — available to both HR admins and candidates."""
    service = QuestionService(db)
    return await service.get_active()


@router.get("", response_model=QuestionListResponse)
async def list_all_questions(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    _: User = Depends(require_hr_admin),
    db: AsyncSession = Depends(get_db),
):
    service = QuestionService(db)
    return await service.get_all(skip=skip, limit=limit)


@router.post("", response_model=QuestionResponse, status_code=status.HTTP_201_CREATED)
async def create_question(
    body: QuestionCreate,
    current_user: User = Depends(require_hr_admin),
    db: AsyncSession = Depends(get_db),
):
    service = QuestionService(db)
    return await service.create(body, created_by=current_user.id)


@router.patch("/{question_id}", response_model=QuestionResponse)
async def update_question(
    question_id: uuid.UUID,
    body: QuestionUpdate,
    _: User = Depends(require_hr_admin),
    db: AsyncSession = Depends(get_db),
):
    service = QuestionService(db)
    return await service.update(question_id, body)


@router.delete("/{question_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_question(
    question_id: uuid.UUID,
    _: User = Depends(require_hr_admin),
    db: AsyncSession = Depends(get_db),
):
    service = QuestionService(db)
    await service.delete(question_id)
