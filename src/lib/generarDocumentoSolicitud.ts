import type { Configuracion } from '../components/Services/configuracion.service'

// Identidad legal de la ASADA: no vive en la tabla `configuracion` (esa
// solo guarda datos de contacto/horario), así que quedan fijos acá. Mismos
// datos usados en AboutUs.tsx (Nuestra historia).
export const ASADA_NOMBRE_LEGAL = 'ASADA Pueblo Nuevo'
export const ASADA_CEDULA_JURIDICA = '3-002-458332'

// Forma común para generar el documento, sin importar si los datos vienen
// del wizard recién enviado (misma sesión, sin volver a pedirle nada al
// backend) o de la lista que ve un administrador logueado.
export interface DatosDocumentoSolicitud {
  codigoSolicitud: string
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

function formatearFecha(fecha: string | Date): string {
  const d = typeof fecha === 'string' ? new Date(fecha) : fecha
  if (Number.isNaN(d.getTime())) return String(fecha)
  return d.toLocaleString('es-CR', { dateStyle: 'long', timeStyle: 'short' })
}

// Escapa texto libre antes de insertarlo en el HTML (observaciones,
// dirección, etc. los escribe el propio solicitante).
function esc(valor: string | null | undefined): string {
  if (valor === null || valor === undefined || valor === '') return '—'
  return String(valor)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

function fila(etiqueta: string, valor: string | null | undefined): string {
  return `
    <div class="campo">
      <span class="etiqueta">${esc(etiqueta)}</span>
      <span class="valor">${esc(valor)}</span>
    </div>`
}

// Arma el HTML completo del "machote" ya lleno: el formulario de conexión
// de servicio adaptado del GNU-42-01-F1 de AyA para ASADA Pueblo Nuevo, con
// los datos de la solicitud Y los datos reales de la ASADA (dirección,
// teléfono, correo — desde Configuracion; nombre y cédula jurídica fijos).
export function generarHtmlSolicitud(
  datos: DatosDocumentoSolicitud,
  configuracion: Configuracion,
): string {
  const ubicacion =
    datos.provincia && datos.canton && datos.distrito
      ? `${datos.distrito}, ${datos.canton}, ${datos.provincia}`
      : '—'

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8" />
<title>Solicitud ${esc(datos.codigoSolicitud)} — ${ASADA_NOMBRE_LEGAL}</title>
<style>
  * { box-sizing: border-box; }
  body {
    font-family: Georgia, 'Times New Roman', serif;
    color: #1c2b3a;
    max-width: 820px;
    margin: 0 auto;
    padding: 40px 32px 60px;
    line-height: 1.4;
  }
  header {
    text-align: center;
    border-bottom: 3px solid #0f3d5c;
    padding-bottom: 16px;
    margin-bottom: 20px;
  }
  header h1 {
    margin: 0;
    font-size: 20px;
    letter-spacing: 0.03em;
    text-transform: uppercase;
    color: #0f3d5c;
  }
  header p {
    margin: 3px 0 0;
    font-size: 12px;
    color: #45596b;
  }
  h2.titulo-formulario {
    text-align: center;
    font-size: 16px;
    margin: 20px 0 4px;
    text-transform: uppercase;
    color: #0f3d5c;
  }
  p.subtitulo {
    text-align: center;
    font-size: 11px;
    color: #667788;
    margin: 0 0 20px;
  }
  .meta {
    display: flex;
    justify-content: space-between;
    font-size: 12px;
    background: #f2f6f9;
    border: 1px solid #d7e2ea;
    border-radius: 6px;
    padding: 8px 14px;
    margin-bottom: 18px;
  }
  section.bloque {
    border: 1px solid #d7e2ea;
    border-radius: 6px;
    margin-bottom: 14px;
    overflow: hidden;
  }
  section.bloque h3 {
    background: #0f3d5c;
    color: #fff;
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    margin: 0;
    padding: 6px 12px;
  }
  .campos {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0;
  }
  .campo {
    display: flex;
    flex-direction: column;
    padding: 8px 12px;
    border-bottom: 1px solid #eef2f5;
    border-right: 1px solid #eef2f5;
    font-size: 12.5px;
  }
  .campo.full { grid-column: 1 / -1; }
  .etiqueta {
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    color: #667788;
    margin-bottom: 2px;
  }
  .valor { color: #1c2b3a; font-weight: 600; }
  .firma {
    margin-top: 40px;
    display: flex;
    justify-content: space-between;
    gap: 40px;
  }
  .firma .linea {
    flex: 1;
    text-align: center;
  }
  .firma .linea .raya {
    border-top: 1px solid #1c2b3a;
    margin-bottom: 6px;
    margin-top: 50px;
  }
  footer {
    margin-top: 30px;
    font-size: 10px;
    color: #889;
    border-top: 1px solid #d7e2ea;
    padding-top: 10px;
    text-align: center;
  }
  @media print {
    body { padding: 0; }
    section.bloque { break-inside: avoid; }
  }
</style>
</head>
<body>
  <header>
    <h1>${esc(ASADA_NOMBRE_LEGAL)}</h1>
    <p>Cédula jurídica ${esc(ASADA_CEDULA_JURIDICA)}</p>
    <p>${esc(configuracion.direccion)}</p>
    <p>Tel. ${esc(configuracion.telefono)} · ${esc(configuracion.correo_electronico)}</p>
  </header>

  <h2 class="titulo-formulario">Solicitud de conexión de servicio</h2>
  <p class="subtitulo">
    Adaptado del formulario GNU-42-01-F1 del Instituto Costarricense de Acueductos y
    Alcantarillados (AyA) para uso interno de ${esc(ASADA_NOMBRE_LEGAL)}
  </p>

  <div class="meta">
    <span><strong>Código de solicitud:</strong> ${esc(datos.codigoSolicitud)}</span>
    <span><strong>Fecha:</strong> ${esc(formatearFecha(datos.fecha))}</span>
  </div>

  <section class="bloque">
    <h3>I. Información del titular del inmueble</h3>
    <div class="campos">
      ${fila('Tipo de persona', datos.tipoPersona === 'juridica' ? 'Jurídica' : 'Física')}
      ${fila(
        datos.tipoPersona === 'juridica' ? 'Razón social' : 'Nombre completo',
        datos.nombreSolicitante,
      )}
      ${fila('Identificación', datos.identificacion)}
      ${datos.tipoPersona === 'juridica' ? fila('Representante legal', datos.nombreRepresentante) : ''}
      ${datos.tipoPersona === 'juridica' ? fila('Cédula del representante', datos.cedulaRepresentante) : ''}
    </div>
  </section>

  <section class="bloque">
    <h3>II. Medio para notificación</h3>
    <div class="campos">
      ${fila('Teléfono principal', datos.telefono)}
      ${fila('Teléfono secundario', datos.telefonoSecundario)}
      <div class="campo full">
        <span class="etiqueta">Correo electrónico</span>
        <span class="valor">${esc(datos.correo)}</span>
      </div>
    </div>
  </section>

  <section class="bloque">
    <h3>III. Información del inmueble</h3>
    <div class="campos">
      <div class="campo full">
        <span class="etiqueta">Ubicación (distrito, cantón, provincia)</span>
        <span class="valor">${esc(ubicacion)}</span>
      </div>
      <div class="campo full">
        <span class="etiqueta">Dirección exacta</span>
        <span class="valor">${esc(datos.direccion)}</span>
      </div>
      ${fila('Número de plano catastrado', datos.numeroPlano)}
      ${fila('Naturaleza del inmueble', datos.naturalezaInmueble)}
      ${fila('Calidad del titular', datos.calidadTitular)}
    </div>
  </section>

  <section class="bloque">
    <h3>IV. Propósito de la solicitud</h3>
    <div class="campos">
      ${fila('Servicio que solicita', datos.tipoServicio)}
      ${fila('Tipo de conexión', datos.tipoConexion)}
    </div>
  </section>

  ${
    datos.observaciones
      ? `<section class="bloque">
    <h3>Observaciones</h3>
    <div class="campos">
      <div class="campo full">
        <span class="valor">${esc(datos.observaciones)}</span>
      </div>
    </div>
  </section>`
      : ''
  }

  <section class="bloque">
    <h3>V. Firma del solicitante</h3>
    <div class="firma">
      <div class="linea">
        <div class="raya"></div>
        ${esc(datos.nombreSolicitante)}<br />
        <span style="font-size:10px;color:#667788;">Cédula ${esc(datos.identificacion)}</span>
      </div>
      <div class="linea">
        <div class="raya"></div>
        Firma
      </div>
    </div>
  </section>

  <footer>
    Documento generado automáticamente por el Sistema de Información de ${esc(
      ASADA_NOMBRE_LEGAL,
    )} (SIAPB) a partir de la solicitud con código ${esc(datos.codigoSolicitud)}.
    No requiere firma digital para su trámite interno.
  </footer>
</body>
</html>`
}

// Dispara la descarga del HTML generado como archivo (nombre sugerido:
// solicitud-<codigo>.html). Funciona sin backend: arma un Blob en memoria.
export function descargarDocumentoSolicitud(html: string, codigoSolicitud: string): void {
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `solicitud-${codigoSolicitud}.html`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

// Abre el HTML generado en una pestaña nueva para verlo (y desde ahí
// imprimir/guardar como PDF si se prefiere).
export function verDocumentoSolicitud(html: string): void {
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  window.open(url, '_blank', 'noopener,noreferrer')
  // Se libera un rato después: si se revoca de inmediato, algunos
  // navegadores alcanzan a cerrar la pestaña antes de terminar de pintarla.
  setTimeout(() => URL.revokeObjectURL(url), 60_000)
}
