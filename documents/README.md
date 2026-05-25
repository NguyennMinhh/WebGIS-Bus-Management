# Tài Liệu Dự Án WebGIS BusRouting

Thư mục này chứa tài liệu phục vụ báo cáo và giải thích thiết kế của project WebGIS BusRouting. Tài liệu được chia theo **feature**, không chia theo frontend/backend, để dễ đọc và dễ copy nội dung vào báo cáo.

## Cách Hiểu Nhanh

Mỗi feature có hai file:

- `FD`: mô tả chức năng theo góc nhìn người dùng. Phần này dùng tốt khi viết báo cáo.
- `DD`: mô tả cách hệ thống xử lý kỹ thuật. Phần này dùng khi cần giải thích code, API, database hoặc luồng xử lý.

Ví dụ:

- `FD/FD-F04_Tim_Tuyen_Xe_Buyt.md`: mô tả chức năng tìm tuyến xe buýt.
- `DD/DD-F04_Tim_Tuyen_Xe_Buyt.md`: mô tả API, truy vấn và dữ liệu của chức năng tìm tuyến.

## Danh Sách Feature

| Mã | Feature | FD | DD |
| --- | --- | --- | --- |
| F01 | Thu thập, import và tổ chức dữ liệu xe buýt | `FD-F01_Du_Lieu_Xe_Buyt.md` | `DD-F01_Du_Lieu_Xe_Buyt.md` |
| F02 | Hiển thị bản đồ và lớp WMS | `FD-F02_Ban_Do_WMS.md` | `DD-F02_Ban_Do_WMS.md` |
| F03 | Chọn điểm đi, điểm đến và tạo buffer | `FD-F03_Chon_Diem_Buffer.md` | `DD-F03_Chon_Diem_Buffer.md` |
| F04 | Tìm tuyến xe buýt có thể đi | `FD-F04_Tim_Tuyen_Xe_Buyt.md` | `DD-F04_Tim_Tuyen_Xe_Buyt.md` |
| F05 | Hiển thị hành trình đi bộ và đi xe buýt | `FD-F05_Hien_Thi_Hanh_Trinh.md` | `DD-F05_Hien_Thi_Hanh_Trinh.md` |
| F06 | Tìm kiếm địa điểm bằng Goong API | `FD-F06_Tim_Kiem_Goong.md` | `DD-F06_Tim_Kiem_Goong.md` |
| F07 | Đăng ký, đăng nhập, đăng xuất và phân quyền | `FD-F07_Tai_Khoan_Phan_Quyen.md` | `DD-F07_Tai_Khoan_Phan_Quyen.md` |
| F08 | Quản lý trạm xe và tuyến xe dành cho admin | `FD-F08_Quan_Ly_Du_Lieu_Admin.md` | `DD-F08_Quan_Ly_Du_Lieu_Admin.md` |
| F09 | Kết quả đạt được và hướng phát triển | `FD-F09_Ket_Luan_Huong_Phat_Trien.md` | `DD-F09_Chay_Project.md` |

## Thứ Tự Đọc Đề Xuất

Nếu đang viết báo cáo, nên đọc theo thứ tự:

1. `FD-F01` đến `FD-F09` để lấy nội dung mô tả chức năng.
2. Mở file `DD` tương ứng khi cần giải thích sâu hơn về code hoặc xử lý kỹ thuật.
3. Dùng phần "Ảnh nên chèn" trong từng file để biết cần chụp ảnh giao diện, ảnh code hoặc ảnh dữ liệu nào.

```text
documents/
├─ FD/  # mô tả chức năng theo từng feature
└─ DD/  # mô tả thiết kế xử lý theo từng feature
```

## Ảnh Trong README

README chính chỉ giữ một số ảnh đại diện để tránh nặng và rối:

- `assets/readme/webgis-main.jpg`: giao diện chính.
- `assets/readme/route-results.jpg`: kết quả tìm tuyến.
- `assets/readme/journey-display.jpg`: hành trình đi bộ và xe buýt.
- `assets/readme/user-flow.jpg`: sơ đồ luồng người dùng.
- `assets/readme/admin-flow.jpg`: sơ đồ luồng admin.

Các ảnh chi tiết khác nên để trong báo cáo Word hoặc chèn trực tiếp vào từng mục báo cáo khi cần.

## Ghi Chú

- Tài liệu này chỉ mô tả hệ thống, không thay đổi logic source code.
- Khi cần viết nội dung báo cáo, ưu tiên đọc file `FD`.
- Khi cần giải thích code hoặc thiết kế xử lý, đọc file `DD`.
- Các file tài liệu cũ theo kiểu `Backend_Design`, `Frontend_Design`, `GIS_Spatial_Design` đã được thay bằng cách chia theo feature để tránh trùng lặp.
