"""Pages publiques : accueil, joueurs, fiche CV d'un joueur, vidéos, contact."""
import segno
from django.contrib import messages
from django.http import JsonResponse
from django.shortcuts import get_object_or_404, redirect, render
from django.views.decorators.http import require_POST

from .forms import ContactForm
from .models import CHOIX_POSTES, Joueur, Video


def accueil(request):
    return render(request, 'accueil.html', {
        'joueurs': Joueur.objects.filter(publie=True)[:8],
        'videos': Video.objects.filter(publie=True, etat='pret').order_by('-a_la_une', '-ordre', '-cree_le')[:6],
    })


def joueurs(request):
    poste = request.GET.get('poste', '')
    liste = Joueur.objects.filter(publie=True)
    if poste:
        liste = liste.filter(poste=poste)
    postes = [(k, l) for k, l in CHOIX_POSTES if Joueur.objects.filter(publie=True, poste=k).exists()]
    return render(request, 'joueurs.html', {'joueurs': liste, 'postes': postes, 'poste': poste})


def joueur(request, slug):
    j = get_object_or_404(Joueur.objects.prefetch_related('carriere', 'langues'), slug=slug)
    if not j.publie and not request.user.is_staff:
        return render(request, '404.html', status=404)
    # QR code vers la fiche (pratique quand le CV est imprimé ou envoyé en PDF)
    qr = segno.make(request.build_absolute_uri(j.get_absolute_url()), error='m')
    return render(request, 'joueur.html', {
        'j': j,
        'videos': j.videos.filter(publie=True, etat='pret'),
        'qr': qr.svg_inline(scale=4, dark='#141414', border=0),
        'pays': sorted({e.pays for e in j.carriere.all() if e.pays}),
        'niveaux': sorted({e.niveau for e in j.carriere.all() if e.niveau}),
    })


def videos(request):
    toutes = Video.objects.filter(publie=True, etat='pret').select_related('joueur')
    sections = []
    for cle, titre, texte in [
        ('match', 'Les matchs', 'Nos jeunes en compétition.'),
        ('joueur', 'Les joueurs', 'Les vidéos de nos talents, une par joueur.'),
        ('equipe', 'L’équipe', 'La vie du groupe : entraînements, causeries, coulisses.'),
        ('evenement', 'Les événements', 'Tournois, cérémonies et rencontres.'),
        ('entreprise', 'L’agence', 'SC+ Talent & Sports, ses actions et son réseau.'),
    ]:
        liste = [v for v in toutes if v.categorie == cle]
        if liste:
            sections.append({'cle': cle, 'titre': titre, 'texte': texte, 'videos': liste})
    return render(request, 'videos.html', {'sections': sections, 'une': next(iter(toutes), None)})


@require_POST
def contact(request):
    form = ContactForm(request.POST)
    ok = form.is_valid()
    if ok:
        form.save()
    if request.headers.get('x-requested-with') == 'fetch':
        return JsonResponse({'ok': ok})
    if ok:
        messages.success(request, 'Merci, votre message est bien envoyé. Nous vous répondons rapidement.')
    else:
        messages.error(request, 'Merci de remplir votre nom, un e-mail valide, votre message et de cocher la case.')
    return redirect('/#contact')
