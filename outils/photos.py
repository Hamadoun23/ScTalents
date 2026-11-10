"""Régénère les photos du site depuis les originaux du client, en haute qualité.

    backend/.venv/Scripts/python outils/photos.py

Les originaux (photos WhatsApp, 1080 px max) sont dans assets/ (non versionné).
Réglages : WebP qualité 88, légère netteté ; photos du hero agrandies proprement
pour les grands écrans (l'agrandissement ne crée pas de détail, il évite le flou
de l'agrandissement fait par le navigateur).
"""
from pathlib import Path

from PIL import Image, ImageFilter, ImageOps

RACINE = Path(__file__).resolve().parent.parent
IMG = RACINE / 'backend' / 'static' / 'img'
A1 = RACINE / 'assets' / 'images' / 'WhatsApp Image 2026-10-26 at '
A2 = RACINE / 'assets' / 'nouveau28Octobre' / 'WhatsApp Image 2026-10-27 at '
A3 = RACINE / 'assets' / 'images' / 'WhatsApp Image 2026-10-23 at '

# nom sur le site : (original, recadrage éventuel (gauche, haut, droite, bas) ou 'bandes')
PHOTOS = {
    'sc/portrait-1': (f'{A1}10.19.59 (1).jpeg', None),
    'sc/portrait-2': (f'{A1}10.19.59.jpeg', None),
    'sc/portrait-3': (f'{A1}10.20.01 (2).jpeg', None),
    'sc/portrait-4': (f'{A1}10.20.01 (3).jpeg', None),
    'sc/duo': (f'{A1}10.20.01 (1).jpeg', None),
    'sc/equipe-tribune': (f'{A1}10.20.01.jpeg', None),
    'sc/equipe-rayee': (f'{A1}10.20.02 (1).jpeg', None),
    'sc/stade-tribune': (f'{A1}10.20.02.jpeg', None),
    'sc/equipe-terre': (f'{A1}10.20.00.jpeg', 'bandes'),
    'sc/portrait-5': (f'{A2}22.36.33 (1).jpeg', None),
    'sc/portrait-6': (f'{A2}22.36.33 (2).jpeg', None),
    'sc/portrait-7': (f'{A2}22.36.33.jpeg', None),
    'sc/portrait-8': (f'{A2}22.36.34 (2).jpeg', None),
    'sc/portrait-9': (f'{A2}22.36.34 (4).jpeg', None),
    'sc/portrait-10': (f'{A2}22.36.34.jpeg', None),
    'sc/portrait-11': (f'{A2}22.36.36.jpeg', None),
    'sc/equipe-soir': (f'{A2}22.36.35 (2).jpeg', None),
    'sc/equipe-quartier': (f'{A2}22.36.35 (3).jpeg', 'bandes'),
    'reel/stade-26-mars': (f'{A3}12.07.57.jpeg', None),
    'reel/stade-26-mars-2': (f'{A3}12.07.58.jpeg', None),
    'reel/bureau-scomplus': (f'{A3}12.08.25.jpeg', 'reduire'),
    'reel/evenement': (f'{A3}12.15.57.jpeg', None),
    'reel/femagym': (f'{A3}12.15.57 (1).jpeg', (340, 760, 1300, 1536)),
}
# photos affichées en plein écran (hero) : version agrandie + version mobile
HERO = {'sc/equipe-rayee': 1920, 'sc/equipe-tribune': 1920, 'sc/stade-tribune': 1920}


def sans_bandes(im):
    """Retire les bandes noires (et la barre du téléphone) d'une capture d'écran."""
    g = im.convert('L')
    w, h = g.size
    lignes = [y for y in range(h) if sum(1 for x in range(0, w, 6) if g.getpixel((x, y)) > 30) > (w / 6) * 0.6]
    return im.crop((0, lignes[0], w, lignes[-1] + 1))


def net(im, force=60):
    return im.filter(ImageFilter.UnsharpMask(radius=1.1, percent=force, threshold=2))


def main():
    total_avant = total_apres = 0
    for nom, (source, recadrage) in PHOTOS.items():
        im = ImageOps.exif_transpose(Image.open(source)).convert('RGB')
        if recadrage == 'bandes':
            im = sans_bandes(im)
        elif recadrage == 'reduire':
            im.thumbnail((1000, 1000), Image.LANCZOS)
        elif recadrage:
            im = im.crop(recadrage)
        dest = IMG / f'{nom}.webp'
        total_avant += dest.stat().st_size if dest.exists() else 0
        if nom in HERO:
            large = HERO[nom]
            grand = im.resize((large, round(im.height * large / im.width)), Image.LANCZOS)
            net(grand, 70).save(dest, 'WEBP', quality=86, method=6)
            mobile = im.copy()
            mobile.thumbnail((900, 1400), Image.LANCZOS)
            net(mobile).save(IMG / f'{nom}-m.webp', 'WEBP', quality=86, method=6)
        else:
            net(im).save(dest, 'WEBP', quality=88, method=6)
        total_apres += dest.stat().st_size
        print(f'{nom:24} {Image.open(dest).size}  {dest.stat().st_size // 1024} Ko')
    print(f'Total : {total_avant // 1024} Ko -> {total_apres // 1024} Ko')


if __name__ == '__main__':
    main()
