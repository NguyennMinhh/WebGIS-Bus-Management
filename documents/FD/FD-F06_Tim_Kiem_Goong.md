# FD-F06 - Tìm Kiếm Địa Điểm Bằng Goong API

## Mục Đích

Feature này giúp người dùng tìm nhanh một địa điểm hoặc địa chỉ trên bản đồ. Thay vì phải kéo bản đồ thủ công đến khu vực cần tra cứu, người dùng có thể nhập từ khóa và chọn kết quả phù hợp.

## Phạm Vi Chức Năng

Người dùng nhập từ khóa vào ô tìm kiếm địa điểm. Hệ thống gửi từ khóa đến Goong API và nhận về danh sách gợi ý. Khi người dùng chọn một gợi ý, hệ thống lấy tọa độ chi tiết của địa điểm đó và di chuyển bản đồ đến vị trí tương ứng.

Trong project hiện tại, Goong API chỉ hỗ trợ việc tìm địa điểm và zoom bản đồ đến vị trí được chọn. Kết quả tìm kiếm không tự động trở thành điểm đi hoặc điểm đến. Người dùng vẫn cần click trên bản đồ để xác nhận điểm đi, điểm đến.

## Luồng Người Dùng

1. Người dùng nhập tên địa điểm hoặc địa chỉ.
2. Hệ thống hiển thị danh sách gợi ý.
3. Người dùng chọn một địa điểm trong danh sách.
4. Hệ thống lấy tọa độ của địa điểm đã chọn.
5. Bản đồ di chuyển đến vị trí đó.
6. Người dùng tiếp tục chọn điểm đi hoặc điểm đến trên bản đồ.

## Kết Quả Đạt Được

Hệ thống đã tích hợp tìm kiếm địa điểm bằng Goong API. Chức năng này giúp người dùng định vị khu vực nhanh hơn, nhất là khi chưa quen với vị trí trên bản đồ.

Feature này đóng vai trò hỗ trợ thao tác bản đồ. Nó không thay thế bước chọn điểm, nhưng giúp người dùng tìm đúng khu vực trước khi chọn tọa độ.

## Vai Trò Trong Hệ Thống

Tìm kiếm địa điểm giúp cải thiện trải nghiệm sử dụng WebGIS. Người dùng có thể bắt đầu từ một địa chỉ quen thuộc, di chuyển bản đồ đến đó, rồi tiếp tục chọn điểm đi hoặc điểm đến cho bài toán tìm tuyến.

## Ảnh Nên Chèn Vào Báo Cáo

- Ảnh ô tìm kiếm địa điểm.
- Ảnh danh sách gợi ý địa điểm.
- Ảnh bản đồ sau khi chọn một kết quả tìm kiếm.
- Ảnh code gọi Goong API nếu cần minh họa phần tích hợp.

## Ghi Chú

Trong báo cáo nên ghi rõ Goong API không tự gán điểm đi/điểm đến, để tránh mô tả sai chức năng hiện tại của project.
