# Tài Liệu Dự Án WebGIS-BusRouting

Thư mục này chứa tài liệu mô tả hệ thống WebGIS tra cứu tuyến xe buýt. Tài liệu được chia theo **feature**, không chia theo frontend/backend, để dễ dùng khi viết báo cáo đồ án.

## Cách Chia Tài Liệu

- `FD/`: Functional Design, mô tả chức năng theo góc nhìn người dùng và nội dung có thể đưa vào báo cáo.
- `DD/`: Design Document, mô tả cách hệ thống xử lý kỹ thuật cho từng chức năng.

Mỗi feature có một file FD và một file DD cùng mã. Ví dụ:

- `FD/FD-F04_Tim_Tuyen_Xe_Buyt.md`: chức năng tìm tuyến xe buýt dùng để viết báo cáo.
- `DD/DD-F04_Tim_Tuyen_Xe_Buyt.md`: thiết kế xử lý, API, truy vấn và dữ liệu liên quan.

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

## Thứ Tự Đọc Nên Dùng

Nếu cần viết báo cáo, đọc các file `FD` trước theo thứ tự F01 đến F09. Khi cần giải thích code, ảnh code hoặc luồng kỹ thuật thì đọc file `DD` tương ứng.

## Ghi Chú

- Tài liệu này chỉ mô tả hệ thống, không thay đổi logic source code.
- Các file cũ kiểu `Backend_Design`, `Frontend_Design`, `GIS_Spatial_Design` đã được thay bằng tài liệu theo feature để tránh trùng lặp và dễ đọc hơn.
