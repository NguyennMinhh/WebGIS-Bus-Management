# DD-07 — Developer Guide (Hướng Dẫn Cho Developer Mới)

> **Loại tài liệu:** Design Document
> **Phiên bản:** 2.0
> **Cập nhật lần cuối:** 2026-04-18
> **Trạng thái:** Current

---

## 1. Đọc Tài Liệu Theo Thứ Tự Này

Nếu bạn vừa join dự án, đọc theo thứ tự sau:

1. **[FD-01](../FD/FD-01_Tong_Quan_Du_An.md)** — Hiểu dự án là gì, làm gì
2. **[FD-02](../FD/FD-02_Chuc_Nang_He_Thong.md)** — Danh sách tính năng, cái nào đã làm, cái nào chưa
3. **[DD-01](./DD-01_Kien_Truc_Tong_The.md)** — Kiến trúc tổng thể, services, luồng dữ liệu
4. **[DD-06](./DD-06_Infrastructure_Deployment.md)** — Cách chạy dự án trên máy local
5. **[DD-02](./DD-02_Database_Design.md)** — Database schema
6. **[DD-03](./DD-03_Backend_Design.md)** — Backend code
7. **[DD-04](./DD-04_Frontend_Design.md)** — Frontend code
8. **[DD-05](./DD-05_GIS_Spatial_Design.md)** — GIS/spatial chi tiết (đọc khi cần implement F-12)

---

## 2. Setup Máy Lần Đầu

**Mô hình chạy:** PostgreSQL + Backend + Frontend chạy **native trên Windows**, chỉ **GeoServer trong Docker**. Xem chi tiết đầy đủ tại [configure/SETUP.md](../../configure/SETUP.md).

### Bước 1: Clone & Chuẩn bị

```bash
git clone <repo-url>
cd WebGIS-BusRouting
copy .env.example .env
```

Sửa `.env`: đặt `POSTGRES_PASSWORD` và `GDAL_LIBRARY_PATH` / `GEOS_LIBRARY_PATH` trỏ vào folder `bin\` của PostgreSQL đã cài (phải có `libwinpthread-1.dll` trong cùng folder).

### Bước 2: Cài PostgreSQL + PostGIS (native)

1. Tải PostgreSQL 16/18 installer → chạy installer
2. Sau khi cài, dùng Stack Builder để cài **PostGIS**
3. Tạo database:
```sql
CREATE DATABASE busrouting;
\c busrouting
CREATE EXTENSION postgis;
```

### Bước 3: Setup Python venv & Django

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r backend/requirements.txt

cd backend
python manage.py migrate
python manage.py createsuperuser
```

### Bước 4: Khởi động GeoServer (Docker)

```bash
docker compose up -d
# Đợi khoảng 60–90 giây cho GeoServer boot
```

### Bước 5: Import dữ liệu

```bash
cd backend
python manage.py import_geojson ../data/tay-ho-datas.geojson
```

### Bước 6: Cấu hình GeoServer

1. Mở http://localhost:8600/geoserver/web/
2. Login: admin / geoserver (hoặc giá trị trong `.env`)
3. Tạo **Workspace** → Name: `busrouting`, Namespace URI: `http://busrouting`
4. Tạo **Store** → PostGIS:
   - Workspace: busrouting
   - Data source name: busrouting_postgis
   - Host: **`host.docker.internal`** (GeoServer chạy trong Docker, cần hostname này để gọi về PostgreSQL trên Windows host)
   - Port: 5432
   - Database: busrouting, User: postgres, Password: <từ .env>
5. Publish layer `routes_busroute` và `routes_busstop`
6. Với mỗi layer: set Native/Declared SRS = **EPSG:4326**, bounding box = "Compute from data"

### Bước 7: Khởi động Frontend

```bash
cd frontend
npm install
npm run dev
```

Mở http://localhost:5173 → bản đồ hiển thị các tuyến xe buýt.

---

## 3. Cấu Trúc File — Tóm Tắt Nhanh

```
WebGIS-BusRouting/
├── .env                          ← Cấu hình secrets (không commit)
├── .env.example                  ← Mẫu .env (có commit)
├── docker-compose.yml            ← Chỉ có service geoserver
├── configure/SETUP.md            ← Hướng dẫn setup chi tiết cho Windows
│
├── backend/
│   ├── backend/settings.py       ← Cấu hình Django (DB, CORS, apps)
│   ├── routes/models.py          ← BusRoute, BusStop, RouteStop models
│   ├── routes/admin.py           ← GIS Admin interface
│   └── routes/management/commands/import_geojson.py  ← Import pipeline
│
├── frontend/
│   ├── src/hooks/useMap.ts       ← ⭐ Core: khởi tạo OpenLayers map
│   ├── src/utils/mapConfig.ts    ← ⭐ Config GeoServer URL + layer names
│   ├── src/services/api.ts       ← HTTP client
│   └── src/types/index.ts        ← TypeScript interfaces
│
├── data/
│   └── tay-ho-datas.geojson      ← Dữ liệu OSM (mount vào Docker)
│
└── documents/
    ├── FD/                       ← Functional Documents
    └── DD/                       ← Design Documents (file này)
```

---

## 4. Workflow Phát Triển Thường Ngày

### 4.1 Thêm tính năng backend (API endpoint mới)

```
1. Thêm code vào routes/serializers.py (Serializer class)
2. Thêm code vào routes/views.py (ViewSet/APIView)
3. Đăng ký URL trong routes/urls.py
4. Test: curl http://localhost:8000/api/<endpoint>/
```

Ví dụ thêm API list routes:
```python
# routes/serializers.py
class BusRouteListSerializer(serializers.ModelSerializer):
    class Meta:
        model = BusRoute
        fields = ['id', 'ref', 'name', 'from_stop', 'to_stop']

# routes/views.py
from rest_framework import viewsets
class BusRouteViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = BusRoute.objects.all()
    serializer_class = BusRouteListSerializer

# routes/urls.py
from rest_framework.routers import DefaultRouter
router = DefaultRouter()
router.register(r'routes', BusRouteViewSet)
urlpatterns = router.urls
```

### 4.2 Thêm model field mới

```bash
cd backend
python manage.py makemigrations
python manage.py migrate
```

### 4.3 Thêm component frontend mới

```
1. Tạo file trong frontend/src/components/
2. Import và dùng trong App.tsx hoặc component cha
3. Vite auto-reload → thấy thay đổi ngay
```

### 4.4 Debug backend

```bash
# Django shell
cd backend
python manage.py shell

# psql
psql -U postgres -d busrouting
```

### 4.5 Debug frontend

- Terminal chạy `npm run dev` hiển thị lỗi Vite
- Browser DevTools → Console cho lỗi runtime và network tab cho API calls

---

## 5. Conventions & Code Style

### 5.1 Backend (Django/Python)

**Naming:**
- Models: PascalCase (`BusRoute`, `BusStop`)
- Fields: snake_case (`osm_id`, `from_stop`)
- Functions: snake_case (`_import_routes`, `_compute_sequences`)
- Management commands: snake_case filenames (`import_geojson.py`)

**Quan trọng:**
- Luôn dùng `update_or_create` thay vì `create` khi import dữ liệu OSM
- Spatial fields: luôn khai báo `srid=4326` rõ ràng
- Raw SQL chỉ dùng khi ORM không đủ (như `_compute_sequences`)

### 5.2 Frontend (React/TypeScript)

**Naming:**
- Components: PascalCase files + function name (`MapView.tsx`, `function MapView()`)
- Hooks: `use` prefix (`useMap.ts`)
- Services: camelCase (`api.ts`)
- Types: PascalCase interfaces (`BusRoute`, `BusStop`)
- Constants: UPPER_SNAKE (`MAP_CENTER`, `MAP_ZOOM`)

**Patterns:**
- Custom hooks cho logic phức tạp (không để logic trong component)
- Barrel exports qua `index.ts` trong mỗi folder
- TypeScript interfaces trong `types/index.ts`
- Environment variables qua `import.meta.env.VITE_*`

---

## 6. Các Cạm Bẫy Thường Gặp (Gotchas)

### 6.1 "GeoServer không hiển thị data sau khi import"

**Nguyên nhân:** GeoServer cache tile cũ.
**Giải pháp:**
```
GeoServer Admin → Tile Caching → Truncate All (hoặc Seed/Truncate từng layer)
```

Hoặc hard refresh browser: `Ctrl+Shift+R`

---

### 6.2 "Sequence của điểm dừng đều = 0"

**Nguyên nhân:** Route geometry có đoạn không liên tục → `ST_LineMerge` không ra LineString → bỏ qua trong `_compute_sequences`.

**Kiểm tra:**
```sql
SELECT r.ref, ST_GeometryType(ST_LineMerge(r.path)) as merged_type
FROM routes_busroute r;
-- Nếu kết quả là 'ST_MultiLineString' → route này không tính được sequence
```

---

### 6.3 "Backend không kết nối được DB"

**Nguyên nhân phổ biến:**
1. PostgreSQL service Windows chưa start → mở `services.msc` → start "postgresql-x64-16/18"
2. `.env` sai `POSTGRES_PASSWORD` hoặc `POSTGRES_HOST`
3. GDAL DLL load fail (sẽ thấy `ImproperlyConfigured: Could not find the GDAL library`) → kiểm tra folder DLL có `libwinpthread-1.dll` không

---

### 6.4 "WMS layer không hiển thị — lỗi 404 hoặc trắng"

**Checklist:**
1. GeoServer đang chạy? `docker compose ps`
2. Layer name đúng? Phải khớp với `LAYER_BUS_ROUTES` trong `mapConfig.ts`
3. Workspace name đúng? `busrouting` không phải `BusRouting`
4. Có dữ liệu trong DB? `SELECT COUNT(*) FROM routes_busroute;`
5. GeoServer có kết nối được DB? Kiểm tra trong GeoServer Admin → Stores. Host phải là **`host.docker.internal`** (không phải `localhost`, không phải `db`)

---

### 6.5 "Tọa độ bị lật (lat/lng nhầm)"

**PostGIS/GeoJSON convention:** `(longitude, latitude)` — kinh độ trước, vĩ độ sau
**Ví dụ Hà Nội:** `(105.8412, 21.0245)` = (lng, lat), KHÔNG phải `(21.0245, 105.8412)`

```python
# Đúng
Point(105.8046867, 21.055715, srid=4326)  # Point(lng, lat)

# Sai
Point(21.055715, 105.8046867, srid=4326)  # Point(lat, lng) — WRONG!
```

---

### 6.6 "CORS error khi frontend gọi API"

**Nguyên nhân:** Frontend origin không được allow.
**Kiểm tra `settings.py`:**
```python
CORS_ALLOWED_ORIGINS = [
    'http://localhost:5173',  # Phải có
]
```

**Lưu ý thứ tự middleware:** `CorsMiddleware` phải **trước** `CommonMiddleware`.

---

### 6.7 "`import.meta.env.VITE_*` là undefined"

**Nguyên nhân:** Vite chỉ inject env vars có prefix `VITE_`.
**Kiểm tra:** File `.env` có `VITE_GEOSERVER_URL=...` chưa?
**Restart Vite** sau khi thay đổi `.env`: dừng `npm run dev` (Ctrl+C) rồi chạy lại.

---

## 7. Testing

### 7.1 Django Backend (chưa có tests)

Kế hoạch thêm tests:
```python
# routes/tests.py
from django.test import TestCase
from django.contrib.gis.geos import Point, MultiLineString, LineString
from .models import BusRoute, BusStop

class BusRouteTest(TestCase):
    def test_route_creation(self):
        route = BusRoute.objects.create(
            osm_id="test_001",
            ref="TEST",
            name="Test Route",
            from_stop="A", to_stop="B",
            path=MultiLineString(LineString((105.8, 21.0), (105.9, 21.1)), srid=4326)
        )
        self.assertEqual(route.ref, "TEST")
```

```bash
cd backend
python manage.py test
```

### 7.2 Frontend (chưa có tests)

Kế hoạch: Vitest + React Testing Library

---

## 8. Git Workflow

```bash
# Tạo branch cho tính năng mới
git checkout -b feature/api-routes-endpoint

# Commit thường xuyên
git add backend/routes/views.py backend/routes/urls.py
git commit -m "feat: add BusRoute list API endpoint"

# Push và tạo PR
git push origin feature/api-routes-endpoint
```

**Commit message convention:**
- `feat:` — tính năng mới
- `fix:` — bug fix
- `docs:` — cập nhật tài liệu
- `refactor:` — cải thiện code không thêm tính năng
- `chore:` — thay đổi config, dependencies

---

## 9. Tóm Tắt Ports & URLs

| Service | URL | Dùng để |
|---------|-----|---------|
| Frontend | http://localhost:5173 | Ứng dụng chính |
| Backend API | http://localhost:8000/api/ | REST API |
| Django Admin | http://localhost:8000/admin/ | Quản lý dữ liệu |
| GeoServer | http://localhost:8600/geoserver/web/ | Config map layers |
| PostgreSQL | localhost:5432 | Kết nối DB từ tools (DBeaver, psql) |

**Database connection string (cho tools như DBeaver):**
```
Host: localhost
Port: 5432
Database: busrouting
User: postgres
Password: postgres
```
