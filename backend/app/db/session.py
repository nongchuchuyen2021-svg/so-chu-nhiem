from sqlalchemy import create_engine, event
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from ..core.config import settings


class Base(DeclarativeBase):
    pass


engine = create_engine(settings.database_url, connect_args={"check_same_thread": False})


@event.listens_for(engine, "connect")
def _sqlite_pragmas(dbapi_conn, _):
    cur = dbapi_conn.cursor()
    cur.execute("PRAGMA foreign_keys=ON")
    cur.execute("PRAGMA journal_mode=WAL")
    cur.close()


SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    from .. import models  # noqa: F401  (đăng ký bảng)

    Base.metadata.create_all(engine)
    _migrate()


def _migrate():
    """CSDL SQLite cũ chưa có cột classes.owner_id: thêm cột và gán lớp cũ cho GVCN đang phụ trách (hoặc 'gvcn')."""
    from sqlalchemy import inspect, text

    with engine.begin() as conn:
        cols = {c["name"] for c in inspect(conn).get_columns("classes")}
        if "owner_id" not in cols:
            conn.execute(text("ALTER TABLE classes ADD COLUMN owner_id INTEGER"))
        conn.execute(text(
            "UPDATE classes SET owner_id = (SELECT id FROM users WHERE role = 'gvcn' "
            "AND class_id = classes.id ORDER BY id LIMIT 1) WHERE owner_id IS NULL"))
        conn.execute(text(
            "UPDATE classes SET owner_id = (SELECT id FROM users WHERE username = 'gvcn') "
            "WHERE owner_id IS NULL"))
