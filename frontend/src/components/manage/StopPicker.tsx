import { useEffect, useState } from 'react'

import { listStops } from '../../services/manageApi'
import type { BusStop } from '../../types'

interface StopPickerProps {
  excludedStopIds: number[]
  isSubmitting?: boolean
  onSelect: (stop: BusStop) => Promise<void> | void
}

const StopPicker = ({
  excludedStopIds,
  isSubmitting = false,
  onSelect,
}: StopPickerProps) => {
  const excludedStopIdsKey = excludedStopIds.join(',')
  const [search, setSearch] = useState('')
  const [stops, setStops] = useState<BusStop[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    const timeoutId = window.setTimeout(async () => {
      try {
        setLoading(true)
        setError(null)

        const data = await listStops(search)

        if (!active) {
          return
        }

        setStops(data.filter((stop) => !excludedStopIds.includes(stop.id)))
      } catch (cause) {
        if (!active) {
          return
        }

        const message = cause instanceof Error ? cause.message : 'Failed to load bus stops.'
        setError(message)
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }, 250)

    return () => {
      active = false
      window.clearTimeout(timeoutId)
    }
  }, [excludedStopIdsKey, search])

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold text-slate-900">Add stop to route</h2>
        <p className="text-sm text-slate-600">
          Search existing stops and click one to append it to the end of this route.
        </p>
      </div>

      <label className="mt-5 block">
        <span className="mb-2 block text-sm font-medium text-slate-700">Search stops</span>
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Type a stop name"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
        />
      </label>

      <div className="mt-4 space-y-3">
        {loading && <p className="text-sm text-slate-500">Loading...</p>}
        {error && <p className="text-sm text-rose-600">{error}</p>}
        {!loading && !error && stops.length === 0 && (
          <p className="text-sm text-slate-500">No matching stops are available.</p>
        )}
        {!loading && !error && stops.length > 0 && (
          <div className="max-h-96 space-y-2 overflow-y-auto pr-1">
            {stops.map((stop) => (
              <button
                key={stop.id}
                type="button"
                onClick={() => void onSelect(stop)}
                disabled={isSubmitting}
                className="flex w-full items-start justify-between rounded-xl border border-slate-200 px-4 py-3 text-left transition hover:border-sky-300 hover:bg-sky-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span>
                  <span className="block font-medium text-slate-900">
                    {stop.name || `Stop ${stop.osm_id}`}
                  </span>
                  <span className="mt-1 block text-xs uppercase tracking-wide text-slate-500">
                    OSM {stop.osm_id}
                  </span>
                </span>
                <span className="text-sm font-medium text-sky-700">Add</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default StopPicker
