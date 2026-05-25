# DD-F04 - Thiết Kế Tìm Tuyến Xe Buýt

## Mục Tiêu Thiết Kế

Feature tìm tuyến cần nhận tọa độ điểm đi, tọa độ điểm đến và bán kính buffer, sau đó trả về danh sách các tuyến xe buýt có thể đi trực tiếp. Kết quả phải đủ thông tin để người dùng biết nên lên xe ở đâu, xuống xe ở đâu và đi qua bao nhiêu trạm.

## API Sử Dụng

Frontend gọi API:

```text
GET /api/find-route/?from_lat=...&from_lng=...&to_lat=...&to_lng=...&buffer=...
```

Các tham số:

- `from_lat`, `from_lng`: tọa độ điểm đi.
- `to_lat`, `to_lng`: tọa độ điểm đến.
- `buffer`: bán kính tìm kiếm trạm gần điểm đi và điểm đến.

## Luồng Xử Lý Tổng Quát

1. Frontend kiểm tra đã có đủ điểm đi và điểm đến.
2. Frontend gửi tọa độ và bán kính buffer lên backend.
3. Backend đọc tham số và kiểm tra dữ liệu hợp lệ.
4. Backend tạo hai điểm không gian từ tọa độ người dùng.
5. Backend tìm các trạm nằm gần điểm đi.
6. Backend tìm các trạm nằm gần điểm đến.
7. Backend tìm tuyến có thể đi từ nhóm trạm gần điểm đi đến nhóm trạm gần điểm đến.
8. Backend tạo kết quả chi tiết cho từng phương án.
9. Frontend hiển thị danh sách tuyến.

## Tìm Trạm Gần Điểm Đi Và Điểm Đến

Backend dùng tọa độ người dùng chọn để tạo hai điểm không gian. Từ hai điểm này, hệ thống tìm các trạm xe buýt nằm trong bán kính buffer. Kết quả là hai nhóm trạm:

- Nhóm trạm gần điểm đi.
- Nhóm trạm gần điểm đến.

Hai nhóm trạm này là đầu vào cho bước tìm tuyến. Nếu một trong hai nhóm không có trạm nào, hệ thống không thể đề xuất tuyến phù hợp.

## Tìm Tuyến Theo Thứ Tự Trạm

Sau khi có hai nhóm trạm, hệ thống kiểm tra bảng quan hệ tuyến-trạm. Một tuyến được xem là phù hợp khi:

- Tuyến đó có ít nhất một trạm thuộc nhóm trạm gần điểm đi.
- Tuyến đó có ít nhất một trạm thuộc nhóm trạm gần điểm đến.
- Thứ tự trạm lên nhỏ hơn thứ tự trạm xuống.

Điều kiện thứ tự trạm được biểu diễn như sau:

```text
from_sequence < to_sequence
```

Điều kiện này giúp đảm bảo tuyến được đề xuất đi đúng chiều.

## Tạo Kết Quả Trả Về

Với mỗi tuyến phù hợp, backend lấy thêm thông tin chi tiết:

- Thông tin tuyến.
- Trạm lên xe.
- Trạm xuống xe.
- Danh sách trạm từ trạm lên đến trạm xuống.
- Số trạm cần đi qua.
- Khoảng cách đoạn tuyến.
- Hình học đoạn tuyến.

Hệ thống chỉ trả về một số phương án tốt nhất để giao diện không bị quá nhiều kết quả. Các phương án thường được ưu tiên theo số trạm phải đi qua.

## File Code Liên Quan

- `frontend/src/hooks/useRouteSearch.ts`: quản lý trạng thái tìm tuyến như đang tải, có lỗi, không có kết quả.
- `frontend/src/services/api.ts`: hàm `findRoute` tạo query string và gọi API `/find-route/`.
- `backend/routes/views.py`: hàm `find_route` xử lý truy vấn tìm tuyến.
- `backend/routes/serializers.py`: `RouteOptionSerializer` chuẩn hóa dữ liệu trả về.
- `frontend/src/components/search/RouteResultPanel.tsx`: hiển thị danh sách kết quả.

## Gợi Ý Ảnh Code

- Ảnh frontend gọi API tìm tuyến.
- Ảnh backend đọc tham số và tạo `Point`.
- Ảnh truy vấn tìm tuyến theo `sequence`.
- Ảnh đoạn tạo kết quả trả về cho frontend.
- Ảnh serializer kết quả tuyến.
- Ảnh giao diện danh sách kết quả.

## Lưu Ý Khi Viết Báo Cáo

Nên chia ảnh code backend thành nhiều ảnh nhỏ. Không nên chụp một ảnh quá dài từ đầu đến cuối hàm `find_route`, vì người đọc sẽ khó theo dõi. Nên tách thành ảnh đọc tham số, ảnh tìm tuyến bằng SQL, ảnh tạo kết quả trả về.
