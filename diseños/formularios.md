# Formularios

Los dos formularios del landing (Solicitud de paja de agua y Reportar avería) siguen exactamente el mismo patrón visual. Si agregan un formulario nuevo, cópienlo de acá.

## Label

Siempre arriba del campo, nunca al lado:

```jsx
<label htmlFor="telefono" className="block text-sm font-medium text-primary-900">
  Teléfono
</label>
```

## Input de texto / email / tel / password

```jsx
<input
  id="telefono"
  type="tel"
  required
  className="mt-1 w-full rounded-lg border border-primary-200 px-4 py-2.5 text-primary-900 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
/>
```

- `rounded-lg` (no `rounded-full` — eso es solo para botones).
- Borde `primary-200` en reposo, `primary-500` al enfocar, con un anillo de foco del mismo color (`focus:ring-1 focus:ring-primary-500`).
- Si el campo está deshabilitado (por ejemplo, la cédula mientras ya se buscó): agregar `disabled:bg-primary-50`.

## Select

Mismas clases que el input de texto:

```jsx
<select className="mt-1 w-full rounded-lg border border-primary-200 px-4 py-2.5 text-primary-900 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none">
  <option value="" disabled>Selecciona una opción</option>
  <option value="fisica">Persona física</option>
</select>
```

La primera opción siempre es un placeholder deshabilitado ("Selecciona una opción"), nunca dejar el select con una opción real seleccionada por defecto si el usuario todavía no eligió nada.

## Textarea

Igual que el input, con `rows` según el contenido esperado:

```jsx
<textarea rows={4} className="mt-1 w-full rounded-lg border border-primary-200 px-4 py-2.5 text-primary-900 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none" />
```

## Input de archivo

Este es distinto — el botón de "elegir archivo" se estiliza con el prefijo `file:`:

```jsx
<input
  type="file"
  accept="image/*,.pdf"
  className="mt-1 w-full text-sm text-primary-700 file:mr-4 file:rounded-full file:border-0 file:bg-primary-100 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-primary-700 hover:file:bg-primary-200"
/>
```

## Checkbox

```jsx
<label className="mt-3 flex items-center gap-2 text-sm text-primary-700">
  <input
    type="checkbox"
    className="h-4 w-4 rounded border-primary-300 text-primary-700 focus:ring-primary-500"
  />
  No agregar foto
</label>
```

## Mensajes de error / ayuda

- Error de validación: `text-xs text-red-600` justo debajo del campo.
- Ayuda o texto secundario (ej. "Podés enviar el reporte sin evidencia fotográfica"): `text-xs text-primary-500`.

## Estructura de un formulario paso a paso

Los dos formularios del landing usan un patrón de "pasos" (primero elegís tipo de identificación, después aparecen los campos según lo que elegiste). El contenedor general:

```jsx
<div className="mt-10 space-y-8">
  {/* Paso 1 */}
  <div>...</div>

  {/* Paso 2, solo aparece si el paso 1 ya se completó */}
  {condicion && (
    <div className="space-y-4">...</div>
  )}
</div>
```

- `space-y-8` entre pasos grandes, `space-y-4` o `space-y-6` entre campos dentro de un mismo paso.
- Los campos que van en pareja (ej. teléfono + correo) se acomodan en grid de 2 columnas en pantallas grandes:
  ```jsx
  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
    <div>...</div>
    <div>...</div>
  </div>
  ```

## Botones de un modal (Guardar / Cancelar)

Regla estándar para **todos** los modales del dashboard que tienen una acción principal (crear, guardar cambios, confirmar) y una de cancelar: el botón primario va **primero** (a la izquierda del par) y "Cancelar" va **segundo** (a la derecha). El contenedor sigue alineado a la derecha con `justify-end`, así que el orden en el JSX es lo que determina cuál queda primero:

```jsx
<div className="flex justify-end gap-3 pt-2">
  <button
    type="submit"
    className="rounded-lg bg-primary-700 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-800 disabled:opacity-60"
  >
    Guardar cambios
  </button>
  <button
    type="button"
    onClick={cerrarModal}
    className="rounded-lg border border-primary-200 px-4 py-2 text-sm font-medium text-primary-700 hover:bg-primary-50"
  >
    Cancelar
  </button>
</div>
```

- El botón primario usa `bg-primary-700` (relleno azul, texto blanco). Su texto puede ser específico según la acción ("Crear abonado", "Guardar cambios", "Agregar item"), no hace falta que diga literalmente "Guardar cambios" siempre.
- "Cancelar" siempre usa el estilo de botón secundario (borde `primary-200`, fondo blanco, texto `primary-700`).
- Aplica a todos los modales del dashboard: Abonados, Inventario (items y proveedores), Averías (asignar/confirmar), Administrativo (publicaciones), y cualquier modal nuevo que se agregue.

## Encabezado de una lista en el dashboard (filtros vs. botón de crear)

Regla estándar para todas las páginas del dashboard que muestran una tabla/lista: el título y su descripción van arriba; debajo, en su propia fila, van los controles de búsqueda/filtro/orden **alineados a la izquierda**. El botón para crear algo nuevo ("+ Nuevo abonado", "+ Agregar item") va **a la derecha, en la misma fila que el título** — nunca junto a los filtros.

```jsx
<div className="space-y-6">
  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
    <div>
      <h1 className="text-2xl font-semibold text-primary-900">Título</h1>
      <p className="mt-1 text-sm text-primary-500">Descripción / conteo</p>
    </div>
    {/* Solo si esta página permite crear algo */}
    <button className="self-start rounded-full bg-primary-700 px-5 py-2 text-sm font-semibold text-white hover:bg-primary-800">
      + Nuevo elemento
    </button>
  </div>

  {/* Buscar/filtrar/ordenar: fila propia, alineada a la izquierda */}
  <div className="flex flex-wrap items-center gap-2">
    <input placeholder="Buscar..." className="w-full rounded-lg border border-primary-200 px-4 py-2.5 text-sm sm:w-96" />
    <select className="rounded-lg border border-primary-200 px-3 py-2 text-sm text-primary-700">...</select>
  </div>
</div>
```

Si la página no tiene botón de crear (por ejemplo Solicitudes, que solo se generan desde el sitio público), el título va solo en su fila y los filtros igual quedan en la fila de abajo, a la izquierda — nunca junto al título.

### Botón de orden + select de filtro, misma fila

Cuando una lista tiene tanto un botón para cambiar el orden (ej. "↑ Más antiguas / ↓ Más recientes") como un `<select>` de filtro por estado, ambos van en la misma fila de controles, con **la misma altura fija** (`h-10`) para que no se vean descuadrados entre sí. El botón de orden usa el estilo de botón primario (fondo azul), el select mantiene el borde normal:

```jsx
<div className="flex flex-wrap items-center gap-2">
  <button
    type="button"
    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
    className="flex h-10 items-center gap-1 rounded-lg bg-primary-700 px-4 text-sm font-medium text-white hover:bg-primary-800"
  >
    {sortOrder === 'asc' ? '↑ Más antiguas' : '↓ Más recientes'}
  </button>

  <select className="h-10 rounded-lg border border-primary-200 px-3 text-sm text-primary-700 focus:border-primary-500 focus:outline-none">
    ...
  </select>
</div>
```

Aplica a todas las listas del dashboard que combinen orden + filtro (Solicitudes, Averías, y cualquiera nueva con el mismo patrón).

## Pantalla de confirmación (después de enviar)

```jsx
<div className="mt-10 rounded-2xl bg-primary-50 p-8 text-center">
  <h2 className="text-xl font-semibold text-primary-900">¡Solicitud enviada!</h2>
  <p className="mt-3 text-primary-700">Gracias, {nombre}. ...</p>
  <Link className="mt-6 inline-block rounded-full bg-primary-700 px-6 py-3 text-sm font-semibold text-white hover:bg-primary-800">
    Volver al inicio
  </Link>
</div>
```
