import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, func
from models.offer_letter import OfferLetter


class OfferLetterRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, offer_letter_id: uuid.UUID) -> OfferLetter | None:
        result = await self.db.execute(
            select(OfferLetter).where(OfferLetter.id == offer_letter_id)
        )
        return result.scalar_one_or_none()

    async def get_active_by_candidate(self, candidate_id: uuid.UUID) -> OfferLetter | None:
        result = await self.db.execute(
            select(OfferLetter).where(
                OfferLetter.candidate_id == candidate_id,
                OfferLetter.is_active == True
            )
        )
        return result.scalar_one_or_none()

    async def get_all(self, skip: int = 0, limit: int = 50) -> tuple[list[OfferLetter], int]:
        total_result = await self.db.execute(select(func.count()).select_from(OfferLetter))
        total = total_result.scalar_one()

        result = await self.db.execute(
            select(OfferLetter)
            .order_by(OfferLetter.created_at.desc())
            .offset(skip).limit(limit)
        )
        return list(result.scalars().all()), total

    async def create(self, offer_letter: OfferLetter) -> OfferLetter:
        self.db.add(offer_letter)
        await self.db.flush()
        await self.db.refresh(offer_letter)
        return offer_letter

    async def update(self, offer_letter_id: uuid.UUID, updates: dict) -> OfferLetter | None:
        await self.db.execute(
            update(OfferLetter)
            .where(OfferLetter.id == offer_letter_id)
            .values(**updates)
        )
        return await self.get_by_id(offer_letter_id)

    async def deactivate_existing(self, candidate_id: uuid.UUID) -> None:
        await self.db.execute(
            update(OfferLetter)
            .where(OfferLetter.candidate_id == candidate_id, OfferLetter.is_active == True)
            .values(is_active=False)
        )
