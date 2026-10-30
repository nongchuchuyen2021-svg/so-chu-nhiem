from datetime import date, datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Depends
from sqlalchemy import select, func
from sqlalchemy.orm import Session

from ..core.deps import current_user
from ..db.session import get_db
from ..models import Attendance, Student, Group, ConductRecord, Event, User

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("")
def get_dashboard_overview(user: User = Depends(current_user), db: Session = Depends(get_db)):
    today = date.today()
    current_hour = datetime.now().hour
    current_session = "sang" if current_hour < 12 else "chieu"
    
    # Danh sách học sinh
    students = db.scalars(
        select(Student).where(Student.class_id == user.class_id, Student.status == "dang_hoc")
    ).all()
    total_students = len(students)
    
    # Điểm danh hôm nay
    today_records = db.scalars(
        select(Attendance).where(
            Attendance.class_id == user.class_id,
            Attendance.date == today,
            Attendance.session == current_session,
        )
    ).all()
    rec_dict = {r.student_id: r for r in today_records}
    
    absent_p = sum(1 for r in today_records if r.status == "P")
    absent_k = sum(1 for r in today_records if r.status == "K")
    late = sum(1 for r in today_records if r.status == "M")
    present = total_students - absent_p - absent_k
    attendance_rate = round((present / total_students * 100), 1) if total_students > 0 else 100
    
    # Học sinh vắng hôm nay
    absent_today_list = []
    for r in today_records:
        if r.status in ("P", "K", "M"):
            st = next((s for s in students if s.id == r.student_id), None)
            if st:
                absent_today_list.append({
                    "id": st.id,
                    "name": st.full_name,
                    "status": r.status,
                    "status_label": "Có phép" if r.status == "P" else ("Không phép" if r.status == "K" else "Đi muộn"),
                    "reason": r.reason or "",
                    "minutes_late": r.minutes_late or 0,
                    "phone": st.parent_phone if user.role == "gvcn" else "***",
                })
                
    # Học sinh gắn cờ cần chú ý
    flagged_students = [
        {
            "id": s.id,
            "name": s.full_name,
            "gender": s.gender,
            "role": s.role_in_class or "Thành viên",
            "reason": s.risk_reason or "Cần theo dõi sát",
            "parent_phone": s.parent_phone if user.role == "gvcn" else "***",
        }
        for s in students if s.is_flagged_risk
    ]
    
    # Lịch trình / Sự kiện sắp tới
    events = db.scalars(
        select(Event)
        .where(Event.class_id == user.class_id, Event.date >= today)
        .order_by(Event.date)
        .limit(5)
    ).all()
    upcoming_events = [
        {"id": e.id, "title": e.title, "type": e.type, "date": e.date.strftime("%d/%m/%Y"), "note": e.note}
        for e in events
    ]
    
    # Xu hướng chuyên cần 7 ngày
    chart_data = []
    for i in range(6, -1, -1):
        d = today - timedelta(days=i)
        d_records = db.scalars(
            select(Attendance).where(
                Attendance.class_id == user.class_id,
                Attendance.date == d,
                Attendance.session == "sang",
            )
        ).all()
        p = sum(1 for r in d_records if r.status == "P")
        k = sum(1 for r in d_records if r.status == "K")
        m = sum(1 for r in d_records if r.status == "M")
        pres = total_students - p - k
        chart_data.append({
            "date": d.strftime("%d/%m"),
            "day": f"T{d.weekday() + 2}" if d.weekday() < 6 else "CN",
            "co_mat": pres,
            "vang": p + k,
            "muon": m,
            "ty_le": round((pres / total_students * 100), 1) if total_students > 0 else 100,
        })
        
    return {
        "class_name": user.full_name,
        "role": user.role,
        "total_students": total_students,
        "today": {
            "date": today.strftime("%d/%m/%Y"),
            "session": current_session,
            "session_label": "Buổi Sáng" if current_session == "sang" else "Buổi Chiều",
            "present": present,
            "absent_p": absent_p,
            "absent_k": absent_k,
            "late": late,
            "rate": attendance_rate,
            "absent_list": absent_today_list,
        },
        "flagged_students": flagged_students,
        "upcoming_events": upcoming_events,
        "chart_data": chart_data,
    }

