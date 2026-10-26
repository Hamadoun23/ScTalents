# Guide pratique — Développer le site SC+ ce soir avec Claude Code

Durée estimée : **3 h 30 à 4 h**. Chaque étape = un prompt à copier-coller dans Claude Code,
puis tu testes avant de passer à la suivante.

---

## Étape 0 — Préparation (15 min, sans Claude Code)

### 0.1 Supabase
1. Crée un compte sur https://supabase.com → **New project** (région : Europe, ex. Frankfurt/Paris).
   Note le mot de passe de la base quelque part.
2. **SQL Editor** → New query → colle tout le fichier `supabase/schema.sql` → **Run**.
3. **Authentication → Sign In / Providers** → désactive **« Allow new users to sign up »**. ⚠️ Important.
4. **Authentication → Users → Add user → Create new user** : ton e-mail admin + mot de passe
   (coche « Auto confirm user »).
5. **Project Settings → API** (ou Data API / API Keys) : copie **Project URL** et la clé **anon / publishable**.
   ❌ Ne copie jamais la clé `service_role` / `secret`.

### 0.2 Ton dossier
Dans `C:\Users\cisse\Downloads\ScTalents` tu as déjà : `CLAUDE.md`, `CAHIER_DES_CHARGES.md`,
`supabase/schema.sql`, le logo et la présentation PDF.

### 0.3 Lancer Claude Code
Ouvre un terminal dans le dossier (clic droit → « Ouvrir dans le terminal ») puis :
```
claude
```
Claude Code lit automatiquement `CLAUDE.md`.

---

## Étape 1 — Structure + design de l'accueil (45 min)

```
Lis CLAUDE.md et CAHIER_DES_CHARGES.md. Crée l'arborescence site/ décrite dans CLAUDE.md.
Copie "WhatsApp Image 2026-10-22 at 13.38.52.jpeg" vers site/assets/img/logo.jpg.
Crée site/js/config.js avec :
  SUPABASE_URL = "COLLE_ICI"
  SUPABASE_ANON_KEY = "COLLE_ICI"
et site/js/supabase.js qui exporte le client.
Puis construis site/index.html + site/css/style.css + site/js/main.js avec toutes les sections
du §5 "Accueil" du cahier des charges (textes tirés de Presentation_SC_Plus_Talent_and_Sports.pdf),
la charte du §6 (bleu nuit + or, Montserrat/Inter, liseré vert-jaune-rouge), menu burger sur mobile.
Pour l'instant la section "Aperçu galerie" peut être vide. Ne fais pas encore le contact.
```
👉 Remplace les deux `COLLE_ICI` par tes clés. Lance `npx serve site` et ouvre le lien.
Ajuste le design avec des prompts courts : « le hero est trop chargé, simplifie », « agrandis le logo »…

## Étape 2 — Back-office : connexion (20 min)

```
Crée site/admin/login.html et la partie connexion de site/js/admin.js avec Supabase Auth
(email + mot de passe, signInWithPassword). Après connexion → admin/index.html.
Sur admin/index.html : si pas de session, rediriger vers login.html. Bouton "Déconnexion".
Style dans site/css/admin.css, sobre, mêmes couleurs que le site. Interface en français,
messages d'erreur clairs ("Email ou mot de passe incorrect").
```
👉 Teste : connexion OK, mauvais mot de passe, ouverture directe de /admin/ sans être connecté.

## Étape 3 — Back-office : ajouter des photos (45 min)

```
Crée site/js/compress.js : une fonction qui prend un File image et renvoie
{ full: Blob, thumb: Blob } en WebP (qualité 0.8), 1600 px max et 480 px max pour la miniature,
avec repli JPEG si WebP n'est pas supporté. Utilise createImageBitmap + canvas.
Dans admin/index.html, onglet "Médias" : une zone glisser-déposer + bouton "Choisir des photos"
(plusieurs fichiers), un champ titre (par défaut le nom du fichier), un menu Discipline
(football, basketball, gymnastique, athletisme, arts-martiaux, sports-aquatiques, evenements, autre).
Pour chaque photo : compresser → uploader dans le bucket "medias" (images/AAAA/MM/<uuid>.webp
et thumbs/AAAA/MM/<uuid>.webp) → insérer une ligne dans la table medias (type image, source upload,
url publique, thumb_url, storage_path). Affiche une progression "3/5 envoyées" et la taille
avant/après compression.
```
👉 Teste avec de vraies photos de téléphone (3–5 Mo) : elles doivent arriver vers 150–400 Ko.

## Étape 4 — Back-office : vidéos + gestion (45 min)

```
Dans l'onglet Médias de l'admin ajoute un formulaire "Ajouter une vidéo" avec 2 options :
1) Lien YouTube (recommandé) : accepter youtube.com/watch?v=, youtu.be/, /shorts/ ;
   extraire l'ID, enregistrer url = l'ID ou le lien, thumb_url = miniature YouTube.
2) Fichier MP4 : refuser au-delà de 50 Mo avec un message qui conseille YouTube ;
   upload dans videos/AAAA/MM/ avec barre de progression.
Sous les formulaires, liste de tous les médias (les plus récents d'abord) : miniature, titre
modifiable (sauvegarde en sortant du champ), discipline modifiable, interrupteur Publié/Masqué,
bouton Supprimer avec confirmation qui supprime aussi les fichiers du stockage.
```
👉 Teste : ajout YouTube, masquer, supprimer (vérifie dans Supabase → Storage que le fichier a disparu).

## Étape 5 — Galerie publique (40 min)

```
Crée site/galerie.html + site/js/galerie.js : charge les medias publiés depuis Supabase
(tri : ordre desc puis created_at desc), 24 par page + bouton "Voir plus".
Filtres en boutons par discipline + filtre Tout / Photos / Vidéos.
Grille responsive de miniatures (thumb_url, loading lazy), icône ▶ sur les vidéos.
Au clic : visionneuse plein écran avec flèches, fermeture par Échap / clic sur le fond,
swipe sur mobile. Image = url pleine taille ; YouTube = iframe youtube-nocookie créée seulement
à l'ouverture ; MP4 = <video controls preload="none">.
Dans index.html, remplis la section "Aperçu galerie" avec les 6 derniers médias + lien vers galerie.html.
```

## Étape 6 — Formulaire de contact (20 min)

```
Dans la section Contact de index.html : formulaire nom, email, téléphone (optionnel),
profil (sportif / parent / club / sponsor / autre), message. Validation simple, insertion dans
la table messages, message de confirmation, bouton désactivé pendant l'envoi.
Ajoute à côté un bouton WhatsApp (lien wa.me/223XXXXXXXX, je le remplacerai) et l'e-mail.
Dans l'admin, onglet "Messages" : liste des messages (récents d'abord), badge du nombre de non lus,
bouton "Marquer comme lu" et "Supprimer".
```

## Étape 7 — Finitions + mise en ligne (25 min)

```
Passe en revue tout le site : <title> et meta description sur chaque page, balises Open Graph
avec le logo, favicon depuis le logo, alt sur les images, contrastes, test à 360 px de large,
pas d'erreur dans la console. Vérifie les critères du §8 du cahier des charges et dis-moi
ce qui ne passe pas.
```
Mise en ligne :
1. https://app.netlify.com/drop → glisse le dossier **`site`** → c'est en ligne.
2. Dans Supabase → **Authentication → URL Configuration** : mets l'adresse Netlify comme Site URL.
3. Plus tard : renommer le site dans Netlify ou brancher un nom de domaine (ex. sctalents.ml / .com).

---

## Astuces Claude Code

- **Une étape à la fois**, et teste avant de continuer. Si ça casse : colle l'erreur de la console
  (F12 → Console) dans Claude Code.
- Pour les retouches visuelles, fais une capture d'écran et glisse-la dans Claude Code avec ta remarque.
- `/clear` entre deux grandes étapes pour repartir sur un contexte propre (CLAUDE.md est relu).
- Si Claude Code propose d'installer React, Vite, etc. : refuse, rappelle « HTML/CSS/JS pur, voir CLAUDE.md ».
- Avant chaque grande étape, fais une copie du dossier `site/` (ou `git init` + `git commit`) pour pouvoir revenir en arrière.

## Si tu manques de temps

Priorité : Étapes 1 → 2 → 3 → 5 → 7. Les vidéos (4) peuvent se limiter aux liens YouTube,
et le contact (6) peut être juste un bouton WhatsApp.
