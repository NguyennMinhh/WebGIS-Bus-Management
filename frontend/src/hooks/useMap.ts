import { useCallback, useEffect, useRef } from 'react'
import type { RefObject } from 'react'

import Feature from 'ol/Feature'
import Map from 'ol/Map'
import type MapBrowserEvent from 'ol/MapBrowserEvent'
import View from 'ol/View'
import CircleGeometry from 'ol/geom/Circle'
import Point from 'ol/geom/Point'
import { fromCircle } from 'ol/geom/Polygon'
import TileLayer from 'ol/layer/Tile'
import VectorLayer from 'ol/layer/Vector'
import OSM from 'ol/source/OSM'
import TileWMS from 'ol/source/TileWMS'
import VectorSource from 'ol/source/Vector'
import { fromLonLat, toLonLat } from 'ol/proj'
import CircleStyle from 'ol/style/Circle'
import Fill from 'ol/style/Fill'
import Stroke from 'ol/style/Stroke'
import Style from 'ol/style/Style'
import 'ol/ol.css'

import {
  MAP_CENTER,
  MAP_ZOOM,
  GEOSERVER_WMS_URL,
  LAYER_BUS_ROUTES,
  LAYER_BUS_STOPS,
  BUS_ROUTES_SLD_BODY,
  BUS_STOPS_SLD_BODY,
} from '../utils/mapConfig'
import type { LngLat } from '../types'

const fromMarkerStyle = new Style({
  image: new CircleStyle({
    radius: 8,
    fill: new Fill({ color: '#16a34a' }),
    stroke: new Stroke({ color: '#ffffff', width: 2 }),
  }),
})

const toMarkerStyle = new Style({
  image: new CircleStyle({
    radius: 8,
    fill: new Fill({ color: '#dc2626' }),
    stroke: new Stroke({ color: '#ffffff', width: 2 }),
  }),
})

const fromBufferStyle = new Style({
  stroke: new Stroke({ color: '#16a34a', width: 2, lineDash: [6, 4] }),
  fill: new Fill({ color: 'rgba(22, 163, 74, 0.10)' }),
})

const toBufferStyle = new Style({
  stroke: new Stroke({ color: '#dc2626', width: 2, lineDash: [6, 4] }),
  fill: new Fill({ color: 'rgba(220, 38, 38, 0.10)' }),
})

interface DrawSelectionMarkersParams {
  from: LngLat | null
  to: LngLat | null
  bufferRadius: number
}

export const useMap = (
  targetRef: RefObject<HTMLDivElement>,
  onMapClick?: (point: LngLat) => void,
) => {
  const mapRef = useRef<Map | null>(null)
  const selectionSourceRef = useRef(new VectorSource())

  useEffect(() => {
    if (!targetRef.current || mapRef.current) return

    const osmLayer = new TileLayer({
      source: new OSM(),
      properties: { name: 'osm-base' },
    })

    const busRoutesLayer = new TileLayer({
      source: new TileWMS({
        url: GEOSERVER_WMS_URL,
        params: {
          LAYERS: LAYER_BUS_ROUTES,
          FORMAT: 'image/png',
          TRANSPARENT: true,
          TILED: true,
          SLD_BODY: BUS_ROUTES_SLD_BODY,
        },
        serverType: 'geoserver',
      }),
      opacity: 0.8,
      properties: { name: 'bus-routes' },
    })

    const busStopsLayer = new TileLayer({
      source: new TileWMS({
        url: GEOSERVER_WMS_URL,
        params: {
          LAYERS: LAYER_BUS_STOPS,
          FORMAT: 'image/png',
          TRANSPARENT: true,
          TILED: true,
          SLD_BODY: BUS_STOPS_SLD_BODY,
        },
        serverType: 'geoserver',
      }),
      properties: { name: 'bus-stops' },
    })

    const selectionLayer = new VectorLayer({
      source: selectionSourceRef.current,
      properties: { name: 'selection-overlay' },
      zIndex: 10,
    })

    const map = new Map({
      target: targetRef.current,
      layers: [osmLayer, busRoutesLayer, busStopsLayer, selectionLayer],
      view: new View({
        center: fromLonLat(MAP_CENTER),
        zoom: MAP_ZOOM,
      }),
    })

    mapRef.current = map

    return () => {
      selectionSourceRef.current.clear()
      map.setTarget(undefined)
      mapRef.current = null
    }
  }, [targetRef])

  useEffect(() => {
    const map = mapRef.current

    if (!map || !onMapClick) return

    const handleClick = (event: MapBrowserEvent) => {
      const [lng, lat] = toLonLat(event.coordinate)
      const point: LngLat = [lng, lat]

      onMapClick(point)
    }

    map.on('click', handleClick)

    return () => {
      map.un('click', handleClick)
    }
  }, [onMapClick])

  const drawSelectionMarkers = useCallback(
    ({ from, to, bufferRadius }: DrawSelectionMarkersParams) => {
      const source = selectionSourceRef.current
      source.clear()

      const drawSinglePoint = (
        point: LngLat,
        markerStyle: Style,
        bufferStyle: Style,
      ) => {
        const center = fromLonLat(point)
        const markerFeature = new Feature({
          geometry: new Point(center),
        })
        const bufferFeature = new Feature({
          geometry: fromCircle(new CircleGeometry(center, bufferRadius), 64),
        })

        markerFeature.setStyle(markerStyle)
        bufferFeature.setStyle(bufferStyle)
        source.addFeatures([bufferFeature, markerFeature])
      }

      if (from) {
        drawSinglePoint(from, fromMarkerStyle, fromBufferStyle)
      }

      if (to) {
        drawSinglePoint(to, toMarkerStyle, toBufferStyle)
      }
    },
    [],
  )

  return { mapRef, drawSelectionMarkers }
}
