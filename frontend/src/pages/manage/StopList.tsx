import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import ConfirmDialog from '../../components/manage/ConfirmDialog'
import DataTable, { type DataTableColumn } from '../../components/manage/DataTable'
import { deleteStop, listStops } from '../../services/manageApi'
import type { BusStop } from '../../types'

const StopList = () => {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [stops, setStops] = useState<BusStop[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stopToDelete, setStopToDelete] = useState<BusStop | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    let active = true

    const loadStops = async () => {
      try {
        setLoading(true)
        setError(null)

        const data = await listStops(search)

        if (active) {
          setStops(data)
        }
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
    }

    void loadStops()

    return () => {
      active = false
    }
  }, [search])

  const handleDelete = async () => {
    if (!stopToDelete) {
      return
    }

    try {
      setIsDeleting(true)
      await deleteStop(stopToDelete.id)
      setStops((currentStops) => currentStops.filter((stop) => stop.id !== stopToDelete.id))
      setStopToDelete(null)
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Failed to delete the stop.'
      setError(message)
    } finally {
      setIsDeleting(false)
    }
  }

  const columns: DataTableColumn<BusStop>[] = [
    {
      key: 'osm_id',
      header: 'OSM ID',
      render: (stop) => <span className="font-medium text-slate-900">{stop.osm_id}</span>,
    },
    {
      key: 'name',
      header: 'Name',
      render: (stop) => stop.name || '-',
    },
    {
      key: 'lat',
      header: 'Latitude',
      render: (stop) => stop.lat.toFixed(6),
    },
    {
      key: 'lng',
      header: 'Longitude',
      render: (stop) => stop.lng.toFixed(6),
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'whitespace-nowrap',
      render: (stop) => (
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => navigate(`/manage/stops/${stop.id}`)}
            className="text-sm font-medium text-sky-700 transition hover:text-sky-900"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => setStopToDelete(stop)}
            className="text-sm font-medium text-rose-600 transition hover:text-rose-700"
          >
            Delete
          </button>
        </div>
      ),
    },
  ]

  return (
    <>
      <section className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
              Bus Stops
            </p>
            <h1 className="text-3xl font-semibold text-slate-900">Manage stops</h1>
            <p className="text-sm text-slate-600">
              Create stops and keep stop coordinates consistent with the map dataset.
            </p>
          </div>

          <Link
            to="/manage/stops/new"
            className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
          >
            New stop
          </Link>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">Search by name</span>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Type a stop name"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
            />
          </label>
        </div>

        {loading && <p className="text-sm text-slate-500">Loading...</p>}
        {error && <p className="text-sm text-rose-600">{error}</p>}
        {!loading && (
          <DataTable
            columns={columns}
            rows={stops}
            getRowKey={(stop) => stop.id}
            emptyMessage="No bus stops found."
          />
        )}
      </section>

      <ConfirmDialog
        open={stopToDelete !== null}
        title="Delete bus stop?"
        description="Are you sure? This cannot be undone."
        isLoading={isDeleting}
        onCancel={() => setStopToDelete(null)}
        onConfirm={() => void handleDelete()}
      />
    </>
  )
}

export default StopList
