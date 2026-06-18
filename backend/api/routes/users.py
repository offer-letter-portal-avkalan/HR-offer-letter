import uuid
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from config.database import get_db
from middleware.auth import get_current_user, require_hr_admin
from models.user import User
from services.user_service import UserService
from schemas.user import UserCreate, UserUpdate, UserResponse, UserListResponse

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return UserResponse.model_validate(current_user)


@router.post("", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(
    body: UserCreate,
    _: User = Depends(require_hr_admin),
    db: AsyncSession = Depends(get_db),
):
    service = UserService(db)
    return await service.create(body)


@router.get("", response_model=UserListResponse)
async def list_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    _: User = Depends(require_hr_admin),
    db: AsyncSession = Depends(get_db),
):
    service = UserService(db)
    return await service.get_all(skip=skip, limit=limit)


@router.get("/candidates", response_model=list[UserResponse])
async def list_candidates(
    _: User = Depends(require_hr_admin),
    db: AsyncSession = Depends(get_db),
):
    service = UserService(db)
    return await service.get_all_candidates()


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: uuid.UUID,
    _: User = Depends(require_hr_admin),
    db: AsyncSession = Depends(get_db),
):
    service = UserService(db)
    return await service.get_by_id(user_id)


@router.patch("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: uuid.UUID,
    body: UserUpdate,
    _: User = Depends(require_hr_admin),
    db: AsyncSession = Depends(get_db),
):
    service = UserService(db)
    return await service.update(user_id, body)
