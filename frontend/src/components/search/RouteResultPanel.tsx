import { useEffect, useState } from 'react'

import type { RouteSearchStatus } from '../../hooks/useRouteSearch'
import type { RouteOption } from '../../types'
import { ROUTE_COLORS } from '../../utils/mapConfig'

interface RouteResultPanelProps {
  results: RouteOption[]
  status: RouteSearchStatus
  error: string | null
  emptyMessage: string | null
  selectedIndex: number | null
  onSelect: (index: number) => void
}

const ROUTE_RESULT_PANEL_LOG_PREFIX = '[RouteResultPanel]'

const formatDistance = (meters: number) =>
  meters >= 1000 ? `${(meters / 1000).toFixed(1)} km` : `${meters} m`

const formatStopCount = (count: number) => `${count} ${count === 1 ? 'stop' : 'stops'}`

const formatInterval = (interval: string) => {
  const match = /^00:(\d{2})-00:(\d{2})$/.exec(interval)

  if (!match) {
    return interval
  }

  return `${Number(match[1])}-${Number(match[2])} min`
}

export const RouteResultPanel = ({
  results,
  status,
  error,
  emptyMessage,
  selectedIndex,
  onSelect,
}: RouteResultPanelProps) => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null)

  useEffect(() => {
    if (selectedIndex === null) return

    setExpandedIndex(selectedIndex)
  }, [selectedIndex])

  useEffect(() => {
    setExpandedIndex((currentExpandedIndex) => {
      if (currentExpandedIndex === null) {
        return currentExpandedIndex
      }

      return currentExpandedIndex < results.length ? currentExpandedIndex : null
    })
  }, [results])

  if (status === 'idle') {
    return null
  }

  const showLoadingBanner = status === 'loading' && results.length > 0
  const showFullSpinner = status === 'loading' && results.length === 0

  return (
    <aside className="absolute right-4 top-16 z-20 flex h-[calc(100%-5rem)] w-96 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white/95 shadow-2xl backdrop-blur-sm">
      <div className="border-b border-slate-200 px-5 py-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
            Route Results
          </h2>
          <span className="text-xs font-medium text-slate-400">
            {results.length > 0 ? `${results.length} option${results.length === 1 ? '' : 's'}` : ''}
          </span>
        </div>
        <p className="mt-2 text-sm text-slate-600">
          Direct routes between the selected points within the current buffer.
        </p>
      </div>

      {showLoadingBanner ? (
        <div className="border-b border-amber-200 bg-amber-50 px-5 py-2 text-xs font-medium text-amber-800">
          Searching with the latest points and buffer...
        </div>
      ) : null}

      <div className="flex-1 overflow-y-auto">
        {showFullSpinner ? (
          <div className="flex h-full items-center justify-center px-6 text-sm text-slate-500">
            Searching direct routes...
          </div>
        ) : null}

        {status === 'error' ? (
          <div className="m-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error ?? 'Something went wrong while searching for routes.'}
          </div>
        ) : null}

        {status === 'success' && results.length === 0 ? (
          <div className="m-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            {emptyMessage ?? 'No direct route found. Try increasing the buffer radius.'}
          </div>
        ) : null}

        {results.map((option, index) => {
          const color = ROUTE_COLORS[index % ROUTE_COLORS.length]
          const isSelected = selectedIndex === index
          const isExpanded = expandedIndex === index

          return (
            <article
              key={`${option.route.id}-${option.from_stop.id}-${option.to_stop.id}`}
              className={`border-b border-slate-100 px-5 py-4 transition-colors ${
                isSelected ? 'bg-sky-50/80' : 'hover:bg-slate-50'
              }`}
              style={{ borderLeft: `4px solid ${color}` }}
            >
              <button
                type="button"
                onClick={() => {
                  console.info(`${ROUTE_RESULT_PANEL_LOG_PREFIX} Route selected.`, {
                    index,
                    routeRef: option.route.ref,
                  })
                  setExpandedIndex(index)
                  onSelect(index)
                }}
                className="w-full text-left"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className="mt-0.5 h-3 w-3 flex-shrink-0 rounded-full"
                        style={{ backgroundColor: color }}
                      />
                      <span className="text-base font-semibold text-slate-900">
                        Line {option.route.ref}
                      </span>
                    </div>
                    {option.route.name ? (
                      <p className="mt-1 text-sm text-slate-500">{option.route.name}</p>
                    ) : null}
                  </div>

                  <span
                    className={`rounded-full px-2 py-1 text-[11px] font-semibold uppercase tracking-wide ${
                      isSelected
                        ? 'bg-sky-100 text-sky-700'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {isSelected ? 'Selected' : 'Route'}
                  </span>
                </div>

                <div className="mt-4 space-y-2 text-sm text-slate-600">
                  <p>
                    <span className="font-medium text-slate-900">Board:</span>{' '}
                    {option.from_stop.name || `Stop #${option.from_stop.id}`}
                  </p>
                  <p>
                    <span className="font-medium text-slate-900">Alight:</span>{' '}
                    {option.to_stop.name || `Stop #${option.to_stop.id}`}
                  </p>
                </div>

                <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-500">
                  <span className="rounded-full bg-slate-100 px-2.5 py-1">
                    {formatStopCount(option.stop_count)}
                  </span>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1">
                    {formatDistance(option.distance_m)}
                  </span>
                  {option.route.charge ? (
                    <span className="rounded-full bg-slate-100 px-2.5 py-1">
                      Fare {option.route.charge}
                    </span>
                  ) : null}
                  {option.route.interval ? (
                    <span className="rounded-full bg-slate-100 px-2.5 py-1">
                      Every {formatInterval(option.route.interval)}
                    </span>
                  ) : null}
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  const nextExpandedIndex = isExpanded ? null : index

                  console.info(`${ROUTE_RESULT_PANEL_LOG_PREFIX} Stop list toggled.`, {
                    index,
                    routeRef: option.route.ref,
                    expanded: nextExpandedIndex === index,
                  })

                  setExpandedIndex(nextExpandedIndex)
                }}
                className="mt-3 text-sm font-medium text-sky-700 transition-colors hover:text-sky-900"
              >
                {isExpanded ? 'Hide full stop list' : 'See full stop list'}
              </button>

              {isExpanded ? (
                <ol className="mt-3 space-y-2 border-t border-slate-100 pt-3 text-sm text-slate-600">
                  {option.stops.map((stop) => (
                    <li key={`${stop.id}-${stop.sequence}`} className="flex gap-3">
                      <span className="w-8 flex-shrink-0 text-right text-xs font-medium text-slate-400">
                        #{stop.sequence}
                      </span>
                      <span>{stop.name || `Stop #${stop.id}`}</span>
                    </li>
                  ))}
                </ol>
              ) : null}
            </article>
          )
        })}
      </div>
    </aside>
  )
}
