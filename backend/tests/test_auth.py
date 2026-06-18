"""Tests for /api/v1/auth/* endpoints."""
import uuid
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from tests.conftest import create_user, get_token
from models.user import UserRole

pytestmark = pytest.mark.asyncio


class TestRegister:
    async def test_register_success(self, client: AsyncClient):
        payload = {
            "email": f"new_{uuid.uuid4().hex[:8]}@test.com",
            "password": "SecurePass1",
            "full_name": "New User",
        }
        resp = await client.post("/api/v1/auth/register", json=payload)
        assert resp.status_code == 201
        data = resp.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["token_type"] == "bearer"

    async def test_register_duplicate_email(self, client: AsyncClient, db_session: AsyncSession):
        user = await create_user(db_session, f"dup_{uuid.uuid4().hex[:6]}@test.com")
        resp = await client.post("/api/v1/auth/register", json={
            "email": user.email,
            "password": "SecurePass1",
            "full_name": "Another User",
        })
        assert resp.status_code == 409
        assert "already exists" in resp.json()["detail"].lower()

    async def test_register_invalid_email(self, client: AsyncClient):
        resp = await client.post("/api/v1/auth/register", json={
            "email": "not-an-email",
            "password": "SecurePass1",
            "full_name": "Bad Email",
        })
        assert resp.status_code == 422

    async def test_register_short_password(self, client: AsyncClient):
        resp = await client.post("/api/v1/auth/register", json={
            "email": "valid@test.com",
            "password": "short",
            "full_name": "Short Pw",
        })
        assert resp.status_code == 422


class TestLogin:
    async def test_login_success(self, client: AsyncClient, db_session: AsyncSession):
        user = await create_user(db_session, f"login_{uuid.uuid4().hex[:6]}@test.com")
        resp = await client.post("/api/v1/auth/login", json={
            "email": user.email,
            "password": "TestPass123",
        })
        assert resp.status_code == 200
        data = resp.json()
        assert "access_token" in data
        assert "refresh_token" in data

    async def test_login_wrong_password(self, client: AsyncClient, db_session: AsyncSession):
        user = await create_user(db_session, f"wrongpw_{uuid.uuid4().hex[:6]}@test.com")
        resp = await client.post("/api/v1/auth/login", json={
            "email": user.email,
            "password": "WrongPassword1",
        })
        assert resp.status_code == 401

    async def test_login_unknown_email(self, client: AsyncClient):
        resp = await client.post("/api/v1/auth/login", json={
            "email": "nobody@test.com",
            "password": "TestPass123",
        })
        assert resp.status_code == 401


class TestRefresh:
    async def test_refresh_success(self, client: AsyncClient, db_session: AsyncSession):
        user = await create_user(db_session, f"refresh_{uuid.uuid4().hex[:6]}@test.com")
        login_resp = await client.post("/api/v1/auth/login", json={
            "email": user.email, "password": "TestPass123"
        })
        refresh_token = login_resp.json()["refresh_token"]

        resp = await client.post("/api/v1/auth/refresh", json={"refresh_token": refresh_token})
        assert resp.status_code == 200
        assert "access_token" in resp.json()

    async def test_refresh_invalid_token(self, client: AsyncClient):
        resp = await client.post("/api/v1/auth/refresh", json={"refresh_token": "invalid.token.here"})
        assert resp.status_code == 401

    async def test_refresh_reuse_revoked(self, client: AsyncClient, db_session: AsyncSession):
        user = await create_user(db_session, f"reuse_{uuid.uuid4().hex[:6]}@test.com")
        login = await client.post("/api/v1/auth/login", json={
            "email": user.email, "password": "TestPass123"
        })
        rt = login.json()["refresh_token"]
        # first refresh — valid
        await client.post("/api/v1/auth/refresh", json={"refresh_token": rt})
        # second refresh with same token — should be revoked
        resp2 = await client.post("/api/v1/auth/refresh", json={"refresh_token": rt})
        assert resp2.status_code == 401


class TestLogout:
    async def test_logout_success(self, client: AsyncClient, db_session: AsyncSession):
        user = await create_user(db_session, f"logout_{uuid.uuid4().hex[:6]}@test.com")
        login = await client.post("/api/v1/auth/login", json={
            "email": user.email, "password": "TestPass123"
        })
        tokens = login.json()
        resp = await client.post(
            "/api/v1/auth/logout",
            json={"refresh_token": tokens["refresh_token"]},
            headers={"Authorization": f"Bearer {tokens['access_token']}"},
        )
        assert resp.status_code == 204

    async def test_logout_requires_auth(self, client: AsyncClient):
        resp = await client.post("/api/v1/auth/logout", json={"refresh_token": "any"})
        assert resp.status_code == 403
