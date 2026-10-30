import pytest
from fastapi.testclient import TestClient

from app.db import seed as seed_mod
from app.main import app

PW = seed_mod.DEMO_PASSWORD


@pytest.fixture(scope="module")
def client():
    seed_mod.seed(reset=True)
    with TestClient(app) as c:
        yield c


def login(client, u, p=PW):
    return client.post("/api/auth/login", json={"username": u, "password": p})


def test_dashboard_api(client):
    client.cookies.clear()
    login(client, "gvcn")
    r = client.get("/api/dashboard")
    assert r.status_code == 200
    data = r.json()
    assert data["total_students"] == 40
    assert "today" in data
    assert "chart_data" in data
    assert len(data["flagged_students"]) > 0


def test_students_api(client):
    client.cookies.clear()
    login(client, "gvcn")
    r = client.get("/api/students")
    assert r.status_code == 200
    students = r.json()
    assert len(students) == 40
    
    # Test search
    r_search = client.get("/api/students?q=Nam")
    assert r_search.status_code == 200
    assert any("Nam" in s["full_name"] for s in r_search.json())
    
    # Test groups
    r_groups = client.get("/api/students/groups")
    assert r_groups.status_code == 200
    assert len(r_groups.json()) == 4


def test_canbo_rbac_protection(client):
    client.cookies.clear()
    login(client, "canbo")
    r = client.get("/api/students")
    assert r.status_code == 200
    students = r.json()
    # Can bo must NOT see private notes or real parent phone
    for s in students:
        assert s["private_notes"] == ""
        if s["parent_phone"]:
            assert s["parent_phone"] == "***"


def test_attendance_api(client):
    client.cookies.clear()
    login(client, "gvcn")
    r = client.get("/api/attendance?date=2026-10-30&session=sang")
    assert r.status_code == 200
    records = r.json()
    assert len(records) == 40
    
    # Update attendance
    st1 = records[0]
    payload = {
        "date": "2026-10-30",
        "session": "sang",
        "records": [
            {"student_id": st1["student_id"], "status": "M", "reason": "Kẹt xe", "minutes_late": 10}
        ]
    }
    r_save = client.post("/api/attendance", json=payload)
    assert r_save.status_code == 200
    
    # Verify update
    r_check = client.get("/api/attendance?date=2026-10-30&session=sang")
    updated_st1 = next(item for item in r_check.json() if item["student_id"] == st1["student_id"])
    assert updated_st1["status"] == "M"
    assert updated_st1["minutes_late"] == 10

