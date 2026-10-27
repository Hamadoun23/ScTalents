// Galerie : chargement des médias publiés, filtres, pagination et visionneuse.
import { MEDIAS_LOCAUX, DISCIPLINES, idYoutube } from './medias-locaux.js';

const PAR_PAGE = 24;
const grille = document.querySelector('[data-grille]');
const vide = document.querySelector('[data-vide]');
const plus = document.querySelector('[data-plus]');
const zoneCat = document.querySelector('[data-filtre-cat]');

let tous = [];          // tous les médias publiés
let filtres = [];       // après filtre type + discipline
let affiches = 0;       // nombre déjà affichés
let type = 'tout';
let cat = 'tout';

/* ---------- Données : Supabase si configuré, sinon les médias livrés avec le site ---------- */
async function charger() {
  try {
    const { supabase, configured } = await import('./supabase.js');
    if (configured) {
      const { data, error } = await supabase.from('medias').select('*').eq('publie', true)
        .order('ordre', { ascending: false }).order('created_at', { ascending: false });
      if (error) throw error;
      if (data.length) return data;
    }
  } catch (e) {
    console.warn('Galerie : repli sur les médias locaux', e);
  }
  return MEDIAS_LOCAUX;
}

function miniature(m) {
  if (m.thumb_url) return m.thumb_url;
  if (m.source === 'youtube') return `https://img.youtube.com/vi/${idYoutube(m.url)}/hqdefault.jpg`;
  return m.url;
}

/* ---------- Filtres ---------- */
function construireFiltresCat() {
  const presentes = [...new Set(tous.map((m) => m.categorie))].filter((c) => DISCIPLINES[c]);
  const boutons = [['tout', 'Toutes disciplines'], ...presentes.map((c) => [c, DISCIPLINES[c]])];
  zoneCat.replaceChildren(...boutons.map(([val, lib]) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip' + (val === cat ? ' is-on' : '');
    b.dataset.cat = val;
    b.textContent = lib;
    return b;
  }));
}

function appliquer() {
  filtres = tous.filter((m) => (type === 'tout' || m.type === type) && (cat === 'tout' || m.categorie === cat));
  grille.replaceChildren();
  affiches = 0;
  afficherSuite();
  vide.hidden = filtres.length > 0;
}

function afficherSuite() {
  const lot = filtres.slice(affiches, affiches + PAR_PAGE);
  lot.forEach((m, k) => grille.append(carte(m, affiches + k)));
  affiches += lot.length;
  plus.hidden = affiches >= filtres.length;
}

// Carte de la grille (texte inséré avec textContent : jamais de HTML venant de la base)
function carte(m, index) {
  const li = document.createElement('li');
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'gal__item' + (m.type === 'video' ? ' is-video' : '');
  b.dataset.index = index;

  const img = document.createElement('img');
  img.src = miniature(m);
  img.alt = m.titre || '';
  img.loading = 'lazy';

  const legende = document.createElement('span');
  legende.className = 'gal__cap';
  const t = document.createElement('b');
  t.textContent = m.titre || '';
  const d = document.createElement('small');
  d.textContent = DISCIPLINES[m.categorie] || '';
  legende.append(t, d);

  b.append(img, legende);
  if (m.type === 'video') {
    const play = document.createElement('span');
    play.className = 'gal__play';
    play.setAttribute('aria-hidden', 'true');
    b.append(play);
  }
  li.append(b);
  return li;
}

document.querySelector('[data-filtre-type]').addEventListener('click', (e) => {
  const b = e.target.closest('[data-type]');
  if (!b) return;
  type = b.dataset.type;
  e.currentTarget.querySelectorAll('.chip').forEach((c) => c.classList.toggle('is-on', c === b));
  appliquer();
});
zoneCat.addEventListener('click', (e) => {
  const b = e.target.closest('[data-cat]');
  if (!b) return;
  cat = b.dataset.cat;
  zoneCat.querySelectorAll('.chip').forEach((c) => c.classList.toggle('is-on', c === b));
  appliquer();
});
plus.addEventListener('click', afficherSuite);

/* ---------- Visionneuse ---------- */
const lb = document.querySelector('[data-lb]');
const zoneMedia = lb.querySelector('[data-lb-media]');
let courant = 0;
let dernierFocus = null;

function ouvrir(i) {
  courant = (i + filtres.length) % filtres.length;
  const m = filtres[courant];
  zoneMedia.replaceChildren();

  if (m.type === 'image') {
    const img = document.createElement('img');
    img.src = m.url;
    img.alt = m.titre || '';
    zoneMedia.append(img);
  } else if (m.source === 'youtube') {
    // l'iframe n'est créée qu'à l'ouverture : rien n'est chargé depuis YouTube avant le clic
    const f = document.createElement('iframe');
    f.src = `https://www.youtube-nocookie.com/embed/${idYoutube(m.url)}?autoplay=1&rel=0`;
    f.title = m.titre || 'Vidéo';
    f.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
    f.allowFullscreen = true;
    zoneMedia.append(f);
  } else {
    const v = document.createElement('video');
    v.src = m.url;
    v.controls = true;
    v.playsInline = true;
    v.preload = 'none';
    if (m.thumb_url) v.poster = m.thumb_url;
    zoneMedia.append(v);
    v.play().catch(() => {});
  }

  lb.querySelector('[data-lb-titre]').textContent = m.titre || '';
  lb.querySelector('[data-lb-desc]').textContent = m.description || '';
  lb.querySelector('[data-lb-meta]').textContent =
    `${String(courant + 1).padStart(2, '0')} / ${String(filtres.length).padStart(2, '0')} · ${DISCIPLINES[m.categorie] || ''}`;

  if (lb.hidden) {
    dernierFocus = document.activeElement;
    lb.hidden = false;
    document.body.classList.add('no-scroll');
    lb.querySelector('[data-lb-fermer]').focus();
  }
}

function fermer() {
  zoneMedia.replaceChildren();   // arrête la vidéo en cours
  lb.hidden = true;
  document.body.classList.remove('no-scroll');
  dernierFocus?.focus();
}

grille.addEventListener('click', (e) => {
  const b = e.target.closest('[data-index]');
  if (b) ouvrir(Number(b.dataset.index));
});
lb.querySelector('[data-lb-fermer]').addEventListener('click', fermer);
lb.querySelector('[data-lb-prev]').addEventListener('click', () => ouvrir(courant - 1));
lb.querySelector('[data-lb-next]').addEventListener('click', () => ouvrir(courant + 1));
lb.addEventListener('click', (e) => { if (e.target === lb) fermer(); });   // clic sur le fond
document.addEventListener('keydown', (e) => {
  if (lb.hidden) return;
  if (e.key === 'Escape') fermer();
  if (e.key === 'ArrowLeft') ouvrir(courant - 1);
  if (e.key === 'ArrowRight') ouvrir(courant + 1);
});

// glisser du doigt sur mobile
let x0 = null;
lb.addEventListener('touchstart', (e) => { x0 = e.touches[0].clientX; }, { passive: true });
lb.addEventListener('touchend', (e) => {
  if (x0 === null) return;
  const dx = e.changedTouches[0].clientX - x0;
  if (Math.abs(dx) > 50 && e.target.tagName !== 'VIDEO') ouvrir(courant + (dx < 0 ? 1 : -1));
  x0 = null;
});

/* ---------- Démarrage ---------- */
tous = await charger();
construireFiltresCat();
appliquer();
