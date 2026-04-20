import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import ConfirmDialog from '../../components/manage/ConfirmDialog'
import DataTable, { type DataTableColumn } from '../../components/manage/DataTable'
import { deleteRoute, listRoutes } from '../../services/manageApi'
import type { BusRoute } from '../../types'

const RouteList = () => {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [routes, setRoutes] = useState<BusRoute[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [routeToDelete, setRouteToDelete] = useState<BusRoute | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    let active = true

    const loadRoutes = async () => {
      try {
        setLoading(true)
        setError(null)

        const data = await listRoutes(search)

        if (active) {
          setRoutes(data)
        }
      } catch (cause) {
        if (!active) {
          return
        }

        const message = cause instanceof Error ? cause.message : 'Failed to load bus routes.'
        setError(message)
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    void loadRoutes()

    return () => {
      active = false
    }
  }, [search])

  const handleDelete = async () => {
    if (!routeToDelete) {
      return
    }

    try {
      setIsDeleting(true)
      await deleteRoute(routeToDelete.id)
      setRoutes((currentRoutes) =>
        currentRoutes.filter((route) => route.id !== routeToDelete.id),
      )
      setRouteToDelete(null)
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Failed to delete the route.'
      setError(message)
    } finally {
      setIsDeleting(false)
    }
  }

  const columns: DataTableColumn<BusRoute>[] = [
    {
      key: 'ref',
      header: 'Ref',
      render: (route) => <span className="font-medium text-slate-900">{route.ref}</span>,
    },
    {
      key: 'name',
      header: 'Name',
      render: (route) => route.name || '-',
    },
    {
      key: 'from_stop',
      header: 'From',
      render: (route) => route.from_stop,
    },
    {
      key: 'to_stop',
      header: 'To',
      render: (route) => route.to_stop,
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'whitespace-nowrap',
      render: (route) => (
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => navigate(`/manage/routes/${route.id}`)}
            className="text-sm font-medium text-sky-700 transition hover:text-sky-900"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => setRouteToDelete(route)}
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
              Bus Routes
            </p>
            <h1 className="text-3xl font-semibold text-slate-900">Manage routes</h1>
            <p className="text-sm text-slate-600">
              Update route metadata and open a route to manage its stop assignments.
            </p>
          </div>

          <Link
            to="/manage/routes/new"
            className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
          >
            New route
          </Link>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">
              Search by ref or name
            </span>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Type a route ref or name"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
            />
          </label>
        </div>

        {loading && <p className="text-sm text-slate-500">Loading...</p>}
        {error && <p className="text-sm text-rose-600">{error}</p>}
        {!loading && (
          <DataTable
            columns={columns}
            rows={routes}
            getRowKey={(route) => route.id}
            emptyMessage="No bus routes found."
          />
        )}
      </section>

      <ConfirmDialog
        open={routeToDelete !== null}
        title="Delete bus route?"
        description="Are you sure? This cannot be undone."
        isLoading={isDeleting}
        onCancel={() => setRouteToDelete(null)}
        onConfirm={() => void handleDelete()}
      />
    </>
  )
}

export default RouteList
