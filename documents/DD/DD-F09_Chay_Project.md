# DD-F09 - Chạy Project Và Ghi Chú Phát Triển

## Mục Đích

File này ghi lại cách chạy project local, tạo tài khoản admin và một số lỗi thường gặp. Nội dung này phù hợp để dùng trong phần phụ lục hoặc tài liệu bàn giao project.

## Thành Phần Cần Chạy

Project gồm các thành phần chính:

- Backend Django chạy API.
- Frontend React/Vite chạy giao diện WebGIS.
- PostgreSQL/PostGIS lưu dữ liệu không gian.
- GeoServer publish WMS.

Khi demo project, cần đảm bảo database và GeoServer đã sẵn sàng trước khi kiểm tra các chức năng bản đồ và tìm tuyến.

## Chạy Backend

Từ thư mục gốc project:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

Backend chạy mặc định tại:

```text
http://localhost:8000
```

## Chạy Frontend

Từ thư mục gốc project:

```powershell
cd frontend
npm install
npm run dev
```

Frontend chạy mặc định tại:

```text
http://localhost:5173
```

## Tạo Tài Khoản Admin

Trong thư mục `backend`, chạy:

```powershell
python manage.py createsuperuser
```

Sau đó đăng nhập bằng tài khoản vừa tạo. Tài khoản superuser có quyền admin và có thể truy cập khu vực quản lý.

## Cấu Hình Môi Trường Cần Kiểm Tra

Frontend cần biết URL backend:

```text
VITE_API_URL=http://localhost:8000/api
```

Backend cần kết nối đúng PostgreSQL/PostGIS và có cấu hình Goong API nếu sử dụng tìm kiếm địa điểm.

GeoServer cần có workspace/layer tương ứng với dữ liệu tuyến và trạm. Nếu GeoServer chưa chạy hoặc layer chưa publish, bản đồ nền vẫn có thể hiển thị nhưng lớp xe buýt sẽ không xuất hiện.

## Lỗi Thường Gặp

Nếu backend báo thiếu Django, thường là do chưa cài dependencies trong môi trường ảo:

```powershell
.\.venv\Scripts\activate
pip install -r requirements.txt
```

Nếu frontend không gọi được backend, kiểm tra:

- Backend đã chạy chưa.
- `VITE_API_URL` có đúng không.
- CORS/session/cookie có được cấu hình đúng không.

Nếu không thấy dữ liệu WMS, kiểm tra:

- GeoServer đã chạy chưa.
- Layer đã publish chưa.
- URL WMS trong frontend đã đúng chưa.
- Dữ liệu trong PostGIS có tồn tại không.

## Ghi Chú Phát Triển

- Khi sửa dữ liệu không gian, nên kiểm tra lại bằng QGIS hoặc pgAdmin.
- Khi thay đổi model Django, cần tạo migration và chạy migrate.
- Khi thêm API mới, nên cập nhật serializer, view và service phía frontend.
- Khi sửa chức năng tìm tuyến, cần kiểm tra kỹ dữ liệu `sequence` trong bảng quan hệ tuyến-trạm.
- Khi sửa phân quyền admin, cần kiểm tra cả frontend route và backend permission.

## Lưu Ý Khi Viết Báo Cáo

Phần này không cần đưa quá sâu vào chương chức năng chính. Có thể dùng làm tài liệu chạy project hoặc phụ lục, vì nó thiên về vận hành hơn là mô tả nghiệp vụ.
