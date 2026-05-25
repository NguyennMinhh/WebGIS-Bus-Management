# DD-F01 - Thiết Kế Dữ Liệu Xe Buýt

## Mục Tiêu Thiết Kế

Dữ liệu xe buýt cần phục vụ đồng thời hai nhóm nhu cầu: hiển thị trên bản đồ và xử lý tìm tuyến. Vì vậy dữ liệu không chỉ được lưu ở dạng file GeoJSON, mà được đưa vào PostgreSQL/PostGIS để có thể truy vấn không gian và liên kết giữa các bảng.

PostGIS được chọn vì hệ thống cần làm việc với dữ liệu hình học như điểm trạm, đường tuyến, khoảng cách và phạm vi tìm kiếm. Nếu chỉ lưu dữ liệu trong file hoặc bảng thường, việc tìm trạm gần điểm đi, điểm đến sẽ khó xử lý và kém ổn định.

## Cấu Trúc Dữ Liệu Chính

Hệ thống tổ chức dữ liệu theo ba nhóm chính:

- `BusStop`: lưu thông tin trạm xe buýt.
- `BusRoute`: lưu thông tin tuyến xe buýt.
- `RouteStop`: lưu quan hệ giữa tuyến xe và trạm xe.

`BusStop` đại diện cho một điểm dừng xe buýt. Dữ liệu quan trọng nhất của bảng này là tên trạm và tọa độ. Tọa độ được dùng để hiển thị marker trạm trên bản đồ và để tìm các trạm nằm gần điểm người dùng chọn.

`BusRoute` đại diện cho một tuyến xe buýt. Bảng này lưu thông tin mô tả tuyến và hình học đường đi của tuyến. Hình học tuyến được dùng để hiển thị trên bản đồ và cắt ra đoạn tuyến từ trạm lên đến trạm xuống.

`RouteStop` là bảng liên kết giữa tuyến và trạm. Bảng này quan trọng vì một tuyến có nhiều trạm, đồng thời một trạm cũng có thể thuộc nhiều tuyến. Cột `sequence` trong bảng này cho biết thứ tự trạm trên tuyến.

## Vai Trò Của Thứ Tự Trạm

Thứ tự trạm là yếu tố cần thiết để tìm tuyến đúng chiều. Khi hệ thống tìm được một tuyến có cả trạm gần điểm đi và trạm gần điểm đến, hệ thống vẫn phải kiểm tra trạm lên có đứng trước trạm xuống hay không.

Điều kiện xử lý là:

```text
from_sequence < to_sequence
```

Nếu điều kiện này đúng, người dùng có thể đi từ trạm lên đến trạm xuống theo chiều của tuyến. Nếu điều kiện sai, tuyến đó không phù hợp cho hướng di chuyển hiện tại.

## Luồng Dữ Liệu

1. Dữ liệu được thu thập ở dạng GeoJSON.
2. QGIS được dùng để kiểm tra vị trí và hình học.
3. Dữ liệu được import vào PostgreSQL/PostGIS.
4. Django model ánh xạ dữ liệu thành các bảng trong hệ thống.
5. GeoServer đọc dữ liệu từ PostGIS để publish WMS.
6. Backend API dùng dữ liệu này để tìm tuyến.
7. Frontend hiển thị kết quả trên bản đồ.

## File Code Liên Quan

- `backend/routes/models.py`: định nghĩa model trạm, tuyến và quan hệ tuyến-trạm.
- `data/tay-ho-datas.geojson`: dữ liệu GeoJSON đầu vào.
- `backend/routes/serializers.py`: định nghĩa cách dữ liệu được chuyển thành JSON trả về frontend.

## Gợi Ý Ảnh Code Và Ảnh Dữ Liệu

- Ảnh model `BusStop`.
- Ảnh model `BusRoute`.
- Ảnh model `RouteStop`.
- Ảnh bảng dữ liệu trong pgAdmin.
- Ảnh sơ đồ liên kết bảng trên dbdiagram.io.

## Lưu Ý Khi Viết Báo Cáo

Nên nhấn mạnh rằng bảng `RouteStop` không chỉ là bảng phụ, mà là bảng giúp hệ thống biết thứ tự trạm trên tuyến. Đây là điểm quan trọng để giải thích vì sao hệ thống có thể xác định tuyến đi đúng chiều.
