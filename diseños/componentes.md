# Componentes reutilizables y lista de revisión

Todos viven en `Frontend_IngeII/src/components/ui/`. **Regla: en cualquier vista (dashboard o público) se usan estos componentes en vez de escribir las clases a mano.**

| Componente | Archivo | Para qué | Reemplaza |
|---|---|---|---|
| `Button` / `claseBoton()` | `Button.tsx` | Todo botón. `variant`: `primary`, `secondary`, `danger`, `success`, `info` (contorno de color, fondo blanco), `ghost`; `size`: `sm`, `md`. Siempre `rounded-full`. `claseBoton()` da las clases para un `<Link>`. | `<button className="rounded-lg bg-primary-700 …">` |
| `Modal`, `ModalTitulo`, `ModalAcciones` | `Modal.tsx` | Overlay + panel. `size`: `md`/`lg`/`xl`/`2xl`; `layer`: 50/60/70 para confirmaciones sobre otro modal. `ModalAcciones` = fila de botones a la derecha (primario primero, Cancelar al final). | `fixed inset-0 z-50 …` hecho a mano |
| `Campo`, `Input`, `Textarea`, `Select` | `campos.tsx` | Etiqueta arriba + campo + ayuda + error (`CampoError`). Inputs/textareas `rounded-lg`, selects `rounded-full`. Constantes `CLASE_INPUT`, `CLASE_SELECT`, `CLASE_SELECT_FILTRO`, `CLASE_BUSCADOR`. | clases sueltas de inputs/selects |
| `Table`, `Td` | `Table.tsx` | Tabla con contenedor, cabecera `bg-primary-50` y filas separadas. | `<table>` hecha a mano |
| `Badge` / `claseBadge()` | `Badge.tsx` | Estados: `green`, `yellow`, `red`, `blue`, `indigo`, `gray` (siempre `-100` + `-700`). | `bg-green-100 text-green-700 …` |
| `PageHeader` | `PageHeader.tsx` | `h1` + descripción + botón de crear a la derecha. | `h1 text-2xl font-semibold` repetido |
| `Tabs` | `Tabs.tsx` | Pestañas con subrayado `border-b-2` (Lista / Crear). | botones de pestaña a mano |
| `EmptyState` | `EmptyState.tsx` | Lista vacía. | cajas punteadas copiadas |
| `Toast` | `Toast.tsx` | Notificación flotante de éxito/error. | — |
| `CampoError`, `Obligatorio`, `bordeCampo` | `../common/CampoError.tsx` | Errores y asterisco de obligatorio. | — |

Otros de `common/` que se mantienen: `FileDropZone`, `FirmaCanvas`, `ModalConfirmacion`, `Recaptcha`.

## Decisiones de diseño (únicas para todo el sistema)

- **Botones: siempre `rounded-full`.** Inputs y textareas: `rounded-lg`. Selects, buscadores y filtros: `rounded-full`.
- **Colores:** solo la escala `primary-*` más los semánticos de estado (`green`, `yellow`, `red`, `blue`, `indigo`). Nada de `gray-*`, `slate-*`, `blue-600` ni hex sueltos (excepto los colores de los gráficos de Reportes y el trazo de la firma).
- **Títulos del dashboard:** `text-2xl font-semibold text-primary-900` (usar `PageHeader`). Títulos del landing: Poppins (`font-title font-bold uppercase`), ver `tipografia.md`.
- **Modales:** orden de botones primario → Cancelar, alineados a la derecha.

## Lista de revisión (checklist por vista)

Marcar cada punto al revisar una vista. El estado de cada vista queda en `lista-revision-vistas.md`.

1. [ ] Los botones usan `Button` (o `claseBoton`) y son `rounded-full`; no hay `rounded-lg`/`rounded-md` en botones.
2. [ ] Los modales usan `Modal` (+ `ModalAcciones`); primario primero, Cancelar al final.
3. [ ] Las tablas tienen el contenedor y la cabecera estándar (`Table` o sus mismas clases).
4. [ ] Inputs/textareas `rounded-lg`; selects, buscadores y filtros `rounded-full` con `h-10`.
5. [ ] Etiquetas arriba (`text-sm font-medium text-primary-900`), errores con `CampoError`, obligatorios con `Obligatorio`.
6. [ ] Estados con `Badge` (color-100 + color-700).
7. [ ] El título es `text-2xl font-semibold text-primary-900` (dashboard) y el botón de crear va a la derecha del título.
8. [ ] Sin colores fuera de la paleta (`gray-*`, `blue-600`, hex).
9. [ ] Sin estilos duplicados o contradictorios en el mismo archivo (constantes de clases repetidas, clases que se pisan).
10. [ ] La funcionalidad no cambió: `npm run build`, `npm run lint` y `npm test` pasan.
