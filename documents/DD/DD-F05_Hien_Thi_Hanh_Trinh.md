# DD-F05 - Thiết Kế Hiển Thị Hành Trình

## Mục Tiêu Thiết Kế

Sau khi có kết quả tìm tuyến, hệ thống cần hiển thị hành trình đầy đủ trên bản đồ. Hành trình gồm đoạn đi bộ đến trạm lên xe, đoạn xe buýt và đoạn đi bộ từ trạm xuống xe đến điểm đến.

## Dữ Liệu Đầu Vào

Feature này sử dụng các dữ liệu sau:

- `fromPoint`: điểm đi người dùng chọn.
- `toPoint`: điểm đến người dùng chọn.
- Trạm lên xe trong kết quả tuyến.
- Trạm xuống xe trong kết quả tuyến.
- Hình học đoạn xe buýt trả về từ backend.

Từ các dữ liệu này, frontend có thể vẽ đoạn xe buýt và gọi thêm dịch vụ tìm đường đi bộ cho hai đoạn còn lại.

## Luồng Xử Lý

1. Người dùng chọn một phương án tuyến trong bảng kết quả.
2. Frontend lấy hình học đoạn tuyến xe buýt từ kết quả đã chọn.
3. Frontend xác định đoạn đi bộ thứ nhất từ điểm đi đến trạm lên xe.
4. Frontend xác định đoạn đi bộ thứ hai từ trạm xuống xe đến điểm đến.
5. Frontend gọi dịch vụ tìm đường đi bộ.
6. Khi có dữ liệu đường đi bộ, bản đồ vẽ cả ba đoạn hành trình.
7. Nếu người dùng chọn phương án khác, các đoạn cũ được thay bằng hành trình mới.

## Thiết Kế Hiển Thị

Các đoạn hành trình nên được hiển thị khác nhau để người dùng dễ phân biệt:

- Marker điểm đi và điểm đến.
- Marker hoặc thông tin trạm lên, trạm xuống.
- Đường xe buýt được vẽ nổi bật theo tuyến.
- Đường đi bộ được vẽ theo kiểu riêng, thường nhẹ hơn hoặc khác màu.

Việc tách lớp hiển thị giúp bản đồ rõ hơn và tránh nhầm lẫn giữa đoạn đi bộ với đoạn xe buýt.

## File Code Liên Quan

- `frontend/src/hooks/useWalkingRoutes.ts`: lấy và quản lý dữ liệu đường đi bộ.
- `frontend/src/services/osrmApi.ts`: gọi dịch vụ tìm đường đi bộ.
- `frontend/src/hooks/useMap.ts`: vẽ hành trình trên bản đồ.
- `frontend/src/components/search/RouteResultPanel.tsx`: chọn phương án tuyến.
- `frontend/src/App.tsx`: kết nối điểm chọn, kết quả tìm tuyến và hành trình.

## Gợi Ý Ảnh Code

- Ảnh hook lấy đường đi bộ.
- Ảnh service gọi đường đi bộ.
- Ảnh phần vẽ hành trình trong `useMap.ts`.
- Ảnh bản đồ sau khi chọn một tuyến.

## Lưu Ý Khi Viết Báo Cáo

Nên giải thích rằng đường xe buýt lấy từ kết quả tìm tuyến, còn đường đi bộ được tính riêng. Cách viết này giúp người đọc hiểu vì sao hành trình có thể gồm nhiều nguồn dữ liệu khác nhau.
