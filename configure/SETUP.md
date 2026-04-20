# Local Development Setup

This guide walks you through setting up the WebGIS Bus Routing project on your Windows machine from scratch.

## What runs where

| Service | Where it runs | URL |
|---------|--------------|-----|
| Django backend | Your machine (Python) | http://localhost:8000 |
| React frontend | Your machine (Node) | http://localhost:5173 |
| PostgreSQL + PostGIS | Your machine (native install) | localhost:5432 |
| GeoServer | Docker | http://localhost:8600/geoserver |

---

## Prerequisites

Install these before starting:

1. **Python 3.12+** — https://www.python.org/downloads/
2. **Node.js 20+** — https://nodejs.org/
3. **Docker Desktop** — https://www.docker.com/products/docker-desktop/
4. **PostgreSQL 16 with PostGIS** — see step below

---

## Step 1 — Install PostgreSQL + PostGIS on Windows

1. Download the PostgreSQL 16 installer from https://www.enterprisedb.com/downloads/postgres-postgresql-downloads
2. Run the installer. When it finishes, **open Stack Builder** (it launches automatically).
3. In Stack Builder, select your PostgreSQL 16 installation, then find **Spatial Extensions → PostGIS** and install it.
4. After installation, open pgAdmin or psql and create the database:

```sql
CREATE DATABASE busrouting;
\c busrouting
CREATE EXTENSION postgis;
```

---

## Step 2 — Find your GDAL DLL path (required for GeoDjango on Windows)

GeoDjango needs GDAL and GEOS library files. After installing PostgreSQL + PostGIS, these DLLs are usually in:

```
C:\Program Files\PostgreSQL\16\bin\
```

On **this machine**, the working DLL paths are:

```
GDAL_LIBRARY_PATH=D:/MinhApp/PostgreSQL/18/bin/libgdal-35.dll
GEOS_LIBRARY_PATH=D:/MinhApp/PostgreSQL/18/bin/libgeos_c.dll
```

These are already set in `.env`. The key requirement is that the folder containing the DLLs **must also contain `libwinpthread-1.dll`** — without it, all the GCC-compiled DLLs (GDAL, GEOS, PROJ) will silently fail to load. The `C:\Program Files\PostgreSQL\18\bin\` folder is missing this file; `D:\MinhApp\PostgreSQL\18\bin\` has it.

> **On a different machine:** Look in your PostgreSQL `bin\` folder. Filenames change with version (e.g., `gdal309.dll` on PG16, `libgdal-35.dll` on PG18). If loading fails, check that `libwinpthread-1.dll` is in the same folder.
>
> **Tip:** Use forward slashes (`/`) in `.env` paths, not backslashes.

---

## Step 3 — Configure your .env file

Copy `.env.example` to `.env` (it may already exist):

```bash
copy .env.example .env
```

Open `.env` and verify these values match your local PostgreSQL setup:

```
POSTGRES_DB=busrouting
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_postgres_password
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
```

---

## Step 4 — Set up the Python virtual environment

```bash
# From the project root
python -m venv .venv

# Activate it (Windows)
.venv\Scripts\activate

# Install dependencies
pip install -r backend/requirements.txt
```

---

## Step 5 — Run Django migrations

```bash
cd backend
python manage.py migrate
python manage.py createsuperuser   # optional, for Django admin
```

---

## Step 6 — Start GeoServer (Docker)

```bash
# From the project root (where docker-compose.yml is)
docker compose up -d
```

This starts only GeoServer. Wait about 60–90 seconds for it to finish booting, then open:

- http://localhost:8600/geoserver/web/
- Login: `admin` / `geoserver` (or whatever you set in .env)

### Connect GeoServer to your local PostGIS

In the GeoServer web UI:

1. Go to **Stores → Add new store → PostGIS**
2. Fill in:
   - Host: `host.docker.internal` ← this is how Docker reaches your local machine
   - Port: `5432`
   - Database: `busrouting`
   - User: `postgres`
   - Password: your password
3. Save, then publish layers from this store.

> **Why `host.docker.internal`?** GeoServer runs inside Docker. From inside Docker, `localhost` means the container itself, not your Windows machine. `host.docker.internal` is the special Docker Desktop hostname that points to your actual machine.

---

## Step 7 — Start the backend

```bash
# Make sure your .venv is activated and you are in the backend folder
cd backend
python manage.py runserver
```

Backend is available at http://localhost:8000/api/

---

## Step 8 — Start the frontend

```bash
# Open a new terminal, from the project root
cd frontend
npm install        # only needed the first time
npm run dev
```

Frontend is available at http://localhost:5173/

---

## Daily startup (after everything is installed)

```bash
# Terminal 1 — start GeoServer
docker compose up -d

# Terminal 2 — start Django
cd backend
.venv\Scripts\activate
python manage.py runserver

# Terminal 3 — start React
cd frontend
npm run dev
```

---

## Import sample data (optional)

```bash
cd backend
python manage.py import_geojson ../data/tay-ho-datas.geojson
```

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `ImproperlyConfigured: Could not find the GDAL library` | Set `GDAL_LIBRARY_PATH` in `.env` to the full path of your `gdal*.dll` |
| `django.db.utils.OperationalError: could not connect to server` | Make sure PostgreSQL is running (`services.msc` → PostgreSQL 16) |
| GeoServer not reachable | Wait longer — it takes 60–90s to boot. Check with `docker compose logs geoserver` |
| GeoServer can't connect to PostGIS | Use `host.docker.internal` as the host, not `localhost` |
| CORS error in browser | Make sure Django is running on port 8000 and frontend on 5173 |
