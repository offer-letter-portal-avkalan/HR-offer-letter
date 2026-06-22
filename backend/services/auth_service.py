import uuid
from datetime import datetime, timedelta, timezone
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from repositories import UserRepository, RefreshTokenRepository, AuditLogRepository
from models.user import User, UserRole
from models.refresh_token import RefreshToken
from schemas.auth import LoginRequest, RegisterRequest, TokenResponse
from utils import (
    hash_password, verify_password,
    create_access_token, create_refresh_token,
    decode_refresh_token, hash_token,
)
from config.settings import settings


class AuthService:
    def __init__(self, db: AsyncSession):
        self.user_repo = UserRepository(db)
        self.token_repo = RefreshTokenRepository(db)
        self.audit_repo = AuditLogRepository(db)

    async def register(self, data: RegisterRequest) -> TokenResponse:
        if await self.user_repo.get_by_email(data.email):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="An account with this email already exists",
            )

        user = User(
            email=data.email,
            hashed_password=hash_password(data.password),
            full_name=data.full_name,
            role=UserRole(data.role),
        )
        user = await self.user_repo.create(user)
        await self.audit_repo.log("register", user_id=user.id, resource_type="user", resource_id=user.id)

        access_token = create_access_token(user.id, user.role.value)
        refresh_token = create_refresh_token(user.id)

        token_hash = hash_token(refresh_token)
        expires_at = datetime.now(timezone.utc) + timedelta(days=settings.JWT_REFRESH_EXPIRE_DAYS)

        await self.token_repo.create(
            RefreshToken(user_id=user.id, token_hash=token_hash, expires_at=expires_at)
        )

        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            expires_in=settings.JWT_ACCESS_EXPIRE_MINUTES * 60,
        )

    async def login(self, credentials: LoginRequest) -> TokenResponse:
        user = await self.user_repo.get_by_email(credentials.email)

        if not user or not verify_password(credentials.password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
            )

        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account is deactivated",
            )

        access_token = create_access_token(user.id, user.role.value)
        refresh_token = create_refresh_token(user.id)

        token_hash = hash_token(refresh_token)
        expires_at = datetime.now(timezone.utc) + timedelta(days=settings.JWT_REFRESH_EXPIRE_DAYS)

        await self.token_repo.create(
            RefreshToken(
                user_id=user.id,
                token_hash=token_hash,
                expires_at=expires_at,
            )
        )
        await self.audit_repo.log("login", user_id=user.id, resource_type="user", resource_id=user.id)

        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            expires_in=settings.JWT_ACCESS_EXPIRE_MINUTES * 60,
        )

    async def refresh(self, refresh_token: str) -> TokenResponse:
        try:
            payload = decode_refresh_token(refresh_token)
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired refresh token",
            )

        token_hash = hash_token(refresh_token)
        stored_token = await self.token_repo.get_by_hash(token_hash)

        if not stored_token or stored_token.revoked:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Refresh token has been revoked",
            )

        user_id = uuid.UUID(payload["sub"])
        user = await self.user_repo.get_by_id(user_id)

        if not user or not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found or inactive",
            )

        await self.token_repo.revoke(token_hash)

        new_access_token = create_access_token(user.id, user.role.value)
        new_refresh_token = create_refresh_token(user.id)

        new_hash = hash_token(new_refresh_token)
        new_expires = datetime.now(timezone.utc) + timedelta(days=settings.JWT_REFRESH_EXPIRE_DAYS)

        await self.token_repo.create(
            RefreshToken(user_id=user.id, token_hash=new_hash, expires_at=new_expires)
        )

        return TokenResponse(
            access_token=new_access_token,
            refresh_token=new_refresh_token,
            expires_in=settings.JWT_ACCESS_EXPIRE_MINUTES * 60,
        )

    async def logout(self, refresh_token: str, user_id: uuid.UUID | None = None) -> None:
        token_hash = hash_token(refresh_token)
        await self.token_repo.revoke(token_hash)
        await self.audit_repo.log("logout", user_id=user_id, resource_type="user", resource_id=user_id)

    async def logout_all(self, user_id: uuid.UUID) -> None:
        await self.token_repo.revoke_all_for_user(user_id)
        await self.audit_repo.log("logout_all", user_id=user_id, resource_type="user", resource_id=user_id)
