# FD-04 — F01 Point Selection (From / To + Buffer)

> **Document type:** Functional + Implementation Guide
> **Version:** 1.0
> **Last updated:** 2026-04-20
> **Status:** Draft
> **Depends on:** none (frontend-only, no backend)
> **Used by:** F02 — Route Finder

---

## 1. Goal

Let the user pick **two points on the map** — a *from* point and a *to* point —
each surrounded by an adjustable **buffer circle** (default 1 km).

These two points + buffer values become the input contract for **F02 — Route Finder**.

**Why a buffer?** In real life, no one stands exactly on a bus stop. The buffer
is the radius the user is willing to *walk* to reach a stop. Default 1 km;
adjustable 500 m – 3 km.

---

## 2. User Flow

```
Initial state: SelectionControls panel sits at the bottom-left of the map.
[📍 From]  [🎯 To]  [🔄 Clear]
Buffer: ━━━●━━━  1.0 km

   ▼ click [📍 From]
Mode = "from": button highlighted green, cursor becomes a crosshair.

   ├── click on the map  → green pin + dashed green circle, mode resets
   └── click [🛰 Use my location]
                          → browser asks for GPS permission
                          → allow: green pin at real position
                          → deny:  error banner shown

   ▼ click [🎯 To]
Mode = "to":  button highlighted red, cursor becomes a crosshair.
   └── click on the map → red pin + dashed red circle

Drag the buffer slider → both circles resize live.
Click [🔄 Clear]       → both pins and circles disappear.
```

---

## 3. Architecture

Three pieces, with a strict separation of concerns:

```
SelectionControls.tsx (UI)  ──► usePointSelection.ts (state)
                                        │
                                        ▼
                                useMap.ts (draws on OpenLayers)
```

| Module | Knows about |
|---|---|
| `usePointSelection` | React state only. **Never imports from `ol/*`.** |
| `useMap` | OpenLayers only. **Never imports React state.** |
| `SelectionControls` | A props interface — neither map nor global state. |
| `App.tsx` | Wires them together. The only file that knows everyone. |

This is the whole reason F1 is maintainable. If you ever need to swap OpenLayers
for MapLibre, you touch `useMap` only. If you ever need to persist selections to
URL or localStorage, you touch `usePointSelection` only.

---

## 4. Coordinate Systems — the One Trap

OpenLayers internally uses **EPSG:3857** (Web Mercator, units: metres).
The rest of the app — the `LngLat` type in
[frontend/src/types/index.ts](../../frontend/src/types/index.ts), PostGIS, and
every API — uses **EPSG:4326** (WGS84, units: degrees).

Three rules cover every case:

| Direction | Function | Use when |
|---|---|---|
| 4326 → 3857 | `fromLonLat([lng, lat])` | Drawing anything on the map |
| 3857 → 4326 | `toLonLat(coordinate)` | Reading map click events |
| Buffer circle | `new Circle(center3857, radiusMetres)` then `fromCircle(circle, 64)` | Drawing the buffer as a Polygon |

The buffer circle conversion to Polygon (64 sides) is needed because OpenLayers
renders `Circle` geometries as flat shapes that distort visually at higher
zoom; the polygon form is correct.

---

## 5. Files to Create / Modify

| File | Action | Purpose |
|---|---|---|
| [frontend/src/hooks/usePointSelection.ts](../../frontend/src/hooks/usePointSelection.ts) | **new** | State: from, to, mode, bufferRadius + GPS handler |
| [frontend/src/hooks/useMap.ts](../../frontend/src/hooks/useMap.ts) | **extend** | Accept `onMapClick`; expose `drawSelectionMarkers` |
| [frontend/src/components/map/SelectionControls.tsx](../../frontend/src/components/map/SelectionControls.tsx) | **new** | Floating panel (bottom-left) |
| [frontend/src/App.tsx](../../frontend/src/App.tsx) | **wire** | Hold the hook, pass props down |
| [frontend/src/components/map/MapView.tsx](../../frontend/src/components/map/MapView.tsx) | **wire** | Accept `onMapClick` prop, forward to `useMap` |

We **reuse the existing `LngLat` tuple type** from
[types/index.ts](../../frontend/src/types/index.ts) (`type LngLat = [number, number]`)
everywhere a point is passed around. Do not introduce a new `LatLng` interface.

---

## 6. Step-by-Step Implementation

Build in this order. Each step is independently testable.

### 6.1 `usePointSelection.ts` — pure state

Responsibility: hold the from/to points, the active mode, and the buffer
radius. Expose handlers. Does not touch the map.

```typescript
// frontend/src/hooks/usePointSelection.ts
import { useState, useCallback } from 'react'
import type { LngLat } from '../types'

// 'from' = waiting for user to pick the start point
// 'to'   = waiting for user to pick the destination
// null   = no selection mode active
export type SelectionMode = 'from' | 'to' | null

export const usePointSelection = () => {
  const [fromPoint, setFromPoint] = useState<LngLat | null>(null)
  const [toPoint, setToPoint]     = useState<LngLat | null>(null)
  const [mode, setMode]           = useState<SelectionMode>(null)
  const [bufferRadius, setBufferRadius] = useState(1000) // metres

  // Toggle: clicking the same mode again turns it off.
  const activateMode = useCallback((next: SelectionMode) => {
    setMode(prev => (prev === next ? null : next))
  }, [])

  // Called by App.tsx when the user clicks the map.
  const handleMapClick = useCallback((point: LngLat) => {
    if (mode === 'from') { setFromPoint(point); setMode(null) }
    else if (mode === 'to') { setToPoint(point); setMode(null) }
    // else: ignore click — no selection mode is active
  }, [mode])

  // Use the browser's GPS to set the "from" point.
  const setFromGPS = useCallback(() => {
    if (!navigator.geolocation) {
      alert('This browser does not support geolocation.')
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setFromPoint([pos.coords.longitude, pos.coords.latitude])
        setMode(null)
      },
      // Always provide an error callback. Silently swallowing this is the
      // most common F1 bug — the user denies permission and nothing happens.
      (err) => alert(`Could not get your location: ${err.message}`),
    )
  }, [])

  const clear = useCallback(() => {
    setFromPoint(null); setToPoint(null); setMode(null)
  }, [])

  return {
    fromPoint, toPoint, mode, bufferRadius,
    activateMode, handleMapClick, setFromGPS, setBufferRadius, clear,
  }
}
```

**Why it's written this way**
- One hook, one concern (state). Easy to unit-test without rendering a map.
- `useCallback` on every handler so `useMap`'s `useEffect` does not re-register
  the click listener on every render.
- `mode` auto-resets to `null` after a successful pick — the UI can read `mode`
  directly to decide cursor/highlight without extra flags.

---

### 6.2 `useMap.ts` — extend with click + draw

Add three things to the existing hook
([frontend/src/hooks/useMap.ts](../../frontend/src/hooks/useMap.ts)):

1. An optional `onMapClick` callback parameter.
2. A dedicated `VectorSource` for selection markers and buffer circles.
3. A `drawSelectionMarkers` function the App calls whenever from/to/buffer change.

```typescript
// frontend/src/hooks/useMap.ts — full file after extension
import { useEffect, useRef, useCallback } from 'react'
import Map from 'ol/Map'
import View from 'ol/View'
import TileLayer from 'ol/layer/Tile'
import OSM from 'ol/source/OSM'
import ImageLayer from 'ol/layer/Image'
import ImageWMS from 'ol/source/ImageWMS'
import VectorLayer from 'ol/layer/Vector'
import VectorSource from 'ol/source/Vector'
import Feature from 'ol/Feature'
import Point from 'ol/geom/Point'
import Circle from 'ol/geom/Circle'
import { fromCircle } from 'ol/geom/Polygon'
import { fromLonLat, toLonLat } from 'ol/proj'
import Style from 'ol/style/Style'
import CircleStyle from 'ol/style/Circle'
import Fill from 'ol/style/Fill'
import Stroke from 'ol/style/Stroke'
import 'ol/ol.css'

import {
  MAP_CENTER, MAP_ZOOM,
  GEOSERVER_WMS_URL, LAYER_BUS_ROUTES, LAYER_BUS_STOPS,
} from '../utils/mapConfig'
import type { LngLat } from '../types'

// ── Styles ─────────────────────────────────────────────────────────────────
const fromMarkerStyle = new Style({
  image: new CircleStyle({
    radius: 10,
    fill: new Fill({ color: '#22c55e' }),                // green-500
    stroke: new Stroke({ color: '#fff', width: 2 }),
  }),
})
const toMarkerStyle = new Style({
  image: new CircleStyle({
    radius: 10,
    fill: new Fill({ color: '#ef4444' }),                // red-500
    stroke: new Stroke({ color: '#fff', width: 2 }),
  }),
})
const fromBufferStyle = new Style({
  stroke: new Stroke({ color: '#22c55e', width: 2, lineDash: [6, 4] }),
  fill:   new Fill({ color: 'rgba(34, 197, 94, 0.08)' }),
})
const toBufferStyle = new Style({
  stroke: new Stroke({ color: '#ef4444', width: 2, lineDash: [6, 4] }),
  fill:   new Fill({ color: 'rgba(239, 68, 68, 0.08)' }),
})

export const useMap = (
  targetRef: React.RefObject<HTMLDivElement>,
  onMapClick?: (point: LngLat) => void,
) => {
  const mapRef = useRef<Map | null>(null)
  const selectionSourceRef = useRef(new VectorSource())

  // ── 1. Initialise the map exactly once ────────────────────────────────
  useEffect(() => {
    if (!targetRef.current || mapRef.current) return

    const map = new Map({
      target: targetRef.current,
      layers: [
        new TileLayer({ source: new OSM() }),
        new ImageLayer({
          source: new ImageWMS({
            url: GEOSERVER_WMS_URL,
            params: { LAYERS: LAYER_BUS_ROUTES, FORMAT: 'image/png', TRANSPARENT: true },
            ratio: 1, serverType: 'geoserver',
          }),
          opacity: 0.8,
        }),
        new ImageLayer({
          source: new ImageWMS({
            url: GEOSERVER_WMS_URL,
            params: { LAYERS: LAYER_BUS_STOPS, FORMAT: 'image/png', TRANSPARENT: true },
            ratio: 1, serverType: 'geoserver',
          }),
        }),
        new VectorLayer({ source: selectionSourceRef.current, zIndex: 10 }),
      ],
      view: new View({ center: fromLonLat(MAP_CENTER), zoom: MAP_ZOOM }),
    })

    mapRef.current = map
    return () => { map.setTarget(undefined); mapRef.current = null }
  }, [targetRef])

  // ── 2. Click handler in its own effect, keyed on onMapClick ──────────
  // Separate effect so changing the callback does NOT re-init the whole map.
  useEffect(() => {
    const map = mapRef.current
    if (!map || !onMapClick) return

    const handler = (e: { coordinate: number[] }) => {
      const [lng, lat] = toLonLat(e.coordinate)         // 3857 → 4326
      onMapClick([lng, lat])
    }
    map.on('click', handler)
    return () => map.un('click', handler)
  }, [onMapClick])

  // ── 3. Draw markers + buffer circles ─────────────────────────────────
  const drawSelectionMarkers = useCallback((params: {
    from: LngLat | null
    to:   LngLat | null
    bufferRadius: number
  }) => {
    const source = selectionSourceRef.current
    source.clear()                                       // simplest: redraw from scratch

    const drawOne = (p: LngLat, marker: Style, buffer: Style) => {
      const center3857 = fromLonLat(p)                   // 4326 → 3857
      const markerFeat = new Feature({ geometry: new Point(center3857) })
      markerFeat.setStyle(marker)

      const circle = new Circle(center3857, params.bufferRadius)
      const bufferFeat = new Feature({ geometry: fromCircle(circle, 64) })
      bufferFeat.setStyle(buffer)

      source.addFeatures([markerFeat, bufferFeat])
    }

    if (params.from) drawOne(params.from, fromMarkerStyle, fromBufferStyle)
    if (params.to)   drawOne(params.to,   toMarkerStyle,   toBufferStyle)
  }, [])

  return { mapRef, drawSelectionMarkers }
}
```

**Why it's written this way**
- The click handler lives in its **own `useEffect`** keyed on `onMapClick`.
  If we put it inside the init-effect, every callback identity change would
  destroy and rebuild the entire OpenLayers map — that's the subtle bug to avoid.
- Markers live in a dedicated `VectorSource` so `source.clear()` redraws are
  cheap and never affect the WMS layers. Future F02 route results can use a
  *separate* `VectorSource` for the same reason.
- "Clear and redraw all" is intentionally simpler than diff-based updates —
  for two pins, the perf cost is invisible and the code is half as long.

---

### 6.3 `SelectionControls.tsx` — the UI panel

Floating panel anchored at bottom-left.

```typescript
// frontend/src/components/map/SelectionControls.tsx
import type { LngLat } from '../../types'
import type { SelectionMode } from '../../hooks/usePointSelection'

interface Props {
  mode: SelectionMode
  fromPoint: LngLat | null
  toPoint:   LngLat | null
  bufferRadius: number
  onActivateMode:    (m: SelectionMode) => void
  onSetFromGPS:      () => void
  onSetBufferRadius: (n: number) => void
  onClear:           () => void
}

const fmt = (p: LngLat) => `${p[1].toFixed(4)}, ${p[0].toFixed(4)}` // lat, lng

export const SelectionControls = ({
  mode, fromPoint, toPoint, bufferRadius,
  onActivateMode, onSetFromGPS, onSetBufferRadius, onClear,
}: Props) => (
  <div className="absolute bottom-8 left-4 z-10 w-56 space-y-3 rounded-xl bg-white p-4 shadow-lg">

    {/* From */}
    <div className="space-y-1">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">From</p>
      <button
        onClick={() => onActivateMode('from')}
        className={`w-full rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors ${
          mode === 'from'    ? 'bg-green-500 text-white'
          : fromPoint        ? 'bg-green-100 text-green-800'
                             : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`}
      >
        {mode === 'from' ? '✛ Click on the map…'
          : fromPoint    ? `📍 ${fmt(fromPoint)}`
                         : '📍 Pick start point'}
      </button>
      <button
        onClick={onSetFromGPS}
        className="w-full rounded-lg bg-gray-50 px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-100"
      >
        🛰 Use my location
      </button>
    </div>

    <hr className="border-gray-100" />

    {/* To */}
    <div className="space-y-1">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">To</p>
      <button
        onClick={() => onActivateMode('to')}
        className={`w-full rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors ${
          mode === 'to'    ? 'bg-red-500 text-white'
          : toPoint        ? 'bg-red-100 text-red-800'
                           : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`}
      >
        {mode === 'to' ? '✛ Click on the map…'
          : toPoint    ? `🎯 ${fmt(toPoint)}`
                       : '🎯 Pick destination'}
      </button>
    </div>

    <hr className="border-gray-100" />

    {/* Buffer slider */}
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Buffer</p>
        <span className="font-mono text-xs text-gray-700">
          {(bufferRadius / 1000).toFixed(1)} km
        </span>
      </div>
      <input
        type="range" min={500} max={3000} step={100}
        value={bufferRadius}
        onChange={(e) => onSetBufferRadius(Number(e.target.value))}
        className="w-full accent-blue-500"
      />
      <div className="flex justify-between text-xs text-gray-400">
        <span>500 m</span><span>3 km</span>
      </div>
    </div>

    <button
      onClick={onClear}
      className="w-full rounded-lg bg-gray-100 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-200"
    >
      🔄 Clear
    </button>
  </div>
)
```

**Why it's written this way**
- Pure props in, callbacks out — no hooks, no global state. Trivially
  reusable in Storybook or tests.
- Three button states (idle / active / picked) mapped from a single `mode`
  variable. No extra flags to keep in sync.

---

### 6.4 `MapView.tsx` — accept and forward `onMapClick`

```typescript
// frontend/src/components/map/MapView.tsx
import { useRef } from 'react'
import { useMap } from '../../hooks/useMap'
import type { LngLat } from '../../types'

interface Props {
  onMapClick?: (point: LngLat) => void
}

const MapView = ({ onMapClick }: Props) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const { drawSelectionMarkers } = useMap(containerRef, onMapClick)

  // Expose drawSelectionMarkers up via a ref or context if App needs it.
  // Simpler alternative shown in App.tsx below: lift useMap to App.
  return <div ref={containerRef} className="w-full h-full" aria-label="Map" />
}

export default MapView
```

> **Tip:** if the `MapView` boundary feels in the way, just inline the map
> `<div>` into `App.tsx` and call `useMap` there. For F1's scope, either is
> fine. The version in 6.5 takes the inline approach to keep wiring obvious.

---

### 6.5 `App.tsx` — wire it together

```typescript
// frontend/src/App.tsx
import { useEffect, useRef } from 'react'
import Header from './components/layout/Header'
import { useMap } from './hooks/useMap'
import { usePointSelection } from './hooks/usePointSelection'
import { SelectionControls } from './components/map/SelectionControls'

const App = () => {
  const containerRef = useRef<HTMLDivElement>(null)
  const sel = usePointSelection()
  const { drawSelectionMarkers } = useMap(containerRef, sel.handleMapClick)

  // Re-draw whenever the selection or buffer changes.
  useEffect(() => {
    drawSelectionMarkers({
      from: sel.fromPoint,
      to:   sel.toPoint,
      bufferRadius: sel.bufferRadius,
    })
  }, [sel.fromPoint, sel.toPoint, sel.bufferRadius, drawSelectionMarkers])

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="absolute inset-0" aria-label="Map" />
      <Header />
      <SelectionControls
        mode={sel.mode}
        fromPoint={sel.fromPoint}
        toPoint={sel.toPoint}
        bufferRadius={sel.bufferRadius}
        onActivateMode={sel.activateMode}
        onSetFromGPS={sel.setFromGPS}
        onSetBufferRadius={sel.setBufferRadius}
        onClear={sel.clear}
      />
    </div>
  )
}

export default App
```

**Why it's written this way**
- App is the *only* file that imports both `useMap` and `usePointSelection`.
  This keeps the separation rule from §3 enforceable just by reading imports.
- The redraw effect lists every input it reads — no stale closures, no
  manual subscriptions.

---

## 7. GPS Error Handling

| Case | What to do |
|---|---|
| `navigator.geolocation` undefined | Browser too old / disabled — show a banner. |
| User denies the prompt | Show `PositionError.message` ("User denied geolocation"). Never swallow this. |
| Production HTTPS | Geolocation requires a secure context. `localhost` works for dev; deploy must be HTTPS. |
| Timeout (slow GPS) | `getCurrentPosition` accepts an options object with `timeout`; default is fine for F1, revisit if users complain. |

---

## 8. Verification Checklist

Run end-to-end before opening the PR:

- [ ] `cd frontend && npm run dev`, open the app at `http://localhost:5173`.
- [ ] Click **From** → cursor changes; click on the map → green pin + dashed green circle appears.
- [ ] Click **To** → red pin + dashed red circle appears.
- [ ] Drag the buffer slider from 500 m to 3 km → both circles resize live.
- [ ] Click **Use my location** → browser prompts; allow → green pin appears at your real location; deny → error banner.
- [ ] Click **Clear** → both pins and circles disappear.
- [ ] Refresh page → state is empty (intentionally not persisted in F1).
- [ ] Network tab shows **no new HTTP requests** during point selection (frontend-only feature — sanity check).

---

## 9. What This Doc Does NOT Cover

These are deliberately out of scope for F1; they belong to later features:

- Calling the route-finder API → **F02**.
- Persisting selections across reloads (URL params, localStorage).
- Reverse geocoding the picked points to a street name.
- Multiple intermediate stops or waypoints.
- Snapping the picked point to the nearest bus stop.

If you find yourself touching any of those while implementing F1, stop and
open a separate ticket — keeping F1 small is what makes F02 easy.
