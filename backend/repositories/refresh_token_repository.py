import uuid
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete
from models.refresh_token import RefreshToken


class RefreshTokenRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_hash(self, token_hash: str) -> RefreshToken | None:
        result = await self.db.execute(
            select(RefreshToken).where(
                RefreshToken.token_hash == token_hash,
                RefreshToken.revoked == False,
            )
        )
        return result.scalar_one_or_none()

    async def create(self, token: RefreshToken) -> RefreshToken:
        self.db.add(token)
        await self.db.flush()
        await self.db.refresh(token)
        return token

    async def revoke(self, token_hash: str) -> None:
        await self.db.execute(
            update(RefreshToken)
            .where(RefreshToken.token_hash == token_hash)
            .values(revoked=True)
        )

    async def revoke_all_for_user(self, user_id: uuid.UUID) -> None:
        await self.db.execute(
            update(RefreshToken)
            .where(RefreshToken.user_id == user_id)
            .values(revoked=True)
        )

    async def delete_expired(self) -> None:
        await self.db.execute(
            delete(RefreshToken).where(RefreshToken.expires_at < datetime.utcnow())
        )
