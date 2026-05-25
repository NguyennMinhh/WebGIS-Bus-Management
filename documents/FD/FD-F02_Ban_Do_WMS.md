# FD-F02 - Hiển Thị Bản Đồ Và Lớp WMS

## Mục Đích

Feature này giúp người dùng quan sát dữ liệu xe buýt trực tiếp trên bản đồ WebGIS. Thay vì chỉ xem dữ liệu trong bảng, người dùng có thể nhìn thấy vị trí trạm xe và hướng đi của tuyến xe trên nền bản đồ.

## Phạm Vi Chức Năng

Giao diện WebGIS hiển thị bản đồ nền OpenStreetMap kết hợp với các lớp dữ liệu xe buýt được publish từ GeoServer. Các lớp dữ liệu chính gồm lớp trạm xe buýt và lớp tuyến xe buýt. Lớp trạm giúp người dùng biết các điểm dừng nằm ở đâu, còn lớp tuyến giúp người dùng nhìn được mạng lưới di chuyển của xe buýt.

Người dùng có thể phóng to, thu nhỏ và kéo bản đồ để xem các khu vực khác nhau. Đây là thao tác cơ bản nhưng quan trọng, vì các chức năng như chọn điểm đi, điểm đến hoặc tìm tuyến đều được thực hiện trên nền bản đồ này.

## Luồng Người Dùng

1. Người dùng mở trang WebGIS.
2. Hệ thống tải bản đồ nền OpenStreetMap.
3. Hệ thống tải thêm lớp tuyến xe buýt và lớp trạm xe buýt từ GeoServer.
4. Người dùng quan sát bản đồ, phóng to hoặc kéo đến khu vực cần tra cứu.
5. Người dùng tiếp tục chọn điểm đi, điểm đến hoặc tìm kiếm địa điểm.

## Kết Quả Đạt Được

Hệ thống đã hiển thị được dữ liệu xe buýt trên bản đồ. Các tuyến và trạm được đặt đúng trên nền bản đồ, giúp người dùng dễ hình dung khu vực nào có xe buýt đi qua.

Feature này cũng giúp kiểm tra trực quan dữ liệu sau khi import. Nếu một tuyến hoặc trạm hiển thị sai vị trí, nhóm có thể phát hiện khi xem trên bản đồ WebGIS hoặc GeoServer Layer Preview.

## Vai Trò Trong Hệ Thống

Bản đồ là giao diện trung tâm của project. Người dùng chọn điểm, xem buffer, xem tuyến tìm được và xem hành trình đều thông qua bản đồ. Vì vậy feature WMS là bước kết nối giữa dữ liệu không gian trong PostGIS và giao diện người dùng.

## Ảnh Nên Chèn Vào Báo Cáo

- Ảnh GeoServer Layer Preview của lớp tuyến xe buýt.
- Ảnh GeoServer Layer Preview của lớp trạm xe buýt.
- Ảnh giao diện WebGIS đang hiển thị bản đồ nền, tuyến xe và trạm xe.

## Ghi Chú

Nên chụp ít nhất một ảnh trong GeoServer để chứng minh dữ liệu đã được publish thành WMS, sau đó chụp thêm một ảnh trên WebGIS để chứng minh frontend đã hiển thị được lớp đó.
