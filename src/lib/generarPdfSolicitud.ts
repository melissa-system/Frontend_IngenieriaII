import { ASADA_NOMBRE_LEGAL, UBICACION_ASADA } from './asadaInfo'
import { ANCHO, Formulario, X0 } from './pdfFormulario'
import { consideracionesPajaAgua, requisitosPajaAgua } from './textosPajaAgua'
import {
  obtenerFechaArchivoCostaRica,
  obtenerNombreArchivoCopia,
} from './formatoFechaCostaRica'

// PDF de la Solicitud de disponibilidad de servicios / Paja de Agua
// (GNU-41-01-F1), fiel al HTML entregado por Meli: mismas 3 páginas, mismo
// layout, sin ningún color azul — solo se reemplaza la identidad
// institucional de AyA por la de la ASADA y se llenan los campos con los
// datos reales de la solicitud. Mismo enfoque que generarPdfConexion.ts.

// Forma común para generar el documento, sin importar si los datos vienen
// del wizard recién enviado (misma sesión, sin volver a pedirle nada al
// backend) o de la lista que ve un administrador logueado.
export interface DatosDocumentoSolicitud {
  codigoSolicitud?: string | null
  fecha: string | Date
  tipoPersona: 'fisica' | 'juridica'
  nombreSolicitante: string
  identificacion: string
  nombreRepresentante?: string | null
  cedulaRepresentante?: string | null
  telefono: string
  telefonoSecundario?: string | null
  correo: string
  provincia?: string | null
  canton?: string | null
  distrito?: string | null
  direccion: string
  numeroPlano: string
  naturalezaInmueble?: string | null
  calidadTitular?: string | null
  tipoServicio?: string | null
  tipoConexion?: string | null
  observaciones?: string | null
}

function coincide(valor: string | null | undefined, ...posibles: string[]): boolean {
  if (!valor) return false
  const v = valor.trim().toLowerCase()
  return posibles.some((p) => v === p.trim().toLowerCase())
}

function fmtFecha(fecha: string | Date): string {
  return obtenerFechaArchivoCostaRica(fecha)
}



const TITULO = 'Solicitud de constancia de disponibilidad de servicios'

// Dibuja las 3 páginas del machote con texto vectorial (ver pdfFormulario.ts):
// cada valor queda centrado en su caja sin depender del navegador.
function dibujarDocumento(datos: DatosDocumentoSolicitud): Formulario {
  const esFisica = datos.tipoPersona === 'fisica'
  const esJuridica = datos.tipoPersona === 'juridica'
  const nombre = ASADA_NOMBRE_LEGAL.toUpperCase()
  const f = new Formulario()

  // La descripción del proyecto es el único campo libre de la sección IV del
  // machote original de AyA; el sistema actual no recolecta los datos
  // específicos de esa sección, así que se resume ahí el servicio y tipo de
  // conexión solicitados, más las observaciones del solicitante.
  const descripcionProyecto = [
    datos.tipoServicio ? `Servicio solicitado: ${datos.tipoServicio}.` : '',
    datos.tipoConexion ? `Tipo de conexión: ${datos.tipoConexion}.` : '',
    datos.observaciones ? datos.observaciones : '',
  ]
    .filter(Boolean)
    .join(' ')

  const valorNumeroSolicitud =
    datos.codigoSolicitud && datos.codigoSolicitud.trim().length > 0
      ? datos.codigoSolicitud
      : 'Pendiente de registro'

  const mitad = (ANCHO - 6) / 2

  // ---------- Página 1 ----------
  f.y = 10
  f.encabezadoCompleto(nombre, TITULO, 'Código: GNU-41-01-F1   Versión: 03')

  if (!datos.codigoSolicitud) {
    f.rect(X0, f.y, ANCHO, 6.5)
    f.texto('Copia de respaldo: solicitud pendiente de registro en el sistema', X0 + ANCHO / 2, f.y + 3.25, {
      size: 8.5,
      bold: true,
      align: 'center',
    })
    f.y += 8.5
  }

  f.rect(X0, f.y, ANCHO, 6.5)
  f.texto(`Uso exclusivo de ${nombre}`, X0 + ANCHO / 2, f.y + 3.25, { size: 8.5, bold: true, italic: true, align: 'center' })
  f.y += 9

  f.fila([
    { etiqueta: 'Número de solicitud', valor: valorNumeroSolicitud, ancho: mitad },
    { etiqueta: 'Fecha de ingreso', valor: fmtFecha(datos.fecha), ancho: mitad },
  ], { gap: 6 })

  f.seccion('I.', 'Información del Titular del inmueble')
  f.opcion('radio', esFisica, X0, f.y + 2, 'Persona Física')
  f.y += 5
  f.fila([
    { etiqueta: 'Nombre completo', valor: esFisica ? datos.nombreSolicitante : '', ancho: mitad },
    { etiqueta: 'No. de identificación', valor: esFisica ? datos.identificacion : '', ancho: mitad },
  ], { gap: 6 })
  f.opcion('radio', esJuridica, X0, f.y + 2, 'Persona Jurídica')
  f.y += 5
  f.fila([
    { etiqueta: 'Razón Social', valor: esJuridica ? datos.nombreSolicitante : '', ancho: mitad },
    { etiqueta: 'No. de Cédula Jurídica', valor: esJuridica ? datos.identificacion : '', ancho: mitad },
  ], { gap: 6 })
  f.fila([
    { etiqueta: 'Teléfono 1', valor: datos.telefono, ancho: mitad },
    { etiqueta: 'Teléfono 2', valor: datos.telefonoSecundario ?? '', ancho: mitad },
  ], { gap: 6 })

  f.seccion('II.', 'Medio para notificación', '(Seleccione el medio de notificación principal y secundario de su preferencia)')
  const yTabla = f.y
  const alturaTabla = 6.5 + 8 + 8 + 15 + 3
  const columna = ANCHO / 2
  f.rect(X0, yTabla, ANCHO, alturaTabla)
  f.linea(X0 + columna, yTabla, X0 + columna, yTabla + alturaTabla)
  f.linea(X0, yTabla + 6.5, X1_(), yTabla + 6.5)
  f.texto('Medio principal', X0 + columna / 2, yTabla + 3.25, { size: 8.5, bold: true, align: 'center' })
  f.texto('Medio secundario', X0 + columna + columna / 2, yTabla + 3.25, { size: 8.5, bold: true, align: 'center' })
  const filas: { etiqueta: string; alto: number; valores: [string, string] }[] = [
    { etiqueta: 'Fax:', alto: 8, valores: ['', ''] },
    { etiqueta: 'Correo electrónico:', alto: 8, valores: [datos.correo, ''] },
    { etiqueta: 'Dirección física:', alto: 15, valores: ['', ''] },
  ]
  let yFila = yTabla + 6.5 + 1.5
  for (const fila of filas) {
    for (let c = 0; c < 2; c++) {
      const xc = X0 + c * columna
      f.texto(fila.etiqueta, xc + 3, yFila + (fila.alto - 1) / 2, { size: 8 })
      const xCaja = xc + 36
      f.rect(xCaja, yFila, columna - 36 - 3, fila.alto - 1)
      f.valorEnCaja(fila.valores[c], xCaja, yFila, columna - 36 - 3, fila.alto - 1, 9)
    }
    yFila += fila.alto
  }
  f.y = yTabla + alturaTabla + 3

  f.seccion('III.', 'Información del Inmueble')
  const tercio = (ANCHO - 8) / 3
  f.fila([
    { etiqueta: 'Provincia', valor: UBICACION_ASADA.provincia, ancho: tercio },
    { etiqueta: 'Cantón', valor: UBICACION_ASADA.canton, ancho: tercio },
    { etiqueta: 'Distrito', valor: UBICACION_ASADA.distrito, ancho: tercio },
  ], { gap: 4 })
  f.texto('Dirección exacta del inmueble', X0 + ANCHO / 2, f.y + 2.4, { size: 8.5, bold: true, align: 'center' })
  f.rect(X0, f.y + 5, ANCHO, 13)
  f.valorEnCaja(datos.direccion, X0, f.y + 5, ANCHO, 13, 9.5)
  f.y += 5 + 13 + 3
  const resto = ANCHO - 12
  f.fila([
    { etiqueta: 'Folio real/Concesión/Arriendo/Asignación', valor: '', ancho: resto * 0.34 },
    { etiqueta: 'Plano Catastro', valor: datos.numeroPlano, ancho: resto * 0.22 },
    { etiqueta: 'Plano de Agrimensura', valor: '', ancho: resto * 0.22 },
    { etiqueta: 'NIS', valor: '', ancho: resto * 0.22 },
  ], { gap: 4 })

  // ---------- Página 2 ----------
  f.nuevaPagina(() => f.encabezadoSimple(nombre, TITULO))

  const yNat = f.y
  const colNat = ANCHO / 2
  const naturaleza: [string, boolean][] = [
    ['Inmueble inscrito', coincide(datos.naturalezaInmueble, 'Inmueble inscrito')],
    ['Parcelas agrícolas', coincide(datos.naturalezaInmueble, 'Parcela agrícola', 'Parcelas agrícolas')],
    ['Zona indígena', coincide(datos.naturalezaInmueble, 'Zona indígena')],
    ['Zona marítimo terrestre', coincide(datos.naturalezaInmueble, 'Zona marítimo terrestre')],
    ['Terreno en administración del INDER*', coincide(datos.naturalezaInmueble, 'Terreno en administración del INDER')],
    ['Inmueble sin inscribir', coincide(datos.naturalezaInmueble, 'Inmueble sin inscribir')],
  ]
  const calidad: [string, boolean][] = [
    ['Propietario registral', coincide(datos.calidadTitular, 'Propietario registral')],
    ['Poseedor', coincide(datos.calidadTitular, 'Poseedor')],
    ['Autorizado Legal', coincide(datos.calidadTitular, 'Autorizado legal', 'Autorizado Legal')],
    ['Representante Legal', coincide(datos.calidadTitular, 'Representante legal', 'Representante Legal')],
    ['Concesionario, arrendatario o asignatario', coincide(datos.calidadTitular, 'Concesionario, arrendatario o asignatario')],
  ]
  const alturaNat = 50
  f.rect(X0, yNat, ANCHO, alturaNat)
  f.linea(X0 + colNat, yNat, X0 + colNat, yNat + alturaNat)
  f.texto('1.  Naturaleza del inmueble', X0 + colNat / 2, yNat + 4, { size: 9, bold: true, align: 'center' })
  f.texto('2.  Calidad del titular del inmueble', X0 + colNat + colNat / 2, yNat + 4, { size: 9, bold: true, align: 'center' })
  const opcion = (lista: [string, boolean][], x: number) =>
    lista.forEach(([texto, marcado], i) => f.opcion('radio', marcado, x, yNat + 11 + i * 5.2, texto, { size: 8 }))
  opcion(naturaleza, X0 + 4)
  opcion(calidad, X0 + colNat + 4)
  const nota1 = f.lineas('*Seleccione: “Terrenos en administración del INDER” cuando sea el caso de terrenos en concesión,', colNat - 8, { size: 6.5 })
  f.bloque(nota1, X0 + 4, yNat + alturaNat - 6, { size: 6.5 })
  const nota2 = f.lineas('*Seleccione: “Autorizado legal” cuando sea el caso de que el solicitante esté designado como albacea, tutor, curador u otra autorización por medio de poder especial o general.', colNat - 8, { size: 6.5 })
  f.bloque(nota2, X0 + colNat + 4, yNat + alturaNat - 7, { size: 6.5 })
  f.y = yNat + alturaNat + 3

  f.seccion('IV.', 'Propósito de la solicitud')
  f.texto('Descripción detallada del proyecto por desarrollar (espacio obligatorio)', X0 + ANCHO / 2, f.y + 2.4, { size: 8.5, bold: true, align: 'center' })
  f.rect(X0, f.y + 5, ANCHO, 22)
  f.valorEnCaja(descripcionProyecto, X0, f.y + 5, ANCHO, 22, 9)
  f.y += 5 + 22 + 3

  f.seccion('V.', 'Datos del propietario registral, poseedor, representante Legal o autorizado legal.')
  const nombreFirmante = esJuridica ? datos.nombreRepresentante : datos.nombreSolicitante
  const idFirmante = esJuridica ? datos.cedulaRepresentante : datos.identificacion
  const util = ANCHO - 8
  f.fila([
    { etiqueta: 'Nombre completo del solicitante', valor: nombreFirmante ?? '', ancho: util * 0.45 },
    { etiqueta: 'Identificación', valor: idFirmante ?? '', ancho: util * 0.25 },
    { etiqueta: 'Firma del solicitante', valor: '', ancho: util * 0.3 },
  ], { gap: 4, alto: 14 })

  f.seccion('VI.', `Datos del funcionario que recibe la solicitud (Uso exclusivo de ${nombre})`)
  const cuarto = (ANCHO - 12) / 4
  f.fila([
    { etiqueta: 'Nombre', valor: '', ancho: cuarto },
    { etiqueta: 'Primer apellido', valor: '', ancho: cuarto },
    { etiqueta: 'Segundo apellido', valor: '', ancho: cuarto },
    { etiqueta: 'Firma', valor: '', ancho: cuarto },
  ], { gap: 4, alto: 14 })

  f.seccion('VII.', 'Requisitos')
  requisitosPajaAgua(nombre).forEach((texto, i) => {
    f.parrafo(`${i + 1}. ${texto}`, { size: 8.5, sangria: 4, espacio: 1.5 })
  })

  // ---------- Página 3 ----------
  f.nuevaPagina()
  f.y += 1
  for (const b of consideracionesPajaAgua(nombre)) {
    if (b.tipo === 'seccion') {
      const [romano, titulo] = b.texto.split('|')
      f.y += 2
      f.seccion(romano.trim(), titulo.trim())
    } else if (b.tipo === 'titulo') {
      f.y += 1.5
      f.parrafo(b.texto, { size: 8.5, bold: true, subrayado: true, espacio: 1 })
    } else if (b.tipo === 'vineta') {
      f.parrafo(b.texto, { size: 8.5, vineta: true, sangria: 2, espacio: 1 })
    } else if (b.tipo === 'vineta2') {
      f.parrafo(b.texto, { size: 8.5, sangria: 9, espacio: 0.6 })
    } else {
      f.parrafo(b.texto, { size: 8.5, espacio: 1.5 })
    }
  }

  return f
}

const X1_ = () => X0 + ANCHO

export async function generarPdfSolicitud(datos: DatosDocumentoSolicitud): Promise<Blob> {
  return dibujarDocumento(datos).pdf.output('blob')
}

// Versión síncrona para pruebas: devuelve el formulario dibujado.
export { dibujarDocumento as _dibujarDocumentoSolicitud }

export function descargarPdfSolicitud(
  blob: Blob,
  _codigoSolicitud?: string | null,
  fecha?: Date | string | null,
): void {
  const nombreArchivo = obtenerNombreArchivoCopia('paja-de-agua', fecha)
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = nombreArchivo
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
