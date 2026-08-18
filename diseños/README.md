# Guía de diseño — SIAPB (ASADA Pueblo Nuevo)

Esta carpeta es la referencia de diseño del **landing público** (la parte del sitio que ve cualquier visitante: inicio, sobre nosotros, servicios, noticias, ubicación, solicitud de paja de agua y reportar avería). Está pensada para que cualquier persona del equipo pueda venir a consultar "¿qué clase le pongo a este botón?" o "¿qué azul es este?" sin tener que andar buscando en el código del frontend.

**Regla de oro: si vas a agregar o modificar algo del landing, primero revisá si ya existe un patrón acá. Si existe, usalo tal cual. Si necesitás algo nuevo que no está documentado, avisale a Meli antes de inventar un estilo nuevo, así lo agregamos acá y no se pierde la simetría del diseño.**

## Archivos de esta carpeta

- `colores.md` — la paleta de azules institucionales y cuándo usar cada tono.
- `tipografia.md` — las dos fuentes del sitio (títulos vs. todo lo demás) y las clases exactas para título principal, subtítulo y texto plano.
- `botones.md` — todas las variantes de botón que existen (relleno, contorno, texto) y cuándo usar cada una.
- `formularios.md` — cómo se ven los labels, inputs, selects, textareas y campos de archivo en los formularios (Solicitud de paja de agua, Reportar avería).
- `tarjetas-y-secciones.md` — cómo se arman las cards (bordes, sombra, esquinas) y el espaciado/estructura de las secciones del landing.
- `iconos.md` — el estilo de los íconos SVG que se usan en todo el sitio.

## Cómo está construido el proyecto (para ubicarse)

El frontend usa **React + TypeScript + Vite + Tailwind CSS 4**. Los colores y las fuentes están definidos como variables en un solo lugar:

```
Frontend_IngeII/src/index.css   → paleta de colores y fuentes (bloque @theme)
Frontend_IngeII/index.html      → import de Google Fonts (Inter y Poppins)
```

Todo lo demás (botones, formularios, cards) son clases de Tailwind aplicadas directo en cada componente — no hay un archivo central de componentes de UI todavía, así que la forma de mantener la simetría es **copiar las clases exactas que están documentadas acá**, no improvisar variaciones parecidas.

Si cambian los colores o las fuentes en `index.css`/`index.html`, hay que actualizar `colores.md` y `tipografia.md` para que no queden desactualizados.
