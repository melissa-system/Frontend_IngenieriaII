# Auditoría de validaciones de formularios (PBI 511 · Task 513)

Resultado de revisar cada formulario del sistema contra un mismo checklist y de
corregir lo que no cumplía. Las reglas comunes viven en `src/lib/validaciones.ts`
y son las mismas que aplica el backend (`src/common/validacion/reglas-validacion.ts`).

## Checklist aplicado a cada formulario

1. Campos obligatorios marcados con `*` (`<Obligatorio />`) y validados.
2. Formato de cédula (física 9 dígitos, jurídica 10, DIMEX 11-12), teléfono (8 dígitos),
   correo y fechas con las reglas comunes.
3. Longitudes mínimas y máximas (`maxLength` en el input y validación), números enteros
   y positivos donde corresponde.
4. Archivos adjuntos: tipo y peso.
5. Mensaje de error junto a cada campo (`<CampoError />`), en español.

Se probó cada formulario con datos vacíos, inválidos, en el límite y válidos. Las reglas
comunes tienen pruebas automáticas en `tests/validaciones.test.ts` (`npm test`).

## Resultado por formulario

| Formulario | Diferencias encontradas | Corrección |
|---|---|---|
| Abonados | Cédula sin control de largo, teléfono y cédula del representante libres, sin máximos, sin asteriscos, un solo error en un banner | Reglas comunes por tipo de abonado (física/DIMEX o jurídica), teléfono con formato automático, máximos, asteriscos y error debajo de cada campo |
| Proveedores | Solo se validaba el nombre; teléfono y correo sin formato | Teléfono y correo validados si se escriben, máximos según la base de datos, errores por campo |
| Artículos (Inventario) | Cantidad y fecha solo con validación del navegador, sin máximos | Cantidad entera ≥ 0, umbral ≥ 1, fecha real y no futura, máximos, errores por campo |
| Movimientos de inventario | La cantidad aceptaba decimales (1.5) aunque el mensaje pedía entero | Cantidad entera ≥ 1, stock insuficiente junto a la cantidad, máximos, errores por campo |
| Cambio de propietario | Cédula y teléfono se medían con guiones: "1-2345-67" (7 dígitos) pasaba | Cédula y teléfono con las reglas comunes en las dos vistas (abonado y administración), aviso de teléfono inválido |
| Cambio de representante | El nombre exigía 5 caracteres en el aviso pero no al enviar | Mínimo de 5 caracteres también al enviar |
| Cambio de medidor | Campos obligatorios sin asterisco | Asteriscos |
| Otro trámite | Sin asteriscos; asunto y justificación sin máximo en el input | Asteriscos y `maxLength` (150 y 2000) |
| Conexión de servicio | Sin validar identificación del firmante ni el correo de notificación | Identificación con reglas comunes, correo validado cuando el medio es correo, máximos, errores por campo |
| Solicitud de paja de agua (pública) | Adjuntos sin control de peso | Límite de 5 MB por archivo, igual que el backend |
| Reporte de averías (pública) | "Otro" enviaba texto libre como tipo (la BD lo rechazaba), el DIMEX viajaba como "DIMEX 123…", una cédula incompleta se rellenaba con ceros, imagen sin tipo ni peso, sin asteriscos, error genérico | Tipo válido + detalle en la descripción, DIMEX solo con dígitos, cédula de 9 dígitos exactos, imagen ≤ 5 MB, descripción de 10 a 2000 caracteres, asteriscos, mensaje real del servidor |
| Gestión de averías (administración) | Si el guardado fallaba, el error se ignoraba y el modal se cerraba | Se muestra el error y el modal queda abierto; observación de hasta 1000 caracteres |
| Registro de actividad del fontanero | El botón se deshabilitaba sin decir qué faltaba | Errores por campo (descripción, fecha no futura, tiempo entre 1 minuto y 24 horas), asteriscos |
| Gestión de usuarios | Contraseña de solo 8 caracteres (más débil que el registro), correo solo con validación del navegador | Contraseña con mayúscula y número, correo con regla común, errores por campo |
| Gestión de personal (Empleados) | Ya mostraba errores por campo, pero cédula, teléfono y fecha solo se revisaban vacíos | Reglas comunes de cédula (física/DIMEX), teléfono, correo y fecha no futura |
| Perfil | Correo y teléfono sin validar; foto sin control de tipo ni peso | Correo, teléfono y nombre de usuario con las reglas del backend; foto JPG/PNG/GIF/WEBP de hasta 2 MB |
| Cambio de contraseña, login, recuperación y restablecimiento | Cumplían el checklist | Recuperación usa la regla común de correo |

## Backend (Task 514) y formato de errores (Task 516)

El backend repite estas mismas reglas en sus DTOs aunque el formulario ya las haya
validado, y responde todos los errores con el formato
`{ statusCode, codigo, message, errores: [{ campo, mensaje }] }`. El frontend usa
`errores` para mostrar el mensaje del servidor junto al campo correspondiente.
