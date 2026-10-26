# Cahier des charges — Site web SC+ Talent & Sports

> Version simple, MVP réalisable en une soirée. Une filiale de S-ComPlus SARL (Mali).
> Slogan : « Révéler les talents, bâtir les champions. »

---

## 1. Objectif

Un site vitrine rapide qui présente l'agence SC+ Talent & Sports, montre ses photos et vidéos
(talents, matchs, événements, académies) et permet aux visiteurs de la contacter.
Un **back-office** permet à l'admin de publier ses photos et vidéos **sans toucher au code**.

**Contrainte n°1 : la légèreté.** Le site doit rester rapide même sur une connexion mobile au Mali.

## 2. Ce qu'on fait / ce qu'on ne fait pas (ce soir)

| ✅ Dans le MVP | ❌ Plus tard |
|---|---|
| Site vitrine 1 page + page galerie | Fiches talents détaillées / espace athlète |
| Galerie photos + vidéos filtrable par discipline | Multilingue (anglais) |
| Back-office : connexion, ajout, masquer, supprimer | Plusieurs rôles d'admin |
| Compression automatique des images à l'envoi | Blog / actualités |
| Formulaire de contact (messages lisibles dans l'admin) | Paiement, inscriptions aux événements |

## 3. Choix techniques (simples et gratuits)

| Besoin | Solution | Pourquoi |
|---|---|---|
| Front | **HTML + CSS + JS pur** (modules ES, aucun framework, aucun build) | Rien à installer, rapide |
| Base de données + connexion admin + stockage fichiers | **Supabase** (offre gratuite) | Pas de serveur à coder ni à maintenir |
| Images | **Compressées dans le navigateur** avant envoi : WebP, 1600 px max + miniature 480 px | Une photo de 4 Mo devient ~200 Ko |
| Vidéos | **Lien YouTube** (recommandé) — option : MP4 ≤ 50 Mo uploadé | YouTube héberge, compresse et diffuse gratuitement |
| Hébergement | **Netlify** (glisser-déposer le dossier `site/`) | Gratuit, HTTPS, 2 minutes |

> 💡 Pourquoi pas les vidéos sur notre propre stockage ? Une vidéo de 1 minute fait 30 à 100 Mo :
> c'est lent pour le visiteur et ça remplit vite le stockage gratuit (1 Go). YouTube (même en
> « non répertorié ») règle le problème. L'upload MP4 reste possible pour de courts clips.

## 4. Modélisation

### 4.1 Acteurs

- **Visiteur** (sportif, parent, club, sponsor, partenaire) : consulte le site, regarde la galerie, envoie un message.
- **Admin** (l'équipe SC+) : se connecte, publie / masque / supprime des médias, lit les messages.

### 4.2 Cas d'utilisation

```
Visiteur ──► Voir l'accueil (présentation, activités, disciplines)
         ──► Parcourir la galerie (filtrer par discipline, ouvrir en grand, lire une vidéo)
         ──► Envoyer un message de contact

Admin    ──► Se connecter / se déconnecter
         ──► Ajouter des photos (plusieurs à la fois, glisser-déposer)
         ──► Ajouter une vidéo (lien YouTube ou fichier MP4 court)
         ──► Modifier titre / discipline, masquer ou publier, supprimer
         ──► Lire les messages, les marquer comme lus, les supprimer
```

### 4.3 Données (2 tables + 1 espace de stockage)

**Table `medias`**

| Champ | Type | Exemple |
|---|---|---|
| id | uuid | auto |
| created_at | date/heure | auto |
| type | `image` \| `video` | image |
| source | `upload` \| `youtube` | upload |
| titre | texte | Détection U15 — Bamako |
| description | texte (optionnel) | |
| categorie | texte | football, basketball, gymnastique, athletisme, arts-martiaux, sports-aquatiques, evenements, autre |
| url | texte | URL de l'image WebP, du MP4 ou de la vidéo YouTube |
| thumb_url | texte | URL de la miniature |
| storage_path | texte | chemin du fichier dans le stockage (pour le supprimer) |
| publie | booléen | true |
| ordre | entier | 0 (pour épingler en premier) |

**Table `messages`**

| Champ | Type |
|---|---|
| id, created_at | auto |
| nom, email, telephone | texte |
| profil | sportif / parent / club / sponsor / autre |
| message | texte (max 3000 caractères) |
| lu | booléen |

**Stockage `medias`** (public en lecture) : `images/AAAA/MM/<id>.webp`, `thumbs/…`, `videos/…`

### 4.4 Sécurité

- Le visiteur ne voit que les médias `publie = true` et peut seulement **créer** un message.
- Seul un utilisateur connecté (l'admin) peut écrire, modifier, supprimer.
- **Les inscriptions publiques sont désactivées dans Supabase** : le compte admin est créé à la main.
- La clé « anon » de Supabase peut être dans le code front : ce sont les règles RLS qui protègent.

## 5. Pages

### Accueil — `index.html`
1. **En-tête** : logo, menu (Accueil, Activités, Galerie, Contact), bouton « Nous contacter ».
2. **Hero** : « SC+ Talent & Sports — Révéler les talents, bâtir les champions. », sous-titre
   « Agence de management et de développement sportif — Mali », 2 boutons (Voir la galerie / Nous contacter).
3. **À propos** : présentation courte + vision (tirées de la présentation PDF).
4. **Nos activités** : 7 cartes —
   1. Management et accompagnement des sportifs
   2. Détection et promotion des jeunes talents
   3. Recherche de clubs, sponsors et partenaires
   4. Gestion des carrières des joueurs et entraîneurs
   5. Organisation de compétitions et d'événements sportifs
   6. Conseil et accompagnement des clubs, académies et fédérations
   7. Développement de partenariats sportifs nationaux et internationaux
5. **Disciplines** : Football, Basketball, Gymnastique, Athlétisme, Arts martiaux, Sports aquatiques, Autres sports.
6. **Publics** : sportifs & talents, clubs & académies, fédérations, sponsors & entreprises, institutions & investisseurs.
7. **Aperçu galerie** : les 6 derniers médias + lien « Voir toute la galerie ».
8. **Contact** : formulaire + WhatsApp + e-mail.
9. **Pied de page** : « Une filiale de S-ComPlus SARL • Mali », réseaux sociaux, lien discret « Admin ».

### Galerie — `galerie.html`
- Filtres par discipline (boutons) + filtre Photos / Vidéos.
- Grille de miniatures, chargement paresseux (`loading="lazy"`), 24 par page + bouton « Voir plus ».
- Clic → visionneuse plein écran (flèches, Échap pour fermer). Vidéo YouTube intégrée seulement au clic.

### Admin — `admin/login.html` et `admin/index.html`
- Connexion e-mail + mot de passe.
- Onglet **Médias** : zone glisser-déposer (plusieurs images), choix de la discipline, titre ;
  formulaire « Ajouter une vidéo » (lien YouTube ou MP4) ; liste des médias avec
  miniature, titre modifiable, interrupteur Publié/Masqué, bouton Supprimer (avec confirmation).
- Barre de progression pendant l'envoi.
- Onglet **Messages** : liste, badge non lus, marquer lu, supprimer.

## 6. Charte graphique (d'après le logo)

| Rôle | Couleur |
|---|---|
| Bleu nuit (principal) | `#0B1F3A` |
| Or (accent) | `#D4A72C` |
| Fond sombre | `#111820` |
| Blanc cassé | `#F7F5F0` |
| Touches Mali (bandeau, détails) | vert `#14B53A`, jaune `#FCD116`, rouge `#CE1126` |

- Typo : **Montserrat** (titres, gras, majuscules) + **Inter** (texte) — Google Fonts.
- Style : sombre et premium (bleu nuit + or), photos plein cadre, coins arrondis, mobile d'abord.
- Disciplines : pastilles rondes colorées comme sur le logo.

## 7. Exigences de qualité

- **Mobile d'abord**, testé à 360 px de large.
- Page d'accueil < 1 Mo au premier chargement ; images en WebP, `loading="lazy"`.
- Accessible : textes alternatifs, contrastes suffisants, navigation au clavier dans la visionneuse.
- Référencement de base : `<title>`, meta description, balises Open Graph (aperçu WhatsApp/Facebook avec le logo).
- Aucun framework, aucun outil de build : on ouvre, on modifie, on déploie.

## 8. Critères de validation (« c'est fini quand… »)

- [ ] L'accueil s'affiche bien sur téléphone et ordinateur.
- [ ] L'admin se connecte ; un visiteur non connecté qui ouvre `/admin/` est renvoyé vers la connexion.
- [ ] L'admin ajoute 5 photos d'un coup : elles sont compressées (< 400 Ko chacune) et apparaissent dans la galerie.
- [ ] L'admin colle un lien YouTube : la vidéo apparaît avec sa miniature et se lit au clic.
- [ ] Masquer un média le fait disparaître du site public ; Supprimer efface aussi le fichier.
- [ ] Un message envoyé depuis le site apparaît dans l'admin.
- [ ] Le site est en ligne sur Netlify en HTTPS.
