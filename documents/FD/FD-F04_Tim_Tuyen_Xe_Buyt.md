# FD-F04 - Tìm Tuyến Xe Buýt Có Thể Đi

## Mục Đích

Feature này giúp người dùng tìm các tuyến xe buýt có thể đi từ điểm đi đến điểm đến đã chọn. Đây là chức năng chính của hệ thống, vì nó chuyển dữ liệu tọa độ trên bản đồ thành các phương án di chuyển cụ thể.

## Phạm Vi Chức Năng

Sau khi người dùng chọn đủ điểm đi, điểm đến và bán kính buffer, hệ thống tìm các trạm xe buýt gần điểm đi và gần điểm đến. Từ hai nhóm trạm này, hệ thống kiểm tra các tuyến xe buýt có thể đi trực tiếp từ nhóm trạm gần điểm đi đến nhóm trạm gần điểm đến.

Kết quả được hiển thị dưới dạng danh sách các phương án tuyến. Mỗi phương án cho biết người dùng nên đi tuyến nào, lên xe ở trạm nào, xuống xe ở trạm nào và cần đi qua bao nhiêu trạm.

## Luồng Người Dùng

1. Người dùng chọn điểm đi và điểm đến.
2. Người dùng kiểm tra hoặc điều chỉnh bán kính buffer.
3. Người dùng bấm tìm tuyến.
4. Hệ thống xử lý và trả về các tuyến phù hợp.
5. Người dùng xem danh sách tuyến ở bảng kết quả.
6. Người dùng mở chi tiết để xem danh sách trạm đi qua.
7. Người dùng chọn một phương án để xem hành trình trên bản đồ.

## Thông Tin Hiển Thị

Mỗi kết quả tuyến hiển thị các thông tin chính:

- Mã tuyến xe buýt.
- Tên tuyến.
- Trạm lên xe.
- Trạm xuống xe.
- Số trạm cần đi qua.
- Khoảng cách đoạn tuyến.
- Giá vé nếu có dữ liệu.
- Tần suất chuyến nếu có dữ liệu.
- Danh sách các trạm trong đoạn di chuyển.

## Kết Quả Đạt Được

Hệ thống đã tìm được các tuyến xe buýt trực tiếp phù hợp giữa hai vị trí người dùng chọn. Kết quả được ưu tiên theo số trạm phải đi qua, giúp người dùng dễ nhận ra phương án ngắn hơn.

Trong phạm vi hiện tại, hệ thống tập trung vào tuyến trực tiếp. Điều này nghĩa là điểm lên và điểm xuống phải nằm trên cùng một tuyến xe buýt và đúng chiều di chuyển.

## Vai Trò Trong Hệ Thống

Feature tìm tuyến là phần xử lý trung tâm của project. Nó sử dụng dữ liệu từ các feature trước như dữ liệu trạm, tuyến, điểm đi, điểm đến và buffer. Kết quả của feature này tiếp tục được dùng cho feature hiển thị hành trình.

## Ảnh Nên Chèn Vào Báo Cáo

- Ảnh giao diện danh sách tuyến tìm được.
- Ảnh mở danh sách trạm của một tuyến.
- Ảnh truy vấn SQL tìm tuyến theo thứ tự trạm.
- Ảnh dữ liệu kết quả trả về cho frontend nếu cần minh họa.

## Ghi Chú

Khi viết báo cáo, nên giải thích rõ hệ thống không chỉ tìm tuyến theo khoảng cách, mà còn kiểm tra thứ tự trạm trên tuyến để đảm bảo người dùng đi đúng chiều.
