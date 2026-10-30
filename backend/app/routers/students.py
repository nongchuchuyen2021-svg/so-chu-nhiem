from io import BytesIO
from typing import List, Optional
from datetime import datetime, date, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, status
from fastapi.responses import StreamingResponse
from sqlalchemy import select, or_, delete, update
from sqlalchemy.orm import Session
import openpyxl

from ..core.deps import current_user, require_gvcn, get_scoped
from ..db.session import get_db
from ..models import (Student, Group, User, AuditLog, Attendance, ConductRecord, StudentNote,
                      AccessCode)
from ..schemas import StudentCreate, StudentUpdate, StudentOut, ImportStudentsIn

router = APIRouter(prefix="/api/students", tags=["students"])


def _delete_students(db: Session, student_ids: list[int]) -> None:
    """Xóa học sinh cùng mọi bản ghi tham chiếu (khóa ngoại bật nên không thể xóa riêng lẻ)."""
    if not student_ids:
        return
    db.execute(delete(Attendance).where(Attendance.student_id.in_(student_ids)))
    db.execute(delete(ConductRecord).where(ConductRecord.student_id.in_(student_ids)))
    db.execute(delete(StudentNote).where(StudentNote.student_id.in_(student_ids)))
    db.execute(delete(AccessCode).where(AccessCode.student_id.in_(student_ids)))
    db.execute(update(User).where(User.student_id.in_(student_ids)).values(student_id=None))
    db.execute(delete(Student).where(Student.id.in_(student_ids)))


def _s(v, limit: int = 255) -> str:
    if v is None:
        return ""
    if isinstance(v, float) and v.is_integer():
        v = int(v)
    return str(v).strip()[:limit]


def _parse_dob(v):
    """Nhận 'YYYY-MM-DD', 'DD/MM/YYYY' hoặc số serial của Excel; không hiểu thì để trống."""
    if v is None or v == "":
        return None
    if isinstance(v, (int, float)) and 1 < v < 80000:
        return date(1899, 12, 30) + timedelta(days=int(v))
    s = str(v).strip()
    for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%d-%m-%Y", "%d.%m.%Y"):
        try:
            return datetime.strptime(s[:10], fmt).date()
        except ValueError:
            continue
    return None


def _norm_group(v) -> str:
    s = _s(v, 50)
    if not s:
        return "Tổ 1"
    return f"Tổ {s}" if s.isdigit() else s


def _norm_phone(v) -> str:
    digits = "".join(ch for ch in _s(v, 30) if ch.isdigit())
    return "0" + digits if len(digits) == 9 else digits


@router.get("/groups")
def get_groups(user: User = Depends(current_user), db: Session = Depends(get_db)):
    groups = db.scalars(select(Group).where(Group.class_id == user.class_id).order_by(Group.id)).all()
    return [{"id": g.id, "name": g.name} for g in groups]


@router.get("", response_model=List[StudentOut])
def get_students(
    q: Optional[str] = Query(None, description="Tìm kiếm họ tên hoặc SĐT"),
    group_id: Optional[int] = Query(None, description="Lọc theo Tổ"),
    flagged: Optional[bool] = Query(None, description="Lọc HS cần quan tâm"),
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    query = select(Student).where(Student.class_id == user.class_id)
    if q:
        q_clean = f"%{q.strip()}%"
        query = query.where(or_(Student.full_name.ilike(q_clean), Student.parent_phone.ilike(q_clean)))
    if group_id:
        query = query.where(Student.group_id == group_id)
    if flagged is not None:
        query = query.where(Student.is_flagged_risk == flagged)
    
    query = query.order_by(Student.id)
    students = db.scalars(query).all()
    
    # Load groups cache
    groups = {g.id: g.name for g in db.scalars(select(Group).where(Group.class_id == user.class_id)).all()}
    
    res = []
    for s in students:
        item = StudentOut(
            id=s.id,
            class_id=s.class_id,
            full_name=s.full_name,
            dob=s.dob,
            gender=s.gender,
            avatar_url=s.avatar_url or "",
            group_id=s.group_id,
            group_name=groups.get(s.group_id, ""),
            parent_name=s.parent_name or "",
            parent_phone=s.parent_phone or "",
            parent_job=s.parent_job or "",
            address=s.address or "",
            role_in_class=s.role_in_class or "Thành viên",
            family_background=s.family_background or "",
            interests=s.interests or "",
            private_notes=s.private_notes if user.role == "gvcn" else "",
            is_flagged_risk=s.is_flagged_risk or False,
            risk_reason=s.risk_reason or "",
            note=s.note or "",
            status=s.status or "dang_hoc",
        )
        # Nếu role là student/cán bộ lớp, ẩn thông tin riêng tư nhạy cảm
        if user.role != "gvcn":
            item.parent_phone = "***" if item.parent_phone else ""
            item.private_notes = ""
            item.family_background = ""
        res.append(item)
    return res


@router.get("/{student_id}", response_model=StudentOut)
def get_student_detail(student_id: int, user: User = Depends(current_user), db: Session = Depends(get_db)):
    s = get_scoped(db, Student, student_id, user)
    group_name = ""
    if s.group_id:
        g = db.get(Group, s.group_id)
        if g:
            group_name = g.name
            
    item = StudentOut(
        id=s.id,
        class_id=s.class_id,
        full_name=s.full_name,
        dob=s.dob,
        gender=s.gender,
        avatar_url=s.avatar_url or "",
        group_id=s.group_id,
        group_name=group_name,
        parent_name=s.parent_name or "",
        parent_phone=s.parent_phone or "",
        parent_job=s.parent_job or "",
        address=s.address or "",
        role_in_class=s.role_in_class or "Thành viên",
        family_background=s.family_background or "",
        interests=s.interests or "",
        private_notes=s.private_notes if user.role == "gvcn" else "",
        is_flagged_risk=s.is_flagged_risk or False,
        risk_reason=s.risk_reason or "",
        note=s.note or "",
        status=s.status or "dang_hoc",
    )
    if user.role != "gvcn":
        item.parent_phone = "***"
        item.private_notes = ""
        item.family_background = ""
    return item


@router.post("", response_model=StudentOut)
def create_student(data: StudentCreate, user: User = Depends(require_gvcn), db: Session = Depends(get_db)):
    student = Student(
        class_id=user.class_id,
        group_id=data.group_id,
        full_name=data.full_name.strip(),
        dob=data.dob,
        gender=data.gender,
        avatar_url=data.avatar_url or "",
        parent_name=data.parent_name or "",
        parent_phone=data.parent_phone or "",
        parent_job=data.parent_job or "",
        address=data.address or "",
        role_in_class=data.role_in_class or "Thành viên",
        family_background=data.family_background or "",
        interests=data.interests or "",
        private_notes=data.private_notes or "",
        is_flagged_risk=data.is_flagged_risk or False,
        risk_reason=data.risk_reason or "",
        note=data.note or "",
        status=data.status or "dang_hoc",
    )
    db.add(student)
    db.commit()
    db.refresh(student)
    
    db.add(AuditLog(user_id=user.id, action="create_student", entity="student", entity_id=student.id))
    db.commit()

    group_name = ""
    if student.group_id:
        g = db.get(Group, student.group_id)
        if g: group_name = g.name

    return StudentOut(
        id=student.id,
        class_id=student.class_id,
        full_name=student.full_name,
        dob=student.dob,
        gender=student.gender,
        avatar_url=student.avatar_url or "",
        group_id=student.group_id,
        group_name=group_name,
        parent_name=student.parent_name or "",
        parent_phone=student.parent_phone or "",
        parent_job=student.parent_job or "",
        address=student.address or "",
        role_in_class=student.role_in_class or "Thành viên",
        family_background=student.family_background or "",
        interests=student.interests or "",
        private_notes=student.private_notes or "",
        is_flagged_risk=student.is_flagged_risk or False,
        risk_reason=student.risk_reason or "",
        note=student.note or "",
        status=student.status or "dang_hoc",
    )


@router.put("/{student_id}", response_model=StudentOut)
def update_student(student_id: int, data: StudentUpdate, user: User = Depends(require_gvcn), db: Session = Depends(get_db)):
    student = get_scoped(db, Student, student_id, user)
    
    update_data = data.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        setattr(student, field, val)
        
    db.add(AuditLog(user_id=user.id, action="update_student", entity="student", entity_id=student.id))
    db.commit()
    db.refresh(student)
    
    group_name = ""
    if student.group_id:
        g = db.get(Group, student.group_id)
        if g: group_name = g.name

    return StudentOut(
        id=student.id,
        class_id=student.class_id,
        full_name=student.full_name,
        dob=student.dob,
        gender=student.gender,
        avatar_url=student.avatar_url or "",
        group_id=student.group_id,
        group_name=group_name,
        parent_name=student.parent_name or "",
        parent_phone=student.parent_phone or "",
        parent_job=student.parent_job or "",
        address=student.address or "",
        role_in_class=student.role_in_class or "Thành viên",
        family_background=student.family_background or "",
        interests=student.interests or "",
        private_notes=student.private_notes or "",
        is_flagged_risk=student.is_flagged_risk or False,
        risk_reason=student.risk_reason or "",
        note=student.note or "",
        status=student.status or "dang_hoc",
    )


@router.delete("/{student_id}")
def delete_student(student_id: int, user: User = Depends(require_gvcn), db: Session = Depends(get_db)):
    student = get_scoped(db, Student, student_id, user)
    _delete_students(db, [student.id])
    db.add(AuditLog(user_id=user.id, action="delete_student", entity="student", entity_id=student_id))
    db.commit()
    return {"ok": True, "message": "Đã xóa học sinh thành công"}


@router.post("/import")
def import_students(data: ImportStudentsIn, user: User = Depends(require_gvcn), db: Session = Depends(get_db)):
    """Nạp danh sách học sinh vào lớp hiện tại trong 1 giao dịch (lỗi thì không đổi gì).
    replace=True: thay toàn bộ danh sách cũ (kèm điểm danh/nề nếp của các em đó)."""
    rows = []
    for item in data.students:
        name = _s(item.full_name, 100)
        if name:
            rows.append((name, item))
    if not rows:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "Không có học sinh hợp lệ (thiếu họ và tên)")

    removed = 0
    if data.replace:
        old_ids = list(db.scalars(select(Student.id).where(Student.class_id == user.class_id)).all())
        removed = len(old_ids)
        _delete_students(db, old_ids)

    groups = {g.name: g.id for g in db.scalars(select(Group).where(Group.class_id == user.class_id)).all()}
    existing = {(s.full_name.strip().lower(), s.dob)
                for s in db.scalars(select(Student).where(Student.class_id == user.class_id)).all()}

    added, skipped = 0, 0
    for name, item in rows:
        dob = _parse_dob(item.dob)
        key = (name.lower(), dob)
        if key in existing:
            skipped += 1
            continue
        existing.add(key)
        gname = _norm_group(item.group_name)
        if gname not in groups:
            g = Group(class_id=user.class_id, name=gname)
            db.add(g)
            db.flush()
            groups[gname] = g.id
        gender = "Nữ" if _s(item.gender, 10).lower() in ("nữ", "nu", "nữ ", "female", "f") else "Nam"
        db.add(Student(
            class_id=user.class_id, group_id=groups[gname], full_name=name, dob=dob, gender=gender,
            role_in_class=_s(item.role_in_class, 50) or "Thành viên",
            parent_name=_s(item.parent_name, 100), parent_phone=_norm_phone(item.parent_phone),
            parent_job=_s(item.parent_job, 100), address=_s(item.address),
            family_background=_s(item.family_background, 2000), interests=_s(item.interests, 2000),
            private_notes=_s(item.private_notes, 2000),
            is_flagged_risk=bool(item.is_flagged_risk), risk_reason=_s(item.risk_reason),
        ))
        added += 1

    db.add(AuditLog(user_id=user.id, action="import_students", entity="student", entity_id=None))
    db.commit()
    return {"ok": True, "added": added, "skipped_duplicates": skipped, "removed": removed}


@router.get("/export/excel")
def export_students_excel(user: User = Depends(require_gvcn), db: Session = Depends(get_db)):
    students = db.scalars(select(Student).where(Student.class_id == user.class_id).order_by(Student.id)).all()
    groups = {g.id: g.name for g in db.scalars(select(Group).where(Group.class_id == user.class_id)).all()}
    
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Danh sách học sinh"
    
    headers = ["STT", "Họ và tên", "Ngày sinh", "Giới tính", "Tổ", "Chức vụ", "Họ tên PH", "SĐT PH", "Địa chỉ", "Ghi chú"]
    ws.append(headers)
    
    for idx, s in enumerate(students, 1):
        ws.append([
            idx,
            s.full_name,
            s.dob.strftime("%d/%m/%Y") if s.dob else "",
            s.gender,
            groups.get(s.group_id, ""),
            s.role_in_class or "",
            s.parent_name or "",
            s.parent_phone or "",
            s.address or "",
            s.note or "",
        ])
        
    out = BytesIO()
    wb.save(out)
    out.seek(0)
    
    filename = f"Danh_sach_lop_{user.class_id}_{date.today().strftime('%Y%m%d')}.xlsx"
    return StreamingResponse(
        out,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

