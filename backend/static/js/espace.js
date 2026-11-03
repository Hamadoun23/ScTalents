// Espace admin : ajout de lignes (carrière, langues), progression d'envoi des vidéos,
// confirmation avant suppression.

{   // bloc : le script peut être relancé quand la page suivante est réaffichée après un envoi
// « + Ajouter un club » / « + Ajouter une langue » : copie le modèle vide du formulaire
document.querySelectorAll('[data-ajouter]').forEach((bouton) => {
  bouton.addEventListener('click', () => {
    const prefixe = bouton.dataset.ajouter;
    const total = document.querySelector(`#id_${prefixe}-TOTAL_FORMS`);
    const modele = document.querySelector(`template[data-modele="${prefixe}"]`);
    const n = Number(total.value);
    const div = document.createElement('div');
    div.innerHTML = modele.innerHTML.replace(/__prefix__/g, n);
    const ligne = div.firstElementChild;
    document.querySelector(`[data-lignes="${prefixe}"]`).append(ligne);
    total.value = n + 1;
    ligne.querySelector('input:not([type=hidden]), select')?.focus();
  });
});

// Envoi d'une vidéo : barre de progression (les fichiers vidéo sont souvent lourds)
const formVideo = document.querySelector('[data-envoi]');
if (formVideo) {
  formVideo.addEventListener('submit', (e) => {
    const fichier = formVideo.querySelector('input[type=file][name=fichier]');
    if (!fichier || !fichier.files.length) return;      // pas de fichier : envoi normal
    e.preventDefault();
    const zone = document.querySelector('[data-progression]');
    const barre = zone.querySelector('i');
    const texte = zone.querySelector('span');
    zone.hidden = false;
    formVideo.querySelectorAll('button').forEach((b) => { b.disabled = true; });

    const xhr = new XMLHttpRequest();
    xhr.open('POST', formVideo.action || location.href);
    xhr.upload.onprogress = (ev) => {
      if (!ev.lengthComputable) return;
      const p = Math.round((ev.loaded / ev.total) * 100);
      barre.style.width = p + '%';
      texte.textContent = p < 100 ? `Envoi de la vidéo : ${p} % — ne fermez pas la page.` : 'Envoi terminé, enregistrement…';
    };
    xhr.onload = () => {
      // le serveur renvoie la page suivante (avec son message de confirmation) : on l'affiche
      // telle quelle, et on met la bonne adresse dans la barre du navigateur
      if (xhr.responseURL) history.replaceState(null, '', xhr.responseURL);
      document.open(); document.write(xhr.responseText); document.close();
    };
    xhr.onerror = () => {
      texte.textContent = 'La connexion a été coupée pendant l’envoi. Vérifiez votre connexion et réessayez.';
      formVideo.querySelectorAll('button').forEach((b) => { b.disabled = false; });
    };
    xhr.send(new FormData(formVideo));
  });
}

// Confirmation simple avant certaines suppressions
document.querySelectorAll('form[data-confirmer]').forEach((f) => {
  f.addEventListener('submit', (e) => { if (!confirm(f.dataset.confirmer)) e.preventDefault(); });
});
}
