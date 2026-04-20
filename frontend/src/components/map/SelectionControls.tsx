import type { SelectionMode } from '../../hooks/usePointSelection'
import type { LngLat } from '../../types'

interface SelectionControlsProps {
  mode: SelectionMode
  fromPoint: LngLat | null
  toPoint: LngLat | null
  bufferRadius: number
  showBusRoutes: boolean
  showBusStops: boolean
  isLocating: boolean
  errorMessage: string | null
  onActivateMode: (mode: SelectionMode) => void
  onSetFromGPS: () => void
  onSetBufferRadius: (bufferRadius: number) => void
  onToggleBusRoutes: () => void
  onToggleBusStops: () => void
  onSearch: () => void
  onClear: () => void
}

const formatPoint = (point: LngLat) =>
  `${point[1].toFixed(5)}, ${point[0].toFixed(5)}`

const getButtonClasses = (
  currentMode: SelectionMode,
  buttonMode: Exclude<SelectionMode, null>,
  hasPoint: boolean,
) => {
  if (currentMode === buttonMode) {
    return buttonMode === 'from'
      ? 'bg-green-600 text-white'
      : 'bg-red-600 text-white'
  }

  if (hasPoint) {
    return buttonMode === 'from'
      ? 'bg-green-100 text-green-800'
      : 'bg-red-100 text-red-800'
  }

  return 'bg-slate-100 text-slate-700 hover:bg-slate-200'
}

export const SelectionControls = ({
  mode,
  fromPoint,
  toPoint,
  bufferRadius,
  showBusRoutes,
  showBusStops,
  isLocating,
  errorMessage,
  onActivateMode,
  onSetFromGPS,
  onSetBufferRadius,
  onToggleBusRoutes,
  onToggleBusStops,
  onSearch,
  onClear,
}: SelectionControlsProps) => {
  const isSearchDisabled = !fromPoint || !toPoint

  return (
    <div className="absolute bottom-6 left-4 z-20 w-72 space-y-4 rounded-xl bg-white/95 p-4 shadow-lg backdrop-blur-sm">
      {errorMessage ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {errorMessage}
        </div>
      ) : null}

      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            From
          </p>
          {fromPoint ? (
            <span className="text-[11px] font-medium text-green-700">Selected</span>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => onActivateMode('from')}
          className={`w-full rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors ${getButtonClasses(mode, 'from', Boolean(fromPoint))}`}
        >
          {mode === 'from'
            ? 'Click on the map to pick the start point'
            : fromPoint
              ? formatPoint(fromPoint)
              : 'Pick start point'}
        </button>
        <button
          type="button"
          onClick={onSetFromGPS}
          disabled={isLocating}
          className="w-full rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLocating ? 'Locating...' : 'Use my location'}
        </button>
      </section>

      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            To
          </p>
          {toPoint ? (
            <span className="text-[11px] font-medium text-red-700">Selected</span>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => onActivateMode('to')}
          className={`w-full rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors ${getButtonClasses(mode, 'to', Boolean(toPoint))}`}
        >
          {mode === 'to'
            ? 'Click on the map to pick the destination'
            : toPoint
              ? formatPoint(toPoint)
              : 'Pick destination'}
        </button>
      </section>

      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Buffer
          </p>
          <span className="text-sm font-medium text-slate-700">
            {(bufferRadius / 1000).toFixed(1)} km
          </span>
        </div>
        <input
          type="range"
          min={500}
          max={3000}
          step={100}
          value={bufferRadius}
          onChange={(event) => onSetBufferRadius(Number(event.target.value))}
          className="w-full accent-blue-600"
        />
        <div className="flex justify-between text-xs text-slate-400">
          <span>500 m</span>
          <span>3 km</span>
        </div>
        <button
          type="button"
          onClick={onSearch}
          disabled={isSearchDisabled}
          className="mt-2 w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Find Routes
        </button>
      </section>

      <section className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Layers
        </p>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onToggleBusRoutes}
            className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              showBusRoutes
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Bus routes
          </button>
          <button
            type="button"
            onClick={onToggleBusStops}
            className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              showBusStops
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Bus stops
          </button>
        </div>
      </section>

      <button
        type="button"
        onClick={onClear}
        className="w-full rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-700"
      >
        Clear
      </button>
    </div>
  )
}
