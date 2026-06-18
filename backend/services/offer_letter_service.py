import uuid
import asyncio
from functools import partial
from fastapi import HTTPException, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from repositories import OfferLetterRepository, UserRepository
from models.offer_letter import OfferLetter
from schemas.offer_letter import OfferLetterResponse, OfferLetterSignedUrl, OfferLetterListResponse
from utils.pdf_utils import add_watermark
from config.settings import settings
from config.storage import get_storage
from utils.logger import get_logger

logger = get_logger(__name__)

MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB

_FILE_OPTIONS = {"content-type": "application/pdf", "upsert": "true"}


def _upload_to_storage(bucket: str, path: str, data: bytes) -> None:
    """Synchronous Supabase storage upload — run via thread pool."""
    storage = get_storage()
    result = storage.from_(bucket).upload(path=path, file=data, file_options=_FILE_OPTIONS)
    if hasattr(result, "error") and result.error:
        raise RuntimeError(f"Storage upload failed: {result.error}")


class OfferLetterService:
    def __init__(self, db: AsyncSession):
        self.repo = OfferLetterRepository(db)
        self.user_repo = UserRepository(db)

    async def upload(
        self,
        candidate_id: uuid.UUID,
        uploaded_by: uuid.UUID,
        file: UploadFile,
    ) -> OfferLetterResponse:
        if file.content_type not in ("application/pdf", "application/octet-stream"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only PDF files are allowed",
            )

        candidate = await self.user_repo.get_by_id(candidate_id)
        if not candidate:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Candidate not found")

        pdf_bytes = await file.read()
        if len(pdf_bytes) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail="File size exceeds 50MB limit",
            )

        try:
            watermarked_bytes = add_watermark(pdf_bytes, candidate.full_name)
        except Exception as exc:
            logger.error("watermark_failed", error=str(exc), candidate_id=str(candidate_id))
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Failed to watermark PDF: {exc}",
            )

        bucket = settings.STORAGE_BUCKET_OFFER_LETTERS
        safe_filename = file.filename.replace(" ", "_")
        original_path = f"{candidate_id}/original/{safe_filename}"
        watermarked_path = f"{candidate_id}/watermarked/{safe_filename}"

        loop = asyncio.get_event_loop()
        try:
            await loop.run_in_executor(
                None, partial(_upload_to_storage, bucket, original_path, pdf_bytes)
            )
            await loop.run_in_executor(
                None, partial(_upload_to_storage, bucket, watermarked_path, watermarked_bytes)
            )
        except Exception as exc:
            logger.error("storage_upload_failed", error=str(exc), candidate_id=str(candidate_id))
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Storage upload failed: {exc}",
            )

        await self.repo.deactivate_existing(candidate_id)

        offer_letter = OfferLetter(
            candidate_id=candidate_id,
            uploaded_by=uploaded_by,
            original_filename=file.filename,
            storage_path=original_path,
            watermarked_path=watermarked_path,
            file_size_bytes=len(pdf_bytes),
        )
        created = await self.repo.create(offer_letter)
        logger.info("offer_letter_uploaded", offer_letter_id=str(created.id), candidate_id=str(candidate_id))
        return OfferLetterResponse.model_validate(created)

    async def get_signed_url(self, offer_letter_id: uuid.UUID, requestor_id: uuid.UUID, is_hr: bool) -> OfferLetterSignedUrl:
        offer_letter = await self.repo.get_by_id(offer_letter_id)
        if not offer_letter:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Offer letter not found")

        if not is_hr and offer_letter.candidate_id != requestor_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

        path = offer_letter.watermarked_path
        expiry = settings.STORAGE_SIGNED_URL_EXPIRY

        storage = get_storage()
        result = storage.from_(settings.STORAGE_BUCKET_OFFER_LETTERS).create_signed_url(path, expiry)
        signed_url = result.get("signedURL") or result.get("signedUrl", "")

        return OfferLetterSignedUrl(signed_url=signed_url, expires_in=expiry)

    async def get_for_candidate(self, candidate_id: uuid.UUID) -> OfferLetterResponse | None:
        offer_letter = await self.repo.get_active_by_candidate(candidate_id)
        if not offer_letter:
            return None
        return OfferLetterResponse.model_validate(offer_letter)

    async def get_all(self, skip: int = 0, limit: int = 50) -> OfferLetterListResponse:
        letters, total = await self.repo.get_all(skip=skip, limit=limit)
        return OfferLetterListResponse(
            offer_letters=[OfferLetterResponse.model_validate(l) for l in letters],
            total=total,
        )
