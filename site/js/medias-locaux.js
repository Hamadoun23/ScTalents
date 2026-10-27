// Médias de départ, livrés avec le site.
// Affichés dans la galerie tant que Supabase n'est pas configuré (ou que la table est vide).
// Les mêmes lignes sont dans supabase/seed.sql pour les retrouver ensuite dans le back-office.

export const DISCIPLINES = {
  football: 'Football',
  basketball: 'Basketball',
  gymnastique: 'Gymnastique',
  athletisme: 'Athlétisme',
  'arts-martiaux': 'Arts martiaux',
  'sports-aquatiques': 'Sports aquatiques',
  evenements: 'Événements',
  autre: 'Autre',
};

// ID d'une vidéo YouTube à partir d'un lien (watch?v=, youtu.be/, /shorts/) ou de l'ID seul
export function idYoutube(url) {
  const m = String(url).match(/(?:v=|youtu\.be\/|shorts\/|embed\/|live\/)([\w-]{11})/);
  return m ? m[1] : (/^[\w-]{11}$/.test(url) ? url : null);
}

const G = 'assets/img/galerie/';

export const MEDIAS_LOCAUX = [
  { type: 'video', source: 'upload', categorie: 'football', titre: 'Aboubacar Kanté — milieu n°8',
    description: 'Montage de détection : les actions d’un milieu de terrain suivi par SC+ Talent & Sports.',
    url: 'assets/video/detection-joueur.mp4', thumb_url: G + 'v-detection-joueur.webp', ordre: 10 },
  { type: 'video', source: 'upload', categorie: 'football', titre: 'Match de jeunes — temps forts',
    description: 'Extrait d’un match de nos jeunes : pressing, transitions et occasions.',
    url: 'assets/video/match-2.mp4', thumb_url: G + 'v-match-2.webp', ordre: 9 },
  { type: 'video', source: 'upload', categorie: 'football', titre: 'Match de jeunes — en action',
    description: 'Nos jeunes sur pelouse naturelle, en plein match.',
    url: 'assets/video/match-1.mp4', thumb_url: G + 'v-match-1.webp', ordre: 8 },
  { type: 'image', source: 'upload', categorie: 'football', titre: 'Le groupe et son coach',
    description: 'Une équipe du centre de formation avant l’entraînement, tableau tactique en main.',
    url: 'assets/img/sc/equipe-rayee.webp', thumb_url: G + 'equipe-rayee.webp', ordre: 7 },
  { type: 'image', source: 'upload', categorie: 'football', titre: 'Jeune talent',
    description: 'Portrait d’un jeune joueur du centre de formation.',
    url: 'assets/img/sc/portrait-1.webp', thumb_url: G + 'portrait-1.webp', ordre: 6 },
  { type: 'image', source: 'upload', categorie: 'football', titre: 'Coéquipiers',
    description: 'Deux jeunes joueurs après la séance.',
    url: 'assets/img/sc/duo.webp', thumb_url: G + 'duo.webp', ordre: 6 },
  { type: 'image', source: 'upload', categorie: 'football', titre: 'Jeune talent',
    description: 'Portrait d’un jeune joueur du centre de formation.',
    url: 'assets/img/sc/portrait-3.webp', thumb_url: G + 'portrait-3.webp', ordre: 5 },
  { type: 'image', source: 'upload', categorie: 'football', titre: 'En tribune',
    description: 'L’équipe et ses encadrants dans les tribunes.',
    url: 'assets/img/sc/equipe-tribune.webp', thumb_url: G + 'equipe-tribune.webp', ordre: 5 },
  { type: 'image', source: 'upload', categorie: 'football', titre: 'Jeune talent',
    description: 'Portrait d’un jeune joueur du centre de formation.',
    url: 'assets/img/sc/portrait-2.webp', thumb_url: G + 'portrait-2.webp', ordre: 4 },
  { type: 'image', source: 'upload', categorie: 'football', titre: 'Jeune talent',
    description: 'Portrait d’un jeune joueur du centre de formation.',
    url: 'assets/img/sc/portrait-4.webp', thumb_url: G + 'portrait-4.webp', ordre: 4 },
  { type: 'image', source: 'upload', categorie: 'football', titre: 'Sur la terre rouge',
    description: 'Photo de groupe sur un terrain de quartier.',
    url: 'assets/img/sc/equipe-terre.webp', thumb_url: G + 'equipe-terre.webp', ordre: 3 },
  { type: 'image', source: 'upload', categorie: 'evenements', titre: 'Jour de match',
    description: 'Encadrants et jeunes supporters en tribune.',
    url: 'assets/img/sc/stade-tribune.webp', thumb_url: G + 'stade-tribune.webp', ordre: 3 },
  { type: 'image', source: 'upload', categorie: 'evenements', titre: 'Événement sportif',
    description: 'Officiels et invités lors d’une journée sportive.',
    url: 'assets/img/reel/evenement.webp', thumb_url: G + 'evenement.webp', ordre: 2 },
  { type: 'video', source: 'upload', categorie: 'evenements', titre: 'Au Stade du 26 Mars',
    description: 'Visite du Stade du 26 Mars, à Bamako.',
    url: 'assets/video/stade-26-mars.mp4', thumb_url: G + 'v-stade-26-mars.webp', ordre: 2 },
  { type: 'image', source: 'upload', categorie: 'evenements', titre: 'Stade du 26 Mars',
    description: 'Devant le Stade du 26 Mars, à Bamako.',
    url: 'assets/img/reel/stade-26-mars.webp', thumb_url: G + 'stade-26-mars.webp', ordre: 1 },
  { type: 'image', source: 'upload', categorie: 'gymnastique', titre: 'FEMAGYM',
    description: 'Avec la Fédération malienne de gymnastique, en déplacement.',
    url: 'assets/img/reel/femagym.webp', thumb_url: G + 'femagym.webp', ordre: 1 },
  { type: 'image', source: 'upload', categorie: 'autre', titre: 'S-ComPlus SARL',
    description: 'Le bureau de la maison mère de SC+ Talent & Sports.',
    url: 'assets/img/reel/bureau-scomplus.webp', thumb_url: G + 'bureau-scomplus.webp', ordre: 0 },
  { type: 'image', source: 'upload', categorie: 'evenements', titre: 'Devant le stade',
    description: 'Stade du 26 Mars, Bamako.',
    url: 'assets/img/reel/stade-26-mars-2.webp', thumb_url: G + 'stade-26-mars-2.webp', ordre: 0 },
];
