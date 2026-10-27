// Back-office : connexion, publication des photos et vidéos, gestion de la liste, messages.
import { supabase, configured } from './supabase.js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';
import { DISCIPLINES, idYoutube } from './medias-locaux.js';
import { compresserImage, miniatureVideo, FORMAT, taille } from './compress.js';

const page = document.body.dataset.page;
const MAX_MP4 = 50 * 1024 * 1024;

/* ---------- Petits outils ---------- */
// Crée un élément ; le texte passe toujours par textContent (jamais d'innerHTML avec des données)
function el(tag, props = {}, ...enfants) {
  const e = Object.assign(document.createElement(tag), props);
  enfants.flat().forEach((c) => c != null && e.append(c));
  return e;
}
const $ = (s, r = document) => r.querySelector(s);
// Les médias livrés avec le site ont des chemins relatifs à la racine : on remonte d'un dossier
const abs = (u) => (!u || /^https?:/.test(u) ? u : '../' + u);
function message(zone, texte, type = '') {
  zone.textContent = texte;
  zone.className = 'msg ' + type;
}

/* ---------- Supabase non configuré : on le dit clairement ---------- */
if (!configured) {
  document.body.classList.remove('is-loading');
  const zone = $('[data-msg]') || $('[data-msg-medias]');
  message(zone, 'Supabase n’est pas encore configuré : renseignez SUPABASE_URL et SUPABASE_ANON_KEY dans site/js/config.js.', 'err');
}

/* =====================================================================
   PAGE DE CONNEXION
   ===================================================================== */
if (configured && page === 'login') {
  const { data } = await supabase.auth.getSession();
  if (data.session) location.replace('index.html');

  const form = $('[data-login]');
  const msg = $('[data-msg]');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const bouton = form.querySelector('button');
    bouton.disabled = true;
    message(msg, 'Connexion…');
    const { error } = await supabase.auth.signInWithPassword({
      email: form.email.value.trim(),
      password: form.password.value,
    });
    bouton.disabled = false;
    if (error) {
      message(msg, error.message.includes('Invalid') ? 'E-mail ou mot de passe incorrect.' : 'Connexion impossible : ' + error.message, 'err');
      return;
    }
    location.replace('index.html');
  });
}

/* =====================================================================
   BACK-OFFICE
   ===================================================================== */
// Garde : pas de session → retour à la connexion
const session = configured && page === 'admin' ? (await supabase.auth.getSession()).data.session : null;
if (configured && page === 'admin' && !session) location.replace('login.html');

if (session) {
  const data = { session };
  document.body.classList.remove('is-loading');
  $('[data-user]').textContent = data.session.user.email;
  $('[data-logout]').addEventListener('click', async () => {
    await supabase.auth.signOut();
    location.replace('login.html');
  });
  supabase.auth.onAuthStateChange((evt) => { if (evt === 'SIGNED_OUT') location.replace('login.html'); });

  /* ---------- Onglets ---------- */
  document.querySelectorAll('[data-tab]').forEach((t) => t.addEventListener('click', () => {
    document.querySelectorAll('[data-tab]').forEach((x) => {
      x.classList.toggle('is-on', x === t);
      x.setAttribute('aria-selected', String(x === t));
    });
    document.querySelectorAll('[data-panel]').forEach((p) => { p.hidden = p.dataset.panel !== t.dataset.tab; });
  }));

  // Listes déroulantes des disciplines
  document.querySelectorAll('[data-cats]').forEach((s) => {
    s.append(...Object.entries(DISCIPLINES).map(([v, l]) => el('option', { value: v, textContent: l })));
  });

  /* ---------- Envoi d'un fichier vers le stockage, avec progression ---------- */
  function chemin(dossier, ext) {
    const d = new Date();
    return `${dossier}/${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${crypto.randomUUID()}.${ext}`;
  }

  // XMLHttpRequest plutôt que le client Supabase : lui seul donne la progression de l'envoi
  async function envoyer(path, blob, mime, progression) {
    const { data: { session } } = await supabase.auth.getSession();
    await new Promise((ok, ko) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${SUPABASE_URL}/storage/v1/object/medias/${path}`);
      xhr.setRequestHeader('Authorization', `Bearer ${session.access_token}`);
      xhr.setRequestHeader('apikey', SUPABASE_ANON_KEY);
      xhr.setRequestHeader('Content-Type', mime);
      xhr.setRequestHeader('x-upsert', 'false');
      xhr.upload.onprogress = (e) => { if (e.lengthComputable && progression) progression(e.loaded / e.total); };
      xhr.onload = () => (xhr.status < 300 ? ok() : ko(new Error(`Stockage : ${xhr.status} ${xhr.responseText}`)));
      xhr.onerror = () => ko(new Error('Problème de connexion pendant l’envoi'));
      xhr.send(blob);
    });
    return supabase.storage.from('medias').getPublicUrl(path).data.publicUrl;
  }

  // Chemin dans le stockage à partir d'une URL publique (pour supprimer la miniature)
  function cheminDepuisUrl(url) {
    const m = String(url || '').match(/\/storage\/v1\/object\/public\/medias\/(.+)$/);
    return m ? decodeURIComponent(m[1]) : null;
  }

  function barre(zone, ratio, texte) {
    zone.hidden = false;
    zone.querySelector('i').style.width = `${Math.round(ratio * 100)}%`;
    zone.querySelector('span').textContent = texte;
  }

  const msgMedias = $('[data-msg-medias]');

  /* ---------- Photos : glisser-déposer, compression, envoi ---------- */
  const formPhotos = $('[data-form-photos]');
  const inputPhotos = $('[data-photos]');
  const drop = $('[data-drop]');
  const attente = $('[data-attente]');
  const progPhotos = $('[data-prog-photos]');
  let fichiers = [];   // { file, titre: <input> }

  function ajouterFichiers(liste) {
    [...liste].filter((f) => f.type.startsWith('image/')).forEach((file) => {
      const titre = el('input', { value: file.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' '), maxLength: 160, ariaLabel: 'Titre' });
      const apercu = el('img', { src: URL.createObjectURL(file), alt: '' });
      const item = { file, titre };
      const retirer = el('button', { type: 'button', className: 'lien', textContent: 'Retirer' });
      const li = el('li', {}, apercu, el('div', {}, titre, el('small', { textContent: taille(file.size) })), retirer);
      retirer.addEventListener('click', () => { fichiers = fichiers.filter((x) => x !== item); li.remove(); majBouton(); });
      item.li = li;
      fichiers.push(item);
      attente.append(li);
    });
    majBouton();
  }
  function majBouton() {
    const b = $('[data-envoyer-photos]');
    b.disabled = !fichiers.length;
    b.textContent = fichiers.length ? `Publier ${fichiers.length} photo${fichiers.length > 1 ? 's' : ''}` : 'Publier les photos';
  }

  inputPhotos.addEventListener('change', () => { ajouterFichiers(inputPhotos.files); inputPhotos.value = ''; });
  ['dragenter', 'dragover'].forEach((t) => drop.addEventListener(t, (e) => { e.preventDefault(); drop.classList.add('is-over'); }));
  ['dragleave', 'drop'].forEach((t) => drop.addEventListener(t, (e) => { e.preventDefault(); drop.classList.remove('is-over'); }));
  drop.addEventListener('drop', (e) => ajouterFichiers(e.dataTransfer.files));

  formPhotos.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!fichiers.length) return;
    const categorie = formPhotos.categorie.value;
    const description = formPhotos.description.value.trim() || null;
    const total = fichiers.length;
    let faits = 0;
    let avant = 0;
    let apres = 0;
    formPhotos.querySelectorAll('button, input, select, textarea').forEach((x) => { x.disabled = true; });
    message(msgMedias, '');

    for (const item of [...fichiers]) {
      try {
        barre(progPhotos, faits / total, `Compression de « ${item.titre.value} »…`);
        const { full, thumb, mime, ext } = await compresserImage(item.file);
        avant += item.file.size;
        apres += full.size;
        const pFull = chemin('images', ext);
        const pThumb = pFull.replace(/^images\//, 'thumbs/').replace(/\.\w+$/, '.' + FORMAT.ext);
        const url = await envoyer(pFull, full, mime, (r) => barre(progPhotos, (faits + r * 0.9) / total, `${faits}/${total} envoyées · ${taille(full.size)}`));
        const thumb_url = await envoyer(pThumb, thumb, FORMAT.mime);
        const { error } = await supabase.from('medias').insert({
          type: 'image', source: 'upload', titre: item.titre.value.trim() || 'Photo', description, categorie,
          url, thumb_url, storage_path: pFull,
        });
        if (error) throw error;
        faits += 1;
        item.li.remove();
        fichiers = fichiers.filter((x) => x !== item);
        barre(progPhotos, faits / total, `${faits}/${total} envoyées`);
      } catch (err) {
        console.error(err);
        message(msgMedias, `Échec pour « ${item.titre.value} » : ${err.message}`, 'err');
      }
    }

    formPhotos.querySelectorAll('button, input, select, textarea').forEach((x) => { x.disabled = false; });
    majBouton();
    if (faits) {
      formPhotos.description.value = '';
      message(msgMedias, `${faits}/${total} photo${faits > 1 ? 's' : ''} publiée${faits > 1 ? 's' : ''} · ${taille(avant)} → ${taille(apres)} après compression.`, 'ok');
      chargerMedias();
    }
    setTimeout(() => { progPhotos.hidden = true; }, 2500);
  });

  /* ---------- Vidéo : lien YouTube ou fichier MP4 ---------- */
  const formVideo = $('[data-form-video]');
  const progVideo = $('[data-prog-video]');
  formVideo.addEventListener('change', (e) => {
    if (e.target.name !== 'mode') return;
    formVideo.querySelectorAll('[data-mode]').forEach((z) => { z.hidden = z.dataset.mode !== e.target.value; });
  });

  formVideo.addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = formVideo;
    const mode = f.mode.value;
    const titre = f.titre.value.trim();
    const description = f.description.value.trim() || null;
    const categorie = f.categorie.value;
    if (!titre) { message(msgMedias, 'Donnez un titre à la vidéo.', 'err'); f.titre.focus(); return; }

    const bouton = f.querySelector('button[type=submit]');
    bouton.disabled = true;
    try {
      let ligne;
      if (mode === 'youtube') {
        const id = idYoutube(f.lien.value.trim());
        if (!id) throw new Error('Lien YouTube non reconnu. Exemple : https://youtu.be/abcdefghijk');
        ligne = { source: 'youtube', url: `https://www.youtube.com/watch?v=${id}`, thumb_url: `https://img.youtube.com/vi/${id}/hqdefault.jpg` };
      } else {
        const file = f.fichier.files[0];
        if (!file) throw new Error('Choisissez un fichier MP4.');
        if (file.size > MAX_MP4) throw new Error(`Fichier trop lourd (${taille(file.size)}, 50 Mo maximum). Publiez plutôt la vidéo sur YouTube (même « non répertoriée ») et collez le lien.`);
        const pVideo = chemin('videos', 'mp4');
        const url = await envoyer(pVideo, file, 'video/mp4', (r) => barre(progVideo, r, `Envoi de la vidéo… ${Math.round(r * 100)} % (${taille(file.size)})`));
        let thumb_url = null;
        const affiche = await miniatureVideo(file);
        if (affiche) thumb_url = await envoyer(pVideo.replace(/^videos\//, 'thumbs/').replace(/\.mp4$/, '.' + FORMAT.ext), affiche, FORMAT.mime);
        ligne = { source: 'upload', url, thumb_url, storage_path: pVideo };
      }
      const { error } = await supabase.from('medias').insert({ type: 'video', titre, description, categorie, ...ligne });
      if (error) throw error;
      f.reset();
      f.querySelectorAll('[data-mode]').forEach((z) => { z.hidden = z.dataset.mode !== 'youtube'; });
      message(msgMedias, `Vidéo « ${titre} » publiée.`, 'ok');
      chargerMedias();
    } catch (err) {
      console.warn(err);
      message(msgMedias, err.message, 'err');
    } finally {
      bouton.disabled = false;
      setTimeout(() => { progVideo.hidden = true; }, 2500);
    }
  });

  /* ---------- Liste des médias : modifier, masquer, supprimer ---------- */
  const zoneMedias = $('[data-medias]');
  let medias = [];
  let filtre = 'tout';

  async function chargerMedias() {
    const { data: lignes, error } = await supabase.from('medias').select('*')
      .order('ordre', { ascending: false }).order('created_at', { ascending: false });
    if (error) { message(msgMedias, 'Impossible de charger les médias : ' + error.message, 'err'); return; }
    medias = lignes;
    afficherMedias();
  }

  async function modifier(id, champs, zoneEtat) {
    zoneEtat.textContent = 'Enregistrement…';
    const { error } = await supabase.from('medias').update(champs).eq('id', id);
    zoneEtat.textContent = error ? 'Erreur : ' + error.message : 'Enregistré ✓';
    zoneEtat.className = 'etat ' + (error ? 'err' : 'ok');
    if (!error) Object.assign(medias.find((m) => m.id === id), champs);
    setTimeout(() => { zoneEtat.textContent = ''; }, 2000);
  }

  function ligneMedia(m) {
    const etat = el('small', { className: 'etat' });
    const img = el('img', { src: abs(m.thumb_url) || abs(m.url), alt: '', loading: 'lazy' });
    const vignette = el('a', { href: m.source === 'youtube' ? m.url : abs(m.url), target: '_blank', rel: 'noopener', className: 'vignette' + (m.type === 'video' ? ' is-video' : ''), title: 'Ouvrir' }, img);

    const titre = el('input', { value: m.titre, maxLength: 160, ariaLabel: 'Titre' });
    titre.addEventListener('change', () => modifier(m.id, { titre: titre.value.trim() || 'Sans titre' }, etat));

    const desc = el('textarea', { value: m.description || '', rows: 2, maxLength: 1000, placeholder: 'Description', ariaLabel: 'Description' });
    desc.addEventListener('change', () => modifier(m.id, { description: desc.value.trim() || null }, etat));

    const cat = el('select', { ariaLabel: 'Discipline' }, Object.entries(DISCIPLINES).map(([v, l]) => el('option', { value: v, textContent: l, selected: v === m.categorie })));
    cat.addEventListener('change', () => modifier(m.id, { categorie: cat.value }, etat));

    const pub = el('input', { type: 'checkbox', checked: m.publie });
    const libPub = el('span', { textContent: m.publie ? 'Publié' : 'Masqué' });
    pub.addEventListener('change', async () => {
      libPub.textContent = pub.checked ? 'Publié' : 'Masqué';
      await modifier(m.id, { publie: pub.checked }, etat);
      li.classList.toggle('is-masque', !pub.checked);
    });

    const epingle = el('button', { type: 'button', className: 'lien', textContent: m.ordre > 0 ? 'Désépingler' : 'Épingler en premier' });
    epingle.addEventListener('click', async () => {
      const ordre = m.ordre > 0 ? 0 : Math.max(0, ...medias.map((x) => x.ordre)) + 1;
      await modifier(m.id, { ordre }, etat);
      afficherMedias();
    });

    const suppr = el('button', { type: 'button', className: 'lien danger', textContent: 'Supprimer' });
    suppr.addEventListener('click', async () => {
      if (!confirm(`Supprimer définitivement « ${m.titre} » ? Le fichier sera aussi effacé.`)) return;
      // fichier principal + miniature dans le stockage (rien pour YouTube ni pour les médias livrés avec le site)
      const chemins = [m.storage_path, cheminDepuisUrl(m.thumb_url)].filter(Boolean);
      if (chemins.length) {
        const { error } = await supabase.storage.from('medias').remove(chemins);
        if (error) { message(msgMedias, 'Fichier non supprimé : ' + error.message, 'err'); return; }
      }
      const { error } = await supabase.from('medias').delete().eq('id', m.id);
      if (error) { message(msgMedias, 'Suppression impossible : ' + error.message, 'err'); return; }
      medias = medias.filter((x) => x.id !== m.id);
      afficherMedias();
      message(msgMedias, `« ${m.titre} » supprimé.`, 'ok');
    });

    const type = m.type === 'video' ? (m.source === 'youtube' ? 'Vidéo YouTube' : 'Vidéo MP4') : 'Photo';
    const date = new Date(m.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });

    const li = el('li', { className: m.publie ? '' : 'is-masque' },
      vignette,
      el('div', { className: 'champs-media' }, titre, desc,
        el('div', { className: 'ligne' }, cat, el('label', { className: 'switch' }, pub, el('i'), libPub), etat)),
      el('div', { className: 'actions' }, el('small', { textContent: `${type} · ${date}` }), epingle, suppr));
    return li;
  }

  function afficherMedias() {
    const liste = medias.filter((m) => filtre === 'tout' || (filtre === 'masque' ? !m.publie : m.type === filtre));
    zoneMedias.replaceChildren(...liste.map(ligneMedia));
    if (!liste.length) zoneMedias.append(el('li', { className: 'vide', textContent: 'Aucun média ici pour le moment.' }));
    $('[data-compte]').textContent = `(${medias.filter((m) => m.publie).length} publiés · ${medias.length} au total)`;
  }

  $('[data-filtre-admin]').addEventListener('click', (e) => {
    const b = e.target.closest('[data-f]');
    if (!b) return;
    filtre = b.dataset.f;
    e.currentTarget.querySelectorAll('.chip').forEach((c) => c.classList.toggle('is-on', c === b));
    afficherMedias();
  });

  /* ---------- Messages ---------- */
  const zoneMsg = $('[data-messages]');
  const badge = $('[data-badge]');
  let messages = [];

  async function chargerMessages() {
    const { data: lignes, error } = await supabase.from('messages').select('*').order('created_at', { ascending: false });
    if (error) { zoneMsg.replaceChildren(el('li', { className: 'vide', textContent: 'Erreur : ' + error.message })); return; }
    messages = lignes;
    afficherMessages();
  }

  function afficherMessages() {
    const nonLus = messages.filter((m) => !m.lu).length;
    badge.hidden = !nonLus;
    badge.textContent = nonLus;
    if (!messages.length) { zoneMsg.replaceChildren(el('li', { className: 'vide', textContent: 'Aucun message pour le moment.' })); return; }
    zoneMsg.replaceChildren(...messages.map((m) => {
      const lu = el('button', { type: 'button', className: 'lien', textContent: m.lu ? 'Marquer non lu' : 'Marquer comme lu' });
      lu.addEventListener('click', async () => {
        const { error } = await supabase.from('messages').update({ lu: !m.lu }).eq('id', m.id);
        if (!error) { m.lu = !m.lu; afficherMessages(); }
      });
      const suppr = el('button', { type: 'button', className: 'lien danger', textContent: 'Supprimer' });
      suppr.addEventListener('click', async () => {
        if (!confirm(`Supprimer le message de ${m.nom} ?`)) return;
        const { error } = await supabase.from('messages').delete().eq('id', m.id);
        if (!error) { messages = messages.filter((x) => x.id !== m.id); afficherMessages(); }
      });
      const date = new Date(m.created_at).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' });
      return el('li', { className: m.lu ? '' : 'non-lu' },
        el('div', { className: 'msg-tete' },
          el('b', { textContent: m.nom }),
          el('span', { textContent: m.profil || '' }),
          el('time', { textContent: date })),
        el('div', { className: 'msg-contact' },
          el('a', { href: `mailto:${m.email}`, textContent: m.email }),
          m.telephone ? el('a', { href: `tel:${m.telephone.replace(/\s/g, '')}`, textContent: m.telephone }) : null,
          m.telephone ? el('a', { href: `https://wa.me/${m.telephone.replace(/\D/g, '')}`, target: '_blank', rel: 'noopener', textContent: 'WhatsApp' }) : null),
        el('p', { className: 'msg-texte', textContent: m.message }),
        el('div', { className: 'actions' }, lu, suppr));
    }));
  }

  chargerMedias();
  chargerMessages();
}
