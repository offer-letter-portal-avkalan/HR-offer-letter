"""Tests for /api/v1/users/* endpoints."""
import uuid
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from tests.conftest import create_user
from models.user import UserRole

pytestmark = pytest.mark.asyncio


class TestGetMe:
    async def test_returns_own_profile(self, client: AsyncClient, candidate_token: str,
                                        candidate_user):
        resp = await client.get("/api/v1/users/me",
                                headers={"Authorization": f"Bearer {candidate_token}"})
        assert resp.status_code == 200
        assert resp.json()["email"] == candidate_user.email

    async def test_unauthenticated_blocked(self, client: AsyncClient):
        resp = await client.get("/api/v1/users/me")
        assert resp.status_code == 403


class TestCreateUser:
    async def test_hr_can_create_user(self, client: AsyncClient, hr_token: str):
        resp = await client.post(
            "/api/v1/users",
            json={
                "email": f"created_{uuid.uuid4().hex[:6]}@test.com",
                "password": "SecurePass1",
                "full_name": "Created User",
                "role": "candidate",
            },
            headers={"Authorization": f"Bearer {hr_token}"},
        )
        assert resp.status_code == 201
        assert resp.json()["role"] == "candidate"

    async def test_candidate_cannot_create_user(self, client: AsyncClient, candidate_token: str):
        resp = await client.post(
            "/api/v1/users",
            json={
                "email": "newguy@test.com",
                "password": "SecurePass1",
                "full_name": "New Guy",
                "role": "candidate",
            },
            headers={"Authorization": f"Bearer {candidate_token}"},
        )
        assert resp.status_code == 403


class TestListUsers:
    async def test_hr_can_list(self, client: AsyncClient, hr_token: str):
        resp = await client.get("/api/v1/users",
                                headers={"Authorization": f"Bearer {hr_token}"})
        assert resp.status_code == 200
        assert "users" in resp.json()
        assert "total" in resp.json()

    async def test_candidate_cannot_list(self, client: AsyncClient, candidate_token: str):
        resp = await client.get("/api/v1/users",
                                headers={"Authorization": f"Bearer {candidate_token}"})
        assert resp.status_code == 403


class TestListCandidates:
    async def test_hr_can_list_candidates(self, client: AsyncClient, hr_token: str,
                                           db_session: AsyncSession):
        await create_user(db_session, f"clist_{uuid.uuid4().hex[:6]}@test.com", UserRole.CANDIDATE)
        resp = await client.get("/api/v1/users/candidates",
                                headers={"Authorization": f"Bearer {hr_token}"})
        assert resp.status_code == 200
        data = resp.json()
        assert isinstance(data, list)
        assert all(u["role"] == "candidate" for u in data)


class TestUpdateUser:
    async def test_hr_can_update_name(self, client: AsyncClient, hr_token: str,
                                       db_session: AsyncSession):
        user = await create_user(db_session, f"upd_{uuid.uuid4().hex[:6]}@test.com")
        resp = await client.patch(
            f"/api/v1/users/{user.id}",
            json={"full_name": "Updated Name"},
            headers={"Authorization": f"Bearer {hr_token}"},
        )
        assert resp.status_code == 200
        assert resp.json()["full_name"] == "Updated Name"

    async def test_update_nonexistent_user(self, client: AsyncClient, hr_token: str):
        resp = await client.patch(
            f"/api/v1/users/{uuid.uuid4()}",
            json={"full_name": "Ghost"},
            headers={"Authorization": f"Bearer {hr_token}"},
        )
        assert resp.status_code == 404
