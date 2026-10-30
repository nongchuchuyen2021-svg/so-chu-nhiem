import re
from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Response, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..core.config import settings
from ..core.deps import COOKIE_NAME, current_user
from ..core.security import (clear_fails, create_token, hash_password, is_locked,
                             register_fail, verify_password)
from ..db.session import get_db
from ..models import AuditLog, Class, Group, SchoolYear, User

router = APIRouter(prefix="/api/auth", tags=["auth"])


class LoginIn(BaseModel):
    username: str
    password: str


class RegisterIn(BaseModel):
    email: str
    password: str
    full_name: str


class ProfileIn(BaseModel):
    full_name: str


GMAIL_RE = re.compile(r"^[a-z0-9][a-z0-9._+-]*@gmail\.com$")


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


def _school_year(db: Session) -> SchoolYear:
    t = date.today()
    y = t.year if t.month >= 8 else t.year - 1
    name = f"{y}-{y + 1}"
    sy = db.scalar(select(SchoolYear).where(SchoolYear.name == name))
    if not sy:
        sy = SchoolYear(name=name, hk1_start=date(y, 9, 5), hk1_end=date(y + 1, 1, 15),
                        hk2_start=date(y + 1, 1, 16), hk2_end=date(y + 1, 5, 31))
        db.add(sy)
        db.flush()
    return sy


@router.post("/register")
def register(data: RegisterIn, response: Response, db: Session = Depends(get_db)):
    """Đăng ký GVCN bằng địa chỉ Gmail. Chưa xác minh hộp thư (cần OAuth/SMTP để xác minh)."""
    email = data.email.strip().lower()
    name = " ".join(data.full_name.split())
    if not GMAIL_RE.match(email) or len(email) > 50:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "Vui lòng nhập địa chỉ Gmail hợp lệ (…@gmail.com)")
    if not name:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "Vui lòng nhập họ tên giáo viên")
    if len(data.password) < 8:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "Mật khẩu tối thiểu 8 ký tự")
    if db.scalar(select(User).where(User.username == email)):
        raise HTTPException(status.HTTP_409_CONFLICT, "Gmail này đã được đăng ký, hãy đăng nhập")
    user = User(username=email, password_hash=hash_password(data.password), role="gvcn",
                full_name=name[:100], class_id=0)
    sy = _school_year(db)
    cls = Class(name="10A1", grade=10, school_year_id=sy.id)
    db.add(cls)
    db.flush()
    for i in range(1, 5):
        db.add(Group(class_id=cls.id, name=f"Tổ {i}"))
    user.class_id = cls.id
    db.add(user)
    db.flush()
    cls.owner_id = user.id
    db.add(AuditLog(user_id=user.id, action="register", entity="user", entity_id=user.id))
    db.commit()
    response.set_cookie(COOKIE_NAME, create_token(user.id), httponly=True, samesite="lax",
                        secure=settings.cookie_secure, max_age=settings.token_hours * 3600)
    return _me(user, db)


@router.put("/profile")
def update_profile(data: ProfileIn, user: User = Depends(current_user), db: Session = Depends(get_db)):
    name = " ".join(data.full_name.split())
    if not name:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "Họ tên không được để trống")
    user.full_name = name[:100]
    db.add(AuditLog(user_id=user.id, action="update_profile", entity="user", entity_id=user.id))
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
