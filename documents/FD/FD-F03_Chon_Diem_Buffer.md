# FD-F03 - Chọn Điểm Đi, Điểm Đến Và Tạo Buffer

## Mục Đích

Feature này cho phép người dùng xác định nhu cầu di chuyển bằng cách chọn điểm đi và điểm đến trên bản đồ. Sau khi có hai điểm này, hệ thống tạo vùng buffer xung quanh từng điểm để xác định phạm vi tìm kiếm các trạm xe buýt gần nhất.

## Phạm Vi Chức Năng

Trên giao diện WebGIS, người dùng có thể chọn điểm đi bằng nút `Pick start point`, chọn điểm đến bằng nút `Pick destination`, hoặc lấy vị trí hiện tại làm điểm đi bằng nút `Use my location`. Khi bật chế độ chọn điểm, lần click tiếp theo trên bản đồ sẽ được ghi nhận thành tọa độ tương ứng.

Sau khi người dùng chọn xong, hệ thống hiển thị lại tọa độ của điểm đi và điểm đến trong bảng điều khiển. Đồng thời bản đồ vẽ marker tại vị trí đã chọn để người dùng kiểm tra trực quan.

Hệ thống cũng tạo buffer quanh điểm đi và điểm đến. Buffer là vùng tròn có bán kính do người dùng đặt. Vùng này thể hiện phạm vi mà hệ thống sẽ tìm các trạm xe buýt gần người dùng.

## Luồng Người Dùng

1. Người dùng bấm `Pick start point`.
2. Người dùng click vào vị trí muốn bắt đầu trên bản đồ.
3. Hệ thống lưu tọa độ điểm đi và hiển thị marker.
4. Người dùng bấm `Pick destination`.
5. Người dùng click vào vị trí muốn đến trên bản đồ.
6. Hệ thống lưu tọa độ điểm đến và hiển thị marker.
7. Người dùng điều chỉnh bán kính buffer nếu cần.
8. Hệ thống vẽ lại buffer quanh hai điểm.

## Kết Quả Đạt Được

Hệ thống đã cho phép người dùng chọn được hai vị trí đầu vào cho bài toán tìm tuyến. Điểm đi và điểm đến được lưu riêng, hiển thị rõ trên bản đồ và có buffer tương ứng.

Các kết quả chính gồm:

- Lấy tọa độ điểm đi từ thao tác click bản đồ hoặc vị trí GPS.
- Lấy tọa độ điểm đến từ thao tác click bản đồ.
- Hiển thị tọa độ đã chọn trong bảng điều khiển.
- Vẽ marker điểm đi, điểm đến trên bản đồ.
- Vẽ buffer quanh hai điểm theo bán kính người dùng chọn.

## Vai Trò Trong Hệ Thống

Feature này là bước đầu vào trực tiếp cho chức năng tìm tuyến. Backend không thể tìm tuyến nếu chưa có tọa độ điểm đi, tọa độ điểm đến và bán kính buffer. Vì vậy chức năng chọn điểm và tạo buffer nằm giữa phần hiển thị bản đồ và phần xử lý tìm tuyến.

## Ảnh Nên Chèn Vào Báo Cáo

- Ảnh giao diện có bảng chọn điểm đi, điểm đến và nút dùng vị trí hiện tại.
- Ảnh bản đồ sau khi chọn điểm đi và điểm đến.
- Ảnh bản đồ có buffer quanh hai điểm.
- Ảnh code xử lý lưu `fromPoint`, `toPoint` nếu cần minh họa kỹ thuật.

## Ghi Chú

Trong báo cáo nên tách rõ: chọn điểm là để lấy tọa độ, còn buffer là để xác định phạm vi tìm trạm. Không nên gộp phần tìm tuyến vào feature này quá sâu, vì tìm tuyến là feature riêng.
