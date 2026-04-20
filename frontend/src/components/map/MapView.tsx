import type { RefObject } from 'react'

import type { SelectionMode } from '../../hooks/usePointSelection'

interface MapViewProps {
  containerRef: RefObject<HTMLDivElement>
  mode: SelectionMode
}

const MapView = ({ containerRef, mode }: MapViewProps) => {
  return (
    <div
      ref={containerRef}
      className={`h-full w-full ${mode ? 'cursor-crosshair' : 'cursor-default'}`}
      aria-label="Bus route map"
    />
  )
}

export default MapView
