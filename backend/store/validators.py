import re

from django.core.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _

PHONE_SPACES = re.compile(r"\s+")
LOCAL_PHONE = re.compile(r"^0[5-7][0-9]{8}$")
INTERNATIONAL_PHONE = re.compile(r"^\+213[5-7][0-9]{8}$")


def validate_phone(value):
    if not isinstance(value, str):
        raise ValidationError(_("Entrer un numéro de téléphone algérien valide"))

    stripped = value.strip()
    if not stripped:
        raise ValidationError(_("Entrer un numéro de téléphone algérien valide."))

    normalized = PHONE_SPACES.sub("", stripped)

    if not (LOCAL_PHONE.fullmatch(normalized) or INTERNATIONAL_PHONE.fullmatch(normalized)):
        raise ValidationError(
            _(
                "Entrer un numéro de téléphone valide (e.g. 0550123456 ou "
                "+213550123456). Seuls les numéros internationaux +213 sont acceptés."
            )
        )

    return stripped
