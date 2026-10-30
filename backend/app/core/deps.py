from fastapi import Cookie, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..db.session import get_db
from ..models import User
from .security import decode_token

COOKIE_NAME = "scn_token"


def current_user(
    token: str | None = Cookie(default=None, alias=COOKIE_NAME),
    db: Session = Depends(get_db),
) -> User:
    uid = decode_token(token) if token else None
    user = db.get(User, uid) if uid else None
    if not user or not user.is_active:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Chưa đăng nhập hoặc phiên đã hết hạn")
    return user


def require_gvcn(user: User = Depends(current_user)) -> User:
    if user.role != "gvcn":
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Chỉ giáo viên chủ nhiệm được phép")
    return user


def get_scoped(db: Session, model, obj_id: int, user: User):
    """Lấy 1 bản ghi theo id, chỉ khi thuộc đúng lớp của user (chống lộ dữ liệu giữa các lớp)."""
    obj = db.get(model, obj_id)
    if obj is None or getattr(obj, "class_id", None) != user.class_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Không tìm thấy")
    return obj
