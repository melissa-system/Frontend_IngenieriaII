# Tipografía

El sitio usa **dos** familias de letra nada más. No hay una tercera fuente en ningún lado — si ves algo que "no combina", probablemente le falta una de estas dos clases.

| Familia | Variable CSS | Clase Tailwind | Uso |
|---|---|---|---|
| **Poppins** (bold) | `--font-title` | `font-title` | Solo los títulos grandes en mayúscula (h1/h2 de cada sección) |
| **Inter** | `--font-body` | (es la fuente por defecto del `<body>`, no hace falta poner clase) | Todo lo demás: subtítulos, texto plano, botones, formularios |

Ambas se cargan desde Google Fonts en `Frontend_IngeII/index.html`:

```html
<link
  href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Poppins:wght@700;800;900&display=swap"
  rel="stylesheet"
/>
```

Y están declaradas en `Frontend_IngeII/src/index.css`:

```css
@theme {
  --font-body: "Inter", system-ui, sans-serif;
  --font-title: "Poppins", "Inter", system-ui, sans-serif;
}
```

## 1. Título principal (el título grande de cada sección)

Usa Poppins, **sin negrita extrema** (peso `bold`, no `black`), siempre en mayúscula y con letras un poco separadas para que no se vea apretado.

```jsx
<h2 className="text-3xl font-title font-bold tracking-normal text-primary-900 uppercase sm:text-4xl">
  Conócenos
</h2>
```

- El título del Hero (sobre la foto) es blanco y usa un poco más de espaciado entre letras porque es más grande:
  ```jsx
  <h1 className="text-4xl font-title font-bold tracking-wider uppercase sm:text-5xl md:text-6xl">
    Llevando agua potable a cada hogar de Pueblo Nuevo
  </h1>
  ```
- Casi siempre va precedido de un "eyebrow" (etiqueta pequeña arriba del título), que **no** usa Poppins, usa Inter:
  ```jsx
  <p className="text-sm font-semibold tracking-widest text-primary-600 uppercase">
    Sobre nosotros
  </p>
  ```

**No le pongas `font-black` a los títulos** — ya se probó y se veía demasiado pesado/apretado. Se dejó en `font-bold`.

## 2. Subtítulos (títulos de tarjetas, secciones internas, h3/h4)

Usan Inter (la fuente por defecto, no Poppins), semibold, y normalmente **no** van en mayúscula sostenida salvo que el texto original ya lo esté (como "Nuestra Misión" / "Nuestra Visión", que sí llevan `uppercase tracking-wide` porque van sobre fondo de color).

```jsx
<h3 className="text-xl font-semibold text-primary-900">
  Ubicación y contacto
</h3>
```

Ejemplos reales: "Nuestra historia" (AboutUs), títulos de las noticias, "Ubicación y contacto" (Location). Todos usan esta misma combinación, solo cambia el tamaño (`text-lg`, `text-xl`, `text-2xl` según jerarquía).

## 3. Texto plano (párrafos, descripciones)

También Inter, peso normal, en `primary-700` u `800`:

```jsx
<p className="text-sm text-primary-800 sm:text-base">
  ASADA Pueblo Nuevo es la asociación encargada de administrar el acueducto...
</p>
```

## Resumen rápido

| Nivel | Familia | Clases clave |
|---|---|---|
| Título principal (h1/h2 de sección) | Poppins | `font-title font-bold uppercase tracking-normal` (o `tracking-wider` en el Hero) |
| Eyebrow (etiqueta arriba del título) | Inter | `text-sm font-semibold tracking-widest uppercase text-primary-600` |
| Subtítulo (h3/h4) | Inter | `font-semibold text-primary-900` |
| Texto plano / párrafos | Inter | sin clase de peso especial, `text-primary-700` u `800` |

Si en algún momento agregan una tercera fuente para algo puntual, que quede documentado acá con el motivo — así el resto del equipo sabe que fue una decisión y no un descuido.
