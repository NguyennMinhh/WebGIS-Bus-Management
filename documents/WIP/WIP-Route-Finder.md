# Plan: Route Finder với Buffer + PostGIS

## Context
User click map (hoặc dùng GPS) để chọn điểm đi/đến → hệ thống vẽ buffer 1km xung quanh 2 điểm →
tìm trạm nằm trong buffer → tìm tuyến có trạm ở CẢ HAI buffer → dùng ST_LineLocatePoint +
ST_LineSubstring để cắt đoạn route → hiển thị lên bản đồ.

Trạng thái hiện tại: models ✅, admin ✅, import pipeline ✅ — views/serializers/urls trống.

---

## Luồng đầy đủ

```
User
 ├─ [Click map / GPS] → chọn điểm ĐI (from_point) → vẽ marker + vòng tròn buffer
 ├─ [Click map]       → chọn điểm ĐẾN (to_point)  → vẽ marker + vòng tròn buffer
 ├─ [Slider]          → điều chỉnh buffer radius (500m–3000m, default 1000m)
 │
 └─ Khi đủ 2 điểm → tự động gọi API
      ↓
      Backend:
        1. ST_DWithin → trạm trong buffer điểm ĐI   (from_stops[])
        2. ST_DWithin → trạm trong buffer điểm ĐẾN  (to_stops[])
        3. JOIN       → tuyến có trạm ở CẢ HAI buffer, đúng chiều (sequence tăng)
        4. Với mỗi tuyến: chọn (from_stop tốt nhất, to_stop tốt nhất)
                          → gần người dùng nhất + hợp lệ về sequence
        5. ST_LineSubstring → cắt đoạn route
        6. Lấy danh sách trạm trung gian
      ↓
      Frontend:
        - Vẽ: markers điểm đi/đến, 2 vòng buffer, candidate stops, đường tuyến (màu đỏ)
        - Hiện panel kết quả: tuyến, số trạm, giá vé, tần suất
```

---

## Backend — 3 files

### `backend/routes/serializers.py`

```python
# Chỉ cần serializers cho find-route response
# GeoServer WMS lo việc hiển thị stops/routes trên map

class BusStopSerializer:         # id, name, lat, lng
class BusRouteInfoSerializer:    # id, ref, name, from_stop, to_stop, charge, interval
class RouteOptionSerializer:     # route, from_stop, to_stop, stop_count, stops[], sub_route GeoJSON
```

### `backend/routes/views.py`

**`GET /api/find-route/`** — params: `from_lat, from_lng, to_lat, to_lng, buffer` (default 1000)

```python
# BƯỚC 1: Parse & validate params
from_lat, from_lng, to_lat, to_lng = float(...)
buffer_m = int(request.GET.get('buffer', 1000))  # mét

# BƯỚC 2: Tìm trạm trong buffer điểm ĐI  (dùng ::geography để tính bằng mét)
from_stops = BusStop.objects.filter(
    location__dwithin=(Point(from_lng, from_lat, srid=4326), D(m=buffer_m))
)

# BƯỚC 3: Tìm trạm trong buffer điểm ĐẾN
to_stops = BusStop.objects.filter(
    location__dwithin=(Point(to_lng, to_lat, srid=4326), D(m=buffer_m))
)

# BƯỚC 4: Tìm tuyến có trạm ở CẢ HAI buffer, đúng chiều (raw SQL)
#
# Ví dụ dữ liệu mẫu để hình dung:
#   from_stops = [id=5 "Võ Chí Công",  id=7 "Nguyễn Hoàng Tôn"]
#   to_stops   = [id=12 "Nhà Văn Hoá", id=15 "Cầu Giấy"]
#
#   routes_routestop:
#   route_id | stop_id | sequence
#      1     |    5    |    2       ← Tuyến 09A, trạm "Võ Chí Công" thứ 2
#      1     |    7    |    4       ← Tuyến 09A, trạm "Nguyễn Hoàng Tôn" thứ 4
#      1     |   12    |    8       ← Tuyến 09A, trạm "Nhà Văn Hoá" thứ 8
#      2     |    5    |    3       ← Tuyến 50,  trạm "Võ Chí Công" thứ 3
#      2     |   15    |    9       ← Tuyến 50,  trạm "Cầu Giấy" thứ 9
#
#   Kết quả JOIN:
#   route_id | from_stop_id | to_stop_id | from_seq | to_seq
#      1     |      5       |     12     |    2     |    8    ✅ (2 < 8)
#      2     |      5       |     15     |    3     |    9    ✅ (3 < 9)
#
# Dùng raw SQL vì ORM không thể JOIN cùng 1 bảng 2 lần dễ dàng
candidate_routes = RawQuerySet("""
    SELECT DISTINCT r.id, rs1.stop_id as from_stop_id, rs2.stop_id as to_stop_id,
           rs1.sequence as from_seq, rs2.sequence as to_seq
    FROM routes_busroute r
    JOIN routes_routestop rs1 ON rs1.route_id = r.id AND rs1.stop_id = ANY(%s)
    JOIN routes_routestop rs2 ON rs2.route_id = r.id AND rs2.stop_id = ANY(%s)
    WHERE rs1.sequence < rs2.sequence
      AND rs1.sequence > 0
      AND rs2.sequence > 0
    ORDER BY (rs2.sequence - rs1.sequence) ASC  -- ít trạm trung gian = ưu tiên hơn
    LIMIT 5
""", [from_stop_ids, to_stop_ids])

# BƯỚC 5: Với mỗi tuyến → tính sub-route geometry
#
# ST_LineSubstring cần "fraction" (0.0-1.0), KHÔNG nhận Point trực tiếp.
# Nên phải dùng ST_LineLocatePoint trước để ra fraction, rồi mới dùng ST_LineSubstring:
#
#   Ví dụ tuyến 09A:
#   merged_path = ST_LineMerge(r.path)         → LineString (đã gộp các đoạn)
#   fraction_from = ST_LineLocatePoint(merged_path, from_stop.location) → 0.12
#                                               (trạm nằm ở 12% chiều dài tuyến)
#   fraction_to   = ST_LineLocatePoint(merged_path, to_stop.location)   → 0.78
#   sub_route     = ST_LineSubstring(merged_path, 0.12, 0.78)           → đoạn 12%→78%
#
#   Đồng thời tính chiều dài (mét):
#   distance_m = ST_Length(sub_route::geography)

with connection.cursor() as cur:
    cur.execute("""
        SELECT
            ST_AsGeoJSON(
                ST_LineSubstring(
                    ST_LineMerge(r.path),
                    ST_LineLocatePoint(ST_LineMerge(r.path), fs.location),
                    ST_LineLocatePoint(ST_LineMerge(r.path), ts.location)
                )
            ) AS sub_route_geojson,
            ROUND(ST_Length(
                ST_LineSubstring(
                    ST_LineMerge(r.path),
                    ST_LineLocatePoint(ST_LineMerge(r.path), fs.location),
                    ST_LineLocatePoint(ST_LineMerge(r.path), ts.location)
                )::geography
            )::numeric, 0) AS distance_m
        FROM routes_busroute r
        CROSS JOIN routes_busstop fs
        CROSS JOIN routes_busstop ts
        WHERE r.id = %s AND fs.id = %s AND ts.id = %s
          AND ST_GeometryType(ST_LineMerge(r.path)) = 'ST_LineString'
    """, [route_id, from_stop_id, to_stop_id])

# BƯỚC 6: Lấy danh sách trạm trung gian (from_seq ≤ seq ≤ to_seq)
intermediate_stops = RouteStop.objects.filter(
    route_id=route_id,
    sequence__gte=from_seq,
    sequence__lte=to_seq
).select_related('stop').order_by('sequence')

# BƯỚC 7: Build response JSON
```

### `backend/routes/urls.py`
```python
# GeoServer WMS đã hiển thị stops/routes trên bản đồ → chỉ cần find-route
urlpatterns = [
    path('find-route/', views.find_route, name='find-route'),
]
```

---

## Frontend — files cần viết/sửa

### `frontend/src/types/index.ts` — thêm

```typescript
interface LatLng { lat: number; lng: number }

interface BusStopBasic { id: number; name: string; lat: number; lng: number }

interface RouteOption {
  route: {
    id: number
    ref: string            // luôn có
    name: string | null    // có thể null từ OSM
    charge: string | null  // có thể null
    interval: string | null
  }
  from_stop: BusStopBasic
  to_stop: BusStopBasic
  stop_count: number
  distance_m: number       // chiều dài đoạn xe buýt, tính từ ST_Length(::geography)
  stops: Array<BusStopBasic & { sequence: number }>
  sub_route: { type: 'LineString'; coordinates: LngLat[] }
}
```

### `frontend/src/services/api.ts` — thêm

```typescript
findRoute(params: {
  from_lat: number; from_lng: number
  to_lat: number; to_lng: number
  buffer?: number   // mét, default 1000
}): Promise<RouteOption[]>
  → GET /api/find-route/?from_lat=...&buffer=1000
```

### `frontend/src/hooks/usePointSelection.ts` — hook mới

Quản lý việc chọn điểm trên bản đồ:
```typescript
type SelectionMode = 'from' | 'to' | null

// State
fromPoint: LatLng | null
toPoint: LatLng | null
mode: SelectionMode        // mode nào đang active
bufferRadius: number       // 500–3000, default 1000

// Actions
activateMode(mode)         // bật chế độ click map
setFromGPS()               // dùng navigator.geolocation
clear()
setBufferRadius(n)
```

### `frontend/src/hooks/useRouteSearch.ts` — hook mới

```typescript
// Nhận fromPoint + toPoint + buffer → gọi API khi đủ 2 điểm
// State: results[], status ('idle'|'loading'|'success'|'error'), errorMsg
// Auto-trigger khi fromPoint và toPoint thay đổi
```

### `frontend/src/hooks/useMap.ts` — mở rộng

Thêm:
1. **Map click handler**: nhận callback `onMapClick(lngLat)`, register/unregister theo `mode`
2. **VectorLayer cho route result**: expose `drawRouteResult(option: RouteOption)` + `clearResult()`
3. **VectorLayer cho markers + buffers**: expose `drawSelectionMarkers({from, to, bufferRadius})`

Return hiện tại: `mapRef` → Sửa thành: `{ mapRef, drawRouteResult, clearResult, drawSelectionMarkers }`

Styling:
- From marker: icon xanh lá (●)
- To marker: icon đỏ (●)
- Buffer circle: vòng tròn chấm (dashed stroke, fill trong suốt)
- Sub-route: đường đỏ đậm strokeWidth=5
- Candidate stops: chấm vàng nhỏ

### `frontend/src/components/map/SelectionControls.tsx` — component mới

Floating controls overlay lên bản đồ (bottom-left hoặc left):
```
┌─────────────────────────┐
│  [📍 Điểm đi]           │  ← nút, click để activate mode
│  [🎯 Điểm đến]          │  ← nút, click để activate mode
│  ─────────────────────  │
│  Buffer: ━━●━━━  1.0km  │  ← slider
│  [🔄 Xóa / Tìm lại]     │
└─────────────────────────┘
```

Khi mode active → nút sáng lên (highlight) + cursor bản đồ đổi sang crosshair

### `frontend/src/components/search/RouteResultPanel.tsx` — component mới

Sliding panel từ phải vào khi có kết quả:
```
Tìm được 2 tuyến
━━━━━━━━━━━━━━━━━━━━━━━
Tuyến 09A             ← luôn hiện (ref không bao giờ null)
Lên: Đối diện Nhà hàng Ngọc Được 3   ← chỉ hiện nếu from_stop.name != ""
Xuống: 333-335 Nguyễn Hoàng Tôn      ← chỉ hiện nếu to_stop.name != ""
Giá vé: 10.000 VND   ← chỉ hiện nếu charge != ""
Tần suất: 15-20 phút ← chỉ hiện nếu interval != ""
Đoạn đường: 2.4 km   ← từ distance_m, luôn tính được
4 trạm               ← từ stop_count
[Chọn tuyến này]
━━━━━━━━━━━━━━━━━━━━━━━
Tuyến 50  ...
```

**Quy tắc hiển thị**: mỗi field chỉ render nếu có giá trị (không null, không "").
Backend trả về null cho field không có → frontend dùng `{field && <div>...</div>}`

Khi click "Chọn tuyến này" → highlight tuyến đó trên bản đồ + zoom vừa đoạn route

### `frontend/src/App.tsx` — cập nhật

Kết nối `usePointSelection` + `useRouteSearch` + `useMap`:
- Pass `onMapClick` callback vào `useMap`
- Khi `mode === 'from'` → click map → setFromPoint
- Khi `mode === 'to'` → click map → setToPoint
- Khi results có → pass vào RouteResultPanel

---

## Thứ tự thực hiện

```
Phase 1 — Backend:
  1. serializers.py
  2. views.py (find_route + stop_list)
  3. urls.py
  → Test với curl

Phase 2 — Frontend types + services:
  4. types/index.ts (thêm types mới)
  5. api.ts (thêm findRoute)

Phase 3 — Map interaction:
  6. useMap.ts (thêm click handler + vector layers)
  7. usePointSelection.ts

Phase 4 — Search logic + UI:
  8. useRouteSearch.ts
  9. SelectionControls.tsx
  10. RouteResultPanel.tsx
  11. App.tsx (kết nối tất cả)
```

---

## Những lỗi intern hay mắc — giảng kèm code

### Lỗi 1: `ST_DWithin` dùng geometry vs geography
```python
# SAI — tính bằng degrees, không phải mét!
location__dwithin=(point, 0.01)

# ĐÚNG — convert sang geography để tính bằng mét
from django.contrib.gis.measure import D
location__dwithin=(point, D(m=1000))
# GeoDjango tự thêm ::geography cast khi dùng D(m=...)
```

### Lỗi 2: Nhầm thứ tự tọa độ (lat/lng vs lng/lat)
```python
# ĐÚNG: Point(longitude, latitude) — X trước, Y sau
Point(105.8046867, 21.055715, srid=4326)   # (lng, lat)
# SAI: Point(21.055715, 105.8046867)       # (lat, lng) → BẮC CỰC!
```
```typescript
// OpenLayers: fromLonLat([longitude, latitude])
fromLonLat([105.8046867, 21.055715])  // đúng
// Khi nhận click từ map: event.coordinate là [lng, lat] trong EPSG:3857
// → toLonLat(coord) → [lng, lat] trong EPSG:4326
```

### Lỗi 3: ST_LineMerge bắt buộc trước ST_LineLocatePoint
```sql
-- SAI — MultiLineString không được dùng trong ST_LineLocatePoint
ST_LineLocatePoint(r.path, s.location)  -- ERROR!

-- ĐÚNG
ST_LineLocatePoint(ST_LineMerge(r.path), s.location)
-- Và kiểm tra kết quả LineMerge có thực sự là LineString không:
WHERE ST_GeometryType(ST_LineMerge(r.path)) = 'ST_LineString'
```

### Lỗi 4: sequence = 0 phá vỡ logic tìm chiều đi
```sql
-- NẾU sequence = 0 → tất cả đều bằng nhau → WHERE rs1.seq < rs2.seq trả về rỗng
-- PHẢI lọc ra:
WHERE rs1.sequence > 0 AND rs2.sequence > 0 AND rs1.sequence < rs2.sequence
```

### Lỗi 5: Không chọn "cặp trạm tốt nhất" khi có nhiều trạm trong buffer
```
Buffer điểm đi chứa 3 trạm: A(seq=2), B(seq=5), C(seq=8)
Buffer điểm đến chứa 2 trạm: D(seq=10), E(seq=12)

Các cặp hợp lệ: (A,D), (A,E), (B,D), (B,E), (C,D), (C,E)
→ Chọn cặp nào? → Cặp (B, D) vì:
  - B gần nhất với điểm đi của user
  - D gần nhất với điểm đến của user
  - Khoảng cách đi bộ tổng = dist(user_from→B) + dist(D→user_to) là nhỏ nhất
```

### Lỗi 6: Map click event trong OpenLayers
```typescript
// SAI — event.coordinate là EPSG:3857, không phải WGS84
map.on('click', (e) => {
  const [lng, lat] = e.coordinate  // WRONG: đây là meters, không phải degrees
})

// ĐÚNG — cần convert
import { toLonLat } from 'ol/proj'
map.on('click', (e) => {
  const [lng, lat] = toLonLat(e.coordinate)  // convert sang WGS84
  callback({ lng, lat })
})
```

### Lỗi 7: Geolocation API là async và có thể bị từ chối
```typescript
// Intern hay quên check permission
navigator.geolocation.getCurrentPosition(
  (pos) => { /* success */ },
  (err) => { alert('Không lấy được vị trí: ' + err.message) }  // PHẢI có error handler
)
```

---

## Files cần sửa/tạo

| File | Action |
|------|--------|
| `backend/routes/serializers.py` | Viết mới (3 serializers cho find-route) |
| `backend/routes/views.py` | Viết mới (chỉ find_route view) |
| `backend/routes/urls.py` | Viết mới (chỉ 1 endpoint) |
| `frontend/src/types/index.ts` | Thêm LatLng, BusStopBasic, RouteOption |
| `frontend/src/services/api.ts` | Thêm findRoute() |
| `frontend/src/hooks/useMap.ts` | Thêm click handler + VectorLayers |
| `frontend/src/hooks/usePointSelection.ts` | Tạo mới |
| `frontend/src/hooks/useRouteSearch.ts` | Tạo mới |
| `frontend/src/components/map/SelectionControls.tsx` | Tạo mới |
| `frontend/src/components/search/RouteResultPanel.tsx` | Tạo mới |
| `frontend/src/App.tsx` | Cập nhật: kết nối hooks + components |

---

## Verification

```bash
# 1. Test find-route API
curl "http://localhost:8000/api/find-route/?from_lat=21.0557&from_lng=105.8047&to_lat=21.0735&to_lng=105.8010&buffer=1000"
# Expect: array RouteOption với sub_route GeoJSON + stops list

# 2. Test buffer nhỏ quá → không tìm thấy trạm
curl "http://localhost:8000/api/find-route/?from_lat=21.05&from_lng=105.80&to_lat=21.07&to_lng=105.81&buffer=10"
# Expect: 404 "Không có trạm xe buýt trong phạm vi 10m"

# 3. Frontend:
# - Click [Điểm đi] → click map → thấy marker xanh + vòng tròn buffer
# - Click [Điểm đến] → click map → thấy marker đỏ + vòng tròn buffer
# - Panel kết quả xuất hiện với danh sách tuyến
# - Click [Chọn tuyến] → thấy đường đỏ trên bản đồ
# - Kéo slider buffer → vòng tròn to/nhỏ theo + re-search
```
