# FD-F07 - Đăng Ký, Đăng Nhập, Đăng Xuất Và Phân Quyền

## Mục Đích

Feature này quản lý tài khoản người dùng và phân quyền truy cập trong hệ thống. Người dùng thường có thể sử dụng các chức năng tra cứu tuyến, còn admin có thêm quyền quản lý dữ liệu trạm xe và tuyến xe.

## Phạm Vi Chức Năng

Hệ thống hỗ trợ đăng ký tài khoản, đăng nhập, đăng xuất và kiểm tra trạng thái người dùng hiện tại. Sau khi đăng nhập, giao diện có thể biết người dùng đang dùng hệ thống với vai trò user thường hay admin.

Hệ thống phân biệt hai nhóm người dùng:

- Người dùng thường: xem bản đồ, tìm kiếm địa điểm, chọn điểm đi/điểm đến, tìm tuyến và xem hành trình.
- Admin: có toàn bộ chức năng của người dùng thường và được truy cập thêm khu vực quản lý dữ liệu.

## Luồng Người Dùng

1. Người dùng đăng ký tài khoản mới nếu chưa có tài khoản.
2. Người dùng đăng nhập bằng tài khoản đã tạo.
3. Hệ thống kiểm tra thông tin tài khoản.
4. Nếu đăng nhập thành công, giao diện cập nhật trạng thái người dùng.
5. Nếu tài khoản có quyền admin, người dùng có thể vào khu vực quản lý.
6. Người dùng có thể đăng xuất để kết thúc phiên làm việc.

## Kết Quả Đạt Được

Hệ thống đã có luồng tài khoản cơ bản và phân quyền giữa user thường với admin. Việc phân quyền giúp bảo vệ dữ liệu quản lý, tránh để người dùng thường thêm, sửa hoặc xóa dữ liệu tuyến và trạm.

## Vai Trò Trong Hệ Thống

Feature tài khoản và phân quyền là lớp bảo vệ cho các chức năng quản trị. Nếu không có phân quyền, khu vực quản lý dữ liệu có thể bị truy cập bởi người dùng không phù hợp.

## Ảnh Nên Chèn Vào Báo Cáo

- Ảnh giao diện đăng ký.
- Ảnh giao diện đăng nhập.
- Ảnh giao diện sau khi đăng nhập.
- Ảnh khu vực quản lý chỉ dành cho admin.

## Ghi Chú

Nên trình bày rõ phân quyền được kiểm tra ở cả giao diện và backend. Frontend giúp ẩn hoặc chặn trang quản lý, còn backend mới là nơi kiểm tra quyền trước khi cho phép thay đổi dữ liệu.
