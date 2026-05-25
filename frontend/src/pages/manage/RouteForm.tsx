import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { createRoute } from '../../services/manageApi'

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

const RouteForm = () => {
  const navigate = useNavigate()
  const [formState, setFormState] = useState<RouteFormState>(emptyFormState)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleChange = (field: keyof RouteFormState, value: string) => {
    setFormState((currentState) => ({
      ...currentState,
      [field]: value,
    }))
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    try {
      setSaving(true)
      setError(null)

      const route = await createRoute({
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

      navigate(`/manage/routes/${route.id}`)
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Failed to create the route.'
      setError(message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="mx-auto w-full max-w-4xl space-y-6">
      <div className="space-y-2">
        <Link to="/manage/routes" className="text-sm font-medium text-sky-700 hover:text-sky-900">
          Back to routes
        </Link>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
          Bus Routes
        </p>
        <h1 className="text-3xl font-semibold text-slate-900">Create route</h1>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
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

          <div className="flex justify-end gap-3 border-t border-slate-200 pt-5">
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
              {saving ? 'Saving...' : 'Create route'}
            </button>
          </div>
        </form>
      </div>
    </section>
  )
}

export default RouteForm
