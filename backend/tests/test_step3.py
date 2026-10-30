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


@pytest.fixture(scope="module")
def client():
    seed_mod.seed()
    with TestClient(app) as c:
        yield c


def reg(client, email="co.lan@gmail.com", pw="matkhau123", name="Cô Lan"):
    return client.post("/api/auth/register", json={"email": email, "password": pw, "full_name": name})


def test_register_gmail_only(client):
    assert reg(client, email="a@yahoo.com").status_code == 422
    assert reg(client, pw="123").status_code == 422
    assert reg(client, name="  ").status_code == 422


def test_register_login_and_isolation(client):
    r = reg(client)
    assert r.status_code == 200 and r.json()["role"] == "gvcn" and r.json()["full_name"] == "Cô Lan"
    assert reg(client).status_code == 409
    # chỉ thấy lớp của mình, không thấy 10A1/10A2 của demo
    classes = client.get("/api/classes").json()
    assert len(classes) == 1
    assert client.get("/api/students").json() == []
    # lớp của GV demo không chọn được
    client.cookies.clear()
    client.post("/api/auth/login", json={"username": "gvcn", "password": seed_mod.DEMO_PASSWORD})
    demo_classes = client.get("/api/classes").json()
    assert {c["name"] for c in demo_classes} == {"10A1"}
    assert client.post(f"/api/classes/{classes[0]['id']}/select").status_code == 404


def test_update_profile(client):
    client.cookies.clear()
    client.post("/api/auth/login", json={"username": "co.lan@gmail.com", "password": "matkhau123"})
    assert client.put("/api/auth/profile", json={"full_name": "Cô Lan Anh"}).json()["full_name"] == "Cô Lan Anh"
    assert client.put("/api/auth/profile", json={"full_name": " "}).status_code == 422
