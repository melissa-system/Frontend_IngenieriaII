# Lista de vistas revisadas y corregidas

Revisión de cada vista contra la lista de `componentes.md`. Todas pasan la revisión automática `tests/guiaEstilos.test.ts` (sin `gray-*`/`slate-*`, sin `rounded-md`, botones y selects `rounded-full`, modales con `Modal`, tablas con `Table`, h1 del dashboard estándar, sin `EmptyState`/`BadgeEstado` duplicados).

La columna "Componentes estándar" lista los de `src/components/ui/` que ya usa cada vista. Las vistas del landing y las que muestran "— (clases de la guía)" no tienen botones/tablas/modales propios que reemplazar: siguen las clases documentadas en `botones.md`, `tarjetas-y-secciones.md` y `tipografia.md` (los CTA del landing conservan sus efectos de hover propios, definidos en esa guía).

| Módulo | Vista | Archivo | Componentes estándar |
|---|---|---|---|
| Abonados | Abonados | `pages/Dashboard/Abonados.tsx` | Button, Modal, Table, PageHeader |
| Solicitudes | Paja de Agua (gestión) | `pages/Dashboard/SolicitudesPajaAgua.tsx` | Button, Modal, Table, EmptyState, BadgeEstado |
| Solicitudes | Nueva paja de agua (Abonado / personal) | `pages/Dashboard/NuevaPajaAgua.tsx` | PageHeader |
| Solicitudes | Conexión de Servicio | `pages/Dashboard/SolicitudesConexion.tsx` | Button, Modal, Table, EmptyState, BadgeEstado |
| Solicitudes | Cambio de Propietario | `pages/Dashboard/SolicitudesCambioPropietario.tsx` | Button, Modal, Table, Tabs, EmptyState, BadgeEstado |
| Solicitudes | Cambio de Representante | `pages/Dashboard/SolicitudesCambioRepresentante.tsx` | Button, Modal, Table, Tabs, EmptyState, BadgeEstado |
| Solicitudes | Cambio de Medidor por Daños | `pages/Dashboard/SolicitudesCambioMedidor.tsx` | Button, Modal, Table, Tabs, EmptyState, BadgeEstado |
| Solicitudes | Otro | `pages/Dashboard/SolicitudesOtro.tsx` | Button, Modal, Table, Tabs, EmptyState, BadgeEstado |
| Inventario | Artículos | `pages/Dashboard/Inventario.tsx` | Button, Modal, Table, PageHeader |
| Inventario | Proveedores | `pages/Dashboard/Proveedores.tsx` | Button, Modal, Table, PageHeader |
| Inventario | Movimientos de Stock | `pages/Dashboard/MovimientosStock.tsx` | Button, Table |
| Reportes de averías | Averías (administración) | `pages/Dashboard/AveriasAdmin.tsx` | Button, Modal, Table |
| Reportes de averías | Mis averías (fontanero) | `pages/Dashboard/MisAverias.tsx` | Button, Modal, Table |
| Seguridad y personal | Usuarios / Seguridad | `components/Dashboard/Usuarios.tsx` | Button, Modal, Table, PageHeader |
| Seguridad y personal | Empleados | `pages/Dashboard/EmpleadosPage.tsx` | Button, Modal, Table |
| Seguridad y personal | Auditoría (Bitácora) | `pages/Dashboard/Bitacora.tsx` | Button, Table |
| Fontanero | Reporte de actividad | `pages/Dashboard/ReporteActividad.tsx` | Button, Table, Tabs |
| Fontanero | Reportes del fontanero | `pages/Dashboard/ReportesFontanero.tsx` | Button, Modal, Table |
| Edición de página | Documentos (admin) | `pages/Dashboard/DocumentosAdmin.tsx` | Button, Modal |
| Edición de página | Noticias / Publicaciones | `pages/Dashboard/Publicaciones.tsx` | Button, Modal |
| Abonado | Documentos oficiales | `pages/Dashboard/DocumentosOficialesPage.tsx` | Button |
| Reportes | Reportes estadísticos | `pages/Dashboard/Reportes.tsx` | Button, PageHeader |
| Perfil | Editar perfil | `pages/Dashboard/PerfilEditar.tsx` | Button |
| Perfil | Cambio de contraseña | `pages/Dashboard/PerfilContrasena.tsx` | Button |
| Público | Solicitud de paja de agua (/afiliacion) | `pages/Afiliacion/Afiliacion.tsx` | Button |
| Público | Reportar avería | `pages/ReportarAveria/ReportarAveria.tsx` | Button |
| Público | Login | `pages/Login/Login.tsx` | Button |
| Público | Recuperar contraseña | `pages/RecuperarPassword/RecuperarPassword.tsx` | Button |
| Público | Restablecer contraseña | `pages/RestablecerPassword/RestablecerPassword.tsx` | Button |
| Público | Documentos públicos | `pages/Documentos/DocumentosPublicos.tsx` | Button |
| Público | Verificar cuenta | `pages/VerificarCuenta/VerificarCuenta.tsx` | — (clases de la guía) |
| Landing | Navbar | `components/Navbar/Navbar.tsx` | Button |
| Landing | Hero | `components/Hero/Hero.tsx` | — (clases de la guía) |
| Landing | Sobre nosotros | `components/AboutUs/AboutUs.tsx` | — (clases de la guía) |
| Landing | Servicios | `components/Services/Services.tsx` | — (clases de la guía) |
| Landing | Noticias | `components/News/News.tsx` | — (clases de la guía) |
| Landing | Ubicación | `components/Location/Location.tsx` | — (clases de la guía) |
| Landing | Footer | `components/Footer/Footer.tsx` | — (clases de la guía) |

## Correcciones aplicadas en todas las vistas

- Botones: `rounded-lg`/`rounded-md` pasaron a `rounded-full`; los de acción usan `Button` (`primary`, `secondary`, `danger`, `success`, `info`).
- Modales: todos los `fixed inset-0 ...` hechos a mano usan `Modal` (mismo ancho, scroll y capa que antes).
- Tablas: contenedor, cabecera (`text-left font-medium text-primary-700`) y divisores unificados con `Table`; el paginador se conserva como pie de la tabla.
- Encabezados: `PageHeader` en las vistas con título + botón de crear; todos los h1 del dashboard son `text-2xl font-semibold text-primary-900` (se corrigió `font-bold` en Documentos oficiales).
- Colores: Más de 60 usos de `gray-*`/`slate-*` pasaron a `primary-*`. Se mantienen los colores semánticos de estado (`green`, `yellow`, `red`, `blue`, `indigo`) y los hex de los gráficos de Reportes y del trazo de la firma.
- Duplicados eliminados: `EmptyState`, `BadgeEstado`/`estadoColor`/`ESTADO_LABELS` (6 copias), pestañas Lista/Crear repetidas, constantes `modalBgCls`/`modalCls`.

## Excepciones documentadas

- Fila "Perfil" del sidebar: es una fila de menú (no un botón de acción), conserva `rounded-lg` como el resto de filas del menú.
- Botones con clases dinámicas (iconos, interruptores de estado, pastillas del paginador) siguen como `<button>` con las clases de la guía, porque `Button` solo cubre las variantes estándar.
- CTA del landing (Hero, Servicios, Navbar): conservan `hover:-translate-y-1` y sombra definidos en `botones.md`.
