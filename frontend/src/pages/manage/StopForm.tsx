import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import ConfirmDialog from '../../components/manage/ConfirmDialog'
import { createStop, deleteStop, getStop, updateStop } from '../../services/manageApi'

interface StopFormState {
  osm_id: string
  name: string
  lat: string
  lng: string
}

const emptyFormState: StopFormState = {
  osm_id: '',
  name: '',
  lat: '',
  lng: '',
}

const StopForm = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEditing = Boolean(id)
  const [formState, setFormState] = useState<StopFormState>(emptyFormState)
  const [loading, setLoading] = useState(isEditing)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  useEffect(() => {
    if (!isEditing || !id) {
      setLoading(false)
      return
    }

    let active = true

    const loadStop = async () => {
      try {
        setLoading(true)
        setError(null)

        const stop = await getStop(id)

        if (!active) {
          return
        }

        setFormState({
          osm_id: stop.osm_id,
          name: stop.name,
          lat: String(stop.lat),
          lng: String(stop.lng),
        })
      } catch (cause) {
        if (!active) {
          return
        }

        const message = cause instanceof Error ? cause.message : 'Failed to load the stop.'
        setError(message)
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    void loadStop()

    return () => {
      active = false
    }
  }, [id, isEditing])

  const handleChange = (field: keyof StopFormState, value: string) => {
    setFormState((currentState) => ({
      ...currentState,
      [field]: value,
    }))
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const lat = Number(formState.lat)
    const lng = Number(formState.lng)

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      setError('Latitude and longitude must be valid numbers.')
      return
    }

    try {
      setSaving(true)
      setError(null)

      const payload = {
        osm_id: formState.osm_id.trim(),
        name: formState.name.trim(),
        lat,
        lng,
      }

      if (isEditing && id) {
        await updateStop(id, payload)
      } else {
        await createStop(payload)
      }

      navigate('/manage/stops')
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Failed to save the stop.'
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
      await deleteStop(id)
      navigate('/manage/stops')
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Failed to delete the stop.'
      setError(message)
    } finally {
      setDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  return (
    <>
      <section className="mx-auto w-full max-w-3xl space-y-6">
        <div className="space-y-2">
          <Link to="/manage/stops" className="text-sm font-medium text-sky-700 hover:text-sky-900">
            Back to stops
          </Link>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
            Bus Stops
          </p>
          <h1 className="text-3xl font-semibold text-slate-900">
            {isEditing ? 'Edit stop' : 'Create stop'}
          </h1>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          {loading ? (
            <p className="text-sm text-slate-500">Loading...</p>
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
                  <span className="mb-2 block text-sm font-medium text-slate-700">Name</span>
                  <input
                    type="text"
                    value={formState.name}
                    onChange={(event) => handleChange('name', event.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">Latitude</span>
                  <input
                    type="number"
                    step="any"
                    value={formState.lat}
                    onChange={(event) => handleChange('lat', event.target.value)}
                    required
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">Longitude</span>
                  <input
                    type="number"
                    step="any"
                    value={formState.lng}
                    onChange={(event) => handleChange('lng', event.target.value)}
                    required
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                  />
                </label>
              </div>

              {error && <p className="text-sm text-rose-600">{error}</p>}

              <div className="flex flex-col gap-3 border-t border-slate-200 pt-5 md:flex-row md:items-center md:justify-between">
                <div>
                  {isEditing && (
                    <button
                      type="button"
                      onClick={() => setShowDeleteDialog(true)}
                      className="rounded-lg border border-rose-200 px-4 py-2 text-sm font-medium text-rose-600 transition hover:border-rose-300 hover:text-rose-700"
                    >
                      Delete stop
                    </button>
                  )}
                </div>
                <div className="flex gap-3">
                  <Link
                    to="/manage/stops"
                    className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
                  >
                    Cancel
                  </Link>
                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {saving ? 'Saving...' : isEditing ? 'Save changes' : 'Create stop'}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </section>

      <ConfirmDialog
        open={showDeleteDialog}
        title="Delete bus stop?"
        description="Are you sure? This cannot be undone."
        isLoading={deleting}
        onCancel={() => setShowDeleteDialog(false)}
        onConfirm={() => void handleDelete()}
      />
    </>
  )
}

export default StopForm
