from datetime import date

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..core.deps import require_gvcn
from ..db.session import get_db
from ..models import AuditLog, Class, Group, SchoolYear, User
from ..schemas import ClassCreate, ClassUpdate

router = APIRouter(prefix="/api/classes", tags=["classes"])


def _out(cls: Class, current_id: int) -> dict:
    return {
        "id": cls.id,
        "name": cls.name,
        "grade": cls.grade,
        "school_year": cls.school_year.name,
        "is_current": cls.id == current_id,
    }


def _get_or_create_school_year(db: Session, name: str) -> SchoolYear:
    sy = db.scalar(select(SchoolYear).where(SchoolYear.name == name))
    if sy:
        return sy
    try:
        y = int(name[:4])
    except ValueError:
        y = date.today().year
    sy = SchoolYear(
        name=name,
        hk1_start=date(y, 9, 5), hk1_end=date(y + 1, 1, 15),
        hk2_start=date(y + 1, 1, 16), hk2_end=date(y + 1, 5, 31),
    )
    db.add(sy)
    db.flush()
    return sy


@router.get("")
def list_classes(user: User = Depends(require_gvcn), db: Session = Depends(get_db)):
    classes = db.scalars(select(Class).where(Class.owner_id == user.id)
                         .order_by(Class.grade, Class.name)).all()
    return [_out(c, user.class_id) for c in classes]


@router.post("")
def create_class(data: ClassCreate, user: User = Depends(require_gvcn), db: Session = Depends(get_db)):
    name = data.name.strip()
    if not name:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "Tên lớp không được để trống")
    sy = _get_or_create_school_year(db, data.school_year.strip())
    dup = db.scalar(select(Class).where(Class.name == name, Class.school_year_id == sy.id,
                                        Class.owner_id == user.id))
    if dup:
        raise HTTPException(status.HTTP_409_CONFLICT, f"Lớp {name} năm học {sy.name} đã tồn tại")
    cls = Class(name=name, grade=data.grade, school_year_id=sy.id, owner_id=user.id)
    db.add(cls)
    db.flush()
    for i in range(1, 5):
        db.add(Group(class_id=cls.id, name=f"Tổ {i}"))
    db.add(AuditLog(user_id=user.id, action="create_class", entity="class", entity_id=cls.id))
    db.commit()
    db.refresh(cls)
    return _out(cls, user.class_id)


@router.put("/{class_id}")
def rename_class(class_id: int, data: ClassUpdate, user: User = Depends(require_gvcn),
                 db: Session = Depends(get_db)):
    cls = db.get(Class, class_id)
    if not cls or cls.owner_id != user.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Không tìm thấy lớp")
    cls.name = data.name.strip()
    db.add(AuditLog(user_id=user.id, action="rename_class", entity="class", entity_id=cls.id))
    db.commit()
    return _out(cls, user.class_id)


@router.post("/{class_id}/select")
def select_class(class_id: int, user: User = Depends(require_gvcn), db: Session = Depends(get_db)):
    """Đổi lớp đang làm việc: mọi API khác lọc theo user.class_id nên dữ liệu đổi theo."""
    cls = db.get(Class, class_id)
    if not cls or cls.owner_id != user.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Không tìm thấy lớp")
    user.class_id = cls.id
    db.add(AuditLog(user_id=user.id, action="select_class", entity="class", entity_id=cls.id))
    db.commit()
    return _out(cls, cls.id)
