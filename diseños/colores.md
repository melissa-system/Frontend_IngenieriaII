# Colores

Toda la paleta vive en un solo lugar: `Frontend_IngeII/src/index.css`, dentro del bloque `@theme`. Son variables de Tailwind 4, así que en el código se usan como clases normales: `bg-primary-700`, `text-primary-900`, `border-primary-200`, etc.

**No hardcodees un color hexadecimal en un componente.** Si necesitás un azul, usá una de las clases `primary-*` de abajo. Si de verdad no alcanza ninguna, avisá antes de inventar un tono nuevo.

## La paleta (azul institucional, basada en #073763)

| Clase Tailwind | Hex | Uso típico |
|---|---|---|
| `primary-50` | `#f3f5f7` | Fondos muy suaves (cards de estadísticas, fondo de sección alterna) |
| `primary-100` | `#e6ebef` | Bordes suaves, fondos de badges/etiquetas |
| `primary-200` | `#c1cdd8` | Bordes de inputs, bordes de cards |
| `primary-300` | `#9cafc1` | Bordes de botones tipo contorno |
| `primary-400` | `#6a87a1` | Texto secundario muy tenue (placeholders, fechas) |
| `primary-500` | `#395f82` | Foco de inputs (`focus:border-primary-500`), texto secundario |
| `primary-600` | `#13416b` | Hover de botones claros, texto de enlaces |
| `primary-700` | `#073763` | **Color base / marca.** Fondo de botones principales, navbar activo |
| `primary-800` | `#062c4f` | Hover de botones principales (`hover:bg-primary-800`) |
| `primary-900` | `#04213b` | Texto de títulos y texto principal, fondo del footer y del sidebar del dashboard |

## Cómo se usan en la práctica

- **Texto de títulos y texto principal:** `text-primary-900`
- **Texto de párrafos / texto plano:** `text-primary-700` u `text-primary-800` (ambos se usan, `800` es un poco más oscuro/legible para bloques largos)
- **Texto secundario (fechas, ayudas, placeholders):** `text-primary-400` o `text-primary-500`
- **Fondo de botón principal:** `bg-primary-700`, con hover `hover:bg-primary-800`
- **Bordes de inputs y cards:** `border-primary-200` (normal) → `focus:border-primary-500` (foco)
- **Fondos suaves de sección o card destacada:** `bg-primary-50`
- **Overlay oscuro sobre la foto del Hero:** gradiente `from-primary-900/90 via-primary-900/70 to-primary-900/30`

## Dónde está definida

```css
/* Frontend_IngeII/src/index.css */
@theme {
  --color-primary-50: #f3f5f7;
  --color-primary-100: #e6ebef;
  --color-primary-200: #c1cdd8;
  --color-primary-300: #9cafc1;
  --color-primary-400: #6a87a1;
  --color-primary-500: #395f82;
  --color-primary-600: #13416b;
  --color-primary-700: #073763; /* color base */
  --color-primary-800: #062c4f;
  --color-primary-900: #04213b;
}
```

## Colores fuera de la paleta azul

Para estados (badges, alertas) se usan los colores estándar de Tailwind, no colores custom:

- Éxito / activo: `bg-green-100 text-green-700`
- Advertencia / pendiente: `bg-yellow-100 text-yellow-700`
- Error / inactivo / rechazado: `bg-red-100 text-red-700`
- Info / en progreso: `bg-blue-100 text-blue-700` o `bg-indigo-100 text-indigo-700`

Estos se usan sobre todo en el dashboard (badges de estado), pero si el landing necesita un badge de estado en el futuro, seguí este mismo patrón de "color-100 fondo + color-700 texto".
