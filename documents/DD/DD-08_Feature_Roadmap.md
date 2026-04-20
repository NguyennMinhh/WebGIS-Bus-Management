# DD-08 — Feature Roadmap & Architecture Plan

This document covers the planned features, what structural work is needed before building them, and the recommended build order. No code is implemented here — this is the decision record for the next phase.

---

## Architecture Assessment

### What is good and stays as-is

| Layer | Status | Why |
|-------|--------|-----|
| 3-table model (BusRoute / BusStop / RouteStop) | ✅ Keep | Minimum viable schema for bus routing. No extra tables needed for planned features. |
| `RouteStop.sequence` field | ✅ Keep | Essential for ordered stop lists and path-segment queries |
| `BusRoute.path` (MultiLineString) | ✅ Keep | Supports `ST_LineLocatePoint` and `ST_LineSubstring` for distance analysis |
| `BusStop.location` (Point) | ✅ Keep | Supports `ST_DWithin` for proximity queries — the core of the route finder |
| Django Admin + GeoAdmin | ✅ Keep | Covers the CRUD requirement for admin users with zero extra code |
| `import_geojson` management command | ✅ Keep, refactor | Good logic, but needs extraction to a service module before an API endpoint can reuse it |
| DRF serializers (3 classes) | ✅ Keep | `RouteStopWithSequenceSerializer` is unused now but needed for route finder response |
| Frontend folder structure | ✅ Keep | Clean scaffold — hooks / components / services / types / utils is the right separation |
| `useMap` hook + OpenLayers | ✅ Keep | Good foundation for adding vector layers and click events |

### What was already cleaned up

- `routes/urls.py` — was empty; wired up `/api/stops/` and `/api/routes/`
- `vite.config.ts` — proxy pointed at Docker hostname `backend:8000`; updated to `localhost:8000`
- `views.py` — `BusRouteSerializer` import mismatch fixed to `BusRouteInfoSerializer`
- Python 3.14 venv → Python 3.12 (psycopg2-binary has no 3.14 wheel)
- `settings.py` env var names aligned with `.env` (`POSTGRES_*`, `DJANGO_*`)

### The one structural issue

`management/commands/import_geojson.py` contains all the import business logic inside a `Command` class. When you add a user-facing upload API endpoint, that endpoint will need to call the same logic. If you don't extract it first, you'll end up duplicating ~150 lines.

**Fix before building the import API:**
```
backend/routes/
  services/
    __init__.py
    import_service.py   ← move _import_routes, _import_stops, _compute_sequences here
  management/commands/
    import_geojson.py   ← becomes a thin wrapper that calls import_service
```

This is the only refactoring needed before expanding the project.

---

## Planned Features

### F1 — Point Selection (geolocation + map click)

**What the user does:** Click "Use my location" or click on the map to set a start point, then click again to set a destination.

**Where it lives:** Frontend only. No backend changes.

**Frontend additions:**

```
src/
  hooks/
    useMapClick.ts      ← attach OpenLayers click event, return LngLat
    useGeolocation.ts   ← wrap navigator.geolocation.getCurrentPosition
  components/
    search/
      SearchPanel.tsx   ← "From" / "To" inputs with geolocation button
      PointMarker.tsx   ← render a pin on the map for selected points
```

**State:**
```ts
// In App.tsx (or a simple context if it gets complex)
const [fromPoint, setFromPoint] = useState<LngLat | null>(null)
const [toPoint, setToPoint]     = useState<LngLat | null>(null)
```

No external state management library needed. React `useState` in `App.tsx` passed down as props is enough for this scale.

**Map interaction:**
- First click after "From" button → sets `fromPoint`, draws a pin
- First click after "To" button → sets `toPoint`, draws a pin
- Uses OpenLayers `VectorLayer` + `VectorSource` + `Feature` with `Point` geometry

---

### F2 — Bus Route Finder (PostGIS analysis)

**What the user does:** After setting from/to points, clicks "Find Routes". The map shows matching bus routes with board/alight stops highlighted.

**Backend additions:**

New endpoint: `POST /api/find-route/`

Request body:
```json
{
  "from_lng": 105.8412,
  "from_lat": 21.0245,
  "to_lng":   105.8502,
  "to_lat":   21.0182,
  "buffer_m": 300
}
```

Algorithm (one Django view, pure PostGIS):
```
1. Find stops within buffer_m of from_point  →  from_stops[]
2. Find stops within buffer_m of to_point    →  to_stops[]
3. Find BusRoutes that have stops in BOTH sets  →  candidate_routes[]
4. For each route:
   a. Pick the from_stop with lowest sequence in that route  →  board_stop
   b. Pick the to_stop with highest sequence > board_stop    →  alight_stop
   c. Walk distance from_point → board_stop  (ST_Distance in meters, EPSG:3857)
   d. Walk distance alight_stop → to_point
   e. Extract the ride segment of the route using ST_LineSubstring
5. Sort by (walk_from + walk_to) ascending
6. Return top 5 options
```

**Direct routes only** — no transfers in this first version. Transfers (bus A → bus B via a shared stop) are a harder problem; build that later as a separate feature once direct routing works.

**Sub-route visualization (key simplification):**
Instead of drawing the whole bus route polyline, compute and return ONLY the segment the user actually rides (board stop → alight stop). This is what the user sees on the map — a single clean line from where they board to where they get off.

```sql
-- For each candidate route, compute the sub-route geometry
WITH merged AS (
  SELECT ST_LineMerge(path) AS line FROM routes_busroute WHERE id = :route_id
)
SELECT ST_AsGeoJSON(
  ST_LineSubstring(
    line,
    ST_LineLocatePoint(line, :board_stop_location),
    ST_LineLocatePoint(line, :alight_stop_location)
  )
) AS sub_route
FROM merged;
```

- `ST_LineMerge(path)` converts the `MultiLineString` into a single `LineString` (when possible)
- `ST_LineLocatePoint(line, point)` returns a fraction in `[0, 1]` — where along the line the stop is
- `ST_LineSubstring(line, start_fraction, end_fraction)` extracts that slice of the line

**Caveat:** `ST_LineMerge` only returns a clean `LineString` when the `MultiLineString` is topologically continuous. For routes with gaps, fall back to returning the full `path` (or skip sub-route and let the frontend highlight the whole route). See DD-05 §5.2 for the query pattern.

PostGIS functions used:
- `ST_DWithin(location, ST_SetSRID(ST_MakePoint(lng, lat), 4326), buffer_deg)` — find nearby stops
- `ST_Distance(ST_Transform(location, 3857), ST_Transform(point, 3857))` — distance in meters
- `ST_LineMerge`, `ST_LineLocatePoint`, `ST_LineSubstring` — extract the ride segment

New serializer:
```python
class RouteOptionSerializer(serializers.Serializer):
    route = BusRouteInfoSerializer()
    board_stop = BusStopSerializer()
    alight_stop = BusStopSerializer()
    walk_from_m = serializers.FloatField()
    walk_to_m = serializers.FloatField()
    sub_route_geojson = serializers.JSONField()   # ST_LineSubstring result
```

Frontend draws `sub_route_geojson` as a highlighted polyline + 2 pins (board_stop, alight_stop) + 2 dashed walk lines (from_point → board_stop, alight_stop → to_point).

**Frontend additions:**
```
src/
  components/
    results/
      RouteResultPanel.tsx   ← list of route options
      RouteOptionCard.tsx    ← one route card: line number, walk distances, board/alight stop names
  hooks/
    useRouteFinder.ts        ← call POST /api/find-route/, manage loading/error state
```

Map visualization: render `sub_route_geojson` from the API response directly in OpenLayers (no GeoServer WFS call needed — the API already includes the clipped geometry).

---

### F3 — GeoJSON Import (user-facing API)

**What the admin user does:** Upload a `.geojson` file (from OSM Overpass export) through a UI. The system imports all routes and stops.

**Prerequisite:** Extract import logic to `routes/services/import_service.py` first (see Architecture section above).

**Backend additions:**

New endpoint: `POST /api/import/` — admin only

```python
@api_view(['POST'])
@permission_classes([IsAdminUser])
def import_geojson(request):
    file = request.FILES.get('file')
    data = json.load(file)
    result = import_service.run_import(data)
    return Response(result)
```

Response:
```json
{ "routes_added": 12, "stops_added": 87, "errors": [] }
```

**Frontend additions:**
```
src/
  components/
    admin/
      ImportPanel.tsx   ← file input + upload button + result summary
                          only rendered when user is authenticated as admin
```

---

### F4 — Authentication & Authorization

**Two roles:**
- **Anonymous** — can use the map, select points, find routes (read-only)
- **Admin** — can log in, access the import endpoint, manage data via Django Admin

**Backend approach:** Keep it simple. **Use DRF TokenAuthentication — no JWT, no refresh tokens, no OAuth.**

```
Authentication method : DRF TokenAuthentication (decision: confirmed)
Token storage         : localStorage (frontend) / Django admin uses session auth
Admin panel           : Django Admin — already works with session login
```

Why TokenAuthentication over JWT:
- Only 1 admin role in this project — no need for stateless distributed tokens
- `rest_framework.authtoken` ships with DRF (no extra package)
- Tokens are just rows in a DB table → trivial to revoke (delete the row)
- Junior-friendly: one concept, no signing keys, no expiry math

**Backend additions:**

In `settings.py`:
```python
REST_FRAMEWORK = {
    ...
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.TokenAuthentication',
        'rest_framework.authentication.SessionAuthentication',
    ],
}
```

In `requirements.txt`: no new packages — `rest_framework.authtoken` is bundled with DRF.

In `INSTALLED_APPS`: add `'rest_framework.authtoken'`.

New endpoints:
```
POST /api/auth/login/   → { token: "abc123" }
POST /api/auth/logout/
GET  /api/auth/me/      → { username, is_staff }
```

Permission per endpoint:
```
GET  /api/stops/        → AllowAny
GET  /api/routes/       → AllowAny
POST /api/find-route/   → AllowAny
POST /api/import/       → IsAdminUser
```

**Frontend additions:**
```
src/
  services/
    auth.ts         ← login(), logout(), getMe(), store token in localStorage
  components/
    auth/
      LoginModal.tsx ← simple email+password form, shown when clicking admin button
  hooks/
    useAuth.ts      ← { user, login, logout, isAdmin }
```

No React Router needed yet — the app is a single map view. The admin panel for data management is Django Admin (already at `/admin/`). Only the import endpoint needs a frontend UI.

---

## Recommended Build Order

Build in this order to minimize rework:

```
1. ✅ Done  — Wire up urls.py, fix vite proxy, fix serializer import
2. Next     — Extract import_service.py (prerequisite for F3 + testability)
3. Then     — F4 Authentication (prerequisite for F3 import API)
4. Then     — F1 Point Selection UI (pure frontend, can start anytime)
5. Then     — F2 Route Finder backend + frontend (core feature)
6. Last     — F3 GeoJSON Import API + admin UI
```

Steps 4 and 3 can be worked on in parallel since they don't depend on each other.

---

## API Endpoint Summary

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/stops/?search=` | Anyone | Autocomplete bus stop search |
| GET | `/api/routes/` | Anyone | List all bus routes |
| POST | `/api/find-route/` | Anyone | Find routes between two points |
| POST | `/api/import/` | Admin | Upload GeoJSON to import routes/stops |
| POST | `/api/auth/login/` | Anyone | Get auth token |
| POST | `/api/auth/logout/` | Token | Invalidate token |
| GET | `/api/auth/me/` | Token | Get current user info |

---

## Questions & Recommendations

**Q: Transfer routes (take bus A → transfer to bus B)?**
**Decision: not in v1.** Direct routes only. Transfers require a second pass over route pairs that share a stop, plus ranking logic for (walk + ride + transfer + ride + walk). That's a separate feature to add later once direct routing is working.

**Q: How accurate does "distance" need to be?**
`ST_Distance` with `ST_Transform(..., 3857)` gives meters accurate to ~1-2m at Hanoi's latitude. This is good enough for walking distance estimates. No extra library needed.

**Q: Should frontend state use Redux / Zustand?**
No — not at this scale. `useState` in `App.tsx` + props passing is sufficient. If state gets complex (e.g., route results + selected route + highlighted stop all need to talk to the map), consider a single `useRouteFinder` hook that owns all route-finder state and is passed to both the panel and the map. Zustand is a reasonable upgrade if that becomes messy.

**Q: GeoServer — is it still needed after the route finder is built?**
Yes, for the map background layer (OSM tiles + styled bus route rendering). GeoServer's WMS makes it easy to style routes by line number color without sending geometry data to the frontend on every page load.
