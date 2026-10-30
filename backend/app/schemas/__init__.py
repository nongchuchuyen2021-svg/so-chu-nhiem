from datetime import date
from typing import Any, Optional, List
from pydantic import BaseModel, ConfigDict, Field, field_validator


def _empty_to_none(v):
    return None if isinstance(v, str) and not v.strip() else v


class StudentBase(BaseModel):
    @field_validator("dob", mode="before", check_fields=False)
    @classmethod
    def _dob_blank(cls, v):
        return _empty_to_none(v)

    full_name: str
    dob: Optional[date] = None
    gender: str = "Nam"
    avatar_url: Optional[str] = ""
    group_id: Optional[int] = None
    parent_name: Optional[str] = ""
    parent_phone: Optional[str] = ""
    parent_job: Optional[str] = ""
    address: Optional[str] = ""
    role_in_class: Optional[str] = "Thành viên"
    family_background: Optional[str] = ""
    interests: Optional[str] = ""
    private_notes: Optional[str] = ""
    is_flagged_risk: Optional[bool] = False
    risk_reason: Optional[str] = ""
    note: Optional[str] = ""
    status: Optional[str] = "dang_hoc"


class StudentCreate(StudentBase):
    pass


class StudentUpdate(BaseModel):
    @field_validator("dob", mode="before")
    @classmethod
    def _dob_blank(cls, v):
        return _empty_to_none(v)

    full_name: Optional[str] = None
    dob: Optional[date] = None
    gender: Optional[str] = None
    avatar_url: Optional[str] = None
    group_id: Optional[int] = None
    parent_name: Optional[str] = None
    parent_phone: Optional[str] = None
    parent_job: Optional[str] = None
    address: Optional[str] = None
    role_in_class: Optional[str] = None
    family_background: Optional[str] = None
    interests: Optional[str] = None
    private_notes: Optional[str] = None
    is_flagged_risk: Optional[bool] = None
    risk_reason: Optional[str] = None
    note: Optional[str] = None
    status: Optional[str] = None


class StudentOut(StudentBase):
    id: int
    class_id: int
    group_name: Optional[str] = ""
    model_config = ConfigDict(from_attributes=True)


class ImportStudentItem(BaseModel):
    """1 dòng học sinh nạp hàng loạt (từ Excel). Giá trị có thể là số/chuỗi nên để Any, chuẩn hóa ở router."""
    model_config = ConfigDict(extra="ignore")
    full_name: Any = ""
    gender: Any = "Nam"
    dob: Any = None
    group_name: Any = None
    role_in_class: Any = None
    parent_name: Any = None
    parent_phone: Any = None
    parent_job: Any = None
    address: Any = None
    family_background: Any = None
    interests: Any = None
    private_notes: Any = None
    is_flagged_risk: Any = False
    risk_reason: Any = None


class ImportStudentsIn(BaseModel):
    students: List[ImportStudentItem] = Field(max_length=300)
    replace: bool = False


class ClassCreate(BaseModel):
    name: str = Field(min_length=1, max_length=20)
    grade: int = Field(default=10, ge=10, le=12)
    school_year: str = Field(default="2025-2026", max_length=20)


class ClassUpdate(BaseModel):
    name: str = Field(min_length=1, max_length=20)


class AttendanceItem(BaseModel):
    student_id: int
    status: str  # C (có mặt), P (có phép), K (không phép), M (muộn)
    reason: Optional[str] = ""
    minutes_late: Optional[int] = 0


class BulkAttendanceIn(BaseModel):
    date: date
    session: str  # sang / chieu
    records: List[AttendanceItem]


class AttendanceOut(BaseModel):
    id: Optional[int] = None
    student_id: int
    student_name: str
    group_name: Optional[str] = ""
    date: date
    session: str
    status: str  # C / P / K / M
    reason: Optional[str] = ""
    minutes_late: Optional[int] = 0
