import { Routes, Route, Navigate } from 'react-router-dom'
import MainLayout from '../layouts/MainLayout/MainLayout'
import DashboardLayout from '../components/Dashboard/DashboardLayout'
import ProtectedRoute from '../components/Dashboard/ProtectedRoute'
import RoleRoute from '../components/Dashboard/RoleRoute'
import Home from '../pages/Home/Home'
import RedirectSolicitudes from './RedirectSolicitudes'
import Afiliacion from '../pages/Afiliacion/Afiliacion'
import ReportarAveria from '../pages/ReportarAveria/ReportarAveria'
import DocumentosPublicos from '../pages/Documentos/DocumentosPublicos'
import Login from '../pages/Login/Login'
import AccesoDenegado from '../pages/AccesoDenegado/AccesoDenegado'
import RecuperarPassword from '../pages/RecuperarPassword/RecuperarPassword'
import RestablecerPassword from '../pages/RestablecerPassword/RestablecerPassword'
import VerificarCuenta from '../pages/VerificarCuenta/VerificarCuenta'
import DashboardHome from '../pages/Dashboard/DashboardHome'
import Abonados from '../pages/Dashboard/Abonados'
import SolicitudesPajaAgua from '../pages/Dashboard/SolicitudesPajaAgua'
import SolicitudesCambioPropietario from '../pages/Dashboard/SolicitudesCambioPropietario'
import SolicitudesCambioRepresentante from '../pages/Dashboard/SolicitudesCambioRepresentante'
import SolicitudesCambioMedidor from '../pages/Dashboard/SolicitudesCambioMedidor'
import SolicitudesOtro from '../pages/Dashboard/SolicitudesOtro'
import SolicitudesConexion from '../pages/Dashboard/SolicitudesConexion'
import NuevaPajaAgua from '../pages/Dashboard/NuevaPajaAgua'
import Inventario from '../pages/Dashboard/Inventario'
import MovimientosStock from '../pages/Dashboard/MovimientosStock'
import Proveedores from '../pages/Dashboard/Proveedores'
import AveriasAdmin from '../pages/Dashboard/AveriasAdmin'
import ActividadFontanero from '../pages/Dashboard/ActividadFontanero'
import MisAverias from '../pages/Dashboard/MisAverias'
import Publicaciones from '../pages/Dashboard/Publicaciones'
import DocumentosAdmin from '../pages/Dashboard/DocumentosAdmin'
import Seguridad from '../pages/Dashboard/Seguridad'
import PerfilEditar from '../pages/Dashboard/PerfilEditar'
import PerfilContrasena from '../pages/Dashboard/PerfilContrasena'
import Reportes from '../pages/Dashboard/Reportes'
import { ROLES_REPORTES } from '../lib/exportacionReportes'
import ContactoAsadaPage from '../pages/Dashboard/ContactoAsadaPage'
import HorarioAsadaPage from '../pages/Dashboard/HorarioAsadaPage'
import EmpleadosPage from '../pages/Dashboard/EmpleadosPage'
import DocumentosOficialesPage from '../pages/Dashboard/DocumentosOficialesPage'
import Bitacora from '../pages/Dashboard/Bitacora'
import Componentes from '../pages/Dashboard/Componentes'

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
      {/* Denegación de permisos: queda fuera de /dashboard para no depender de
          la sesión ni del sidebar (también la sirve RoleRoute y el 403 de
          apiClient vía GestorAcceso). */}
      <Route path="/acceso-denegado" element={<AccesoDenegado />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardHome />} />
        <Route
          path="abonados"
          element={
            <RoleRoute role={['Administrador', 'Junta Directiva']}>
              <Abonados />
            </RoleRoute>
          }
        />
        <Route
          path="solicitudes"
          element={
            <RoleRoute role={['Administrador', 'Junta Directiva', 'Abonado']}>
              <RedirectSolicitudes />
            </RoleRoute>
          }
        />
        <Route
          path="solicitudes/paja-de-agua"
          element={
            <RoleRoute role={['Administrador', 'Junta Directiva']}>
              <SolicitudesPajaAgua />
            </RoleRoute>
          }
        />
        <Route
          path="solicitudes/nueva-paja-de-agua"
          element={
            <RoleRoute role="Abonado">
              <NuevaPajaAgua />
            </RoleRoute>
          }
        />
        <Route
          path="solicitudes/cambio-propietario"
          element={
            <RoleRoute role={['Administrador', 'Junta Directiva', 'Abonado']}>
              <SolicitudesCambioPropietario />
            </RoleRoute>
          }
        />
        <Route
          path="solicitudes/cambio-representante"
          element={
            <RoleRoute role={['Administrador', 'Junta Directiva', 'Abonado']}>
              <SolicitudesCambioRepresentante />
            </RoleRoute>
          }
        />
        <Route
          path="solicitudes/cambio-medidor"
          element={
            <RoleRoute role={['Administrador', 'Junta Directiva', 'Abonado']}>
              <SolicitudesCambioMedidor />
            </RoleRoute>
          }
        />
        <Route
          path="solicitudes/otro"
          element={
            <RoleRoute role={['Administrador', 'Junta Directiva', 'Abonado']}>
              <SolicitudesOtro />
            </RoleRoute>
          }
        />
        <Route
          path="solicitudes/conexion-servicio"
          element={
            <RoleRoute role={['Administrador', 'Junta Directiva', 'Abonado']}>
              <SolicitudesConexion />
            </RoleRoute>
          }
        />
        <Route
          path="inventario"
          element={
            <RoleRoute role={['Administrador', 'Junta Directiva']}>
              <Navigate to="/dashboard/inventario/articulos" replace />
            </RoleRoute>
          }
        />
        <Route
          path="inventario/articulos"
          element={
            <RoleRoute role={['Administrador', 'Junta Directiva']}>
              <Inventario />
            </RoleRoute>
          }
        />
        <Route
          path="inventario/movimientos"
          element={
            <RoleRoute role={['Administrador', 'Junta Directiva']}>
              <MovimientosStock />
            </RoleRoute>
          }
        />
        <Route
          path="inventario/proveedores"
          element={
            <RoleRoute role={['Administrador', 'Junta Directiva']}>
              <Proveedores />
            </RoleRoute>
          }
        />
        <Route
          path="averias"
          element={
            <RoleRoute role={['Administrador', 'Junta Directiva']}>
              <AveriasAdmin />
            </RoleRoute>
          }
        />
        <Route
          path="averias/fontanero"
          element={
            <RoleRoute role={['Administrador', 'Junta Directiva', 'Fontanero']}>
              <ActividadFontanero />
            </RoleRoute>
          }
        />
        <Route
          path="mis-averias"
          element={
            <RoleRoute role="Abonado">
              <MisAverias />
            </RoleRoute>
          }
        />
        <Route
          path="reportes"
          element={
            <RoleRoute role={ROLES_REPORTES}>
              <Reportes />
            </RoleRoute>
          }
        />
        <Route
          path="administrativo"
          element={
            <RoleRoute role={['Administrador', 'Junta Directiva']}>
              <Publicaciones />
            </RoleRoute>
          }
        />
        <Route
          path="documentos"
          element={
            <RoleRoute role={['Administrador', 'Junta Directiva']}>
              <DocumentosAdmin />
            </RoleRoute>
          }
        />
        <Route
          path="seguridad"
          element={
            <RoleRoute role={['Administrador', 'Junta Directiva']}>
              <Seguridad />
            </RoleRoute>
          }
        />
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
        <Route
          path="contacto-asada"
          element={
            <RoleRoute role={['Administrador', 'Junta Directiva']}>
              <ContactoAsadaPage />
            </RoleRoute>
          }
        />
        <Route
          path="horario-asada"
          element={
            <RoleRoute role={['Administrador', 'Junta Directiva']}>
              <HorarioAsadaPage />
            </RoleRoute>
          }
        />
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
          element={
            <RoleRoute role={['Abonado', 'Administrador', 'Junta Directiva']}>
              <DocumentosOficialesPage />
            </RoleRoute>
          }
        />
        {/* Referencia de componentes: solo en desarrollo (npm run dev). */}
        {import.meta.env.DEV && <Route path="componentes" element={<Componentes />} />}
      </Route>

      <Route
        path="*"
        element={
          <div className="flex min-h-screen items-center justify-center bg-primary-50">
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