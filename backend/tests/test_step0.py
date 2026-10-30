import os
import tempfile
from pathlib import Path

_tmp = tempfile.mkdtemp()
os.environ["SCN_DATABASE_URL"] = f"sqlite:///{Path(_tmp, 't.db').as_posix()}"
os.environ["SCN_BACKUP_DIR"] = str(Path(_tmp, "bk"))

import pytest
from fastapi.testclient import TestClient

from app.db import seed as seed_mod
from app.main import app
from app.models import Student, User
from app.db.session import SessionLocal

PW = seed_mod.DEMO_PASSWORD


@pytest.fixture(scope="module")
def client():
    seed_mod.seed()
    with TestClient(app) as c:
        yield c


def login(client, u, p=PW):
    return client.post("/api/auth/login", json={"username": u, "password": p})


def test_health(client):
    assert client.get("/api/health").json() == {"status": "ok"}


def test_requires_login(client):
    client.cookies.clear()
    assert client.get("/api/auth/me").status_code == 401
    assert client.get("/api/backup").status_code == 401


def test_login_and_me(client):
    r = login(client, "gvcn")
    assert r.status_code == 200 and r.json()["class"]["name"] == "10A1"
    assert "httponly" in r.headers["set-cookie"].lower()
    assert client.get("/api/auth/me").json()["role"] == "gvcn"


def test_password_is_hashed():
    with SessionLocal() as db:
        u = db.query(User).filter_by(username="gvcn").one()
        assert u.password_hash.startswith("$argon2") and PW not in u.password_hash


def test_parent_cannot_backup(client):
    client.cookies.clear()
    login(client, "ph01")
    assert client.post("/api/backup").status_code == 403


def test_backup_flow(client):
    client.cookies.clear()
    login(client, "gvcn")
    r = client.post("/api/backup")
    assert r.status_code == 200
    name = r.json()["filename"]
    assert name in [b["filename"] for b in client.get("/api/backup").json()]
    assert client.get(f"/api/backup/{name}").status_code == 200
    assert client.get("/api/backup/..%2F..%2Fsecret").status_code == 404


def test_class_isolation():
    from fastapi import HTTPException
    from app.core.deps import get_scoped
    with SessionLocal() as db:
        u1 = db.query(User).filter_by(username="gvcn").one()
        other = db.query(Student).filter(Student.class_id != u1.class_id).first()
        with pytest.raises(HTTPException) as e:
            get_scoped(db, Student, other.id, u1)
        assert e.value.status_code == 404


def test_lockout(client):
    client.cookies.clear()
    for _ in range(5):
        assert login(client, "gvcn2", "sai").status_code == 401
    assert login(client, "gvcn2").status_code == 429
