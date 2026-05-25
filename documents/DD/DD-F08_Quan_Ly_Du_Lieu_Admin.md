# DD-F08 - Thiết Kế Quản Lý Dữ Liệu Admin

## Mục Tiêu Thiết Kế

Khu vực admin cần cho phép quản lý dữ liệu trạm xe và tuyến xe. Các thao tác thêm, sửa, xóa phải được bảo vệ bằng phân quyền admin để tránh người dùng thường thay đổi dữ liệu hệ thống.

## Thành Phần Chức Năng

Feature quản lý dữ liệu gồm hai nhóm chính:

- Quản lý trạm xe.
- Quản lý tuyến xe.

Với trạm xe, admin cần xem danh sách, tìm kiếm, thêm mới, chỉnh sửa và xóa. Với tuyến xe, admin cần xem danh sách tuyến, chỉnh sửa thông tin tuyến và quản lý các trạm thuộc tuyến.

## Luồng Xử Lý Chung

1. Admin đăng nhập vào hệ thống.
2. Frontend kiểm tra quyền admin.
3. Admin mở trang quản lý trạm hoặc tuyến.
4. Frontend gọi API lấy danh sách dữ liệu.
5. Admin thực hiện thao tác thêm, sửa hoặc xóa.
6. Frontend gửi request đến backend.
7. Backend kiểm tra `IsAdminUser`.
8. Backend cập nhật dữ liệu trong database.
9. Frontend cập nhật lại danh sách hiển thị.

## Thiết Kế API

Các API quản lý được tổ chức theo dạng REST, phù hợp với các thao tác CRUD:

- `GET`: lấy danh sách hoặc chi tiết dữ liệu.
- `POST`: thêm dữ liệu mới.
- `PUT/PATCH`: chỉnh sửa dữ liệu.
- `DELETE`: xóa dữ liệu.

Việc dùng REST giúp frontend gọi API rõ ràng và dễ mở rộng.

## Kiểm Soát Quyền

Backend dùng `IsAdminUser` cho các viewset quản lý. Điều này đảm bảo chỉ tài khoản admin mới có thể thao tác dữ liệu. Nếu người dùng chưa đăng nhập hoặc không có quyền admin, backend sẽ trả lỗi xác thực hoặc lỗi không đủ quyền.

## File Code Liên Quan

- `backend/routes/views.py`: `BusStopViewSet`, `BusRouteViewSet`.
- `backend/routes/urls.py`: route API quản lý.
- `backend/routes/serializers.py`: serializer cho dữ liệu trạm và tuyến.
- `frontend/src/services/manageApi.ts`: service gọi API quản lý.
- `frontend/src/pages/manage/StopList.tsx`: danh sách và tìm kiếm trạm.
- `frontend/src/pages/manage/StopForm.tsx`: form thêm/sửa trạm.
- `frontend/src/pages/manage/RouteList.tsx`: danh sách và tìm kiếm tuyến.
- `frontend/src/pages/manage/RouteForm.tsx`: form thêm/sửa tuyến.
- `frontend/src/pages/manage/RouteDetail.tsx`: chi tiết tuyến và quản lý trạm thuộc tuyến.

## Gợi Ý Ảnh Code

- Ảnh viewset quản lý có `IsAdminUser`.
- Ảnh service gọi API quản lý.
- Ảnh giao diện danh sách trạm.
- Ảnh form thêm/sửa trạm hoặc tuyến.

## Lưu Ý Khi Viết Báo Cáo

Không cần đưa quá nhiều ảnh code cho phần này. Nên ưu tiên ảnh giao diện quản lý, vì đây là feature người dùng admin thao tác trực tiếp. Ảnh code chỉ cần một ảnh nhỏ thể hiện API được bảo vệ bằng quyền admin.
