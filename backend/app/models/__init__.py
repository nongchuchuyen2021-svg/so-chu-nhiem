"""Toàn bộ bảng CSDL. Mọi bảng dữ liệu đều có class_id để cô lập theo lớp."""
from datetime import date, datetime

from sqlalchemy import (Boolean, Date, DateTime, Float, ForeignKey, Integer, String, Text,
                        UniqueConstraint, func)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..db.session import Base

ROLES = ("gvcn", "student", "parent")


class SchoolYear(Base):
    __tablename__ = "school_years"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(20))  # 2025-2026
    hk1_start: Mapped[date] = mapped_column(Date)
    hk1_end: Mapped[date] = mapped_column(Date)
    hk2_start: Mapped[date] = mapped_column(Date)
    hk2_end: Mapped[date] = mapped_column(Date)


class Class(Base):
    __tablename__ = "classes"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(20))
    grade: Mapped[int] = mapped_column(Integer)
    school_year_id: Mapped[int] = mapped_column(ForeignKey("school_years.id"))
    school_year: Mapped[SchoolYear] = relationship()


class User(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(primary_key=True)
    username: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    role: Mapped[str] = mapped_column(String(10))
    full_name: Mapped[str] = mapped_column(String(100))
    class_id: Mapped[int] = mapped_column(ForeignKey("classes.id"))
    student_id: Mapped[int | None] = mapped_column(ForeignKey("students.id"), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)


class Group(Base):  # Tổ
    __tablename__ = "groups"
    id: Mapped[int] = mapped_column(primary_key=True)
    class_id: Mapped[int] = mapped_column(ForeignKey("classes.id"), index=True)
    name: Mapped[str] = mapped_column(String(50))


class Student(Base):
    __tablename__ = "students"
    id: Mapped[int] = mapped_column(primary_key=True)
    class_id: Mapped[int] = mapped_column(ForeignKey("classes.id"), index=True)
    group_id: Mapped[int | None] = mapped_column(ForeignKey("groups.id"), nullable=True)
    full_name: Mapped[str] = mapped_column(String(100))
    dob: Mapped[date | None] = mapped_column(Date, nullable=True)
    gender: Mapped[str] = mapped_column(String(5))  # Nam / Nữ
    avatar_url: Mapped[str] = mapped_column(String(255), default="")
    parent_name: Mapped[str] = mapped_column(String(100), default="")
    parent_phone: Mapped[str] = mapped_column(String(20), default="")
    parent_job: Mapped[str] = mapped_column(String(100), default="")
    address: Mapped[str] = mapped_column(String(255), default="")
    role_in_class: Mapped[str] = mapped_column(String(50), default="Thành viên")
    family_background: Mapped[str] = mapped_column(Text, default="")
    interests: Mapped[str] = mapped_column(Text, default="")
    private_notes: Mapped[str] = mapped_column(Text, default="")
    is_flagged_risk: Mapped[bool] = mapped_column(Boolean, default=False)
    risk_reason: Mapped[str] = mapped_column(String(255), default="")
    note: Mapped[str] = mapped_column(Text, default="")
    status: Mapped[str] = mapped_column(String(20), default="dang_hoc")


class Attendance(Base):
    __tablename__ = "attendance"
    __table_args__ = (UniqueConstraint("student_id", "date", "session"),)
    id: Mapped[int] = mapped_column(primary_key=True)
    class_id: Mapped[int] = mapped_column(ForeignKey("classes.id"), index=True)
    student_id: Mapped[int] = mapped_column(ForeignKey("students.id"))
    date: Mapped[date] = mapped_column(Date, index=True)
    session: Mapped[str] = mapped_column(String(10))  # sang / chieu
    status: Mapped[str] = mapped_column(String(2))  # C có mặt, P có phép, K không phép, M muộn
    reason: Mapped[str] = mapped_column(String(255), default="")
    minutes_late: Mapped[int] = mapped_column(Integer, default=0)
    recorded_by: Mapped[int] = mapped_column(ForeignKey("users.id"))


class ConductCriteria(Base):
    __tablename__ = "conduct_criteria"
    id: Mapped[int] = mapped_column(primary_key=True)
    class_id: Mapped[int] = mapped_column(ForeignKey("classes.id"), index=True)
    name: Mapped[str] = mapped_column(String(100))
    points: Mapped[float] = mapped_column(Float)  # dương = cộng, âm = trừ
    category: Mapped[str] = mapped_column(String(50), default="")


class ConductRecord(Base):
    __tablename__ = "conduct_records"
    id: Mapped[int] = mapped_column(primary_key=True)
    class_id: Mapped[int] = mapped_column(ForeignKey("classes.id"), index=True)
    student_id: Mapped[int] = mapped_column(ForeignKey("students.id"))
    criteria_id: Mapped[int | None] = mapped_column(ForeignKey("conduct_criteria.id"), nullable=True)
    points: Mapped[float] = mapped_column(Float)
    date: Mapped[date] = mapped_column(Date, index=True)
    note: Mapped[str] = mapped_column(String(255), default="")
    recorded_by: Mapped[int] = mapped_column(ForeignKey("users.id"))


class StudentNote(Base):
    __tablename__ = "student_notes"
    id: Mapped[int] = mapped_column(primary_key=True)
    class_id: Mapped[int] = mapped_column(ForeignKey("classes.id"), index=True)
    student_id: Mapped[int] = mapped_column(ForeignKey("students.id"))
    category: Mapped[str] = mapped_column(String(20))  # hoc_tap / hanh_kiem / hoan_canh
    content: Mapped[str] = mapped_column(Text)
    date: Mapped[date] = mapped_column(Date)
    author_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    visible_to_parent: Mapped[bool] = mapped_column(Boolean, default=False)


class Announcement(Base):
    __tablename__ = "announcements"
    id: Mapped[int] = mapped_column(primary_key=True)
    class_id: Mapped[int] = mapped_column(ForeignKey("classes.id"), index=True)
    title: Mapped[str] = mapped_column(String(200))
    body: Mapped[str] = mapped_column(Text, default="")
    pinned: Mapped[bool] = mapped_column(Boolean, default=False)
    created_by: Mapped[int] = mapped_column(ForeignKey("users.id"))
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())


class Event(Base):
    __tablename__ = "events"
    id: Mapped[int] = mapped_column(primary_key=True)
    class_id: Mapped[int] = mapped_column(ForeignKey("classes.id"), index=True)
    title: Mapped[str] = mapped_column(String(200))
    type: Mapped[str] = mapped_column(String(20))  # hop_ph / nop_tien / han_ho_so / khac
    date: Mapped[date] = mapped_column(Date, index=True)
    amount: Mapped[int | None] = mapped_column(Integer, nullable=True)
    note: Mapped[str] = mapped_column(String(255), default="")


class AccessCode(Base):  # dùng cho cổng phụ huynh/học sinh (giai đoạn mở rộng)
    __tablename__ = "access_codes"
    id: Mapped[int] = mapped_column(primary_key=True)
    student_id: Mapped[int] = mapped_column(ForeignKey("students.id"))
    role: Mapped[str] = mapped_column(String(10))
    code_hash: Mapped[str] = mapped_column(String(255))
    expires_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)


class ReportTemplate(Base):
    __tablename__ = "report_templates"
    id: Mapped[int] = mapped_column(primary_key=True)
    class_id: Mapped[int] = mapped_column(ForeignKey("classes.id"), index=True)
    kind: Mapped[str] = mapped_column(String(10))  # tuan / thang / hoc_ky
    file_path: Mapped[str] = mapped_column(String(255))


class AuditLog(Base):
    __tablename__ = "audit_log"
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    action: Mapped[str] = mapped_column(String(50))
    entity: Mapped[str] = mapped_column(String(50), default="")
    entity_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
