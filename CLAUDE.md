# CLAUDE.md — SC+ Talent & Sports

Site + espace admin de SC+ Talent & Sports (agence de management sportif, Mali, filiale de
S-ComPlus SARL). Depuis novembre 2026 : application **Django** (plus de site statique ni de Supabase).

## Principe n°1 : simple

Les personnes qui gèrent le site ne sont pas techniciennes. L'espace admin (`/espace/`) doit rester :
grandes tuiles, formulaires en français courant, un message de confirmation après chaque action,
aucune notion technique visible (pas de noms de fichiers, pas de jargon). L'admin Django brute
(`/gestion-technique/`) est réservée au technicien.

## Arborescence

```
backend/                  application Django (racine = dossier du code sur le serveur)
  config/                 réglages (variables d'environnement en production)
  core/models.py          Joueur (CV), EtapeCarriere, Langue, Video, Message
  core/views.py           pages publiques : accueil, joueurs, fiche CV, vidéos, contact
  core/espace.py          espace admin simplifié (+ urls_espace.py)
  core/medias.py          allègement : images → WebP, vidéos → ffmpeg 640 px en tâche de fond
  core/management/commands/donnees_depart.py   joueur modèle + vidéos de départ
  templates/              pages publiques ; templates/espace/ pour l'admin
  static/                 css (style.css, pages.css, espace.css), js, img
  donnees_depart/         vidéos, miniatures, photo et logos du joueur modèle
deploy/                   service systemd, vhost nginx, deployer.sh
assets/                   fichiers bruts du client (non versionnés)
declinaisons-logo/        toutes les déclinaisons du logo (outils/logo.py)
```

## Règles

- Textes en **français**. Mobile d'abord. Design : anthracite / gris clair / blanc, titres Archivo élargis (voir style.css).
- Données sensibles : contacts des joueurs privés par défaut (`contacts_publics`).
- Toute image envoyée passe par `alleger_image`, toute vidéo par `preparer_video`.
- Pas de Docker. SQLite + fichiers dans un seul dossier de données (`DATA_DIR`).

## Local

```
cd backend
.venv/Scripts/python manage.py migrate
.venv/Scripts/python manage.py donnees_depart
.venv/Scripts/python manage.py runserver 127.0.0.1:8095
```

## Production

VPS 169.58.85.222 (alias SSH `dilitech-vps`), `/opt/sctalents` (app, venv, donnees, .env),
service `sctalents` (gunicorn 127.0.0.1:8240), vhost `/etc/nginx/sites-available/sctalents.conf`.
Mise à jour : voir l'en-tête de `deploy/deployer.sh`.
