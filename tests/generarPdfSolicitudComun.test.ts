import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  obtenerFechaHoraCostaRica,
  obtenerFechaArchivoCostaRica,
  obtenerNombreArchivoCopia,
} from '../src/lib/formatoFechaCostaRica.ts'
import {
  buildHtmlCopiaComun,
  type DatosCopiaComun,
} from '../src/lib/generarPdfSolicitudComun.ts'

describe('PBI 532: Formato de Fecha y Hora de Costa Rica (Task 533/536)', () => {
  it('formatea fecha y hora en formato estricto dd/mm/aaaa hh:mm con zona horaria America/Costa_Rica (UTC-6)', () => {
    // 2026-10-13 18:30 UTC -> en Costa Rica (UTC-6) son las 12:30
    const fechaUtc = new Date('2026-10-13T18:30:00Z')
    const formateada = obtenerFechaHoraCostaRica(fechaUtc)
    assert.equal(formateada, '13/10/2026 12:30')
  })

  it('cruza correctamente el límite de medianoche UTC a la fecha local de Costa Rica', () => {
    // 2026-10-14 02:15 UTC -> en Costa Rica (UTC-6) es 2026-10-13 20:15
    const fechaUtc = new Date('2026-10-14T02:15:00Z')
    const formateada = obtenerFechaHoraCostaRica(fechaUtc)
    assert.equal(formateada, '13/10/2026 20:15')
  })

  it('no arroja error ante valores nulos o indefinidos y retorna fecha válida en Costa Rica', () => {
    const resNull = obtenerFechaHoraCostaRica(null)
    const resUndef = obtenerFechaHoraCostaRica(undefined)
    assert.match(resNull, /^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}$/)
    assert.match(resUndef, /^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}$/)
  })

  it('formatea fecha para nombre de archivo en aaaa-mm-dd respetando Costa Rica', () => {
    // 2026-12-01 04:00 UTC -> en Costa Rica es 2026-11-30 22:00
    const fechaUtc = new Date('2026-12-01T04:00:00Z')
    const fechaArchivo = obtenerFechaArchivoCostaRica(fechaUtc)
    assert.equal(fechaArchivo, '2026-11-30')
  })
})

describe('PBI 532: Nomenclatura Estandarizada del Archivo PDF', () => {
  it('genera nombre con formato copia-solicitud-<tipo>-<aaaa-mm-dd>.pdf', () => {
    const fecha = new Date('2026-09-15T16:00:00Z') // 10:00 en CR
    const nombre = obtenerNombreArchivoCopia('paja-de-agua', fecha)
    assert.equal(nombre, 'copia-solicitud-paja-de-agua-2026-09-15.pdf')
  })

  it('normaliza caracteres con tildes y espacios en el slug del trámite', () => {
    const fecha = new Date('2026-09-15T16:00:00Z')
    const nombre = obtenerNombreArchivoCopia('Conexión de Servicio', fecha)
    assert.equal(nombre, 'copia-solicitud-conexion-de-servicio-2026-09-15.pdf')
  })

  it('soporta slugs de todos los formularios requeridos', () => {
    const fecha = new Date('2026-10-13T16:00:00Z')
    assert.equal(
      obtenerNombreArchivoCopia('cambio-propietario', fecha),
      'copia-solicitud-cambio-propietario-2026-10-13.pdf',
    )
    assert.equal(
      obtenerNombreArchivoCopia('cambio-representante', fecha),
      'copia-solicitud-cambio-representante-2026-10-13.pdf',
    )
    assert.equal(
      obtenerNombreArchivoCopia('cambio-medidor', fecha),
      'copia-solicitud-cambio-medidor-2026-10-13.pdf',
    )
    assert.equal(
      obtenerNombreArchivoCopia('otro', fecha),
      'copia-solicitud-otro-2026-10-13.pdf',
    )
  })
})

describe('PBI 532: Plantilla HTML Común de Copia de Respaldo', () => {
  const datosBase: DatosCopiaComun = {
    tipoTramite: 'Solicitud de Cambio de Propietario',
    tipoSlug: 'cambio-propietario',
    fecha: new Date('2026-10-13T16:00:00Z'),
    solicitante: {
      nombre: 'María Vargas Gómez',
      identificacion: '1-1234-0567',
      telefono: '8888-9999',
      correo: 'maria.vargas@ejemplo.com',
      numeroAbonado: 'ABO-1024',
    },
    detalles: [
      { etiqueta: 'Nombre del nuevo propietario', valor: 'Carlos Mora Rojas' },
      { etiqueta: 'Cédula del nuevo propietario', valor: '1-0987-0654' },
      { etiqueta: 'Motivo del traspaso', valor: 'Compra y venta' },
      { etiqueta: 'Justificación', valor: 'Escritura pública número 45 de compraventa' },
    ],
    adjuntos: ['escritura_publica.pdf'],
  }

  it('muestra la leyenda pendiente cuando la solicitud no tiene código asignado', () => {
    const datosSinCodigo: DatosCopiaComun = {
      ...datosBase,
      codigoSolicitud: null,
    }

    const html = buildHtmlCopiaComun(datosSinCodigo)

    assert.ok(
      html.includes('Copia de respaldo: solicitud pendiente de registro en el sistema'),
      'Debe contener la leyenda requerida de copia pendiente',
    )
    assert.ok(
      html.includes('Este documento certifica los datos ingresados en el formulario web'),
      'Debe contener la explicación para el usuario',
    )
    assert.ok(
      !html.includes('Solicitud Registrada en el Sistema'),
      'No debe indicar que está registrada',
    )
  })

  it('muestra el código de seguimiento destacado cuando la solicitud ya fue registrada', () => {
    const datosConCodigo: DatosCopiaComun = {
      ...datosBase,
      codigoSolicitud: 'SOL-CP-2026-0042',
    }

    const html = buildHtmlCopiaComun(datosConCodigo)

    assert.ok(
      html.includes('Solicitud Registrada en el Sistema'),
      'Debe indicar que la solicitud está registrada',
    )
    assert.ok(
      html.includes('SOL-CP-2026-0042'),
      'Debe incluir el código de solicitud generado',
    )
    assert.ok(
      !html.includes('solicitud pendiente de registro en el sistema'),
      'No debe incluir la leyenda de pendiente',
    )
  })

  it('renderiza correctamente encabezados institucionales y datos del solicitante', () => {
    const html = buildHtmlCopiaComun(datosBase)

    assert.ok(html.includes('ASADA PUEBLO NUEVO'))
    assert.ok(html.includes('3-002-458332'))
    assert.ok(html.includes('María Vargas Gómez'))
    assert.ok(html.includes('1-1234-0567'))
    assert.ok(html.includes('ABO-1024'))
    assert.ok(html.includes('Carlos Mora Rojas'))
    assert.ok(html.includes('escritura_publica.pdf'))
  })

  it('escapa caracteres especiales para evitar inyecciones HTML (XSS)', () => {
    const datosMaliciosos: DatosCopiaComun = {
      ...datosBase,
      solicitante: {
        ...datosBase.solicitante,
        nombre: '<script>alert("xss")</script>',
      },
      detalles: [
        { etiqueta: 'Observación & Detalle', valor: '<img src=x onerror=alert(1)>' },
      ],
    }

    const html = buildHtmlCopiaComun(datosMaliciosos)

    assert.ok(!html.includes('<script>alert("xss")</script>'))
    assert.ok(html.includes('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'))
    assert.ok(html.includes('&lt;img src=x onerror=alert(1)&gt;'))
    assert.ok(html.includes('Observación &amp; Detalle'))
  })
})
