"""Tests for /api/v1/submissions/* endpoints."""
import uuid
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from models.offer_letter import OfferLetter
from models.question import Question, QuestionType
from models.answer import Answer
from models.user import User

pytestmark = pytest.mark.asyncio


async def _setup_complete_candidate(
    db: AsyncSession, candidate: User, hr: User
) -> tuple[OfferLetter, list[Question]]:
    """Creates an offer letter and all required answered questions for a candidate."""
    ol = OfferLetter(
        id=uuid.uuid4(),
        candidate_id=candidate.id,
        uploaded_by=hr.id,
        original_filename="offer.pdf",
        storage_path=f"offer-letters/{candidate.id}/offer.pdf",
        is_watermarked=True,
    )
    db.add(ol)

    q = Question(
        id=uuid.uuid4(),
        text="Do you accept?",
        type=QuestionType.YES_NO,
        is_required=True,
        is_active=True,
        order_index=0,
        created_by=hr.id,
    )
    db.add(q)
    await db.flush()

    ans = Answer(
        id=uuid.uuid4(),
        candidate_id=candidate.id,
        question_id=q.id,
        value="yes",
    )
    db.add(ans)
    await db.flush()
    return ol, [q]


class TestCreateSubmission:
    async def test_submit_when_complete(self, client: AsyncClient, candidate_token: str,
                                         db_session: AsyncSession, candidate_user: User,
                                         hr_user: User):
        ol, _ = await _setup_complete_candidate(db_session, candidate_user, hr_user)
        resp = await client.post(
            "/api/v1/submissions",
            json={
                "offer_letter_id": str(ol.id),
                "signature_data": "data:image/png;base64,abc",
                "signature_type": "drawn",
            },
            headers={"Authorization": f"Bearer {candidate_token}"},
        )
        assert resp.status_code == 201
        data = resp.json()
        assert data["status"] == "pending"

    async def test_hr_cannot_submit(self, client: AsyncClient, hr_token: str,
                                     db_session: AsyncSession, candidate_user: User, hr_user: User):
        ol, _ = await _setup_complete_candidate(db_session, candidate_user, hr_user)
        resp = await client.post(
            "/api/v1/submissions",
            json={
                "offer_letter_id": str(ol.id),
                "signature_data": "data:image/png;base64,abc",
                "signature_type": "typed",
            },
            headers={"Authorization": f"Bearer {hr_token}"},
        )
        assert resp.status_code == 403


class TestGetMySubmission:
    async def test_candidate_gets_own(self, client: AsyncClient, candidate_token: str,
                                       db_session: AsyncSession, candidate_user: User, hr_user: User):
        ol, _ = await _setup_complete_candidate(db_session, candidate_user, hr_user)
        await client.post(
            "/api/v1/submissions",
            json={"offer_letter_id": str(ol.id), "signature_data": "x", "signature_type": "typed"},
            headers={"Authorization": f"Bearer {candidate_token}"},
        )
        resp = await client.get("/api/v1/submissions/me",
                                headers={"Authorization": f"Bearer {candidate_token}"})
        assert resp.status_code == 200


class TestListSubmissions:
    async def test_hr_can_list(self, client: AsyncClient, hr_token: str):
        resp = await client.get("/api/v1/submissions",
                                headers={"Authorization": f"Bearer {hr_token}"})
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)

    async def test_candidate_cannot_list_all(self, client: AsyncClient, candidate_token: str):
        resp = await client.get("/api/v1/submissions",
                                headers={"Authorization": f"Bearer {candidate_token}"})
        assert resp.status_code == 403


class TestUpdateSubmissionStatus:
    async def test_hr_can_accept(self, client: AsyncClient, hr_token: str, candidate_token: str,
                                  db_session: AsyncSession, candidate_user: User, hr_user: User):
        ol, _ = await _setup_complete_candidate(db_session, candidate_user, hr_user)
        sub_resp = await client.post(
            "/api/v1/submissions",
            json={"offer_letter_id": str(ol.id), "signature_data": "x", "signature_type": "drawn"},
            headers={"Authorization": f"Bearer {candidate_token}"},
        )
        sub_id = sub_resp.json()["id"]

        resp = await client.patch(
            f"/api/v1/submissions/{sub_id}",
            json={"status": "accepted", "reviewer_notes": "Welcome aboard!"},
            headers={"Authorization": f"Bearer {hr_token}"},
        )
        assert resp.status_code == 200
        assert resp.json()["status"] == "accepted"
