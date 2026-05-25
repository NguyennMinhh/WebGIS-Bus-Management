# FD-F09 - Kết Quả Đạt Được Và Hướng Phát Triển

## Kết Quả Đạt Được

Sau quá trình thực hiện đồ án, nhóm đã xây dựng được hệ thống WebGIS hỗ trợ hiển thị, quản lý và tìm kiếm tuyến xe buýt trên bản đồ. Hệ thống sử dụng dữ liệu không gian từ OpenStreetMap, lưu trữ trong PostgreSQL/PostGIS, publish qua GeoServer và hiển thị trên giao diện WebGIS bằng OpenLayers.

Các kết quả chính gồm:

- Thu thập và xử lý dữ liệu tuyến xe buýt, trạm dừng xe buýt dưới dạng GeoJSON.
- Xây dựng cơ sở dữ liệu không gian bằng PostgreSQL/PostGIS.
- Cấu hình GeoServer để publish lớp tuyến xe buýt và trạm xe buýt dưới dạng WMS.
- Hiển thị bản đồ nền OpenStreetMap kết hợp với các lớp dữ liệu xe buýt.
- Xây dựng chức năng chọn điểm đi, điểm đến trực tiếp trên bản đồ.
- Tạo buffer quanh điểm đi và điểm đến để xác định phạm vi tìm kiếm trạm.
- Tìm tuyến xe buýt trực tiếp giữa hai vị trí người dùng chọn.
- Hiển thị kết quả gồm tuyến xe, trạm lên, trạm xuống, số trạm, khoảng cách và danh sách trạm.
- Hiển thị hành trình gồm đường đi bộ và đoạn xe buýt trên bản đồ.
- Tích hợp Goong API để hỗ trợ tìm kiếm địa điểm.
- Xây dựng chức năng đăng ký, đăng nhập, đăng xuất và phân quyền.
- Xây dựng khu vực quản lý dữ liệu dành cho admin.

## Đánh Giá Kết Quả

Hệ thống đã đáp ứng được mục tiêu chính của đồ án là xây dựng một ứng dụng WebGIS có khả năng hiển thị dữ liệu xe buýt và hỗ trợ người dùng tra cứu tuyến theo vị trí. Các chức năng được triển khai theo luồng khá đầy đủ: chuẩn bị dữ liệu, hiển thị bản đồ, chọn điểm, tạo buffer, tìm tuyến và hiển thị hành trình.

Điểm mạnh của hệ thống là đã kết hợp được nhiều thành phần trong một bài toán WebGIS hoàn chỉnh, gồm cơ sở dữ liệu không gian, GeoServer, backend API và frontend bản đồ. Người dùng không cần xem dữ liệu thô mà có thể tương tác trực tiếp trên bản đồ.

## Hạn Chế Hiện Tại

Hệ thống vẫn còn một số hạn chế:

- Chức năng tìm tuyến mới tập trung vào tuyến trực tiếp, chưa hỗ trợ chuyển tuyến.
- Chưa có dữ liệu thời gian thực về xe buýt.
- Chưa tính thời gian chờ xe hoặc thời gian di chuyển dự kiến.
- Việc chỉnh sửa hình học tuyến trên giao diện admin còn có thể phát triển thêm.
- Kết quả phụ thuộc vào độ đầy đủ và độ chính xác của dữ liệu ban đầu.

## Hướng Phát Triển

Trong thời gian tiếp theo, hệ thống có thể được phát triển thêm các chức năng:

- Tìm tuyến có chuyển tuyến.
- Tính toán thời gian di chuyển dự kiến.
- Hiển thị lịch trình và thời gian chờ xe.
- Cải thiện giao diện chọn điểm và kết quả tìm tuyến.
- Cho phép chỉnh sửa hình học tuyến trực tiếp trên bản đồ.
- Bổ sung kiểm tra dữ liệu để hạn chế sai lệch giữa tuyến và trạm.
- Triển khai hệ thống lên môi trường public để người dùng có thể truy cập thực tế.

## Kết Luận

Đồ án đã hoàn thành các chức năng chính của một hệ thống WebGIS tra cứu tuyến xe buýt. Hệ thống không chỉ hiển thị dữ liệu không gian trên bản đồ mà còn xử lý được bài toán tìm tuyến dựa trên vị trí người dùng chọn. Qua đó, nhóm đã vận dụng được các kiến thức về WebGIS, cơ sở dữ liệu không gian, API, frontend bản đồ và phân quyền người dùng vào một sản phẩm hoàn chỉnh ở mức đồ án.
