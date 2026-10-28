// Galerie racontée : vidéos lues automatiquement à l'écran, repère de chapitre,
// et « Le fil » alimenté par les publications du back-office.
import { MEDIAS_LOCAUX, DISCIPLINES, idYoutube } from './medias-locaux.js';

const reduit = matchMedia('(prefers-reduced-motion: reduce)').matches;
const PAR_LOT = 8;

/* ---------- Vidéos : chargées à l'approche, lues quand elles sont visibles ---------- */
// 1) on ne télécharge une vidéo que lorsqu'elle approche de l'écran
const approche = new IntersectionObserver((entrees) => {
  entrees.forEach((e) => {
    if (!e.isIntersecting) return;
    const v = e.target;
    if (v.dataset.src && !v.src) { v.src = v.dataset.src; v.preload = 'auto'; }
    approche.unobserve(v);
  });
}, { rootMargin: '400px 0px' });

// 2) lecture quand au moins la moitié de la vidéo est à l'écran, pause sinon
const visible = new IntersectionObserver((entrees) => {
  entrees.forEach((e) => {
    const v = e.target;
    if (e.intersectionRatio >= 0.5 && !reduit) {
      if (!v.src && v.dataset.src) v.src = v.dataset.src;
      v.play().catch(() => {});
    } else {
      v.pause();
    }
  });
}, { threshold: [0, 0.5] });

function brancherVideo(v) {
  v.muted = true;            // obligatoire pour la lecture automatique sur mobile
  approche.observe(v);
  visible.observe(v);
}
document.querySelectorAll('video[data-auto]').forEach(brancherVideo);

/* ---------- Bouton « Son » : une seule vidéo avec le son à la fois ---------- */
document.addEventListener('click', (e) => {
  const b = e.target.closest('.snd');
  if (!b) return;
  const v = b.parentElement.querySelector('video');
  const activer = v.muted;
  document.querySelectorAll('video[data-auto]').forEach((x) => {
    x.muted = true;
    x.parentElement.querySelector('.snd')?.classList.remove('is-on');
  });
  if (activer) {
    v.muted = false;
    v.play().catch(() => {});
    b.classList.add('is-on');
  }
  b.setAttribute('aria-label', activer ? 'Couper le son' : 'Activer le son');
});

/* ---------- Repère du chapitre en cours ---------- */
const tag = document.querySelector('[data-chap-tag]');
const chapitres = new IntersectionObserver((entrees) => {
  entrees.forEach((e) => {
    if (!e.isIntersecting) return;
    tag.querySelector('b').textContent = e.target.dataset.chap;
    tag.querySelector('span').textContent = e.target.dataset.nom;
    tag.classList.add('on');
  });
}, { rootMargin: '-45% 0px -45% 0px' });
document.querySelectorAll('[data-chap]').forEach((c) => chapitres.observe(c));
// masqué sur l'ouverture et la fin
const horsChap = new IntersectionObserver((entrees) => {
  entrees.forEach((e) => { if (e.isIntersecting) tag.classList.remove('on'); });
}, { rootMargin: '-45% 0px -45% 0px' });
document.querySelectorAll('.g-hero, .g-end').forEach((s) => horsChap.observe(s));

/* ---------- Apparition douce des médias ---------- */
const io = new IntersectionObserver((entrees) => {
  entrees.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
}, { rootMargin: '0px 0px -8% 0px' });
document.querySelectorAll('.ch__head, .m, .faces figure').forEach((el) => io.observe(el));

/* ---------- Le fil : publications du back-office qui ne sont pas déjà dans le récit ---------- */
const fil = document.querySelector('[data-fil]');
const liste = document.querySelector('[data-fil-list]');
const plus = document.querySelector('[data-fil-plus]');

// Chemins déjà utilisés par les chapitres (pour ne pas les montrer deux fois)
const dejaRacontes = new Set([...document.querySelectorAll('main img[src], main video[data-src]')]
  .map((el) => el.getAttribute('data-src') || el.getAttribute('src')));
const dejaRaconte = (m) => dejaRacontes.has(m.url);

async function charger() {
  try {
    const { supabase, configured } = await import('./supabase.js');
    if (configured) {
      const { data, error } = await supabase.from('medias').select('*').eq('publie', true)
        .order('ordre', { ascending: false }).order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }
  } catch (e) {
    console.warn('Le fil : Supabase indisponible, médias locaux utilisés', e);
  }
  return MEDIAS_LOCAUX;
}

// Carte du fil (texte inséré avec textContent : jamais de HTML venant de la base)
function carte(m) {
  const fig = document.createElement('figure');
  fig.className = 'm fil__item' + (m.type === 'video' ? ' m--video' : '');

  if (m.type === 'image') {
    const img = document.createElement('img');
    img.src = m.url;
    img.alt = m.titre || '';
    img.loading = 'lazy';
    fig.append(img);
  } else if (m.source === 'youtube') {
    // YouTube : miniature, et lecteur chargé seulement au clic
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'yt';
    b.setAttribute('aria-label', `Lire la vidéo « ${m.titre} »`);
    const img = document.createElement('img');
    img.src = m.thumb_url || `https://img.youtube.com/vi/${idYoutube(m.url)}/hqdefault.jpg`;
    img.alt = '';
    img.loading = 'lazy';
    b.append(img);
    b.addEventListener('click', () => {
      const f = document.createElement('iframe');
      f.src = `https://www.youtube-nocookie.com/embed/${idYoutube(m.url)}?autoplay=1&rel=0`;
      f.title = m.titre || 'Vidéo';
      f.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
      f.allowFullscreen = true;
      b.replaceWith(f);
    });
    fig.append(b);
  } else {
    const v = document.createElement('video');
    v.dataset.auto = '';
    v.dataset.src = m.url;
    v.loop = true;
    v.playsInline = true;
    v.preload = 'none';
    if (m.thumb_url) v.poster = m.thumb_url;
    const son = document.createElement('button');
    son.type = 'button';
    son.className = 'snd';
    son.setAttribute('aria-label', 'Activer le son');
    son.textContent = 'Son';
    fig.append(v, son);
    brancherVideo(v);
  }

  const cap = document.createElement('figcaption');
  const t = document.createElement('b');
  t.textContent = m.titre || '';
  cap.append(t);
  if (m.description) {
    const d = document.createElement('span');
    d.textContent = m.description;
    cap.append(d);
  }
  const meta = document.createElement('small');
  const date = m.created_at ? new Date(m.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '';
  meta.textContent = [DISCIPLINES[m.categorie], date].filter(Boolean).join(' · ');
  cap.append(meta);
  fig.append(cap);
  io.observe(fig);
  return fig;
}

const medias = (await charger()).filter((m) => !dejaRaconte(m));
let affiches = 0;
function suite() {
  medias.slice(affiches, affiches + PAR_LOT).forEach((m) => liste.append(carte(m)));
  affiches = Math.min(affiches + PAR_LOT, medias.length);
  plus.hidden = affiches >= medias.length;
}
if (medias.length) {
  fil.hidden = false;
  suite();
  plus.addEventListener('click', suite);
}
