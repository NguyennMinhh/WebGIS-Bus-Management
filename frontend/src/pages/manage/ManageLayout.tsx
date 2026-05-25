import { Outlet } from 'react-router-dom'

import Header from '../../components/layout/Header'

const ManageLayout = () => {
  return (
    <div className="min-h-screen bg-slate-100">
      <Header />
      <main className="mx-auto flex min-h-[calc(100vh-3.5rem)] max-w-6xl flex-col px-4 py-8">
        <Outlet />
      </main>
    </div>
  )
}

export default ManageLayout
