# DD-F02 - Thiết Kế Hiển Thị Bản Đồ Và Lớp WMS

## Mục Tiêu Thiết Kế

Feature bản đồ cần hiển thị được bản đồ nền và các lớp dữ liệu xe buýt. Hệ thống sử dụng OpenLayers ở frontend để tạo bản đồ tương tác, GeoServer để cung cấp lớp WMS và PostGIS để lưu dữ liệu không gian.

Thiết kế này giúp tách rõ trách nhiệm: PostGIS lưu dữ liệu, GeoServer publish dữ liệu không gian, frontend chỉ tập trung hiển thị và xử lý tương tác của người dùng.

## Thành Phần Tham Gia

Các thành phần chính gồm:

- OpenStreetMap: cung cấp bản đồ nền.
- GeoServer: publish lớp tuyến xe buýt và trạm xe buýt.
- OpenLayers: hiển thị bản đồ và các lớp WMS trên frontend.
- PostGIS: lưu dữ liệu không gian nguồn.

## Luồng Hiển Thị

1. Frontend khởi tạo bản đồ OpenLayers.
2. Lớp nền OpenStreetMap được thêm vào bản đồ.
3. Frontend tạo các WMS layer trỏ đến GeoServer.
4. GeoServer nhận request WMS và render dữ liệu theo vùng bản đồ đang xem.
5. OpenLayers hiển thị ảnh bản đồ WMS chồng lên bản đồ nền.
6. Người dùng tương tác bằng cách kéo, zoom và quan sát dữ liệu.

## Lý Do Dùng WMS

WMS phù hợp cho mục tiêu hiển thị dữ liệu bản đồ vì frontend không cần tải toàn bộ dữ liệu vector về trình duyệt. Khi người dùng xem một khu vực, GeoServer chỉ trả về phần ảnh bản đồ tương ứng với khu vực đó.

Cách này giúp giảm khối lượng xử lý phía frontend và phù hợp với dữ liệu không gian có thể lớn. Tuy nhiên, WMS chủ yếu phục vụ hiển thị. Nếu cần tương tác chi tiết với từng đối tượng, hệ thống có thể bổ sung WFS hoặc API riêng.

## File Code Liên Quan

- `frontend/src/utils/mapConfig.ts`: cấu hình trung tâm bản đồ, mức zoom và thông tin bản đồ.
- `frontend/src/hooks/useMap.ts`: khởi tạo bản đồ, thêm layer và xử lý tương tác.
- GeoServer Layer Preview: kiểm tra lớp WMS trước khi đưa vào WebGIS.

## Gợi Ý Ảnh Code Và Ảnh Giao Diện

- Ảnh cấu hình bản đồ hoặc WMS layer trong frontend.
- Ảnh GeoServer Layer Preview của lớp tuyến.
- Ảnh GeoServer Layer Preview của lớp trạm.
- Ảnh giao diện WebGIS hiển thị bản đồ nền và lớp xe buýt.

## Lưu Ý Khi Viết Báo Cáo

Nên giải thích ngắn gọn GeoServer là nơi publish dữ liệu, còn OpenLayers là nơi hiển thị dữ liệu trên web. Không nên viết rằng frontend đọc trực tiếp dữ liệu từ PostGIS, vì trong luồng hiển thị WMS, frontend làm việc thông qua GeoServer.
