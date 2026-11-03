"""Charge les données de départ : un joueur modèle (CV fourni) et les vidéos déjà tournées.

    python manage.py donnees_depart

Sans effet si les données existent déjà (on peut la relancer sans risque).
"""
from pathlib import Path

from django.conf import settings
from django.core.files import File
from django.core.management.base import BaseCommand

from core.models import EtapeCarriere, Joueur, Langue, Video

DOSSIER = Path(settings.BASE_DIR) / 'donnees_depart'

CARRIERE = [  # club, logo, pays, niveau, début, fin
    ('USMO', 'usmo', 'Maroc', 'Ligue 2', 'août 2026', ''),
    ('FC Ksar', 'fc-ksar', 'Mauritanie', 'Ligue 1', 'oct. 2024', 'juin 2026'),
    ('FC Binga', 'fc-binga', 'Mali', 'Ligue 1', 'oct. 2023', 'juin 2024'),
    ('AS Police', 'as-police', 'Mauritanie', 'Ligue 1', 'oct. 2022', 'juin 2023'),
    ('FC Nouakchott Kings', 'nouakchott-kings', 'Mauritanie', 'Ligue 1', 'oct. 2021', 'juin 2022'),
    ('AS Performance de Kabala', 'as-performance', 'Mali', 'Ligue 3', 'oct. 2019', 'juin 2020'),
    ('Mali — présélection', 'femafoot', 'Mali', 'U17', 'nov. 2018', 'déc. 2019'),
    ('Wydad', 'wydad', 'Maroc', 'U14', 'oct. 2015', 'juin 2017'),
]

VIDEOS = [  # fichier, catégorie, titre, description, à la une
    ('match-stade', 'match', 'Match au stade', 'Nos jeunes en compétition dans un grand stade.', True),
    ('match-synthetique', 'match', 'Match sur synthétique', 'Nos jeunes en match sur terrain synthétique.', True),
    ('compilation-matchs', 'match', 'Compilation de matchs', 'Plusieurs rencontres, sur terrain naturel et synthétique.', False),
    ('match-1', 'match', 'Match de jeunes — en action', 'Sur pelouse naturelle, en plein match.', False),
    ('match-2', 'match', 'Match de jeunes — temps forts', 'Pressing, transitions et occasions.', False),
    ('detection-joueur', 'match', 'Aboubacar Kanté — milieu n°8', 'Vidéo de détection : les actions d’un milieu de terrain.', True),
    ('tableau-tactique', 'equipe', 'Au tableau tactique', 'Les jeunes expliquent leur placement.', True),
    ('causerie', 'equipe', 'Consignes à la pause', 'Le staff réunit les joueurs au bord du terrain.', False),
    ('interview-tribune', 'equipe', 'Interview en tribune', 'Un jeune joueur raconte son match.', False),
    ('apres-match', 'equipe', 'Après le match', 'Émotions au coup de sifflet final.', False),
    ('raising-stars-1', 'evenement', 'Raising Stars Cup — la parole aux jeunes', 'Interview devant le panneau de la Raising Stars Cup Mali.', True),
    ('raising-stars-2', 'evenement', 'Raising Stars Cup — au micro', 'Un autre jeune joueur au micro.', False),
    ('stade-26-mars', 'entreprise', 'Au Stade du 26 Mars', 'L’agence en visite au Stade du 26 Mars, à Bamako.', False),
]


def fichier(chemin):
    return File(open(chemin, 'rb'), name=chemin.name)


class Command(BaseCommand):
    help = 'Charge le joueur modèle et les vidéos de départ'

    def handle(self, *args, **opts):
        self.joueur_modele()
        self.videos()
        self.stdout.write(self.style.SUCCESS('Données de départ prêtes.'))

    def joueur_modele(self):
        if Joueur.objects.filter(prenom='Adama', nom='Samaké').exists():
            return
        d = DOSSIER / 'joueur'
        j = Joueur(
            prenom='Adama', nom='Samaké', nationalite='Mali', residence='Maroc', passeport_ue=False,
            poste='ailier-droit', poste_2='milieu-offensif', taille=165, poids=65, pied='gauche',
            club='USMO', club_pays='Maroc', club_niveau='Ligue 2', club_depuis='août 2026',
            presentation='Ailier droit gaucher, rapide et percutant, capable de jouer en soutien de l’attaque. '
                         'Formé au Wydad, passé par la présélection U17 du Mali, il a ensuite joué en Ligue 1 '
                         'au Mali et en Mauritanie avant de rejoindre l’USMO au Maroc.',
            ordre=10,
        )
        j.photo.save('samake-adama.webp', fichier(d / 'samake-adama.webp'), save=False)
        j.club_logo.save('usmo.webp', fichier(d / 'usmo.webp'), save=False)
        j.save()
        for i, (club, logo, pays, niveau, debut, fin) in enumerate(CARRIERE):
            e = EtapeCarriere(joueur=j, club=club, pays=pays, niveau=niveau, debut=debut, fin=fin, ordre=i)
            e.logo.save(f'{logo}.webp', fichier(d / f'{logo}.webp'), save=False)
            e.save()
        for langue in ['Arabe', 'Anglais', 'Français']:
            Langue.objects.create(joueur=j, langue=langue, niveau='intermediaire')
        for n, lien in [(1, 'https://youtu.be/Ca0_zXaWPwU'), (2, 'https://youtu.be/XaFTIlYxqe0')]:
            Video.objects.create(titre=f'Adama Samaké — vidéo {n}', categorie='joueur', joueur=j, youtube=lien,
                                 description='Ses actions en match.', ordre=5)
        self.stdout.write(f'Joueur modèle créé : {j}')

    def videos(self):
        for i, (nom, cat, titre, desc, une) in enumerate(VIDEOS):
            if Video.objects.filter(titre=titre).exists():
                continue
            v = Video(titre=titre, categorie=cat, description=desc, a_la_une=une, ordre=len(VIDEOS) - i)
            v.fichier.save(f'{nom}.mp4', fichier(DOSSIER / 'videos' / f'{nom}.mp4'), save=False)
            v.miniature.save(f'{nom}.webp', fichier(DOSSIER / 'miniatures' / f'v-{nom}.webp'), save=False)
            v.save()   # déjà allégées : pas de nouvel encodage
            self.stdout.write(f'Vidéo ajoutée : {titre}')
