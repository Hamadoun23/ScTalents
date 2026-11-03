from django.contrib.auth.views import LogoutView
from django.urls import path

from . import espace

app_name = 'espace'

urlpatterns = [
    path('', espace.tableau, name='tableau'),
    path('connexion/', espace.Connexion.as_view(), name='connexion'),
    path('deconnexion/', LogoutView.as_view(next_page='espace:connexion'), name='deconnexion'),
    path('mot-de-passe/', espace.MotDePasse.as_view(), name='mot_de_passe'),
    path('joueurs/', espace.joueurs, name='joueurs'),
    path('joueurs/nouveau/', espace.joueur_form, name='joueur_nouveau'),
    path('joueurs/<int:pk>/', espace.joueur_form, name='joueur_modifier'),
    path('joueurs/<int:pk>/supprimer/', espace.joueur_supprimer, name='joueur_supprimer'),
    path('videos/', espace.videos, name='videos'),
    path('videos/nouvelle/', espace.video_form, name='video_nouvelle'),
    path('videos/<int:pk>/', espace.video_form, name='video_modifier'),
    path('videos/<int:pk>/supprimer/', espace.video_supprimer, name='video_supprimer'),
    path('basculer/<str:quoi>/<int:pk>/', espace.basculer, name='basculer'),
    path('messages/', espace.boite, name='messages'),
    path('messages/<int:pk>/<str:action>/', espace.message_action, name='message_action'),
]
