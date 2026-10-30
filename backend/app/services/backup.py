import sqlite3
from datetime import datetime
from pathlib import Path

from sqlalchemy.engine import make_url

from ..core.config import settings


def _db_path() -> Path:
    return Path(make_url(settings.database_url).database)


def list_backups() -> list[dict]:
    settings.backup_dir.mkdir(parents=True, exist_ok=True)
    files = sorted(settings.backup_dir.glob("so_chu_nhiem_*.db"), reverse=True)
    return [{"filename": f.name, "size": f.stat().st_size,
             "created_at": datetime.fromtimestamp(f.stat().st_mtime).isoformat(timespec="seconds")}
            for f in files]


def create_backup() -> Path:
    """Sao lưu nhất quán bằng SQLite backup API (an toàn khi đang ghi)."""
    settings.backup_dir.mkdir(parents=True, exist_ok=True)
    dest = settings.backup_dir / f"so_chu_nhiem_{datetime.now():%Y%m%d_%H%M%S}.db"
    src = sqlite3.connect(_db_path())
    dst = sqlite3.connect(dest)
    try:
        src.backup(dst)
    finally:
        dst.close()
        src.close()
    for old in sorted(settings.backup_dir.glob("so_chu_nhiem_*.db"), reverse=True)[settings.backup_keep:]:
        old.unlink()
    return dest


def backup_path(filename: str) -> Path | None:
    """Chỉ trả về file nằm trong thư mục sao lưu (chặn path traversal)."""
    p = (settings.backup_dir / filename).resolve()
    if p.parent != settings.backup_dir.resolve() or not p.is_file():
        return None
    return p
