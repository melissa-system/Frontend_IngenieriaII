// Reglas comunes para exportar los reportes estadísticos (PBI 341 / Task 343).
//
// Se mantienen como funciones puras y sin imports para que la página de
// Reportes y las pruebas (tests/exportacionReportes.test.ts) usen exactamente
// la misma lógica: el documento exportado se arma con los mismos datos que se
// muestran en pantalla.

// Roles (etiquetas en español) que pueden ver los reportes y exportarlos.
// El backend aplica la misma regla: @Roles(Role.ADMIN) y super_admin pasa
// siempre por ser la Junta Directiva.
export const ROLES_REPORTES = ['Administrador', 'Junta Directiva']

export function puedeVerReportes(rol: string | null | undefined): boolean {
  return !!rol && ROLES_REPORTES.includes(rol)
}

export interface DatoExportacion {
  name: string
  cantidad: number
}

export interface ReporteExportable {
  total: number
  barLabel: string
  barData: DatoExportacion[]
  pieLabel: string
  pieData: DatoExportacion[]
  evolucionMensual: { mes: string; cantidad: number }[]
  columns: { key: string; label: string }[]
  rows: Record<string, string>[]
}

export interface MetadatosExportacion {
  modulo: string
  rangoLabel: string
  filtrosResumen: string
  fechaGeneracion: string
}

const FECHA_ISO = /^\d{4}-\d{2}-\d{2}$/

function fechaValida(valor: string): boolean {
  if (!FECHA_ISO.test(valor)) return false
  const fecha = new Date(`${valor}T00:00:00Z`)
  return !Number.isNaN(fecha.getTime()) && fecha.toISOString().slice(0, 10) === valor
}

// Valida el rango personalizado del calendario. Devuelve el mensaje de error
// o null si el rango es válido. Los rangos predefinidos (mensual, trimestral,
// anual, histórico) se calculan solos y siempre son válidos.
export function validarRangoFechas(
  rango: string,
  desde: string,
  hasta: string,
): string | null {
  if (rango !== 'personalizado') return null
  if (!desde || !hasta) return 'Seleccione la fecha de inicio y la fecha de fin del rango.'
  if (!fechaValida(desde) || !fechaValida(hasta)) return 'El rango contiene una fecha inválida.'
  if (desde > hasta) return 'La fecha de inicio no puede ser posterior a la fecha de fin.'
  return null
}

// Motivo por el que no se puede exportar todavía, o null si se puede.
export function motivoNoExportable(params: {
  total: number
  cargando: boolean
  errorRango: string | null
  errorCarga: string | null
}): string | null {
  if (params.errorRango) return params.errorRango
  if (params.cargando) return 'Espere a que terminen de cargar las estadísticas.'
  if (params.errorCarga) return 'No se puede exportar porque las estadísticas no se cargaron.'
  if (params.total === 0) return 'No hay información para exportar con los filtros seleccionados.'
  return null
}

// Nombre del archivo exportado: módulo y período, sin tildes ni espacios.
export function nombreArchivoReporte(
  modulo: string,
  rango: { desde: string; hasta: string } | null,
  extension: 'pdf' | 'csv',
): string {
  const base = modulo
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
  const periodo = rango ? `${rango.desde}_a_${rango.hasta}` : 'historico'
  return `reporte-${base}-${periodo}.${extension}`
}

function escCSV(valor: string): string {
  if (/[",\n;]/.test(valor)) return `"${valor.replace(/"/g, '""')}"`
  return valor
}

// Contenido del CSV: encabezado con el período y filtros aplicados en
// pantalla, las mismas agrupaciones de los gráficos y el detalle de la tabla.
export function construirCsvReporte(
  reporte: ReporteExportable,
  meta: MetadatosExportacion,
): string {
  const lineas: string[] = []
  lineas.push(`Reporte estadístico de ${meta.modulo}`)
  lineas.push(
    `Generado: ${meta.fechaGeneracion}; Rango: ${meta.rangoLabel}; Filtros: ${meta.filtrosResumen}; Total de registros: ${reporte.total}`,
  )
  lineas.push('')
  lineas.push(reporte.barLabel)
  lineas.push('Categoría,Cantidad')
  reporte.barData.forEach((d) => lineas.push(`${escCSV(d.name)},${d.cantidad}`))
  lineas.push('')
  lineas.push(reporte.pieLabel)
  lineas.push('Estado,Cantidad')
  reporte.pieData.forEach((d) => lineas.push(`${escCSV(d.name)},${d.cantidad}`))
  lineas.push('')
  lineas.push('Evolución mensual')
  lineas.push('Mes,Cantidad')
  reporte.evolucionMensual.forEach((e) => lineas.push(`${escCSV(e.mes)},${e.cantidad}`))
  lineas.push('')
  lineas.push('Detalle de registros')
  lineas.push(reporte.columns.map((c) => escCSV(c.label)).join(','))
  reporte.rows.forEach((fila) =>
    lineas.push(reporte.columns.map((c) => escCSV(fila[c.key] ?? '')).join(',')),
  )
  return `﻿${lineas.join('\r\n')}`
}
