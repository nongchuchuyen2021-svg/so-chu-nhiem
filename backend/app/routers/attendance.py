from datetime import date, timedelta
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, and_, func
from sqlalchemy.orm import Session

from ..core.deps import current_user
from ..db.session import get_db
from ..models import Attendance, Student, Group, User, AuditLog
from ..schemas import BulkAttendanceIn, AttendanceOut

router = APIRouter(prefix="/api/attendance", tags=["attendance"])


@router.get("", response_model=List[AttendanceOut])
def get_attendance(
    target_date: date = Query(default_factory=date.today, alias="date"),
    session: str = Query("sang", pattern="^(sang|chieu)$"),
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    # Lấy toàn bộ học sinh lớp
    students = db.scalars(
        select(Student)
        .where(Student.class_id == user.class_id, Student.status == "dang_hoc")
        .order_by(Student.id)
    ).all()
    
    # Lấy thông tin tổ
    groups = {g.id: g.name for g in db.scalars(select(Group).where(Group.class_id == user.class_id)).all()}
    
    # Lấy các bản ghi điểm danh hiện có trong buổi này
    records = db.scalars(
        select(Attendance).where(
            Attendance.class_id == user.class_id,
            Attendance.date == target_date,
            Attendance.session == session,
        )
    ).all()
    rec_map = {r.student_id: r for r in records}
    
    res = []
    for s in students:
        rec = rec_map.get(s.id)
        res.append(
            AttendanceOut(
                id=rec.id if rec else None,
                student_id=s.id,
                student_name=s.full_name,
                group_name=groups.get(s.group_id, ""),
                date=target_date,
                session=session,
                status=rec.status if rec else "C",  # Mặc định C (Có mặt)
                reason=rec.reason if rec else "",
                minutes_late=rec.minutes_late if rec else 0,
            )
        )
    return res


@router.post("")
def save_attendance(data: BulkAttendanceIn, user: User = Depends(current_user), db: Session = Depends(get_db)):
    # Cho phép cả GVCN và Cán bộ lớp (role="student") điểm danh
    if user.role not in ("gvcn", "student"):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Bạn không có quyền điểm danh")

    ids = [item.student_id for item in data.records]
    valid_ids = set(db.scalars(select(Student.id).where(Student.class_id == user.class_id,
                                                       Student.id.in_(ids))).all())
    if any(i not in valid_ids for i in ids):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Danh sách có học sinh không thuộc lớp này")
    if any(item.status not in ("C", "P", "K", "M") for item in data.records):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Trạng thái điểm danh không hợp lệ")

    for item in data.records:
        rec = db.scalar(
            select(Attendance).where(
                Attendance.class_id == user.class_id,
                Attendance.student_id == item.student_id,
                Attendance.date == data.date,
                Attendance.session == data.session,
            )
        )
        if rec:
            rec.status = item.status
            rec.reason = item.reason or ""
            rec.minutes_late = item.minutes_late or 0
            rec.recorded_by = user.id
        else:
            rec = Attendance(
                class_id=user.class_id,
                student_id=item.student_id,
                date=data.date,
                session=data.session,
                status=item.status,
                reason=item.reason or "",
                minutes_late=item.minutes_late or 0,
                recorded_by=user.id,
            )
            db.add(rec)
            
    db.add(AuditLog(user_id=user.id, action="save_attendance", entity="attendance"))
    db.commit()
    return {"ok": True, "count": len(data.records), "message": "Đã lưu điểm danh thành công"}


@router.get("/summary")
def get_attendance_summary(
    days: int = Query(30, ge=1, le=180),
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    end_date = date.today()
    start_date = end_date - timedelta(days=days)
    
    # Danh sách học sinh lớp
    students = db.scalars(
        select(Student).where(Student.class_id == user.class_id, Student.status == "dang_hoc")
    ).all()
    s_map = {s.id: s.full_name for s in students}
    
    # Toàn bộ bản ghi vắng / muộn trong khoảng thời gian
    records = db.scalars(
        select(Attendance).where(
            Attendance.class_id == user.class_id,
            Attendance.date >= start_date,
            Attendance.date <= end_date,
            Attendance.status.in_(["P", "K", "M"]),
        )
    ).all()
    
    # Thống kê theo học sinh
    student_stats = {s.id: {"student_id": s.id, "name": s.full_name, "p": 0, "k": 0, "m": 0, "total_absent": 0} for s in students}
    for r in records:
        if r.student_id in student_stats:
            st = student_stats[r.student_id]
            if r.status == "P":
                st["p"] += 1
                st["total_absent"] += 1
            elif r.status == "K":
                st["k"] += 1
                st["total_absent"] += 1
            elif r.status == "M":
                st["m"] += 1
                
    # Cảnh báo học sinh vắng >= 3 buổi
    at_risk_attendance = [st for st in student_stats.values() if st["total_absent"] >= 3]
    at_risk_attendance.sort(key=lambda x: x["total_absent"], reverse=True)
    
    # Thống kê theo ngày trong 7 ngày gần nhất
    recent_days = []
    for i in range(6, -1, -1):
        d = end_date - timedelta(days=i)
        day_records = [r for r in records if r.date == d]
        p_count = sum(1 for r in day_records if r.status == "P")
        k_count = sum(1 for r in day_records if r.status == "K")
        m_count = sum(1 for r in day_records if r.status == "M")
        present_count = len(students) - p_count - k_count
        recent_days.append({
            "date": d.strftime("%d/%m"),
            "day_name": f"T{d.weekday() + 2}" if d.weekday() < 6 else "CN",
            "present": present_count,
            "absent_p": p_count,
            "absent_k": k_count,
            "late": m_count,
            "rate": round((present_count / len(students) * 100), 1) if students else 100,
        })
        
    return {
        "period_days": days,
        "total_students": len(students),
        "at_risk_count": len(at_risk_attendance),
        "at_risk_students": at_risk_attendance,
        "recent_days": recent_days,
    }
