# DD-F03 - Thiết Kế Chọn Điểm Và Buffer

## Mục Tiêu Thiết Kế

Feature này cần lưu được tọa độ điểm đi, điểm đến và bán kính buffer. Sau đó hệ thống phải vẽ lại marker và buffer trên bản đồ để người dùng kiểm tra trực quan.

Thiết kế được đặt chủ yếu ở frontend vì đây là thao tác tương tác bản đồ. Backend chỉ nhận kết quả cuối cùng gồm tọa độ và bán kính khi người dùng thực hiện tìm tuyến.

## Trạng Thái Dữ Liệu

Frontend lưu các trạng thái chính:

- `fromPoint`: tọa độ điểm đi.
- `toPoint`: tọa độ điểm đến.
- `mode`: trạng thái hiện tại đang chọn điểm đi, điểm đến hoặc không chọn.
- `bufferRadius`: bán kính buffer.
- `isLocating`: trạng thái đang lấy vị trí hiện tại.
- `errorMessage`: thông báo lỗi nếu lấy vị trí thất bại.

`mode` giúp hệ thống biết lần click tiếp theo trên bản đồ sẽ được lưu vào điểm nào. Nếu `mode` là `from`, tọa độ được lưu vào `fromPoint`. Nếu `mode` là `to`, tọa độ được lưu vào `toPoint`.

## Luồng Chọn Điểm

1. Người dùng bấm nút chọn điểm đi hoặc điểm đến.
2. Frontend cập nhật `mode`.
3. Người dùng click lên bản đồ.
4. OpenLayers lấy tọa độ tại vị trí click.
5. Tọa độ được chuyển về dạng kinh độ, vĩ độ.
6. Hệ thống kiểm tra `mode` để lưu vào `fromPoint` hoặc `toPoint`.
7. Sau khi lưu xong, `mode` được đưa về `null`.
8. Marker và buffer được vẽ lại.

Việc tắt `mode` sau khi chọn xong giúp tránh lỗi người dùng click thêm một lần nữa và vô tình thay đổi điểm vừa chọn.

## Luồng Lấy Vị Trí Hiện Tại

Khi người dùng bấm `Use my location`, trình duyệt yêu cầu quyền truy cập vị trí. Nếu người dùng đồng ý, hệ thống lấy kinh độ và vĩ độ hiện tại rồi lưu vào `fromPoint`. Nếu trình duyệt không hỗ trợ hoặc người dùng từ chối quyền, hệ thống hiển thị thông báo lỗi.

## Thiết Kế Buffer

Buffer được vẽ quanh `fromPoint` và `toPoint` bằng bán kính `bufferRadius`. Trên bản đồ, buffer giúp người dùng thấy phạm vi tìm kiếm trạm. Khi gửi request tìm tuyến, bán kính này cũng được gửi lên backend để truy vấn các trạm gần hai điểm.

## File Code Liên Quan

- `frontend/src/hooks/usePointSelection.ts`: quản lý điểm đi, điểm đến, mode và buffer radius.
- `frontend/src/hooks/useMap.ts`: bắt sự kiện click bản đồ và vẽ marker/buffer.
- `frontend/src/components/map/SelectionControls.tsx`: giao diện chọn điểm và chỉnh bán kính.

## Gợi Ý Ảnh Code

- Ảnh `usePointSelection.ts` phần khai báo state.
- Ảnh `handleMapClick` lưu tọa độ vào `fromPoint` hoặc `toPoint`.
- Ảnh `drawSelectionMarkers` vẽ marker và buffer.
- Ảnh giao diện sau khi đã chọn đủ hai điểm.

## Lưu Ý Khi Viết Báo Cáo

Không nên đưa phần tìm tuyến vào quá sâu trong mục này. Mục này chỉ nên dừng ở việc lấy tọa độ và tạo vùng buffer. Phần backend dùng buffer để tìm trạm nên để ở feature tìm tuyến.
