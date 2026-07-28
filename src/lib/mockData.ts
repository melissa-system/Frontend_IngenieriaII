export interface Abonado {
  id: string
  cedula: string
  nombre: string
  telefono: string
  correo: string
  direccion: string
  estado: 'Activo' | 'Inactivo'
  fechaRegistro: string
}

export interface Solicitud {
  id: string
  codigo: string
  tipo: string
  solicitante: string
  cedula: string
  estado: 'Pendiente' | 'Aprobada' | 'Rechazada' | 'Completada'
  fecha: string
  notificado: boolean
}

export interface InventarioItem {
  id: string
  nombre: string
  categoria: string
  proveedor: string
  stock: number
  ubicacion: string
  stockMinimo: number
}

export interface AveriaAdmin {
  id: string
  tipo: string
  descripcion: string
  reportadoPor: string
  cedula: string
  fecha: string
  estado: 'Pendiente' | 'Asignada' | 'En progreso' | 'Resuelta'
  fontaneroAsignado: string
}

export interface UsuarioSistema {
  id: string
  nombre: string
  username: string
  rol: string
  email: string
  estado: 'Activo' | 'Inactivo'
}

export interface Publicacion {
  id: string
  titulo: string
  contenido: string
  fecha: string
  tipo: 'Noticia' | 'Comunicado' | 'Aviso'
  publicado: boolean
}

export interface Documento {
  id: string
  titulo: string
  tipo: string
  fecha: string
  archivo: string
}

export const MOCK_ABONADOS: Abonado[] = [
  { id: '1', cedula: '1-1234-5678', nombre: 'Carlos Martínez', telefono: '8888-1111', correo: 'carlos@email.com', direccion: '200m sur de la iglesia, Pueblo Nuevo', estado: 'Activo', fechaRegistro: '2024-01-15' },
  { id: '2', cedula: '2-2345-6789', nombre: 'María Rodríguez', telefono: '8888-2222', correo: 'maria@email.com', direccion: '100m este del salón comunal', estado: 'Activo', fechaRegistro: '2024-02-20' },
  { id: '3', cedula: '3-3456-7890', nombre: 'Juan Pérez', telefono: '8888-3333', correo: 'juan@email.com', direccion: '50m norte de la escuela', estado: 'Activo', fechaRegistro: '2024-03-10' },
  { id: '4', cedula: '1-4567-8901', nombre: 'Ana Jiménez', telefono: '8888-4444', correo: 'ana@email.com', direccion: 'Contiguo a la plaza de deportes', estado: 'Inactivo', fechaRegistro: '2024-01-05' },
  { id: '5', cedula: '2-5678-9012', nombre: 'Pedro Sánchez', telefono: '8888-5555', correo: 'pedro@email.com', direccion: '300m oeste de la entrada principal', estado: 'Activo', fechaRegistro: '2024-04-12' },
  { id: '6', cedula: '3-6789-0123', nombre: 'Lucía Fernández', telefono: '8888-6666', correo: 'lucia@email.com', direccion: 'Frente al cementerio, Pueblo Nuevo', estado: 'Activo', fechaRegistro: '2024-05-08' },
  { id: '7', cedula: '1-7890-1234', nombre: 'Roberto Quesada', telefono: '8888-7777', correo: 'roberto@email.com', direccion: '25m sur de la bomba', estado: 'Inactivo', fechaRegistro: '2024-02-28' },
  { id: '8', cedula: '2-8901-2345', nombre: 'Sofia Vargas', telefono: '8888-8888', correo: 'sofia@email.com', direccion: 'Detrás del ebais, Pueblo Nuevo', estado: 'Activo', fechaRegistro: '2024-06-01' },
  { id: '9', cedula: '3-9012-3456', nombre: 'Diego Mora', telefono: '8888-9999', correo: 'diego@email.com', direccion: 'Costado norte del parque', estado: 'Activo', fechaRegistro: '2024-03-22' },
  { id: '10', cedula: '1-0123-4567', nombre: 'Andrea Castro', telefono: '8888-0000', correo: 'andrea@email.com', direccion: 'Calle principal, contiguo a la ferretería', estado: 'Activo', fechaRegistro: '2024-07-15' },
]

export const MOCK_SOLICITUDES: Solicitud[] = [
  { id: '1', codigo: 'SOL-001', tipo: 'Nueva conexión', solicitante: 'Carlos Martínez', cedula: '1-1234-5678', estado: 'Aprobada', fecha: '2026-07-10', notificado: true },
  { id: '2', codigo: 'SOL-002', tipo: 'Cambio de domicilio', solicitante: 'María Rodríguez', cedula: '2-2345-6789', estado: 'Pendiente', fecha: '2026-07-15', notificado: false },
  { id: '3', codigo: 'SOL-003', tipo: 'Traslado de medidor', solicitante: 'Juan Pérez', cedula: '3-3456-7890', estado: 'Completada', fecha: '2026-07-05', notificado: true },
  { id: '4', codigo: 'SOL-004', tipo: 'Cambio de medidor', solicitante: 'Ana Jiménez', cedula: '1-4567-8901', estado: 'Pendiente', fecha: '2026-07-18', notificado: false },
  { id: '5', codigo: 'SOL-005', tipo: 'Cambio de representante', solicitante: 'Pedro Sánchez', cedula: '2-5678-9012', estado: 'Rechazada', fecha: '2026-07-01', notificado: true },
  { id: '6', codigo: 'SOL-006', tipo: 'Nueva conexión', solicitante: 'Lucía Fernández', cedula: '3-6789-0123', estado: 'Pendiente', fecha: '2026-07-20', notificado: false },
  { id: '7', codigo: 'SOL-007', tipo: 'Cambio de domicilio', solicitante: 'Roberto Quesada', cedula: '1-7890-1234', estado: 'Aprobada', fecha: '2026-07-08', notificado: true },
  { id: '8', codigo: 'SOL-008', tipo: 'Nueva conexión', solicitante: 'Sofia Vargas', cedula: '2-8901-2345', estado: 'Completada', fecha: '2026-06-28', notificado: true },
]

export const MOCK_INVENTARIO: InventarioItem[] = [
  { id: '1', nombre: 'Tubería PVC 1/2"', categoria: 'Material', proveedor: 'Distribuidora Ferretera CR', stock: 120, ubicacion: 'Bodega A', stockMinimo: 30 },
  { id: '2', nombre: 'Medidor de agua 1/2"', categoria: 'Medidor', proveedor: 'HidroTech', stock: 15, ubicacion: 'Bodega A', stockMinimo: 10 },
  { id: '3', nombre: 'Válvula de compuerta 1"', categoria: 'Material', proveedor: 'Ferretería El Constructor', stock: 8, ubicacion: 'Bodega B', stockMinimo: 5 },
  { id: '4', nombre: 'Llave Stillson 14"', categoria: 'Herramienta', proveedor: 'Herramientas Profesionales', stock: 4, ubicacion: 'Taller', stockMinimo: 2 },
  { id: '5', nombre: 'Codo PVC 1/2"', categoria: 'Material', proveedor: 'Distribuidora Ferretera CR', stock: 250, ubicacion: 'Bodega A', stockMinimo: 50 },
  { id: '6', nombre: 'Medidor de agua 3/4"', categoria: 'Medidor', proveedor: 'HidroTech', stock: 3, ubicacion: 'Bodega A', stockMinimo: 10 },
  { id: '7', nombre: 'Teflón (rollo)', categoria: 'Material', proveedor: 'Ferretería El Constructor', stock: 45, ubicacion: 'Bodega B', stockMinimo: 10 },
  { id: '8', nombre: 'Pala cuadrada', categoria: 'Herramienta', proveedor: 'Herramientas Profesionales', stock: 6, ubicacion: 'Taller', stockMinimo: 3 },
  { id: '9', nombre: 'Tubería PVC 1"', categoria: 'Material', proveedor: 'Distribuidora Ferretera CR', stock: 60, ubicacion: 'Bodega A', stockMinimo: 20 },
  { id: '10', nombre: 'LLave de paso 1/2"', categoria: 'Material', proveedor: 'Ferretería El Constructor', stock: 20, ubicacion: 'Bodega B', stockMinimo: 10 },
]

export const MOCK_AVERIAS_ADMIN: AveriaAdmin[] = [
  { id: '1', tipo: 'Fuga de agua', descripcion: 'Fuga en la tubería principal frente a la escuela', reportadoPor: 'Carlos Martínez', cedula: '1-1234-5678', fecha: '2026-07-22', estado: 'Resuelta', fontaneroAsignado: 'Pedro Sánchez' },
  { id: '2', tipo: 'Tubería rota', descripcion: 'Tubería rota por maquinaria en construcción', reportadoPor: 'María Rodríguez', cedula: '2-2345-6789', fecha: '2026-07-24', estado: 'Asignada', fontaneroAsignado: 'Juan Pérez' },
  { id: '3', tipo: 'Falta de presión', descripcion: 'Baja presión en todo el sector alto desde hace 2 días', reportadoPor: 'Ana Jiménez', cedula: '1-4567-8901', fecha: '2026-07-25', estado: 'Pendiente', fontaneroAsignado: '' },
  { id: '4', tipo: 'Contador dañado', descripcion: 'Medidor no registra consumo, parece dañado', reportadoPor: 'Lucía Fernández', cedula: '3-6789-0123', fecha: '2026-07-23', estado: 'En progreso', fontaneroAsignado: 'Pedro Sánchez' },
  { id: '5', tipo: 'Fuga en la vía pública', descripcion: 'Agua brotando en la calle principal cerca del salón comunal', reportadoPor: 'Diego Mora', cedula: '3-9012-3456', fecha: '2026-07-26', estado: 'Pendiente', fontaneroAsignado: '' },
]

export const MOCK_USUARIOS: UsuarioSistema[] = [
  { id: '1', nombre: 'Administrador SIAPB', username: 'admin', rol: 'Administrador', email: 'admin@siapb.cr', estado: 'Activo' },
  { id: '2', nombre: 'Fontanero Principal', username: 'fontanero', rol: 'Fontanero', email: 'fontanero@siapb.cr', estado: 'Activo' },
  { id: '3', nombre: 'María Rodríguez', username: 'mrodriguez', rol: 'Junta Directiva', email: 'mrodriguez@siapb.cr', estado: 'Activo' },
  { id: '4', nombre: 'Carlos Martínez', username: 'cmartinez', rol: 'Junta Directiva', email: 'cmartinez@siapb.cr', estado: 'Activo' },
  { id: '5', nombre: 'Ana Jiménez', username: 'ajimenez', rol: 'Abonado', email: 'ajimenez@email.com', estado: 'Activo' },
]

export const MOCK_PUBLICACIONES: Publicacion[] = [
  { id: '1', titulo: 'Nueva tarifa aprobada para el período 2026', contenido: 'La Asamblea de ASADA Pueblo Nuevo aprobó los ajustes en la tarifa del servicio, vigentes a partir del próximo trimestre.', fecha: '2026-06-15', tipo: 'Comunicado', publicado: true },
  { id: '2', titulo: 'Suspensión temporal del servicio', contenido: 'El próximo jueves suspenderemos el servicio de 8:00 a.m. a 2:00 p.m. en el sector alto de Pueblo Nuevo para reparar una fuga en la línea principal.', fecha: '2026-07-10', tipo: 'Aviso', publicado: true },
  { id: '3', titulo: 'Jornada de limpieza de quebradas', contenido: 'Invitamos a la comunidad a participar en la jornada de limpieza de las quebradas cercanas.', fecha: '2026-02-20', tipo: 'Noticia', publicado: true },
  { id: '4', titulo: 'Mantenimiento programado en tanque', contenido: 'Realizaremos limpieza y mantenimiento preventivo en el tanque de captación.', fecha: '2026-07-02', tipo: 'Aviso', publicado: false },
]

export const MOCK_DOCUMENTOS: Documento[] = [
  { id: '1', titulo: 'Acta Asamblea General 2026', tipo: 'Acta', fecha: '2026-01-15', archivo: 'acta_2026.pdf' },
  { id: '2', titulo: 'Informe de Gestión Anual 2025', tipo: 'Informe', fecha: '2026-02-01', archivo: 'informe_2025.pdf' },
  { id: '3', titulo: 'Reglamento Interno ASADA', tipo: 'Documento Legal', fecha: '2025-06-10', archivo: 'reglamento_interno.pdf' },
  { id: '4', titulo: 'Mediciones de Cloro Julio 2026', tipo: 'Reporte Técnico', fecha: '2026-07-15', archivo: 'cloro_julio2026.pdf' },
]

export const MOCK_SOLICITUDES_POR_TIPO = [
  { tipo: 'Nueva conexión', cantidad: 18 },
  { tipo: 'Cambio de domicilio', cantidad: 8 },
  { tipo: 'Traslado de medidor', cantidad: 5 },
  { tipo: 'Cambio de medidor', cantidad: 7 },
  { tipo: 'Cambio de representante', cantidad: 3 },
]

export const MOCK_AVERIAS_POR_TIPO = [
  { name: 'Fuga de agua', value: 12 },
  { name: 'Tubería rota', value: 8 },
  { name: 'Falta de presión', value: 6 },
  { name: 'Contador dañado', value: 4 },
  { name: 'Fuga vía pública', value: 5 },
]
