import time
from datetime import datetime, timedelta, timezone

import jwt
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError, InvalidHashError

from .config import settings

_ph = PasswordHasher()


def hash_password(password: str) -> str:
    return _ph.hash(password)


def verify_password(password: str, hashed: str) -> bool:
    try:
        return _ph.verify(hashed, password)
    except (VerifyMismatchError, InvalidHashError):
        return False


def create_token(user_id: int) -> str:
    exp = datetime.now(timezone.utc) + timedelta(hours=settings.token_hours)
    return jwt.encode({"sub": str(user_id), "exp": exp}, settings.secret_key, algorithm="HS256")


def decode_token(token: str) -> int | None:
    try:
        data = jwt.decode(token, settings.secret_key, algorithms=["HS256"])
        return int(data["sub"])
    except (jwt.PyJWTError, KeyError, ValueError):
        return None


# Chống dò mật khẩu: đếm lần sai theo (username) trong bộ nhớ.
_fails: dict[str, tuple[int, float]] = {}


def is_locked(key: str) -> bool:
    count, until = _fails.get(key, (0, 0.0))
    if count >= settings.max_login_fails:
        if time.time() < until:
            return True
        _fails.pop(key, None)
    return False


def register_fail(key: str) -> None:
    count, _ = _fails.get(key, (0, 0.0))
    _fails[key] = (count + 1, time.time() + settings.lockout_minutes * 60)


def clear_fails(key: str) -> None:
    _fails.pop(key, None)
