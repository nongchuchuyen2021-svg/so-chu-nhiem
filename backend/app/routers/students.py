from io import BytesIO
from typing import List, Optional
from datetime import datetime, date

from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, status
from fastapi.responses import StreamingResponse
from sqlalchemy import select, or_
from sqlalchemy.orm import Session
import openpyxl

from ..core.deps import current_user, require_gvcn, get_scoped
from ..db.session import get_db
from ..models import Student, Group, User, AuditLog
from ..schemas import StudentCreate, StudentUpdate, StudentOut

router = APIRouter(prefix="/api/students", tags=["students"])


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
    db.delete(student)
    db.add(AuditLog(user_id=user.id, action="delete_student", entity="student", entity_id=student_id))
    db.commit()
    return {"ok": True, "message": "Đã xóa học sinh thành công"}


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

