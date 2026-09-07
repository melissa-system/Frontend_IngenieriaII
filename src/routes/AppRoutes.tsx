import { Routes, Route } from 'react-router-dom'
import MainLayout from '../layouts/MainLayout/MainLayout'
import DashboardLayout from '../components/Dashboard/DashboardLayout'
import ProtectedRoute from '../components/Dashboard/ProtectedRoute'
import Home from '../pages/Home/Home'
import RedirectSolicitudes from './RedirectSolicitudes'
import Afiliacion from '../pages/Afiliacion/Afiliacion'
import ReportarAveria from '../pages/ReportarAveria/ReportarAveria'
import Login from '../pages/Login/Login'
import RecuperarPassword from '../pages/RecuperarPassword/RecuperarPassword'
import RestablecerPassword from '../pages/RestablecerPassword/RestablecerPassword'
import VerificarCuenta from '../pages/VerificarCuenta/VerificarCuenta'
import DashboardHome from '../pages/Dashboard/DashboardHome'
import Abonados from '../pages/Dashboard/Abonados'
import SolicitudesPajaAgua from '../pages/Dashboard/SolicitudesPajaAgua'
import SolicitudesCambioDomicilio from '../pages/Dashboard/SolicitudesCambioDomicilio'
import SolicitudesCambioRepresentante from '../pages/Dashboard/SolicitudesCambioRepresentante'
import SolicitudesCambioMedidor from '../pages/Dashboard/SolicitudesCambioMedidor'
import SolicitudesTrasladoMedidor from '../pages/Dashboard/SolicitudesTrasladoMedidor'
import SolicitudesOtro from '../pages/Dashboard/SolicitudesOtro'
import Inventario from '../pages/Dashboard/Inventario'
import AveriasAdmin from '../pages/Dashboard/AveriasAdmin'
import Publicaciones from '../pages/Dashboard/Publicaciones'
import DocumentosAdmin from '../pages/Dashboard/DocumentosAdmin'
import Seguridad from '../pages/Dashboard/Seguridad'
import PerfilEditar from '../pages/Dashboard/PerfilEditar'
import PerfilContrasena from '../pages/Dashboard/PerfilContrasena'
import Reportes from '../pages/Dashboard/Reportes'
import ContactoAsadaPage from '../pages/Dashboard/ContactoAsadaPage'
import HorarioAsadaPage from '../pages/Dashboard/HorarioAsadaPage'
import EmpleadosPage from '../pages/Dashboard/EmpleadosPage'
import DocumentosOficialesPage from '../pages/Dashboard/DocumentosOficialesPage'

function AppRoutes() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/afiliacion" element={<Afiliacion />} />
        <Route path="/reportar-averia" element={<ReportarAveria />} />
      </Route>

      <Route path="/login" element={<Login />} />
      <Route path="/recuperar-password" element={<RecuperarPassword />} />
      <Route path="/restablecer-password" element={<RestablecerPassword />} />
      <Route path="/activar-cuenta" element={<VerificarCuenta />} />

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
        <Route
          path="solicitudes"
          element={<RedirectSolicitudes />}
        />
        <Route path="solicitudes/paja-de-agua" element={<SolicitudesPajaAgua />} />
        <Route path="solicitudes/cambio-domicilio" element={<SolicitudesCambioDomicilio />} />
        <Route path="solicitudes/cambio-representante" element={<SolicitudesCambioRepresentante />} />
        <Route path="solicitudes/cambio-medidor" element={<SolicitudesCambioMedidor />} />
        <Route path="solicitudes/traslado-medidor" element={<SolicitudesTrasladoMedidor />} />
        <Route path="solicitudes/otro" element={<SolicitudesOtro />} />
        <Route path="inventario" element={<Inventario />} />
        <Route path="averias" element={<AveriasAdmin />} />
        <Route path="reportes" element={<Reportes />} />
        <Route path="administrativo" element={<Publicaciones />} />
        <Route path="documentos" element={<DocumentosAdmin />} />
        <Route path="seguridad" element={<Seguridad />} />
        <Route path="perfil" element={<PerfilEditar />} />
        <Route path="perfil/contrasena" element={<PerfilContrasena />} />
        <Route path="contacto-asada" element={<ContactoAsadaPage />} />
        <Route path="horario-asada" element={<HorarioAsadaPage />} />
        <Route path="personal" element={<EmpleadosPage />} />
        <Route path="documentos-oficiales" element={<DocumentosOficialesPage />} />
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