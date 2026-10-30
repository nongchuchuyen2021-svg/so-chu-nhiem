from datetime import date
from typing import Optional, List
from pydantic import BaseModel, ConfigDict


class StudentBase(BaseModel):
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
