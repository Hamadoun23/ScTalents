-- Médias de départ livrés avec le site (fichiers dans site/assets).
-- À exécuter UNE fois après schema.sql : Supabase > SQL Editor > Run.
-- Leurs URL sont relatives au site ; storage_path vide = rien à effacer dans le stockage.

insert into public.medias (type, source, titre, description, categorie, url, thumb_url, ordre) values
  ('video', 'upload', 'Aboubacar Kanté — milieu n°8', 'Montage de détection : les actions d’un milieu de terrain suivi par SC+ Talent & Sports.', 'football', 'assets/video/detection-joueur.mp4', 'assets/img/galerie/v-detection-joueur.webp', 10),
  ('video', 'upload', 'Match de jeunes — temps forts', 'Extrait d’un match de nos jeunes : pressing, transitions et occasions.', 'football', 'assets/video/match-2.mp4', 'assets/img/galerie/v-match-2.webp', 9),
  ('video', 'upload', 'Match de jeunes — en action', 'Nos jeunes sur pelouse naturelle, en plein match.', 'football', 'assets/video/match-1.mp4', 'assets/img/galerie/v-match-1.webp', 8),
  ('image', 'upload', 'Le groupe et son coach', 'Une équipe du centre de formation avant l’entraînement, tableau tactique en main.', 'football', 'assets/img/sc/equipe-rayee.webp', 'assets/img/galerie/equipe-rayee.webp', 7),
  ('image', 'upload', 'Jeune talent', 'Portrait d’un jeune joueur du centre de formation.', 'football', 'assets/img/sc/portrait-1.webp', 'assets/img/galerie/portrait-1.webp', 6),
  ('image', 'upload', 'Coéquipiers', 'Deux jeunes joueurs après la séance.', 'football', 'assets/img/sc/duo.webp', 'assets/img/galerie/duo.webp', 6),
  ('image', 'upload', 'Jeune talent', 'Portrait d’un jeune joueur du centre de formation.', 'football', 'assets/img/sc/portrait-3.webp', 'assets/img/galerie/portrait-3.webp', 5),
  ('image', 'upload', 'En tribune', 'L’équipe et ses encadrants dans les tribunes.', 'football', 'assets/img/sc/equipe-tribune.webp', 'assets/img/galerie/equipe-tribune.webp', 5),
  ('image', 'upload', 'Jeune talent', 'Portrait d’un jeune joueur du centre de formation.', 'football', 'assets/img/sc/portrait-2.webp', 'assets/img/galerie/portrait-2.webp', 4),
  ('image', 'upload', 'Jeune talent', 'Portrait d’un jeune joueur du centre de formation.', 'football', 'assets/img/sc/portrait-4.webp', 'assets/img/galerie/portrait-4.webp', 4),
  ('image', 'upload', 'Sur la terre rouge', 'Photo de groupe sur un terrain de quartier.', 'football', 'assets/img/sc/equipe-terre.webp', 'assets/img/galerie/equipe-terre.webp', 3),
  ('image', 'upload', 'Jour de match', 'Encadrants et jeunes supporters en tribune.', 'evenements', 'assets/img/sc/stade-tribune.webp', 'assets/img/galerie/stade-tribune.webp', 3),
  ('image', 'upload', 'Événement sportif', 'Officiels et invités lors d’une journée sportive.', 'evenements', 'assets/img/reel/evenement.webp', 'assets/img/galerie/evenement.webp', 2),
  ('video', 'upload', 'Au Stade du 26 Mars', 'Visite du Stade du 26 Mars, à Bamako.', 'evenements', 'assets/video/stade-26-mars.mp4', 'assets/img/galerie/v-stade-26-mars.webp', 2),
  ('image', 'upload', 'Stade du 26 Mars', 'Devant le Stade du 26 Mars, à Bamako.', 'evenements', 'assets/img/reel/stade-26-mars.webp', 'assets/img/galerie/stade-26-mars.webp', 1),
  ('image', 'upload', 'FEMAGYM', 'Avec la Fédération malienne de gymnastique, en déplacement.', 'gymnastique', 'assets/img/reel/femagym.webp', 'assets/img/galerie/femagym.webp', 1),
  ('image', 'upload', 'S-ComPlus SARL', 'Le bureau de la maison mère de SC+ Talent & Sports.', 'autre', 'assets/img/reel/bureau-scomplus.webp', 'assets/img/galerie/bureau-scomplus.webp', 0),
  ('image', 'upload', 'Devant le stade', 'Stade du 26 Mars, Bamako.', 'evenements', 'assets/img/reel/stade-26-mars-2.webp', 'assets/img/galerie/stade-26-mars-2.webp', 0);
