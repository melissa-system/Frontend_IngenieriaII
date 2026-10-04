# Componentes reutilizables y lista de revisión

Todos viven en `Frontend_IngeII/src/components/ui/`. **Regla: en cualquier vista (dashboard o público) se usan estos componentes en vez de escribir las clases a mano.**

| Componente | Archivo | Para qué | Reemplaza |
|---|---|---|---|
| `Button` / `claseBoton()` | `Button.tsx` | Todo botón. `variant`: `primary`, `secondary`, `danger`, `success`, `info`, `ghost`; `size`: `sm`, `md`; `loading` (spinner + `aria-busy` + deshabilitado). Siempre `rounded-full`. Estados: normal, hover, foco (`focus-visible`), deshabilitado, cargando. | `<button className="rounded-…">` |
| `Modal`, `ModalTitulo`, `ModalAcciones`, `ModalConfirmar`, `ModalFormulario` | `Modal.tsx` | Overlay + panel accesible (`role="dialog"`, foco atrapado, Escape con `onCerrar`, retorno del foco). `ModalConfirmar` = "¿seguro?" (`variante="danger"`); `ModalFormulario` = formulario con Guardar/Cancelar y error integrado. | `fixed inset-0 …` a mano |
| `Campo`, `Input`, `Fecha`, `Archivo`, `Textarea`, `Select` | `campos.tsx` | Etiqueta arriba + campo + ayuda + error integrado, con `htmlFor`/`id`, `aria-invalid` y `aria-describedby` automáticos. Estados: normal, foco, deshabilitado, error. | inputs con clases copiadas |
| `Table`, `Td`, `Paginador` | `Table.tsx`, `Paginador.tsx` | Tabla con cabecera `scope="col"`, scroll horizontal, **ordenamiento** (`cabecera={[{ etiqueta, clave }]}` + `orden`/`onOrdenar`, `aria-sort`) y **paginación** (`pie={<Paginador …/>}`). Lógica pura en `lib/tabla.ts` (`ordenar`, `paginar`, `siguienteOrden`). | `<table>` y paginadores a mano |
| `Badge` / `claseBadge()` | `Badge.tsx` | Estados: `green`, `yellow`, `red`, `blue`, `indigo`, `gray` (siempre `-100` + `-700`). | `bg-green-100 text-green-700 …` |
| `PageHeader` | `PageHeader.tsx` | `h1` + descripción + botón de crear a la derecha. | `h1 text-2xl font-semibold` repetido |
| `Tabs` | `Tabs.tsx` | Pestañas con subrayado `border-b-2` (Lista / Crear). | botones de pestaña a mano |
| `Cargando`, `Spinner`, `FilasEsqueleto` | `Cargando.tsx` | Carga: spinner con texto (páginas, tarjetas, modales) y esqueleto de filas dentro de `Table`. | textos "Cargando...", skeletons propios |
| `EmptyState`, `FilaVacia` | `EmptyState.tsx` | Vacío: ícono + título + descripción (`compacto` dentro de tarjetas; `FilaVacia` dentro de tablas). | cajas punteadas y filas `No hay...` copiadas |
| `Icono` | `Icono.tsx` | Set estándar de íconos SVG (check, cerrar, alerta, bandeja…). | SVG sueltos |
| `ErrorState` | `ErrorState.tsx` | Error de carga: mensaje claro + botón "Reintentar". | cajas rojas `border-red-200 bg-red-50` |
| `Toast`, `ToastProvider`, `useToast`, `Notificar` | `Toast.tsx`, `ToastProvider.tsx` | Aviso flotante tras una acción; 4 tipos: `exito`, `error`, `advertencia`, `info`. `useToast().notificar(msg, tipo)` o `<Notificar mensaje={…} />`. | banners verdes/rojos |
| `Alerta` | `Alerta.tsx` | Alerta en línea (dentro de la página o modal), mismos 4 tipos. | `rounded-lg bg-…-50 p-3` a mano |
| `CampoError`, `Obligatorio`, `bordeCampo` | `../common/CampoError.tsx` | Errores y asterisco de obligatorio. | — |

Otros de `common/` que se mantienen: `FileDropZone`, `FirmaCanvas`, `ModalConfirmacion`, `Recaptcha`.

## Decisiones de diseño (únicas para todo el sistema)

- **Botones: siempre `rounded-full`.** Inputs y textareas: `rounded-lg`. Selects, buscadores y filtros: `rounded-full`.
- **Colores:** solo la escala `primary-*` más los semánticos de estado (tokens `exito`, `advertencia`, `error`, `info`, `acento`; ver `colores.md`). Nada de `gray-*`, `green-*`, `red-*` ni hex sueltos (excepto los colores de los gráficos de Reportes y el trazo de la firma).
- **Títulos del dashboard:** `text-titulo-pagina font-semibold text-primary-900` (usar `PageHeader`). Títulos del landing: Poppins (`font-title font-bold uppercase`), ver `tipografia.md`.
- **Estados de interfaz:** carga → `Cargando`/`FilasEsqueleto`; vacío → `EmptyState`/`FilaVacia` (con ícono); error de carga → `ErrorState` con "Reintentar"; confirmación de acción → toast global (esquina inferior derecha, se cierra a los 5 s; los errores no se cierran solos). Mensajes en español claro, voseo en el dashboard, sin tecnicismos.
- **Modales:** orden de botones primario → Cancelar, alineados a la derecha.

## Lista de revisión (checklist por vista)

Marcar cada punto al revisar una vista. El estado de cada vista queda en `lista-revision-vistas.md`.

1. [ ] Los botones usan `Button` (o `claseBoton`) y son `rounded-full`; no hay `rounded-lg`/`rounded-md` en botones.
2. [ ] Los modales usan `Modal` (+ `ModalAcciones`); primario primero, Cancelar al final.
3. [ ] Las tablas tienen el contenedor y la cabecera estándar (`Table` o sus mismas clases).
4. [ ] Inputs/textareas `rounded-lg`; selects, buscadores y filtros `rounded-full` con `h-10`.
5. [ ] Etiquetas arriba (`text-sm font-medium text-primary-900`), errores con `CampoError`, obligatorios con `Obligatorio`.
6. [ ] Estados con `Badge` (color-100 + color-700).
7. [ ] El título es `text-titulo-pagina font-semibold text-primary-900` (dashboard) y el botón de crear va a la derecha del título.
8. [ ] Sin colores fuera de la paleta (`gray-*`, `blue-600`, hex).
9. [ ] Sin estilos duplicados o contradictorios en el mismo archivo (constantes de clases repetidas, clases que se pisan).
10. [ ] La funcionalidad no cambió: `npm run build`, `npm run lint` y `npm test` pasan.
11. [ ] Carga, vacío, error y confirmación usan los componentes de estado (nada de "Cargando..." suelto, cajas rojas/verdes a mano ni pantallas en blanco mientras llegan los datos).

## Biblioteca viva

Con `npm run dev` abrí `/dashboard/componentes` (solo en desarrollo): muestra todos los componentes con sus estados (normal, foco, deshabilitado, error, cargando) para revisarlos contra la guía y probar teclado y celular.

## Accesibilidad (verificada por `tests/guiaEstilos.test.ts`)

- Todo botón es un `<button>` con foco visible; los campos están ligados a su etiqueta y anuncian error/ayuda.
- Modales: nombre accesible desde `<ModalTitulo>`, foco atrapado, Escape y retorno del foco.
- Tablas: `scope="col"`, `aria-sort`; paginación con `aria-current` y `aria-label`.
- Alertas y toasts con `role="alert"` (error, advertencia) o `role="status"`.
