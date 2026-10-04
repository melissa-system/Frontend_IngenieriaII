import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { ordenar, paginar, siguienteOrden, ventanaPaginas } from '../src/lib/tabla.ts'

describe('tabla: ordenamiento', () => {
  const datos = [
    { n: 'Zeta', v: 2 },
    { n: 'álvaro', v: 10 },
    { n: 'Beto', v: 1 },
    { n: null as string | null, v: 5 },
  ]
  const valores = { n: (d: (typeof datos)[0]) => d.n, v: (d: (typeof datos)[0]) => d.v }

  it('ordena texto ignorando tildes y mayúsculas, con vacíos al final', () => {
    assert.deepEqual(ordenar(datos, { clave: 'n', direccion: 'asc' }, valores).map((d) => d.n), ['álvaro', 'Beto', 'Zeta', null])
    assert.deepEqual(ordenar(datos, { clave: 'n', direccion: 'desc' }, valores).map((d) => d.n), ['Zeta', 'Beto', 'álvaro', null])
  })
  it('ordena números como números (10 después de 2)', () => {
    assert.deepEqual(ordenar(datos, { clave: 'v', direccion: 'asc' }, valores).map((d) => d.v), [1, 2, 5, 10])
  })
  it('no muta el arreglo original y sin orden lo devuelve igual', () => {
    const copia = [...datos]
    ordenar(datos, { clave: 'v', direccion: 'desc' }, valores)
    assert.deepEqual(datos, copia)
    assert.equal(ordenar(datos, null, valores), datos)
  })
  it('alterna asc → desc → sin orden', () => {
    const a = siguienteOrden(null, 'x')
    assert.deepEqual(a, { clave: 'x', direccion: 'asc' })
    const b = siguienteOrden(a, 'x')
    assert.deepEqual(b, { clave: 'x', direccion: 'desc' })
    assert.equal(siguienteOrden(b, 'x'), null)
    assert.deepEqual(siguienteOrden(b, 'y'), { clave: 'y', direccion: 'asc' })
  })
})

describe('tabla: paginación', () => {
  const items = Array.from({ length: 23 }, (_, i) => i + 1)
  it('recorta la página y calcula el rango mostrado', () => {
    const p = paginar(items, 2, 10)
    assert.deepEqual(p.filas, [11, 12, 13, 14, 15, 16, 17, 18, 19, 20])
    assert.equal(p.totalPaginas, 3)
    assert.equal(p.desde, 11)
    assert.equal(p.hasta, 20)
  })
  it('ajusta una página fuera de rango y maneja listas vacías', () => {
    assert.equal(paginar(items, 99, 10).pagina, 3)
    assert.equal(paginar(items, 0, 10).pagina, 1)
    const vacia = paginar([], 1, 10)
    assert.equal(vacia.totalPaginas, 1)
    assert.equal(vacia.desde, 0)
  })
  it('ventana de páginas con puntos suspensivos', () => {
    assert.deepEqual(ventanaPaginas(1, 3), [1, 2, 3])
    assert.deepEqual(ventanaPaginas(5, 10), [1, null, 4, 5, 6, null, 10])
    assert.deepEqual(ventanaPaginas(1, 10), [1, 2, null, 10])
  })
})
