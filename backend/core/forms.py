from django import forms
from django.forms import inlineformset_factory

from .medias import id_youtube
from .models import EtapeCarriere, Joueur, Langue, Message, Video


class DateInput(forms.DateInput):
    input_type = 'date'

    def __init__(self, **kw):
        super().__init__(format='%Y-%m-%d', **kw)


class JoueurForm(forms.ModelForm):
    class Meta:
        model = Joueur
        exclude = ['ordre']
        widgets = {
            'date_naissance': DateInput(),
            'presentation': forms.Textarea(attrs={'rows': 4}),
            # simple bouton « choisir un fichier » (l'image actuelle est montrée à côté)
            'photo': forms.FileInput(attrs={'accept': 'image/*'}),
            'club_logo': forms.FileInput(attrs={'accept': 'image/*'}),
        }


EtapeFormSet = inlineformset_factory(
    Joueur, EtapeCarriere, fields=['club', 'logo', 'pays', 'niveau', 'debut', 'fin'],
    widgets={'logo': forms.FileInput(attrs={'accept': 'image/*'})}, extra=1, can_delete=True)

LangueFormSet = inlineformset_factory(
    Joueur, Langue, fields=['langue', 'niveau'], extra=1, can_delete=True)


class VideoForm(forms.ModelForm):
    class Meta:
        model = Video
        fields = ['titre', 'categorie', 'joueur', 'fichier', 'youtube', 'description',
                  'miniature', 'publie', 'a_la_une']
        widgets = {
            'description': forms.Textarea(attrs={'rows': 3}),
            'fichier': forms.FileInput(attrs={'accept': 'video/*'}),
            'miniature': forms.FileInput(attrs={'accept': 'image/*'}),
            'youtube': forms.URLInput(attrs={'placeholder': 'https://youtu.be/…'}),
        }

    def __init__(self, *a, **kw):
        super().__init__(*a, **kw)
        self.fields['joueur'].empty_label = '— Aucun —'
        self.fields['joueur'].help_text = 'À choisir si la vidéo montre un joueur précis : elle apparaîtra sur sa fiche.'

    def clean(self):
        d = super().clean()
        a_fichier = bool(d.get('fichier')) or bool(self.instance.fichier and d.get('fichier') is not False)
        if d.get('youtube') and not id_youtube(d['youtube']):
            self.add_error('youtube', 'Ce lien YouTube n’est pas reconnu. Exemple : https://youtu.be/abcdefghijk')
        if not a_fichier and not d.get('youtube'):
            raise forms.ValidationError('Choisissez un fichier vidéo OU collez un lien YouTube.')
        if d.get('categorie') == 'joueur' and not d.get('joueur'):
            self.add_error('joueur', 'Indiquez de quel joueur il s’agit.')
        return d


class ContactForm(forms.ModelForm):
    accord = forms.BooleanField(required=True)

    class Meta:
        model = Message
        fields = ['nom', 'email', 'telephone', 'profil', 'message']
