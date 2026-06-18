"""Tests for /api/v1/answers/* endpoints."""
import uuid
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from models.question import Question, QuestionType
from models.user import User

pytestmark = pytest.mark.asyncio


async def _make_question(db: AsyncSession, creator: User, text: str = "Q?") -> Question:
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


class TestUpsertAnswer:
    async def test_candidate_can_answer(self, client: AsyncClient, candidate_token: str,
                                         db_session: AsyncSession, hr_user: User,
                                         candidate_user: User):
        q = await _make_question(db_session, hr_user)
        resp = await client.put(
            f"/api/v1/answers/{q.id}",
            json={"value": "My answer"},
            headers={"Authorization": f"Bearer {candidate_token}"},
        )
        assert resp.status_code in (200, 201)
        assert resp.json()["value"] == "My answer"

    async def test_upsert_updates_existing(self, client: AsyncClient, candidate_token: str,
                                            db_session: AsyncSession, hr_user: User):
        q = await _make_question(db_session, hr_user, "Update me?")
        await client.put(f"/api/v1/answers/{q.id}", json={"value": "First"},
                         headers={"Authorization": f"Bearer {candidate_token}"})
        resp = await client.put(f"/api/v1/answers/{q.id}", json={"value": "Second"},
                                headers={"Authorization": f"Bearer {candidate_token}"})
        assert resp.status_code in (200, 201)
        assert resp.json()["value"] == "Second"

    async def test_hr_cannot_answer(self, client: AsyncClient, hr_token: str,
                                     db_session: AsyncSession, hr_user: User):
        q = await _make_question(db_session, hr_user)
        resp = await client.put(
            f"/api/v1/answers/{q.id}",
            json={"value": "HR sneaking in"},
            headers={"Authorization": f"Bearer {hr_token}"},
        )
        assert resp.status_code == 403


class TestGetMyAnswers:
    async def test_candidate_gets_own_answers(self, client: AsyncClient, candidate_token: str,
                                               db_session: AsyncSession, hr_user: User):
        q = await _make_question(db_session, hr_user)
        await client.put(f"/api/v1/answers/{q.id}", json={"value": "Yes"},
                         headers={"Authorization": f"Bearer {candidate_token}"})
        resp = await client.get("/api/v1/answers/me",
                                headers={"Authorization": f"Bearer {candidate_token}"})
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)

    async def test_unauthenticated_blocked(self, client: AsyncClient):
        resp = await client.get("/api/v1/answers/me")
        assert resp.status_code == 403


class TestBulkUpsert:
    async def test_bulk_upsert(self, client: AsyncClient, candidate_token: str,
                                db_session: AsyncSession, hr_user: User):
        q1 = await _make_question(db_session, hr_user, "Q1?")
        q2 = await _make_question(db_session, hr_user, "Q2?")
        resp = await client.post(
            "/api/v1/answers/bulk",
            json={"answers": [
                {"question_id": str(q1.id), "value": "A1"},
                {"question_id": str(q2.id), "value": "A2"},
            ]},
            headers={"Authorization": f"Bearer {candidate_token}"},
        )
        assert resp.status_code in (200, 201)
        assert len(resp.json()) == 2
