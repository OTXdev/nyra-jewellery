from django.core.management.base import BaseCommand

from store.models import Collection

COLLECTIONS = [
    {
        "name": "Ramadan Edit",
        "description": "Bijoux élégants et discrets pour accompagner vos soirées du Ramadan.",
        "featured": True,
    },
    {
        "name": "Bridal Line",
        "description": "Une sélection raffinée pour sublimer votre plus beau jour.",
        "featured": True,
    },
    {
        "name": "Everyday Essentials",
        "description": "Des pièces intemporelles pour un quotidien sans effort.",
        "featured": False,
    },
    {
        "name": "Gift Edit",
        "description": "Le cadeau parfait à offrir, pour toutes les occasions.",
        "featured": False,
    },
]


class Command(BaseCommand):
    help = "Seed a few starter collections (Ramadan Edit, Bridal Line, etc.)."

    def handle(self, *args, **options):
        created, updated = 0, 0
        for data in COLLECTIONS:
            obj, was_created = Collection.objects.update_or_create(
                name=data["name"],
                defaults={
                    "description": data["description"],
                    "featured": data["featured"],
                },
            )
            created += int(was_created)
            updated += int(not was_created)
        self.stdout.write(
            self.style.SUCCESS(
                f"Collections seeded: {created} created, {updated} updated."
            )
        )
