/**
 * Proyecto — ruta /proyecto/<slug> o ?p=<slug>&s=<n>
 * Solo muestra ese proyecto. Sin bucle: prev deshabilitado en primera slide, next en última.
 */

const els = {
  app: document.getElementById("app"),
  title: document.getElementById("title"),
  date: document.getElementById("date"),
  paragraphs: document.getElementById("paragraphs"),
  counter: document.getElementById("counter"),
  prevBtn: document.getElementById("prevBtn"),
  nextBtn: document.getElementById("nextBtn"),
};

let canvasEl = null;
const state = { project: null, sIndex: 0 };

const asArray = (v) => (Array.isArray(v) ? v : v == null ? [] : [v]);

function pathSegments() {
  return location.pathname.split("/").filter(Boolean);
}
function getQuery() {
  const p = new URLSearchParams(location.search);
  return { p: p.get("p"), s: Number(p.get("s") || 0) || 0 };
}

async function loadData() {
  const res = await fetch("../data.json", { cache: "no-store" });
  if (!res.ok) throw new Error("No se pudo cargar data.json");
  const raw = await res.json();
  return normalize(raw);
}

function getYearOnly(s) {
  const m = (s || "").match(/\d{4}/);
  return m ? m[0] : "";
}

function normalize(raw) {
  const proyectos = asArray(raw.proyectos2 ?? raw.proyectos ?? []);
  const projects = proyectos.map((p, idx) => ({
    slug: p.slug ?? `proyecto-${idx + 1}`,
    titulo: p.titulo ?? p.slug ?? `Proyecto ${idx + 1}`,
    fecha: p.fecha ?? "",
    orden: typeof p.orden === "number" ? p.orden : undefined,
    slides: normalizeSlides(asArray(p.slides)),
  }));
  projects.forEach((p, i) => (p._i = i));
  projects.sort(
    (a, b) =>
      (typeof a.orden === "number" ? a.orden : a._i + 1) -
      (typeof b.orden === "number" ? b.orden : b._i + 1)
  );
  projects.forEach((p) => delete p._i);
  return { projects };
}

function toImagenesArray(val) {
  if (Array.isArray(val)) return val;
  if (val == null) return [];
  if (typeof val === "string") return [{ url: val }];
  if (typeof val === "object" && val.url) return [val];
  return [];
}
function normalizeSlides(slides) {
  const list = slides.map((s, i) => ({
    orden: typeof s.orden === "number" ? s.orden : undefined,
    parrafos: Array.isArray(s.texto)
      ? s.texto
      : typeof s.texto === "string"
      ? [s.texto]
      : [],
    imagenes: toImagenesArray(s.imagenes),
    background: s.background ?? null,
  }));
  list.forEach((s, i) => (s._i = i));
  list.sort(
    (a, b) =>
      (typeof a.orden === "number" ? a.orden : a._i + 1) -
      (typeof b.orden === "number" ? b.orden : b._i + 1)
  );
  list.forEach((s) => delete s._i);
  return list;
}

const IMAGE_EXT_RE = /\.(avif|webp|png|jpe?g|svg)$/i;
const isValidImgPath = (src) =>
  typeof src === "string" &&
  src.trim() !== "" &&
  !src.endsWith("/") &&
  IMAGE_EXT_RE.test(src);
const pickFirstValidImage = (pick) =>
  Array.isArray(pick)
    ? pick.find(isValidImgPath) || null
    : isValidImgPath(pick)
    ? pick
    : null;

function setBackground(slide) {
  const src = pickFirstValidImage(slide?.background);
  if (src) {
    const url = src.replace(/^\.\//, "");
    const test = new Image();
    test.onload = () => {
      els.app.style.backgroundImage = `url(${JSON.stringify(url)})`;
    };
    test.onerror = (e) => {
      console.warn(
        "[BG] No se pudo cargar el background (descartado):",
        url,
        e
      );
      els.app.style.backgroundImage = "none";
    };
    test.src = url;
  } else {
    els.app.style.backgroundImage = "none";
  }
}
function clear(el) {
  while (el.firstChild) el.removeChild(el.firstChild);
}
function renderImages(slide) {
  if (!canvasEl) return;
  clear(canvasEl);
  (slide.imagenes || []).forEach((it, idx) => {
    const url = it && it.url ? String(it.url) : "";
    if (!isValidImgPath(url)) {
      if (url.trim()) console.warn("[IMG] URL inválida descartada:", url);
      return;
    }
    const coords = Array.isArray(it.coords) ? it.coords : [0, 0];
    const left =
      typeof coords[0] === "number" ? coords[0] : parseFloat(coords[0]) || 0;
    const top =
      typeof coords[1] === "number" ? coords[1] : parseFloat(coords[1]) || 0;
    const img = document.createElement("img");
    img.className = "canvas__img";
    img.src = url.replace(/^\.\//, "");
    img.alt = it.alt || `img-${idx + 1}`;
    img.style.left = left + "vw";
    img.style.top = top + "vh";
    canvasEl.appendChild(img);
    requestAnimationFrame(() => img.classList.add("is-visible"));
  });
}

function animateRefresh() {
  els.app.classList.remove("appearing");
  void els.app.offsetWidth;
  els.app.classList.add("appearing");
}

function setDisabled(el, disabled) {
  el.classList.toggle("is-disabled", !!disabled);
  el.setAttribute("aria-disabled", disabled ? "true" : "false");
}

function render() {
  const { project, sIndex } = state;
  const slides = project.slides;
  const slide = slides[sIndex];

  const year = getYearOnly(project.fecha);
  els.title.textContent = year ? `${project.titulo}, ${year}` : project.titulo;
  if (els.date) els.date.textContent = "";

  els.paragraphs.innerHTML = "";
  slide.parrafos.forEach((t) => {
    const p = document.createElement("p");
    p.textContent = t;
    els.paragraphs.appendChild(p);
  });

  els.counter.textContent = `${sIndex + 1}/${slides.length}`;
  setBackground(slide);
  renderImages(slide);

  // Deshabilitar prev/next en extremos (sin bucle)
  setDisabled(els.prevBtn, sIndex === 0);
  setDisabled(els.nextBtn, sIndex === slides.length - 1);

  animateRefresh();
}

function goPrev() {
  if (state.sIndex > 0) {
    state.sIndex -= 1;
    render();
  }
}
function goNext() {
  if (state.sIndex < state.project.slides.length - 1) {
    state.sIndex += 1;
    render();
  }
}
function keyNav(e) {
  if (e.key === "ArrowLeft") goPrev();
  if (e.key === "ArrowRight") goNext();
}

function detectSlug() {
  const segs = pathSegments();
  // Esperamos /proyecto/<slug> o /carpeta/proyecto/<slug>
  const i = segs.lastIndexOf("proyecto");
  if (i >= 0 && i < segs.length - 1) return segs[i + 1];
  // fallback ?p=slug
  const q = new URLSearchParams(location.search);
  return q.get("p");
}

async function init() {
  const normalized = await loadData();
  const slug = detectSlug();
  const proj =
    normalized.projects.find((p) => p.slug === slug) || normalized.projects[0];
  state.project = proj;

  // slide inicial por ?s=N (fallback)
  const q = new URLSearchParams(location.search);
  const sParam = Number(q.get("s") || 0) || 0;
  state.sIndex = Math.max(0, Math.min(sParam, state.project.slides.length - 1));

  canvasEl = document.createElement("div");
  canvasEl.className = "canvas";
  els.app.appendChild(canvasEl);
  els.prevBtn.addEventListener("click", goPrev);
  els.nextBtn.addEventListener("click", goNext);
  window.addEventListener("keydown", keyNav);
  render();
}

init().catch((err) => {
  console.error(err);
  if (els.counter) els.counter.textContent = "Error cargando data.json";
});
