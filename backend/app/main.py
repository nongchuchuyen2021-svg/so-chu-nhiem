from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from .core.config import ROOT
from .db.session import init_db
from .routers import auth, backup, students, attendance, dashboard


@asynccontextmanager
async def lifespan(_: FastAPI):
    init_db()
    yield


app = FastAPI(title="Sổ chủ nhiệm điện tử", lifespan=lifespan)
app.include_router(auth.router)
app.include_router(backup.router)
app.include_router(students.router)
app.include_router(attendance.router)
app.include_router(dashboard.router)


@app.get("/api/health")
def health():
    return {"status": "ok"}


# Khi triển khai: phục vụ frontend đã build (frontend/dist)
_dist = ROOT / "frontend" / "dist"
if _dist.is_dir():
    app.mount("/assets", StaticFiles(directory=_dist / "assets"), name="assets")

    @app.get("/{path:path}", include_in_schema=False)
    def spa(path: str):
        if path.startswith("api") or path.startswith("api/"):
            from fastapi import HTTPException
            raise HTTPException(404, "API endpoint not found")
        f = (_dist / path).resolve()
        if path and f.is_file() and _dist.resolve() in f.parents:
            return FileResponse(f)
        return FileResponse(_dist / "index.html")
