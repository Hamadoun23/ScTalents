"""Données du site : joueurs (avec leur CV), vidéos et messages de contact."""
from datetime import date

from django.db import models
from django.urls import reverse
from django.utils.text import slugify

# Postes : libellé + position sur le terrain dessiné (x, y en %, attaque vers le haut)
POSTES = {
    'gardien': ('Gardien de but', 50, 92),
    'lateral-droit': ('Latéral droit', 82, 70),
    'defenseur-central': ('Défenseur central', 50, 74),
    'lateral-gauche': ('Latéral gauche', 18, 70),
    'milieu-defensif': ('Milieu défensif', 50, 58),
    'milieu-central': ('Milieu central', 50, 47),
    'milieu-offensif': ('Milieu offensif', 50, 34),
    'ailier-droit': ('Ailier droit', 80, 26),
    'ailier-gauche': ('Ailier gauche', 20, 26),
    'attaquant': ('Attaquant / avant-centre', 50, 16),
}
CHOIX_POSTES = [(k, v[0]) for k, v in POSTES.items()]

PIEDS = [('droit', 'Droit'), ('gauche', 'Gauche'), ('deux', 'Les deux')]
NIVEAUX_LANGUE = [
    ('debutant', 'Débutant'), ('intermediaire', 'Intermédiaire'),
    ('courant', 'Courant'), ('maternelle', 'Langue maternelle'),
]


class Joueur(models.Model):
    # Identité
    prenom = models.CharField('Prénom', max_length=80)
    nom = models.CharField('Nom', max_length=80)
    slug = models.SlugField(unique=True, max_length=180, editable=False)
    photo = models.ImageField('Photo', upload_to='joueurs/', blank=True)
    date_naissance = models.DateField('Date de naissance', null=True, blank=True)
    nationalite = models.CharField('Nationalité', max_length=80, default='Mali')
    residence = models.CharField('Pays de résidence', max_length=80, blank=True)
    passeport_ue = models.BooleanField('A un passeport européen', default=False)
    # Profil sportif
    poste = models.CharField('Poste principal', max_length=30, choices=CHOIX_POSTES)
    poste_2 = models.CharField('Poste secondaire', max_length=30, choices=CHOIX_POSTES, blank=True)
    taille = models.PositiveSmallIntegerField('Taille (cm)', null=True, blank=True)
    poids = models.PositiveSmallIntegerField('Poids (kg)', null=True, blank=True)
    pied = models.CharField('Pied fort', max_length=10, choices=PIEDS, blank=True)
    presentation = models.TextField('Présentation', blank=True,
                                    help_text='Quelques phrases sur le joueur : style de jeu, qualités, ambitions.')
    # Club actuel
    club = models.CharField('Club actuel', max_length=120, blank=True)
    club_logo = models.ImageField('Logo du club actuel', upload_to='clubs/', blank=True)
    club_pays = models.CharField('Pays du club', max_length=80, blank=True)
    club_niveau = models.CharField('Championnat', max_length=80, blank=True, help_text='Ex. : Ligue 1, Ligue 2, U17…')
    club_depuis = models.CharField('Au club depuis', max_length=40, blank=True, help_text='Ex. : août 2026')
    # Contacts (jamais affichés sans l'accord coché plus bas)
    email = models.EmailField('E-mail du joueur', blank=True)
    telephone = models.CharField('Téléphone du joueur', max_length=40, blank=True)
    instagram = models.CharField('Instagram', max_length=120, blank=True)
    facebook = models.CharField('Facebook', max_length=200, blank=True)
    contacts_publics = models.BooleanField(
        'Afficher ses contacts sur le site', default=False,
        help_text='Laissez décoché : les clubs passent alors par l’agence.')
    # Publication
    publie = models.BooleanField('Visible sur le site', default=True)
    ordre = models.PositiveSmallIntegerField('Ordre d’affichage', default=0, help_text='Les plus grands en premier.')
    cree_le = models.DateTimeField(auto_now_add=True)
    modifie_le = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-ordre', 'nom', 'prenom']
        verbose_name = 'joueur'

    def __str__(self):
        return f'{self.prenom} {self.nom}'

    def save(self, *args, **kwargs):
        if not self.slug:
            base = slugify(f'{self.prenom} {self.nom}') or 'joueur'
            slug, n = base, 2
            while Joueur.objects.filter(slug=slug).exclude(pk=self.pk).exists():
                slug, n = f'{base}-{n}', n + 1
            self.slug = slug
        super().save(*args, **kwargs)

    def get_absolute_url(self):
        return reverse('joueur', args=[self.slug])

    @property
    def age(self):
        if not self.date_naissance:
            return None
        d, a = self.date_naissance, date.today()
        return a.year - d.year - ((a.month, a.day) < (d.month, d.day))

    @property
    def poste_libelle(self):
        return POSTES.get(self.poste, ('',))[0]

    @property
    def poste_2_libelle(self):
        return POSTES.get(self.poste_2, ('',))[0]

    @property
    def points_terrain(self):
        """Positions à dessiner sur le terrain du CV."""
        pts = []
        for i, p in enumerate([self.poste, self.poste_2], 1):
            if p in POSTES:
                pts.append({'n': i, 'x': POSTES[p][1], 'y': POSTES[p][2]})
        return pts


class EtapeCarriere(models.Model):
    joueur = models.ForeignKey(Joueur, on_delete=models.CASCADE, related_name='carriere')
    club = models.CharField('Club ou sélection', max_length=120)
    logo = models.ImageField('Logo', upload_to='clubs/', blank=True)
    pays = models.CharField('Pays', max_length=80, blank=True)
    niveau = models.CharField('Championnat / catégorie', max_length=80, blank=True, help_text='Ex. : Ligue 1, U17')
    debut = models.CharField('Début', max_length=40, blank=True, help_text='Ex. : oct. 2024')
    fin = models.CharField('Fin', max_length=40, blank=True, help_text='Ex. : juin 2026 (vide = en cours)')
    ordre = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ['ordre', 'id']
        verbose_name = 'étape de carrière'

    def __str__(self):
        return self.club


class Langue(models.Model):
    joueur = models.ForeignKey(Joueur, on_delete=models.CASCADE, related_name='langues')
    langue = models.CharField('Langue', max_length=60)
    niveau = models.CharField('Niveau', max_length=20, choices=NIVEAUX_LANGUE, default='intermediaire')

    class Meta:
        ordering = ['id']

    def __str__(self):
        return self.langue


class Video(models.Model):
    CATEGORIES = [
        ('joueur', 'Vidéo d’un joueur'),
        ('equipe', 'L’équipe'),
        ('match', 'Match'),
        ('entreprise', 'L’entreprise / l’agence'),
        ('evenement', 'Événement'),
    ]
    ETATS = [('pret', 'Prête'), ('en_cours', 'En préparation'), ('erreur', 'Erreur')]

    titre = models.CharField('Titre', max_length=160)
    description = models.TextField('Description', blank=True)
    categorie = models.CharField('Catégorie', max_length=20, choices=CATEGORIES, default='match')
    joueur = models.ForeignKey(Joueur, on_delete=models.CASCADE, related_name='videos', null=True, blank=True,
                               verbose_name='Joueur concerné')
    fichier = models.FileField('Fichier vidéo', upload_to='videos/', blank=True)
    youtube = models.URLField('Ou lien YouTube', blank=True)
    miniature = models.ImageField('Image d’aperçu', upload_to='miniatures/', blank=True,
                                  help_text='Facultatif : créée automatiquement.')
    etat = models.CharField(max_length=10, choices=ETATS, default='pret', editable=False)
    publie = models.BooleanField('Visible sur le site', default=True)
    a_la_une = models.BooleanField('À la une sur l’accueil', default=False)
    ordre = models.PositiveSmallIntegerField('Ordre d’affichage', default=0)
    cree_le = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-ordre', '-cree_le']
        verbose_name = 'vidéo'

    def __str__(self):
        return self.titre

    @property
    def youtube_id(self):
        from .medias import id_youtube
        return id_youtube(self.youtube)

    @property
    def apercu(self):
        if self.miniature:
            return self.miniature.url
        if self.youtube_id:
            return f'https://img.youtube.com/vi/{self.youtube_id}/hqdefault.jpg'
        return ''


class Message(models.Model):
    PROFILS = [('sportif', 'Sportif'), ('parent', 'Parent'), ('club', 'Club / académie'),
               ('sponsor', 'Sponsor / entreprise'), ('autre', 'Autre')]
    nom = models.CharField('Nom', max_length=120)
    email = models.EmailField('E-mail')
    telephone = models.CharField('Téléphone', max_length=40, blank=True)
    profil = models.CharField('Profil', max_length=20, choices=PROFILS, default='autre')
    message = models.TextField('Message', max_length=3000)
    lu = models.BooleanField(default=False)
    cree_le = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-cree_le']

    def __str__(self):
        return f'{self.nom} — {self.cree_le:%d/%m/%Y}'
