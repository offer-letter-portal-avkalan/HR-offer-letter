import uuid
from fastapi import Depends, Header, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession

from config.database import get_db
from config.settings import settings
from repositories import UserRepository
from models.user import User, UserRole
from utils.jwt_utils import decode_access_token

bearer_scheme = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    token = credentials.credentials
    try:
        payload = decode_access_token(token)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id = uuid.UUID(payload["sub"])
    repo = UserRepository(db)
    user = await repo.get_by_id(user_id)

    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is deactivated")

    return user


async def require_hr_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != UserRole.HR_ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="HR Admin access required",
        )
    return current_user


async def require_candidate(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != UserRole.CANDIDATE:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Candidate access required",
        )
    return current_user


async def require_electron_client(
    x_electron_secret: str | None = Header(None, alias="X-Electron-Secret"),
) -> None:
    if not settings.ELECTRON_CLIENT_SECRET:
        return
    if x_electron_secret != settings.ELECTRON_CLIENT_SECRET:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Offer letters can only be viewed through the secure desktop viewer. Please use the app provided by HR.",
        )
