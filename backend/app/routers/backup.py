from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from ..core.deps import require_gvcn
from ..db.session import get_db
from ..models import AuditLog, User
from ..services import backup as svc

router = APIRouter(prefix="/api/backup", tags=["backup"])


@router.get("")
def list_all(_: User = Depends(require_gvcn)):
    return svc.list_backups()


@router.post("")
def create(user: User = Depends(require_gvcn), db: Session = Depends(get_db)):
    path = svc.create_backup()
    db.add(AuditLog(user_id=user.id, action="backup", entity=path.name))
    db.commit()
    return {"filename": path.name, "size": path.stat().st_size}


@router.get("/{filename}")
def download(filename: str, _: User = Depends(require_gvcn)):
    p = svc.backup_path(filename)
    if not p:
        raise HTTPException(404, "Không tìm thấy bản sao lưu")
    return FileResponse(p, filename=p.name, media_type="application/octet-stream")
