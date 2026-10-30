// Quản lý Dữ liệu Cục Bộ Đa Lớp (Multi-class) & Nạp dữ liệu học sinh

export const DEFAULT_CLASSES = [
  { id: 1, name: "10A1", grade: 10, school_year: "2025-2026" },
  { id: 2, name: "10A2", grade: 10, school_year: "2025-2026" },
  { id: 3, name: "11A1", grade: 11, school_year: "2025-2026" },
  { id: 4, name: "12A1", grade: 12, school_year: "2025-2026" },
];

export const INITIAL_STUDENTS_10A1 = [
  { id: 1, class_id: 1, full_name: "Nguyễn Hoàng Nam", gender: "Nam", dob: "2010-05-14", role_in_class: "Lớp trưởng", group_name: "Tổ 1", parent_name: "Bác Nam (PH)", parent_phone: "098700188", parent_job: "Công chức", address: "Số 15 Phố Trần Phú, Hà Nội", family_background: "Gia đình công chức. Thích bóng rổ, học tốt Toán-Tin.", private_notes: "Gương mẫu, có uy tín với lớp, điều hành tốt.", is_flagged_risk: false, risk_reason: "" },
  { id: 2, class_id: 1, full_name: "Trần Khánh Linh", gender: "Nữ", dob: "2010-08-22", role_in_class: "Lớp phó học tập", group_name: "Tổ 2", parent_name: "Bác Linh (PH)", parent_phone: "098700288", parent_job: "Bác sĩ", address: "Số 28 Phố Trần Phú, Hà Nội", family_background: "Bố mẹ làm bác sĩ. Năng khiếu Tiếng Anh và Hóa.", private_notes: "Chăm chỉ, hỗ trợ bạn bè rất nhiệt tình.", is_flagged_risk: false, risk_reason: "" },
  { id: 3, class_id: 1, full_name: "Lê Quốc Anh", gender: "Nam", dob: "2010-02-10", role_in_class: "Lớp phó đời sống", group_name: "Tổ 3", parent_name: "Bác Anh (PH)", parent_phone: "098700388", parent_job: "Kinh doanh", address: "Số 45 Phố Trần Phú, Hà Nội", family_background: "Nhà gần trường. Thích tổ chức sự kiện, thể thao.", private_notes: "Nhanh nhẹn, tháo vát, quản lý tốt cơ sở vật chất.", is_flagged_risk: false, risk_reason: "" },
  { id: 4, class_id: 1, full_name: "Phạm Minh Châu", gender: "Nữ", dob: "2010-11-05", role_in_class: "Bí thư Chi đoàn", group_name: "Tổ 4", parent_name: "Bác Châu (PH)", parent_phone: "098700488", parent_job: "Kinh doanh", address: "Số 82 Phố Trần Phú, Hà Nội", family_background: "Bố mẹ kinh doanh. Thích múa, văn nghệ, hoạt động Đoàn.", private_notes: "Năng nổ, trách nhiệm cao, giọng nói truyền cảm.", is_flagged_risk: false, risk_reason: "" },
  { id: 5, class_id: 1, full_name: "Hoàng Văn Khang", gender: "Nam", dob: "2010-03-19", role_in_class: "Tổ trưởng Tổ 1", group_name: "Tổ 1", parent_name: "Bác Khang (PH)", parent_phone: "098700588", parent_job: "Công chức", address: "Số 104 Phố Trần Phú, Hà Nội", family_background: "Con một. Đam mê cờ vua, tư duy logic tốt.", private_notes: "Cần rèn luyện tính kiên nhẫn khi làm việc nhóm.", is_flagged_risk: false, risk_reason: "" },
  { id: 6, class_id: 1, full_name: "Vũ Thanh Giang", gender: "Nữ", dob: "2010-09-12", role_in_class: "Tổ phó Tổ 1", group_name: "Tổ 1", parent_name: "Bác Giang (PH)", parent_phone: "098700688", parent_job: "Lao động tự do", address: "Số 39 Phố Trần Phú, Hà Nội", family_background: "Nhà cách trường 5km. Thích vẽ và làm đồ thủ công.", private_notes: "Hơi nhút nhát, cần khuyến khích phát biểu nhiều hơn.", is_flagged_risk: false, risk_reason: "" },
  { id: 7, class_id: 1, full_name: "Đặng Hữu Phúc", gender: "Nam", dob: "2010-01-25", role_in_class: "Thành viên", group_name: "Tổ 1", parent_name: "Bà ngoại Phúc", parent_phone: "098700788", parent_job: "Nghỉ hưu", address: "Số 67 Phố Trần Phú, Hà Nội", family_background: "Bố mẹ đi làm ăn xa, ở với bà ngoại.", private_notes: "Hoàn cảnh cần quan tâm, thiếu sự kèm cặp tại nhà, hay buồn.", is_flagged_risk: true, risk_reason: "Ở với bà ngoại, thiếu sự kèm cặp" },
  { id: 8, class_id: 1, full_name: "Bùi Ngọc Mai", gender: "Nữ", dob: "2010-12-08", role_in_class: "Thành viên", group_name: "Tổ 1", parent_name: "Bác Mai (PH)", parent_phone: "098700888", parent_job: "Làm nông", address: "Số 92 Phố Trần Phú, Hà Nội", family_background: "Gia đình làm nông nghiệp. Chăm ngoan, hiền lành.", private_notes: "Tiếp thu bài hơi chậm môn Toán, cần bạn kèm thêm.", is_flagged_risk: false, risk_reason: "" },
  { id: 9, class_id: 1, full_name: "Đỗ Gia Bảo", gender: "Nam", dob: "2010-07-30", role_in_class: "Tổ trưởng Tổ 2", group_name: "Tổ 2", parent_name: "Bác Bảo (PH)", parent_phone: "098700988", parent_job: "Kỹ sư", address: "Số 11 Phố Trần Phú, Hà Nội", family_background: "Gia đình trí thức. Thích bơi lội, học đều các môn.", private_notes: "Nghiêm túc, quản lý tổ nề nếp rất tốt.", is_flagged_risk: false, risk_reason: "" },
  { id: 10, class_id: 1, full_name: "Ngô Phương Nhi", gender: "Nữ", dob: "2010-04-18", role_in_class: "Tổ phó Tổ 2", group_name: "Tổ 2", parent_name: "Bác Nhi (PH)", parent_phone: "098701088", parent_job: "Giáo viên", address: "Số 43 Phố Trần Phú, Hà Nội", family_background: "Năng khiếu viết văn, thích đọc sách.", private_notes: "Rất tự giác, chữ viết đẹp, cẩn thận.", is_flagged_risk: false, risk_reason: "" },
  { id: 11, class_id: 1, full_name: "Nguyễn Đức Cường", gender: "Nam", dob: "2010-10-15", role_in_class: "Thành viên", group_name: "Tổ 2", parent_name: "Bác Cường (PH)", parent_phone: "098701188", parent_job: "Lái xe", address: "Số 55 Phố Trần Phú, Hà Nội", family_background: "Thích đá bóng, hay thức khuya xem thể thao.", private_notes: "Thường xuyên đi muộn đầu giờ sáng (đã nhắc nhở 3 lần).", is_flagged_risk: true, risk_reason: "Thường xuyên đi muộn đầu giờ sáng" },
  { id: 12, class_id: 1, full_name: "Trần Thị Trang", gender: "Nữ", dob: "2010-06-03", role_in_class: "Thành viên", group_name: "Tổ 2", parent_name: "Bác Trang (PH)", parent_phone: "098701288", parent_job: "Lao động tự do", address: "Số 88 Phố Trần Phú, Hà Nội", family_background: "Gia đình cận nghèo, mẹ bị ốm.", private_notes: "Chăm học nhưng hay tự ti, diện chính sách hỗ trợ chi phí.", is_flagged_risk: true, risk_reason: "Gia đình cận nghèo, cần hỗ trợ học bổng" },
  { id: 13, class_id: 1, full_name: "Lê Minh Tuấn", gender: "Nam", dob: "2010-01-14", role_in_class: "Tổ trưởng Tổ 3", group_name: "Tổ 3", parent_name: "Bác Tuấn (PH)", parent_phone: "098701388", parent_job: "Công chức", address: "Số 19 Phố Trần Phú, Hà Nội", family_background: "Năng động, chơi ghita giỏi.", private_notes: "Hăng hái phát biểu xây dựng bài.", is_flagged_risk: false, risk_reason: "" },
  { id: 14, class_id: 1, full_name: "Phạm Bảo Vy", gender: "Nữ", dob: "2010-08-29", role_in_class: "Tổ phó Tổ 3", group_name: "Tổ 3", parent_name: "Bác Vy (PH)", parent_phone: "098701488", parent_job: "Kinh doanh", address: "Số 71 Phố Trần Phú, Hà Nội", family_background: "Thích Ngoại ngữ, thành viên CLB Tiếng Anh.", private_notes: "Giao tiếp tự tin, phong thái chững chạc.", is_flagged_risk: false, risk_reason: "" },
  { id: 15, class_id: 1, full_name: "Hoàng Quốc Dũng", gender: "Nam", dob: "2010-12-20", role_in_class: "Thành viên", group_name: "Tổ 3", parent_name: "Bác Dũng (PH)", parent_phone: "098701588", parent_job: "Tự do", address: "Số 33 Phố Trần Phú, Hà Nội", family_background: "Thích chơi game online, tính tình bốc đồng.", private_notes: "Hay nói chuyện riêng trong giờ, đã làm cam kết với lớp.", is_flagged_risk: true, risk_reason: "Thường mất tập trung, nói chuyện riêng" },
  { id: 16, class_id: 1, full_name: "Vũ Khánh Hà", gender: "Nữ", dob: "2010-05-09", role_in_class: "Thành viên", group_name: "Tổ 3", parent_name: "Bác Hà (PH)", parent_phone: "098701688", parent_job: "Giáo viên", address: "Số 62 Phố Trần Phú, Hà Nội", family_background: "Bố mẹ làm giáo viên. Học giỏi Ngữ văn.", private_notes: "Có tinh thần giúp đỡ bạn bè yếu hơn.", is_flagged_risk: false, risk_reason: "" },
  { id: 17, class_id: 1, full_name: "Đặng Minh An", gender: "Nam", dob: "2010-03-01", role_in_class: "Tổ trưởng Tổ 4", group_name: "Tổ 4", parent_name: "Bác An (PH)", parent_phone: "098701788", parent_job: "Kỹ sư", address: "Số 95 Phố Trần Phú, Hà Nội", family_background: "Tính tình điềm đạm, có trách nhiệm.", private_notes: "Quản lý tổ tốt, gương mẫu trong học tập.", is_flagged_risk: false, risk_reason: "" },
  { id: 18, class_id: 1, full_name: "Bùi Thanh Lan", gender: "Nữ", dob: "2010-11-23", role_in_class: "Tổ phó Tổ 4", group_name: "Tổ 4", parent_name: "Bác Lan (PH)", parent_phone: "098701888", parent_job: "Nhân viên y tế", address: "Số 20 Phố Trần Phú, Hà Nội", family_background: "Thích sinh học, tham gia bảo vệ môi trường.", private_notes: "Tích cực trong các buổi lao động trực nhật.", is_flagged_risk: false, risk_reason: "" },
  { id: 19, class_id: 1, full_name: "Đỗ Hữu Hải", gender: "Nam", dob: "2010-07-17", role_in_class: "Cán sự Thể dục", group_name: "Tổ 4", parent_name: "Bác Hải (PH)", parent_phone: "098701988", parent_job: "Kinh doanh", address: "Số 48 Phố Trần Phú, Hà Nội", family_background: "Đội tuyển bóng đá trường.", private_notes: "Sức khỏe tốt, dẫn dắt các hoạt động thể thao xuất sắc.", is_flagged_risk: false, risk_reason: "" },
  { id: 20, class_id: 1, full_name: "Ngô Ngọc Ánh", gender: "Nữ", dob: "2010-09-04", role_in_class: "Thủ quỹ lớp", group_name: "Tổ 4", parent_name: "Bác Ánh (PH)", parent_phone: "098702088", parent_job: "Kế toán", address: "Số 77 Phố Trần Phú, Hà Nội", family_background: "Cẩn thận, tỉ mỉ, trung thực.", private_notes: "Ghi chép sổ sách thu chi rõ ràng, minh bạch.", is_flagged_risk: false, risk_reason: "" },
  { id: 21, class_id: 1, full_name: "Nguyễn Văn Bình", gender: "Nam", dob: "2010-02-14", role_in_class: "Thành viên", group_name: "Tổ 1", parent_name: "Bác Bình (PH)", parent_phone: "098702188", parent_job: "Công chức", address: "Số 102 Phố Trần Phú, Hà Nội", family_background: "Nhà cách trường 2km. Thích âm nhạc.", private_notes: "Ngoan ngoãn, hòa đồng với bạn bè.", is_flagged_risk: false, risk_reason: "" },
  { id: 22, class_id: 1, full_name: "Trần Minh Long", gender: "Nam", dob: "2010-06-25", role_in_class: "Thành viên", group_name: "Tổ 2", parent_name: "Bác Long (PH)", parent_phone: "098702288", parent_job: "Bác sĩ", address: "Số 13 Phố Trần Phú, Hà Nội", family_background: "Thích học Lịch sử và Địa lý.", private_notes: "Chăm chỉ ghi chép bài đầy đủ.", is_flagged_risk: false, risk_reason: "" },
  { id: 23, class_id: 1, full_name: "Lê Thanh Hằng", gender: "Nữ", dob: "2010-10-11", role_in_class: "Thành viên", group_name: "Tổ 3", parent_name: "Bác Hằng (PH)", parent_phone: "098702388", parent_job: "Kinh doanh", address: "Số 26 Phố Trần Phú, Hà Nội", family_background: "Thích làm bánh và thủ công.", private_notes: "Ít nói nhưng luôn hoàn thành nhiệm vụ được giao.", is_flagged_risk: false, risk_reason: "" },
  { id: 24, class_id: 1, full_name: "Phạm Gia Huy", gender: "Nam", dob: "2010-04-05", role_in_class: "Thành viên", group_name: "Tổ 4", parent_name: "Bác Huy (PH)", parent_phone: "098702488", parent_job: "Kỹ sư", address: "Số 58 Phố Trần Phú, Hà Nội", family_background: "Thích khám phá khoa học kỹ thuật.", private_notes: "Sáng tạo, có nhiều ý tưởng cho dự án STEM.", is_flagged_risk: false, risk_reason: "" },
  { id: 25, class_id: 1, full_name: "Hoàng Diệu Linh", gender: "Nữ", dob: "2010-08-16", role_in_class: "Thành viên", group_name: "Tổ 1", parent_name: "Bác Linh (PH)", parent_phone: "098702588", parent_job: "Giáo viên", address: "Số 81 Phố Trần Phú, Hà Nội", family_background: "Thích đọc sách văn học cổ điển.", private_notes: "Ý thức tự giác cao, nề nếp tốt.", is_flagged_risk: false, risk_reason: "" },
  { id: 26, class_id: 1, full_name: "Vũ Tuấn Kiệt", gender: "Nam", dob: "2010-12-03", role_in_class: "Thành viên", group_name: "Tổ 2", parent_name: "Bác Kiệt (PH)", parent_phone: "098702688", parent_job: "Lao động tự do", address: "Số 99 Phố Trần Phú, Hà Nội", family_background: "Thích chơi cầu lông.", private_notes: "Vui tính, hay pha trò giúp lớp vui vẻ.", is_flagged_risk: false, risk_reason: "" },
  { id: 27, class_id: 1, full_name: "Đặng Thảo Nguyên", gender: "Nữ", dob: "2010-01-28", role_in_class: "Thành viên", group_name: "Tổ 3", parent_name: "Bác Nguyên (PH)", parent_phone: "098702788", parent_job: "Họa sĩ", address: "Số 34 Phố Trần Phú, Hà Nội", family_background: "Thích hội họa và thiết kế.", private_notes: "Phụ trách làm báo tường và trang trí lớp.", is_flagged_risk: false, risk_reason: "" },
  { id: 28, class_id: 1, full_name: "Bùi Quốc Việt", gender: "Nam", dob: "2010-05-21", role_in_class: "Thành viên", group_name: "Tổ 4", parent_name: "Bác Việt (PH)", parent_phone: "098702888", parent_job: "Kinh doanh", address: "Số 66 Phố Trần Phú, Hà Nội", family_background: "Nhà xa trường 8km.", private_notes: "Đôi khi đi học sát giờ do kẹt xe cầu vượt.", is_flagged_risk: false, risk_reason: "" },
  { id: 29, class_id: 1, full_name: "Đỗ Quỳnh Chi", gender: "Nữ", dob: "2010-09-14", role_in_class: "Thành viên", group_name: "Tổ 1", parent_name: "Bác Chi (PH)", parent_phone: "098702988", parent_job: "Công chức", address: "Số 112 Phố Trần Phú, Hà Nội", family_background: "Thích ngoại ngữ và du lịch.", private_notes: "Học đều các môn, hòa nhã.", is_flagged_risk: false, risk_reason: "" },
  { id: 30, class_id: 1, full_name: "Ngô Quang Sáng", gender: "Nam", dob: "2010-03-07", role_in_class: "Thành viên", group_name: "Tổ 2", parent_name: "Bác Sáng (PH)", parent_phone: "098703088", parent_job: "Lập trình viên", address: "Số 25 Phố Trần Phú, Hà Nội", family_background: "Đam mê lập trình máy tính.", private_notes: "Đã đạt giải Ba Tin học trẻ cấp thành phố.", is_flagged_risk: false, risk_reason: "" },
  { id: 31, class_id: 1, full_name: "Nguyễn Thùy Dương", gender: "Nữ", dob: "2010-07-12", role_in_class: "Thành viên", group_name: "Tổ 3", parent_name: "Bác Dương (PH)", parent_phone: "098703188", parent_job: "Kinh doanh", address: "Số 49 Phố Trần Phú, Hà Nội", family_background: "Gia đình kinh doanh hoa quả.", private_notes: "Chăm chỉ, tích cực tham gia phong trào.", is_flagged_risk: false, risk_reason: "" },
  { id: 32, class_id: 1, full_name: "Trần Nhật Minh", gender: "Nam", dob: "2010-11-18", role_in_class: "Thành viên", group_name: "Tổ 4", parent_name: "Bác Minh (PH)", parent_phone: "098703288", parent_job: "Công chức", address: "Số 73 Phố Trần Phú, Hà Nội", family_background: "Thích chơi cờ tướng.", private_notes: "Trầm tính, tập trung cao trong giờ học.", is_flagged_risk: false, risk_reason: "" },
  { id: 33, class_id: 1, full_name: "Lê Thu Thảo", gender: "Nữ", dob: "2010-02-09", role_in_class: "Thành viên", group_name: "Tổ 1", parent_name: "Bác Thảo (PH)", parent_phone: "098703388", parent_job: "Dược sĩ", address: "Số 87 Phố Trần Phú, Hà Nội", family_background: "Thích khiêu vũ thể thao.", private_notes: "Nhanh nhẹn, hoạt bát, dễ gần.", is_flagged_risk: false, risk_reason: "" },
  { id: 34, class_id: 1, full_name: "Phạm Đức Thịnh", gender: "Nam", dob: "2010-06-15", role_in_class: "Thành viên", group_name: "Tổ 2", parent_name: "Bác Thịnh (PH)", parent_phone: "098703488", parent_job: "Kỹ sư Hóa", address: "Số 106 Phố Trần Phú, Hà Nội", family_background: "Thích học Hóa học.", private_notes: "Chăm chú nghe giảng, có sổ tay tóm tắt bài tốt.", is_flagged_risk: false, risk_reason: "" },
  { id: 35, class_id: 1, full_name: "Hoàng Kim Ngân", gender: "Nữ", dob: "2010-10-24", role_in_class: "Thành viên", group_name: "Tổ 3", parent_name: "Bác Ngân (PH)", parent_phone: "098703588", parent_job: "Nhân viên văn phòng", address: "Số 31 Phố Trần Phú, Hà Nội", family_background: "Thích đọc truyện tranh và vẽ chibi.", private_notes: "Hòa đồng, luôn vui vẻ.", is_flagged_risk: false, risk_reason: "" },
  { id: 36, class_id: 1, full_name: "Vũ Trọng Nghĩa", gender: "Nam", dob: "2010-04-16", role_in_class: "Thành viên", group_name: "Tổ 4", parent_name: "Bác Nghĩa (PH)", parent_phone: "098703688", parent_job: "Kinh doanh", address: "Số 53 Phố Trần Phú, Hà Nội", family_background: "Thích thể thao, bơi lội.", private_notes: "Thể lực tốt, nhiệt tình khi khiêng vác bàn ghế.", is_flagged_risk: false, risk_reason: "" },
  { id: 37, class_id: 1, full_name: "Đặng Yến Nhi", gender: "Nữ", dob: "2010-08-07", role_in_class: "Thành viên", group_name: "Tổ 1", parent_name: "Bác Nhi (PH)", parent_phone: "098703788", parent_job: "Giáo viên", address: "Số 94 Phố Trần Phú, Hà Nội", family_background: "Thích học môn Sinh và Môi trường.", private_notes: "Cẩn thận, giữ vệ sinh chỗ ngồi rất sạch.", is_flagged_risk: false, risk_reason: "" },
  { id: 38, class_id: 1, full_name: "Bùi Văn Quyết", gender: "Nam", dob: "2010-12-11", role_in_class: "Thành viên", group_name: "Tổ 2", parent_name: "Bác Quyết (PH)", parent_phone: "098703888", parent_job: "Tự do", address: "Số 17 Phố Trần Phú, Hà Nội", family_background: "Nhà gần chợ. Chăm phụ giúp bố mẹ.", private_notes: "Cần rèn thêm kỹ năng làm việc nhóm.", is_flagged_risk: false, risk_reason: "" },
  { id: 39, class_id: 1, full_name: "Đỗ Mỹ Duyên", gender: "Nữ", dob: "2010-03-27", role_in_class: "Thành viên", group_name: "Tổ 3", parent_name: "Bác Duyên (PH)", parent_phone: "098703988", parent_job: "Kinh doanh", address: "Số 69 Phố Trần Phú, Hà Nội", family_background: "Thích ca hát, tham gia đội văn nghệ.", private_notes: "Giọng hát hay, mang lại năng lượng tích cực cho lớp.", is_flagged_risk: false, risk_reason: "" },
  { id: 40, class_id: 1, full_name: "Ngô Tấn Tài", gender: "Nam", dob: "2010-09-02", role_in_class: "Thành viên", group_name: "Tổ 4", parent_name: "Bác Tài (PH)", parent_phone: "098704088", parent_job: "Kỹ sư", address: "Số 120 Phố Trần Phú, Hà Nội", family_background: "Thích nghiên cứu vật lý thiên văn.", private_notes: "Ham học hỏi, hay đặt các câu hỏi hay cho giáo viên.", is_flagged_risk: false, risk_reason: "" }
];

// Danh sách lớp
export function getLocalClasses() {
  const saved = localStorage.getItem('scn_classes');
  if (saved) {
    try { return JSON.parse(saved); } catch (e) {}
  }
  localStorage.setItem('scn_classes', JSON.stringify(DEFAULT_CLASSES));
  return DEFAULT_CLASSES;
}

export function saveLocalClasses(classes) {
  localStorage.setItem('scn_classes', JSON.stringify(classes));
}

// Lớp đang chọn
export function getCurrentClassId() {
  const val = localStorage.getItem('scn_current_class_id');
  return val ? Number(val) : 1;
}

export function setCurrentClassId(classId) {
  localStorage.setItem('scn_current_class_id', String(classId));
}

// Lấy danh sách học sinh theo lớp
export function getLocalStudents(classId = null) {
  const targetClassId = classId || getCurrentClassId();
  const key = `scn_students_class_${targetClassId}`;
  const saved = localStorage.getItem(key);
  if (saved) {
    try { return JSON.parse(saved); } catch (e) {}
  }

  // Nếu là lớp 10A1 (class_id=1) và chưa có, nạp 40 em mẫu
  if (targetClassId === 1) {
    localStorage.setItem(key, JSON.stringify(INITIAL_STUDENTS_10A1));
    return INITIAL_STUDENTS_10A1;
  }

  // Các lớp khác mặc định rỗng để GV nạp
  return [];
}

export function saveLocalStudents(list, classId = null) {
  const targetClassId = classId || getCurrentClassId();
  const key = `scn_students_class_${targetClassId}`;
  localStorage.setItem(key, JSON.stringify(list));
}

// Nạp lại 40 học sinh mẫu cho lớp hiện tại
export function seedSampleStudents(classId = null) {
  const targetClassId = classId || getCurrentClassId();
  const classes = getLocalClasses();
  const cls = classes.find((c) => c.id === targetClassId) || { name: '10A1' };

  const seeded = INITIAL_STUDENTS_10A1.map((s) => ({
    ...s,
    id: Date.now() + Math.floor(Math.random() * 100000),
    class_id: targetClassId,
  }));

  saveLocalStudents(seeded, targetClassId);
  return seeded;
}

// Xóa trắng học sinh lớp hiện tại
export function clearClassStudents(classId = null) {
  const targetClassId = classId || getCurrentClassId();
  saveLocalStudents([], targetClassId);
}

// Điểm danh theo lớp
export function getLocalAttendance(dateStr, session, classId = null) {
  const targetClassId = classId || getCurrentClassId();
  const key = `scn_att_${targetClassId}_${dateStr}_${session}`;
  const saved = localStorage.getItem(key);
  if (saved) {
    try { return JSON.parse(saved); } catch (e) {}
  }

  const students = getLocalStudents(targetClassId);
  const att = students.map((s) => {
    let status = 'C';
    let reason = '';
    let minutes_late = 0;

    if (s.full_name.includes('Cường')) {
      status = 'M';
      reason = 'Hỏng xe giữa đường';
      minutes_late = 15;
    } else if (s.full_name.includes('Phúc')) {
      status = 'P';
      reason = 'Bà ngoại ốm xin nghỉ';
    }

    return {
      student_id: s.id,
      student_name: s.full_name,
      group_name: s.group_name,
      date: dateStr,
      session,
      status,
      reason,
      minutes_late,
    };
  });

  localStorage.setItem(key, JSON.stringify(att));
  return att;
}

export function saveLocalAttendance(dateStr, session, records, classId = null) {
  const targetClassId = classId || getCurrentClassId();
  const key = `scn_att_${targetClassId}_${dateStr}_${session}`;
  const students = getLocalStudents(targetClassId);
  const sMap = Object.fromEntries(students.map((s) => [s.id, s]));

  const fullRecords = records.map((r) => ({
    student_id: r.student_id,
    student_name: sMap[r.student_id]?.full_name || '',
    group_name: sMap[r.student_id]?.group_name || '',
    date: dateStr,
    session,
    status: r.status,
    reason: r.reason || '',
    minutes_late: r.minutes_late || 0,
  }));

  localStorage.setItem(key, JSON.stringify(fullRecords));
  return { ok: true, count: fullRecords.length };
}
