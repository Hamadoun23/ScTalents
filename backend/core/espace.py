"""Espace admin simplifié : joueurs (CV), vidéos, messages.

Pensé pour des personnes peu à l'aise avec l'informatique : grandes tuiles,
formulaires en français, un message de confirmation après chaque action.
"""
from django.contrib import messages
from django.contrib.auth import views as auth_views
from django.contrib.auth.decorators import login_required
from django.db import transaction
from django.shortcuts import get_object_or_404, redirect, render
from django.urls import reverse_lazy
from django.views.decorators.http import require_POST

from .forms import EtapeFormSet, JoueurForm, LangueFormSet, VideoForm
from .medias import alleger_image, preparer_video
from .models import Joueur, Message, Video


class Connexion(auth_views.LoginView):
    template_name = 'espace/connexion.html'
    redirect_authenticated_user = True


class MotDePasse(auth_views.PasswordChangeView):
    template_name = 'espace/mot_de_passe.html'
    success_url = reverse_lazy('espace:tableau')

    def form_valid(self, form):
        messages.success(self.request, 'Votre mot de passe a été changé.')
        return super().form_valid(form)


@login_required
def tableau(request):
    return render(request, 'espace/tableau.html', {
        'nb_joueurs': Joueur.objects.count(),
        'nb_videos': Video.objects.count(),
        'nb_non_lus': Message.objects.filter(lu=False).count(),
        'derniers_joueurs': Joueur.objects.order_by('-modifie_le')[:4],
    })


# ---------------- Joueurs ----------------

@login_required
def joueurs(request):
    q = request.GET.get('q', '').strip()
    liste = Joueur.objects.all()
    if q:
        liste = liste.filter(nom__icontains=q) | liste.filter(prenom__icontains=q)
    return render(request, 'espace/joueurs.html', {'joueurs': liste, 'q': q})


@login_required
def joueur_form(request, pk=None):
    j = get_object_or_404(Joueur, pk=pk) if pk else Joueur()
    if request.method == 'POST':
        form = JoueurForm(request.POST, request.FILES, instance=j)
        etapes = EtapeFormSet(request.POST, request.FILES, instance=j, prefix='etapes')
        langues = LangueFormSet(request.POST, instance=j, prefix='langues')
        if form.is_valid() and etapes.is_valid() and langues.is_valid():
            with transaction.atomic():
                j = form.save(commit=False)
                alleger_image(j.photo, 900)
                alleger_image(j.club_logo, 400)
                j.save()
                etapes.instance = langues.instance = j
                for e in etapes.save(commit=False):
                    alleger_image(e.logo, 400)
                    e.save()
                for e in etapes.deleted_objects:
                    e.delete()
                langues.save()
            messages.success(request, f'La fiche de {j} est enregistrée.')
            return redirect('espace:joueur_modifier', pk=j.pk)
        messages.error(request, 'Certaines informations sont à corriger (en rouge ci-dessous).')
    else:
        form = JoueurForm(instance=j)
        etapes = EtapeFormSet(instance=j, prefix='etapes')
        langues = LangueFormSet(instance=j, prefix='langues')
    return render(request, 'espace/joueur_form.html', {
        'j': j, 'form': form, 'etapes': etapes, 'langues': langues,
        'videos': j.videos.all() if j.pk else [],
    })


@login_required
def joueur_supprimer(request, pk):
    j = get_object_or_404(Joueur, pk=pk)
    if request.method == 'POST':
        nom = str(j)
        j.delete()
        messages.success(request, f'La fiche de {nom} a été supprimée.')
        return redirect('espace:joueurs')
    return render(request, 'espace/confirmer.html', {
        'titre': f'Supprimer la fiche de {j} ?',
        'texte': 'Sa carrière, ses langues et ses vidéos seront supprimées aussi. Cette action est définitive.',
        'retour': 'espace:joueurs',
    })


# ---------------- Vidéos ----------------

@login_required
def videos(request):
    cat = request.GET.get('categorie', '')
    liste = Video.objects.select_related('joueur')
    if cat:
        liste = liste.filter(categorie=cat)
    return render(request, 'espace/videos.html', {
        'videos': liste, 'categorie': cat, 'categories': Video.CATEGORIES})


@login_required
def video_form(request, pk=None):
    v = get_object_or_404(Video, pk=pk) if pk else Video()
    if request.method == 'POST':
        form = VideoForm(request.POST, request.FILES, instance=v)
        if form.is_valid():
            nouveau_fichier = 'fichier' in request.FILES
            v = form.save(commit=False)
            alleger_image(v.miniature, 900)
            if nouveau_fichier and not request.FILES.get('miniature'):
                v.miniature = None          # l'aperçu sera recréé à partir de la nouvelle vidéo
            v.save()
            if nouveau_fichier:
                preparer_video(v)
                messages.success(request, f'La vidéo « {v} » est enregistrée. Elle est en cours de préparation '
                                          '(allègement) et apparaîtra sur le site dans quelques minutes.')
            else:
                messages.success(request, f'La vidéo « {v} » est enregistrée.')
            suivant = request.POST.get('suivant')
            return redirect(suivant if suivant and suivant.startswith('/espace/') else 'espace:videos')
        messages.error(request, 'Certaines informations sont à corriger (en rouge ci-dessous).')
    else:
        initial = {}
        if not pk and request.GET.get('joueur'):
            initial = {'joueur': request.GET['joueur'], 'categorie': 'joueur'}
        form = VideoForm(instance=v, initial=initial)
    return render(request, 'espace/video_form.html', {
        'v': v, 'form': form, 'suivant': request.GET.get('suivant', '')})


@login_required
def video_supprimer(request, pk):
    v = get_object_or_404(Video, pk=pk)
    if request.method == 'POST':
        titre = str(v)
        for champ in (v.fichier, v.miniature):
            if champ:
                champ.delete(save=False)
        v.delete()
        messages.success(request, f'La vidéo « {titre} » a été supprimée.')
        return redirect('espace:videos')
    return render(request, 'espace/confirmer.html', {
        'titre': f'Supprimer la vidéo « {v} » ?',
        'texte': 'Le fichier sera effacé du serveur. Cette action est définitive.',
        'retour': 'espace:videos',
    })


@login_required
@require_POST
def basculer(request, quoi, pk):
    """Interrupteur Visible / Masqué sur les listes."""
    obj = get_object_or_404(Joueur if quoi == 'joueur' else Video, pk=pk)
    obj.publie = not obj.publie
    obj.save(update_fields=['publie'])
    messages.success(request, f'« {obj} » est maintenant {"visible" if obj.publie else "masqué"} sur le site.')
    return redirect(request.POST.get('suivant') or 'espace:tableau')


# ---------------- Messages ----------------

@login_required
def boite(request):
    return render(request, 'espace/messages.html', {'liste': Message.objects.all()})


@login_required
@require_POST
def message_action(request, pk, action):
    m = get_object_or_404(Message, pk=pk)
    if action == 'supprimer':
        m.delete()
        messages.success(request, 'Message supprimé.')
    else:
        m.lu = not m.lu
        m.save(update_fields=['lu'])
    return redirect('espace:messages')
