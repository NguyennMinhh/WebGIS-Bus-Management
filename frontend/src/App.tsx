import { useEffect, useRef, useState } from 'react'

import Header from './components/layout/Header'
import MapView from './components/map/MapView'
import { SelectionControls } from './components/map/SelectionControls'
import { RouteResultPanel } from './components/search/RouteResultPanel'
import { useMap } from './hooks/useMap'
import { usePointSelection } from './hooks/usePointSelection'
import { useRouteSearch } from './hooks/useRouteSearch'

const APP_LOG_PREFIX = '[App]'

const App = () => {
  const containerRef = useRef<HTMLDivElement>(null)
  const selection = usePointSelection()
  const [selectedRouteIndex, setSelectedRouteIndex] = useState<number | null>(null)
  const [showBusRoutes, setShowBusRoutes] = useState(false)
  const [showBusStops, setShowBusStops] = useState(false)

  const {
    drawSelectionMarkers,
    drawRouteResults,
    clearRouteResults,
    setOverlayLayerVisibility,
  } = useMap(
    containerRef,
    selection.handleMapClick,
  )

  const { results, status, error, emptyMessage, search } = useRouteSearch(
    selection.fromPoint,
    selection.toPoint,
    selection.bufferRadius,
  )

  useEffect(() => {
    drawSelectionMarkers({
      from: selection.fromPoint,
      to: selection.toPoint,
      bufferRadius: selection.bufferRadius,
    })
  }, [
    selection.fromPoint,
    selection.toPoint,
    selection.bufferRadius,
    drawSelectionMarkers,
  ])

  useEffect(() => {
    drawRouteResults(results, selectedRouteIndex)
  }, [results, selectedRouteIndex, drawRouteResults])

  useEffect(() => {
    setOverlayLayerVisibility('bus-routes', showBusRoutes)
  }, [setOverlayLayerVisibility, showBusRoutes])

  useEffect(() => {
    setOverlayLayerVisibility('bus-stops', showBusStops)
  }, [setOverlayLayerVisibility, showBusStops])

  useEffect(() => {
    console.info(`${APP_LOG_PREFIX} Route results updated.`, {
      resultCount: results.length,
      status,
    })
    setSelectedRouteIndex(null)
  }, [results, status])

  const handleClear = () => {
    console.info(`${APP_LOG_PREFIX} Clearing selected points and route results.`)
    selection.clear()
    clearRouteResults()
    setSelectedRouteIndex(null)
  }

  const handleRouteSelect = (index: number) => {
    console.info(`${APP_LOG_PREFIX} Route card clicked.`, {
      index,
      routeRef: results[index]?.route.ref,
    })
    setSelectedRouteIndex(index)
  }

  const handleToggleBusRoutes = () => {
    setShowBusRoutes((currentValue) => {
      const nextValue = !currentValue

      console.info(`${APP_LOG_PREFIX} Bus route layer toggle clicked.`, {
        visible: nextValue,
      })

      return nextValue
    })
  }

  const handleToggleBusStops = () => {
    setShowBusStops((currentValue) => {
      const nextValue = !currentValue

      console.info(`${APP_LOG_PREFIX} Bus stop layer toggle clicked.`, {
        visible: nextValue,
      })

      return nextValue
    })
  }

  return (
    <div className="relative h-full w-full">
      <div className="absolute inset-0">
        <MapView containerRef={containerRef} mode={selection.mode} />
      </div>

      <Header />
      <SelectionControls
        mode={selection.mode}
        fromPoint={selection.fromPoint}
        toPoint={selection.toPoint}
        bufferRadius={selection.bufferRadius}
        showBusRoutes={showBusRoutes}
        showBusStops={showBusStops}
        isLocating={selection.isLocating}
        errorMessage={selection.errorMessage}
        onActivateMode={selection.activateMode}
        onSetFromGPS={selection.setFromGPS}
        onSetBufferRadius={selection.updateBufferRadius}
        onToggleBusRoutes={handleToggleBusRoutes}
        onToggleBusStops={handleToggleBusStops}
        onSearch={search}
        onClear={handleClear}
      />
      <RouteResultPanel
        results={results}
        status={status}
        error={error}
        emptyMessage={emptyMessage}
        selectedIndex={selectedRouteIndex}
        onSelect={handleRouteSelect}
      />
    </div>
  )
}

export default App
