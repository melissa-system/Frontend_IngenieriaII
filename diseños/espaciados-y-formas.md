# Espaciados, bordes, sombras y esquinas

Los valores de forma viven como tokens en `src/index.css` (`@theme`) y los componentes de `src/components/ui/` ya los usan: para cambiarlos en todo el sistema se edita el token, no cada vista.

## Esquinas

| Token / clase | Valor | Uso |
|---|---|---|
| `rounded-full` | pastilla | Botones, selects, buscadores, filtros, badges, pestañas |
| `rounded-campo` | 0.5rem | Inputs, textareas, banners en línea |
| `rounded-tarjeta` | 0.75rem | Tarjetas, tablas, modales, toasts, estados vacío/error |
| `rounded-panel` | 1rem | Paneles grandes (perfil, formularios de página completa) |

## Sombras

| Token / clase | Uso |
|---|---|
| `shadow-tarjeta` | Tarjetas y tablas (sombra muy suave) |
| `shadow-flotante` | Elementos que flotan sobre la página: modales, toasts |

## Bordes

- Tarjetas y tablas: `border border-primary-100`. Inputs: `border-primary-200`, foco `focus:border-primary-500 focus:ring-1 focus:ring-primary-500`.
- Error de campo: borde `error-300`/`error-500` (ver `bordeCampo`). Separadores internos: `divide-primary-100`.

## Espaciado

Se usa la escala estándar de Tailwind (base 0.25 rem). Medidas fijas del sistema:

| Dónde | Valor |
|---|---|
| Padding de la página (dashboard) | `p-4 sm:p-6` |
| Separación entre bloques de una vista | `space-y-6` |
| Separación título → contenido | `mt-1` (descripción), `mt-4`/`mt-6` (contenido) |
| Padding de tarjetas | `p-4 sm:p-6` (`p-5` en tarjetas de estadística) |
| Padding de modales | `p-4 sm:p-6` |
| Celdas de tabla | `px-4 py-3` |
| Separación entre campos de formulario | `space-y-4` (`gap-4` en rejillas) |
| Separación entre botones | `gap-3` |
| Área mínima táctil | 44 px (`pointer-coarse:min-h-11`) |

## Tamaños de texto (tokens)

| Token | Valor | Uso |
|---|---|---|
| `text-titulo-pagina` | 1.5 rem | h1 de cada vista del dashboard |
| `text-subtitulo` | 1.125 rem | Títulos de tarjetas, modales y estados vacío |
| `text-cuerpo` | 0.875 rem | Tablas, formularios, párrafos del dashboard |
| `text-etiqueta` | 0.75 rem | Etiquetas, ayudas, badges |

(El landing usa los tamaños responsivos de `tipografia.md`.)
