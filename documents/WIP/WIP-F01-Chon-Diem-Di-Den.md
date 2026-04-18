# F01 — Chọn Điểm Đi / Điểm Đến + Buffer

**Phụ thuộc:** Không có (tính năng độc lập, không cần backend)
**Tính năng tiếp theo:** [F02 — Tìm Tuyến Dạng 1](./WIP-F02-Tim-Tuyen-Dang-1.md)

---

## 1. Mục Tiêu

Cho phép người dùng **chọn 2 điểm trên bản đồ** — điểm đi và điểm đến — kèm một **vòng tròn buffer** điều chỉnh được xung quanh mỗi điểm.

Hai điểm + buffer này sẽ là **đầu vào** cho tính năng tìm tuyến xe buýt ở F02.

**Tại sao cần buffer?**
Trong thực tế, người dùng không thể đứng ngay tại trạm. Buffer là bán kính mà người dùng sẵn sàng **đi bộ** để ra trạm xe buýt. Mặc định 1km — có thể tăng/giảm tùy nhu cầu.

---

## 2. User Flow

```
┌─────────────────────────────────────────────────────────┐
│                   Trạng thái ban đầu                    │
│  Panel điều khiển hiện ở góc trái bản đồ                │
│  [📍 Điểm đi]  [🎯 Điểm đến]  [🔄 Xóa]                │
│  Buffer: ━━━●━━━  1.0 km                                │
└─────────────────────────────────────────────────────────┘
         │
         ▼ Người dùng click [📍 Điểm đi]
┌─────────────────────────────────────────────────────────┐
│  Mode "from" active:                                    │
│  - Nút [📍 Điểm đi] sáng lên (highlight màu xanh)      │
│  - Con trỏ chuột trên bản đồ đổi thành ✛ (crosshair)   │
└─────────────────────────────────────────────────────────┘
         │
         ├─── Người dùng click vào bản đồ
         │         → Marker xanh lá xuất hiện tại điểm click
         │         → Vòng tròn xanh lá (dashed) bao quanh marker
         │         → Mode tắt (cursor về bình thường)
         │
         └─── Người dùng click [📍 Vị trí GPS]
                   → Trình duyệt hỏi xin quyền vị trí
                   → Nếu cho phép: marker xanh lá tại vị trí thực
                   → Nếu từ chối: hiện thông báo lỗi

         ▼ Tiếp theo: Người dùng click [🎯 Điểm đến]
┌─────────────────────────────────────────────────────────┐
│  Mode "to" active:                                      │
│  - Nút [🎯 Điểm đến] sáng lên (highlight màu đỏ)       │
│  - Con trỏ chuột đổi thành ✛                            │
└─────────────────────────────────────────────────────────┘
         │
         ▼ Người dùng click vào bản đồ
┌─────────────────────────────────────────────────────────┐
│  Cả 2 điểm đã có:                                      │
│  - Marker đỏ tại điểm đến + vòng tròn đỏ (dashed)      │
│  → F02 tự động trigger (gọi API tìm tuyến)             │
└─────────────────────────────────────────────────────────┘

Kéo slider buffer → cả 2 vòng tròn co/giãn theo realtime
                  → F02 tự động gọi lại API với buffer mới
```

---

## 3. Technical Flow

```
[User click nút] → usePointSelection.activateMode('from')
                       └─ state.mode = 'from'

[User click map] → useMap onMapClick callback được gọi
                       └─ toLonLat(e.coordinate) → { lng, lat }
                       └─ usePointSelection.setFromPoint({ lat, lng })
                              └─ state.fromPoint = { lat, lng }
                              └─ state.mode = null  (auto deactivate)

[state.fromPoint thay đổi] → useMap.drawSelectionMarkers()
                                 └─ Xóa layer cũ
                                 └─ Vẽ marker tại fromPoint
                                 └─ Vẽ circle buffer (bán kính = bufferRadius)
```

**Quan trọng — Hệ tọa độ:**

```
OpenLayers nội bộ dùng EPSG:3857 (Web Mercator, đơn vị: mét)
    ↕ map.on('click', e) → e.coordinate = [x, y] trong EPSG:3857

Sau khi toLonLat(e.coordinate) → [lng, lat] trong EPSG:4326 (WGS84, đơn vị: độ)
    ↕ Đây là hệ tọa độ lưu trong PostGIS và dùng trong API

Khi vẽ lại lên map → fromLonLat([lng, lat]) → EPSG:3857
```

**Buffer circle — cách vẽ:**

Buffer circle trên OpenLayers **không phải** hình tròn cố định. Phải tính toán geometry bằng `ol/geom/Circle` với bán kính theo mét trong EPSG:3857, sau đó convert bằng `fromCircle` sang Polygon để vẽ.

```typescript
import Circle from 'ol/geom/Circle'
import { fromCircle } from 'ol/geom/Polygon'
import { fromLonLat } from 'ol/proj'

// center phải là EPSG:3857
const center3857 = fromLonLat([lng, lat])
const circle = new Circle(center3857, bufferRadius)  // bán kính tính bằng mét
const polygon = fromCircle(circle, 64)               // 64 = số cạnh → tròn mịn
```

---

## 4. Files Cần Tạo / Sửa

### Thứ tự thực hiện

```
1. usePointSelection.ts   ← quản lý state, không biết gì về map
2. useMap.ts              ← thêm click handler + vẽ marker/buffer
3. SelectionControls.tsx  ← UI panel
4. App.tsx                ← kết nối tất cả
```

---

### 4.1 `frontend/src/hooks/usePointSelection.ts` — Tạo mới

Hook này **chỉ quản lý state**, không trực tiếp tương tác với map.
Mọi thao tác vẽ/xóa trên map do `useMap` lo.

```typescript
import { useState, useCallback } from 'react'

export interface LatLng {
  lat: number
  lng: number
}

// 'from' = đang chờ user click điểm đi
// 'to'   = đang chờ user click điểm đến
// null   = không có mode nào active
export type SelectionMode = 'from' | 'to' | null

export interface PointSelectionState {
  fromPoint: LatLng | null
  toPoint: LatLng | null
  mode: SelectionMode
  bufferRadius: number  // mét, 500–3000
}

export const usePointSelection = () => {
  const [fromPoint, setFromPoint] = useState<LatLng | null>(null)
  const [toPoint, setToPoint]     = useState<LatLng | null>(null)
  const [mode, setMode]           = useState<SelectionMode>(null)
  const [bufferRadius, setBufferRadius] = useState(1000)

  // Bật mode chọn điểm. Nếu click lại cùng mode → tắt (toggle)
  const activateMode = useCallback((newMode: SelectionMode) => {
    setMode(prev => prev === newMode ? null : newMode)
  }, [])

  // Gọi khi user click map. App.tsx quyết định đây là điểm đi hay đến dựa vào mode.
  const handleMapClick = useCallback((point: LatLng) => {
    if (mode === 'from') {
      setFromPoint(point)
      setMode(null)  // tắt mode sau khi chọn xong
    } else if (mode === 'to') {
      setToPoint(point)
      setMode(null)
    }
  }, [mode])

  // Lấy vị trí GPS của người dùng làm điểm đi
  const setFromGPS = useCallback(() => {
    if (!navigator.geolocation) {
      alert('Trình duyệt không hỗ trợ GPS')
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setFromPoint({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setMode(null)
      },
      (err) => {
        // KHÔNG bỏ qua error callback! Nếu user từ chối quyền → phải báo
        alert(`Không lấy được vị trí: ${err.message}`)
      }
    )
  }, [])

  const clear = useCallback(() => {
    setFromPoint(null)
    setToPoint(null)
    setMode(null)
  }, [])

  return {
    fromPoint,
    toPoint,
    mode,
    bufferRadius,
    activateMode,
    handleMapClick,
    setFromGPS,
    setBufferRadius,
    clear,
  }
}
```

---

### 4.2 `frontend/src/hooks/useMap.ts` — Mở rộng

Thêm 3 khả năng mới vào hook hiện có:
1. **Click handler** — đăng ký/hủy listener theo mode
2. **drawSelectionMarkers** — vẽ marker + buffer circle cho điểm đi/đến
3. **drawRouteResult / clearResult** — vẽ kết quả tuyến (dùng ở F02)

```typescript
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
import LineString from 'ol/geom/LineString'
import { fromLonLat, toLonLat } from 'ol/proj'
import { fromCircle } from 'ol/geom/Polygon'
import Style from 'ol/style/Style'
import CircleStyle from 'ol/style/Circle'
import Fill from 'ol/style/Fill'
import Stroke from 'ol/style/Stroke'
import 'ol/ol.css'

import {
  MAP_CENTER, MAP_ZOOM,
  GEOSERVER_WMS_URL, LAYER_BUS_ROUTES, LAYER_BUS_STOPS,
} from '../utils/mapConfig'
import type { LatLng } from './usePointSelection'
import type { RouteOption } from '../types'

// ─── Styles ──────────────────────────────────────────────────────────────────

// Marker điểm đi: chấm xanh lá
const fromMarkerStyle = new Style({
  image: new CircleStyle({
    radius: 10,
    fill: new Fill({ color: '#22c55e' }),     // green-500
    stroke: new Stroke({ color: '#fff', width: 2 }),
  }),
})

// Marker điểm đến: chấm đỏ
const toMarkerStyle = new Style({
  image: new CircleStyle({
    radius: 10,
    fill: new Fill({ color: '#ef4444' }),     // red-500
    stroke: new Stroke({ color: '#fff', width: 2 }),
  }),
})

// Vòng buffer: đường đứt nét, fill trong suốt
const fromBufferStyle = new Style({
  stroke: new Stroke({ color: '#22c55e', width: 2, lineDash: [6, 4] }),
  fill: new Fill({ color: 'rgba(34, 197, 94, 0.08)' }),
})

const toBufferStyle = new Style({
  stroke: new Stroke({ color: '#ef4444', width: 2, lineDash: [6, 4] }),
  fill: new Fill({ color: 'rgba(239, 68, 68, 0.08)' }),
})

// Đường tuyến xe buýt kết quả: đỏ đậm
const subRouteStyle = new Style({
  stroke: new Stroke({ color: '#dc2626', width: 5 }),
})

// ─── Hook ────────────────────────────────────────────────────────────────────

export const useMap = (
  targetRef: React.RefObject<HTMLDivElement>,
  onMapClick?: (point: LatLng) => void,  // callback khi user click map
) => {
  const mapRef = useRef<Map | null>(null)

  // VectorSource riêng cho marker/buffer (xóa/vẽ lại độc lập với route result)
  const selectionSourceRef = useRef(new VectorSource())
  // VectorSource cho kết quả tuyến (xóa/vẽ lại độc lập với markers)
  const routeSourceRef = useRef(new VectorSource())

  // ── Khởi tạo map (chỉ chạy 1 lần) ──────────────────────────────────────
  useEffect(() => {
    if (!targetRef.current || mapRef.current) return

    const map = new Map({
      target: targetRef.current,
      layers: [
        new TileLayer({ source: new OSM(), properties: { name: 'osm-base' } }),
        new ImageLayer({
          source: new ImageWMS({
            url: GEOSERVER_WMS_URL,
            params: { LAYERS: LAYER_BUS_ROUTES, FORMAT: 'image/png', TRANSPARENT: true },
            ratio: 1, serverType: 'geoserver',
          }),
          opacity: 0.8,
          properties: { name: 'bus-routes' },
        }),
        new ImageLayer({
          source: new ImageWMS({
            url: GEOSERVER_WMS_URL,
            params: { LAYERS: LAYER_BUS_STOPS, FORMAT: 'image/png', TRANSPARENT: true },
            ratio: 1, serverType: 'geoserver',
          }),
          properties: { name: 'bus-stops' },
        }),
        // VectorLayer cho markers + buffers (trên WMS, dưới route result)
        new VectorLayer({ source: selectionSourceRef.current, zIndex: 10 }),
        // VectorLayer cho kết quả tuyến (trên cùng)
        new VectorLayer({ source: routeSourceRef.current, zIndex: 20 }),
      ],
      view: new View({ center: fromLonLat(MAP_CENTER), zoom: MAP_ZOOM }),
    })

    mapRef.current = map

    return () => {
      map.setTarget(undefined)
      mapRef.current = null
    }
  }, [targetRef])

  // ── Đăng ký/hủy click handler khi onMapClick thay đổi ───────────────────
  // Dùng useEffect riêng để không re-init toàn bộ map
  useEffect(() => {
    const map = mapRef.current
    if (!map || !onMapClick) return

    const handler = (e: any) => {
      // e.coordinate là EPSG:3857 → PHẢI convert sang WGS84 trước khi dùng
      const [lng, lat] = toLonLat(e.coordinate)
      onMapClick({ lat, lng })
    }

    map.on('click', handler)
    return () => map.un('click', handler)  // cleanup khi onMapClick thay đổi
  }, [onMapClick])

  // ── Vẽ markers + buffer circles ─────────────────────────────────────────
  const drawSelectionMarkers = useCallback((params: {
    from: LatLng | null
    to: LatLng | null
    bufferRadius: number
  }) => {
    const source = selectionSourceRef.current
    source.clear()  // xóa tất cả features cũ trước khi vẽ lại

    const addMarkerAndBuffer = (point: LatLng, markerStyle: Style, bufferStyle: Style) => {
      const center3857 = fromLonLat([point.lng, point.lat])  // [lng, lat] → EPSG:3857

      // Marker (điểm)
      const markerFeature = new Feature({ geometry: new Point(center3857) })
      markerFeature.setStyle(markerStyle)

      // Buffer circle → convert sang Polygon để render đúng trên bản đồ phẳng
      const circle = new Circle(center3857, params.bufferRadius)
      const bufferFeature = new Feature({ geometry: fromCircle(circle, 64) })
      bufferFeature.setStyle(bufferStyle)

      source.addFeatures([markerFeature, bufferFeature])
    }

    if (params.from) addMarkerAndBuffer(params.from, fromMarkerStyle, fromBufferStyle)
    if (params.to)   addMarkerAndBuffer(params.to,   toMarkerStyle,   toBufferStyle)
  }, [])

  // ── Vẽ kết quả tuyến (dùng ở F02) ────────────────────────────────────────
  const drawRouteResult = useCallback((option: RouteOption) => {
    const source = routeSourceRef.current
    source.clear()

    // sub_route là GeoJSON LineString với coordinates = [[lng, lat], ...]
    const coords3857 = option.sub_route.coordinates.map(
      ([lng, lat]) => fromLonLat([lng, lat])  // convert từng điểm sang EPSG:3857
    )

    const routeFeature = new Feature({ geometry: new LineString(coords3857) })
    routeFeature.setStyle(subRouteStyle)
    source.addFeature(routeFeature)

    // Zoom vừa đoạn route được chọn
    const extent = routeFeature.getGeometry()!.getExtent()
    mapRef.current?.getView().fit(extent, { padding: [80, 80, 80, 80], maxZoom: 16 })
  }, [])

  const clearResult = useCallback(() => {
    routeSourceRef.current.clear()
  }, [])

  return { mapRef, drawSelectionMarkers, drawRouteResult, clearResult }
}
```

---

### 4.3 `frontend/src/components/map/SelectionControls.tsx` — Tạo mới

Panel điều khiển nổi trên bản đồ, vị trí góc trái dưới.

```typescript
import type { SelectionMode, LatLng } from '../../hooks/usePointSelection'

interface Props {
  mode: SelectionMode
  fromPoint: LatLng | null
  toPoint: LatLng | null
  bufferRadius: number
  onActivateMode: (mode: SelectionMode) => void
  onSetFromGPS: () => void
  onSetBufferRadius: (n: number) => void
  onClear: () => void
}

export const SelectionControls = ({
  mode, fromPoint, toPoint, bufferRadius,
  onActivateMode, onSetFromGPS, onSetBufferRadius, onClear,
}: Props) => {
  return (
    // absolute: nổi trên map | z-10: trên WMS layers | pointer-events-auto: nhận click
    <div className="absolute bottom-8 left-4 z-10 bg-white rounded-xl shadow-lg p-4 w-56 space-y-3">

      {/* Điểm đi */}
      <div className="space-y-1">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Điểm đi</p>
        <button
          onClick={() => onActivateMode('from')}
          className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            mode === 'from'
              ? 'bg-green-500 text-white'          // active: nền xanh
              : fromPoint
              ? 'bg-green-100 text-green-800'      // đã chọn: nền xanh nhạt
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {mode === 'from'
            ? '✛ Click vào bản đồ...'
            : fromPoint
            ? `📍 ${fromPoint.lat.toFixed(4)}, ${fromPoint.lng.toFixed(4)}`
            : '📍 Chọn điểm đi'}
        </button>
        <button
          onClick={onSetFromGPS}
          className="w-full text-xs px-3 py-1.5 rounded-lg bg-gray-50 text-gray-500 hover:bg-gray-100 transition-colors"
        >
          🛰 Dùng vị trí hiện tại
        </button>
      </div>

      <hr className="border-gray-100" />

      {/* Điểm đến */}
      <div className="space-y-1">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Điểm đến</p>
        <button
          onClick={() => onActivateMode('to')}
          className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            mode === 'to'
              ? 'bg-red-500 text-white'
              : toPoint
              ? 'bg-red-100 text-red-800'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {mode === 'to'
            ? '✛ Click vào bản đồ...'
            : toPoint
            ? `🎯 ${toPoint.lat.toFixed(4)}, ${toPoint.lng.toFixed(4)}`
            : '🎯 Chọn điểm đến'}
        </button>
      </div>

      <hr className="border-gray-100" />

      {/* Buffer slider */}
      <div className="space-y-1">
        <div className="flex justify-between items-center">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Buffer</p>
          <span className="text-xs font-mono text-gray-700">
            {(bufferRadius / 1000).toFixed(1)} km
          </span>
        </div>
        <input
          type="range"
          min={500} max={3000} step={100}
          value={bufferRadius}
          onChange={e => onSetBufferRadius(Number(e.target.value))}
          className="w-full accent-blue-500"
        />
        <div className="flex justify-between text-xs text-gray-400">
          <span>500m</span>
          <span>3km</span>
        </div>
      </div>

      {/* Xóa */}
      {(fromPoint || toPoint) && (
        <>
          <hr className="border-gray-100" />
          <button
            onClick={onClear}
            className="w-full px-3 py-2 rounded-lg text-sm text-red-500 hover:bg-red-50 transition-colors"
          >
            🔄 Xóa / Tìm lại
          </button>
        </>
      )}
    </div>
  )
}
```

**Cursor crosshair khi mode active** — thêm vào `MapView.tsx` hoặc container div:

```typescript
// Truyền mode vào MapView và thêm class conditional
<div
  ref={mapDivRef}
  className={`w-full h-full ${mode ? 'cursor-crosshair' : ''}`}
/>
```

---

### 4.4 `frontend/src/App.tsx` — Cập nhật

Kết nối `usePointSelection` + `useMap` + `SelectionControls`.

```typescript
import { useRef, useEffect } from 'react'
import { useMap } from './hooks/useMap'
import { usePointSelection } from './hooks/usePointSelection'
import { SelectionControls } from './components/map/SelectionControls'
import Header from './components/layout/Header'

const App = () => {
  const mapDivRef = useRef<HTMLDivElement>(null)
  const {
    fromPoint, toPoint, mode, bufferRadius,
    activateMode, handleMapClick, setFromGPS, setBufferRadius, clear,
  } = usePointSelection()

  // Truyền handleMapClick vào useMap để map biết phải gọi khi có click
  // handleMapClick thay đổi mỗi khi mode thay đổi → useMap tự re-register listener
  const { mapRef, drawSelectionMarkers, drawRouteResult, clearResult } = useMap(
    mapDivRef,
    mode ? handleMapClick : undefined,  // chỉ đăng ký listener khi có mode active
  )

  // Mỗi khi điểm hoặc buffer thay đổi → vẽ lại markers
  useEffect(() => {
    drawSelectionMarkers({ from: fromPoint, to: toPoint, bufferRadius })
  }, [fromPoint, toPoint, bufferRadius, drawSelectionMarkers])

  return (
    <div className="relative w-full h-full">
      <div
        ref={mapDivRef}
        className={`absolute inset-0 ${mode ? 'cursor-crosshair' : ''}`}
      />
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
    </div>
  )
}

export default App
```

---

## 5. Lỗi Thường Gặp

### Lỗi 1: Nhầm thứ tự lng/lat trong OpenLayers

```typescript
// SAI — đảo ngược lat/lng
const center = fromLonLat([point.lat, point.lng])  // ❌ BẮC CỰC!

// ĐÚNG — OpenLayers và GeoJSON đều dùng [longitude, latitude]
const center = fromLonLat([point.lng, point.lat])  // ✅
```

**Quy tắc nhớ:** OpenLayers theo chuẩn **[X, Y] = [lng, lat]** — X là chiều ngang (kinh độ), Y là chiều dọc (vĩ độ).

---

### Lỗi 2: Quên convert từ EPSG:3857 sang WGS84 khi nhận click

```typescript
// SAI — coordinate từ click event là EPSG:3857 (đơn vị mét)
map.on('click', (e) => {
  const [lng, lat] = e.coordinate  // ❌ đây là [11775000, 2389000] (mét)
  callback({ lat, lng })           // sẽ gửi tọa độ sai lên API
})

// ĐÚNG
import { toLonLat } from 'ol/proj'
map.on('click', (e) => {
  const [lng, lat] = toLonLat(e.coordinate)  // ✅ → [105.8, 21.0] (độ)
  callback({ lat, lng })
})
```

---

### Lỗi 3: Buffer circle vẽ méo vì dùng sai hệ tọa độ

```typescript
// SAI — tạo Circle trong EPSG:4326, bán kính 1000 nghĩa là 1000 degrees!
const circle = new Circle(fromLonLat([lng, lat]), 1000)  // ❌ siêu to

// ĐÚNG — tạo Circle trong EPSG:3857, bán kính 1000 mét
const center3857 = fromLonLat([lng, lat])  // convert sang EPSG:3857 trước
const circle = new Circle(center3857, 1000)  // ✅ 1000 mét
```

---

### Lỗi 4: Map click handler không được cleanup → memory leak

```typescript
// SAI — không cleanup listener
useEffect(() => {
  map.on('click', handler)
  // thiếu return cleanup!
}, [handler])

// ĐÚNG
useEffect(() => {
  map.on('click', handler)
  return () => map.un('click', handler)  // ✅ cleanup khi handler thay đổi
}, [handler])
```

---

### Lỗi 5: Vẽ features chồng lên nhau vì không clear source

```typescript
// SAI — vẽ thêm vào mà không xóa cũ
const drawSelectionMarkers = (from, to) => {
  source.addFeature(new Feature(...))  // features cũ vẫn còn
}

// ĐÚNG — xóa hết rồi vẽ lại từ đầu
const drawSelectionMarkers = (from, to) => {
  source.clear()  // ✅ xóa features cũ
  if (from) source.addFeature(...)
  if (to)   source.addFeature(...)
}
```

---

### Lỗi 6: GPS API không có error handler → crash thầm lặng

```typescript
// SAI — không xử lý khi user từ chối
navigator.geolocation.getCurrentPosition(
  (pos) => { setFromPoint({ lat: pos.coords.latitude, lng: pos.coords.longitude }) }
  // thiếu error callback!
)

// ĐÚNG
navigator.geolocation.getCurrentPosition(
  (pos) => { setFromPoint({ lat: pos.coords.latitude, lng: pos.coords.longitude }) },
  (err) => { alert(`Không lấy được vị trí: ${err.message}`) }  // ✅
)
```

---

## 6. Verification

Sau khi code xong, kiểm tra các trường hợp sau trên trình duyệt:

```
✅ Click [📍 Điểm đi]     → nút sáng lên, cursor bản đồ đổi thành crosshair
✅ Click vào bản đồ        → marker xanh lá xuất hiện, cursor về bình thường
✅ Click [🎯 Điểm đến]    → nút sáng lên, cursor đổi thành crosshair
✅ Click vào bản đồ        → marker đỏ xuất hiện
✅ Kéo slider buffer       → 2 vòng tròn co/giãn realtime
✅ Click [🛰 Vị trí GPS]   → marker xanh lá tại vị trí thực (cần HTTPS hoặc localhost)
✅ Từ chối GPS             → hiện thông báo lỗi, không crash
✅ Click cùng nút 2 lần    → toggle off (nút tắt, cursor về bình thường)
✅ Click [🔄 Xóa]          → cả 2 marker và vòng tròn biến mất
```
