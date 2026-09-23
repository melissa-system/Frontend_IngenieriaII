import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import type { SolicitudConexion } from '../components/Services/conexionPajaAgua.service'
import { ASADA_NOMBRE_LEGAL } from './generarDocumentoSolicitud'

// PDF de la Solicitud de conexión de servicio (GNU-42-01-F1), fiel al HTML
// entregado por Meli: mismas 5 páginas, mismo layout, sin ningún color
// azul — solo se reemplaza la identidad institucional de AyA por la de la
// ASADA y se llenan los campos con los datos reales de la solicitud.
//
// Los <input>/<textarea> se llenan con su .value (html2canvas sí captura el
// texto de un input), pero los checkbox/radio marcados se refuerzan con una
// marca (✓ / ●) superpuesta por JS — html2canvas no siempre logra capturar
// el estado "checked" nativo del navegador de forma confiable.

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

function fmtFecha(fecha: string): string {
  const d = new Date(fecha)
  if (Number.isNaN(d.getTime())) return ''
  return d.toISOString().slice(0, 10)
}

function chk(condicion: boolean): string {
  return condicion ? 'checked' : ''
}

const STYLE = `
*{box-sizing:border-box} @page{size:A4;margin:0} body{margin:0;padding:18px;background:#eee;font-family:Arial,Helvetica,sans-serif;color:#222;font-size:11px}.page{width:210mm;min-height:297mm;margin:0 auto 18px;background:#fff;border:1px solid #222;border-radius:5mm;overflow:hidden;position:relative;page-break-after:always}.page:last-child{page-break-after:auto}.head{height:27mm;border-bottom:1px solid #222;display:grid;grid-template-columns:27mm 1fr 42mm;align-items:center;padding:3mm 5mm}.logo{font-weight:bold;text-align:center;font-size:15px}.title{text-align:center;font-weight:bold;font-size:14px}.title small{display:block;font-size:11px;margin-top:2px}.code{font-size:8px;text-align:right;align-self:end}.simple{height:13mm;border-bottom:1px solid #222;display:flex;align-items:center;padding:2mm 5mm}.simple .logo{width:27mm}.simple .title{flex:1;font-size:13px}.section{display:flex;align-items:center;gap:3mm;font-weight:bold;font-size:13px;margin:3mm 5mm 2mm}.roman{border:2px solid #222;border-radius:50%;min-width:12mm;height:9mm;display:inline-flex;align-items:center;justify-content:center}.content{padding:0 3.5mm 6mm}.exclusive{border-bottom:1px solid #222;padding:2mm 5mm 3mm}.exclusive h3{text-align:center;font-style:italic;margin:0 0 2mm}.grid2{display:grid;grid-template-columns:1fr 1fr;gap:4mm}.grid3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:3mm}.grid4{display:grid;grid-template-columns:repeat(4,1fr);gap:3mm}.field{margin-bottom:2.5mm}.field label{display:block;text-align:center;margin-bottom:1mm}input[type=text],input[type=date],input[type=email]{width:100%;height:8mm;border:1px solid #222;padding:1mm;font:inherit}textarea{width:100%;border:1px solid #222;padding:1mm;resize:none;font:inherit}.checks{display:flex;flex-wrap:wrap;gap:3mm 6mm;align-items:center}.checks label{white-space:nowrap;position:relative}input[type=checkbox],input[type=radio]{width:4mm;height:4mm;margin:0 1mm 0 0;vertical-align:middle}.notif{border-top:1px solid #222;border-bottom:1px solid #222;margin:1mm -3.5mm 0}.notif-head,.notif-body{display:grid;grid-template-columns:1fr 1fr}.notif-head>div{text-align:center;font-weight:bold;padding:2mm;border-right:1px solid #222}.notif-head>div:last-child,.notif-body>div:last-child{border-right:0}.notif-head{border-bottom:1px solid #222}.notif-body>div{padding:2mm 6mm;border-right:1px solid #222}.inline{display:grid;grid-template-columns:35mm 1fr;align-items:center;margin-bottom:1mm}.inline label{text-align:left}.inline input{height:7mm}.footer{position:absolute;left:0;right:0;bottom:0;height:9mm;border-top:1px solid #222;display:flex;align-items:center;justify-content:center;font-size:9px}.pageno{position:absolute;right:5mm}.purpose{border-bottom:1px solid #222;padding:2mm 3mm}.purposegrid{display:grid;grid-template-columns:repeat(3,1fr);gap:2mm}.purposegrid4{display:grid;grid-template-columns:1fr 1fr 1fr 1.5fr;gap:2mm}.purposegrid2{display:grid;grid-template-columns:1fr 1fr;gap:2mm}.signature{display:grid;grid-template-columns:1.8fr .8fr .8fr;gap:3mm;padding:0 2mm 2mm}.sigbox{height:14mm;border:1px solid #222;display:flex;align-items:center;justify-content:center}.siglabel{text-align:center;margin-bottom:1mm}.req{padding:0 9mm 9mm;font-size:9.7px;line-height:1.48}.req ol{margin:1mm 0 0 7mm;padding-left:6mm}.req li{padding-left:1mm;margin-bottom:1.5mm}.rtitle{font-weight:bold;text-decoration:underline;margin:2mm 0 1mm}.bullet{margin:0 0 1mm;padding-left:4mm;text-indent:-3mm}.vtitle{display:flex;align-items:center;gap:3mm;font-weight:bold;font-size:13px;margin:3mm 0}.small{font-size:8px}
`

function buildHtml(s: SolicitudConexion): string {
  const esFisica = s.tipo_persona === 'fisica'
  const esJuridica = s.tipo_persona === 'juridica'

  const medioPrincipalFax = s.medio_notificacion_principal === 'fax' ? esc(s.valor_notificacion_principal) : ''
  const medioPrincipalCorreo = s.medio_notificacion_principal === 'correo' ? esc(s.valor_notificacion_principal) : ''
  const medioPrincipalDireccion = s.medio_notificacion_principal === 'direccion' ? esc(s.valor_notificacion_principal) : ''
  const medioSecundarioFax = s.medio_notificacion_secundario === 'fax' ? esc(s.valor_notificacion_secundario) : ''
  const medioSecundarioCorreo = s.medio_notificacion_secundario === 'correo' ? esc(s.valor_notificacion_secundario) : ''
  const medioSecundarioDireccion = s.medio_notificacion_secundario === 'direccion' ? esc(s.valor_notificacion_secundario) : ''

  return `<!DOCTYPE html>
<html lang="es"><head><meta charset="UTF-8"><style>${STYLE}</style></head><body>

<section class="page">
<div class="head"><div class="logo">${esc(ASADA_NOMBRE_LEGAL).toUpperCase()}</div><div class="title">${esc(ASADA_NOMBRE_LEGAL).toUpperCase()}<small>Solicitud de conexión de servicio</small></div><div class="code">Código: GNU-42-01-F1&nbsp;&nbsp; Versión: 03</div></div>
<div class="exclusive"><h3>Uso exclusivo de AyA</h3><div class="grid2"><div class="field"><label>Número de solicitud</label><input type="text" value="${esc(s.codigo_solicitud)}" readonly></div><div class="field"><label>Fecha de ingreso</label><input type="date" value="${fmtFecha(s.fecha_creacion)}" readonly></div></div></div>
<div class="section"><span class="roman">I.</span>Información del titular del inmueble</div><div class="content">
<div class="checks"><label><input type="radio" name="tipoPersona" ${chk(esFisica)}>Persona Física</label></div><div class="grid2"><div class="field"><label>Nombre completo</label><input type="text" value="${esFisica ? esc(s.nombre_solicitante) : ''}" readonly></div><div class="field"><label>No. de identificación</label><input type="text" value="${esFisica ? esc(s.identificacion_solicitante) : ''}" readonly></div></div>
<div class="checks"><label><input type="radio" name="tipoPersona" ${chk(esJuridica)}>Persona Jurídica</label></div><div class="grid2"><div class="field"><label>Razón Social</label><input type="text" value="${esJuridica ? esc(s.nombre_solicitante) : ''}" readonly></div><div class="field"><label>No. de Cédula Jurídica</label><input type="text" value="${esJuridica ? esc(s.identificacion_solicitante) : ''}" readonly></div></div><div class="grid2"><div class="field"><label>Teléfono 1</label><input type="text" value="${esc(s.telefono_solicitante)}" readonly></div><div class="field"><label>Teléfono 2</label><input type="text" value="" readonly></div></div></div>
<div class="section"><span class="roman">II.</span>Medio para notificación <span class="small">(Seleccione el medio de notificación principal y secundario de su preferencia)</span></div>
<div class="notif"><div class="notif-head"><div>Medio principal</div><div>Medio secundario</div></div><div class="notif-body"><div><div class="inline"><label>Fax:</label><input type="text" value="${medioPrincipalFax}" readonly></div><div class="inline"><label>Correo electrónico:</label><input type="text" value="${medioPrincipalCorreo}" readonly></div><div class="inline"><label>Dirección física:</label><textarea rows="3" readonly>${medioPrincipalDireccion}</textarea></div></div><div><div class="inline"><label>Fax:</label><input type="text" value="${medioSecundarioFax}" readonly></div><div class="inline"><label>Correo electrónico:</label><input type="text" value="${medioSecundarioCorreo}" readonly></div><div class="inline"><label>Dirección física:</label><textarea rows="3" readonly>${medioSecundarioDireccion}</textarea></div></div></div></div>
<div class="section"><span class="roman">III.</span>Información del Inmueble</div><div class="content"><div class="grid3"><div class="field"><label>Provincia</label><input type="text" value="${esc(s.provincia)}" readonly></div><div class="field"><label>Cantón</label><input type="text" value="${esc(s.canton)}" readonly></div><div class="field"><label>Distrito</label><input type="text" value="${esc(s.distrito)}" readonly></div></div><div class="field"><label>Dirección exacta del inmueble</label><textarea rows="2" readonly>${esc(s.direccion_inmueble)}</textarea></div><div class="grid3"><div class="field"><label>Folio real/Concesión/Arriendo/Asignación</label><input type="text" value="${esc(s.folio_real)}" readonly></div><div class="field"><label>Plano Catastro</label><input type="text" value="${esc(s.plano_catastro)}" readonly></div><div class="field"><label>Plano de Agrimensura</label><input type="text" value="${esc(s.plano_agrimensura)}" readonly></div></div><div class="grid2"><div class="inline"><label>Indicar el N° de disponibilidad</label><input type="text" value="${esc(s.numero_disponibilidad)}" readonly></div><div class="inline"><label>Indicar el N° de NIS en caso de que exista en el inmueble</label><input type="text" value="${esc(s.numero_nis)}" readonly></div></div></div>
<div style="border-top:1px solid #222;display:grid;grid-template-columns:1fr 1fr;font-size:8px"><div style="padding:2mm;border-right:1px solid #222"><div style="text-align:center;font-size:10px">1. Naturaleza del inmueble</div><div class="checks">
<label><input type="radio" name="naturaleza" ${chk(coincide(s.naturaleza_inmueble, 'Inmueble inscrito'))}>Inmueble inscrito</label>
<label><input type="radio" name="naturaleza" ${chk(coincide(s.naturaleza_inmueble, 'Parcela agrícola', 'Parcelas agrícolas'))}>Parcelas agrícolas</label>
<label><input type="radio" name="naturaleza" ${chk(coincide(s.naturaleza_inmueble, 'Zona indígena'))}>Zona indígena</label>
<label><input type="radio" name="naturaleza" ${chk(coincide(s.naturaleza_inmueble, 'Zona marítimo', 'Zona marítimo terrestre'))}>Zona marítimo</label>
<label><input type="radio" name="naturaleza" ${chk(coincide(s.naturaleza_inmueble, 'Terreno en administración del INDER'))}>Terreno en administración del INDER*</label>
<label><input type="radio" name="naturaleza" ${chk(coincide(s.naturaleza_inmueble, 'Inmueble sin inscribir'))}>Inmueble sin inscribir</label>
</div><div class="small">*Seleccione: “Terrenos en administración del INDER” cuando sea el caso de terrenos en concesión,</div></div><div style="padding:2mm"><div style="text-align:center;font-size:10px">2. Calidad del titular del inmueble</div><div class="checks">
<label><input type="radio" name="calidad" ${chk(coincide(s.calidad_titular, 'Propietario registral'))}>Propietario registral</label>
<label><input type="radio" name="calidad" ${chk(coincide(s.calidad_titular, 'Poseedor'))}>Poseedor</label>
<label><input type="radio" name="calidad" ${chk(coincide(s.calidad_titular, 'Autorizado legal', 'Autorizado Legal'))}>Autorizado Legal</label>
<label><input type="radio" name="calidad" ${chk(coincide(s.calidad_titular, 'Representante legal', 'Representante Legal'))}>Representante Legal</label>
<label><input type="radio" name="calidad" ${chk(coincide(s.calidad_titular, 'Concesionario, arrendatario o asignatario'))}>Concesionario, arrendatario o asignatario</label>
</div><div class="small">*Seleccione: “Autorizado legal” cuando sea el caso de que el solicitante esté designado como albacea, tutor, curador u otra autorización por medio de poder especial o general.</div></div></div>
<div class="footer">El agua es vida ... ¡Cuidémosla!<span class="pageno">1</span></div></section>

<section class="page"><div class="simple"><div class="logo">${esc(ASADA_NOMBRE_LEGAL).toUpperCase()}</div><div class="title">Solicitud de conexión de servicio</div></div>
<div class="section"><span class="roman">IV.</span>Propósito de la solicitud</div><div class="purpose"><div class="purposegrid"><label><input type="checkbox" ${chk(s.servicio_solicitado === 'agua_potable')}>Agua potable</label><label><input type="checkbox" ${chk(s.servicio_solicitado === 'alcantarillado_sanitario')}>Alcantarillado sanitario</label><label><input type="checkbox" ${chk(s.servicio_solicitado === 'ambos')}>Ambos</label></div></div><div class="purpose"><div class="purposegrid4">
<label><input type="checkbox" ${chk(s.tipo_tramite === 'nueva_conexion')}>Nueva conexión</label>
<label><input type="checkbox" ${chk(s.tipo_tramite === 'individualizacion')}>Individualización</label>
<label><input type="checkbox" ${chk(s.tipo_tramite === 'independizacion')}>Independización</label>
<label><input type="checkbox" ${chk(s.tipo_tramite === 'traslado')}>Traslado</label>
<label><input type="checkbox" ${chk(s.tipo_tramite === 'servicio_provisional_proyectos')}>Servicio provisional para proyectos</label>
<label><input type="checkbox" ${chk(s.tipo_tramite === 'cambio_diametro')}>Cambio de diámetro</label>
<label><input type="checkbox" ${chk(s.tipo_tramite === 'servicio_temporal')}>Servicio Temporal</label>
<label>Indique el codigo APC, CFIA <input type="text" value="${esc(s.codigo_apc_cfia)}" readonly></label>
</div></div><div class="purpose"><div class="purposegrid2"><label><input type="checkbox" ${chk(s.forma_pago === 'efectivo_previo')}>En efectivo en un solo tracto previo a la conexión del servicio.</label><label><input type="checkbox" ${chk(s.forma_pago === 'incluir_primera_facturacion')}>Autorizo incluir el monto por tarifa de derecho de conexión en la primera facturación.</label></div></div>
<div class="section"><span class="roman">V.</span>Firma del solicitante</div><div class="signature"><div><div class="siglabel">Nombre completo del solicitante</div><div class="sigbox"><input style="width:100%;height:100%;border:0" type="text" value="${esc(s.nombre_firmante)}" readonly></div></div><div><div class="siglabel">Identificación</div><div class="sigbox"><input style="width:100%;height:100%;border:0" type="text" value="${esc(s.identificacion_firmante)}" readonly></div></div><div><div class="siglabel">Firma del solicitante</div><div class="sigbox" data-firma-box></div></div></div>
<div class="section"><span class="roman">VI.</span>Datos del funcionario que recibe la solicitud <i>(Uso exclusivo de AyA)</i></div><div class="grid4" style="padding:0 2mm 2mm"><div><div class="siglabel">Nombre</div><input type="text" readonly></div><div><div class="siglabel">Primer apellido</div><input type="text" readonly></div><div><div class="siglabel">Segundo apellido</div><input type="text" readonly></div><div><div class="siglabel">Firma</div><div class="sigbox"></div></div></div>
<div class="section"><span class="roman">VII.</span>Requisitos</div><div class="req"><ol><li>Para el otorgamiento del servicio el inmueble debe contar previamente con la disponibilidad de servicios positiva, vigente y asociada a los fines, naturaleza y propósitos para lo que fue aprobada. En caso de que se detecten movimientos registrables no relacionados con la titularidad del inmueble, AyA tramitará la solicitud al titular legitimado para tal efecto.</li><li>Ante las variaciones catastrales, tales como modificación de áreas y/o linderos que pueden incidir en el caudal y número de servicios definidos para el otorgamiento de la constancia de disponibilidad de servicios, deberá el interesado realizar el trámite señalado en el artículo 30 del Reglamento para la Prestación de los Servicios de AyA y presentar en las Plataformas de Servicio los siguientes requisitos, en forma física o formato digital. Además, debe llenar el formulario proporcionado por AyA, completo y firmado por el propietario registral o su representante legal. En caso de que no sea el propietario el que gestiona la solicitud, debe presentar poder especial, autorización o aval debidamente autenticado que lo acredite para realizar la gestión y firmar el documento denominado “De las condiciones del servicio” y cumplir con la presentación en las plataformas de servicio.</li><li>Para todos los casos previstos en esta norma, el AyA verificará que el solicitante y el inmueble no se encuentren en mora con AyA. Se exceptúan los casos definidos por otras normas o convenios.</li><li>El pago de la tarifa de conexión será conforme a lo establecido en este reglamento.</li><li>En caso de inmuebles con edificaciones existentes, donde no se aporte el permiso de construcción, deberá presentar una constancia municipal en la que se acredite la cantidad de unidades habitacionales existentes en el inmueble, que no cuentan con permiso de construcción y que fueron construidas bajo la tolerancia y aval municipal. Igualmente podrá suscribir una declaración jurada que sustituya este requisito, sin embargo, AyA previo a la aprobación del trámite deberá de verificar ante la Municipalidad correspondiente la veracidad de lo consignado por el solicitante, información que deberá ser remitida mediante correo electrónico u otro medio virtual que agilice el trámite, dentro del plazo de hasta 4 días hábiles. En caso de que el Municipio desmienta lo declarado por el solicitante, se dejará sin efecto la gestión y se procederá con la denuncia penal correspondiente.</li></ol></div><div class="footer">El agua es vida ... ¡Cuidémosla!<span class="pageno">2</span></div></section>

<section class="page"><div class="simple"><div class="logo">${esc(ASADA_NOMBRE_LEGAL).toUpperCase()}</div><div class="title">Solicitud de conexión de servicio</div></div><div class="req">
<div class="rtitle">b) De los requisitos para la solicitud de una conexión permanente por parte del propietario registral en terrenos inscritos:</div><div class="bullet">• Documento de identificación original y vigente del titular del inmueble o su representante legal para su verificación.</div><div class="bullet">• En caso de que para la propiedad no exista plano catastrado, o para efectos de segregación o fraccionamientos, debe presentar un plano de agrimensura que cumpla con lo estipulado en el Artículo N°2 inciso q) del Decreto Ejecutivo No. 34331, Reglamento de la Ley de Catastro Nacional vigente con su respectiva minuta de presentación y el correspondiente sello del CFIA conforme a lo dispuesto en el Reglamento Especial del Administrador de Proyectos de Topografía (APT) del CFIA vigente y sus reformas o las normativas que los sustituya.</div><div class="bullet">• Copia del permiso municipal de construcción vigente, o bien el Número de Proyecto tramitado ante la plataforma APC debidamente aprobado, con el fin de que AyA constate la existencia del requisito, en caso de que se trate de una edificación por desarrollar. El permiso deberá ser coincidente con el fin inicial para el que se gestionó y aprobó la disponibilidad. Igualmente podrá suscribir una declaración jurada que sustituya este requisito, sin embargo, AyA previo a la aprobación del trámite deberá de verificar ante la Municipalidad correspondiente la veracidad de lo consignado por el solicitante, información que deberá ser remitida mediante correo electrónico u otro medio virtual que agilice el trámite, dentro del plazo de hasta 4 días hábiles. En caso de que el Municipio desmienta lo declarado por el solicitante, se dejará sin efecto la gestión y se procederá con la denuncia penal correspondiente.</div>
<div class="rtitle">c) Conexión permanente en territorios administrados por el Estado o sus instituciones con régimen jurídico especial:</div><div class="bullet">• En aquellos territorios del país con características especiales, como zona marítimo terrestre, zonas fronterizas, territorios indígenas, polos de desarrollo turístico, entre otros, que se otorgan mediante concesiones, arriendos y asignaciones, los solicitantes deberán presentar la autorización expresa del Ente correspondiente, según la norma que los regule.</div>
<div class="rtitle">d) Conexión permanente en inmuebles registrados en derechos:</div><div class="bullet">• La solicitud podrá realizarla el copropietario que requiera el servicio, sin que sea necesaria la autorización de los demás titulares de los derechos restantes.</div><div class="bullet">• Documento de identificación original y vigente del titular del inmueble o su representante legal para su verificación.</div><div class="bullet">• En caso de que para la propiedad no exista plano catastrado, o para efectos de segregación o fraccionamientos, debe presentar un plano de agrimensura que cumpla con lo estipulado en el Artículo N°2 inciso q) del Decreto Ejecutivo No. 34331, Reglamento de la Ley de Catastro Nacional vigente con su respectiva minuta de presentación y el correspondiente sello del CFIA conforme a lo dispuesto en el Reglamento Especial del Administrador de Proyectos de Topografía (APT) del CFIA vigente y sus reformas o las normativas que los sustituya.</div><div class="bullet">• Copia del permiso municipal de construcción vigente, o bien el Número de Proyecto tramitado ante la plataforma APC debidamente aprobado, con el fin de que AyA constate la existencia del requisito, en caso de que se trate de una edificación por desarrollar. El permiso deberá ser coincidente con el fin inicial para el que se gestionó y aprobó la disponibilidad. Igualmente podrá suscribir una declaración jurada que sustituya este requisito, sin embargo, AyA previo a la aprobación del trámite deberá de verificar ante la Municipalidad correspondiente la veracidad de lo consignado por el solicitante, información que deberá ser remitida mediante correo electrónico u otro medio virtual que agilice el trámite, dentro del plazo de hasta 4 días hábiles. En caso de que el Municipio desmienta lo declarado por el solicitante, se dejará sin efecto la gestión y se procederá con la denuncia penal correspondiente.</div><div class="bullet">• En el caso de solicitudes de nuevos servicios, para actividades que generen aguas residuales de tipo especiales, el interesado deberá presentar, una declaración jurada en la que indique que la descarga al alcantarillado sanitario, cumplirá con el reglamento y nota de aprobación del Ministerio de Salud, que describa el tipo de actividad a</div>
</div><div class="footer">El agua es vida ... ¡Cuidémosla!<span class="pageno">3</span></div></section>

<section class="page"><div class="simple"><div class="logo">${esc(ASADA_NOMBRE_LEGAL).toUpperCase()}</div><div class="title">Solicitud de conexión de servicio</div></div><div class="req"><div>desarrollar, así como la cantidad y calidad de la descarga a verter; asimismo la especificación del sistema de tratamiento para cumplir con la normativa ambiental vigente.</div>
<div class="rtitle">e) Conexión permanente por parte del poseedor de un inmueble sin inscribir:</div><div class="bullet">• Presentación del documento de identificación del titular del inmueble o representante legal.</div><div class="bullet">• El poseedor deberá suscribir la declaración jurada cuyo formulario será suplido por AyA, la cual será firmada por el solicitante y dos testigos con una descripción de la naturaleza del inmueble, señalando en qué consisten sus actos posesorios, la existencia de edificación, las mejoras realizadas y que la propiedad no se encuentra inscrita.</div><div class="bullet">• En caso de que para la propiedad no exista plano catastrado, o para efectos de segregación o fraccionamientos, debe presentar un plano de agrimensura que cumpla con lo estipulado en el Artículo N°2 inciso q) del Decreto Ejecutivo No. 34331, Reglamento de la Ley de Catastro Nacional vigente con su respectiva minuta de presentación y el correspondiente sello del CFIA conforme a lo dispuesto en el Reglamento Especial del Administrador de Proyectos de Topografía (APT) del CFIA vigente y sus reformas o las normativas que los sustituya.</div><div class="bullet">• Copia del permiso municipal de construcción vigente, o bien el Número de Proyecto tramitado ante la plataforma APC debidamente aprobado, con el fin de que AyA constate la existencia del requisito, en caso de que se trate de una edificación por desarrollar. El permiso deberá ser coincidente con el fin inicial para el que se gestionó y aprobó la disponibilidad. Igualmente podrá suscribir una declaración jurada que sustituya este requisito, sin embargo, AyA previo a la aprobación del trámite deberá de verificar ante la Municipalidad correspondiente la veracidad de lo consignado por el solicitante, información que deberá ser remitida mediante correo electrónico u otro medio virtual que agilice el trámite, dentro del plazo de hasta 4 días hábiles. En caso de que el Municipio desmienta lo declarado por el solicitante, se dejará sin efecto la gestión y se procederá con la denuncia penal correspondiente.</div>
<div class="rtitle">f) Conexión especial, para el caso de ocupantes de inmuebles que carezcan de un título habilitante para realizar la ocupación:</div><div class="bullet">• En caso de que exista una Asociación de Desarrollo Comunal u otra organización formal y reconocida jurídicamente que respalde la solicitud del asentamiento poblacional, será necesario que el representante legal de dicha persona jurídica sea quien realice las gestiones.</div><div class="bullet">• En caso de que se carezca de una persona jurídica debidamente formalizada, será necesario un contrato de mandato, donde la totalidad de beneficiarios del servicio deleguen en un representante la realización de las gestiones. De acuerdo con la verificación y subsanación de condiciones necesarias para la aprobación de servicios, AyA verificará a través de las plataformas virtuales oficiales y disponibles, las siguientes condiciones: Certificaciones registrales o administrativas de personerías jurídicas vigentes, apoderados con facultades de representantes judiciales y extrajudiciales o facultados al efecto, albaceas, tutores y curadores.</div><div class="bullet">• Presentar declaración jurada con un máximo de 30 días de emitida y firmada por el representante de la asociación comunal o el representante de los beneficiarios y dos testigos, con una descripción de la propiedad, señalando en qué consisten sus actos posesorios, la existencia, cantidad y ubicación de las viviendas en un croquis con la delimitación del área de cobertura.</div>
<div class="rtitle">g) Servicio temporal de agua para actividades no permanentes:</div><div class="bullet">•Presentar documento de identificación original y vigente del titular del inmueble o representante legal, para su verificación.</div><div class="bullet">• Autorización del propietario del inmueble, donde indique quien será el responsable de la actividad temporal.</div><div class="bullet">• Pago del consumo estimado aprobado.</div><div class="bullet">• El solicitante deberá indicar, mediante documento formal adjunto al formulario de solicitud, la forma en que va a disponer las aguas residuales que se generen por la conexión solicitada.</div></div><div class="footer">El agua es vida ... ¡Cuidémosla!<span class="pageno">4</span></div></section>

<section class="page"><div class="simple"><div class="logo">${esc(ASADA_NOMBRE_LEGAL).toUpperCase()}</div><div class="title">Solicitud de conexión de servicio</div></div><div class="req"><div class="rtitle">h) Conexión de saneamiento en inmuebles que cuentan con el servicio de agua:</div><div class="bullet">• Presentar documento de identificación original y vigente del titular del inmueble o representante legal, para su verificación.</div><div class="bullet">• En caso de que para la propiedad no exista plano catastrado, o para efectos de segregación o fraccionamientos, debe presentar un plano de agrimensura que cumpla con lo estipulado en el Artículo N°2 inciso q) del Decreto Ejecutivo No. 34331, Reglamento de la Ley de Catastro Nacional vigente con su respectiva minuta de presentación y el correspondiente sello del CFIA conforme a lo dispuesto en el Reglamento Especial del Administrador de Proyectos de Topografía (APT) del CFIA vigente y sus reformas o las normativas que los sustituya.</div><div class="rtitle">i) Independización de la conexión en condominios:</div><div class="bullet">• La Administración del Condominio o la persona legalmente facultada para dicho proceder, será la responsable de presentar la solicitud escrita para independización parcial o total según corresponda.</div><div class="bullet">• Copia certificada de Acta de Asamblea de Condóminos en la que se aprobó la modificación y un diseño de sitio donde se indiquen los puntos de abastecimiento que requerirán la instalación de los hidrómetros.</div><div class="bullet">• Los interesados deberán proceder con la constitución e inscripción de servidumbres de paso y tuberías de agua potable y/o alcantarillado sanitario a favor de AyA para el otorgamiento de los servicios.</div><div class="bullet">• Para el caso de independización parcial, deberá solicitar las conexiones permanentes únicamente para aquellas fincas filiales que AyA autorizó.</div><div class="bullet">• De las condiciones a verificar por parte del AyA para la independización de servicios en condominios.</div><div class="bullet">- La resolución administrativa de aprobación de planos constructivos en la plataforma APC del CFIA.</div><div class="bullet">- La resolución administrativa positiva de verificación de la Documentación y Resolución de Revisión de Proyectos emitido por el Departamento de Urbanizaciones del AyA.</div><div class="bullet">- La resolución administrativa de Recepción de Obras emitida por AyA.</div><div class="rtitle">j) Traslado de acometida y cambio de diámetro:</div><div class="bullet">• Documento de identificación original y vigente del titular del inmueble o su representante legal para su verificación.</div><div class="bullet">• En caso de que para la propiedad no exista plano catastrado, o para efectos de segregación o fraccionamientos, debe presentar un plano de agrimensura que cumpla con lo estipulado en el Artículo N°2 inciso q) del Decreto Ejecutivo No. 34331, Reglamento de la Ley de Catastro Nacional vigente con su respectiva minuta de presentación y el correspondiente sello del CFIA conforme a lo dispuesto en el Reglamento Especial del Administrador de Proyectos de Topografía (APT) del CFIA vigente y sus reformas o las normativas que los sustituya.</div><div class="bullet">• En el caso de variación de diámetro, adicionalmente el solicitante deberá presentar una memoria de cálculo que justifique su solicitud.</div>
<div class="vtitle"><span class="roman">VIII.</span>Otras consideraciones y plazo de ejecución</div><div>Conforme a lo establecido en el artículo 6 de la Ley 8220, Publicada en La Gaceta No. 49 de 11 de marzo de 2002, en caso de no cumplir con la presentación de la totalidad de los requisitos, se otorgará un plazo de 10 días hábiles para que los aporte. Transcurrido el plazo sin que se atienda el requerimiento, el trámite quedará denegado y en caso de requerir el servicio deberá realizar una nueva solicitud.</div><br><div>Cumplida la presentación de la totalidad de requisitos; la Institución contará con un plazo de hasta 15 días hábiles para la resolución del trámite.</div></div><div class="footer">El agua es vida ... ¡Cuidémosla!<span class="pageno">4</span></div></section>

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

async function cargarImagenComoDataUrl(url: string): Promise<string | null> {
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

export async function generarPdfConexion(solicitud: SolicitudConexion): Promise<Blob> {
  const contenedor = document.createElement('div')
  contenedor.style.position = 'fixed'
  contenedor.style.left = '-99999px'
  contenedor.style.top = '0'
  contenedor.innerHTML = buildHtml(solicitud)
  document.body.appendChild(contenedor)

  try {
    // Incrustar la firma como imagen dentro de su recuadro.
    if (solicitud.firma_path) {
      const dataUrl = await cargarImagenComoDataUrl(solicitud.firma_path)
      const caja = contenedor.querySelector<HTMLElement>('[data-firma-box]')
      if (dataUrl && caja) {
        const img = document.createElement('img')
        img.src = dataUrl
        img.style.maxWidth = '100%'
        img.style.maxHeight = '100%'
        img.style.objectFit = 'contain'
        caja.appendChild(img)
      }
    }

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

export function descargarPdfConexion(blob: Blob, codigoSolicitud: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${codigoSolicitud}.pdf`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
