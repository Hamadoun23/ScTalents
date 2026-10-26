// Accueil : en-tête, menu plein écran, diaporama, textes animés au défilement,
// nuage de photos 3D, carrousel, formulaire de contact.

const reduit = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- En-tête : masqué quand on descend, visible quand on remonte ---------- */
const header = document.querySelector('[data-header]');
let dernierY = 0;
addEventListener('scroll', () => {
  const y = scrollY;
  header.classList.toggle('is-solid', y > 40);
  header.classList.toggle('is-hidden', y > 300 && y > dernierY && !document.body.classList.contains('no-scroll'));
  dernierY = y;
}, { passive: true });

/* ---------- Menu plein écran ---------- */
const boutonMenu = document.querySelector('.menu-btn');
const menu = document.getElementById('menu');
const libelle = document.querySelector('[data-menu-label]');

function ouvrirMenu(ouvert) {
  boutonMenu.setAttribute('aria-expanded', String(ouvert));
  libelle.textContent = ouvert ? 'Fermer' : 'Menu';
  document.body.classList.toggle('no-scroll', ouvert);
  if (ouvert) {
    menu.hidden = false;
    requestAnimationFrame(() => menu.classList.add('is-open'));
  } else {
    menu.classList.remove('is-open');
    setTimeout(() => { if (!menu.classList.contains('is-open')) menu.hidden = true; }, 800);
  }
}
boutonMenu.addEventListener('click', () => ouvrirMenu(boutonMenu.getAttribute('aria-expanded') !== 'true'));
menu.addEventListener('click', (e) => { if (e.target.closest('a')) ouvrirMenu(false); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') ouvrirMenu(false); });

/* ---------- Hero : titre animé + diaporama ---------- */
requestAnimationFrame(() => document.body.classList.add('is-loaded'));

const slides = [...document.querySelectorAll('.hero__slide')];
let courant = 0;

// Les images 2 et 3 ne sont chargées qu'après la page, pour garder un premier affichage léger
function chargerSlide(slide) {
  if (!slide.hasAttribute('data-lazy')) return;
  slide.querySelectorAll('[data-srcset]').forEach((s) => { s.srcset = s.dataset.srcset; });
  slide.querySelectorAll('[data-src]').forEach((i) => { i.src = i.dataset.src; });
  slide.removeAttribute('data-lazy');
}

if (!reduit && slides.length > 1) {
  addEventListener('load', () => slides.slice(1).forEach(chargerSlide));
  setInterval(() => {
    slides[courant].classList.remove('is-active');
    courant = (courant + 1) % slides.length;
    chargerSlide(slides[courant]);
    slides[courant].classList.add('is-active');
  }, 6000);
}

/* ---------- Apparitions simples ---------- */
const io = new IntersectionObserver((entrees) => {
  entrees.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
}, { rootMargin: '0px 0px -10% 0px' });
document.querySelectorAll('.reveal').forEach((el) => io.observe(el));

/* ---------- Textes découpés en mots, animés selon le défilement ----------
   data-reveal : les mots s'éclairent ; data-blur : les mots sortent du flou */
function decouper(bloc) {
  const mots = bloc.textContent.trim().split(/\s+/);
  bloc.textContent = '';
  mots.forEach((m, i) => {
    const span = document.createElement('span');
    span.className = 'w';
    span.textContent = m;
    bloc.append(span);
    if (i < mots.length - 1) bloc.append(' ');
  });
  return [...bloc.querySelectorAll('.w')];
}

// avancement d'un bloc : 0 quand il entre en bas de l'écran, 1 quand il atteint le haut du tiers
function avancement(el, debut = 0.9, fin = 0.35) {
  const r = el.getBoundingClientRect();
  return Math.min(1, Math.max(0, (innerHeight * debut - r.top) / (innerHeight * (debut - fin) + r.height * 0.5)));
}

const blocs = [...document.querySelectorAll('[data-reveal], [data-blur]')].map((el) => ({ el, mots: decouper(el) }));
function animerTextes() {
  blocs.forEach(({ el, mots }) => {
    const n = reduit ? mots.length : Math.round(avancement(el) * mots.length);
    mots.forEach((m, i) => m.classList.toggle('on', i < n));
  });
}

/* ---------- Nuage de photos : chaque carte glisse selon sa profondeur ---------- */
const work = document.querySelector('[data-work]');
const cartes = work ? [...work.querySelectorAll('.work__stage figure')] : [];
function animerNuage() {
  if (!work || reduit) return;
  const r = work.getBoundingClientRect();
  if (r.bottom < 0 || r.top > innerHeight) return;
  const p = (innerHeight - r.top) / (innerHeight + r.height) - 0.5;   // de -0.5 à 0.5
  cartes.forEach((c) => {
    const z = parseFloat(getComputedStyle(c).getPropertyValue('--z')) || 0;
    c.style.setProperty('--sy', `${p * (-260 - z * 1.2)}px`);
  });
}

addEventListener('scroll', () => { animerTextes(); animerNuage(); }, { passive: true });
animerTextes();
animerNuage();

/* ---------- Cartes de services : ouverture au toucher (mobile) ---------- */
document.querySelectorAll('.card').forEach((c) => {
  c.tabIndex = 0;
  c.addEventListener('click', () => c.classList.toggle('is-open'));
});

/* ---------- Carrousel des disciplines : points de position ---------- */
const rail = document.querySelector('[data-rail]');
const points = document.querySelector('[data-dots]');
if (rail && points) {
  const items = [...rail.children];
  items.forEach(() => points.append(document.createElement('i')));
  const majPoints = () => {
    const centre = rail.scrollLeft + rail.clientWidth / 2;
    let proche = 0;
    items.forEach((li, i) => {
      if (Math.abs(li.offsetLeft + li.offsetWidth / 2 - centre) < Math.abs(items[proche].offsetLeft + items[proche].offsetWidth / 2 - centre)) proche = i;
    });
    [...points.children].forEach((p, i) => p.classList.toggle('on', i === proche));
  };
  rail.addEventListener('scroll', majPoints, { passive: true });
  majPoints();
}

/* ---------- Formulaire de contact → table « messages » de Supabase ---------- */
const form = document.querySelector('[data-contact]');
const info = document.querySelector('[data-form-msg]');
if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(form));
    info.className = 'form__msg form__full';
    if (!d.nom.trim() || !d.message.trim() || !form.email.checkValidity() || !d.email || !d.accord) {
      info.textContent = 'Merci de remplir votre nom, un e-mail valide, votre message et de cocher la case.';
      info.classList.add('err');
      return;
    }
    const bouton = form.querySelector('button');
    bouton.disabled = true;
    bouton.textContent = 'Envoi…';
    try {
      // le client Supabase n'est chargé qu'au moment d'envoyer, pour alléger la page
      const { supabase, configured } = await import('./supabase.js');
      if (!configured) throw new Error('Supabase non configuré');
      const { error } = await supabase.from('messages').insert({
        nom: d.nom.trim(), email: d.email.trim(), telephone: d.telephone.trim() || null,
        profil: d.profil, message: d.message.trim(),
      });
      if (error) throw error;
      form.reset();
      info.textContent = 'Merci, votre message est bien envoyé. Nous vous répondons rapidement.';
      info.classList.add('ok');
    } catch (err) {
      console.error(err);
      info.textContent = 'L’envoi n’a pas abouti. Réessayez dans un instant.';
      info.classList.add('err');
    } finally {
      bouton.disabled = false;
      bouton.textContent = 'Envoyer';
    }
  });
}

document.getElementById('annee').textContent = new Date().getFullYear();
