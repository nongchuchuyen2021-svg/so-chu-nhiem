"""Dữ liệu mẫu trường THPT Việt Nam (Lớp 10A1, 40 học sinh, đầy đủ nề nếp, điểm danh, sự kiện).

Chạy:  python -m app.db.seed          (thêm dữ liệu mẫu nếu CSDL còn trống)
       python -m app.db.seed --reset  (xóa CSDL và tạo lại mới tinh)
"""
import random
import sys
from datetime import date, timedelta

if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

from sqlalchemy import select

from ..core.config import settings
from ..core.security import hash_password
from .session import SessionLocal, engine, Base, init_db
from ..models import (Class, ConductCriteria, Group, SchoolYear, Student, Attendance, Event, User)

DEMO_PASSWORD = "Demo@12345"

STUDENT_ROSTER_10A1 = [
    # (Họ tên, Giới tính, Chức vụ, Hoàn cảnh/Sở thích, Ghi chú GVCN, Flagged, RiskReason)
    ("Nguyễn Hoàng Nam", "Nam", "Lớp trưởng", "Gia đình công chức. Thích bóng rổ, học tốt Toán-Tin.", "Gương mẫu, có uy tín với lớp, điều hành tốt.", False, ""),
    ("Trần Khánh Linh", "Nữ", "Lớp phó học tập", "Bố mẹ làm bác sĩ. Năng khiếu Tiếng Anh và Hóa.", "Chăm chỉ, hỗ trợ bạn bè rất nhiệt tình.", False, ""),
    ("Lê Quốc Anh", "Nam", "Lớp phó đời sống", "Nhà gần trường. Thích tổ chức sự kiện, thể thao.", "Nhanh nhẹn, tháo vát, quản lý tốt cơ sở vật chất.", False, ""),
    ("Phạm Minh Châu", "Nữ", "Bí thư Chi đoàn", "Bố mẹ kinh doanh. Thích múa, văn nghệ, hoạt động Đoàn.", "Năng nổ, trách nhiệm cao, giọng nói truyền cảm.", False, ""),
    ("Hoàng Văn Khang", "Nam", "Tổ trưởng Tổ 1", "Con một. Đam mê cờ vua, tư duy logic tốt.", "Cần rèn luyện tính kiên nhẫn khi làm việc nhóm.", False, ""),
    ("Vũ Thanh Giang", "Nữ", "Tổ phó Tổ 1", "Nhà cách trường 5km. Thích vẽ và làm đồ thủ công.", "Hơi nhút nhát, cần khuyến khích phát biểu nhiều hơn.", False, ""),
    ("Đặng Hữu Phúc", "Nam", "Thành viên", "Bố mẹ đi làm ăn xa, ở với bà ngoại.", "Hoàn cảnh cần quan tâm, thiếu sự kèm cặp tại nhà, hay buồn.", True, "Ở với bà ngoại, thiếu sự kèm cặp"),
    ("Bùi Ngọc Mai", "Nữ", "Thành viên", "Gia đình làm nông nghiệp. Chăm ngoan, hiền lành.", "Tiếp thu bài hơi chậm môn Toán, cần bạn kèm thêm.", False, ""),
    ("Đỗ Gia Bảo", "Nam", "Tổ trưởng Tổ 2", "Gia đình trí thức. Thích bơi lội, học đều các môn.", "Nghiêm túc, quản lý tổ nề nếp rất tốt.", False, ""),
    ("Ngô Phương Nhi", "Nữ", "Tổ phó Tổ 2", "Năng khiếu viết văn, thích đọc sách.", "Rất tự giác, chữ viết đẹp, cẩn thận.", False, ""),
    ("Nguyễn Đức Cường", "Nam", "Thành viên", "Thích đá bóng, hay thức khuya xem thể thao.", "Thường xuyên đi muộn đầu giờ sáng (đã nhắc nhở 3 lần).", True, "Thường xuyên đi muộn đầu giờ sáng"),
    ("Trần Thị Trang", "Nữ", "Thành viên", "Gia đình cận nghèo, mẹ bị ốm.", "Chăm học nhưng hay tự ti, diện chính sách hỗ trợ chi phí.", True, "Gia đình cận nghèo, cần hỗ trợ học bổng"),
    ("Lê Minh Tuấn", "Nam", "Tổ trưởng Tổ 3", "Năng động, chơi ghita giỏi.", "Hăng hái phát biểu xây dựng bài.", False, ""),
    ("Phạm Bảo Vy", "Nữ", "Tổ phó Tổ 3", "Thích Ngoại ngữ, thành viên CLB Tiếng Anh.", "Giao tiếp tự tin, phong thái chững chạc.", False, ""),
    ("Hoàng Quốc Dũng", "Nam", "Thành viên", "Thích chơi game online, tính tình bốc đồng.", "Hay nói chuyện riêng trong giờ, đã làm cam kết với lớp.", True, "Thường mất tập trung, nói chuyện riêng"),
    ("Vũ Khánh Hà", "Nữ", "Thành viên", "Bố mẹ làm giáo viên. Học giỏi Ngữ văn.", "Có tinh thần giúp đỡ bạn bè yếu hơn.", False, ""),
    ("Đặng Minh An", "Nam", "Tổ trưởng Tổ 4", "Tính tình điềm đạm, có trách nhiệm.", "Quản lý tổ tốt, gương mẫu trong học tập.", False, ""),
    ("Bùi Thanh Lan", "Nữ", "Tổ phó Tổ 4", "Thích sinh học, tham gia bảo vệ môi trường.", "Tích cực trong các buổi lao động trực nhật.", False, ""),
    ("Đỗ Hữu Hải", "Nam", "Cán sự Thể dục", "Đội tuyển bóng đá trường.", "Sức khỏe tốt, dẫn dắt các hoạt động thể thao xuất sắc.", False, ""),
    ("Ngô Ngọc Ánh", "Nữ", "Thủ quỹ lớp", "Cẩn thận, tỉ mỉ, trung thực.", "Ghi chép sổ sách thu chi rõ ràng, minh bạch.", False, ""),
    ("Nguyễn Văn Bình", "Nam", "Thành viên", "Nhà cách trường 2km. Thích âm nhạc.", "Ngoan ngoãn, hòa đồng với bạn bè.", False, ""),
    ("Trần Minh Long", "Nam", "Thành viên", "Thích học Lịch sử và Địa lý.", "Chăm chỉ ghi chép bài đầy đủ.", False, ""),
    ("Lê Thanh Hằng", "Nữ", "Thành viên", "Thích làm bánh và thủ công.", "Ít nói nhưng luôn hoàn thành nhiệm vụ được giao.", False, ""),
    ("Phạm Gia Huy", "Nam", "Thành viên", "Thích khám phá khoa học kỹ thuật.", "Sáng tạo, có nhiều ý tưởng cho dự án STEM.", False, ""),
    ("Hoàng Diệu Linh", "Nữ", "Thành viên", "Thích đọc sách văn học cổ điển.", "Ý thức tự giác cao, nề nếp tốt.", False, ""),
    ("Vũ Tuấn Kiệt", "Nam", "Thành viên", "Thích chơi cầu lông.", "Vui tính, hay pha trò giúp lớp vui vẻ.", False, ""),
    ("Đặng Thảo Nguyên", "Nữ", "Thành viên", "Thích hội họa và thiết kế.", "Phụ trách làm báo tường và trang trí lớp.", False, ""),
    ("Bùi Quốc Việt", "Nam", "Thành viên", "Nhà xa trường 8km.", "Đôi khi đi học sát giờ do kẹt xe cầu vượt.", False, ""),
    ("Đỗ Quỳnh Chi", "Nữ", "Thành viên", "Thích ngoại ngữ và du lịch.", "Học đều các môn, hòa nhã.", False, ""),
    ("Ngô Quang Sáng", "Nam", "Thành viên", "Đam mê lập trình máy tính.", "Đã đạt giải Ba Tin học trẻ cấp thành phố.", False, ""),
    ("Nguyễn Thùy Dương", "Nữ", "Thành viên", "Gia đình kinh doanh hoa quả.", "Chăm chỉ, tích cực tham gia phong trào.", False, ""),
    ("Trần Nhật Minh", "Nam", "Thành viên", "Thích chơi cờ tướng.", "Trầm tính, tập trung cao trong giờ học.", False, ""),
    ("Lê Thu Thảo", "Nữ", "Thành viên", "Thích khiêu vũ thể thao.", "Nhanh nhẹn, hoạt bát, dễ gần.", False, ""),
    ("Phạm Đức Thịnh", "Nam", "Thành viên", "Thích học Hóa học.", "Chăm chú nghe giảng, có sổ tay tóm tắt bài tốt.", False, ""),
    ("Hoàng Kim Ngân", "Nữ", "Thành viên", "Thích đọc truyện tranh và vẽ chibi.", "Hòa đồng, luôn vui vẻ.", False, ""),
    ("Vũ Trọng Nghĩa", "Nam", "Thành viên", "Thích thể thao, bơi lội.", "Thể lực tốt, nhiệt tình khi khiêng vác bàn ghế.", False, ""),
    ("Đặng Yến Nhi", "Nữ", "Thành viên", "Thích học môn Sinh và Môi trường.", "Cẩn thận, giữ vệ sinh chỗ ngồi rất sạch.", False, ""),
    ("Bùi Văn Quyết", "Nam", "Thành viên", "Nhà gần chợ. Chăm phụ giúp bố mẹ.", "Cần rèn thêm kỹ năng làm việc nhóm.", False, ""),
    ("Đỗ Mỹ Duyên", "Nữ", "Thành viên", "Thích ca hát, tham gia đội văn nghệ.", "Giọng hát hay, mang lại năng lượng tích cực cho lớp.", False, ""),
    ("Ngô Tấn Tài", "Nam", "Thành viên", "Thích nghiên cứu vật lý thiên văn.", "Ham học hỏi, hay đặt các câu hỏi hay cho giáo viên.", False, ""),
]


def make_full_class(db, year, class_name="10A1", seed_idx=1):
    rnd = random.Random(seed_idx)
    cls = Class(name=class_name, grade=10, school_year_id=year.id)
    db.add(cls)
    db.flush()

    groups = [Group(class_id=cls.id, name=f"Tổ {i}") for i in range(1, 5)]
    db.add_all(groups)
    db.flush()

    students = []
    for idx, (ten, gender, role, background, notes, flagged, risk_reason) in enumerate(STUDENT_ROSTER_10A1):
        g_idx = idx % 4
        s = Student(
            class_id=cls.id,
            group_id=groups[g_idx].id,
            full_name=ten,
            dob=date(2010, (idx % 12) + 1, (idx % 27) + 1),
            gender=gender,
            parent_name=f"Bác {ten.split()[-1]} (PH)",
            parent_phone=f"0987{idx:03d}88",
            parent_job="Kinh doanh / Công chức" if idx % 2 == 0 else "Lao động tự do",
            address=f"Số {rnd.randint(10, 150)} Phố Trần Phú, Quận Ba Đình, Hà Nội",
            role_in_class=role,
            family_background=background,
            interests="Thể thao, đọc sách, âm nhạc, khoa học",
            private_notes=notes,
            is_flagged_risk=flagged,
            risk_reason=risk_reason,
            note="",
            status="dang_hoc",
        )
        db.add(s)
        students.append(s)
    db.flush()

    # Thêm tiêu chí thi đua nề nếp
    criteria = [
        ("Đi học đúng giờ", 1, "Nề nếp"),
        ("Đi muộn", -2, "Nề nếp"),
        ("Không làm bài tập", -2, "Học tập"),
        ("Phát biểu xây dựng bài", 2, "Học tập"),
        ("Vệ sinh lớp sạch sẽ", 2, "Lao động"),
        ("Nói chuyện riêng trong lớp", -1, "Nề nếp"),
        ("Không mặc đồng phục", -2, "Nề nếp"),
        ("Giúp bạn tiến bộ", 3, "Đạo đức"),
        ("Nhặt được của rơi trả lại", 5, "Đạo đức"),
    ]
    for name_, pts, cat in criteria:
        db.add(ConductCriteria(class_id=cls.id, name=name_, points=pts, category=cat))

    # Thêm sự kiện / lịch trình mẫu
    today = date.today()
    events = [
        Event(class_id=cls.id, title="Kiểm tra Giữa Học kỳ 1 môn Toán & Ngữ văn", type="kiem_tra", date=today + timedelta(days=2), note="Nhắc học sinh ôn tập trọng tâm chương 1 & 2"),
        Event(class_id=cls.id, title="Họp Phụ huynh đầu năm học 2025-2026", type="hop_ph", date=today + timedelta(days=6), note="Bầu Ban đại diện CMHS, phổ biến nội quy và phương hướng năm học"),
        Event(class_id=cls.id, title="Hạn nộp tiền Bảo hiểm Y tế học sinh đợt 1", type="nop_tien", amount=563000, date=today + timedelta(days=9), note="Báo cáo danh sách nộp về phòng Tài vụ trường"),
        Event(class_id=cls.id, title="Tiết Sinh hoạt lớp: Tuyên dương tuần & Phê bình nề nếp", type="khac", date=today + timedelta(days=(5 - today.weekday()) % 7), note="Tổng kết điểm thi đua các Tổ"),
    ]
    db.add_all(events)

    db.flush()
    return cls, students


def seed(reset=False):
    if reset:
        engine.dispose()
        from sqlalchemy.engine import make_url
        p = make_url(settings.database_url).database
        import os
        for suffix in ("", "-wal", "-shm"):
            if os.path.exists(p + suffix):
                os.remove(p + suffix)
    init_db()
    with SessionLocal() as db:
        if db.scalar(select(User).limit(1)):
            print("CSDL đã có dữ liệu, bỏ qua (dùng --reset để tạo lại).")
            return
            
        year = SchoolYear(
            name="2025-2026",
            hk1_start=date(2025, 9, 5),
            hk1_end=date(2026, 1, 16),
            hk2_start=date(2026, 1, 19),
            hk2_end=date(2026, 5, 29),
        )
        db.add(year)
        db.flush()

        c1, students1 = make_full_class(db, year, "10A1", seed_idx=1)
        c2, students2 = make_full_class(db, year, "10A2", seed_idx=2)
        
        # Tạo tài khoản đăng nhập
        pw = hash_password(DEMO_PASSWORD)
        first = students1[0]
        can_bo = students1[1]  # Lớp phó học tập
        
        db.add_all([
            User(username="gvcn", password_hash=pw, role="gvcn", full_name="Cô Nguyễn Mai Phương (GVCN 10A1)", class_id=c1.id),
            User(username="gvcn2", password_hash=pw, role="gvcn", full_name="Thầy Trần Minh Đức (GVCN 10A2)", class_id=c2.id),
            User(username="canbo", password_hash=pw, role="student", full_name=can_bo.full_name, class_id=c1.id, student_id=can_bo.id),
            User(username="ph01", password_hash=pw, role="parent", full_name=first.parent_name, class_id=c1.id, student_id=first.id),
        ])
        db.flush()
        c1.owner_id = db.scalar(select(User.id).where(User.username == "gvcn"))
        c2.owner_id = db.scalar(select(User.id).where(User.username == "gvcn2"))

        # Tạo sẵn dữ liệu điểm danh 7 ngày qua để có biểu đồ đẹp ngay
        gv_user = db.scalar(select(User).where(User.username == "gvcn"))
        today = date.today()
        for day_offset in range(7, -1, -1):
            d = today - timedelta(days=day_offset)
            # Chủ nhật thì bỏ qua
            if d.weekday() == 6:
                continue
            
            # Cho vài học sinh vắng hoặc muộn để dữ liệu sinh động
            for s in students1:
                # Học sinh Cường hay đi muộn
                if "Cường" in s.full_name and day_offset in (0, 2, 4):
                    db.add(Attendance(class_id=c1.id, student_id=s.id, date=d, session="sang", status="M", reason="Hỏng xe giữa đường", minutes_late=15, recorded_by=gv_user.id))
                # Học sinh Phúc vắng có phép
                elif "Phúc" in s.full_name and day_offset in (1, 3):
                    db.add(Attendance(class_id=c1.id, student_id=s.id, date=d, session="sang", status="P", reason="Bà ngoại ốm xin nghỉ", recorded_by=gv_user.id))
                # Học sinh Dũng vắng không phép 1 hôm
                elif "Dũng" in s.full_name and day_offset == 5:
                    db.add(Attendance(class_id=c1.id, student_id=s.id, date=d, session="sang", status="K", reason="Không phép (gia đình không hay biết)", recorded_by=gv_user.id))
                elif day_offset == 0:
                    # Hôm nay: tất cả các em khác có mặt
                    db.add(Attendance(class_id=c1.id, student_id=s.id, date=d, session="sang", status="C", recorded_by=gv_user.id))
        
        db.commit()
        print(f"Đã tạo dữ liệu mẫu thành công cho Lớp 10A1 (40 học sinh)!")
        print(f"Tài khoản GVCN: gvcn / {DEMO_PASSWORD}")
        print(f"Tài khoản Cán bộ lớp: canbo / {DEMO_PASSWORD}")
        print(f"Tài khoản Phụ huynh: ph01 / {DEMO_PASSWORD}")


if __name__ == "__main__":
    seed(reset="--reset" in sys.argv)
