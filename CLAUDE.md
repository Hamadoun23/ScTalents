# CLAUDE.md — SC+ Talent & Sports

Site vitrine + back-office médias pour SC+ Talent & Sports (agence de management sportif, Mali,
filiale de S-ComPlus SARL). Le cahier des charges complet est dans `CAHIER_DES_CHARGES.md` :
lis-le avant de coder. Le schéma de base est dans `supabase/schema.sql`.

## Règles techniques (à respecter strictement)

- HTML + CSS + JavaScript pur. **Aucun framework, aucun build, aucun npm.**
- JS en modules ES (`<script type="module">`).
- Supabase via CDN : `import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'`
- Les clés sont dans `site/js/config.js` (SUPABASE_URL, SUPABASE_ANON_KEY). Ne jamais utiliser la clé `service_role`.
- Le client Supabase est créé une seule fois dans `site/js/supabase.js` et importé ailleurs.
- Tout le site déployable est dans `site/`.
- Textes du site en **français**.
- Mobile d'abord. Variables CSS pour les couleurs (voir charte §6 du cahier des charges).
- Images : toujours compressées côté navigateur avant upload (`site/js/compress.js`) :
  WebP qualité 0.8, 1600 px max + miniature 480 px. Garder JPEG si WebP indisponible.
- Vidéos : YouTube par défaut (extraire l'ID, miniature `https://img.youtube.com/vi/ID/hqdefault.jpg`,
  lecture via `https://www.youtube-nocookie.com/embed/ID` seulement au clic). MP4 ≤ 50 Mo en option.
- Toutes les images publiques en `loading="lazy"` avec un `alt`.
- Insérer du texte venant de la base avec `textContent` (jamais `innerHTML` avec des données utilisateur).
- Garder le code court et lisible, commenté en français aux endroits clés.

## Arborescence cible

```
site/
  index.html            accueil (une page, sections)
  galerie.html          galerie complète
  admin/login.html      connexion
  admin/index.html      back-office (onglets Médias / Messages)
  css/style.css         styles publics
  css/admin.css         styles admin
  js/config.js          clés Supabase
  js/supabase.js        client partagé
  js/main.js            menu mobile, aperçu galerie, formulaire de contact
  js/galerie.js         filtres, pagination, visionneuse
  js/admin.js           auth guard, upload, liste, messages
  js/compress.js        compression d'images
  assets/img/           logo et visuels
supabase/schema.sql
```

## Tester en local

Les modules ES ne marchent pas en `file://`. Lancer un petit serveur dans `site/` :
`npx serve site` (ou `python -m http.server 8000` dans `site/`), puis ouvrir http://localhost:3000 (ou :8000).
