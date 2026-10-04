import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import MainLayout from '../layouts/MainLayout/MainLayout'
import DashboardLayout from '../components/Dashboard/DashboardLayout'
import ProtectedRoute from '../components/Dashboard/ProtectedRoute'
import RoleRoute from '../components/Dashboard/RoleRoute'
import RedirectSolicitudes from './RedirectSolicitudes'
import RouteLoadingFallback from '../components/common/RouteLoadingFallback'
import { ROLES_REPORTES } from '../lib/exportacionReportes'

// Rutas públicas de entrada principal (carga directa)
import Home from '../pages/Home/Home'
import Afiliacion from '../pages/Afiliacion/Afiliacion'
import ReportarAveria from '../pages/ReportarAveria/ReportarAveria'
import DocumentosPublicos from '../pages/Documentos/DocumentosPublicos'
import Login from '../pages/Login/Login'
import RecuperarPassword from '../pages/RecuperarPassword/RecuperarPassword'
import RestablecerPassword from '../pages/RestablecerPassword/RestablecerPassword'
import VerificarCuenta from '../pages/VerificarCuenta/VerificarCuenta'

// Rutas del Dashboard divididas en chunks diferidos (Code Splitting con React.lazy)
// Esto aísla librerías pesadas como recharts, jspdf, html2canvas y docx del bundle inicial.
const DashboardHome = lazy(() => import('../pages/Dashboard/DashboardHome'))
const Abonados = lazy(() => import('../pages/Dashboard/Abonados'))
const SolicitudesPajaAgua = lazy(
  () => import('../pages/Dashboard/SolicitudesPajaAgua'),
)
const SolicitudesCambioPropietario = lazy(
  () => import('../pages/Dashboard/SolicitudesCambioPropietario'),
)
const SolicitudesCambioRepresentante = lazy(
  () => import('../pages/Dashboard/SolicitudesCambioRepresentante'),
)
const SolicitudesCambioMedidor = lazy(
  () => import('../pages/Dashboard/SolicitudesCambioMedidor'),
)
const SolicitudesOtro = lazy(() => import('../pages/Dashboard/SolicitudesOtro'))
const SolicitudesConexion = lazy(
  () => import('../pages/Dashboard/SolicitudesConexion'),
)
const NuevaPajaAgua = lazy(() => import('../pages/Dashboard/NuevaPajaAgua'))
const Inventario = lazy(() => import('../pages/Dashboard/Inventario'))
const MovimientosStock = lazy(
  () => import('../pages/Dashboard/MovimientosStock'),
)
const Proveedores = lazy(() => import('../pages/Dashboard/Proveedores'))
const AveriasAdmin = lazy(() => import('../pages/Dashboard/AveriasAdmin'))
const ActividadFontanero = lazy(
  () => import('../pages/Dashboard/ActividadFontanero'),
)
const MisAverias = lazy(() => import('../pages/Dashboard/MisAverias'))
const Publicaciones = lazy(() => import('../pages/Dashboard/Publicaciones'))
const DocumentosAdmin = lazy(() => import('../pages/Dashboard/DocumentosAdmin'))
const Seguridad = lazy(() => import('../pages/Dashboard/Seguridad'))
const PerfilEditar = lazy(() => import('../pages/Dashboard/PerfilEditar'))
const PerfilContrasena = lazy(
  () => import('../pages/Dashboard/PerfilContrasena'),
)
const Reportes = lazy(() => import('../pages/Dashboard/Reportes'))
const ContactoAsadaPage = lazy(
  () => import('../pages/Dashboard/ContactoAsadaPage'),
)
const HorarioAsadaPage = lazy(
  () => import('../pages/Dashboard/HorarioAsadaPage'),
)
const EmpleadosPage = lazy(() => import('../pages/Dashboard/EmpleadosPage'))
const DocumentosOficialesPage = lazy(
  () => import('../pages/Dashboard/DocumentosOficialesPage'),
)
const Bitacora = lazy(() => import('../pages/Dashboard/Bitacora'))
const Componentes = lazy(() => import('../pages/Dashboard/Componentes'))

function AppRoutes() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/afiliacion" element={<Afiliacion />} />
        <Route path="/reportar-averia" element={<ReportarAveria />} />
        <Route path="/documentos" element={<DocumentosPublicos />} />
      </Route>

      <Route path="/login" element={<Login />} />
      <Route path="/recuperar-password" element={<RecuperarPassword />} />
      <Route path="/restablecer-password" element={<RestablecerPassword />} />
      <Route path="/activar-cuenta" element={<VerificarCuenta />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Suspense fallback={<RouteLoadingFallback mensaje="Cargando panel institucional..." />}>
              <DashboardLayout />
            </Suspense>
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardHome />} />
        <Route path="abonados" element={<Abonados />} />
        <Route path="solicitudes" element={<RedirectSolicitudes />} />
        <Route
          path="solicitudes/paja-de-agua"
          element={<SolicitudesPajaAgua />}
        />
        <Route
          path="solicitudes/nueva-paja-de-agua"
          element={<NuevaPajaAgua />}
        />
        <Route
          path="solicitudes/cambio-propietario"
          element={<SolicitudesCambioPropietario />}
        />
        <Route
          path="solicitudes/cambio-representante"
          element={<SolicitudesCambioRepresentante />}
        />
        <Route
          path="solicitudes/cambio-medidor"
          element={<SolicitudesCambioMedidor />}
        />
        <Route path="solicitudes/otro" element={<SolicitudesOtro />} />
        <Route
          path="solicitudes/conexion-servicio"
          element={<SolicitudesConexion />}
        />
        <Route
          path="inventario"
          element={<Navigate to="/dashboard/inventario/articulos" replace />}
        />
        <Route path="inventario/articulos" element={<Inventario />} />
        <Route path="inventario/movimientos" element={<MovimientosStock />} />
        <Route path="inventario/proveedores" element={<Proveedores />} />
        <Route
          path="averias"
          element={
            <RoleRoute role={['Administrador', 'Junta Directiva']}>
              <AveriasAdmin />
            </RoleRoute>
          }
        />
        <Route path="averias/fontanero" element={<ActividadFontanero />} />
        <Route path="mis-averias" element={<MisAverias />} />
        <Route
          path="reportes"
          element={
            <RoleRoute role={ROLES_REPORTES}>
              <Reportes />
            </RoleRoute>
          }
        />
        <Route path="administrativo" element={<Publicaciones />} />
        <Route path="documentos" element={<DocumentosAdmin />} />
        <Route path="seguridad" element={<Seguridad />} />
        <Route
          path="auditoria"
          element={
            <RoleRoute role="Junta Directiva">
              <Bitacora />
            </RoleRoute>
          }
        />
        <Route path="perfil" element={<PerfilEditar />} />
        <Route path="perfil/contrasena" element={<PerfilContrasena />} />
        <Route path="contacto-asada" element={<ContactoAsadaPage />} />
        <Route path="horario-asada" element={<HorarioAsadaPage />} />
        <Route
          path="personal"
          element={
            <RoleRoute role="Junta Directiva">
              <EmpleadosPage />
            </RoleRoute>
          }
        />
        <Route
          path="documentos-oficiales"
          element={<DocumentosOficialesPage />}
        />
        {/* Referencia de componentes: solo en desarrollo (npm run dev). */}
        {import.meta.env.DEV && (
          <Route path="componentes" element={<Componentes />} />
        )}
      </Route>

      <Route
        path="*"
        element={
          <div className="flex min-h-screen items-center justify-center bg-primary-50">
            <div className="text-center">
              <h1 className="text-6xl font-bold text-primary-700">404</h1>
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