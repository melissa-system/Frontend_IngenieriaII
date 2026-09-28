import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import { ASADA_NOMBRE_LEGAL } from './asadaInfo'

// PDF de la Solicitud de disponibilidad de servicios / Paja de Agua
// (GNU-41-01-F1), fiel al HTML entregado por Meli: mismas 3 páginas, mismo
// layout, sin ningún color azul — solo se reemplaza la identidad
// institucional de AyA por la de la ASADA y se llenan los campos con los
// datos reales de la solicitud. Mismo enfoque que generarPdfConexion.ts.

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

function esc(valor: string | null | undefined): string {
  if (!valor) return ''
  return valor
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function coincide(valor: string | null | undefined, ...posibles: string[]): boolean {
  if (!valor) return false
  const v = valor.trim().toLowerCase()
  return posibles.some((p) => v === p.trim().toLowerCase())
}

function fmtFecha(fecha: string | Date): string {
  const d = typeof fecha === 'string' ? new Date(fecha) : fecha
  if (Number.isNaN(d.getTime())) return ''
  return d.toISOString().slice(0, 10)
}

function chk(condicion: boolean): string {
  return condicion ? 'checked' : ''
}

const STYLE = `
*{box-sizing:border-box}@page{size:A4;margin:0}body{margin:0;padding:20px;background:#eee;font-family:Arial,Helvetica,sans-serif;color:#222;font-size:9.5pt}.page{width:210mm;min-height:297mm;margin:0 auto 20px;background:#fff;border:1.2px solid #222;border-radius:4mm;overflow:hidden;position:relative;page-break-after:always}.page:last-child{page-break-after:auto}.header{height:22mm;border-bottom:1px solid #222;display:grid;grid-template-columns:28mm 1fr 38mm;align-items:center;padding:2mm 5mm}.logo{font-weight:800;font-size:15pt;text-align:center;line-height:1}.title{text-align:center;font-weight:700;font-size:13pt}.subtitle{font-size:10pt;margin-top:1px}.code{text-align:right;font-size:7pt;align-self:end}.simple-header{height:16mm;border-bottom:1px solid #222;display:flex;align-items:center;padding:2mm 5mm}.simple-header .logo{width:28mm;font-size:12pt}.simple-header .title{flex:1;font-size:12.5pt}.exclusive{text-align:center;font-weight:700;font-style:italic;font-size:11pt;padding:2mm;border-bottom:1px solid #222}.two{display:grid;grid-template-columns:1fr 1fr;gap:5mm}.three{display:grid;grid-template-columns:1fr 1fr 1fr;gap:3mm}.four{display:grid;grid-template-columns:1.3fr 1fr 1fr 1fr;gap:3mm}.field{text-align:center}.field label{display:block;margin-bottom:1mm}input[type=text],input[type=date],input[type=email]{width:100%;height:7.2mm;border:1px solid #222;background:#fff;font:inherit;padding:1mm 2mm}textarea{width:100%;border:1px solid #222;resize:none;font:inherit;padding:1mm 2mm}.section-title{display:flex;align-items:center;gap:3mm;font-weight:700;font-size:11.5pt;margin:2.5mm 5mm 1.5mm}.roman{border:2px solid #222;border-radius:50%;min-width:11mm;height:9mm;display:inline-flex;align-items:center;justify-content:center;font-size:10.5pt}.small{font-size:7.5pt}.content{padding:0 3.5mm}.radio-row{display:flex;gap:1mm 7mm;flex-wrap:wrap;margin-bottom:1.5mm}input[type=radio],input[type=checkbox]{width:3.6mm;height:3.6mm;vertical-align:middle;margin:0 1mm 0 0}.notification{border-top:1px solid #222;border-bottom:1px solid #222;margin-top:1mm}.notification-head,.notification-body{display:grid;grid-template-columns:1fr 1fr}.notification-head>div{text-align:center;font-weight:700;padding:1.5mm;border-right:1px solid #222}.notification-head>div:last-child,.notification-body>div:last-child{border-right:0}.notification-body>div{padding:1.5mm 3mm;border-right:1px solid #222}.inline{display:grid;grid-template-columns:34mm 1fr;align-items:center;margin-bottom:1.5mm}.inline label{text-align:left}.inmueble{border-bottom:1px solid #222;padding:0 3.5mm 3mm}.inmueble .three{margin-bottom:2mm}.inmueble .folio{display:grid;grid-template-columns:1.7fr .75fr .85fr .75fr;gap:2.5mm}.inmueble .extra{display:grid;grid-template-columns:1.7fr .75fr .85fr .75fr;gap:2.5mm;margin-top:1mm}.naturaleza{display:grid;grid-template-columns:1fr 1fr;border-bottom:1px solid #222}.nat-col{padding:1.5mm 3mm;border-right:1px solid #222}.nat-col:last-child{border-right:0}.nat-title{text-align:center;margin-bottom:1mm}.choices{display:grid;grid-template-columns:1fr 1fr 1fr;gap:1mm 3mm;font-size:7.5pt}.note{font-size:6.5pt;margin-top:1.5mm}.purpose{padding:0 3.5mm}.purpose-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:2mm 6mm;margin-bottom:2mm}.purpose-item{display:flex;align-items:flex-start;gap:1mm}.purpose-item input{flex:none}.purpose-line{display:grid;grid-template-columns:1fr 1.2fr 1fr;gap:5mm;align-items:center;margin-bottom:2mm}.purpose-box{display:grid;grid-template-columns:1fr 1fr;gap:4mm;margin-bottom:2mm}.signature{padding:0 3mm}.signature-box{height:12mm;border:1px solid #222}.signature-label{text-align:center;margin-bottom:1mm}.requirements{padding:0 4mm 8mm;font-size:8.7pt;line-height:1.08}.requirements ol{margin:1mm 0 0 7mm;padding-left:5mm}.requirements li{margin-bottom:1mm}.footer{position:absolute;left:0;right:0;bottom:0;height:8.5mm;border-top:1px solid #222;display:flex;align-items:center;justify-content:center;font-size:8.5pt}.page-no{position:absolute;right:5mm}.page3{padding:4mm 8mm 10mm;font-size:8.5pt;line-height:1.05}.page3 p{margin:0 0 2mm}.page3 .head{text-decoration:underline;font-weight:700;margin-top:1mm}.bullet{margin:0 0 1mm 0;padding-left:4mm;text-indent:-3mm}
`

function buildHtml(datos: DatosDocumentoSolicitud): string {
  const esFisica = datos.tipoPersona === 'fisica'
  const esJuridica = datos.tipoPersona === 'juridica'
  const nombre = esc(ASADA_NOMBRE_LEGAL).toUpperCase()

  // La descripción del proyecto es el único campo libre de la sección IV del
  // machote original de AyA; el sistema actual no recolecta los datos
  // específicos de esa sección (tipo de visado, dormitorios, área, caudal,
  // autorización de inspecciones), así que se resume ahí el servicio y tipo
  // de conexión solicitados, más las observaciones del solicitante.
  const descripcionProyecto = [
    datos.tipoServicio ? `Servicio solicitado: ${datos.tipoServicio}.` : '',
    datos.tipoConexion ? `Tipo de conexión: ${datos.tipoConexion}.` : '',
    datos.observaciones ? datos.observaciones : '',
  ]
    .filter(Boolean)
    .join(' ')

  return `<!DOCTYPE html>
<html lang="es"><head><meta charset="UTF-8"><style>${STYLE}</style></head><body>

<section class="page">
<div class="header">
  <div class="logo">${nombre}</div>
  <div class="title">${nombre}<div class="subtitle">Solicitud de constancia de disponibilidad de servicios</div></div>
  <div class="code">Código: GNU-41-01-F1&nbsp;&nbsp; Versión: 03</div>
</div>
<div class="exclusive">Uso exclusivo de ${nombre}</div>
<div class="content">
  <div class="two" style="padding:2mm 14mm 2mm">
    <div class="field"><label>Número de solicitud</label><input type="text" value="${esc(datos.codigoSolicitud)}" readonly></div>
    <div class="field"><label>Fecha de ingreso</label><input type="date" value="${fmtFecha(datos.fecha)}" readonly></div>
  </div>
</div>

<div class="section-title"><span class="roman">I.</span> Información del Titular del inmueble</div>
<div class="content">
  <div class="radio-row"><label><input type="radio" ${chk(esFisica)}>Persona Física</label></div>
  <div class="two">
    <div class="field"><label>Nombre completo</label><input type="text" value="${esFisica ? esc(datos.nombreSolicitante) : ''}" readonly></div>
    <div class="field"><label>No. de identificación</label><input type="text" value="${esFisica ? esc(datos.identificacion) : ''}" readonly></div>
  </div>
  <div class="radio-row" style="margin-top:1.5mm"><label><input type="radio" ${chk(esJuridica)}>Persona Jurídica</label></div>
  <div class="two">
    <div class="field"><label>Razón Social</label><input type="text" value="${esJuridica ? esc(datos.nombreSolicitante) : ''}" readonly></div>
    <div class="field"><label>No. de Cédula Jurídica</label><input type="text" value="${esJuridica ? esc(datos.identificacion) : ''}" readonly></div>
  </div>
  <div class="two" style="margin-top:2mm">
    <div class="field"><label>Teléfono 1</label><input type="text" value="${esc(datos.telefono)}" readonly></div>
    <div class="field"><label>Teléfono 2</label><input type="text" value="${esc(datos.telefonoSecundario)}" readonly></div>
  </div>
</div>

<div class="section-title" style="margin-top:3mm"><span class="roman">II.</span> Medio para notificación <span class="small">(Seleccione el medio de notificación principal y secundario de su preferencia)</span></div>
<div class="notification">
  <div class="notification-head"><div>Medio principal</div><div>Medio secundario</div></div>
  <div class="notification-body">
    <div>
      <div class="inline"><label>Fax:</label><input type="text" value="" readonly></div>
      <div class="inline"><label>Correo electrónico:</label><input type="email" value="${esc(datos.correo)}" readonly></div>
      <div class="inline"><label>Dirección física:</label><textarea rows="3" readonly></textarea></div>
    </div>
    <div>
      <div class="inline"><label>Fax:</label><input type="text" value="" readonly></div>
      <div class="inline"><label>Correo electrónico:</label><input type="email" value="" readonly></div>
      <div class="inline"><label>Dirección física:</label><textarea rows="3" readonly></textarea></div>
    </div>
  </div>
</div>

<div class="section-title"><span class="roman">III.</span> Información del Inmueble</div>
<div class="inmueble">
  <div class="three">
    <div class="field"><label>Provincia</label><input type="text" value="${esc(datos.provincia)}" readonly></div>
    <div class="field"><label>Cantón</label><input type="text" value="${esc(datos.canton)}" readonly></div>
    <div class="field"><label>Distrito</label><input type="text" value="${esc(datos.distrito)}" readonly></div>
  </div>
  <div class="field" style="margin-bottom:2mm"><label>Dirección exacta del inmueble</label><textarea rows="2" readonly>${esc(datos.direccion)}</textarea></div>
  <div class="folio">
    <div class="field"><label>Folio real/Concesión/Arriendo/Asignación</label><input type="text" value="" readonly></div>
    <div class="field"><label>Plano Catastro</label><input type="text" value="${esc(datos.numeroPlano)}" readonly></div>
    <div class="field"><label>Plano de Agrimensura</label><input type="text" value="" readonly></div>
    <div class="field"><label>NIS</label><input type="text" value="" readonly></div>
  </div>
</div>
<div class="footer">El agua es vida ... ¡Cuidémosla! <span class="page-no">1</span></div>
</section>

<section class="page">
<div class="simple-header"><div class="logo">${nombre}</div><div class="title">Solicitud de constancia de disponibilidad de servicios</div></div>

<div class="naturaleza">
  <div class="nat-col">
    <div class="nat-title">1. &nbsp; Naturaleza del inmueble</div>
    <div class="choices">
      <label><input type="radio" ${chk(coincide(datos.naturalezaInmueble, 'Inmueble inscrito'))}>Inmueble inscrito</label>
      <label><input type="radio" ${chk(coincide(datos.naturalezaInmueble, 'Parcela agrícola', 'Parcelas agrícolas'))}>Parcelas agrícolas</label>
      <label><input type="radio" ${chk(coincide(datos.naturalezaInmueble, 'Zona indígena'))}>Zona indígena</label>
      <label><input type="radio" ${chk(coincide(datos.naturalezaInmueble, 'Zona marítimo terrestre'))}>Zona marítimo terrestre</label>
      <label><input type="radio" ${chk(coincide(datos.naturalezaInmueble, 'Terreno en administración del INDER'))}>Terreno en administración del INDER*</label>
      <label><input type="radio" ${chk(coincide(datos.naturalezaInmueble, 'Inmueble sin inscribir'))}>Inmueble sin inscribir</label>
    </div>
    <div class="note">*Seleccione: “Terrenos en administración del INDER” cuando sea el caso de terrenos en concesión,</div>
  </div>
  <div class="nat-col">
    <div class="nat-title">2. &nbsp; Calidad del titular del inmueble</div>
    <div class="choices">
      <label><input type="radio" ${chk(coincide(datos.calidadTitular, 'Propietario registral'))}>Propietario registral</label>
      <label><input type="radio" ${chk(coincide(datos.calidadTitular, 'Poseedor'))}>Poseedor</label>
      <label><input type="radio" ${chk(coincide(datos.calidadTitular, 'Autorizado legal', 'Autorizado Legal'))}>Autorizado Legal</label>
      <label><input type="radio" ${chk(coincide(datos.calidadTitular, 'Representante legal', 'Representante Legal'))}>Representante Legal</label>
      <label style="grid-column:2/4"><input type="radio" ${chk(coincide(datos.calidadTitular, 'Concesionario, arrendatario o asignatario'))}>Concesionario, arrendatario o asignatario</label>
    </div>
    <div class="note">*Seleccione: “Autorizado legal” cuando sea el caso de que el solicitante esté designado como albacea, tutor, curador u otra autorización por medio de poder especial o general.</div>
  </div>
</div>

<div class="section-title"><span class="roman">IV.</span> Propósito de la solicitud</div>
<div class="purpose">
  <div class="field" style="text-align:left;margin-bottom:2mm"><label style="text-align:left">Descripción detallada del proyecto por desarrollar (espacio obligatorio)</label><textarea rows="4" readonly>${esc(descripcionProyecto)}</textarea></div>
</div>

<div class="section-title"><span class="roman">V.</span> Datos del propietario registral, poseedor, representante Legal o autorizado legal.</div>
<div class="signature" style="padding-bottom:2mm">
  <div class="three" style="grid-template-columns:1.6fr .7fr .7fr">
    <div><div class="signature-label">Nombre completo del solicitante</div><div class="signature-box"><input type="text" value="${esJuridica ? esc(datos.nombreRepresentante) : esc(datos.nombreSolicitante)}" readonly style="height:100%;border:0"></div></div>
    <div><div class="signature-label">Identificación</div><div class="signature-box"><input type="text" value="${esJuridica ? esc(datos.cedulaRepresentante) : esc(datos.identificacion)}" readonly style="height:100%;border:0"></div></div>
    <div><div class="signature-label">Firma del solicitante</div><div class="signature-box"></div></div>
  </div>
</div>

<div class="section-title"><span class="roman">VI.</span> Datos del funcionario que recibe la solicitud <i>(Uso exclusivo de ${nombre})</i></div>
<div class="signature" style="padding-bottom:2mm">
  <div class="four">
    <div><div class="signature-label">Nombre</div><div class="signature-box"></div></div>
    <div><div class="signature-label">Primer apellido</div><div class="signature-box"></div></div>
    <div><div class="signature-label">Segundo apellido</div><div class="signature-box"></div></div>
    <div><div class="signature-label">Firma</div><div class="signature-box"></div></div>
  </div>
</div>

<div class="section-title"><span class="roman">VII.</span> Requisitos</div>
<div class="requirements">
<ol>
<li>Formulario presentado y firmado por el propietario registral, poseedor o representante legal ante las Plataformas de Servicios de ${nombre} o plataforma digital de ${nombre}. En caso de que no sea el propietario el que gestiona la solicitud, debe presentar un poder especial o autorización o aval debidamente autentificada que lo acredite para realizar la gestión.</li>
<li>Presentación de documento de identificación del propietario del inmueble o su representante legal. ${nombre} eximirá al solicitante de la presentación de este requisito al contar con la factibilidad tecnológica para su verificación.</li>
</ol>
</div>
<div class="footer">El agua es vida ... ¡Cuidémosla! <span class="page-no">2</span></div>
</section>

<section class="page">
<div class="simple-header"><div class="logo">${nombre}</div><div class="title">Solicitud de constancia de disponibilidad de servicios</div></div>
<div class="page3">
<p>Según la naturaleza del inmueble o tipo de solicitud deberá cumplir con los siguientes requisitos:</p>

<div class="head">a) Inmuebles registrados en derechos, fraccionamientos o urbanizaciones:</div>
<div class="bullet">• Para el caso de inmuebles registrados en derechos la solicitud podrá realizarla el copropietario que pretenda acceder al servicio, sin que sea necesaria la autorización, ni presentación de documentos de identificación de los demás titulares de los derechos restantes y presentación de plano catastrado.</div>
<div class="bullet">• En caso de que la propiedad no cuente con plano catastrado, deberá presentar un plano de agrimensura que cumpla con lo estipulado en el Artículo 2 inciso q) del Reglamento de la Ley de Catastro Nacional vigente y el correspondiente sello del CFIA conforme a lo dispuesto en el Reglamento Especial del Administrador de Proyectos de Topografía (APT) del CFIA vigente y sus reformas o las normativas que los sustituya.</div>
<div class="bullet">• Cuando la solicitud refiera a proyectos de urbanización o fraccionamiento tipificados en el Reglamento de Fraccionamiento y Urbanizaciones del INVU el solicitante deberá indicar expresamente el número de servicios solicitados y la tipología de proyecto para el cual se gestiona la constancia de disponibilidad de servicios. En el caso de estar la propiedad en derechos el solicitante deberá aportar el plano catastrado o el plano de agrimensura que describa la localización del derecho</div>

<div class="head">b) Inmuebles sin inscribir:</div>
<div class="bullet">• El poseedor deberá suscribir ante el plataformista, la declaración jurada cuyo formulario será suplido por ${nombre}, la cual será firmada por el solicitante y dos testigos con una descripción de la naturaleza del inmueble, señalando en qué consisten sus actos posesorios, la existencia de edificación, las mejoras realizadas y que la propiedad no se encuentra inscrita.</div>

<div class="head">c) Territorios administrados por el Estado o sus instituciones con régimen jurídico especial:</div>
<div class="bullet">• Para el caso de solicitudes asociadas a inmuebles bajo la modalidad de territorios administrados por el Estado o sus instituciones con régimen jurídico especial: zona marítimo terrestre, zonas fronterizas, territorios indígenas, polos de desarrollo turístico, entre otros; que se otorgan mediante concesiones, arriendos y asignaciones; los solicitantes deberán presentar la autorización expresa del ente correspondiente, en la cual se avale la solicitud del trámite, de conformidad con la norma que los regule.</div>
<div class="bullet">• Para el caso de territorios indígenas, cuando la ADII esté inactiva, el solicitante deberá rendir mediante declaración jurada en qué consisten sus actos posesorios, y que su permanencia ha sido en forma pacífica, continúa e ininterrumpida por más de un año; igualmente deberá declarar su condición de miembro de la comunidad indígena que corresponda, lo cual deberá ser avalado por dos habitantes de la comunidad que respalde su situación y condición. Este requisito también será validado para la solicitud de la conexión permanente.</div>

<div class="head">d) Condiciones especiales o restricciones para estaciones de combustibles:</div>
<div class="bullet">• El administrado deberá presentar la siguiente información en referencia al proyecto:</div>
<div class="bullet" style="padding-left:8mm;text-indent:-3mm">- Plano Catastrado</div>
<div class="bullet" style="padding-left:8mm;text-indent:-3mm">- Nota firmada y poder de los representantes legales</div>
<div class="bullet" style="padding-left:8mm;text-indent:-3mm">- Lugar y medios de notificación.</div>
<div class="bullet" style="padding-left:8mm;text-indent:-3mm">- Diseño del sitio de las estructuras y con las coordenadas respectivas de ubicación.</div>
<div class="bullet" style="padding-left:8mm;text-indent:-3mm">- Descripción detalla de tipo de combustible y cantidad.</div>
<div class="bullet" style="padding-left:8mm;text-indent:-3mm">- Criterio de SENARA en los casos que se requiera por cercanía de pozos de ${nombre} o zonas estratégicas para abastecimiento, de conformidad con el Decreto Ejecutivo 42015-MP-MAG-MINAE-S-MIVAH y sus reformas</div>

<div class="section-title" style="margin:3mm 0 2mm"><span class="roman">VIII.</span> Otras consideraciones y plazo de ejecución</div>
<p>Conforme a lo establecido en el artículo 6 de la Ley 8220, Publicada en La Gaceta No. 49 de 11 de marzo de 2002, en caso de no cumplir con la presentación de la totalidad de los requisitos, se otorgará un plazo de 10 días hábiles para que los aporte. Transcurrido el plazo sin que se atienda el requerimiento, el trámite quedará denegado y en caso de requerir el servicio deberá realizar una nueva solicitud.</p>
<p>Cumplida la presentación de la totalidad de requisitos; la Institución contará con un plazo de hasta 15 días hábiles para la resolución del trámite.</p>
</div>
<div class="footer">El agua es vida ... ¡Cuidémosla! <span class="page-no">3</span></div>
</section>

</body></html>`
}

// Superpone una marca visible (✓ / ●) sobre cada checkbox/radio marcado:
// html2canvas no captura de forma confiable el "checked" nativo del
// navegador, así que se refuerza con un elemento propio.
function reforzarMarcas(root: HTMLElement) {
  root.querySelectorAll<HTMLInputElement>('input[type=checkbox], input[type=radio]').forEach((input) => {
    if (!input.checked) return
    const parent = input.parentElement
    if (!parent) return
    if (getComputedStyle(parent).position === 'static') {
      parent.style.position = 'relative'
    }
    const mark = document.createElement('span')
    mark.textContent = input.type === 'radio' ? '●' : '✓'
    Object.assign(mark.style, {
      position: 'absolute',
      left: `${input.offsetLeft}px`,
      top: `${input.offsetTop}px`,
      width: `${input.offsetWidth}px`,
      height: `${input.offsetHeight}px`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '9px',
      lineHeight: '1',
      fontWeight: 'bold',
      color: '#222',
      pointerEvents: 'none',
    })
    parent.appendChild(mark)
  })
}

export async function generarPdfSolicitud(datos: DatosDocumentoSolicitud): Promise<Blob> {
  const contenedor = document.createElement('div')
  contenedor.style.position = 'fixed'
  contenedor.style.left = '-99999px'
  contenedor.style.top = '0'
  contenedor.innerHTML = buildHtml(datos)
  document.body.appendChild(contenedor)

  try {
    reforzarMarcas(contenedor)

    // Esperar un frame para que el layout (grid/flex) termine de calcularse
    // antes de medir offsetLeft/offsetTop de los checkboxes.
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))

    const paginas = Array.from(contenedor.querySelectorAll<HTMLElement>('.page'))
    const pdf = new jsPDF({ unit: 'mm', format: 'a4' })

    for (let i = 0; i < paginas.length; i++) {
      const canvas = await html2canvas(paginas[i], { scale: 2, useCORS: true, backgroundColor: '#ffffff' })
      const imgData = canvas.toDataURL('image/png')
      if (i > 0) pdf.addPage()
      pdf.addImage(imgData, 'PNG', 0, 0, 210, 297)
    }

    return pdf.output('blob')
  } finally {
    document.body.removeChild(contenedor)
  }
}

export function descargarPdfSolicitud(blob: Blob, codigoSolicitud: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${codigoSolicitud}.pdf`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
