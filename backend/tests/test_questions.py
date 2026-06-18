"""Tests for /api/v1/questions/* endpoints."""
import uuid
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from models.question import Question, QuestionType
from models.user import User

pytestmark = pytest.mark.asyncio


async def _create_question(db: AsyncSession, creator: User, text: str = "Q?") -> Question:
    q = Question(
        id=uuid.uuid4(),
        text=text,
        type=QuestionType.TEXT,
        is_required=True,
        is_active=True,
        order_index=0,
        created_by=creator.id,
    )
    db.add(q)
    await db.flush()
    return q


class TestListActiveQuestions:
    async def test_candidate_can_list_active(self, client: AsyncClient, candidate_token: str,
                                              db_session: AsyncSession, hr_user: User):
        await _create_question(db_session, hr_user, "Active question?")
        resp = await client.get(
            "/api/v1/questions/active",
            headers={"Authorization": f"Bearer {candidate_token}"},
        )
        assert resp.status_code == 200
        assert isinstance(resp.json()["questions"], list)

    async def test_unauthenticated_blocked(self, client: AsyncClient):
        resp = await client.get("/api/v1/questions/active")
        assert resp.status_code == 403


class TestCreateQuestion:
    async def test_hr_can_create(self, client: AsyncClient, hr_token: str):
        resp = await client.post(
            "/api/v1/questions",
            json={"text": "Do you accept?", "type": "yes_no", "is_required": True, "order_index": 1},
            headers={"Authorization": f"Bearer {hr_token}"},
        )
        assert resp.status_code == 201
        data = resp.json()
        assert data["text"] == "Do you accept?"
        assert data["type"] == "yes_no"

    async def test_candidate_cannot_create(self, client: AsyncClient, candidate_token: str):
        resp = await client.post(
            "/api/v1/questions",
            json={"text": "Sneaky?", "type": "text", "is_required": False, "order_index": 0},
            headers={"Authorization": f"Bearer {candidate_token}"},
        )
        assert resp.status_code == 403

    async def test_multiple_choice_requires_options(self, client: AsyncClient, hr_token: str):
        resp = await client.post(
            "/api/v1/questions",
            json={"text": "Choose one", "type": "multiple_choice", "is_required": True, "order_index": 0},
            headers={"Authorization": f"Bearer {hr_token}"},
        )
        # should fail validation — no options provided
        assert resp.status_code in (400, 422)


class TestUpdateQuestion:
    async def test_hr_can_update(self, client: AsyncClient, hr_token: str,
                                  db_session: AsyncSession, hr_user: User):
        q = await _create_question(db_session, hr_user, "Original text?")
        resp = await client.patch(
            f"/api/v1/questions/{q.id}",
            json={"text": "Updated text?"},
            headers={"Authorization": f"Bearer {hr_token}"},
        )
        assert resp.status_code == 200
        assert resp.json()["text"] == "Updated text?"

    async def test_update_nonexistent(self, client: AsyncClient, hr_token: str):
        resp = await client.patch(
            f"/api/v1/questions/{uuid.uuid4()}",
            json={"text": "Ghost?"},
            headers={"Authorization": f"Bearer {hr_token}"},
        )
        assert resp.status_code == 404


class TestDeleteQuestion:
    async def test_hr_soft_delete(self, client: AsyncClient, hr_token: str,
                                   db_session: AsyncSession, hr_user: User):
        q = await _create_question(db_session, hr_user, "Delete me?")
        resp = await client.delete(
            f"/api/v1/questions/{q.id}",
            headers={"Authorization": f"Bearer {hr_token}"},
        )
        assert resp.status_code == 204

        # after deletion, should not appear in active list
        list_resp = await client.get(
            "/api/v1/questions/active",
            headers={"Authorization": f"Bearer {hr_token}"},
        )
        ids = [q["id"] for q in list_resp.json()["questions"]]
        assert str(q.id) not in ids
