import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import ConfirmDialog from '../../components/manage/ConfirmDialog'
import StopPicker from '../../components/manage/StopPicker'
import {
  addStopToRoute,
  deleteRoute,
  getRoute,
  removeStopFromRoute,
  updateRoute,
} from '../../services/manageApi'
import type { BusRouteDetail, BusStop } from '../../types'

interface RouteFormState {
  osm_id: string
  ref: string
  name: string
  from_stop: string
  to_stop: string
  operator: string
  opening_hours: string
  charge: string
  interval: string
}

const emptyFormState: RouteFormState = {
  osm_id: '',
  ref: '',
  name: '',
  from_stop: '',
  to_stop: '',
  operator: '',
  opening_hours: '',
  charge: '',
  interval: '',
}

const RouteDetail = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const [route, setRoute] = useState<BusRouteDetail | null>(null)
  const [formState, setFormState] = useState<RouteFormState>(emptyFormState)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [updatingStops, setUpdatingStops] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [assignmentError, setAssignmentError] = useState<string | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  useEffect(() => {
    if (!id) {
      setError('Route id is missing.')
      setLoading(false)
      return
    }

    let active = true

    const loadRoute = async () => {
      try {
        setLoading(true)
        setError(null)

        const data = await getRoute(id)

        if (!active) {
          return
        }

        setRoute(data)
        setFormState({
          osm_id: data.osm_id,
          ref: data.ref,
          name: data.name,
          from_stop: data.from_stop,
          to_stop: data.to_stop,
          operator: data.operator,
          opening_hours: data.opening_hours,
          charge: data.charge,
          interval: data.interval,
        })
      } catch (cause) {
        if (!active) {
          return
        }

        const message = cause instanceof Error ? cause.message : 'Failed to load the route.'
        setError(message)
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    void loadRoute()

    return () => {
      active = false
    }
  }, [id])

  const handleChange = (field: keyof RouteFormState, value: string) => {
    setFormState((currentState) => ({
      ...currentState,
      [field]: value,
    }))
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!id || !route) {
      return
    }

    try {
      setSaving(true)
      setError(null)

      const updatedRoute = await updateRoute(id, {
        osm_id: formState.osm_id.trim(),
        ref: formState.ref.trim(),
        name: formState.name.trim(),
        from_stop: formState.from_stop.trim(),
        to_stop: formState.to_stop.trim(),
        operator: formState.operator.trim(),
        opening_hours: formState.opening_hours.trim(),
        charge: formState.charge.trim(),
        interval: formState.interval.trim(),
      })

      setRoute({
        ...updatedRoute,
        stops: route.stops,
      })
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Failed to save the route.'
      setError(message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!id) {
      return
    }

    try {
      setDeleting(true)
      setError(null)
      await deleteRoute(id)
      navigate('/manage/routes')
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Failed to delete the route.'
      setError(message)
    } finally {
      setDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  const handleAddStop = async (stop: BusStop) => {
    if (!id || !route) {
      return
    }

    try {
      setUpdatingStops(true)
      setAssignmentError(null)
      const response = await addStopToRoute(id, stop.id)
      setRoute({
        ...route,
        stops: response.stops,
      })
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Failed to add the stop.'
      setAssignmentError(message)
    } finally {
      setUpdatingStops(false)
    }
  }

  const handleRemoveStop = async (stopId: number) => {
    if (!id || !route) {
      return
    }

    try {
      setUpdatingStops(true)
      setAssignmentError(null)
      const response = await removeStopFromRoute(id, stopId)
      setRoute({
        ...route,
        stops: response.stops,
      })
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Failed to remove the stop.'
      setAssignmentError(message)
    } finally {
      setUpdatingStops(false)
    }
  }

  return (
    <>
      <section className="space-y-6">
        <div className="space-y-2">
          <Link
            to="/manage/routes"
            className="text-sm font-medium text-sky-700 transition hover:text-sky-900"
          >
            Back to routes
          </Link>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
            Bus Routes
          </p>
          <h1 className="text-3xl font-semibold text-slate-900">Route detail</h1>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          {loading ? (
            <p className="text-sm text-slate-500">Loading...</p>
          ) : !route ? (
            <p className="text-sm text-rose-600">{error ?? 'Route not found.'}</p>
          ) : (
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="grid gap-5 md:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">OSM ID</span>
                  <input
                    type="text"
                    value={formState.osm_id}
                    onChange={(event) => handleChange('osm_id', event.target.value)}
                    required
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">Ref</span>
                  <input
                    type="text"
                    value={formState.ref}
                    onChange={(event) => handleChange('ref', event.target.value)}
                    required
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                  />
                </label>

                <label className="block md:col-span-2">
                  <span className="mb-2 block text-sm font-medium text-slate-700">Name</span>
                  <input
                    type="text"
                    value={formState.name}
                    onChange={(event) => handleChange('name', event.target.value)}
                    required
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">From stop</span>
                  <input
                    type="text"
                    value={formState.from_stop}
                    onChange={(event) => handleChange('from_stop', event.target.value)}
                    required
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">To stop</span>
                  <input
                    type="text"
                    value={formState.to_stop}
                    onChange={(event) => handleChange('to_stop', event.target.value)}
                    required
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">Operator</span>
                  <input
                    type="text"
                    value={formState.operator}
                    onChange={(event) => handleChange('operator', event.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">
                    Opening hours
                  </span>
                  <input
                    type="text"
                    value={formState.opening_hours}
                    onChange={(event) => handleChange('opening_hours', event.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">Charge</span>
                  <input
                    type="text"
                    value={formState.charge}
                    onChange={(event) => handleChange('charge', event.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">Interval</span>
                  <input
                    type="text"
                    value={formState.interval}
                    onChange={(event) => handleChange('interval', event.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                  />
                </label>
              </div>

              {error && <p className="text-sm text-rose-600">{error}</p>}

              <div className="flex flex-col gap-3 border-t border-slate-200 pt-5 md:flex-row md:items-center md:justify-between">
                <button
                  type="button"
                  onClick={() => setShowDeleteDialog(true)}
                  className="rounded-lg border border-rose-200 px-4 py-2 text-sm font-medium text-rose-600 transition hover:border-rose-300 hover:text-rose-700"
                >
                  Delete route
                </button>

                <div className="flex gap-3">
                  <Link
                    to="/manage/routes"
                    className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
                  >
                    Cancel
                  </Link>
                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {saving ? 'Saving...' : 'Save changes'}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>

        {!loading && route && (
          <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="space-y-1">
                <h2 className="text-lg font-semibold text-slate-900">Assigned stops</h2>
                <p className="text-sm text-slate-600">
                  Stops are appended to the end of the route. Removing a stop compacts the
                  sequence automatically.
                </p>
              </div>

              {assignmentError && <p className="mt-4 text-sm text-rose-600">{assignmentError}</p>}

              <div className="mt-5 space-y-3">
                {route.stops.length === 0 ? (
                  <p className="text-sm text-slate-500">No stops assigned yet.</p>
                ) : (
                  route.stops.map((stop) => (
                    <div
                      key={stop.id}
                      className="flex items-start justify-between gap-4 rounded-xl border border-slate-200 px-4 py-3"
                    >
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {stop.sequence}. {stop.name || `Stop ${stop.id}`}
                        </p>
                        <p className="mt-1 text-xs uppercase tracking-wide text-slate-500">
                          {stop.lat.toFixed(6)}, {stop.lng.toFixed(6)}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => void handleRemoveStop(stop.id)}
                        disabled={updatingStops}
                        className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Remove
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            <StopPicker
              excludedStopIds={route.stops.map((stop) => stop.id)}
              isSubmitting={updatingStops}
              onSelect={handleAddStop}
            />
          </div>
        )}
      </section>

      <ConfirmDialog
        open={showDeleteDialog}
        title="Delete bus route?"
        description="Are you sure? This cannot be undone."
        isLoading={deleting}
        onCancel={() => setShowDeleteDialog(false)}
        onConfirm={() => void handleDelete()}
      />
    </>
  )
}

export default RouteDetail
