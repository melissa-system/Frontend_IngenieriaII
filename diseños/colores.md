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
| `primary-400` | `#4d6d88` | Texto secundario (fechas, ayudas, placeholders). Cumple AA sobre blanco |
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
  --color-primary-400: #4d6d88;
  --color-primary-500: #395f82;
  --color-primary-600: #13416b;
  --color-primary-700: #073763; /* color base */
  --color-primary-800: #062c4f;
  --color-primary-900: #04213b;
}
```

## Colores de estado (tokens semánticos)

Viven en el mismo `@theme` de `index.css` y se usan igual que `primary-*`. **No se usan** `green-*`, `red-*`, `amber-*`, etc. de Tailwind: un test (`tests/guiaEstilos.test.ts`) lo impide, así cambiar un tono en `index.css` lo cambia en todo el sistema.

| Token | Significado | Base (escala 50–900) | Ejemplos de uso |
|---|---|---|---|
| `exito-*` | Éxito, activo, aprobado, entrada de stock | verde | Badge `bg-exito-100 text-exito-700`, botón Aprobar, toast de éxito |
| `advertencia-*` | Pendiente, atención, stock bajo | ámbar | Badge `bg-advertencia-100 text-advertencia-700` |
| `error-*` | Error, rechazado, inactivo, salida de stock, obligatorio (`*`) | rojo | Badge, botón Rechazar/Eliminar, `ErrorState`, `CampoError` |
| `info-*` | Información, en proceso | azul | Badge, botón "Marcar en proceso" |
| `acento-*` | Categorías secundarias (tipos de abonado/artículo, rol) | índigo | Badges de categoría |

Reglas de contraste (verificadas por `tests/contraste.test.ts`, WCAG AA 4.5:1):

- Texto de estado sobre fondo claro: tono **700** (`exito`, `advertencia`, `acento`) o **600** (`error`, `info`). Los tonos 500 son solo para fondos sólidos pequeños (puntos, switches), nunca para texto.
- Badge: `color-100` de fondo + `color-700` de texto. Banner/toast: `color-50` + `color-800`.
- Botón sólido con texto blanco: `exito-700`, `error-600` o `info-700` como mínimo.
- Texto secundario: `primary-400` como el más claro permitido sobre blanco. `primary-300` y más claros solo sobre fondos oscuros (sidebar, hero, footer) o como decoración (separadores, íconos).

## Contraste verificado (sobre blanco salvo indicación)

| Par texto / fondo | Ratio |
|---|---|
| `primary-900` / `primary-800` / `primary-700` | 16.3 / 14.2 / 12.1 |
| `primary-500` / `primary-400` | 6.7 / 5.4 |
| blanco sobre `primary-700` / `primary-800` | 12.1 / 14.2 |
| `primary-200` y `primary-300` sobre `primary-900` (sidebar) | 10.1 / 7.2 |
| Badges 700 sobre 100 (éxito, advertencia, error, info, acento) | ≥ 4.5 en todos |

La tabla completa de pares se ejecuta con `npm test` (archivo `tests/contraste.test.ts`).

## Colores secundarios

El sistema no tiene un segundo color de marca: la identidad es el azul institucional `#073763`. El rol de "secundario" lo cumple `acento-*` (índigo) para categorías, y los neutros son los tonos claros de `primary-*`.

Excepciones fuera de los tokens: los colores de los gráficos de Reportes (derivados de `primary-*`) y el trazo de la firma.
