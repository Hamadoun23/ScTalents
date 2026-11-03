# Admin Django « technique » (/gestion-technique/), réservée au technicien.
# Les utilisateurs du quotidien passent par l'espace simplifié (/espace/).
from django.contrib import admin

from .models import EtapeCarriere, Joueur, Langue, Message, Video


class EtapeInline(admin.TabularInline):
    model = EtapeCarriere
    extra = 0


class LangueInline(admin.TabularInline):
    model = Langue
    extra = 0


@admin.register(Joueur)
class JoueurAdmin(admin.ModelAdmin):
    list_display = ['__str__', 'poste', 'club', 'publie']
    inlines = [EtapeInline, LangueInline]


@admin.register(Video)
class VideoAdmin(admin.ModelAdmin):
    list_display = ['titre', 'categorie', 'joueur', 'etat', 'publie']
    list_filter = ['categorie', 'etat', 'publie']


admin.site.register(Message)
admin.site.site_header = 'SC+ Talent & Sports — gestion technique'
