# Botones

Hay tres variantes en el landing. Elegí según el contexto, no mezcles estilos nuevos.

## 1. Botón principal (relleno azul)

El botón de acción principal de cada sección/formulario ("Hacer la solicitud", "Enviar reporte", "Volver al inicio").

```jsx
<button className="rounded-full bg-primary-700 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:bg-primary-800 hover:shadow-lg">
  Hacer la solicitud de paja de agua
</button>
```

- Siempre `rounded-full` (píldora, nunca cuadrado).
- `bg-primary-700` → `hover:bg-primary-800`.
- El "levantamiento" al pasar el mouse (`hover:-translate-y-1` + `hover:shadow-lg` + `transition-all duration-300`) es parte del estilo, no un extra — dale ese efecto a cualquier botón principal nuevo.
- Cuando el botón va sobre un fondo simple (no necesita destacar tanto, como "Volver al inicio" en la pantalla de confirmación) se puede simplificar sin el hover de elevación:
  ```jsx
  <button className="rounded-full bg-primary-700 px-6 py-3 text-sm font-semibold text-white hover:bg-primary-800">
    Volver al inicio
  </button>
  ```

## 2. Botón de contorno (outline)

Para acciones secundarias: "Ver más información", "Ver más servicios", o el segundo botón del Hero ("Reportar avería") que va sobre la foto.

Sobre fondo claro (blanco / gris claro):

```jsx
<button className="rounded-full border border-primary-300 px-6 py-2.5 text-sm font-semibold text-primary-700 shadow-sm transition-colors hover:border-primary-700 hover:bg-primary-700 hover:text-white">
  Ver más servicios
</button>
```

Sobre fondo oscuro / foto (como el Hero):

```jsx
<button className="rounded-full border border-white px-6 py-3 text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-1 hover:bg-white hover:text-primary-700 hover:shadow-lg">
  Reportar avería
</button>
```

- El relleno al hacer hover es blanco sólido y el texto se invierte a `primary-700`. No dejes el botón "delineado nomás" al pasar el mouse, tiene que rellenarse.

## 3. Botón de texto / enlace (sin fondo)

Para acciones menores dentro de un flujo, como "Volver al inicio" arriba de un formulario o "Continuar de todas formas" cuando falla una búsqueda de cédula:

```jsx
<a className="text-sm font-medium text-primary-700 hover:underline">
  ← Volver al inicio
</a>
```

## Reglas generales

- El radio de los botones **siempre** es `rounded-full` en el landing (no `rounded-lg` ni `rounded-md`). Eso solo se usa en el dashboard para botones secundarios tipo "Cancelar" dentro de modales — no lo traigas al landing.
- Tamaño de texto: `text-sm font-semibold` para casi todos. Los enlaces de texto plano usan `font-medium`.
- Padding estándar: `px-6 py-3` para botones grandes, `px-6 py-2.5` para los de contorno un poco más chicos.
- Cuando un botón puede quedar deshabilitado (ej. mientras se envía un formulario), agregá `disabled:opacity-60` (o `50`).
