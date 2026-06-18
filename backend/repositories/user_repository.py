import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from models.user import User, UserRole


class UserRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, user_id: uuid.UUID) -> User | None:
        result = await self.db.execute(select(User).where(User.id == user_id))
        return result.scalar_one_or_none()

    async def get_by_email(self, email: str) -> User | None:
        result = await self.db.execute(select(User).where(User.email == email))
        return result.scalar_one_or_none()

    async def get_all_candidates(self) -> list[User]:
        result = await self.db.execute(
            select(User).where(User.role == UserRole.CANDIDATE).order_by(User.created_at.desc())
        )
        return list(result.scalars().all())

    async def get_all(self, skip: int = 0, limit: int = 50) -> tuple[list[User], int]:
        count_result = await self.db.execute(select(User))
        total = len(count_result.scalars().all())

        result = await self.db.execute(
            select(User).order_by(User.created_at.desc()).offset(skip).limit(limit)
        )
        return list(result.scalars().all()), total

    async def create(self, user: User) -> User:
        self.db.add(user)
        await self.db.flush()
        await self.db.refresh(user)
        return user

    async def update(self, user_id: uuid.UUID, updates: dict) -> User | None:
        await self.db.execute(
            update(User).where(User.id == user_id).values(**updates)
        )
        return await self.get_by_id(user_id)

    async def exists_by_email(self, email: str) -> bool:
        result = await self.db.execute(select(User.id).where(User.email == email))
        return result.scalar_one_or_none() is not None
