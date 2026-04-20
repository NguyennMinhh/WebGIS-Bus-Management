import { Navigate, Route, Routes } from 'react-router-dom'

import App from './App'
import ManageHome from './pages/manage/ManageHome'
import ManageLayout from './pages/manage/ManageLayout'
import RouteDetail from './pages/manage/RouteDetail'
import RouteForm from './pages/manage/RouteForm'
import RouteList from './pages/manage/RouteList'
import StopForm from './pages/manage/StopForm'
import StopList from './pages/manage/StopList'

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<App />} />
      <Route path="/manage" element={<ManageLayout />}>
        <Route index element={<ManageHome />} />
        <Route path="stops" element={<StopList />} />
        <Route path="stops/new" element={<StopForm />} />
        <Route path="stops/:id" element={<StopForm />} />
        <Route path="routes" element={<RouteList />} />
        <Route path="routes/new" element={<RouteForm />} />
        <Route path="routes/:id" element={<RouteDetail />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default AppRoutes
