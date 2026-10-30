from fastapi import APIRouter, Depends, HTTPException, Response, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..core.config import settings
from ..core.deps import COOKIE_NAME, current_user
from ..core.security import (clear_fails, create_token, hash_password, is_locked,
                             register_fail, verify_password)
from ..db.session import get_db
from ..models import AuditLog, Class, User

router = APIRouter(prefix="/api/auth", tags=["auth"])


class LoginIn(BaseModel):
    username: str
    password: str


class ChangePasswordIn(BaseModel):
    old_password: str
    new_password: str


def _me(user: User, db: Session) -> dict:
    cls = db.get(Class, user.class_id)
    return {
        "id": user.id,
        "username": user.username,
        "full_name": user.full_name,
        "role": user.role,
        "student_id": user.student_id,
        "class": {"id": cls.id, "name": cls.name, "school_year": cls.school_year.name},
    }


@router.post("/login")
def login(data: LoginIn, response: Response, db: Session = Depends(get_db)):
    key = data.username.strip().lower()
    if is_locked(key):
        raise HTTPException(status.HTTP_429_TOO_MANY_REQUESTS,
                            f"Sai quá nhiều lần. Thử lại sau {settings.lockout_minutes} phút")
    user = db.scalar(select(User).where(User.username == key))
    if not user or not user.is_active or not verify_password(data.password, user.password_hash):
        register_fail(key)
        db.add(AuditLog(user_id=user.id if user else None, action="login_fail", entity="user"))
        db.commit()
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Sai tên đăng nhập hoặc mật khẩu")
    clear_fails(key)
    response.set_cookie(COOKIE_NAME, create_token(user.id), httponly=True, samesite="lax",
                        secure=settings.cookie_secure, max_age=settings.token_hours * 3600)
    db.add(AuditLog(user_id=user.id, action="login", entity="user", entity_id=user.id))
    db.commit()
    return _me(user, db)


@router.post("/logout")
def logout(response: Response):
    response.delete_cookie(COOKIE_NAME)
    return {"ok": True}


@router.get("/me")
def me(user: User = Depends(current_user), db: Session = Depends(get_db)):
    return _me(user, db)


@router.post("/change-password")
def change_password(data: ChangePasswordIn, user: User = Depends(current_user),
                    db: Session = Depends(get_db)):
    if not verify_password(data.old_password, user.password_hash):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Mật khẩu cũ không đúng")
    if len(data.new_password) < 8:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Mật khẩu mới tối thiểu 8 ký tự")
    user.password_hash = hash_password(data.new_password)
    db.add(AuditLog(user_id=user.id, action="change_password", entity="user", entity_id=user.id))
    db.commit()
    return {"ok": True}
