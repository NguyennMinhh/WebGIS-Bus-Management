import { useEffect, useRef } from 'react'

import Header from './components/layout/Header'
import MapView from './components/map/MapView'
import { SelectionControls } from './components/map/SelectionControls'
import { useMap } from './hooks/useMap'
import { usePointSelection } from './hooks/usePointSelection'

const App = () => {
  const containerRef = useRef<HTMLDivElement>(null)
  const selection = usePointSelection()
  const { drawSelectionMarkers } = useMap(containerRef, selection.handleMapClick)

  useEffect(() => {
    console.log('[App] Step 9: sync selection state to map overlay', {
      fromPoint: selection.fromPoint,
      toPoint: selection.toPoint,
      bufferRadius: selection.bufferRadius,
    })

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
        errorMessage={selection.errorMessage}
        onActivateMode={selection.activateMode}
        onSetFromGPS={selection.setFromGPS}
        onSetBufferRadius={selection.updateBufferRadius}
        onClear={selection.clear}
      />
    </div>
  )
}

export default App
