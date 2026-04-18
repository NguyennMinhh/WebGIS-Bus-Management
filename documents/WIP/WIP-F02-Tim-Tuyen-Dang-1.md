# F02 — Tìm Tuyến Xe Buýt Dạng 1: 1 Tuyến Thẳng

**Phụ thuộc:** [F01 — Chọn Điểm Đi/Đến](./WIP-F01-Chon-Diem-Di-Den.md) phải hoàn thành trước
**Tính năng tiếp theo:** F03 — Tìm Tuyến Dạng 2 *(chưa thiết kế)*

---

## 1. Mục Tiêu

Khi người dùng đã chọn điểm đi và điểm đến (F01), tự động tìm **các tuyến xe buýt chạy thẳng** từ vùng điểm đi đến vùng điểm đến.

**"Chạy thẳng"** nghĩa là: có ít nhất 1 trạm trong buffer điểm đi **VÀ** ít nhất 1 trạm trong buffer điểm đến, **cùng thuộc một tuyến**, **đúng chiều đi** (trạm đi có sequence nhỏ hơn trạm đến).

Kết quả hiển thị:
- **Trên bản đồ**: đoạn đường xe buýt được vẽ màu đỏ
- **Panel bên phải**: danh sách tuyến, thông tin giá vé, số trạm, khoảng cách

---

## 2. User Flow

```
[Đã có fromPoint + toPoint từ F01]
         │
         ▼ Tự động trigger (không cần click thêm)
┌─────────────────────────────────────────────────────────┐
│  Trạng thái: loading                                    │
│  - Spinner nhỏ xuất hiện trên panel                     │
└─────────────────────────────────────────────────────────┘
         │
         ├── Tìm thấy tuyến ──────────────────────────────
         │    ▼
         │  Panel kết quả trượt vào từ bên phải:
         │  ┌───────────────────────────────────────┐
         │  │ Tìm được 2 tuyến                       │
         │  │ ───────────────────────────────────── │
         │  │ Tuyến 09A                              │
         │  │ Lên: Đối diện NH Ngọc Được 3           │  ← chỉ hiện nếu có
         │  │ Xuống: 333-335 Nguyễn Hoàng Tôn        │  ← chỉ hiện nếu có
         │  │ Giá vé: 10.000 VND                     │  ← chỉ hiện nếu có
         │  │ Tần suất: 15-20 phút                   │  ← chỉ hiện nếu có
         │  │ Đoạn đường: 2.4 km                     │  ← luôn có
         │  │ 4 trạm                                 │  ← luôn có
         │  │ [Chọn tuyến này]                       │
         │  │ ───────────────────────────────────── │
         │  │ Tuyến 50  ...                          │
         │  └───────────────────────────────────────┘
         │
         │  Click [Chọn tuyến này]:
         │  - Đường đỏ đậm trên bản đồ (đoạn xe buýt đi)
         │  - Bản đồ tự zoom vừa đoạn đường đó
         │
         └── Không tìm thấy ─────────────────────────────
              ▼
             Panel: "Không có tuyến xe buýt nào phù hợp.
                     Thử tăng bán kính buffer."
```

---

## 3. Technical Flow

### 3.1 Tổng quan

```
Frontend                          Backend (Django)               Database (PostGIS)
────────                          ────────────────               ─────────────────
useRouteSearch                    find_route view
  │                                    │
  ├─ GET /api/find-route/              │
  │   ?from_lat=21.05                  │
  │   &from_lng=105.80                 │
  │   &to_lat=21.07                    │
  │   &to_lng=105.81                   │
  │   &buffer=1000         ──────────► │
  │                                    │
  │                                    ├─ ST_DWithin → from_stops[]  ──► routes_busstop
  │                                    ├─ ST_DWithin → to_stops[]    ──► routes_busstop
  │                                    ├─ raw SQL JOIN → routes      ──► routes_routestop
  │                                    ├─ ST_LineLocatePoint × 2     ──► routes_busroute
  │                                    ├─ ST_LineSubstring           ──► routes_busroute
  │                                    └─ stops in range             ──► routes_routestop
  │                                    │
  │                         ◄──────── JSON response (RouteOption[])
  │
  ├─ status = 'success'
  ├─ results = [RouteOption, ...]
  │
  ▼
RouteResultPanel (render results)
useMap.drawRouteResult() (khi user chọn 1 tuyến)
```

---

### 3.2 Backend: 7 bước xử lý

#### Bước 1 — Parse & validate params

```python
from_lat  = float(request.GET.get('from_lat'))
from_lng  = float(request.GET.get('from_lng'))
to_lat    = float(request.GET.get('to_lat'))
to_lng    = float(request.GET.get('to_lng'))
buffer_m  = max(100, min(5000, int(request.GET.get('buffer', 1000))))
```

Validate đủ 4 tọa độ, nếu thiếu trả 400 Bad Request.

---

#### Bước 2 & 3 — Tìm trạm trong buffer (ST_DWithin)

```python
from django.contrib.gis.geos import Point
from django.contrib.gis.measure import D  # D = Distance

from_point = Point(from_lng, from_lat, srid=4326)  # Point(X, Y) = Point(lng, lat)
to_point   = Point(to_lng,   to_lat,   srid=4326)

# D(m=...) là mấu chốt: GeoDjango tự thêm ::geography cast
# → PostgreSQL tính khoảng cách bằng MÉT, không phải degrees
from_stops = BusStop.objects.filter(location__dwithin=(from_point, D(m=buffer_m)))
to_stops   = BusStop.objects.filter(location__dwithin=(to_point,   D(m=buffer_m)))

if not from_stops.exists():
    return Response({'error': f'Không có trạm trong phạm vi {buffer_m}m tại điểm đi'}, status=404)
if not to_stops.exists():
    return Response({'error': f'Không có trạm trong phạm vi {buffer_m}m tại điểm đến'}, status=404)
```

---

#### Bước 4 — Tìm tuyến có trạm ở CẢ HAI buffer (raw SQL)

Đây là bước phức tạp nhất. Cần JOIN bảng `routes_routestop` **2 lần** (một lần cho điểm đi, một lần cho điểm đến) — ORM Django không hỗ trợ kiểu JOIN này dễ dàng, nên phải dùng raw SQL.

**Dữ liệu mẫu để hình dung:**

```
from_stops = [id=5 "Võ Chí Công", id=7 "Nguyễn Hoàng Tôn"]
to_stops   = [id=12 "Nhà Văn Hoá", id=15 "Cầu Giấy"]

Bảng routes_routestop:
route_id | stop_id | sequence
   1     |    5    |    2      ← Tuyến 09A, "Võ Chí Công" là trạm thứ 2
   1     |    7    |    4      ← Tuyến 09A, "Nguyễn Hoàng Tôn" là trạm thứ 4
   1     |   12    |    8      ← Tuyến 09A, "Nhà Văn Hoá" là trạm thứ 8
   2     |    5    |    3      ← Tuyến 50, "Võ Chí Công" là trạm thứ 3
   2     |   15    |    9      ← Tuyến 50, "Cầu Giấy" là trạm thứ 9

Sau JOIN (rs1.sequence < rs2.sequence → đúng chiều đi):
route_id | from_stop_id | to_stop_id | from_seq | to_seq
   1     |      5       |     12     |    2     |    8    ✅ hợp lệ (2 < 8)
   2     |      5       |     15     |    3     |    9    ✅ hợp lệ (3 < 9)
```

```python
from_stop_ids = list(from_stops.values_list('id', flat=True))
to_stop_ids   = list(to_stops.values_list('id', flat=True))

with connection.cursor() as cur:
    cur.execute("""
        SELECT DISTINCT
            r.id           AS route_id,
            rs1.stop_id    AS from_stop_id,
            rs2.stop_id    AS to_stop_id,
            rs1.sequence   AS from_seq,
            rs2.sequence   AS to_seq
        FROM routes_busroute r
        JOIN routes_routestop rs1
            ON rs1.route_id = r.id AND rs1.stop_id = ANY(%s)
        JOIN routes_routestop rs2
            ON rs2.route_id = r.id AND rs2.stop_id = ANY(%s)
        WHERE rs1.sequence > 0             -- loại trạm có sequence = 0 (dữ liệu OSM xấu)
          AND rs2.sequence > 0
          AND rs1.sequence < rs2.sequence  -- đúng chiều đi (from trước to)
        ORDER BY (rs2.sequence - rs1.sequence) ASC  -- ít trạm trung gian = ưu tiên
        LIMIT 5
    """, [from_stop_ids, to_stop_ids])

    candidates = cur.fetchall()
    # candidates = [(route_id, from_stop_id, to_stop_id, from_seq, to_seq), ...]
```

**Tại sao `sequence > 0`?** Một số trạm trong OSM không có thứ tự rõ ràng → import xong được gán `sequence = 0`. Nếu không lọc, `0 < 0` luôn False → không tìm được gì.

---

#### Bước 5 — Cắt đoạn route bằng ST_LineSubstring

**Hiểu đúng về ST_LineSubstring:**

ST_LineSubstring cần 2 tham số là **fraction** (số từ 0.0 đến 1.0), thể hiện vị trí trên tuyến tính theo % chiều dài.

→ Phải dùng `ST_LineLocatePoint` trước để lấy fraction từ một Point, rồi mới cho vào `ST_LineSubstring`.

```
merged_path  = ST_LineMerge(r.path)          → LineString (gộp nhiều đoạn thành 1)
fraction_from = ST_LineLocatePoint(merged_path, from_stop.location) → 0.12
                                              (trạm đi nằm ở 12% chiều dài tuyến)
fraction_to   = ST_LineLocatePoint(merged_path, to_stop.location)   → 0.78
sub_route     = ST_LineSubstring(merged_path, 0.12, 0.78)           → đoạn 12%→78%
```

**Tại sao cần ST_LineMerge?** Field `path` trong model là `MultiLineStringField` — OSM đôi khi lưu tuyến thành nhiều đoạn rời. `ST_LineLocatePoint` chỉ hoạt động với `LineString`, không hoạt động với `MultiLineString`. Nên phải gộp lại trước bằng `ST_LineMerge`.

**Tại sao có `WHERE ST_GeometryType(...) = 'ST_LineString'`?** `ST_LineMerge` chỉ trả về `LineString` nếu tất cả các đoạn **kết nối với nhau**. Nếu có đoạn bị hở (gap) trong dữ liệu OSM → kết quả vẫn là `MultiLineString`. Điều kiện này loại bỏ tuyến có dữ liệu lỗi thay vì crash.

```python
results = []
for route_id, from_stop_id, to_stop_id, from_seq, to_seq in candidates:
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
                ROUND(
                    ST_Length(
                        ST_LineSubstring(
                            ST_LineMerge(r.path),
                            ST_LineLocatePoint(ST_LineMerge(r.path), fs.location),
                            ST_LineLocatePoint(ST_LineMerge(r.path), ts.location)
                        )::geography  -- ::geography → tính bằng MÉT (không phải degrees)
                    )::numeric,
                    0
                ) AS distance_m
            FROM routes_busroute r
            CROSS JOIN routes_busstop fs
            CROSS JOIN routes_busstop ts
            WHERE r.id = %s AND fs.id = %s AND ts.id = %s
              AND ST_GeometryType(ST_LineMerge(r.path)) = 'ST_LineString'
        """, [route_id, from_stop_id, to_stop_id])

        row = cur.fetchone()
        if not row or not row[0]:
            continue  # bỏ qua tuyến có dữ liệu lỗi (MultiLineString bị hở)

        sub_route_geojson, distance_m = row
```

---

#### Bước 6 — Lấy danh sách trạm trung gian

```python
intermediate_stops = RouteStop.objects.filter(
    route_id=route_id,
    sequence__gte=from_seq,
    sequence__lte=to_seq,
).select_related('stop').order_by('sequence')
# select_related('stop') → tránh N+1 query (1 query JOIN thay vì N query riêng)
```

---

#### Bước 7 — Build response

```python
route = BusRoute.objects.get(id=route_id)
from_stop = BusStop.objects.get(id=from_stop_id)
to_stop   = BusStop.objects.get(id=to_stop_id)

results.append({
    'route': {
        'id': route.id,
        'ref': route.ref,
        'name':     route.name     or None,  # "" → None
        'charge':   route.charge   or None,
        'interval': route.interval or None,
    },
    'from_stop': {'id': from_stop.id, 'name': from_stop.name,
                  'lat': from_stop.location.y, 'lng': from_stop.location.x},
    'to_stop':   {'id': to_stop.id,   'name': to_stop.name,
                  'lat': to_stop.location.y,   'lng': to_stop.location.x},
    'stop_count': to_seq - from_seq + 1,
    'distance_m': int(distance_m),
    'stops': [
        {
            'id':       rs.stop.id,
            'name':     rs.stop.name,
            'lat':      rs.stop.location.y,
            'lng':      rs.stop.location.x,
            'sequence': rs.sequence,
        }
        for rs in intermediate_stops
    ],
    'sub_route': json.loads(sub_route_geojson),  # GeoJSON string → dict
})

return Response(results)
```

---

## 4. Files Cần Tạo / Sửa

### Thứ tự thực hiện

```
Backend (test với curl trước khi code frontend):
  1. serializers.py  ← không cần nhiều (dùng dict thô trong view)
  2. views.py        ← logic chính ở đây
  3. urls.py         ← 1 endpoint duy nhất

Frontend (sau khi API chạy được):
  4. types/index.ts        ← thêm RouteOption interface
  5. services/api.ts       ← thêm findRoute()
  6. hooks/useRouteSearch.ts   ← auto-trigger khi đủ 2 điểm
  7. components/search/RouteResultPanel.tsx
  8. App.tsx               ← kết nối tất cả
```

---

### 4.1 `backend/routes/views.py`

```python
import json
from django.contrib.gis.geos import Point
from django.contrib.gis.measure import D
from django.db import connection
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import BusStop, BusRoute, RouteStop


@api_view(['GET'])
def find_route(request):
    # ── BƯỚC 1: Parse params ──────────────────────────────────────────────
    try:
        from_lat  = float(request.GET['from_lat'])
        from_lng  = float(request.GET['from_lng'])
        to_lat    = float(request.GET['to_lat'])
        to_lng    = float(request.GET['to_lng'])
    except (KeyError, ValueError):
        return Response({'error': 'Thiếu hoặc sai tham số tọa độ'}, status=400)

    buffer_m = max(100, min(5000, int(request.GET.get('buffer', 1000))))

    # ── BƯỚC 2 & 3: Tìm trạm trong buffer ────────────────────────────────
    # Point(X, Y) = Point(longitude, latitude) — KHÔNG đảo ngược!
    from_point = Point(from_lng, from_lat, srid=4326)
    to_point   = Point(to_lng,   to_lat,   srid=4326)

    from_stops = BusStop.objects.filter(location__dwithin=(from_point, D(m=buffer_m)))
    to_stops   = BusStop.objects.filter(location__dwithin=(to_point,   D(m=buffer_m)))

    if not from_stops.exists():
        return Response(
            {'error': f'Không có trạm xe buýt trong phạm vi {buffer_m}m tại điểm đi'},
            status=404,
        )
    if not to_stops.exists():
        return Response(
            {'error': f'Không có trạm xe buýt trong phạm vi {buffer_m}m tại điểm đến'},
            status=404,
        )

    from_stop_ids = list(from_stops.values_list('id', flat=True))
    to_stop_ids   = list(to_stops.values_list('id', flat=True))

    # ── BƯỚC 4: Tìm tuyến có trạm ở CẢ 2 buffer, đúng chiều ──────────────
    with connection.cursor() as cur:
        cur.execute("""
            SELECT DISTINCT
                r.id           AS route_id,
                rs1.stop_id    AS from_stop_id,
                rs2.stop_id    AS to_stop_id,
                rs1.sequence   AS from_seq,
                rs2.sequence   AS to_seq
            FROM routes_busroute r
            JOIN routes_routestop rs1
                ON rs1.route_id = r.id AND rs1.stop_id = ANY(%s)
            JOIN routes_routestop rs2
                ON rs2.route_id = r.id AND rs2.stop_id = ANY(%s)
            WHERE rs1.sequence > 0
              AND rs2.sequence > 0
              AND rs1.sequence < rs2.sequence
            ORDER BY (rs2.sequence - rs1.sequence) ASC
            LIMIT 5
        """, [from_stop_ids, to_stop_ids])
        candidates = cur.fetchall()

    if not candidates:
        return Response(
            {'error': 'Không có tuyến xe buýt nào đi thẳng giữa 2 điểm. Thử tăng buffer.'},
            status=404,
        )

    # ── BƯỚC 5 + 6 + 7: Với mỗi tuyến → tính geometry + danh sách trạm ──
    results = []
    for route_id, from_stop_id, to_stop_id, from_seq, to_seq in candidates:
        # Tính sub-route geometry và khoảng cách
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
                    ROUND(
                        ST_Length(
                            ST_LineSubstring(
                                ST_LineMerge(r.path),
                                ST_LineLocatePoint(ST_LineMerge(r.path), fs.location),
                                ST_LineLocatePoint(ST_LineMerge(r.path), ts.location)
                            )::geography
                        )::numeric,
                        0
                    ) AS distance_m
                FROM routes_busroute r
                CROSS JOIN routes_busstop fs
                CROSS JOIN routes_busstop ts
                WHERE r.id = %s AND fs.id = %s AND ts.id = %s
                  AND ST_GeometryType(ST_LineMerge(r.path)) = 'ST_LineString'
            """, [route_id, from_stop_id, to_stop_id])
            row = cur.fetchone()

        if not row or not row[0]:
            continue  # tuyến có dữ liệu OSM bị hở, bỏ qua

        sub_route_geojson, distance_m = row

        # Danh sách trạm trung gian
        stops_qs = RouteStop.objects.filter(
            route_id=route_id,
            sequence__gte=from_seq,
            sequence__lte=to_seq,
        ).select_related('stop').order_by('sequence')

        # Thông tin tuyến và trạm
        route      = BusRoute.objects.get(id=route_id)
        from_stop  = BusStop.objects.get(id=from_stop_id)
        to_stop    = BusStop.objects.get(id=to_stop_id)

        results.append({
            'route': {
                'id':       route.id,
                'ref':      route.ref,
                'name':     route.name     or None,
                'charge':   route.charge   or None,
                'interval': route.interval or None,
            },
            'from_stop': {
                'id': from_stop.id, 'name': from_stop.name,
                'lat': from_stop.location.y, 'lng': from_stop.location.x,
            },
            'to_stop': {
                'id': to_stop.id, 'name': to_stop.name,
                'lat': to_stop.location.y, 'lng': to_stop.location.x,
            },
            'stop_count': to_seq - from_seq + 1,
            'distance_m': int(distance_m),
            'stops': [
                {
                    'id':       rs.stop.id,
                    'name':     rs.stop.name,
                    'lat':      rs.stop.location.y,
                    'lng':      rs.stop.location.x,
                    'sequence': rs.sequence,
                }
                for rs in stops_qs
            ],
            'sub_route': json.loads(sub_route_geojson),
        })

    if not results:
        return Response(
            {'error': 'Các tuyến tìm được có dữ liệu không hợp lệ'},
            status=404,
        )

    return Response(results)
```

---

### 4.2 `backend/routes/urls.py`

```python
from django.urls import path
from . import views

urlpatterns = [
    path('find-route/', views.find_route, name='find-route'),
]
```

---

### 4.3 `frontend/src/types/index.ts` — Thêm vào cuối file

```typescript
/** Tọa độ dạng object {lat, lng} — dùng trong component state */
export interface LatLng {
  lat: number
  lng: number
}

/** Trạm dừng cơ bản — dùng trong kết quả find-route */
export interface BusStopBasic {
  id: number
  name: string
  lat: number
  lng: number
}

/** Một kết quả tuyến xe buýt từ API find-route */
export interface RouteOption {
  route: {
    id: number
    ref: string             // Số tuyến, ví dụ "09A" — luôn có
    name: string | null     // Tên đầy đủ — có thể null (OSM không có data)
    charge: string | null   // Giá vé — có thể null
    interval: string | null // Tần suất — có thể null
  }
  from_stop: BusStopBasic   // Trạm lên xe (trong buffer điểm đi)
  to_stop: BusStopBasic     // Trạm xuống xe (trong buffer điểm đến)
  stop_count: number        // Số trạm đi qua (bao gồm trạm đầu và cuối)
  distance_m: number        // Chiều dài đoạn đường xe buýt tính bằng mét
  stops: Array<BusStopBasic & { sequence: number }>  // Danh sách trạm theo thứ tự
  sub_route: {              // GeoJSON LineString — đoạn đường xe buýt cần đi
    type: 'LineString'
    coordinates: LngLat[]   // [[lng, lat], [lng, lat], ...] — thứ tự GeoJSON
  }
}
```

---

### 4.4 `frontend/src/services/api.ts` — Thêm vào

```typescript
import type { RouteOption } from '../types'

// Thêm vào object api hoặc export riêng:
export const findRoute = async (params: {
  from_lat: number
  from_lng: number
  to_lat: number
  to_lng: number
  buffer?: number  // mét, default 1000
}): Promise<RouteOption[]> => {
  const query = new URLSearchParams({
    from_lat: String(params.from_lat),
    from_lng: String(params.from_lng),
    to_lat:   String(params.to_lat),
    to_lng:   String(params.to_lng),
    buffer:   String(params.buffer ?? 1000),
  })
  const res = await fetch(`${BASE_URL}/find-route/?${query}`)
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error ?? `API error ${res.status}`)
  }
  return res.json()
}
```

---

### 4.5 `frontend/src/hooks/useRouteSearch.ts` — Tạo mới

Hook này **chỉ lo gọi API** — không biết gì về map hay UI.

```typescript
import { useState, useEffect } from 'react'
import { findRoute } from '../services/api'
import type { LatLng } from './usePointSelection'
import type { RouteOption } from '../types'

type SearchStatus = 'idle' | 'loading' | 'success' | 'error'

export const useRouteSearch = (
  fromPoint: LatLng | null,
  toPoint: LatLng | null,
  bufferRadius: number,
) => {
  const [results, setResults]   = useState<RouteOption[]>([])
  const [status, setStatus]     = useState<SearchStatus>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    // Chỉ gọi API khi có đủ 2 điểm
    if (!fromPoint || !toPoint) {
      setStatus('idle')
      setResults([])
      return
    }

    // AbortController để hủy request cũ nếu params thay đổi
    // (ví dụ: user kéo slider nhanh → chỉ giữ request cuối cùng)
    const controller = new AbortController()

    const search = async () => {
      setStatus('loading')
      setErrorMsg(null)
      try {
        const data = await findRoute({
          from_lat: fromPoint.lat,
          from_lng: fromPoint.lng,
          to_lat:   toPoint.lat,
          to_lng:   toPoint.lng,
          buffer:   bufferRadius,
        })
        if (!controller.signal.aborted) {
          setResults(data)
          setStatus('success')
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setErrorMsg(err instanceof Error ? err.message : 'Lỗi không xác định')
          setStatus('error')
          setResults([])
        }
      }
    }

    search()
    return () => controller.abort()  // cleanup: hủy request nếu effect re-run
  }, [fromPoint, toPoint, bufferRadius])

  return { results, status, errorMsg }
}
```

---

### 4.6 `frontend/src/components/search/RouteResultPanel.tsx` — Tạo mới

```typescript
import type { RouteOption } from '../../types'

interface Props {
  status: 'idle' | 'loading' | 'success' | 'error'
  results: RouteOption[]
  errorMsg: string | null
  onSelectRoute: (option: RouteOption) => void
  selectedRouteId: number | null
}

export const RouteResultPanel = ({
  status, results, errorMsg, onSelectRoute, selectedRouteId,
}: Props) => {
  // Không hiển thị gì khi chưa tìm kiếm
  if (status === 'idle') return null

  return (
    // Sliding panel từ phải vào, không che hết bản đồ
    <div className="absolute top-16 right-4 bottom-4 w-72 z-10 flex flex-col">
      <div className="bg-white rounded-xl shadow-lg flex flex-col overflow-hidden h-full">

        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-100">
          {status === 'loading' && (
            <div className="flex items-center gap-2 text-gray-500">
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm">Đang tìm kiếm...</span>
            </div>
          )}
          {status === 'success' && (
            <p className="text-sm font-semibold text-gray-700">
              Tìm được {results.length} tuyến
            </p>
          )}
          {status === 'error' && (
            <p className="text-sm text-red-500">{errorMsg}</p>
          )}
        </div>

        {/* Danh sách tuyến */}
        {status === 'success' && (
          <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
            {results.map((option) => (
              <RouteOptionCard
                key={option.route.id}
                option={option}
                isSelected={selectedRouteId === option.route.id}
                onSelect={() => onSelectRoute(option)}
              />
            ))}
          </div>
        )}

      </div>
    </div>
  )
}

// ── Card cho từng tuyến ──────────────────────────────────────────────────────

const RouteOptionCard = ({
  option, isSelected, onSelect,
}: {
  option: RouteOption
  isSelected: boolean
  onSelect: () => void
}) => {
  const { route, from_stop, to_stop, stop_count, distance_m } = option

  return (
    <div className={`p-4 space-y-2 transition-colors ${isSelected ? 'bg-red-50' : 'hover:bg-gray-50'}`}>

      {/* Số tuyến — luôn hiển thị */}
      <p className="font-bold text-base text-gray-800">Tuyến {route.ref}</p>

      {/* Tên tuyến — chỉ hiển thị nếu có */}
      {route.name && (
        <p className="text-xs text-gray-500">{route.name}</p>
      )}

      {/* Trạm lên/xuống — chỉ hiển thị nếu có tên */}
      <div className="space-y-0.5 text-sm">
        {from_stop.name && (
          <p className="text-green-700">
            <span className="font-medium">Lên:</span> {from_stop.name}
          </p>
        )}
        {to_stop.name && (
          <p className="text-red-700">
            <span className="font-medium">Xuống:</span> {to_stop.name}
          </p>
        )}
      </div>

      {/* Giá vé và tần suất — chỉ hiển thị nếu có */}
      <div className="text-xs text-gray-500 space-y-0.5">
        {route.charge   && <p>Giá vé: {route.charge}</p>}
        {route.interval && <p>Tần suất: {route.interval}</p>}
      </div>

      {/* Khoảng cách và số trạm — luôn hiển thị (tính từ PostGIS) */}
      <div className="flex items-center gap-3 text-xs text-gray-600">
        <span>📏 {(distance_m / 1000).toFixed(1)} km</span>
        <span>🚏 {stop_count} trạm</span>
      </div>

      {/* Nút chọn */}
      <button
        onClick={onSelect}
        className={`w-full mt-1 py-1.5 px-3 rounded-lg text-sm font-medium transition-colors ${
          isSelected
            ? 'bg-red-500 text-white'
            : 'bg-gray-100 text-gray-700 hover:bg-red-500 hover:text-white'
        }`}
      >
        {isSelected ? '✓ Đang xem' : 'Chọn tuyến này'}
      </button>
    </div>
  )
}
```

---

### 4.7 `frontend/src/App.tsx` — Cập nhật hoàn chỉnh

```typescript
import { useRef, useEffect, useState } from 'react'
import { useMap } from './hooks/useMap'
import { usePointSelection } from './hooks/usePointSelection'
import { useRouteSearch } from './hooks/useRouteSearch'
import { SelectionControls } from './components/map/SelectionControls'
import { RouteResultPanel } from './components/search/RouteResultPanel'
import Header from './components/layout/Header'
import type { RouteOption } from './types'

const App = () => {
  const mapDivRef = useRef<HTMLDivElement>(null)
  const [selectedRoute, setSelectedRoute] = useState<RouteOption | null>(null)

  // F01: quản lý state chọn điểm
  const {
    fromPoint, toPoint, mode, bufferRadius,
    activateMode, handleMapClick, setFromGPS, setBufferRadius, clear,
  } = usePointSelection()

  // F02: tìm tuyến khi đủ 2 điểm
  const { results, status, errorMsg } = useRouteSearch(fromPoint, toPoint, bufferRadius)

  // Map + VectorLayers
  const { mapRef, drawSelectionMarkers, drawRouteResult, clearResult } = useMap(
    mapDivRef,
    mode ? handleMapClick : undefined,  // chỉ lắng nghe click khi mode active
  )

  // Vẽ lại markers khi điểm hoặc buffer thay đổi
  useEffect(() => {
    drawSelectionMarkers({ from: fromPoint, to: toPoint, bufferRadius })
  }, [fromPoint, toPoint, bufferRadius, drawSelectionMarkers])

  // Xóa route result khi người dùng xóa điểm hoặc buffer thay đổi
  useEffect(() => {
    clearResult()
    setSelectedRoute(null)
  }, [fromPoint, toPoint, bufferRadius, clearResult])

  // Vẽ route khi người dùng chọn 1 tuyến
  const handleSelectRoute = (option: RouteOption) => {
    setSelectedRoute(option)
    drawRouteResult(option)  // vẽ đường đỏ + zoom
  }

  return (
    <div className="relative w-full h-full">
      {/* Map container */}
      <div
        ref={mapDivRef}
        className={`absolute inset-0 ${mode ? 'cursor-crosshair' : ''}`}
      />

      {/* Overlays */}
      <Header />

      <SelectionControls
        mode={mode}
        fromPoint={fromPoint}
        toPoint={toPoint}
        bufferRadius={bufferRadius}
        onActivateMode={activateMode}
        onSetFromGPS={setFromGPS}
        onSetBufferRadius={setBufferRadius}
        onClear={clear}
      />

      <RouteResultPanel
        status={status}
        results={results}
        errorMsg={errorMsg}
        selectedRouteId={selectedRoute?.route.id ?? null}
        onSelectRoute={handleSelectRoute}
      />
    </div>
  )
}

export default App
```

---

## 5. Lỗi Thường Gặp

### Lỗi 1: ST_DWithin tính bằng degrees thay vì mét

```python
# SAI — 0.01 degrees ≈ 1km nhưng không chính xác, thay đổi theo vĩ độ
location__dwithin=(from_point, 0.01)

# ĐÚNG — D(m=1000) → GeoDjango tự thêm ::geography → tính CHÍNH XÁC bằng mét
from django.contrib.gis.measure import D
location__dwithin=(from_point, D(m=1000))
```

---

### Lỗi 2: Point(lat, lng) thay vì Point(lng, lat)

```python
# SAI — (lat, lng) → đảo ngược, trạm ở Hà Nội sẽ bị đẩy ra Bắc Cực
Point(from_lat, from_lng, srid=4326)   # ❌

# ĐÚNG — PostGIS và GeoJSON đều dùng (X, Y) = (longitude, latitude)
Point(from_lng, from_lat, srid=4326)   # ✅
```

---

### Lỗi 3: ST_LineLocatePoint với MultiLineString → crash

```sql
-- SAI — r.path là MultiLineString, ST_LineLocatePoint không chấp nhận
ST_LineLocatePoint(r.path, fs.location)   -- ERROR: arity mismatch

-- ĐÚNG — gộp thành LineString trước
ST_LineLocatePoint(ST_LineMerge(r.path), fs.location)   -- ✅
-- Và phải kiểm tra kết quả LineMerge có thực sự là LineString không
WHERE ST_GeometryType(ST_LineMerge(r.path)) = 'ST_LineString'
```

---

### Lỗi 4: AbortController không được dùng trong useRouteSearch

```typescript
// SAI — nếu không abort, khi user kéo slider nhanh:
// request cũ hoàn thành SAU request mới → overwrite kết quả đúng bằng kết quả cũ!
useEffect(() => {
  findRoute(params).then(setResults)
}, [fromPoint, toPoint, bufferRadius])

// ĐÚNG — abort request cũ khi effect re-run
useEffect(() => {
  const controller = new AbortController()
  findRoute(params, controller.signal).then(data => {
    if (!controller.signal.aborted) setResults(data)
  })
  return () => controller.abort()
}, [fromPoint, toPoint, bufferRadius])
```

---

### Lỗi 5: OSM fields null → render crash

```typescript
// SAI — route.name có thể null → TypeError: Cannot read properties of null
<p>{route.name.toUpperCase()}</p>

// ĐÚNG — kiểm tra null trước khi render (và luôn có fallback hoặc bỏ qua)
{route.name && <p>{route.name}</p>}
```

---

### Lỗi 6: Quên select_related → N+1 query

```python
# SAI — với 5 tuyến × 10 trạm = 50 extra queries!
stops_qs = RouteStop.objects.filter(route_id=route_id, ...)
for rs in stops_qs:
    print(rs.stop.name)  # ← mỗi dòng này là 1 query thêm

# ĐÚNG — 1 query JOIN duy nhất
stops_qs = RouteStop.objects.filter(
    route_id=route_id, ...
).select_related('stop')  # ✅ prefetch stop trong cùng query
```

---

## 6. Verification

### Backend (test với curl trước khi code frontend)

```bash
# Test 1: Tìm thấy tuyến (tọa độ trong vùng dữ liệu Tây Hồ)
curl "http://localhost:8000/api/find-route/?from_lat=21.0557&from_lng=105.8047&to_lat=21.0735&to_lng=105.8010&buffer=1000"
# Expect: JSON array với sub_route.type = "LineString", distance_m > 0

# Test 2: Buffer quá nhỏ → 404 với thông báo rõ ràng
curl "http://localhost:8000/api/find-route/?from_lat=21.0557&from_lng=105.8047&to_lat=21.0735&to_lng=105.8010&buffer=10"
# Expect: {"error": "Không có trạm xe buýt trong phạm vi 10m tại điểm đi"}

# Test 3: Thiếu tham số → 400
curl "http://localhost:8000/api/find-route/?from_lat=21.05"
# Expect: {"error": "Thiếu hoặc sai tham số tọa độ"}
```

### Frontend

```
✅ Chọn đủ 2 điểm → panel kết quả tự động hiện, spinner xuất hiện
✅ Panel hiển thị danh sách tuyến với thông tin đúng
✅ Field null (name, charge...) → KHÔNG render, không crash
✅ distance_m và stop_count → luôn hiển thị
✅ Click [Chọn tuyến này] → đường đỏ đậm trên bản đồ + bản đồ zoom vừa đoạn đường
✅ Kéo slider buffer → API được gọi lại, kết quả cập nhật
✅ Click [🔄 Xóa] → panel kết quả biến mất, đường đỏ biến mất
✅ Không có tuyến nào → hiển thị thông báo "Thử tăng buffer"
```
