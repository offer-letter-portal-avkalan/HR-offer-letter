import uuid
from fastapi import APIRouter, Depends, File, Form, Query, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from config.database import get_db
from middleware.auth import get_current_user, require_hr_admin, require_electron_client
from models.user import User, UserRole
from services.offer_letter_service import OfferLetterService
from schemas.offer_letter import OfferLetterResponse, OfferLetterSignedUrl, OfferLetterListResponse

router = APIRouter(prefix="/offer-letters", tags=["Offer Letters"])


@router.post("", response_model=OfferLetterResponse, status_code=status.HTTP_201_CREATED)
async def upload_offer_letter(
    candidate_id: uuid.UUID = Form(...),
    file: UploadFile = File(...),
    current_user: User = Depends(require_hr_admin),
    db: AsyncSession = Depends(get_db),
):
    service = OfferLetterService(db)
    return await service.upload(
        candidate_id=candidate_id,
        uploaded_by=current_user.id,
        file=file,
    )


@router.get("", response_model=OfferLetterListResponse)
async def list_offer_letters(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    _: User = Depends(require_hr_admin),
    db: AsyncSession = Depends(get_db),
):
    service = OfferLetterService(db)
    return await service.get_all(skip=skip, limit=limit)


@router.get("/my", response_model=OfferLetterResponse | None)
async def get_my_offer_letter(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    _: None = Depends(require_electron_client),
):
    service = OfferLetterService(db)
    return await service.get_for_candidate(current_user.id)


@router.get("/{offer_letter_id}/signed-url", response_model=OfferLetterSignedUrl)
async def get_signed_url(
    offer_letter_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    _: None = Depends(require_electron_client),
):
    service = OfferLetterService(db)
    is_hr = current_user.role == UserRole.HR_ADMIN
    return await service.get_signed_url(offer_letter_id, current_user.id, is_hr)
