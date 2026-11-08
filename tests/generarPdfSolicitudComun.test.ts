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

  it('renderiza correctamente encabezados institucionales, Punto 1, Punto 2 y pie oficial', () => {
    const html = buildHtmlCopiaComun(datosBase)

    assert.ok(html.includes('ASADA PUEBLO NUEVO'))
    assert.ok(html.includes('3-002-458332'))
    assert.ok(html.includes('María Vargas Gómez'))
    assert.ok(html.includes('1-1234-0567'))
    assert.ok(html.includes('ABO-1024'))
    assert.ok(html.includes('1. Información del Solicitante / Abonado'))
    assert.ok(html.includes('2. Detalles y Declaración del Trámite'))
    assert.ok(html.includes('Carlos Mora Rojas'))
    assert.ok(html.includes('Constancia de Registro y Declaración Jurada'))
    assert.ok(html.includes('Aviso de Validez y Efectos Administrativos'))
    assert.ok(!html.includes('3. Evidencia'), 'No debe incluir la sección 3 de adjuntos')
    assert.ok(!html.includes('3. Documento'), 'No debe incluir la sección 3 de adjuntos')
  })

  it('no incluye la sección 3 de archivo adjunto ni imágenes embebidas en el comprobante formal', () => {
    const datosConFoto: DatosCopiaComun = {
      ...datosBase,
      adjuntosDetalle: [
        {
          nombre: 'medidor_averiado.jpg',
          tipo: 'image/jpeg',
          url: 'data:image/jpeg;base64,/9j/4AAQSkZJRg==',
        },
      ],
    }

    const html = buildHtmlCopiaComun(datosConFoto)
    assert.ok(!html.includes('3. Evidencia'), 'No debe existir el encabezado del punto 3')
    assert.ok(!html.includes('3. Documento'), 'No debe existir el encabezado del punto 3')
    assert.ok(!html.includes('<img'), 'No debe haber tags img embebidos')
    assert.ok(!html.includes('page-anexo'), 'No debe existir página de anexo')
    assert.ok(!html.includes('ANEXO: Documento de Respaldo'), 'No debe existir encabezado de anexo')
  })

  it('genera exactamente una sola página en el comprobante HTML', () => {
    const datosSinAdjuntos: DatosCopiaComun = {
      ...datosBase,
      adjuntos: [],
      adjuntosDetalle: [],
    }

    const html = buildHtmlCopiaComun(datosSinAdjuntos)
    const totalPaginas = (html.match(/class="page"/g) || []).length
    assert.equal(totalPaginas, 1, 'El comprobante debe consistir en exactamente 1 sola página')
    assert.ok(!html.includes('page-anexo'), 'No debe incluir páginas adicionales de anexo')
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

describe('PBI 532: Formato Estricto de Una Página sin Sección 3', () => {
  const datosPrueba: DatosCopiaComun = {
    tipoTramite: 'Solicitud de Cambio de Propietario',
    tipoSlug: 'cambio-propietario',
    fecha: new Date('2026-10-13T16:00:00Z'),
    solicitante: {
      nombre: 'Juan Pérez',
      identificacion: '1-0234-0567',
      telefono: '8888-8888',
      correo: 'juan@ejemplo.com',
      numeroAbonado: 'ABO-5555',
      direccion: 'Nicoya Centro, 100m norte del parque',
    },
    detalles: [
      { etiqueta: 'Nuevo Propietario', valor: 'Ana Rojas' },
      { etiqueta: 'Cédula Nuevo Propietario', valor: '1-9876-5432' },
      { etiqueta: 'Motivo', valor: 'Compra y Venta' },
    ],
    archivo: new File(['contenido'], 'contrato.pdf', { type: 'application/pdf' }),
    adjuntos: ['contrato.pdf'],
    adjuntosDetalle: [{ nombre: 'contrato.pdf', tipo: 'application/pdf' }],
    observaciones: 'Trámite presentado conforme a requisitos institucionales.',
  }

  it('garantiza estructura de página única A4 con Punto 1 y Punto 2', () => {
    const html = buildHtmlCopiaComun(datosPrueba)

    // Verificar que solo haya un contenedor .page
    const coincidenciasPaginas = html.match(/class="page"/g) || []
    assert.equal(coincidenciasPaginas.length, 1)

    // Verificar Secciones requeridas 1 y 2
    assert.ok(html.includes('1. Información del Solicitante / Abonado'))
    assert.ok(html.includes('2. Detalles y Declaración del Trámite'))
    assert.ok(html.includes('Observaciones adicionales'))
    assert.ok(html.includes('Constancia de Registro y Declaración Jurada'))
    assert.ok(html.includes('Aviso de Validez y Efectos Administrativos'))

    // Verificar ausencia absoluta de la Sección 3 y anexos
    assert.ok(!html.includes('3. Evidencia'))
    assert.ok(!html.includes('3. Documento'))
    assert.ok(!html.includes('page-anexo'))
    assert.ok(!html.includes('<img'))
  })
})

