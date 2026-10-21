// Textos fijos del machote GNU-41-01-F1 (requisitos y consideraciones).
// `nombre` es el nombre legal de la ASADA en mayúsculas.

export type Bloque = { tipo: 'titulo' | 'vineta' | 'vineta2' | 'parrafo' | 'seccion'; texto: string }

export function requisitosPajaAgua(nombre: string): string[] {
  return [
    `Formulario presentado y firmado por el propietario registral, poseedor o representante legal ante las Plataformas de Servicios de ${nombre} o plataforma digital de ${nombre}. En caso de que no sea el propietario el que gestiona la solicitud, debe presentar un poder especial o autorización o aval debidamente autentificada que lo acredite para realizar la gestión.`,
    `Presentación de documento de identificación del propietario del inmueble o su representante legal. ${nombre} eximirá al solicitante de la presentación de este requisito al contar con la factibilidad tecnológica para su verificación.`,
  ]
}

export function consideracionesPajaAgua(nombre: string): Bloque[] {
  return [
    { tipo: 'parrafo', texto: `Según la naturaleza del inmueble o tipo de solicitud deberá cumplir con los siguientes requisitos:` },
    { tipo: 'titulo', texto: `a) Inmuebles registrados en derechos, fraccionamientos o urbanizaciones:` },
    { tipo: 'vineta', texto: `Para el caso de inmuebles registrados en derechos la solicitud podrá realizarla el copropietario que pretenda acceder al servicio, sin que sea necesaria la autorización, ni presentación de documentos de identificación de los demás titulares de los derechos restantes y presentación de plano catastrado.` },
    { tipo: 'vineta', texto: `En caso de que la propiedad no cuente con plano catastrado, deberá presentar un plano de agrimensura que cumpla con lo estipulado en el Artículo 2 inciso q) del Reglamento de la Ley de Catastro Nacional vigente y el correspondiente sello del CFIA conforme a lo dispuesto en el Reglamento Especial del Administrador de Proyectos de Topografía (APT) del CFIA vigente y sus reformas o las normativas que los sustituya.` },
    { tipo: 'vineta', texto: `Cuando la solicitud refiera a proyectos de urbanización o fraccionamiento tipificados en el Reglamento de Fraccionamiento y Urbanizaciones del INVU el solicitante deberá indicar expresamente el número de servicios solicitados y la tipología de proyecto para el cual se gestiona la constancia de disponibilidad de servicios. En el caso de estar la propiedad en derechos el solicitante deberá aportar el plano catastrado o el plano de agrimensura que describa la localización del derecho` },
    { tipo: 'titulo', texto: `b) Inmuebles sin inscribir:` },
    { tipo: 'vineta', texto: `El poseedor deberá suscribir ante el plataformista, la declaración jurada cuyo formulario será suplido por ${nombre}, la cual será firmada por el solicitante y dos testigos con una descripción de la naturaleza del inmueble, señalando en qué consisten sus actos posesorios, la existencia de edificación, las mejoras realizadas y que la propiedad no se encuentra inscrita.` },
    { tipo: 'titulo', texto: `c) Territorios administrados por el Estado o sus instituciones con régimen jurídico especial:` },
    { tipo: 'vineta', texto: `Para el caso de solicitudes asociadas a inmuebles bajo la modalidad de territorios administrados por el Estado o sus instituciones con régimen jurídico especial: zona marítimo terrestre, zonas fronterizas, territorios indígenas, polos de desarrollo turístico, entre otros; que se otorgan mediante concesiones, arriendos y asignaciones; los solicitantes deberán presentar la autorización expresa del ente correspondiente, en la cual se avale la solicitud del trámite, de conformidad con la norma que los regule.` },
    { tipo: 'vineta', texto: `Para el caso de territorios indígenas, cuando la ADII esté inactiva, el solicitante deberá rendir mediante declaración jurada en qué consisten sus actos posesorios, y que su permanencia ha sido en forma pacífica, continúa e ininterrumpida por más de un año; igualmente deberá declarar su condición de miembro de la comunidad indígena que corresponda, lo cual deberá ser avalado por dos habitantes de la comunidad que respalde su situación y condición. Este requisito también será validado para la solicitud de la conexión permanente.` },
    { tipo: 'titulo', texto: `d) Condiciones especiales o restricciones para estaciones de combustibles:` },
    { tipo: 'vineta', texto: `El administrado deberá presentar la siguiente información en referencia al proyecto:` },
    { tipo: 'vineta2', texto: `- Plano Catastrado` },
    { tipo: 'vineta2', texto: `- Nota firmada y poder de los representantes legales` },
    { tipo: 'vineta2', texto: `- Lugar y medios de notificación.` },
    { tipo: 'vineta2', texto: `- Diseño del sitio de las estructuras y con las coordenadas respectivas de ubicación.` },
    { tipo: 'vineta2', texto: `- Descripción detalla de tipo de combustible y cantidad.` },
    { tipo: 'vineta2', texto: `- Criterio de SENARA en los casos que se requiera por cercanía de pozos de ${nombre} o zonas estratégicas para abastecimiento, de conformidad con el Decreto Ejecutivo 42015-MP-MAG-MINAE-S-MIVAH y sus reformas` },
    { tipo: 'seccion', texto: `VIII.| Otras consideraciones y plazo de ejecución` },
    { tipo: 'parrafo', texto: `Conforme a lo establecido en el artículo 6 de la Ley 8220, Publicada en La Gaceta No. 49 de 11 de marzo de 2002, en caso de no cumplir con la presentación de la totalidad de los requisitos, se otorgará un plazo de 10 días hábiles para que los aporte. Transcurrido el plazo sin que se atienda el requerimiento, el trámite quedará denegado y en caso de requerir el servicio deberá realizar una nueva solicitud.` },
    { tipo: 'parrafo', texto: `Cumplida la presentación de la totalidad de requisitos; la Institución contará con un plazo de hasta 15 días hábiles para la resolución del trámite.` },
  ]
}
