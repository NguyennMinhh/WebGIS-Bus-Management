# FD-F05 - Hiển Thị Hành Trình Đi Bộ Và Đi Xe Buýt

## Mục Đích

Feature này giúp người dùng hình dung rõ toàn bộ hành trình cần đi trên bản đồ. Thay vì chỉ xem mã tuyến và tên trạm, người dùng có thể thấy mình cần đi bộ đến trạm nào, đi xe buýt theo đoạn nào và sau khi xuống xe cần đi bộ tiếp ra sao.

## Phạm Vi Chức Năng

Khi người dùng chọn một kết quả tuyến, hệ thống hiển thị hành trình tương ứng trên bản đồ. Hành trình được chia thành ba phần:

- Đường đi bộ từ điểm đi đến trạm lên xe.
- Đoạn xe buýt từ trạm lên xe đến trạm xuống xe.
- Đường đi bộ từ trạm xuống xe đến điểm đến.

Đoạn xe buýt được lấy từ kết quả tìm tuyến. Đường đi bộ được tính riêng để thể hiện đoạn người dùng cần tự di chuyển trước và sau khi đi xe buýt.

## Luồng Người Dùng

1. Người dùng tìm tuyến thành công.
2. Người dùng chọn một phương án trong danh sách kết quả.
3. Bản đồ vẽ đoạn tuyến xe buýt tương ứng.
4. Bản đồ vẽ đường đi bộ từ điểm đi đến trạm lên.
5. Bản đồ vẽ đường đi bộ từ trạm xuống đến điểm đến.
6. Nếu người dùng chọn tuyến khác, bản đồ cập nhật lại hành trình.

## Kết Quả Đạt Được

Hệ thống đã hiển thị được hành trình đầy đủ gồm cả đi bộ và đi xe buýt. Kết quả này giúp người dùng dễ hiểu phương án di chuyển hơn, đặc biệt trong trường hợp trạm xe không nằm ngay tại điểm đi hoặc điểm đến.

Feature này cũng làm cho kết quả tìm tuyến thực tế hơn. Người dùng không chỉ biết nên đi tuyến nào, mà còn biết phải tiếp cận tuyến đó như thế nào.

## Vai Trò Trong Hệ Thống

Feature này sử dụng kết quả từ feature tìm tuyến và biến kết quả đó thành thông tin trực quan trên bản đồ. Đây là bước cuối trong luồng tra cứu tuyến của người dùng: từ chọn điểm, tìm tuyến đến xem hành trình.

## Ảnh Nên Chèn Vào Báo Cáo

- Ảnh bản đồ có đoạn xe buýt được tô nổi bật.
- Ảnh bản đồ có đường đi bộ đến trạm lên xe.
- Ảnh bản đồ có đủ cả đường đi bộ và đường xe buýt.
- Ảnh bảng kết quả khi một tuyến đang được chọn.

## Ghi Chú

Nên dùng ảnh có đủ ba đoạn hành trình để người đọc thấy rõ sự khác nhau giữa phần đi bộ và phần đi xe buýt.
