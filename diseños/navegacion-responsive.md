# Navegación y responsividad

## Navegación del dashboard
- **Menú lateral único** (`lib/menuConfig.tsx` → `Sidebar`): mismo orden para todos los roles (Dashboard, Solicitudes, Inventario, Averías, Directorio, Edición de página, Auditoría, Reportes, Documentos Oficiales, Perfil); solo cambia qué ítems ve cada rol.
- **Sección activa:** pastilla blanca en el ítem actual y en su grupo; los grupos se despliegan solos si la ruta activa está dentro.
- **Breadcrumbs** (`components/Dashboard/Breadcrumbs.tsx`): `Inicio › Grupo › Página`, generados desde `MENU_CONFIG` (misma fuente que el menú). No aparecen en el inicio. Páginas fuera del menú (perfil) se declaran en `EXTRAS` del componente.
- **Nueva pantalla:** agregar la ruta en `AppRoutes.tsx` y el ítem en `menuConfig.tsx`; el breadcrumb sale solo (un test lo verifica).

## Celular y tablet
- Menú: drawer a la derecha, se cierra al navegar o tocar fuera; botón de hamburguesa en el header (a la derecha en celular).
- Contenido: `main` con `overflow-x-hidden` y `min-w-0`; nada debe ensanchar la página. Tablas: `Table` ya trae scroll horizontal interno.
- Modales: `p-2` en celular, `max-h-[92dvh]` con scroll interno. Formularios de 2 columnas: `grid-cols-1 sm:grid-cols-2`.

## Pantalla táctil
Con `pointer-coarse:` (dispositivos táctiles) los botones, pestañas, filtros, ítems del menú y switches tienen área de toque mínima de 44 px (`Button`, `Tabs`, `campos.tsx`, `Sidebar`, `Breadcrumbs`).
