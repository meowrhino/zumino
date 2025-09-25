# Multi‑Slideshows — README

Pequeño sistema de *slideshow de slideshows* (vanilla JS + CSS plano).

## Qué hay en pantalla
- **Arriba‑izquierda**: título y año (extraído de la fecha) de cada proyecto, y debajo el texto de la *slide* en `<p>` (uno por cada párrafo).
- **Arriba‑derecha**: contador `Slide X / Y` que indica la posición dentro del slideshow actual.
- **Abajo‑izquierda** y **abajo‑derecha**: botones de texto (no parecen botones). Al *hover* cambian de gris a negro. Mueven a *página* (slide) o *proyecto* (slideshow).
- Toda la vista ocupa **100dvw × 100dvh** con fondo que cambia según la slide.

## Datos (data.json)
El JSON ya no tiene título ni fecha global en la raíz, sino que cada proyecto incluye su propio `titulo` y `fecha`. Además, el array principal de proyectos ahora se llama `proyectos2`.

Ejemplo base:

```json
{
  "proyectos2": [
    {
      "slug": "zumodemanzana",
      "titulo": "Zumo de Manzana",
      "fecha": "2024-06-15",
      "slides": [
        {
          "orden": 1,
          "texto": "Texto de la primera slide",
          "background": "img/fondo1.jpg",
          "imagenes": [
            { "url": "img/a.jpg", "coords": [0,0] }
          ]
        },
        {
          "orden": 2,
          "texto": ["Primer párrafo", "Segundo párrafo"],
          "background": "img/fondo2.jpg",
          "imagenes": []
        }
      ]
    }
  ]
}
```

### Normalización y reglas
- `proyectos2` se ordena según el orden en el array o por `orden` si está definido en cada proyecto.
- Cada `slides` se ordena por su `orden` si existe, o por orden en el array.
- `texto` puede ser **string** o **string[]** y se normaliza a un array de párrafos.
- `background` es una cadena con la URL de fondo.
- `imagenes` debe ser siempre un array; si se recibe un objeto, se normaliza a array con un solo elemento.
- El contador muestra la slide actual y total, formato `X / Y`.

## Navegación y rutas
- En local (o sin SPA fallback) se debe usar la URL con query parameters:
  - Para el índice: `http://127.0.0.1:5500/?p=<slug>&s=<n>`
  - Para la página de proyecto: `http://127.0.0.1:5500/proyecto/index.html?p=<slug>&s=<n>`
- Solo en entornos con fallback SPA (por ejemplo, hosting configurado) funcionan las rutas limpias:
  - `/slug`
  - `/proyecto/<slug>`
- El parámetro `s` es 0-indexado, es decir, `s=0` corresponde a la primera slide.

Ejemplos reales:

```plaintext
# Sin SPA fallback (local o servidor estático)
http://127.0.0.1:5500/?p=zumodemanzana&s=0
http://127.0.0.1:5500/proyecto/index.html?p=zumodemanzana&s=2

# Con SPA fallback (hosting configurado)
http://127.0.0.1:5500/zumodemanzana
http://127.0.0.1:5500/proyecto/zumodemanzana
```

- En la página principal `/` o en rutas con query `?p=<slug>&s=<n>` se muestra el slideshow con **bucle** continuo: al avanzar más allá de la última slide de un proyecto, se pasa al primer slide del siguiente proyecto; al retroceder antes de la primera slide, se va al último slide del proyecto anterior.
- En la ruta `/proyecto/<slug>` se muestra solo ese proyecto, sin bucle. Los botones de siguiente y anterior se deshabilitan en los extremos (primera y última slide).
- También se puede acceder directamente a un proyecto con la ruta `/slug`, que funciona igual que el query `?p=<slug>&s=1`.

### Etiquetas de los botones
- Si el movimiento siguiente o previo es dentro del mismo slideshow: `siguiente [página]` / `[página] anterior`.
- Si cambia de slideshow (solo en modo bucle): `siguiente [proyecto]` / `[proyecto] anterior`.
- En modo sin bucle (`/proyecto/<slug>`), los botones se deshabilitan en los extremos.

## Estilos
- Fuente serif del sistema.
- En `:root` se definen clamps para tamaños de fuente:
  - `--fs-title-date` (títulos y año)
  - `--fs-buttons` (botones)
  - `--fs-paragraph` (párrafos)
  - `--fs-counter` (contador)
- El contenedor de información ocupa **30%** en escritorio y **40%** en móvil, con `flex-column` y `gap`.
- El texto y la navegación tienen un `z-index` alto para estar siempre visibles sobre el fondo.
- Los botones son grises por defecto y cambian a negro al *hover*.

## Uso
1. Abre `index.html` en un servidor estático o directamente en el navegador (algunos navegadores bloquean `fetch` de archivos locales; en ese caso usa un servidor local).
2. Edita `data.json` siguiendo las reglas de arriba.
3. Añade imágenes en `img/` si usas `background` o `imagenes`.

## Futuro y mejoras implementadas
- Transiciones suaves entre slides y proyectos ya están parcialmente implementadas.
- Soporte para varias imágenes por slide con layout adaptable.
- Preload de fondos y fallback de color.
- Deep‑linking por rutas y query params.
- HUD opcional con nombre del proyecto en otra esquina.
