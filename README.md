# Multi‑Slideshows — README

Pequeño sistema de *slideshow de slideshows* (vanilla JS + CSS plano).

## Qué hay en pantalla
- **Arriba‑izquierda**: título y fecha (del JSON) y, debajo, el texto de la *slide* en `<p>` (uno por cada ítem del array).
- **Arriba‑derecha**: contador `Slide X / N — "slugDelProyecto"`.
- **Abajo‑izquierda** y **abajo‑derecha**: botones de texto (no parece botón). Al *hover* cambian de color. Mueven a *página* (slide) o *proyecto* (slideshow) en bucle.
- Toda la vista ocupa **100dvw × 100dvh** y el fondo puede cambiar por *slide* via `background` del JSON.

## Datos (data.json)
Ejemplo base (este repo incluye tu `data_seed.json` como `data.json`):

```json
{
  "título": "zumo de manzana",
  "fecha": "2024-06-15",
  "proyectos": [
    {
      "slug": "zumodemanzana",
      "slides": [
        { "orden": 1, "texto": "…", "background": "img/fondo1.jpg", "imagen": { "url": "img/a.jpg", "coords": [0,0] } },
        { "orden": 2, "texto": ["p1", "p2"], "background": ["img/fondo2.jpg", "img/fondo2b.jpg"] }
      ]
    }
  ]
}
```

### Reglas y normalización
- `título`/`titulo` y `fecha` se muestran arriba‑izquierda.
- `proyectos` puede llevar `orden` por proyecto (opcional). Si no existe, se respeta el orden del array.
- Cada `slides[*]` se ordena por su `orden` (si no existe, se respeta el orden del array).
- `texto` acepta **string** o **string[]**. Internamente se normaliza a `parrafos: string[]` y se pinta un `<p>` por entrada.
- `background` acepta **string** o **string[]**. Si es array, por ahora se usa el **primer** elemento.
- `imagen` puede ser **objeto** o array (alias `imagenes`). No se usa en UI aún (pendiente de decidir layout), pero se normaliza y queda disponible.
- **Bucle**: al llegar al final de un *proyecto*, `siguiente` pasa al primer slide del **siguiente proyecto**; y al revés con `anterior`.

### Etiquetas de los botones
- Si el siguiente/previo movimiento es dentro del mismo slideshow: `siguiente [página]` / `[página] anterior`.
- Si cambia de slideshow: `siguiente [proyecto]` / `[proyecto] anterior`.

## Estilos
- Fuente: serif del sistema.
- **Clamps** en `:root`:
  - `--fs-title-date` (títulos y fecha)
  - `--fs-buttons` (botones)
  - `--fs-paragraph` (párrafos)
  - `--fs-counter` (contador)
- Contenedor de info ocupa **30%** en escritorio y **40%** en móvil; `flex-column` + `gap`.

## Uso
1. Abre `index.html` en un servidor estático o directamente en el navegador (algunos navegadores bloquean `fetch` de archivos locales; en ese caso usa un servidor local).
2. Edita `data.json` siguiendo las reglas de arriba.
3. Añade imágenes en `img/` si usas `background` o `imagen/es`.

## Extensiones futuras (ideas)
- Transiciones suaves entre slides y proyectos.
- Soporte para *varias imágenes* en una slide (galería o strip).
- Preload de fondos y *fallback* de color.
- Deep‑linking por `?p=slug&s=3`.
- HUD opcional con el nombre del proyecto en otra esquina.
