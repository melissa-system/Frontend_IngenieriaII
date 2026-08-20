export interface MedidorInfo {
  numero: string
  diametro: string
  ubicacion: string
}

export interface Abonado {
  id: string
  cedula: string
  nombre: string
  tipo: 'Física' | 'Jurídica'
  telefono: string
  correo: string
  direccion: string
  beneficiario: string
  medidor: MedidorInfo
  estado: 'Activo' | 'Inactivo'
  fechaRegistro: string
}

export interface HistorialCambio {
  fecha: string
  estadoAnterior: string
  estadoNuevo: string
  realizadoPor: string
  observacion: string
}

export interface Solicitud {
  id: string
  codigo: string
  tipo: string
  solicitante: string
  cedula: string
  telefono: string
  correo: string
  direccion: string
  detalle: string
  estado: 'Pendiente' | 'Aprobada' | 'Rechazada' | 'Completada'
  fecha: string
  notificado: boolean
  historial: HistorialCambio[]
}

export interface MovimientoInventario {
  fecha: string
  tipo: 'entrada' | 'salida' | 'ajuste'
  cantidad: number
  stockAnterior: number
  stockNuevo: number
  realizadoPor: string
  observacion: string
}

export interface InventarioItem {
  id: string
  nombre: string
  categoria: string
  proveedor: string
  tipoProveedor: 'F\u00edsico' | 'Jur\u00eddico'
  stock: number
  stockMinimo: number
  ubicacion: string
  historial: MovimientoInventario[]
}

export interface Proveedor {
  id: string
  nombre: string
  tipo: 'F\u00edsico' | 'Jur\u00eddico'
  contacto: string
  telefono: string
  correo: string
  direccion: string
  estado: 'Activo' | 'Inactivo'
}

export interface ObservacionAveria {
  fecha: string
  texto: string
  realizadoPor: string
}

export interface HistorialAveria {
  fecha: string
  estadoAnterior: string
  estadoNuevo: string
  realizadoPor: string
  observacion: string
}

export interface AveriaAdmin {
  id: string
  tipo: string
  descripcion: string
  reportadoPor: string
  cedula: string
  telefono: string
  correo: string
  direccion: string
  fecha: string
  estado: 'Pendiente' | 'Asignada' | 'En progreso' | 'Resuelta'
  fontaneroAsignado: string
  historial: HistorialAveria[]
  observaciones: ObservacionAveria[]
}

export const FONTANEROS_DISPONIBLES = [
  'Fontanero Principal',
  'Juan P\u00e9rez',
  'Pedro S\u00e1nchez',
  'Roberto Quesada',
  'Diego Mora',
]

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
  { id: '1', cedula: '1-1234-5678', nombre: 'Carlos Mart\u00ednez', tipo: 'F\u00edsica', telefono: '8888-1111', correo: 'carlos@email.com', direccion: '200m sur de la iglesia, Pueblo Nuevo', beneficiario: 'Mar\u00eda Mart\u00ednez', medidor: { numero: 'M-001', diametro: '1/2"', ubicacion: 'Exterior' }, estado: 'Activo', fechaRegistro: '2024-01-15' },
  { id: '2', cedula: '2-2345-6789', nombre: 'Mar\u00eda Rodr\u00edguez', tipo: 'F\u00edsica', telefono: '8888-2222', correo: 'maria@email.com', direccion: '100m este del sal\u00f3n comunal', beneficiario: 'Pedro Rodr\u00edguez', medidor: { numero: 'M-002', diametro: '1/2"', ubicacion: 'Exterior' }, estado: 'Activo', fechaRegistro: '2024-02-20' },
  { id: '3', cedula: '3-3456-7890', nombre: 'Juan P\u00e9rez', tipo: 'F\u00edsica', telefono: '8888-3333', correo: 'juan@email.com', direccion: '50m norte de la escuela', beneficiario: 'Luc\u00eda P\u00e9rez', medidor: { numero: 'M-003', diametro: '3/4"', ubicacion: 'Interior' }, estado: 'Activo', fechaRegistro: '2024-03-10' },
  { id: '4', cedula: '1-4567-8901', nombre: 'Ana Jim\u00e9nez', tipo: 'F\u00edsica', telefono: '8888-4444', correo: 'ana@email.com', direccion: 'Contiguo a la plaza de deportes', beneficiario: 'Carlos Jim\u00e9nez', medidor: { numero: 'M-004', diametro: '1/2"', ubicacion: 'Exterior' }, estado: 'Inactivo', fechaRegistro: '2024-01-05' },
  { id: '5', cedula: '2-5678-9012', nombre: 'Pedro S\u00e1nchez', tipo: 'Jur\u00eddica', telefono: '8888-5555', correo: 'pedro@email.com', direccion: '300m oeste de la entrada principal', beneficiario: 'Comunidad Pueblo Nuevo', medidor: { numero: 'M-005', diametro: '1"', ubicacion: 'Exterior' }, estado: 'Activo', fechaRegistro: '2024-04-12' },
  { id: '6', cedula: '3-6789-0123', nombre: 'Luc\u00eda Fern\u00e1ndez', tipo: 'F\u00edsica', telefono: '8888-6666', correo: 'lucia@email.com', direccion: 'Frente al cementerio, Pueblo Nuevo', beneficiario: 'Roberto Fern\u00e1ndez', medidor: { numero: 'M-006', diametro: '1/2"', ubicacion: 'Interior' }, estado: 'Activo', fechaRegistro: '2024-05-08' },
  { id: '7', cedula: '1-7890-1234', nombre: 'Roberto Quesada', tipo: 'F\u00edsica', telefono: '8888-7777', correo: 'roberto@email.com', direccion: '25m sur de la bomba', beneficiario: 'Sof\u00eda Quesada', medidor: { numero: 'M-007', diametro: '3/4"', ubicacion: 'Exterior' }, estado: 'Inactivo', fechaRegistro: '2024-02-28' },
  { id: '8', cedula: '2-8901-2345', nombre: 'Sof\u00eda Vargas', tipo: 'F\u00edsica', telefono: '8888-8888', correo: 'sofia@email.com', direccion: 'Detr\u00e1s del ebais, Pueblo Nuevo', beneficiario: 'Diego Vargas', medidor: { numero: 'M-008', diametro: '1/2"', ubicacion: 'Exterior' }, estado: 'Activo', fechaRegistro: '2024-06-01' },
  { id: '9', cedula: '3-9012-3456', nombre: 'Diego Mora', tipo: 'Jur\u00eddica', telefono: '8888-9999', correo: 'diego@email.com', direccion: 'Costado norte del parque', beneficiario: 'ASADA Pueblo Nuevo', medidor: { numero: 'M-009', diametro: '1"', ubicacion: 'Interior' }, estado: 'Activo', fechaRegistro: '2024-03-22' },
  { id: '10', cedula: '1-0123-4567', nombre: 'Andrea Castro', tipo: 'F\u00edsica', telefono: '8888-0000', correo: 'andrea@email.com', direccion: 'Calle principal, contiguo a la ferreter\u00eda', beneficiario: 'Mart\u00edn Castro', medidor: { numero: 'M-010', diametro: '1/2"', ubicacion: 'Exterior' }, estado: 'Activo', fechaRegistro: '2024-07-15' },
]

export const MOCK_SOLICITUDES: Solicitud[] = [
  {
    id: '1', codigo: 'SOL-001', tipo: 'Nueva conexi\u00f3n',
    solicitante: 'Carlos Mart\u00ednez', cedula: '1-1234-5678',
    telefono: '8888-1111', correo: 'carlos@email.com',
    direccion: '200m sur de la iglesia, Pueblo Nuevo',
    detalle: 'Solicita instalaci\u00f3n de medidor de agua para vivienda familiar.',
    estado: 'Aprobada', fecha: '2026-07-10', notificado: true,
    historial: [
      { fecha: '2026-07-10 08:30', estadoAnterior: 'Pendiente', estadoNuevo: 'Aprobada', realizadoPor: 'Administrador SIAPB', observacion: 'Documentaci\u00f3n completa, aprobado.' },
      { fecha: '2026-07-08 14:15', estadoAnterior: '', estadoNuevo: 'Pendiente', realizadoPor: 'Administrador SIAPB', observacion: 'Solicitud registrada.' },
    ],
  },
  {
    id: '2', codigo: 'SOL-002', tipo: 'Cambio de domicilio',
    solicitante: 'Mar\u00eda Rodr\u00edguez', cedula: '2-2345-6789',
    telefono: '8888-2222', correo: 'maria@email.com',
    direccion: '100m este del sal\u00f3n comunal',
    detalle: 'Cambio de direcci\u00f3n por mudanza al centro del distrito.',
    estado: 'Pendiente', fecha: '2026-07-15', notificado: false,
    historial: [
      { fecha: '2026-07-15 09:00', estadoAnterior: '', estadoNuevo: 'Pendiente', realizadoPor: 'Mar\u00eda Rodr\u00edguez', observacion: 'Solicitud creada por el abonado.' },
    ],
  },
  {
    id: '3', codigo: 'SOL-003', tipo: 'Traslado de medidor',
    solicitante: 'Juan P\u00e9rez', cedula: '3-3456-7890',
    telefono: '8888-3333', correo: 'juan@email.com',
    direccion: '50m norte de la escuela',
    detalle: 'Solicita trasladar el medidor del interior al exterior de la vivienda.',
    estado: 'Completada', fecha: '2026-07-05', notificado: true,
    historial: [
      { fecha: '2026-07-05 11:00', estadoAnterior: 'Aprobada', estadoNuevo: 'Completada', realizadoPor: 'Fontanero Principal', observacion: 'Trabajo finalizado. Medidor reubicado correctamente.' },
      { fecha: '2026-07-03 10:30', estadoAnterior: 'Pendiente', estadoNuevo: 'Aprobada', realizadoPor: 'Administrador SIAPB', observacion: 'Verificaci\u00f3n de campo realizada, se aprueba.' },
      { fecha: '2026-07-01 08:00', estadoAnterior: '', estadoNuevo: 'Pendiente', realizadoPor: 'Juan P\u00e9rez', observacion: 'Solicitud creada por el abonado.' },
    ],
  },
  {
    id: '4', codigo: 'SOL-004', tipo: 'Cambio de medidor',
    solicitante: 'Ana Jim\u00e9nez', cedula: '1-4567-8901',
    telefono: '8888-4444', correo: 'ana@email.com',
    direccion: 'Contiguo a la plaza de deportes',
    detalle: 'El medidor actual presenta da\u00f1os en el registro de consumo.',
    estado: 'Pendiente', fecha: '2026-07-18', notificado: false,
    historial: [
      { fecha: '2026-07-18 15:45', estadoAnterior: '', estadoNuevo: 'Pendiente', realizadoPor: 'Ana Jim\u00e9nez', observacion: 'Solicitud creada por el abonado.' },
    ],
  },
  {
    id: '5', codigo: 'SOL-005', tipo: 'Cambio de representante',
    solicitante: 'Pedro S\u00e1nchez', cedula: '2-5678-9012',
    telefono: '8888-5555', correo: 'pedro@email.com',
    direccion: '300m oeste de la entrada principal',
    detalle: 'Solicita cambio de representante legal de la cuenta jur\u00eddica.',
    estado: 'Rechazada', fecha: '2026-07-01', notificado: true,
    historial: [
      { fecha: '2026-07-01 16:20', estadoAnterior: 'Pendiente', estadoNuevo: 'Rechazada', realizadoPor: 'Administrador SIAPB', observacion: 'Documentaci\u00f3n del representante saliente incompleta.' },
      { fecha: '2026-06-28 10:00', estadoAnterior: '', estadoNuevo: 'Pendiente', realizadoPor: 'Pedro S\u00e1nchez', observacion: 'Solicitud creada por el abonado.' },
    ],
  },
  {
    id: '6', codigo: 'SOL-006', tipo: 'Nueva conexi\u00f3n',
    solicitante: 'Luc\u00eda Fern\u00e1ndez', cedula: '3-6789-0123',
    telefono: '8888-6666', correo: 'lucia@email.com',
    direccion: 'Frente al cementerio, Pueblo Nuevo',
    detalle: 'Solicita conexi\u00f3n de agua para nueva vivienda en construcci\u00f3n.',
    estado: 'Pendiente', fecha: '2026-07-20', notificado: false,
    historial: [
      { fecha: '2026-07-20 11:30', estadoAnterior: '', estadoNuevo: 'Pendiente', realizadoPor: 'Luc\u00eda Fern\u00e1ndez', observacion: 'Solicitud creada por el abonado.' },
    ],
  },
  {
    id: '7', codigo: 'SOL-007', tipo: 'Cambio de domicilio',
    solicitante: 'Roberto Quesada', cedula: '1-7890-1234',
    telefono: '8888-7777', correo: 'roberto@email.com',
    direccion: '25m sur de la bomba',
    detalle: 'Cambio de domicilio por venta de la propiedad anterior.',
    estado: 'Aprobada', fecha: '2026-07-08', notificado: true,
    historial: [
      { fecha: '2026-07-08 09:15', estadoAnterior: 'Pendiente', estadoNuevo: 'Aprobada', realizadoPor: 'Administrador SIAPB', observacion: 'Documentos en regla, aprobado.' },
      { fecha: '2026-07-05 13:00', estadoAnterior: '', estadoNuevo: 'Pendiente', realizadoPor: 'Roberto Quesada', observacion: 'Solicitud creada por el abonado.' },
    ],
  },
  {
    id: '8', codigo: 'SOL-008', tipo: 'Nueva conexi\u00f3n',
    solicitante: 'Sof\u00eda Vargas', cedula: '2-8901-2345',
    telefono: '8888-8888', correo: 'sofia@email.com',
    direccion: 'Detr\u00e1s del ebais, Pueblo Nuevo',
    detalle: 'Solicita instalaci\u00f3n de agua para terreno reci\u00e9n construido.',
    estado: 'Completada', fecha: '2026-06-28', notificado: true,
    historial: [
      { fecha: '2026-06-28 14:30', estadoAnterior: 'Aprobada', estadoNuevo: 'Completada', realizadoPor: 'Fontanero Principal', observacion: 'Conexi\u00f3n instalada y medidor colocado.' },
      { fecha: '2026-06-25 08:45', estadoAnterior: 'Pendiente', estadoNuevo: 'Aprobada', realizadoPor: 'Administrador SIAPB', observacion: 'Todo en orden, se da visto bueno.' },
      { fecha: '2026-06-22 10:00', estadoAnterior: '', estadoNuevo: 'Pendiente', realizadoPor: 'Sof\u00eda Vargas', observacion: 'Solicitud creada por el abonado.' },
    ],
  },
]

export const MOCK_INVENTARIO: InventarioItem[] = [
  { id: '1', nombre: 'Tuber\u00eda PVC 1/2"', categoria: 'Material', proveedor: 'Distribuidora Ferretera CR', tipoProveedor: 'Jur\u00eddico', stock: 120, stockMinimo: 30, ubicacion: 'Bodega A', historial: [
    { fecha: '2026-07-15', tipo: 'entrada', cantidad: 50, stockAnterior: 70, stockNuevo: 120, realizadoPor: 'Administrador SIAPB', observacion: 'Compra mensual' },
    { fecha: '2026-07-10', tipo: 'salida', cantidad: 20, stockAnterior: 90, stockNuevo: 70, realizadoPor: 'Fontanero Principal', observacion: 'Reparaci\u00f3n en sector alto' },
  ]},
  { id: '2', nombre: 'Medidor de agua 1/2"', categoria: 'Medidor', proveedor: 'HidroTech', tipoProveedor: 'Jur\u00eddico', stock: 15, stockMinimo: 10, ubicacion: 'Bodega A', historial: [
    { fecha: '2026-07-12', tipo: 'entrada', cantidad: 10, stockAnterior: 5, stockNuevo: 15, realizadoPor: 'Administrador SIAPB', observacion: 'Nuevo lote de medidores' },
    { fecha: '2026-07-05', tipo: 'salida', cantidad: 2, stockAnterior: 7, stockNuevo: 5, realizadoPor: 'Fontanero Principal', observacion: 'Instalaci\u00f3n en vivienda nueva' },
  ]},
  { id: '3', nombre: 'V\u00e1lvula de compuerta 1"', categoria: 'Material', proveedor: 'Ferreter\u00eda El Constructor', tipoProveedor: 'Jur\u00eddico', stock: 8, stockMinimo: 5, ubicacion: 'Bodega B', historial: [
    { fecha: '2026-07-08', tipo: 'entrada', cantidad: 5, stockAnterior: 3, stockNuevo: 8, realizadoPor: 'Administrador SIAPB', observacion: 'Reabastecimiento' },
    { fecha: '2026-06-20', tipo: 'salida', cantidad: 2, stockAnterior: 5, stockNuevo: 3, realizadoPor: 'Fontanero Principal', observacion: 'Cambio de v\u00e1lvula en tanque' },
  ]},
  { id: '4', nombre: 'Llave Stillson 14"', categoria: 'Herramienta', proveedor: 'Herramientas Profesionales', tipoProveedor: 'F\u00edsico', stock: 4, stockMinimo: 2, ubicacion: 'Taller', historial: [
    { fecha: '2026-06-01', tipo: 'entrada', cantidad: 2, stockAnterior: 2, stockNuevo: 4, realizadoPor: 'Administrador SIAPB', observacion: 'Compra de herramientas' },
    { fecha: '2026-05-15', tipo: 'salida', cantidad: 1, stockAnterior: 3, stockNuevo: 2, realizadoPor: 'Fontanero Principal', observacion: 'Pr\u00e9stamo a fontanero' },
  ]},
  { id: '5', nombre: 'Codo PVC 1/2"', categoria: 'Material', proveedor: 'Distribuidora Ferretera CR', tipoProveedor: 'Jur\u00eddico', stock: 250, stockMinimo: 50, ubicacion: 'Bodega A', historial: []},
  { id: '6', nombre: 'Medidor de agua 3/4"', categoria: 'Medidor', proveedor: 'HidroTech', tipoProveedor: 'Jur\u00eddico', stock: 3, stockMinimo: 10, ubicacion: 'Bodega A', historial: [
    { fecha: '2026-07-20', tipo: 'salida', cantidad: 1, stockAnterior: 4, stockNuevo: 3, realizadoPor: 'Fontanero Principal', observacion: 'Instalaci\u00f3n en comercio' },
    { fecha: '2026-07-01', tipo: 'salida', cantidad: 2, stockAnterior: 6, stockNuevo: 4, realizadoPor: 'Fontanero Principal', observacion: 'Dos instalaciones realizadas' },
  ]},
  { id: '7', nombre: 'Tefl\u00f3n (rollo)', categoria: 'Material', proveedor: 'Ferreter\u00eda El Constructor', tipoProveedor: 'Jur\u00eddico', stock: 45, stockMinimo: 10, ubicacion: 'Bodega B', historial: []},
  { id: '8', nombre: 'Pala cuadrada', categoria: 'Herramienta', proveedor: 'Herramientas Profesionales', tipoProveedor: 'F\u00edsico', stock: 6, stockMinimo: 3, ubicacion: 'Taller', historial: [
    { fecha: '2026-06-15', tipo: 'entrada', cantidad: 3, stockAnterior: 3, stockNuevo: 6, realizadoPor: 'Administrador SIAPB', observacion: 'Reposici\u00f3n de herramientas' },
    { fecha: '2026-05-20', tipo: 'salida', cantidad: 1, stockAnterior: 4, stockNuevo: 3, realizadoPor: 'Fontanero Principal', observacion: 'En uso - no devuelta' },
  ]},
  { id: '9', nombre: 'Tuber\u00eda PVC 1"', categoria: 'Material', proveedor: 'Distribuidora Ferretera CR', tipoProveedor: 'Jur\u00eddico', stock: 60, stockMinimo: 20, ubicacion: 'Bodega A', historial: [
    { fecha: '2026-07-10', tipo: 'entrada', cantidad: 30, stockAnterior: 30, stockNuevo: 60, realizadoPor: 'Administrador SIAPB', observacion: 'Compra trimestral' },
    { fecha: '2026-06-28', tipo: 'salida', cantidad: 10, stockAnterior: 40, stockNuevo: 30, realizadoPor: 'Fontanero Principal', observacion: 'Reparaci\u00f3n l\u00ednea principal' },
  ]},
  { id: '10', nombre: 'LLave de paso 1/2"', categoria: 'Material', proveedor: 'Ferreter\u00eda El Constructor', tipoProveedor: 'Jur\u00eddico', stock: 20, stockMinimo: 10, ubicacion: 'Bodega B', historial: []},
]

export const MOCK_PROVEEDORES: Proveedor[] = [
  { id: '1', nombre: 'Distribuidora Ferretera CR', tipo: 'Jur\u00eddico', contacto: 'Luis Herrera', telefono: '2277-1010', correo: 'ventas@distferretera.cr', direccion: 'San Jos\u00e9, centro comercial', estado: 'Activo' },
  { id: '2', nombre: 'HidroTech', tipo: 'Jur\u00eddico', contacto: 'Marta Jim\u00e9nez', telefono: '2288-2020', correo: 'ventas@hidrotech.cr', direccion: 'Heredia, Industrial Park', estado: 'Activo' },
  { id: '3', nombre: 'Ferreter\u00eda El Constructor', tipo: 'Jur\u00eddico', contacto: 'Carlos Mora', telefono: '2277-3030', correo: 'pedidos@elconstructor.cr', direccion: 'Alajuela, frente al parque', estado: 'Activo' },
  { id: '4', nombre: 'Herramientas Profesionales', tipo: 'F\u00edsico', contacto: 'Roberto Vargas', telefono: '8888-5050', correo: 'roberto.hp@email.com', direccion: 'Cartago, 100m sur del polideportivo', estado: 'Activo' },
  { id: '5', nombre: 'Suministros Plomer00a CR', tipo: 'Jur\u00eddico', contacto: 'Andrea Solano', telefono: '2244-4040', correo: 'ventas@suministroscr.cr', direccion: 'San Jos\u00e9, Zapote', estado: 'Inactivo' },
]

export const MOCK_AVERIAS_ADMIN: AveriaAdmin[] = [
  {
    id: '1', tipo: 'Fuga de agua',
    descripcion: 'Fuga en la tuber\u00eda principal frente a la escuela',
    reportadoPor: 'Carlos Mart\u00ednez', cedula: '1-1234-5678',
    telefono: '8888-1111', correo: 'carlos@email.com',
    direccion: '200m sur de la iglesia, Pueblo Nuevo',
    fecha: '2026-07-22', estado: 'Resuelta', fontaneroAsignado: 'Pedro S\u00e1nchez',
    historial: [
      { fecha: '2026-07-23 14:30', estadoAnterior: 'En progreso', estadoNuevo: 'Resuelta', realizadoPor: 'Pedro S\u00e1nchez', observacion: 'Fuga reparada, tuber\u00eda reemplazada.' },
      { fecha: '2026-07-22 16:00', estadoAnterior: 'Asignada', estadoNuevo: 'En progreso', realizadoPor: 'Pedro S\u00e1nchez', observacion: 'Iniciando trabajos en el sitio.' },
      { fecha: '2026-07-22 10:30', estadoAnterior: 'Pendiente', estadoNuevo: 'Asignada', realizadoPor: 'Administrador SIAPB', observacion: 'Asignado a Pedro S\u00e1nchez.' },
      { fecha: '2026-07-22 08:15', estadoAnterior: '', estadoNuevo: 'Pendiente', realizadoPor: 'Carlos Mart\u00ednez', observacion: 'Reporte creado por el abonado.' },
    ],
    observaciones: [
      { fecha: '2026-07-23 14:30', texto: 'Se reemplaz\u00f3 un tramo de 2m de tuber\u00eda de 1". V\u00e1lvula de paso tambi\u00e9n reemplazada.', realizadoPor: 'Pedro S\u00e1nchez' },
      { fecha: '2026-07-22 10:30', texto: 'Se contact\u00f3 al abonado para coordinar ingreso a la propiedad.', realizadoPor: 'Administrador SIAPB' },
    ],
  },
  {
    id: '2', tipo: 'Tuber\u00eda rota',
    descripcion: 'Tuber\u00eda rota por maquinaria en construcci\u00f3n',
    reportadoPor: 'Mar\u00eda Rodr\u00edguez', cedula: '2-2345-6789',
    telefono: '8888-2222', correo: 'maria@email.com',
    direccion: '100m este del sal\u00f3n comunal',
    fecha: '2026-07-24', estado: 'Asignada', fontaneroAsignado: 'Juan P\u00e9rez',
    historial: [
      { fecha: '2026-07-24 14:00', estadoAnterior: 'Pendiente', estadoNuevo: 'Asignada', realizadoPor: 'Administrador SIAPB', observacion: 'Asignado a Juan P\u00e9rez por urgencia.' },
      { fecha: '2026-07-24 09:30', estadoAnterior: '', estadoNuevo: 'Pendiente', realizadoPor: 'Mar\u00eda Rodr\u00edguez', observacion: 'Reporte creado por el abonado.' },
    ],
    observaciones: [
      { fecha: '2026-07-24 14:00', texto: 'Requiere maquinaria para excavaci\u00f3n. Coordinar con obras p\u00fablicas.', realizadoPor: 'Administrador SIAPB' },
    ],
  },
  {
    id: '3', tipo: 'Falta de presi\u00f3n',
    descripcion: 'Baja presi\u00f3n en todo el sector alto desde hace 2 d\u00edas',
    reportadoPor: 'Ana Jim\u00e9nez', cedula: '1-4567-8901',
    telefono: '8888-4444', correo: 'ana@email.com',
    direccion: 'Contiguo a la plaza de deportes',
    fecha: '2026-07-25', estado: 'Pendiente', fontaneroAsignado: '',
    historial: [
      { fecha: '2026-07-25 07:45', estadoAnterior: '', estadoNuevo: 'Pendiente', realizadoPor: 'Ana Jim\u00e9nez', observacion: 'Reporte creado por el abonado.' },
    ],
    observaciones: [],
  },
  {
    id: '4', tipo: 'Contador da\u00f1ado',
    descripcion: 'Medidor no registra consumo, parece da\u00f1ado',
    reportadoPor: 'Luc\u00eda Fern\u00e1ndez', cedula: '3-6789-0123',
    telefono: '8888-6666', correo: 'lucia@email.com',
    direccion: 'Frente al cementerio, Pueblo Nuevo',
    fecha: '2026-07-23', estado: 'En progreso', fontaneroAsignado: 'Pedro S\u00e1nchez',
    historial: [
      { fecha: '2026-07-24 09:00', estadoAnterior: 'Asignada', estadoNuevo: 'En progreso', realizadoPor: 'Pedro S\u00e1nchez', observacion: 'Revisi\u00f3n en campo iniciada.' },
      { fecha: '2026-07-23 15:30', estadoAnterior: 'Pendiente', estadoNuevo: 'Asignada', realizadoPor: 'Administrador SIAPB', observacion: 'Asignado a Pedro S\u00e1nchez.' },
      { fecha: '2026-07-23 11:00', estadoAnterior: '', estadoNuevo: 'Pendiente', realizadoPor: 'Luc\u00eda Fern\u00e1ndez', observacion: 'Reporte creado por el abonado.' },
    ],
    observaciones: [
      { fecha: '2026-07-24 09:00', texto: 'Medidor presenta da\u00f1o f\u00edsico en la tapa y el registro. Se solicitar\u00e1 reemplazo.', realizadoPor: 'Pedro S\u00e1nchez' },
    ],
  },
  {
    id: '5', tipo: 'Fuga en la v\u00eda p\u00fablica',
    descripcion: 'Agua brotando en la calle principal cerca del sal\u00f3n comunal',
    reportadoPor: 'Diego Mora', cedula: '3-9012-3456',
    telefono: '8888-9999', correo: 'diego@email.com',
    direccion: 'Costado norte del parque',
    fecha: '2026-07-26', estado: 'Pendiente', fontaneroAsignado: '',
    historial: [
      { fecha: '2026-07-26 06:30', estadoAnterior: '', estadoNuevo: 'Pendiente', realizadoPor: 'Diego Mora', observacion: 'Reporte creado por el abonado.' },
    ],
    observaciones: [],
  },
]

export const MOCK_USUARIOS: UsuarioSistema[] = [
  { id: '1', nombre: 'Administrador SIAPB', username: 'admin', rol: 'Administrador', email: 'admin@siapb.cr', estado: 'Activo' },
  { id: '2', nombre: 'Fontanero Principal', username: 'fontanero', rol: 'Fontanero', email: 'fontanero@siapb.cr', estado: 'Activo' },
  { id: '3', nombre: 'Mar\u00eda Rodr\u00edguez', username: 'mrodriguez', rol: 'Junta Directiva', email: 'mrodriguez@siapb.cr', estado: 'Activo' },
  { id: '4', nombre: 'Carlos Mart\u00ednez', username: 'cmartinez', rol: 'Junta Directiva', email: 'cmartinez@siapb.cr', estado: 'Activo' },
  { id: '5', nombre: 'Ana Jim\u00e9nez', username: 'ajimenez', rol: 'Abonado', email: 'ajimenez@email.com', estado: 'Activo' },
]

export const MOCK_PUBLICACIONES: Publicacion[] = [
  { id: '1', titulo: 'Nueva tarifa aprobada para el per\u00edodo 2026', contenido: 'La Asamblea de ASADA Pueblo Nuevo aprob\u00f3 los ajustes en la tarifa del servicio, vigentes a partir del pr\u00f3ximo trimestre.', fecha: '2026-06-15', tipo: 'Comunicado', publicado: true },
  { id: '2', titulo: 'Suspensi\u00f3n temporal del servicio', contenido: 'El pr\u00f3ximo jueves suspenderemos el servicio de 8:00 a.m. a 2:00 p.m. en el sector alto de Pueblo Nuevo para reparar una fuga en la l\u00ednea principal.', fecha: '2026-07-10', tipo: 'Aviso', publicado: true },
  { id: '3', titulo: 'Jornada de limpieza de quebradas', contenido: 'Invitamos a la comunidad a participar en la jornada de limpieza de las quebradas cercanas.', fecha: '2026-02-20', tipo: 'Noticia', publicado: true },
  { id: '4', titulo: 'Mantenimiento programado en tanque', contenido: 'Realizaremos limpieza y mantenimiento preventivo en el tanque de captaci\u00f3n.', fecha: '2026-07-02', tipo: 'Aviso', publicado: false },
]

export const MOCK_DOCUMENTOS: Documento[] = [
  { id: '1', titulo: 'Acta Asamblea General 2026', tipo: 'Acta', fecha: '2026-01-15', archivo: 'acta_2026.pdf' },
  { id: '2', titulo: 'Informe de Gesti\u00f3n Anual 2025', tipo: 'Informe', fecha: '2026-02-01', archivo: 'informe_2025.pdf' },
  { id: '3', titulo: 'Reglamento Interno ASADA', tipo: 'Documento Legal', fecha: '2025-06-10', archivo: 'reglamento_interno.pdf' },
  { id: '4', titulo: 'Mediciones de Cloro Julio 2026', tipo: 'Reporte T\u00e9cnico', fecha: '2026-07-15', archivo: 'cloro_julio2026.pdf' },
]

export const MOCK_SOLICITUDES_POR_TIPO = [
  { tipo: 'Nueva conexi\u00f3n', cantidad: 18 },
  { tipo: 'Cambio de domicilio', cantidad: 8 },
  { tipo: 'Traslado de medidor', cantidad: 5 },
  { tipo: 'Cambio de medidor', cantidad: 7 },
  { tipo: 'Cambio de representante', cantidad: 3 },
]

export const MOCK_AVERIAS_POR_TIPO = [
  { name: 'Fuga de agua', value: 12 },
  { name: 'Tuber\u00eda rota', value: 8 },
  { name: 'Falta de presi\u00f3n', value: 6 },
  { name: 'Contador da\u00f1ado', value: 4 },
  { name: 'Fuga v\u00eda p\u00fablica', value: 5 },
]