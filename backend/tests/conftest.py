"""
Shared pytest fixtures for the Offer Letter Portal API tests.

Requires a running PostgreSQL instance.  The DATABASE_URL and other required
settings are loaded from a .env.test file (or environment variables) via the
same Settings class used in production.

Run with:
    cd backend
    pytest tests/ -v
"""
import asyncio
import uuid
from typing import AsyncGenerator

import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker

from config.database import Base, get_db
from config.settings import settings
from main import app
from models.user import User, UserRole
from utils.password_utils import hash_password


# ── test database engine ──────────────────────────────────────────────────────

TEST_DATABASE_URL = settings.DATABASE_URL.replace(
    "/postgres", "/test_offer_portal"
) if "/postgres" in settings.DATABASE_URL else settings.DATABASE_URL + "_test"

test_engine = create_async_engine(TEST_DATABASE_URL, echo=False)
TestSessionLocal = async_sessionmaker(
    bind=test_engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


@pytest_asyncio.fixture(scope="session", autouse=True)
async def create_test_db():
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await test_engine.dispose()


@pytest_asyncio.fixture
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    async with TestSessionLocal() as session:
        yield session
        await session.rollback()


@pytest_asyncio.fixture
async def client(db_session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac
    app.dependency_overrides.clear()


# ── helper factories ──────────────────────────────────────────────────────────

async def create_user(
    db: AsyncSession,
    email: str,
    role: UserRole = UserRole.CANDIDATE,
    password: str = "TestPass123",
) -> User:
    user = User(
        id=uuid.uuid4(),
        email=email,
        hashed_password=hash_password(password),
        full_name="Test User",
        role=role,
        is_active=True,
    )
    db.add(user)
    await db.flush()
    return user


async def get_token(client: AsyncClient, email: str, password: str = "TestPass123") -> str:
    resp = await client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert resp.status_code == 200, resp.text
    return resp.json()["access_token"]


@pytest_asyncio.fixture
async def hr_user(db_session: AsyncSession) -> User:
    return await create_user(db_session, f"hr_{uuid.uuid4().hex[:6]}@test.com", UserRole.HR_ADMIN)


@pytest_asyncio.fixture
async def candidate_user(db_session: AsyncSession) -> User:
    return await create_user(db_session, f"cand_{uuid.uuid4().hex[:6]}@test.com", UserRole.CANDIDATE)


@pytest_asyncio.fixture
async def hr_token(client: AsyncClient, hr_user: User) -> str:
    return await get_token(client, hr_user.email)


@pytest_asyncio.fixture
async def candidate_token(client: AsyncClient, candidate_user: User) -> str:
    return await get_token(client, candidate_user.email)
