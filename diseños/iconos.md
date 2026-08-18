# Íconos

No se usa ninguna librería de íconos (nada de `lucide-react`, `heroicons`, etc.) — todos los íconos del landing son SVG dibujados a mano directo en el componente, siguiendo siempre el mismo estilo de línea (outline), nunca rellenos.

## Plantilla base

```jsx
<svg
  xmlns="http://www.w3.org/2000/svg"
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  strokeWidth={1.8}
  className="h-8 w-8"
>
  <path strokeLinecap="round" strokeLinejoin="round" d="..." />
</svg>
```

- `viewBox="0 0 24 24"` siempre — así todos los íconos quedan proporcionales entre sí sin importar quién los dibuje.
- `fill="none"` + `stroke="currentColor"` — el ícono hereda el color del texto del elemento padre (`text-primary-600`, `text-white`, etc.), nunca se le pone un color fijo dentro del SVG.
- `strokeWidth`: `1.8` para íconos grandes/decorativos (valores, servicios), `2` para íconos chicos dentro de botones o listas de contacto.
- `strokeLinecap="round"` y `strokeLinejoin="round"` en cada `<path>` — le da el aspecto "amigable" redondeado que tienen todos los íconos del sitio, no dejarlos en punta.

## Tamaños según el contexto

| Contexto | Clase |
|---|---|
| Ícono grande decorativo (círculo de color en Servicios, valores de "Conócenos") | `h-8 w-8` dentro de un círculo `h-16 w-16` con `bg-primary-700` |
| Ícono de contacto/ubicación (Location, Footer) | `h-5 w-5` dentro de un círculo `h-11 w-11` |
| Ícono chico dentro de flechas/controles (carrusel de noticias) | `h-5 w-5` |

## Círculo de fondo para íconos destacados

Cuando un ícono necesita destacar (como el de la gota de agua en Servicios), va dentro de un círculo de color:

```jsx
<span className="flex h-16 w-16 flex-none items-center justify-center rounded-full bg-primary-700 text-white">
  <svg>...</svg>
</span>
```

## Dónde conseguir el `d` de un ícono nuevo

Si necesitan un ícono que no existe todavía, busquen uno en [heroicons.com](https://heroicons.com) (estilo "outline") y copien solo el contenido del `<path>`, ajustando el `viewBox` a `0 0 24 24` si no coincide. No hace falta instalar la librería, solo copiar el SVG a mano siguiendo la plantilla de arriba.
