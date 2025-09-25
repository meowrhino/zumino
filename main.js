/**
 * Multi‑Slideshows (vanilla JS)
 * - Lee data.json (seed) y normaliza campos para admitir:
 *   - proyectos con 'orden' opcional
 *   - slides con 'orden' (se ordenan) y texto (string | string[])
 *   - background string | string[]
 *   - imagen | imagenes (array)
 * - UI en cuatro esquinas, 100dvw x 100dvh, con contador y nav
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

const state = {
  data: null,
  projects: [],
  pIndex: 0,  // proyecto actual
  sIndex: 0,  // slide actual
};

// Helpers
const asArray = (v) => Array.isArray(v) ? v : (v == null ? [] : [v]);
const byOrden = (a, b) => {
  const ao = (typeof a.orden === 'number') ? a.orden : Infinity;
  const bo = (typeof b.orden === 'number') ? b.orden : Infinity;
  if (ao !== bo) return ao - bo;
  return 0;
};

async function loadData() {
  const res = await fetch('data.json', { cache: 'no-store' });
  if (!res.ok) throw new Error('No se pudo cargar data.json');
  const raw = await res.json();
  return normalize(raw);
}

function normalize(raw) {
  const titulo = raw['título'] ?? raw['titulo'] ?? '';
  const fecha  = raw['fecha'] ?? '';
  const proyectos = asArray(raw.proyectos).map((p, idx) => ({
    ...p,
    _originalIndex: idx
  }));

  // ordenar proyectos por 'orden' si existe, si no, por su índice original
  const sortedProjects = [...proyectos].sort((a, b) => {
    const ao = (typeof a.orden === 'number') ? a.orden : a._originalIndex + 1;
    const bo = (typeof b.orden === 'number') ? b.orden : b._originalIndex + 1;
    return ao - bo;
  }).map(p => ({
    slug: p.slug ?? `proyecto-${p._originalIndex+1}`,
    orden: typeof p.orden === 'number' ? p.orden : undefined,
    slides: normalizeSlides(asArray(p.slides))
  }));

  return { titulo, fecha, projects: sortedProjects };
}

function normalizeSlides(slides) {
  const list = slides.map(s => {
    const textoArr = Array.isArray(s.texto) ? s.texto : (typeof s.texto === 'string' ? [s.texto] : []);
    const imagenes = s.imagenes ?? (s.imagen ? asArray(s.imagen) : (s.imagenes ?? []));
    const background = s.background ?? null;
    return {
      orden: (typeof s.orden === 'number') ? s.orden : undefined,
      parrafos: textoArr,
      imagenes: Array.isArray(imagenes) ? imagenes : asArray(imagenes),
      background
    };
  });

  // ordenar slides por 'orden' si existe (mantener orden de entrada si no)
  const withIndex = list.map((s, i) => ({ ...s, _i: i }));
  withIndex.sort((a, b) => {
    const ao = (typeof a.orden === 'number') ? a.orden : a._i + 1;
    const bo = (typeof b.orden === 'number') ? b.orden : b._i + 1;
    return ao - bo;
  });
  return withIndex.map(({ _i, ...rest }) => rest);
}

function setBackground(slide) {
  // background puede ser string o array -> cogemos el primero si es array
  const bg = Array.isArray(slide.background) ? slide.background[0] : slide.background;
  if (typeof bg === 'string' && bg.trim() !== '') {
    els.app.style.backgroundImage = `url('${cssEscape(bg)}')`;
  } else {
    els.app.style.backgroundImage = 'none';
  }
}

// Nota: pequeño escape para URLs
function cssEscape(str) {
  return str.replace(/(["'()\\\s])/g, '\\$1');
}

function render() {
  const { projects, pIndex, sIndex, data } = state;
  const project = projects[pIndex];
  const slides = project.slides;
  const slide  = slides[sIndex];

  // Top-left: Título, fecha, párrafos
  els.title.textContent = data.titulo ? data.titulo : '';
  els.date.textContent  = data.fecha ? data.fecha : '';

  els.paragraphs.innerHTML = '';
  slide.parrafos.forEach(t => {
    const p = document.createElement('p');
    p.textContent = t;
    els.paragraphs.appendChild(p);
  });

  // Top-right: Contador
  els.counter.textContent = `Slide ${sIndex + 1} / ${slides.length} — “${project.slug}”`;

  // Fondo
  setBackground(slide);

  // Nav labels dinámicas (página vs proyecto)
  const prevIsProject = (sIndex === 0);
  const nextIsProject = (sIndex === slides.length - 1);

  els.prevBtn.textContent = prevIsProject ? '[proyecto] anterior' : '[página] anterior';
  els.nextBtn.textContent = nextIsProject ? 'siguiente [proyecto]' : 'siguiente [página]';
}

function goPrev() {
  const { projects, pIndex, sIndex } = state;
  if (sIndex > 0) {
    state.sIndex -= 1; // página
  } else {
    // proyecto anterior
    const prevP = (pIndex - 1 + projects.length) % projects.length;
    state.pIndex = prevP;
    state.sIndex = projects[prevP].slides.length - 1;
  }
  render();
}

function goNext() {
  const { projects, pIndex, sIndex } = state;
  const slides = projects[pIndex].slides;
  if (sIndex < slides.length - 1) {
    state.sIndex += 1; // página
  } else {
    // siguiente proyecto
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
  state.data = await loadData();
  state.projects = state.data.projects;
  state.pIndex = 0;
  state.sIndex = 0;

  // Eventos
  els.prevBtn.addEventListener('click', goPrev);
  els.nextBtn.addEventListener('click', goNext);
  window.addEventListener('keydown', keyNav);

  render();
}

init().catch(err => {
  console.error(err);
  els.counter.textContent = 'Error cargando data.json';
});
