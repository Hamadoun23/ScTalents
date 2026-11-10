"""Allègement des médias envoyés depuis l'espace admin.

- Photos et logos : réduits et convertis en WebP (qualité 86, légère netteté) à l'enregistrement.
- Vidéos : réencodées en tâche de fond par ffmpeg (640 px, son mono), avec une
  image d'aperçu tirée de la vidéo. Le site reste utilisable pendant ce temps.
"""
import logging
import re
import shutil
import subprocess
import threading
from io import BytesIO
from pathlib import Path

from django.core.files.base import ContentFile
from django.db import close_old_connections
from PIL import Image, ImageFilter, ImageOps

log = logging.getLogger('core')


def id_youtube(url):
    """ID d'une vidéo YouTube (liens watch?v=, youtu.be/, shorts/, embed/, live/)."""
    m = re.search(r'(?:v=|youtu\.be/|shorts/|embed/|live/)([\w-]{11})', url or '')
    return m.group(1) if m else None


def alleger_image(champ, max_px=1200):
    """Réduit l'image d'un ImageField si elle vient d'être envoyée. À appeler avant save()."""
    # rien à faire : pas d'image, ou image déjà enregistrée (pas un nouvel envoi)
    if not champ or getattr(champ, '_committed', True):
        return
    im = ImageOps.exif_transpose(Image.open(champ.file))
    garde_transparence = im.mode in ('RGBA', 'LA', 'P')
    im = im.convert('RGBA' if garde_transparence else 'RGB')
    im.thumbnail((max_px, max_px), Image.LANCZOS)
    if im.mode == 'RGB':   # légère netteté (pas sur les logos transparents)
        im = im.filter(ImageFilter.UnsharpMask(radius=1.1, percent=60, threshold=2))
    buf = BytesIO()
    im.save(buf, 'WEBP', quality=86, method=6)
    nom = Path(champ.name).stem[:60] + '.webp'
    champ.save(nom, ContentFile(buf.getvalue()), save=False)


def ffmpeg_dispo():
    return shutil.which('ffmpeg') is not None


def _preparer(video_id):
    """Réencode la vidéo et crée son aperçu (dans un fil séparé)."""
    from .models import Video
    close_old_connections()
    try:
        v = Video.objects.get(pk=video_id)
        source = Path(v.fichier.path)
        sortie = source.with_name(source.stem + '-web.mp4')
        subprocess.run([
            'ffmpeg', '-v', 'error', '-y', '-i', str(source),
            '-vf', "scale='if(gt(iw,ih),min(640,iw),-2)':'if(gt(iw,ih),-2,min(640,ih))',fps=25",
            '-c:v', 'libx264', '-crf', '33', '-preset', 'veryfast', '-pix_fmt', 'yuv420p',
            '-movflags', '+faststart', '-c:a', 'aac', '-b:a', '48k', '-ac', '1', str(sortie),
        ], check=True, timeout=3600)
        # on ne garde la nouvelle version que si elle est plus légère
        if sortie.stat().st_size < source.stat().st_size:
            nouveau_nom = str(Path(v.fichier.name).with_name(sortie.name))
            source.unlink()
            v.fichier.name = nouveau_nom
        else:
            sortie.unlink()
        if not v.miniature:
            png = subprocess.run(['ffmpeg', '-v', 'error', '-ss', '2', '-i', v.fichier.path,
                                  '-frames:v', '1', '-f', 'image2pipe', '-vcodec', 'png', '-'],
                                 capture_output=True, check=True, timeout=120).stdout
            im = Image.open(BytesIO(png)).convert('RGB')
            im.thumbnail((640, 640))
            buf = BytesIO()
            im.save(buf, 'WEBP', quality=82)
            v.miniature.save(f'{Path(v.fichier.name).stem}.webp', ContentFile(buf.getvalue()), save=False)
        v.etat = 'pret'
        v.save(update_fields=['fichier', 'miniature', 'etat'])
        log.info('Vidéo %s prête', video_id)
    except Exception:
        log.exception('Préparation de la vidéo %s impossible', video_id)
        Video.objects.filter(pk=video_id).update(etat='erreur')
    finally:
        close_old_connections()


def preparer_video(video):
    """Lance l'allègement si ffmpeg est installé ; sinon la vidéo reste telle quelle."""
    if not video.fichier or not ffmpeg_dispo():
        return
    type(video).objects.filter(pk=video.pk).update(etat='en_cours')
    threading.Thread(target=_preparer, args=(video.pk,), daemon=True).start()
