export interface NewsItem {
  id: string
  titulo: string
  fecha: string
  categoria: string
  resumen: string
}

// Datos de ejemplo. Cuando exista el dashboard administrativo,
// esto se reemplaza por una llamada a la API real.
export const NEWS: NewsItem[] = [
  {
    id: '1',
    titulo: 'Suspensión temporal del servicio por reparaciones',
    fecha: '10 de julio, 2026',
    categoria: 'Aviso',
    resumen:
      'El próximo jueves suspenderemos el servicio de 8:00 a.m. a 2:00 p.m. en el sector alto de Pueblo Nuevo para reparar una fuga en la línea principal.',
  },
  {
    id: '2',
    titulo: 'Mantenimiento programado en el tanque de captación',
    fecha: '2 de julio, 2026',
    categoria: 'Mantenimiento',
    resumen:
      'Realizaremos limpieza y mantenimiento preventivo en el tanque de captación. El servicio podría presentar baja presión durante ese día.',
  },
  {
    id: '3',
    titulo: 'Nueva tarifa aprobada para el período 2026',
    fecha: '15 de junio, 2026',
    categoria: 'Comunicado',
    resumen:
      'La Asamblea de ASADA Pueblo Nuevo aprobó los ajustes en la tarifa del servicio, vigentes a partir del próximo trimestre.',
  },
  {
    id: '4',
    titulo: 'Jornada de limpieza de quebradas',
    fecha: '20 de febrero, 2026',
    categoria: 'Comunicado',
    resumen:
      'Invitamos a la comunidad a participar en la jornada de limpieza de las quebradas cercanas. La actividad se realizará el sábado 22 de febrero a las 7:00 a.m.',
  },
  {
    id: '5',
    titulo: 'Campaña de pago al día 2026',
    fecha: '10 de enero, 2026',
    categoria: 'Aviso',
    resumen:
      'Recuerda mantener tu recibo al día. Aprovecha nuestros puntos de cobro autorizados y evita recargos por morosidad.',
  },
]
