from django.urls import path
from django.views.generic import RedirectView

from . import views

urlpatterns = [
    path('', views.accueil, name='accueil'),
    path('joueurs/', views.joueurs, name='joueurs'),
    path('joueurs/<slug:slug>/', views.joueur, name='joueur'),
    path('videos/', views.videos, name='videos'),
    path('contact/', views.contact, name='contact'),
    # anciennes adresses du site statique
    path('galerie.html', RedirectView.as_view(pattern_name='videos', permanent=True)),
    path('index.html', RedirectView.as_view(pattern_name='accueil', permanent=True)),
]
