import { useCallback, useEffect, useRef } from 'react'
import type { RefObject } from 'react'

import Feature from 'ol/Feature'
import Map from 'ol/Map'
import type MapBrowserEvent from 'ol/MapBrowserEvent'
import View from 'ol/View'
import CircleGeometry from 'ol/geom/Circle'
import LineString from 'ol/geom/LineString'
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
  BUS_ROUTES_SLD_BODY,
  BUS_STOPS_SLD_BODY,
  GEOSERVER_WMS_URL,
  LAYER_BUS_ROUTES,
  LAYER_BUS_STOPS,
  MAP_CENTER,
  MAP_ZOOM,
  ROUTE_COLORS,
} from '../utils/mapConfig'
import type { LngLat, RouteOption } from '../types'

const ROUTE_MAP_LOG_PREFIX = '[RouteMap]'

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

type OverlayLayerName = 'bus-routes' | 'bus-stops'

const toRgbaColor = (hexColor: string, opacity: number) => {
  const normalized = hexColor.replace('#', '')

  if (normalized.length !== 6) {
    return hexColor
  }

  const red = Number.parseInt(normalized.slice(0, 2), 16)
  const green = Number.parseInt(normalized.slice(2, 4), 16)
  const blue = Number.parseInt(normalized.slice(4, 6), 16)

  return `rgba(${red}, ${green}, ${blue}, ${opacity})`
}

export const useMap = (
  targetRef: RefObject<HTMLDivElement>,
  onMapClick?: (point: LngLat) => void,
) => {
  const mapRef = useRef<Map | null>(null)
  const selectionSourceRef = useRef(new VectorSource())
  const routeSourceRef = useRef(new VectorSource())
  const routeStopSourceRef = useRef(new VectorSource())

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
      visible: false,
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
      visible: false,
      properties: { name: 'bus-stops' },
    })

    const routeLayer = new VectorLayer({
      source: routeSourceRef.current,
      properties: { name: 'route-results-overlay' },
      zIndex: 20,
    })

    const routeStopLayer = new VectorLayer({
      source: routeStopSourceRef.current,
      properties: { name: 'route-result-stops-overlay' },
      zIndex: 25,
    })

    const selectionLayer = new VectorLayer({
      source: selectionSourceRef.current,
      properties: { name: 'selection-overlay' },
      zIndex: 30,
    })

    const map = new Map({
      target: targetRef.current,
      layers: [
        osmLayer,
        busRoutesLayer,
        busStopsLayer,
        routeLayer,
        routeStopLayer,
        selectionLayer,
      ],
      view: new View({
        center: fromLonLat(MAP_CENTER),
        zoom: MAP_ZOOM,
      }),
    })

    mapRef.current = map

    console.info(`${ROUTE_MAP_LOG_PREFIX} Map initialized.`)

    return () => {
      console.info(`${ROUTE_MAP_LOG_PREFIX} Map disposed.`)
      selectionSourceRef.current.clear()
      routeSourceRef.current.clear()
      routeStopSourceRef.current.clear()
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

      console.info(`${ROUTE_MAP_LOG_PREFIX} Map click captured.`, { point })
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

      console.info(`${ROUTE_MAP_LOG_PREFIX} Redrawing selection markers.`, {
        from,
        to,
        bufferRadius,
      })

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

  const drawRouteResults = useCallback(
    (results: RouteOption[], selectedIndex: number | null) => {
      const routeSource = routeSourceRef.current
      const routeStopSource = routeStopSourceRef.current
      routeSource.clear()
      routeStopSource.clear()

      if (results.length === 0) {
        console.info(`${ROUTE_MAP_LOG_PREFIX} Cleared route results because no routes are available.`)
        return
      }

      const hasSelectedRoute =
        selectedIndex !== null && selectedIndex >= 0 && selectedIndex < results.length

      console.info(`${ROUTE_MAP_LOG_PREFIX} Drawing route results.`, {
        resultCount: results.length,
        selectedIndex,
      })

      results.forEach((option, index) => {
        if (option.sub_route.type !== 'LineString') {
          console.warn(`${ROUTE_MAP_LOG_PREFIX} Skipped route with unsupported geometry type.`, {
            index,
            routeRef: option.route.ref,
            geometryType: option.sub_route.type,
          })
          return
        }

        if (option.sub_route.coordinates.length < 2) {
          console.warn(`${ROUTE_MAP_LOG_PREFIX} Skipped route with too few coordinates.`, {
            index,
            routeRef: option.route.ref,
          })
          return
        }

        const color = ROUTE_COLORS[index % ROUTE_COLORS.length]
        const isSelected = hasSelectedRoute && selectedIndex === index
        const opacity = !hasSelectedRoute || isSelected ? 1 : 0.3
        const width = isSelected ? 6 : 4
        const geometry = new LineString(
          option.sub_route.coordinates.map((coordinate) => fromLonLat(coordinate)),
        )
        const feature = new Feature({ geometry })

        feature.setProperties({
          routeIndex: index,
          routeRef: option.route.ref,
          distanceM: option.distance_m,
        })
        feature.setStyle(
          new Style({
            stroke: new Stroke({
              color: toRgbaColor(color, opacity),
              width,
            }),
            zIndex: isSelected ? 2 : 1,
          }),
        )

        routeSource.addFeature(feature)

        option.stops.forEach((stop, stopIndex) => {
          const isEndpoint = stopIndex === 0 || stopIndex === option.stops.length - 1
          const stopFeature = new Feature({
            geometry: new Point(fromLonLat([stop.lng, stop.lat])),
          })

          stopFeature.setProperties({
            routeIndex: index,
            routeRef: option.route.ref,
            stopId: stop.id,
            stopSequence: stop.sequence,
            stopName: stop.name,
            isEndpoint,
          })
          stopFeature.setStyle(
            new Style({
              image: new CircleStyle({
                radius: isEndpoint ? 6 : 4,
                fill: new Fill({
                  color: toRgbaColor(color, opacity),
                }),
                stroke: new Stroke({
                  color: '#ffffff',
                  width: isEndpoint ? 2 : 1.5,
                }),
              }),
              zIndex: isSelected ? 4 : 3,
            }),
          )

          routeStopSource.addFeature(stopFeature)
        })

        console.debug(`${ROUTE_MAP_LOG_PREFIX} Route drawn.`, {
          index,
          routeRef: option.route.ref,
          coordinateCount: option.sub_route.coordinates.length,
          stopCount: option.stops.length,
          isSelected,
        })
      })

      if (!hasSelectedRoute) {
        return
      }

      const selectedFeature = routeSource
        .getFeatures()
        .find((feature) => feature.get('routeIndex') === selectedIndex)

      if (!selectedFeature) {
        console.warn(`${ROUTE_MAP_LOG_PREFIX} Selected route feature was not found after draw.`, {
          selectedIndex,
        })
        return
      }

      const geometry = selectedFeature.getGeometry()

      if (!geometry) {
        console.warn(`${ROUTE_MAP_LOG_PREFIX} Selected route feature has no geometry.`, {
          selectedIndex,
        })
        return
      }

      console.info(`${ROUTE_MAP_LOG_PREFIX} Fitting map to selected route.`, {
        selectedIndex,
        routeRef: selectedFeature.get('routeRef'),
      })

      mapRef.current?.getView().fit(geometry.getExtent(), {
        padding: [80, 440, 80, 80],
        maxZoom: 16,
        duration: 250,
      })
    },
    [],
  )

  const clearRouteResults = useCallback(() => {
    routeSourceRef.current.clear()
    routeStopSourceRef.current.clear()
    console.info(`${ROUTE_MAP_LOG_PREFIX} Route result layer cleared.`)
  }, [])

  const setOverlayLayerVisibility = useCallback(
    (layerName: OverlayLayerName, visible: boolean) => {
      const layer = mapRef.current
        ?.getLayers()
        .getArray()
        .find((currentLayer) => currentLayer.get('name') === layerName)

      if (!layer) {
        console.warn(`${ROUTE_MAP_LOG_PREFIX} Overlay layer not found for visibility update.`, {
          layerName,
          visible,
        })
        return
      }

      layer.setVisible(visible)

      console.info(`${ROUTE_MAP_LOG_PREFIX} Overlay layer visibility updated.`, {
        layerName,
        visible,
      })
    },
    [],
  )

  const flyTo = useCallback((lng: number, lat: number, zoom = 16) => {
    const view = mapRef.current?.getView()

    if (!view) {
      console.warn(`${ROUTE_MAP_LOG_PREFIX} Fly-to skipped because the map view is not ready.`, {
        lng,
        lat,
        zoom,
      })
      return
    }

    console.info(`${ROUTE_MAP_LOG_PREFIX} Flying to point.`, {
      lng,
      lat,
      zoom,
    })

    view.animate({
      center: fromLonLat([lng, lat]),
      zoom,
      duration: 250,
    })
  }, [])

  return {
    mapRef,
    drawSelectionMarkers,
    drawRouteResults,
    clearRouteResults,
    setOverlayLayerVisibility,
    flyTo,
  }
}
