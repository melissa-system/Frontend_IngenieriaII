import type { SolicitudConexion } from '../components/Services/conexionPajaAgua.service'
import { ASADA_NOMBRE_LEGAL } from './asadaInfo'
import {
  obtenerFechaArchivoCostaRica,
  obtenerNombreArchivoCopia,
} from './formatoFechaCostaRica'
import { ANCHO, Formulario, X0, X1 } from './pdfFormulario'
import { formatearTelefonoVisible } from './telefono'
import { REQUISITOS_CONEXION } from './textosConexion'

// PDF de la Solicitud de conexión de servicio (GNU-42-01-F1), con las mismas
// secciones del machote, sin ningún color azul — solo se reemplaza la identidad
// institucional de AyA por la de la ASADA y se llenan los campos con los datos
// reales de la solicitud.
//
// El texto se dibuja de forma vectorial (ver pdfFormulario.ts): cada valor queda
// centrado en su caja sin depender del navegador ni de la pantalla.

function coincide(valor: string | null | undefined, ...posibles: string[]): boolean {
  if (!valor) return false
  const v = valor.trim().toLowerCase()
  return posibles.some((p) => v === p.trim().toLowerCase())
}

const TITULO = 'Solicitud de conexión de servicio'

async function cargarImagenComoDataUrl(url: string): Promise<string | null> {
  if (url.startsWith('data:')) return url
  try {
    const respuesta = await fetch(url, { mode: 'cors' })
    const blob = await respuesta.blob()
    return await new Promise((resolve, reject) => {
      const lector = new FileReader()
      lector.onload = () => resolve(lector.result as string)
      lector.onerror = reject
      lector.readAsDataURL(blob)
    })
  } catch {
    return null
  }
}


function dibujarDocumento(s: SolicitudConexion, firmaDataUrl: string | null): Formulario {
  const esFisica = s.tipo_persona === 'fisica'
  const esJuridica = s.tipo_persona === 'juridica'
  const nombre = ASADA_NOMBRE_LEGAL.toUpperCase()
  const f = new Formulario()
  const mitad = (ANCHO - 6) / 2

  const medio = (principal: boolean, tipo: string) => {
    const m = principal ? s.medio_notificacion_principal : s.medio_notificacion_secundario
    const v = principal ? s.valor_notificacion_principal : s.valor_notificacion_secundario
    if (m !== tipo) return ''
    return tipo === 'fax' ? formatearTelefonoVisible(v) : (v ?? '')
  }

  // ---------- Página 1 ----------
  f.y = 10
  f.encabezadoCompleto(nombre, TITULO, 'Código: GNU-42-01-F1   Versión: 03')

  if (!s.codigo_solicitud) {
    f.rect(X0, f.y, ANCHO, 6.5)
    f.texto('Copia de respaldo: solicitud pendiente de registro en el sistema', X0 + ANCHO / 2, f.y + 3.25, {
      size: 8.5, bold: true, align: 'center',
    })
    f.y += 8.5
  }

  f.rect(X0, f.y, ANCHO, 6.5)
  f.texto('Uso exclusivo de la ASADA', X0 + ANCHO / 2, f.y + 3.25, { size: 8.5, bold: true, italic: true, align: 'center' })
  f.y += 9
  f.fila([
    { etiqueta: 'Número de solicitud', valor: s.codigo_solicitud && s.codigo_solicitud.trim().length > 0 ? s.codigo_solicitud : 'Pendiente de registro', ancho: mitad },
    { etiqueta: 'Fecha de ingreso', valor: obtenerFechaArchivoCostaRica(s.fecha_creacion), ancho: mitad },
  ], { gap: 6 })

  f.seccion('I.', 'Información del titular del inmueble')
  f.opcion('radio', esFisica, X0, f.y + 2, 'Persona Física')
  f.y += 5
  f.fila([
    { etiqueta: 'Nombre completo', valor: esFisica ? s.nombre_solicitante : '', ancho: mitad },
    { etiqueta: 'No. de identificación', valor: esFisica ? s.identificacion_solicitante : '', ancho: mitad },
  ], { gap: 6 })
  f.opcion('radio', esJuridica, X0, f.y + 2, 'Persona Jurídica')
  f.y += 5
  f.fila([
    { etiqueta: 'Razón Social', valor: esJuridica ? s.nombre_solicitante : '', ancho: mitad },
    { etiqueta: 'No. de Cédula Jurídica', valor: esJuridica ? s.identificacion_solicitante : '', ancho: mitad },
  ], { gap: 6 })
  f.fila([
    { etiqueta: 'Teléfono 1', valor: formatearTelefonoVisible(s.telefono_solicitante), ancho: mitad },
    { etiqueta: 'Teléfono 2', valor: '', ancho: mitad },
  ], { gap: 6 })

  f.seccion('II.', 'Medio para notificación', '(Seleccione el medio de notificación principal y secundario de su preferencia)')
  const yTabla = f.y
  const alturaTabla = 6.5 + 8 + 8 + 15 + 3
  const columna = ANCHO / 2
  f.rect(X0, yTabla, ANCHO, alturaTabla)
  f.linea(X0 + columna, yTabla, X0 + columna, yTabla + alturaTabla)
  f.linea(X0, yTabla + 6.5, X1, yTabla + 6.5)
  f.texto('Medio principal', X0 + columna / 2, yTabla + 3.25, { size: 8.5, bold: true, align: 'center' })
  f.texto('Medio secundario', X0 + columna + columna / 2, yTabla + 3.25, { size: 8.5, bold: true, align: 'center' })
  const filas = [
    { etiqueta: 'Fax:', alto: 8, tipo: 'fax' },
    { etiqueta: 'Correo electrónico:', alto: 8, tipo: 'correo' },
    { etiqueta: 'Dirección física:', alto: 15, tipo: 'direccion' },
  ]
  let yFila = yTabla + 6.5 + 1.5
  for (const fila of filas) {
    for (let c = 0; c < 2; c++) {
      const xc = X0 + c * columna
      f.texto(fila.etiqueta, xc + 3, yFila + (fila.alto - 1) / 2, { size: 8 })
      const xCaja = xc + 36
      f.rect(xCaja, yFila, columna - 36 - 3, fila.alto - 1)
      f.valorEnCaja(medio(c === 0, fila.tipo), xCaja, yFila, columna - 36 - 3, fila.alto - 1, 9)
    }
    yFila += fila.alto
  }
  f.y = yTabla + alturaTabla + 3

  f.seccion('III.', 'Información del Inmueble')
  const tercio = (ANCHO - 8) / 3
  f.fila([
    { etiqueta: 'Provincia', valor: s.provincia ?? '', ancho: tercio },
    { etiqueta: 'Cantón', valor: s.canton ?? '', ancho: tercio },
    { etiqueta: 'Distrito', valor: s.distrito ?? '', ancho: tercio },
  ], { gap: 4 })
  f.texto('Dirección exacta del inmueble', X0 + ANCHO / 2, f.y + 2.4, { size: 8.5, bold: true, align: 'center' })
  f.rect(X0, f.y + 5, ANCHO, 12)
  f.valorEnCaja(s.direccion_inmueble ?? '', X0, f.y + 5, ANCHO, 12, 9.5)
  f.y += 5 + 12 + 3
  f.fila([
    { etiqueta: 'Folio real/Concesión/Arriendo/Asignación', valor: s.folio_real ?? '', ancho: tercio },
    { etiqueta: 'Plano Catastro', valor: s.plano_catastro ?? '', ancho: tercio },
    { etiqueta: 'Plano de Agrimensura', valor: s.plano_agrimensura ?? '', ancho: tercio },
  ], { gap: 4 })
  f.fila([
    { etiqueta: 'N° de disponibilidad', valor: s.numero_disponibilidad ?? '', ancho: mitad },
    { etiqueta: 'N° de NIS (si existe en el inmueble)', valor: s.numero_nis ?? '', ancho: mitad },
  ], { gap: 6 })

  // Naturaleza / calidad (arriba de la página 2: en la 1 no cabe)
  f.nuevaPagina(() => f.encabezadoSimple(nombre, TITULO))
  const yNat = f.y + 1
  const alturaNat = 50
  f.rect(X0, yNat, ANCHO, alturaNat)
  f.linea(X0 + columna, yNat, X0 + columna, yNat + alturaNat)
  f.texto('1.  Naturaleza del inmueble', X0 + columna / 2, yNat + 4, { size: 9, bold: true, align: 'center' })
  f.texto('2.  Calidad del titular del inmueble', X0 + columna + columna / 2, yNat + 4, { size: 9, bold: true, align: 'center' })
  const naturaleza: [string, boolean][] = [
    ['Inmueble inscrito', coincide(s.naturaleza_inmueble, 'Inmueble inscrito')],
    ['Parcelas agrícolas', coincide(s.naturaleza_inmueble, 'Parcela agrícola', 'Parcelas agrícolas')],
    ['Zona indígena', coincide(s.naturaleza_inmueble, 'Zona indígena')],
    ['Zona marítimo terrestre', coincide(s.naturaleza_inmueble, 'Zona marítimo', 'Zona marítimo terrestre')],
    ['Terreno en administración del INDER*', coincide(s.naturaleza_inmueble, 'Terreno en administración del INDER')],
    ['Inmueble sin inscribir', coincide(s.naturaleza_inmueble, 'Inmueble sin inscribir')],
  ]
  const calidad: [string, boolean][] = [
    ['Propietario registral', coincide(s.calidad_titular, 'Propietario registral')],
    ['Poseedor', coincide(s.calidad_titular, 'Poseedor')],
    ['Autorizado Legal', coincide(s.calidad_titular, 'Autorizado legal', 'Autorizado Legal')],
    ['Representante Legal', coincide(s.calidad_titular, 'Representante legal', 'Representante Legal')],
    ['Concesionario, arrendatario o asignatario', coincide(s.calidad_titular, 'Concesionario, arrendatario o asignatario')],
  ]
  naturaleza.forEach(([t, m], i) => f.opcion('radio', m, X0 + 4, yNat + 11 + i * 5.2, t, { size: 8 }))
  calidad.forEach(([t, m], i) => f.opcion('radio', m, X0 + columna + 4, yNat + 11 + i * 5.2, t, { size: 8 }))
  f.bloque(f.lineas('*Seleccione: “Terrenos en administración del INDER” cuando sea el caso de terrenos en concesión,', columna - 8, { size: 6.5 }), X0 + 4, yNat + alturaNat - 6, { size: 6.5 })
  f.bloque(f.lineas('*Seleccione: “Autorizado legal” cuando sea el caso de que el solicitante esté designado como albacea, tutor, curador u otra autorización por medio de poder especial o general.', columna - 8, { size: 6.5 }), X0 + columna + 4, yNat + alturaNat - 7, { size: 6.5 })
  f.y = yNat + alturaNat + 3

  f.seccion('IV.', 'Propósito de la solicitud')
  const col3 = ANCHO / 3
  const yIV = f.y
  f.rect(X0, yIV, ANCHO, 9)
  f.opcion('check', s.servicio_solicitado === 'agua_potable', X0 + 4, yIV + 4.5, 'Agua potable')
  f.opcion('check', s.servicio_solicitado === 'alcantarillado_sanitario', X0 + col3 + 4, yIV + 4.5, 'Alcantarillado sanitario')
  f.opcion('check', s.servicio_solicitado === 'ambos', X0 + col3 * 2 + 4, yIV + 4.5, 'Ambos')
  const yTram = yIV + 9
  const col4 = ANCHO / 4
  f.rect(X0, yTram, ANCHO, 20)
  const tramites: [string, boolean][] = [
    ['Nueva conexión', s.tipo_tramite === 'nueva_conexion'],
    ['Individualización', s.tipo_tramite === 'individualizacion'],
    ['Independización', s.tipo_tramite === 'independizacion'],
    ['Traslado', s.tipo_tramite === 'traslado'],
    ['Servicio provisional para proyectos', s.tipo_tramite === 'servicio_provisional_proyectos'],
    ['Cambio de diámetro', s.tipo_tramite === 'cambio_diametro'],
    ['Servicio Temporal', s.tipo_tramite === 'servicio_temporal'],
  ]
  tramites.forEach(([t, m], i) => {
    const fila = Math.floor(i / 4)
    const c = i % 4
    f.opcion('check', m, X0 + c * col4 + 4, yTram + 5 + fila * 10, t, { ancho: col4 - 5 })
  })
  f.texto('Indique el código APC, CFIA', X0 + col4 * 3 + 4, yTram + 12.5, { size: 8 })
  f.rect(X0 + col4 * 3 + 4, yTram + 14.2, col4 - 8, 4.6)
  f.valorEnCaja(s.codigo_apc_cfia ?? '', X0 + col4 * 3 + 4, yTram + 14.2, col4 - 8, 4.6, 8)
  const yPago = yTram + 20
  const colPago = ANCHO / 2
  f.rect(X0, yPago, ANCHO, 12)
  f.opcion('check', s.forma_pago === 'efectivo_previo', X0 + 4, yPago + 6, 'En efectivo en un solo tracto previo a la conexión del servicio.', { ancho: colPago - 8 })
  f.opcion('check', s.forma_pago === 'incluir_primera_facturacion', X0 + colPago + 4, yPago + 6, 'Autorizo incluir el monto por tarifa de derecho de conexión en la primera facturación.', { ancho: colPago - 8 })
  f.y = yPago + 12 + 3

  f.seccion('V.', 'Firma del solicitante')
  const util = ANCHO - 8
  const yFirma = f.y
  f.fila([
    { etiqueta: 'Nombre completo del solicitante', valor: s.nombre_firmante ?? '', ancho: util * 0.45 },
    { etiqueta: 'Identificación', valor: s.identificacion_firmante ?? '', ancho: util * 0.25 },
    { etiqueta: 'Firma del solicitante', valor: '', ancho: util * 0.3 },
  ], { gap: 4, alto: 18 })
  if (firmaDataUrl) {
    f.imagenEnCaja(firmaDataUrl, X0 + util * 0.7 + 8, yFirma + 5, util * 0.3, 18)
  }

  f.seccion('VI.', 'Datos del funcionario que recibe la solicitud (Uso exclusivo de AyA)')
  const cuarto = (ANCHO - 12) / 4
  f.fila([
    { etiqueta: 'Nombre', valor: '', ancho: cuarto },
    { etiqueta: 'Primer apellido', valor: '', ancho: cuarto },
    { etiqueta: 'Segundo apellido', valor: '', ancho: cuarto },
    { etiqueta: 'Firma', valor: '', ancho: cuarto },
  ], { gap: 4, alto: 14 })

  f.seccion('VII.', 'Requisitos')
  let n = 0
  for (const b of REQUISITOS_CONEXION) {
    if (b.tipo === 'item') {
      n += 1
      f.parrafo(`${n}. ${b.texto}`, { size: 8, sangria: 4, espacio: 1.5 })
    } else if (b.tipo === 'seccion') {
      const [romano, titulo] = b.texto.split('|')
      f.y += 2
      f.seccion(romano.trim(), titulo.trim())
    } else if (b.tipo === 'titulo') {
      f.y += 1.5
      f.parrafo(b.texto, { size: 8, bold: true, subrayado: true, espacio: 1 })
    } else if (b.tipo === 'vineta') {
      f.parrafo(b.texto, { size: 8, vineta: true, sangria: 2, espacio: 1 })
    } else if (b.tipo === 'vineta2') {
      f.parrafo(b.texto, { size: 8, sangria: 9, espacio: 0.6 })
    } else {
      f.parrafo(b.texto, { size: 8, espacio: 1.5 })
    }
  }

  return f
}

export async function generarPdfConexion(
  solicitud: SolicitudConexion,
  firmaDataUrl?: string,
): Promise<Blob> {
  const firmaSrc = firmaDataUrl || solicitud.firma_path
  const firma = firmaSrc ? await cargarImagenComoDataUrl(firmaSrc) : null
  return dibujarDocumento(solicitud, firma).pdf.output('blob')
}

export function descargarPdfConexion(
  blob: Blob,
  _codigoSolicitud?: string | null,
  fecha?: Date | string | null,
): void {
  const nombreArchivo = obtenerNombreArchivoCopia('conexion-servicio', fecha)
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = nombreArchivo
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
