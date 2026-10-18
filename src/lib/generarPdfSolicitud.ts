import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import { ASADA_NOMBRE_LEGAL } from './asadaInfo'
import { crearContenedorCaptura } from './aislarEstilosPdf'
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
  return obtenerFechaArchivoCostaRica(fecha)
}

function chk(condicion: boolean): string {
  return condicion ? 'checked' : ''
}

const STYLE = `
*{box-sizing:border-box}
@page{size:A4;margin:0}
body{margin:0;padding:20px;background:#eee;font-family:Arial,Helvetica,sans-serif;color:#222;font-size:9.5px}
.page{width:210mm;min-height:297mm;max-height:297mm;margin:0 auto 20px;background:#fff;border:1.2px solid #222;border-radius:4mm;overflow:hidden;box-sizing:border-box;padding:8mm 10mm 6mm 10mm;position:relative;page-break-after:always}
.page:last-child{page-break-after:auto}

.header{height:14mm;border:1px solid #222;display:grid;grid-template-columns:26mm 1fr 36mm;align-items:center;padding:2px 4px;margin-bottom:2px}
.header>div{padding:2px 4px}
.logo{font-weight:800;font-size:10.5pt;text-align:center;line-height:1}
.title{text-align:center;font-weight:700;font-size:10pt;line-height:1.15}
.subtitle{font-size:7.5pt;margin-top:1px}
.code{text-align:right;font-size:6.5pt;align-self:end}

.banner-backup{background:#fffbeb;border:1px solid #f59e0b;padding:2.5px 4px;margin:2px 0 3px 0;font-size:9px;color:#92400e;text-align:center;font-weight:bold;line-height:1.2;border-radius:2px}

.exclusive{text-align:center;font-weight:700;font-style:italic;font-size:9px;padding:2px 4px;border:1px solid #222;margin-bottom:2px}

.two{display:grid;grid-template-columns:1fr 1fr;gap:2.5mm}
.three{display:grid;grid-template-columns:1fr 1fr 1fr;gap:2mm}
.four{display:grid;grid-template-columns:1.3fr 1fr 1fr 1fr;gap:2mm}

.field{text-align:center;margin-bottom:1px}
.field label{display:block;margin-bottom:.8mm;font-size:8.5px;line-height:1.2;color:#222;font-weight:600}
input[type=text],input[type=date],input[type=email]{width:100%;height:5.8mm;border:1px solid #222;background:#fff;font-family:inherit;font-size:9.5px;padding:2px 5px;box-sizing:border-box;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
textarea{width:100%;border:1px solid #222;resize:none;font-family:inherit;font-size:9.5px;padding:2px 5px;box-sizing:border-box}

.section-title{display:flex;align-items:center;gap:2mm;font-weight:700;font-size:10px;margin:3px 0 2px 0}
.roman{border:1.5px solid #222;border-radius:50%;min-width:6.5mm;height:5.5mm;display:inline-flex;align-items:center;justify-content:center;font-size:8.5px}
.small{font-size:7.5px;font-weight:normal}
.content{padding:0 2px}

.radio-row{display:flex;gap:1mm 6mm;flex-wrap:wrap;margin-bottom:1px;font-size:9px}
.radio-row label{font-size:9px;display:flex;align-items:center}
input[type=radio],input[type=checkbox]{width:3.2mm;height:3.2mm;vertical-align:middle;margin:0 1mm 0 0}

.notification{border:1px solid #222;margin-top:1px;margin-bottom:2px}
.notification-head,.notification-body{display:grid;grid-template-columns:1fr 1fr}
.notification-head>div{text-align:center;font-weight:700;padding:2px 5px;border-right:1px solid #222;font-size:8.5px;background:#f8fafc}
.notification-head>div:last-child,.notification-body>div:last-child{border-right:0}
.notification-body>div{padding:2px 5px;border-right:1px solid #222}

.inline{display:grid;grid-template-columns:28mm 1fr;align-items:center;margin-bottom:1px}
.inline label{text-align:left;font-size:8.5px;margin-bottom:0}
.inline input{height:5.2mm;font-size:9.5px;padding:1px 4px}
.inline textarea{height:9mm;font-size:9px;padding:1px 4px}

.inmueble{border:1px solid #222;padding:2px 5px;margin-top:1px}
.inmueble .three{margin-bottom:1.5px}
.inmueble .folio{display:grid;grid-template-columns:1.6fr .8fr .8fr .8fr;gap:2mm;margin-top:1.5px}
.inmueble .folio input{height:5.8mm;font-size:9.5px;padding:2px 5px}

.box-text{min-height:5.8mm;max-height:11mm;border:1px solid #222;background:#fff;padding:0 5px;display:flex;align-items:center;text-align:left;white-space:pre-wrap;word-break:break-word;font-size:9.5px;line-height:1.2;box-sizing:border-box}

.simple-header{height:12mm;border:1px solid #222;display:flex;align-items:center;padding:2px 5px;margin-bottom:2px}
.simple-header .logo{width:26mm;font-size:10pt}
.simple-header .title{flex:1;font-size:10.5pt}

.naturaleza{display:grid;grid-template-columns:1fr 1fr;border:1px solid #222;margin-bottom:2px}
.nat-col{padding:2px 5px;border-right:1px solid #222}
.nat-col:last-child{border-right:0}
.nat-title{text-align:center;margin-bottom:1mm;font-size:9px;font-weight:700}
.choices{display:grid;grid-template-columns:1fr 1fr 1fr;gap:1mm 2.5mm;font-size:7.5pt}
.note{font-size:6.5pt;margin-top:1mm}

.purpose{padding:0 2px}
.purpose-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:2mm 5mm;margin-bottom:2mm}
.purpose-item{display:flex;align-items:flex-start;gap:1mm}
.purpose-item input{flex:none}
.purpose-line{display:grid;grid-template-columns:1fr 1.2fr 1fr;gap:4mm;align-items:center;margin-bottom:2mm}
.purpose-box{display:grid;grid-template-columns:1fr 1fr;gap:3mm;margin-bottom:2mm}

.signature{padding:0 2px}
.signature-box{height:11mm;border:1px solid #222;display:flex;align-items:stretch}
.signature-label{text-align:center;margin-bottom:.8mm;font-size:8.5px;line-height:1.2}

.requirements{padding:0 3mm 4mm;font-size:8pt;line-height:1.15}
.requirements ol{margin:1mm 0 0 5mm;padding-left:4mm}
.requirements li{margin-bottom:1mm}

.footer{position:absolute;left:0;right:0;bottom:0;height:6.5mm;border-top:1px solid #222;display:flex;align-items:center;justify-content:center;font-size:7.5pt;background:#fff}
.page-no{position:absolute;right:8mm}

.page3{padding:2mm 4mm 6mm;font-size:8pt;line-height:1.15}
.page3 p{margin:0 0 1.5mm}
.page3 .head{text-decoration:underline;font-weight:700;margin-top:1mm}
.bullet{margin:0 0 1mm 0;padding-left:3mm;text-indent:-2.5mm}
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

  const valorNumeroSolicitud = datos.codigoSolicitud && datos.codigoSolicitud.trim().length > 0
    ? esc(datos.codigoSolicitud)
    : 'Pendiente de registro'

  return `<!DOCTYPE html>
<html lang="es"><head><meta charset="UTF-8"><style>${STYLE}</style></head><body>

<section class="page">
<div class="header">
  <div class="logo">${nombre}</div>
  <div class="title">${nombre}<div class="subtitle">Solicitud de constancia de disponibilidad de servicios</div></div>
  <div class="code">Código: GNU-41-01-F1&nbsp;&nbsp; Versión: 03</div>
</div>
${!datos.codigoSolicitud ? `<div class="banner-backup">Copia de respaldo: solicitud pendiente de registro en el sistema</div>` : ''}
<div class="exclusive">Uso exclusivo de ${nombre}</div>
<div class="content">
  <div class="two" style="padding:1px 12mm 2px">
    <div class="field"><label>Número de solicitud</label><input type="text" value="${valorNumeroSolicitud}" readonly></div>
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
  <div class="radio-row" style="margin-top:1.5px"><label><input type="radio" ${chk(esJuridica)}>Persona Jurídica</label></div>
  <div class="two">
    <div class="field"><label>Razón Social</label><input type="text" value="${esJuridica ? esc(datos.nombreSolicitante) : ''}" readonly></div>
    <div class="field"><label>No. de Cédula Jurídica</label><input type="text" value="${esJuridica ? esc(datos.identificacion) : ''}" readonly></div>
  </div>
  <div class="two" style="margin-top:1.5px">
    <div class="field"><label>Teléfono 1</label><input type="text" value="${esc(datos.telefono)}" readonly></div>
    <div class="field"><label>Teléfono 2</label><input type="text" value="${esc(datos.telefonoSecundario)}" readonly></div>
  </div>
</div>

<div class="section-title" style="margin-top:2px"><span class="roman">II.</span> Medio para notificación <span class="small">(Seleccione el medio de notificación principal y secundario de su preferencia)</span></div>
<div class="notification">
  <div class="notification-head"><div>Medio principal</div><div>Medio secundario</div></div>
  <div class="notification-body">
    <div>
      <div class="inline"><label>Fax:</label><input type="text" value="" readonly></div>
      <div class="inline"><label>Correo electrónico:</label><input type="email" value="${esc(datos.correo)}" readonly></div>
      <div class="inline"><label>Dirección física:</label><textarea rows="2" readonly></textarea></div>
    </div>
    <div>
      <div class="inline"><label>Fax:</label><input type="text" value="" readonly></div>
      <div class="inline"><label>Correo electrónico:</label><input type="email" value="" readonly></div>
      <div class="inline"><label>Dirección física:</label><textarea rows="2" readonly></textarea></div>
    </div>
  </div>
</div>

<div class="section-title" style="margin-top:2px"><span class="roman">III.</span> Información del Inmueble</div>
<div class="inmueble">
  <div class="three">
    <div class="field"><label>Provincia</label><input type="text" value="${esc(datos.provincia)}" readonly></div>
    <div class="field"><label>Cantón</label><input type="text" value="${esc(datos.canton)}" readonly></div>
    <div class="field"><label>Distrito</label><input type="text" value="${esc(datos.distrito)}" readonly></div>
  </div>
  <div class="field" style="margin-bottom:1.5px;text-align:left"><label style="text-align:left">Dirección exacta del inmueble</label><div class="box-text">${esc(datos.direccion)}</div></div>
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
  <div class="field" style="text-align:left;margin-bottom:2mm"><label style="text-align:left">Descripción detallada del proyecto por desarrollar (espacio obligatorio)</label><div style="min-height:12mm;border:1px solid #222;background:#fff;padding:0 2mm;display:flex;align-items:center;text-align:left;white-space:pre-wrap;word-break:break-word;font-size:8.5pt;line-height:1.2;box-sizing:border-box;">${esc(descripcionProyecto)}</div></div>
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
  const contenedor = crearContenedorCaptura(buildHtml(datos))

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
