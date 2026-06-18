import pytest
from utils.password_utils import hash_password, verify_password
from utils.jwt_utils import create_access_token, decode_access_token, hash_token
import uuid


def test_password_hash_and_verify():
    password = "SecurePass123!"
    hashed = hash_password(password)
    assert hashed != password
    assert verify_password(password, hashed)
    assert not verify_password("WrongPassword", hashed)


def test_hash_token_is_deterministic():
    token = "some-random-token-value"
    assert hash_token(token) == hash_token(token)


def test_access_token_roundtrip():
    user_id = uuid.uuid4()
    token = create_access_token(user_id, "hr_admin")
    payload = decode_access_token(token)
    assert payload["sub"] == str(user_id)
    assert payload["role"] == "hr_admin"


def test_access_token_invalid():
    with pytest.raises(Exception):
        decode_access_token("this.is.not.a.valid.token")
