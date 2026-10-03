// Pruebas de exportación de los reportes estadísticos (PBI 341 / Task 345).
// Usan el runner nativo de Node (node --test), que ejecuta TypeScript sin
// dependencias extra: `npm test`.
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  construirCsvReporte,
  motivoNoExportable,
  nombreArchivoReporte,
  puedeVerReportes,
  validarRangoFechas,
  type ReporteExportable,
} from '../src/lib/exportacionReportes.ts'

const META = {
  rangoLabel: 'Personalizado: 2026-01-01 a 2026-03-31',
  filtrosResumen: 'Tipo: Todos · Estado: Todos',
  fechaGeneracion: '02/10/2026 19:00',
}

// Mismos datos que la pantalla arma con buildReport() para cada módulo.
const REPORTES: Record<string, ReporteExportable> = {
  Abonados: {
    total: 2,
    barLabel: 'Abonados por tipo',
    barData: [
      { name: 'Física', cantidad: 1 },
      { name: 'Jurídica', cantidad: 1 },
    ],
    pieLabel: 'Abonados por estado',
    pieData: [{ name: 'Activo', cantidad: 2 }],
    evolucionMensual: [
      { mes: 'Ene 26', cantidad: 1 },
      { mes: 'Mar 26', cantidad: 1 },
    ],
    columns: [
      { key: 'cedula', label: 'Cédula' },
      { key: 'nombre', label: 'Nombre' },
      { key: 'tipo', label: 'Tipo' },
      { key: 'estado', label: 'Estado' },
      { key: 'fechaRegistro', label: 'Registro' },
    ],
    rows: [
      { cedula: '101110222', nombre: 'Juan Pérez Mora', tipo: 'Física', estado: 'Activo', fechaRegistro: '2026-01-15' },
      { cedula: '3101111111', nombre: 'ASADA Pueblo Nuevo, S.A.', tipo: 'Jurídica', estado: 'Activo', fechaRegistro: '2026-03-02' },
    ],
  },
  Solicitudes: {
    total: 2,
    barLabel: 'Solicitudes por tipo',
    barData: [
      { name: 'Paja de agua', cantidad: 1 },
      { name: 'Cambio de medidor', cantidad: 1 },
    ],
    pieLabel: 'Solicitudes por estado',
    pieData: [
      { name: 'Aprobada', cantidad: 1 },
      { name: 'Pendiente', cantidad: 1 },
    ],
    evolucionMensual: [{ mes: 'Feb 26', cantidad: 2 }],
    columns: [
      { key: 'codigo', label: 'Código' },
      { key: 'tipo', label: 'Tipo' },
      { key: 'solicitante', label: 'Solicitante' },
      { key: 'estado', label: 'Estado' },
      { key: 'fecha', label: 'Fecha' },
    ],
    rows: [
      { codigo: 'SOL-PA-001', tipo: 'Paja de agua', solicitante: 'Ana Rojas', estado: 'Aprobada', fecha: '2026-02-10' },
      { codigo: 'SOL-GEN-002', tipo: 'Cambio de medidor', solicitante: 'Luis "Lucho" Mora', estado: 'Pendiente', fecha: '2026-02-20' },
    ],
  },
  Averías: {
    total: 2,
    barLabel: 'Averías por tipo',
    barData: [
      { name: 'Fuga de agua', cantidad: 1 },
      { name: 'Falta de presión / sin agua', cantidad: 1 },
    ],
    pieLabel: 'Averías por estado',
    pieData: [
      { name: 'Pendiente', cantidad: 1 },
      { name: 'Finalizado', cantidad: 1 },
    ],
    evolucionMensual: [{ mes: 'Ene 26', cantidad: 2 }],
    columns: [
      { key: 'codigo', label: 'Código' },
      { key: 'tipo', label: 'Tipo' },
      { key: 'reportadoPor', label: 'Reportado por' },
      { key: 'estado', label: 'Estado' },
      { key: 'fecha', label: 'Fecha' },
    ],
    rows: [
      { codigo: 'AVE-2026-1001', tipo: 'Fuga de agua', reportadoPor: 'Juan Pérez', estado: 'Pendiente', fecha: '2026-01-15' },
      { codigo: 'AVE-2026-1002', tipo: 'Falta de presión / sin agua', reportadoPor: 'Ana Rojas', estado: 'Finalizado', fecha: '2026-01-20' },
    ],
  },
}

// Interpreta el CSV generado (comillas dobles escapadas incluidas).
function leerCsv(csv: string): string[][] {
  return csv
    .replace(/^﻿/, '')
    .split('\r\n')
    .map((linea) => {
      const celdas: string[] = []
      let actual = ''
      let entreComillas = false
      for (let i = 0; i < linea.length; i++) {
        const c = linea[i]
        if (entreComillas) {
          if (c === '"' && linea[i + 1] === '"') {
            actual += '"'
            i++
          } else if (c === '"') entreComillas = false
          else actual += c
        } else if (c === '"') entreComillas = true
        else if (c === ',') {
          celdas.push(actual)
          actual = ''
        } else actual += c
      }
      celdas.push(actual)
      return celdas
    })
}

for (const [modulo, reporte] of Object.entries(REPORTES)) {
  describe(`Exportación del reporte de ${modulo}`, () => {
    const csv = construirCsvReporte(reporte, { modulo, ...META })
    const filas = leerCsv(csv)

    it('incluye el mismo período y filtros aplicados en pantalla', () => {
      assert.equal(filas[0][0], `Reporte estadístico de ${modulo}`)
      const encabezado = filas[1].join(',')
      assert.match(encabezado, new RegExp(`Rango: ${META.rangoLabel}`))
      assert.match(encabezado, new RegExp(`Filtros: ${META.filtrosResumen}`))
      assert.match(encabezado, new RegExp(`Total de registros: ${reporte.total}`))
    })

    it('las agrupaciones coinciden con los gráficos mostrados', () => {
      const inicioBar = filas.findIndex((f) => f[0] === reporte.barLabel)
      const bar = filas.slice(inicioBar + 2, inicioBar + 2 + reporte.barData.length)
      assert.deepEqual(
        bar.map(([name, cantidad]) => ({ name, cantidad: Number(cantidad) })),
        reporte.barData,
      )
      const inicioPie = filas.findIndex((f) => f[0] === reporte.pieLabel)
      const pie = filas.slice(inicioPie + 2, inicioPie + 2 + reporte.pieData.length)
      assert.deepEqual(
        pie.map(([name, cantidad]) => ({ name, cantidad: Number(cantidad) })),
        reporte.pieData,
      )
    })

    it('el detalle coincide fila por fila con la tabla de la pantalla', () => {
      const inicio = filas.findIndex((f) => f[0] === 'Detalle de registros')
      assert.deepEqual(filas[inicio + 1], reporte.columns.map((c) => c.label))
      const detalle = filas.slice(inicio + 2)
      assert.equal(detalle.length, reporte.total)
      assert.deepEqual(
        detalle,
        reporte.rows.map((fila) => reporte.columns.map((c) => fila[c.key])),
      )
    })

    it('el archivo lleva el módulo y el período en el nombre', () => {
      assert.match(
        nombreArchivoReporte(modulo, { desde: '2026-01-01', hasta: '2026-03-31' }, 'pdf'),
        /^reporte-[a-z]+-2026-01-01_a_2026-03-31\.pdf$/,
      )
      assert.match(nombreArchivoReporte(modulo, null, 'csv'), /^reporte-[a-z]+-historico\.csv$/)
    })
  })
}

describe('Validaciones antes de exportar', () => {
  it('rechaza un rango personalizado incompleto, inválido o invertido', () => {
    assert.ok(validarRangoFechas('personalizado', '', '2026-01-31'))
    assert.ok(validarRangoFechas('personalizado', '2026-02-30', '2026-03-01'))
    assert.equal(
      validarRangoFechas('personalizado', '2026-03-01', '2026-01-01'),
      'La fecha de inicio no puede ser posterior a la fecha de fin.',
    )
  })

  it('acepta un rango personalizado válido y los rangos predefinidos', () => {
    assert.equal(validarRangoFechas('personalizado', '2026-01-01', '2026-01-01'), null)
    for (const rango of ['historico', 'mensual', 'trimestral', 'anual']) {
      assert.equal(validarRangoFechas(rango, '', ''), null)
    }
  })

  it('no permite exportar sin información disponible', () => {
    const base = { total: 5, cargando: false, errorRango: null, errorCarga: null }
    assert.equal(motivoNoExportable(base), null)
    assert.ok(motivoNoExportable({ ...base, total: 0 }))
    assert.ok(motivoNoExportable({ ...base, cargando: true }))
    assert.ok(motivoNoExportable({ ...base, errorCarga: 'Error 500' }))
    assert.ok(motivoNoExportable({ ...base, errorRango: 'Rango inválido' }))
  })
})

describe('Restricción al perfil administrativo', () => {
  it('muestra los reportes y la exportación al Administrador y a la Junta Directiva', () => {
    assert.equal(puedeVerReportes('Administrador'), true)
    assert.equal(puedeVerReportes('Junta Directiva'), true)
  })

  it('oculta los reportes y la exportación a perfiles no administrativos', () => {
    for (const rol of ['Fontanero', 'Abonado', '', null, undefined]) {
      assert.equal(puedeVerReportes(rol), false)
    }
  })
})
