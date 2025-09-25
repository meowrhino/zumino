
/**
 * Multi-Slideshows (vanilla JS) — v2
 * - Esquema raíz: { proyectos2: [ { slug, titulo, fecha, background, slides[] } ] }
 * - Top-left: muestra "titulo, año".
 * - Counter: "X/Y" (pegado).
 * - Botones: sin corchetes ("página/proyecto" según corresponda).
 * - Imágenes por slide: coords [x vw, y vh], width responsive con clamp.
 * - Transición suave (fade-in) al cambiar.
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
    background: p.background ?? null,
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

function normalizeSlides(slides) {
  const list = slides.map((s, i) => {
    const textoArr = Array.isArray(s.texto) ? s.texto : (typeof s.texto === 'string' ? [s.texto] : []);
    const imagenes = s.imagenes ?? (s.imagen ? asArray(s.imagen) : []);
    const background = s.background ?? null;
    return {
      orden: (typeof s.orden === 'number') ? s.orden : undefined,
      parrafos: textoArr,
      imagenes: Array.isArray(imagenes) ? imagenes : asArray(imagenes),
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

function setBackground(project, slide) {
  const pick = slide?.background ?? project?.background;
  const src = Array.isArray(pick) ? pick[0] : pick;

  if (typeof src === 'string' && src.trim()) {
    const url = src.replace(/^\.\//, ''); // limpia './' inicial por si acaso

    // Preload con diagnóstico
    const test = new Image();
    test.onload = () => {
      // JSON.stringify garantiza comillas y escaping correcto dentro de url(...)
      els.app.style.backgroundImage = `url(${JSON.stringify(url)})`;
    };
    test.onerror = (e) => {
      console.warn('[BG] No se pudo cargar el background:', url, e);
      els.app.style.backgroundImage = 'none';
    };
    test.src = url;
  } else {
    els.app.style.backgroundImage = 'none';
  }
}

function escapeUrl(str) { return String(str).replace(/(['"()\\\s])/g, '\\$1'); }
function clear(el) { while (el.firstChild) el.removeChild(el.firstChild); }

function renderImages(slide) {
  if (!canvasEl) return;
  clear(canvasEl);
  const imgs = slide.imagenes || [];
  imgs.forEach((it, idx) => {
    const url = (it && it.url) ? it.url : null;
    if (!url) return;
    const coords = Array.isArray(it.coords) ? it.coords : [0,0];
    const left = typeof coords[0] === 'number' ? coords[0] : parseFloat(coords[0]) || 0;
    const top  = typeof coords[1] === 'number' ? coords[1] : parseFloat(coords[1]) || 0;
    const img = document.createElement('img');
    img.className = 'canvas__img';
    img.src = url;
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
  setBackground(project, slide);
  renderImages(slide);

  // Botones (sin corchetes)
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
