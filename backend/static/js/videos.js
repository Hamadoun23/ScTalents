// Vidéos du site : lecture automatique (muette) quand elles sont à l'écran,
// pause sinon, téléchargement seulement à l'approche ; YouTube chargé au clic.

const reduit = matchMedia('(prefers-reduced-motion: reduce)').matches;

// 1) on ne télécharge une vidéo que lorsqu'elle approche de l'écran
const approche = new IntersectionObserver((entrees) => {
  entrees.forEach((e) => {
    if (!e.isIntersecting) return;
    const v = e.target;
    if (v.dataset.src && !v.src) v.src = v.dataset.src;
    approche.unobserve(v);
  });
}, { rootMargin: '400px 0px' });

// 2) lecture quand au moins la moitié de la vidéo est visible, pause sinon
const visible = new IntersectionObserver((entrees) => {
  entrees.forEach((e) => {
    const v = e.target;
    // une vidéo prise en main par le visiteur ne se relance plus toute seule
    if (e.intersectionRatio >= 0.5 && !reduit && !v.dataset.manuel) {
      if (!v.src && v.dataset.src) v.src = v.dataset.src;
      v.play().catch(() => {});
    } else {
      v.pause();
    }
  });
}, { threshold: [0, 0.5] });

document.querySelectorAll('video[data-auto]').forEach((v) => {
  v.muted = true;            // obligatoire pour la lecture automatique sur mobile
  v.title = 'Cliquer pour lire avec le son et les commandes';
  approche.observe(v);
  visible.observe(v);
});

// Clic sur une vidéo : commandes complètes (lecture, pause, avancer, revenir, plein écran) et son
function prendreEnMain(v) {
  document.querySelectorAll('video[data-auto]').forEach((x) => {
    if (x !== v) { x.muted = true; x.parentElement.querySelector('.snd')?.classList.remove('is-on'); }
  });
  if (!v.src && v.dataset.src) v.src = v.dataset.src;
  v.dataset.manuel = '1';
  v.controls = true;
  v.muted = false;
  v.removeAttribute('title');
  v.parentElement.classList.add('is-manuel');   // masque le bouton « Son » : les commandes ont le volume
  v.play().catch(() => {});
}
document.addEventListener('click', (e) => {
  const v = e.target.closest('video[data-auto]');
  if (v && !v.controls) { e.preventDefault(); prendreEnMain(v); }
});

document.addEventListener('click', (e) => {
  // bouton « Son » : une seule vidéo avec le son à la fois
  const b = e.target.closest('.snd');
  if (b) {
    const v = b.parentElement.querySelector('video');
    const activer = v.muted;
    document.querySelectorAll('video[data-auto]').forEach((x) => {
      x.muted = true;
      x.parentElement.querySelector('.snd')?.classList.remove('is-on');
    });
    if (activer) { v.muted = false; v.play().catch(() => {}); b.classList.add('is-on'); }
    b.setAttribute('aria-label', activer ? 'Couper le son' : 'Activer le son');
    return;
  }
  // YouTube : le lecteur n'est créé qu'au clic (rien n'est chargé depuis YouTube avant)
  const y = e.target.closest('[data-yt]');
  if (y) {
    const f = document.createElement('iframe');
    f.src = `https://www.youtube-nocookie.com/embed/${y.dataset.yt}?autoplay=1&rel=0`;
    f.title = 'Vidéo YouTube';
    f.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
    f.allowFullscreen = true;
    y.replaceWith(f);
  }
});
