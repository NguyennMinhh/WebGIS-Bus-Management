# DD-06 — Infrastructure & Deployment

> **Loại tài liệu:** Design Document
> **Phiên bản:** 2.0
> **Cập nhật lần cuối:** 2026-04-18
> **Trạng thái:** Current

---

## 1. Tổng Quan Kiến Trúc Chạy

Dự án chạy theo mô hình **hybrid**: hầu hết service chạy **native trên Windows**, chỉ **GeoServer chạy trong Docker**.

| Service | Chạy ở đâu | URL |
|---------|-----------|-----|
| PostgreSQL 16/18 + PostGIS 3.4 | Native Windows (installer) | `localhost:5432` |
| Django backend (Python 3.12) | Native Windows (venv) | `http://localhost:8000` |
| React frontend (Vite) | Native Windows (Node 20+) | `http://localhost:5173` |
| GeoServer 2.25.2 | **Docker** | `http://localhost:8600/geoserver` |

**Lý do chọn hybrid:**
- PostGIS native tránh rắc rối mount volume + hiệu năng tốt hơn
- Backend/frontend native giúp hot reload và debug dễ hơn trên Windows
- GeoServer vẫn để Docker vì cấu hình Java/Jetty phức tạp, Docker image `kartoza/geoserver` đã đóng gói sẵn

---

## 2. Docker Compose

**File:** [docker-compose.yml](../../docker-compose.yml)

Chỉ 1 service duy nhất: `geoserver`.

```yaml
services:
  geoserver:
    image: kartoza/geoserver:2.25.2
    env_file: .env
    environment:
      GEOSERVER_ADMIN_USER: ${GEOSERVER_ADMIN_USER}
      GEOSERVER_ADMIN_PASSWORD: ${GEOSERVER_ADMIN_PASSWORD}
      GEOSERVER_DATA_DIR: /opt/geoserver/data_dir
      GEOWEBCACHE_CACHE_DIR: /opt/geoserver/data_dir/gwc
      CORS_ENABLED: "true"
      CORS_ALLOWED_ORIGINS: "http://localhost:5173"
    volumes:
      - geoserver_data:/opt/geoserver/data_dir
    ports:
      - "8600:8080"

volumes:
  geoserver_data:
```

**Điểm quan trọng:**
- Port 8080 nội bộ → expose ra 8600 trên host (tránh trùng app khác)
- Volume `geoserver_data` giữ lại workspaces, layers, styles giữa các lần restart
- CORS chỉ cho phép origin của frontend dev server

---

## 3. Kết Nối Giữa Các Service

### 3.1 Backend (native) → PostgreSQL (native)
```
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
```
Hai process cùng máy, không cần gì đặc biệt.

### 3.2 GeoServer (Docker) → PostgreSQL (native trên host)
GeoServer chạy trong container, nếu dùng `localhost` sẽ trỏ vào chính container đó. Docker Desktop trên Windows cung cấp hostname đặc biệt:
```
Host: host.docker.internal
Port: 5432
```
Đây là điểm **dễ nhầm nhất** khi cấu hình GeoServer PostGIS Store.

### 3.3 Frontend (native) → Backend (native)
Vite dev server proxy `/api` sang `http://localhost:8000` (xem [vite.config.ts](../../frontend/vite.config.ts)).

### 3.4 Frontend (browser) → GeoServer (Docker)
Browser gọi trực tiếp `http://localhost:8600/geoserver/...` nên phải bật CORS trong container GeoServer.

---

## 4. GDAL / GEOS trên Windows

GeoDjango cần GDAL và GEOS DLL. Trên Windows, DLL lấy từ folder `bin\` của PostgreSQL:

```
GDAL_LIBRARY_PATH=D:/MinhApp/PostgreSQL/18/bin/libgdal-35.dll
GEOS_LIBRARY_PATH=D:/MinhApp/PostgreSQL/18/bin/libgeos_c.dll
```

**Yêu cầu bắt buộc:** folder chứa DLL phải có `libwinpthread-1.dll`. Nếu không, mọi DLL biên dịch bằng MinGW sẽ load fail im lặng.

Trong [backend/backend/settings.py](../../backend/backend/settings.py), `os.add_dll_directory()` thêm folder này vào search path cho Python 3.8+.

---

## 5. Environment Variables

**File:** [.env](../../.env) (không commit) — **Mẫu:** [.env.example](../../.env.example)

```bash
# PostgreSQL (native install)
POSTGRES_DB=busrouting
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_HOST=localhost
POSTGRES_PORT=5432

# Django
DJANGO_SECRET_KEY=...
DJANGO_DEBUG=True
DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1

# GDAL/GEOS DLL paths (Windows)
GDAL_LIBRARY_PATH=D:/MinhApp/PostgreSQL/18/bin/libgdal-35.dll
GEOS_LIBRARY_PATH=D:/MinhApp/PostgreSQL/18/bin/libgeos_c.dll

# GeoServer (Docker)
GEOSERVER_ADMIN_USER=admin
GEOSERVER_ADMIN_PASSWORD=geoserver

# Frontend (VITE_ prefix = exposed to browser bundle)
VITE_API_URL=http://localhost:8000/api
VITE_GEOSERVER_URL=http://localhost:8600/geoserver
VITE_GEOSERVER_WORKSPACE=busrouting
```

---

## 6. Quy Trình Khởi Động Hằng Ngày

```bash
# Terminal 1 — GeoServer (chỉ service duy nhất trong Docker)
docker compose up -d

# Terminal 2 — Backend
cd backend
..\.venv\Scripts\activate
python manage.py runserver

# Terminal 3 — Frontend
cd frontend
npm run dev
```

PostgreSQL được Windows khởi động tự động ở dạng service (xem `services.msc` → PostgreSQL 16/18).

---

## 7. Các Lệnh Thường Dùng

### 7.1 Django (chạy native, không qua Docker)
```bash
cd backend
python manage.py migrate
python manage.py createsuperuser
python manage.py import_geojson ../data/tay-ho-datas.geojson
python manage.py shell
```

### 7.2 PostgreSQL
```bash
# Mở psql (dùng PATH của PostgreSQL cài native)
psql -U postgres -d busrouting

# Kiểm tra PostGIS
psql -U postgres -d busrouting -c "SELECT PostGIS_Version();"
```

### 7.3 GeoServer (Docker)
```bash
docker compose up -d
docker compose logs -f geoserver
docker compose down          # giữ volume
docker compose down -v       # XÓA volume → mất config GeoServer
docker compose restart geoserver
```

---

## 8. Checklist Sau Khi Setup Lần Đầu

```
□ PostgreSQL service đang chạy (services.msc)
□ Database busrouting đã được tạo + CREATE EXTENSION postgis
□ .env điền đúng GDAL_LIBRARY_PATH, GEOS_LIBRARY_PATH
□ python manage.py migrate → 0 errors
□ python manage.py check → System check identified no issues
□ docker compose up -d → geoserver running
□ http://localhost:8600/geoserver/web/ → login OK
□ Cấu hình PostGIS Store với Host = host.docker.internal (xem DD-05)
□ Import data: python manage.py import_geojson ../data/tay-ho-datas.geojson
□ http://localhost:5173 → map hiển thị
□ http://localhost:8000/admin/routes/busroute/ → có dữ liệu
```

---

## 9. Backup & Restore

### 9.1 PostgreSQL (native)
```bash
# Backup
pg_dump -U postgres -Fc busrouting > busrouting.dump

# Restore
pg_restore -U postgres -d busrouting_new busrouting.dump
```

### 9.2 GeoServer (Docker volume)
```bash
# Backup volume
docker run --rm -v webgis-busrouting_geoserver_data:/data -v ${PWD}:/backup `
  alpine tar czf /backup/geoserver_backup.tar.gz /data
```

---

## 10. Production Deployment Notes

| Hạng mục | Dev (hiện tại) | Production |
|---------|----------------|-----------|
| Backend | `runserver` | Gunicorn/Uvicorn + Nginx |
| Frontend | `vite dev` | `npm run build` → Nginx serve `dist/` |
| PostgreSQL | Native Windows | Managed service (RDS, Cloud SQL) |
| GeoServer | Docker trên dev | Docker trên VPS / K8s |
| Secret key | Dev key trong .env | Secrets manager |
| Debug | `True` | `False` |
| HTTPS | Không | Bắt buộc |
| CORS | `localhost:5173` | Production domain |
| Database backup | Manual | Automated (pg_dump cron) |
