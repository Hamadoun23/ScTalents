# Détourage du logo SC+ et déclinaisons
import numpy as np
from PIL import Image, ImageFilter
src = Image.open('WhatsApp Image 2026-10-22 at 13.38.52.jpeg').convert('RGB')
a = np.asarray(src).astype(np.float32)
H, W, _ = a.shape
mn, mx = a.min(2), a.max(2)

# 1) fond = pixels quasi blancs et peu saturés, hors zones où le blanc est voulu
fond = (mn > 232) & (mx - mn < 18)
# zones où le blanc est voulu : intérieur exact des pastilles et de la pilule
yy, xx = np.mgrid[0:H, 0:W]
proteger = np.zeros((H, W), bool)
for cx in [129.5, 299, 473, 638.5, 802.5, 965, 1128.5]:
    proteger |= (xx - cx) ** 2 + (yy - 980) ** 2 <= 47.5 ** 2
zone = (yy > 1090) & (yy < 1215) & (xx > 300) & (xx < 960)
sombres = zone & (a.mean(2) < 90)
ys, xs = np.nonzero(sombres)
x0, x1, y0, y1 = xs.min(), xs.max(), ys.min(), ys.max()
r = (y1 - y0) / 2 - 1.5; cy = (y0 + y1) / 2; x0 += 1.5; x1 -= 1.5; y0 += 1.5; y1 -= 1.5
pil = (yy >= y0) & (yy <= y1) & (xx >= x0 + r) & (xx <= x1 - r)
pil |= (xx - (x0 + r)) ** 2 + (yy - cy) ** 2 <= r ** 2
pil |= (xx - (x1 - r)) ** 2 + (yy - cy) ** 2 <= r ** 2
proteger |= pil
fond &= ~proteger
PROT = proteger

alpha = np.where(fond, 0.0, 1.0)

# 2) bord : bande de 3 px autour du fond -> « couleur vers alpha » depuis le blanc
m = Image.fromarray((fond * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(7))
bande = (np.asarray(m) > 0) & ~fond & ~proteger
dist = (255 - a) / 255.0
a_bord = np.clip(dist.max(2) * 1.15, 0, 1)
alpha = np.where(bande, a_bord, alpha)
# dé-mélanger la couleur du blanc sur les bords
safe = np.maximum(alpha, 1e-3)[..., None]
rgb = np.where(bande[..., None], np.clip((a - (1 - safe) * 255) / safe, 0, 255), a)

rgba = np.dstack([rgb, alpha * 255]).astype(np.uint8)
logo = Image.fromarray(rgba, 'RGBA')

def recadrer(im, pad=12):
    bb = im.getchannel('A').point(lambda v: 255 if v > 10 else 0).getbbox()
    bb = (max(bb[0]-pad,0), max(bb[1]-pad,0), min(bb[2]+pad,im.width), min(bb[3]+pad,im.height))
    return im.crop(bb)

# 3) version pour fond sombre : le bleu nuit devient blanc cassé
def sombre(im, prot=None):
    x = np.asarray(im).astype(np.float32)
    r, g, b, al = x[...,0], x[...,1], x[...,2], x[...,3]
    lum = (0.3*r + 0.59*g + 0.11*b)
    # « bleu nuit » : sombre et à dominante bleue
    t = np.clip((110 - lum) / 70, 0, 1) * (b >= r - 5)
    if prot is not None: t = t * ~prot
    creme = np.array([247, 245, 240], np.float32)
    x[..., :3] = x[..., :3] * (1 - t[..., None]) + creme * t[..., None]
    return Image.fromarray(x.astype(np.uint8), 'RGBA')

# 4) monochrome (une seule couleur, alpha conservé)
def mono(im, couleur):
    x = np.asarray(im).copy()
    x[..., :3] = couleur
    return Image.fromarray(x, 'RGBA')

out = 'site/assets/img/logo/'
bb = logo.getchannel('A').point(lambda v: 255 if v > 10 else 0).getbbox()
bb = (max(bb[0]-12,0), max(bb[1]-12,0), min(bb[2]+12,W), min(bb[3]+12,H))
complet = logo.crop(bb)
prot_complet = PROT[bb[1]:bb[3], bb[0]:bb[2]]
emb = recadrer(logo.crop((120, 20, 1250, 650)))        # emblème SC+ (globe, coureur, étoile)
texte = recadrer(logo.crop((20, 655, 1240, 905)))       # TALENT & SPORTS + baseline + slogan
mot = recadrer(logo.crop((20, 655, 1240, 775)))         # TALENT & SPORTS seul

def save(im, nom, maxw):
    im = im.copy(); im.thumbnail((maxw, maxw*2), Image.LANCZOS)
    im.save(out + nom + '.webp', quality=90, method=6)
    im.save(out + nom + '.png', optimize=True)

save(complet, 'logo-clair', 900)                 # fond clair
save(sombre(complet, prot_complet), 'logo-sombre', 900)         # fond sombre
save(emb, 'embleme-clair', 600)
save(sombre(emb), 'embleme-sombre', 600)
save(mono(emb, (212,167,44)), 'embleme-or', 600)
save(mono(emb, (247,245,240)), 'embleme-blanc', 600)
save(mot, 'texte-clair', 900)
save(sombre(mot), 'texte-sombre', 900)

# favicon / icône : emblème sombre sur carré bleu nuit
ic = Image.new('RGBA', (512, 512), (11,31,58,255))
e = sombre(emb).copy(); e.thumbnail((430, 430), Image.LANCZOS)
ic.alpha_composite(e, ((512-e.width)//2, (512-e.height)//2))
ic.save(out + 'icone-512.png', optimize=True)
ic.resize((180,180), Image.LANCZOS).save(out + 'apple-touch-icon.png', optimize=True)
ic.resize((64,64), Image.LANCZOS).save('site/assets/img/favicon.png', optimize=True)

# planche de présentation
pl = Image.new('RGBA', (1800, 1500), (255,255,255,255))
pl.paste((7,17,31,255), (900, 0, 1800, 1500))
def poser(im, x, y, w):
    im = im.copy(); im.thumbnail((w, w), Image.LANCZOS); pl.alpha_composite(im, (x + (w-im.width)//2, y))
poser(complet, 60, 60, 780); poser(sombre(complet, prot_complet), 960, 60, 780)
poser(emb, 120, 900, 300); poser(mono(emb,(11,31,58)), 480, 900, 300)
poser(sombre(emb), 1020, 900, 300); poser(mono(emb,(212,167,44)), 1380, 900, 300)
poser(mot, 120, 1260, 660); poser(sombre(mot), 1020, 1260, 660)
pl.convert('RGB').save(out + 'planche.jpg', quality=88)
print('ok', complet.size, emb.size, mot.size)

# logo horizontal (emblème + TALENT & SPORTS) pour l'en-tête
def horizontal(e, t, h=120, gap=28):
    e = e.copy(); e.thumbnail((10000, h), Image.LANCZOS)
    t = t.copy(); t.thumbnail((10000, int(h * .34)), Image.LANCZOS)
    im = Image.new('RGBA', (e.width + gap + t.width, h), (0, 0, 0, 0))
    im.alpha_composite(e, (0, 0)); im.alpha_composite(t, (e.width + gap, (h - t.height) // 2))
    return im
for nom, e, t in [('horizontal-sombre', sombre(emb), sombre(mot)), ('horizontal-clair', emb, mot)]:
    im = horizontal(e, t, 160); im.save(out + nom + '.webp', quality=90, method=6); im.save(out + nom + '.png', optimize=True)

# image d'aperçu WhatsApp / Facebook : logo sombre sur bleu nuit
og = Image.new('RGBA', (1200, 630), (7, 17, 31, 255))
l = sombre(complet, prot_complet).copy(); l.thumbnail((560, 560), Image.LANCZOS)
og.alpha_composite(l, ((1200 - l.width) // 2, (630 - l.height) // 2))
og.convert('RGB').save('site/assets/img/og.jpg', quality=85)
