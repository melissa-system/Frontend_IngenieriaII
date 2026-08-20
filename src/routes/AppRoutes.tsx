import { Routes, Route } from 'react-router-dom'
import MainLayout from '../layouts/MainLayout/MainLayout'
import DashboardLayout from '../components/Dashboard/DashboardLayout'
import ProtectedRoute from '../components/Dashboard/ProtectedRoute'
import Home from '../pages/Home/Home'
import Afiliacion from '../pages/Afiliacion/Afiliacion'
import ReportarAveria from '../pages/ReportarAveria/ReportarAveria'
import Login from '../pages/Login/Login'
import DashboardHome from '../pages/Dashboard/DashboardHome'
import Abonados from '../pages/Dashboard/Abonados'
import Solicitudes from '../pages/Dashboard/Solicitudes'
import Inventario from '../pages/Dashboard/Inventario'
import AveriasAdmin from '../pages/Dashboard/AveriasAdmin'
import Administrativo from '../pages/Dashboard/Administrativo'
import Seguridad from '../pages/Dashboard/Seguridad'
import Perfil from '../pages/Dashboard/Perfil'
import Reportes from '../pages/Dashboard/Reportes'

function AppRoutes() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/afiliacion" element={<Afiliacion />} />
        <Route path="/reportar-averia" element={<ReportarAveria />} />
      </Route>

      <Route path="/login" element={<Login />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardHome />} />
        <Route path="abonados" element={<Abonados />} />
        <Route path="solicitudes" element={<Solicitudes />} />
        <Route path="inventario" element={<Inventario />} />
        <Route path="averias" element={<AveriasAdmin />} />
        <Route path="reportes" element={<Reportes />} />
        <Route path="administrativo" element={<Administrativo />} />
        <Route path="seguridad" element={<Seguridad />} />
        <Route path="perfil" element={<Perfil />} />
      </Route>

      <Route
        path="*"
        element={
          <div className="flex min-h-screen items-center justify-center bg-gray-50">
            <div className="text-center">
              <h1 className="text-6xl font-bold text-primary-700">
                404
              </h1>
              <p className="mt-4 text-lg text-primary-600">
                Página no encontrada
              </p>
              <a
                href="/"
                className="mt-6 inline-block rounded-full bg-primary-700 px-6 py-3 text-sm font-semibold text-white hover:bg-primary-800"
              >
                Volver al inicio
              </a>
            </div>
          </div>
        }
      />
    </Routes>
  )
}

export default AppRoutes
