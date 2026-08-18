# Tarjetas (cards) y secciones

## Tarjetas

Todas las cards del landing (noticias, valores, servicios) siguen el mismo patrón: esquinas redondeadas, borde suave, sombra chica, y se "levantan" un poco al pasar el mouse si son clickeables o interactivas.

```jsx
<div className="rounded-2xl border border-primary-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary-300 hover:shadow-lg">
  ...
</div>
```

- `rounded-2xl` (más redondeado que los inputs, que usan `rounded-lg`).
- Borde `primary-200` en reposo → `primary-300` en hover.
- Sombra `shadow-sm` en reposo → `shadow-lg` en hover, con la misma transición de elevación que los botones (`hover:-translate-y-1 transition-all duration-300`).

Variante para cards de fondo de color (como las estadísticas de "Conócenos" o las cajas de Misión/Visión), sin borde, con fondo de color y esquinas igual de redondeadas:

```jsx
<div className="rounded-2xl bg-primary-50 px-4 py-3 shadow-sm">...</div>
<div className="rounded-2xl bg-primary-900 px-10 py-16 text-white shadow-sm">...</div>
```

## Secciones (estructura general de cada bloque del landing)

Cada sección (`<section>`) del landing sigue este esqueleto:

```jsx
<section id="servicios" className="scroll-mt-20 bg-primary-50 px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
  <div className="mx-auto max-w-5xl text-center">
    {/* eyebrow + título + descripción, ver tipografia.md */}
  </div>
  {/* contenido de la sección */}
</section>
```

- `scroll-mt-20` en **todas** las secciones que tienen un `id` (para que el navbar fijo no tape el título al hacer scroll hasta ahí con un ancla `#servicios`).
- Padding vertical: `py-10` a `py-20` según cuánto "aire" necesite la sección — no hay un número fijo único, pero la idea es que ninguna sección quede pegada a la siguiente ni tan separada que parezca una página aparte. Si una sección tiene poco contenido, no le fuerces `min-h-screen`, dejala del alto que le corresponda a su contenido.
- Ancho máximo del contenido: `max-w-5xl` para la mayoría de secciones, `max-w-2xl` para formularios y para la card de Servicios (más angosta porque es una sola acción central).
- Fondo: alterná entre `bg-white` y `bg-primary-50` entre secciones consecutivas para que se note dónde empieza cada una sin necesitar una línea divisoria.

### Secciones que ocupan toda la pantalla

Solo "Sobre nosotros" y "Ubicación" están pensadas para llenar el alto de una pantalla completa (tienen suficiente contenido para justificarlo):

```jsx
<section className="flex min-h-screen scroll-mt-20 flex-col justify-center ...">
```

**No le pongas `min-h-screen` a una sección con poco contenido** (como pasó con Servicios y Noticias) — genera un espacio vacío enorme arriba y abajo. Esas dos usan el patrón normal de padding, sin forzar el alto de pantalla.

## Divisores entre secciones

No hay una línea o borde divisorio explícito entre secciones — la separación se logra solo alternando el color de fondo (`bg-white` / `bg-primary-50`) y el padding vertical de cada sección.
