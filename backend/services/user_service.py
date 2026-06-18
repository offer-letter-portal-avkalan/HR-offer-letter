import uuid
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from repositories import UserRepository
from models.user import User, UserRole
from schemas.user import UserCreate, UserUpdate, UserResponse, UserListResponse
from utils.password_utils import hash_password, verify_password
from schemas.auth import ChangePasswordRequest


class UserService:
    def __init__(self, db: AsyncSession):
        self.repo = UserRepository(db)

    async def create(self, data: UserCreate) -> UserResponse:
        if await self.repo.exists_by_email(data.email):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="A user with this email already exists",
            )
        user = User(
            email=data.email,
            hashed_password=hash_password(data.password),
            full_name=data.full_name,
            role=data.role,
        )
        created = await self.repo.create(user)
        return UserResponse.model_validate(created)

    async def get_by_id(self, user_id: uuid.UUID) -> UserResponse:
        user = await self.repo.get_by_id(user_id)
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        return UserResponse.model_validate(user)

    async def get_all(self, skip: int = 0, limit: int = 50) -> UserListResponse:
        users, total = await self.repo.get_all(skip=skip, limit=limit)
        return UserListResponse(
            users=[UserResponse.model_validate(u) for u in users],
            total=total,
        )

    async def get_all_candidates(self) -> list[UserResponse]:
        candidates = await self.repo.get_all_candidates()
        return [UserResponse.model_validate(c) for c in candidates]

    async def update(self, user_id: uuid.UUID, data: UserUpdate) -> UserResponse:
        user = await self.repo.get_by_id(user_id)
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        updated = await self.repo.update(user_id, data.model_dump(exclude_unset=True))
        return UserResponse.model_validate(updated)

    async def change_password(self, user_id: uuid.UUID, data: ChangePasswordRequest) -> None:
        user = await self.repo.get_by_id(user_id)
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        if not verify_password(data.current_password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Current password is incorrect",
            )
        await self.repo.update(user_id, {"hashed_password": hash_password(data.new_password)})
