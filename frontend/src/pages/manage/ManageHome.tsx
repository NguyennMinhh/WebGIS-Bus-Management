import { Link } from 'react-router-dom'

const cards = [
  {
    title: 'Bus Stops',
    description: 'Search, create, edit, and remove stops used across the route network.',
    to: '/manage/stops',
  },
  {
    title: 'Bus Routes',
    description: 'Maintain route metadata and assign or remove stops from each route.',
    to: '/manage/routes',
  },
]

const ManageHome = () => {
  return (
    <section className="space-y-8">
      <div className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
          Management
        </p>
        <h1 className="text-3xl font-semibold text-slate-900">Bus network maintenance</h1>
        <p className="max-w-2xl text-sm text-slate-600">
          Choose an entity to manage. The map and route-finder remain available on the main page.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {cards.map((card) => (
          <Link
            key={card.to}
            to={card.to}
            className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
          >
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-700">
              Manage
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-slate-900">{card.title}</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">{card.description}</p>
            <span className="mt-8 inline-flex text-sm font-medium text-slate-900">
              Open section
            </span>
          </Link>
        ))}
      </div>
    </section>
  )
}

export default ManageHome
