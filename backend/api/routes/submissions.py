import uuid
from fastapi import APIRouter, Depends, Query, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from config.database import get_db
from middleware.auth import get_current_user, require_candidate, require_hr_admin
from models.user import User
from services.submission_service import SubmissionService
from schemas.submission import SubmissionCreate, SubmissionStatusUpdate, SubmissionResponse, SubmissionListResponse

router = APIRouter(prefix="/submissions", tags=["Submissions"])


@router.post("", response_model=SubmissionResponse, status_code=status.HTTP_201_CREATED)
async def create_submission(
    body: SubmissionCreate,
    request: Request,
    current_user: User = Depends(require_candidate),
    db: AsyncSession = Depends(get_db),
):
    ip = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent")
    service = SubmissionService(db)
    return await service.submit(current_user.id, body, ip_address=ip, user_agent=user_agent)


@router.get("/my", response_model=SubmissionResponse | None)
async def get_my_submission(
    current_user: User = Depends(require_candidate),
    db: AsyncSession = Depends(get_db),
):
    service = SubmissionService(db)
    return await service.get_my_submission(current_user.id)


@router.get("", response_model=SubmissionListResponse)
async def list_submissions(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    _: User = Depends(require_hr_admin),
    db: AsyncSession = Depends(get_db),
):
    service = SubmissionService(db)
    return await service.get_all(skip=skip, limit=limit)


@router.patch("/{submission_id}/status", response_model=SubmissionResponse)
async def update_submission_status(
    submission_id: uuid.UUID,
    body: SubmissionStatusUpdate,
    _: User = Depends(require_hr_admin),
    db: AsyncSession = Depends(get_db),
):
    service = SubmissionService(db)
    return await service.update_status(submission_id, body)
