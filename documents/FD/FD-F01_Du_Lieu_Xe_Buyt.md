# FD-F01 - Thu Thập, Import Và Tổ Chức Dữ Liệu Xe Buýt

## Mục Đích

Feature này chuẩn bị dữ liệu đầu vào cho toàn bộ hệ thống WebGIS. Dữ liệu chính gồm trạm dừng xe buýt, tuyến xe buýt và quan hệ giữa tuyến với các trạm trên tuyến. Nếu dữ liệu không được chuẩn bị đúng, các chức năng phía sau như hiển thị bản đồ, tạo buffer, tìm trạm gần nhất và tìm tuyến sẽ không thể hoạt động chính xác.

## Phạm Vi Chức Năng

Nhóm sử dụng dữ liệu xe buýt ở dạng GeoJSON. Đây là định dạng phù hợp với dữ liệu không gian vì có thể lưu cả phần thuộc tính và phần hình học của đối tượng. Với trạm xe, hình học thường là điểm. Với tuyến xe, hình học thường là đường thể hiện hướng đi của tuyến.

Dữ liệu sau khi thu thập được kiểm tra lại bằng QGIS để quan sát trực tiếp trên bản đồ. Việc kiểm tra bằng QGIS giúp phát hiện các lỗi dễ thấy như trạm nằm sai vị trí, tuyến bị thiếu hình học hoặc dữ liệu không hiển thị đúng khu vực nghiên cứu.

Sau khi kiểm tra, dữ liệu được import vào PostgreSQL/PostGIS. PostGIS được dùng vì hệ thống cần xử lý dữ liệu không gian, không chỉ lưu dữ liệu dạng bảng thông thường. Các phép xử lý như tìm trạm trong bán kính, tính khoảng cách hoặc cắt đoạn tuyến đều cần đến dữ liệu không gian.

## Luồng Thực Hiện

1. Thu thập dữ liệu tuyến xe buýt và trạm dừng dưới dạng GeoJSON.
2. Mở dữ liệu trong QGIS để kiểm tra hình học và thuộc tính.
3. Import dữ liệu vào PostgreSQL/PostGIS.
4. Kiểm tra dữ liệu sau import bằng pgAdmin.
5. Tổ chức dữ liệu thành các bảng trạm xe, tuyến xe và quan hệ tuyến-trạm.
6. Sử dụng dữ liệu này cho hiển thị bản đồ, publish WMS và tìm tuyến.

## Kết Quả Đạt Được

Hệ thống đã có bộ dữ liệu xe buýt có thể sử dụng trong các chức năng chính. Dữ liệu không chỉ phục vụ việc hiển thị tuyến và trạm trên bản đồ, mà còn là cơ sở để hệ thống xác định tuyến nào đi qua trạm nào, trạm nào gần điểm đi và trạm nào gần điểm đến.

Các nhóm dữ liệu chính gồm:

- Trạm xe buýt: tên trạm, mã định danh và vị trí tọa độ.
- Tuyến xe buýt: mã tuyến, tên tuyến, thông tin tuyến và hình học đường đi.
- Quan hệ tuyến-trạm: cho biết trạm thuộc tuyến nào và nằm ở thứ tự bao nhiêu trên tuyến.

## Vai Trò Trong Hệ Thống

Feature dữ liệu là phần nền của project. Các feature khác đều phụ thuộc vào dữ liệu này. Bản đồ cần dữ liệu để hiển thị lớp tuyến và trạm. Chức năng tìm tuyến cần dữ liệu để xác định trạm lên, trạm xuống và đoạn xe buýt cần đi. Khu vực admin cũng thao tác trực tiếp trên nhóm dữ liệu này.

## Ảnh Nên Chèn Vào Báo Cáo

- Ảnh file GeoJSON hoặc một đoạn dữ liệu GeoJSON.
- Ảnh dữ liệu GeoJSON được mở trong QGIS.
- Ảnh bảng dữ liệu sau khi import trong pgAdmin.
- Ảnh sơ đồ cơ sở dữ liệu thể hiện bảng tuyến, trạm và quan hệ tuyến-trạm.

## Ghi Chú

Nên chụp ảnh dữ liệu ở mức vừa đủ, không cần chụp toàn bộ file GeoJSON quá dài. Trong báo cáo chỉ cần thể hiện dữ liệu có đủ phần thuộc tính và phần hình học là được.
