
/**
 * Multi-Slideshows (vanilla JS) — v2.1
 * - Background SOLO por slide (no fallback del proyecto).
 * - Solo acepta `imagenes` (array o un único objeto/URL que se convierte a array).
 * - Counter "X/Y".
 * - Z-index en texto/counter/nav para que queden por encima.
 * - JS no inyecta CSS salvo backgroundImage y position coords.
 */

const els = {
  app: document.getElementById('app'),
  title: document.getElementById('title'),
  date: document.getElementById('date'),
  paragraphs: document.getElementById('paragraphs'),
  counter: document.getElementById('counter'),
  prevBtn: document.getElementById('prevBtn'),
  nextBtn: document.getElementById('nextBtn'),
};

let canvasEl = null;

const state = {
  projects: [],
  pIndex: 0,
  sIndex: 0,
};

const asArray = v => Array.isArray(v) ? v : (v == null ? [] : [v]);

async function loadData() {
  const res = await fetch('data.json', { cache: 'no-store' });
  if (!res.ok) throw new Error('No se pudo cargar data.json');
  const raw = await res.json();
  return normalize(raw);
}

function getYearOnly(s) {
  if (!s || typeof s !== 'string') return '';
  const m = s.match(/\d{4}/);
  return m ? m[0] : '';
}

function normalize(raw) {
  const proyectos = asArray(raw.proyectos2 ?? raw.proyectos ?? []);

  const projects = proyectos.map((p, idx) => ({
    slug: p.slug ?? `proyecto-${idx+1}`,
    titulo: p.titulo ?? p.slug ?? `Proyecto ${idx+1}`,
    fecha: p.fecha ?? '',
    // background de proyecto ignorado a propósito (solo por slide)
    orden: (typeof p.orden === 'number') ? p.orden : undefined,
    slides: normalizeSlides(asArray(p.slides))
  }));

  projects.forEach((p, i) => p._i = i);
  projects.sort((a, b) => {
    const ao = (typeof a.orden === 'number') ? a.orden : a._i + 1;
    const bo = (typeof b.orden === 'number') ? b.orden : b._i + 1;
    return ao - bo;
  });
  projects.forEach(p => delete p._i);
  return { projects };
}

function toImagenesArray(val) {
  // Acepta: array de objetos | objeto suelto | string URL suelta
  if (Array.isArray(val)) return val;
  if (val == null) return [];
  if (typeof val === 'string') return [{ url: val }];
  if (typeof val === 'object' && val.url) return [val];
  return [];
}

function normalizeSlides(slides) {
  const list = slides.map((s, i) => {
    const textoArr = Array.isArray(s.texto) ? s.texto : (typeof s.texto === 'string' ? [s.texto] : []);
    // Solo `imagenes` (ignora `imagen` si existiera)
    const imagenes = toImagenesArray(s.imagenes);
    const background = s.background ?? null;
    return {
      orden: (typeof s.orden === 'number') ? s.orden : undefined,
      parrafos: textoArr,
      imagenes,
      background
    };
  });
  list.forEach((s, i) => s._i = i);
  list.sort((a, b) => {
    const ao = (typeof a.orden === 'number') ? a.orden : a._i + 1;
    const bo = (typeof b.orden === 'number') ? b.orden : b._i + 1;
    return ao - bo;
  });
  list.forEach(s => delete s._i);
  return list;
}

const IMAGE_EXT_RE = /\.(avif|webp|png|jpe?g|svg)$/i;
function isValidImgPath(src) {
  return typeof src === 'string'
    && src.trim() !== ''
    && !src.endsWith('/')
    && IMAGE_EXT_RE.test(src);
}

function pickFirstValidImage(pick) {
  if (Array.isArray(pick)) {
    for (const s of pick) if (isValidImgPath(s)) return s;
    return null;
  }
  return isValidImgPath(pick) ? pick : null;
}

function setBackground(slide) {
  // SOLO slide.background
  const src = pickFirstValidImage(slide?.background);
  if (src) {
    const url = src.replace(/^\.\//, '');
    const test = new Image();
    test.onload = () => { els.app.style.backgroundImage = `url(${JSON.stringify(url)})`; };
    test.onerror = (e) => {
      console.warn('[BG] No se pudo cargar el background (descartado):', url, e);
      els.app.style.backgroundImage = 'none';
    };
    test.src = url;
  } else {
    els.app.style.backgroundImage = 'none';
  }
}

function clear(el) { while (el.firstChild) el.removeChild(el.firstChild); }

function renderImages(slide) {
  if (!canvasEl) return;
  clear(canvasEl);

  const imgs = slide.imagenes || [];
  imgs.forEach((it, idx) => {
    const url = it && it.url ? String(it.url) : '';
    if (!isValidImgPath(url)) {
      if (url && url.trim()) console.warn('[IMG] URL inválida descartada:', url);
      return;
    }
    const coords = Array.isArray(it.coords) ? it.coords : [0,0];
    const left = typeof coords[0] === 'number' ? coords[0] : parseFloat(coords[0]) || 0;
    const top  = typeof coords[1] === 'number' ? coords[1] : parseFloat(coords[1]) || 0;

    const img = document.createElement('img');
    img.className = 'canvas__img';
    img.src = url.replace(/^\.\//, '');
    img.alt = it.alt || `img-${idx+1}`;
    img.style.left = left + 'vw';
    img.style.top  = top + 'vh';

    canvasEl.appendChild(img);
    requestAnimationFrame(() => img.classList.add('is-visible'));
  });
}

function animateRefresh() {
  els.app.classList.remove('appearing');
  void els.app.offsetWidth;
  els.app.classList.add('appearing');
}

function render() {
  const { projects, pIndex, sIndex } = state;
  const project = projects[pIndex];
  const slides = project.slides;
  const slide  = slides[sIndex];

  // Top-left: "titulo, año"
  const year = getYearOnly(project.fecha);
  els.title.textContent = year ? `${project.titulo}, ${year}` : project.titulo;
  if (els.date) els.date.textContent = '';

  // Texto del slide
  els.paragraphs.innerHTML = '';
  slide.parrafos.forEach(t => {
    const p = document.createElement('p');
    p.textContent = t;
    els.paragraphs.appendChild(p);
  });

  // Counter "X/Y"
  els.counter.textContent = `${sIndex + 1}/${slides.length}`;

  // Fondo + imágenes
  setBackground(slide);
  renderImages(slide);

  // Botones neutros (texto ya es gris via CSS)
  const prevIsProject = (sIndex === 0);
  const nextIsProject = (sIndex === slides.length - 1);
  els.prevBtn.textContent = prevIsProject ? 'proyecto anterior' : 'página anterior';
  els.nextBtn.textContent = nextIsProject ? 'siguiente proyecto' : 'siguiente página';

  animateRefresh();
}

function goPrev() {
  const { projects, pIndex, sIndex } = state;
  if (sIndex > 0) state.sIndex -= 1;
  else {
    const prevP = (pIndex - 1 + projects.length) % projects.length;
    state.pIndex = prevP;
    state.sIndex = projects[prevP].slides.length - 1;
  }
  render();
}

function goNext() {
  const { projects, pIndex, sIndex } = state;
  const slides = projects[pIndex].slides;
  if (sIndex < slides.length - 1) state.sIndex += 1;
  else {
    const nextP = (pIndex + 1) % projects.length;
    state.pIndex = nextP;
    state.sIndex = 0;
  }
  render();
}

function keyNav(e) {
  if (e.key === 'ArrowLeft') goPrev();
  if (e.key === 'ArrowRight') goNext();
}

async function init() {
  const normalized = await loadData();
  state.projects = normalized.projects;
  state.pIndex = 0;
  state.sIndex = 0;

  canvasEl = document.createElement('div');
  canvasEl.className = 'canvas';
  els.app.appendChild(canvasEl);

  els.prevBtn.addEventListener('click', goPrev);
  els.nextBtn.addEventListener('click', goNext);
  window.addEventListener('keydown', keyNav);

  render();
}

init().catch(err => {
  console.error(err);
  if (els.counter) els.counter.textContent = 'Error cargando data.json';
});
