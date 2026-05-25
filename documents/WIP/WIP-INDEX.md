# WIP — Tính Năng Đang Phát Triển

Thư mục này chứa tài liệu thiết kế cho các tính năng **chưa được code xong**.
Mỗi file là một tính năng độc lập, có đầy đủ: mục tiêu, flow, hướng dẫn code, lỗi thường gặp.

> **Dành cho ai?** Developer mới join dự án muốn hiểu tính năng trước khi bắt tay code.
> **Quy tắc:** Khi tính năng hoàn thành → chuyển tài liệu sang `documents/DD/`.

---

## Tính Năng Route Finder (Tìm Tuyến Xe Buýt)

Route Finder là tính năng cốt lõi của hệ thống, cho phép người dùng nhập điểm đi/đến và tìm tuyến xe buýt phù hợp. Được chia thành các dạng tìm kiếm tăng dần về độ phức tạp:

| File | Tính năng | Trạng thái | Phụ thuộc |
|------|-----------|-----------|-----------|
| [WIP-F01-Chon-Diem-Di-Den.md](./WIP-F01-Chon-Diem-Di-Den.md) | Chọn điểm đi/đến + buffer trên bản đồ | 🔄 Đang code | — |
| [WIP-F02-Route-Results-Panel.md](./WIP-F02-Route-Results-Panel.md) | Tìm tuyến dạng 1 + hiển thị kết quả (right panel, multi-colour) | 🔄 Đang code | F01 |
| WIP-F03-Tim-Tuyen-Dang-2.md | Tìm tuyến dạng 2: *(chưa thiết kế)* | ⏳ Chưa bắt đầu | F02 |
| WIP-F04-Tim-Tuyen-Dang-3.md | Tìm tuyến dạng 3: *(chưa thiết kế)* | ⏳ Chưa bắt đầu | F03 |
| [WIP-F05-Place-Search-Goong.md](./WIP-F05-Place-Search-Goong.md) | Tìm địa điểm theo tên (Goong Autocomplete, bias Hà Nội) | ✅ Đã implement | — |

### Mô tả nhanh từng dạng

**Dạng 1 — 1 tuyến thẳng** *(F02 — đang làm)*
User chọn 2 điểm → hệ thống tìm tuyến xe buýt chạy trực tiếp từ vùng điểm đi đến vùng điểm đến → hiển thị đoạn đường và danh sách trạm.

**Dạng 2, 3, ... — Kết hợp nhiều tuyến** *(chưa thiết kế)*
Khi không có tuyến nào chạy thẳng → cần đổi xe → sẽ được thiết kế sau khi Dạng 1 hoàn chỉnh.

---

## Cấu Trúc Tài Liệu WIP

Mỗi file WIP có cấu trúc chuẩn:

```
1. Mục tiêu         — Tính năng này làm gì, giải quyết vấn đề gì
2. User Flow        — Người dùng thao tác thế nào (từ góc nhìn UX)
3. Technical Flow   — Dữ liệu đi qua các lớp như thế nào
4. Files & Code     — Hướng dẫn code từng file theo thứ tự
5. Lỗi thường gặp  — Các lỗi intern hay mắc + giải thích tại sao
6. Verification     — Cách kiểm tra tính năng sau khi code xong
```
