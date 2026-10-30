import pytest
from fastapi.testclient import TestClient

from app.db import seed as seed_mod
from app.main import app

PW = seed_mod.DEMO_PASSWORD


@pytest.fixture()
def client():
    seed_mod.seed(reset=True)
    with TestClient(app) as c:
        yield c


def login(client, u, p=PW):
    client.cookies.clear()
    return client.post("/api/auth/login", json={"username": u, "password": p})


def test_wrong_password_is_401_with_clear_message(client):
    r = login(client, "gvcn", "123456")
    assert r.status_code == 401
    assert "Sai tên đăng nhập" in r.json()["detail"]
    assert client.get("/api/auth/me").status_code == 401


def test_class_switch_changes_data(client):
    login(client, "gvcn")
    classes = client.get("/api/classes").json()
    assert sum(c["is_current"] for c in classes) == 1

    new = client.post("/api/classes", json={"name": "10A9", "grade": 10, "school_year": "2025-2026"})
    assert new.status_code == 200
    new_id = new.json()["id"]
    assert client.post("/api/classes", json={"name": "10A9", "grade": 10, "school_year": "2025-2026"}).status_code == 409

    assert client.post(f"/api/classes/{new_id}/select").status_code == 200
    assert client.get("/api/auth/me").json()["class"]["id"] == new_id
    assert client.get("/api/students").json() == []
    assert len(client.get("/api/students/groups").json()) == 4
    assert client.get("/api/dashboard").json()["total_students"] == 0

    assert client.put(f"/api/classes/{new_id}", json={"name": "10A9b"}).json()["name"] == "10A9b"
    assert client.post("/api/classes/99999/select").status_code == 404


def test_canbo_cannot_manage_classes_or_import(client):
    login(client, "canbo")
    assert client.get("/api/classes").status_code == 403
    assert client.post("/api/classes/1/select").status_code == 403
    assert client.post("/api/students/import", json={"students": [{"full_name": "A"}]}).status_code == 403


def test_import_normalizes_excel_values_and_skips_duplicates(client):
    login(client, "gvcn")
    cid = client.post("/api/classes", json={"name": "10A8", "grade": 10}).json()["id"]
    client.post(f"/api/classes/{cid}/select")

    rows = [
        {"full_name": "Nguyễn Văn An", "dob": 40313, "group_name": 1, "parent_phone": 987111222, "gender": "Nam"},
        {"full_name": "Trần Thị Bình", "dob": "15/05/2010", "group_name": "Tổ 5", "gender": "Nữ"},
        {"full_name": "  ", "dob": ""},
    ]
    r = client.post("/api/students/import", json={"students": rows})
    assert r.status_code == 200 and r.json()["added"] == 2

    again = client.post("/api/students/import", json={"students": rows[:1]}).json()
    assert again["added"] == 0 and again["skipped_duplicates"] == 1

    students = {s["full_name"]: s for s in client.get("/api/students").json()}
    an = students["Nguyễn Văn An"]
    assert an["dob"] == "2010-05-15" and an["group_name"] == "Tổ 1" and an["parent_phone"] == "0987111222"
    assert students["Trần Thị Bình"]["group_name"] == "Tổ 5"
    assert "Tổ 5" in [g["name"] for g in client.get("/api/students/groups").json()]

    assert client.post("/api/students/import", json={"students": [{"full_name": ""}]}).status_code == 422


def test_import_replace_removes_old_students_with_their_attendance(client):
    login(client, "gvcn")
    assert client.post("/api/students/import", json={"students": [{"full_name": "Em Mới"}], "replace": True}).json() == {
        "ok": True, "added": 1, "skipped_duplicates": 0, "removed": 40}
    students = client.get("/api/students").json()
    assert [s["full_name"] for s in students] == ["Em Mới"]


def test_delete_student_with_attendance_history(client):
    login(client, "gvcn")
    sid = client.get("/api/students").json()[0]["id"]
    client.post("/api/attendance", json={"date": "2026-10-30", "session": "sang",
                                         "records": [{"student_id": sid, "status": "K", "reason": "x"}]})
    assert client.delete(f"/api/students/{sid}").status_code == 200
    assert all(s["id"] != sid for s in client.get("/api/students").json())


def test_create_student_with_blank_dob(client):
    login(client, "gvcn")
    r = client.post("/api/students", json={"full_name": "Không ngày sinh", "dob": "", "group_id": 1})
    assert r.status_code == 200 and r.json()["dob"] is None


def test_attendance_rejects_foreign_student_and_bad_status(client):
    login(client, "gvcn")
    sid = client.get("/api/students").json()[0]["id"]
    base = {"date": "2026-10-30", "session": "sang"}
    assert client.post("/api/attendance", json={**base, "records": [{"student_id": 999999, "status": "C"}]}).status_code == 400
    assert client.post("/api/attendance", json={**base, "records": [{"student_id": sid, "status": "Z"}]}).status_code == 400
