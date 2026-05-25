# DD-F07 - Thiết Kế Tài Khoản Và Phân Quyền

## Mục Tiêu Thiết Kế

Hệ thống cần có cơ chế xác thực người dùng và phân quyền giữa user thường với admin. User thường sử dụng chức năng tra cứu, còn admin được phép truy cập khu vực quản lý dữ liệu.

## Nhóm Chức Năng Xác Thực

Các API xác thực phục vụ:

- Đăng ký tài khoản.
- Đăng nhập.
- Lấy thông tin người dùng hiện tại.
- Đăng xuất.

Sau khi đăng nhập, frontend lưu trạng thái người dùng trong `AuthProvider` để các component khác biết người dùng đã đăng nhập hay chưa và có phải admin hay không.

## Cơ Chế Phân Quyền

Backend dùng quyền của Django/DRF để kiểm tra quyền truy cập. Tài khoản admin được xác định thông qua quyền staff. Các API quản lý dữ liệu dùng `IsAdminUser`, nghĩa là chỉ tài khoản admin mới được phép gọi.

Frontend cũng có lớp kiểm tra quyền để điều hướng giao diện. Nếu người dùng không phải admin, trang quản lý sẽ không được hiển thị hoặc sẽ bị chặn truy cập. Tuy nhiên, kiểm tra ở frontend chỉ hỗ trợ trải nghiệm người dùng; kiểm tra chính vẫn phải nằm ở backend.

## Luồng Đăng Nhập

1. Người dùng nhập thông tin đăng nhập.
2. Frontend gửi request đến backend.
3. Backend xác thực tài khoản.
4. Nếu hợp lệ, backend tạo phiên đăng nhập.
5. Backend trả về thông tin người dùng hiện tại.
6. Frontend lưu thông tin này vào `AuthProvider`.
7. Giao diện cập nhật theo vai trò user/admin.

## Luồng Truy Cập Trang Admin

1. Người dùng truy cập đường dẫn quản lý.
2. Frontend kiểm tra trạng thái đăng nhập.
3. Frontend kiểm tra user có quyền admin hay không.
4. Nếu không đủ quyền, người dùng bị chặn.
5. Nếu đủ quyền, frontend hiển thị trang quản lý.
6. Khi gọi API quản lý, backend tiếp tục kiểm tra `IsAdminUser`.

## File Code Liên Quan

- `backend/routes/auth_serializers.py`: serializer cho đăng ký, đăng nhập và thông tin user.
- `backend/routes/auth_views.py`: API xác thực.
- `backend/routes/views.py`: viewset quản lý dùng `IsAdminUser`.
- `frontend/src/hooks/useAuth.tsx`: tạo `AuthProvider`, lưu trạng thái người dùng và cung cấp hook `useAuth`.
- `frontend/src/components/auth/RequireAdmin.tsx`: bảo vệ route admin.
- `frontend/src/services/authApi.ts`: gọi các API đăng ký, đăng nhập, đăng xuất và lấy thông tin user hiện tại.
- `frontend/src/services/api.ts`: cấu hình request chung, CSRF token và cookie/session.

## Gợi Ý Ảnh Code

- Ảnh serializer hoặc view đăng nhập.
- Ảnh `RequireAdmin`.
- Ảnh viewset có `IsAdminUser`.
- Ảnh giao diện login và trang admin.

## Lưu Ý Khi Viết Báo Cáo

Nên nói rõ hệ thống phân quyền ở hai lớp: frontend để điều hướng giao diện, backend để bảo vệ dữ liệu. Đây là cách giải thích dễ hiểu và đúng với project.
