# DD-F06 - Thiết Kế Tìm Kiếm Địa Điểm Goong

## Mục Tiêu Thiết Kế

Feature tìm kiếm địa điểm cần giúp người dùng định vị nhanh trên bản đồ. Hệ thống sử dụng Goong API để lấy gợi ý địa điểm và tọa độ chi tiết của địa điểm được chọn.

Frontend không gọi trực tiếp Goong API. Thay vào đó, frontend gọi backend, backend gọi Goong và trả kết quả về frontend. Cách này giúp che giấu API key và kiểm soát request tốt hơn.

## API Và Luồng Xử Lý

Luồng autocomplete:

1. Người dùng nhập từ khóa.
2. Frontend gửi từ khóa đến backend.
3. Backend gọi Goong autocomplete API.
4. Backend trả danh sách gợi ý về frontend.
5. Frontend hiển thị danh sách gợi ý.

Luồng lấy chi tiết địa điểm:

1. Người dùng chọn một gợi ý.
2. Frontend gửi `place_id` đến backend.
3. Backend gọi Goong place detail API.
4. Backend nhận tọa độ chi tiết.
5. Frontend di chuyển bản đồ đến tọa độ đó.

## Dữ Liệu Trả Về

Autocomplete thường trả về danh sách gợi ý gồm tên địa điểm, địa chỉ mô tả và `place_id`. Sau khi người dùng chọn một gợi ý, `place_id` được dùng để lấy chi tiết địa điểm, trong đó có tọa độ.

Tọa độ trả về được dùng để cập nhật tâm bản đồ, không tự động lưu thành điểm đi hoặc điểm đến.

## File Code Liên Quan

- `frontend/src/components/search/PlaceSearchBox.tsx`: ô tìm kiếm và danh sách gợi ý.
- `frontend/src/hooks/usePlaceSearch.ts`: quản lý trạng thái nhập từ khóa, loading, lỗi và kết quả.
- `frontend/src/services/api.ts`: các hàm `placeAutocomplete` và `placeDetail` gọi API backend.
- `backend/routes/views.py`: `place_autocomplete` và `place_detail`.
- `frontend/src/App.tsx`: nhận tọa độ địa điểm và di chuyển bản đồ.

## Gợi Ý Ảnh Code

- Ảnh `PlaceSearchBox`.
- Ảnh hook xử lý tìm kiếm.
- Ảnh backend proxy request đến Goong.
- Ảnh giao diện danh sách gợi ý.

## Lưu Ý Khi Viết Báo Cáo

Không nên viết rằng Goong API dùng để chọn điểm đi hoặc điểm đến. Trong project hiện tại, Goong chỉ hỗ trợ tìm địa điểm và zoom bản đồ. Việc chọn điểm đi, điểm đến vẫn do người dùng click trực tiếp trên bản đồ.
