# FD-F08 - Quản Lý Trạm Xe Và Tuyến Xe Dành Cho Admin

## Mục Đích

Feature này cho phép admin quản lý dữ liệu trạm xe và tuyến xe trực tiếp trên giao diện web. Nhờ đó, dữ liệu có thể được cập nhật trong hệ thống mà không cần chỉnh sửa thủ công trong cơ sở dữ liệu.

## Phạm Vi Chức Năng

Sau khi đăng nhập bằng tài khoản admin, người quản trị có thể truy cập khu vực quản lý. Tại đây, admin có thể xem danh sách trạm xe, tìm kiếm trạm, thêm trạm mới, chỉnh sửa thông tin trạm và xóa trạm không còn cần dùng.

Đối với tuyến xe, admin có thể xem danh sách tuyến, chỉnh sửa thông tin tuyến và cập nhật các trạm thuộc tuyến. Dữ liệu tuyến và trạm có liên quan trực tiếp đến kết quả tìm tuyến, vì vậy khu vực này chỉ dành cho tài khoản có quyền quản trị.

## Luồng Admin

1. Admin đăng nhập vào hệ thống.
2. Admin truy cập khu vực quản lý.
3. Admin chọn quản lý trạm hoặc quản lý tuyến.
4. Hệ thống hiển thị danh sách dữ liệu hiện có.
5. Admin thêm mới, chỉnh sửa hoặc xóa dữ liệu.
6. Hệ thống lưu thay đổi và cập nhật lại danh sách.

## Kết Quả Đạt Được

Hệ thống đã có khu vực quản lý dữ liệu dành riêng cho admin. Các thao tác thêm, sửa, xóa được giới hạn theo quyền, giúp giảm rủi ro người dùng thường làm thay đổi dữ liệu.

Feature này cũng giúp quá trình cập nhật dữ liệu linh hoạt hơn. Khi cần bổ sung hoặc sửa thông tin trạm, tuyến, admin có thể thao tác qua giao diện thay vì phải truy cập trực tiếp vào pgAdmin.

## Vai Trò Trong Hệ Thống

Feature quản lý dữ liệu giúp hệ thống có khả năng duy trì dữ liệu sau khi đã triển khai. Đây là phần quan trọng nếu dữ liệu tuyến hoặc trạm cần được cập nhật theo thời gian.

## Ảnh Nên Chèn Vào Báo Cáo

- Ảnh màn hình quản lý trạm xe.
- Ảnh form thêm hoặc sửa trạm xe.
- Ảnh màn hình quản lý tuyến xe.
- Ảnh thao tác thêm hoặc xóa trạm trong tuyến nếu có.

## Ghi Chú

Không nên chụp quá nhiều ảnh code cho phần này. Với báo cáo, chỉ cần ảnh giao diện quản lý và một ảnh nhỏ phần API hoặc quyền admin là đủ.
