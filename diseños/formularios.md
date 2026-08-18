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
