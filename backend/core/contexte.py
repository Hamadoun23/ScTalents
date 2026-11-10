"""Coordonnées de l'agence, disponibles dans toutes les pages (réglées dans settings.py)."""
from django.conf import settings


def coordonnees(request):
    tel = settings.CONTACT_TELEPHONE
    chiffres = ''.join(c for c in tel if c.isdigit())
    return {
        'tel_affiche': tel,
        'tel_lien': f'tel:+{chiffres}',
        'whatsapp_numero': chiffres,
        'whatsapp_lien': f'https://wa.me/{chiffres}?text='
                         + 'Bonjour%20SC%2B%20Talent%20%26%20Sports%2C%20je%20vous%20contacte%20depuis%20votre%20site.',
    }
