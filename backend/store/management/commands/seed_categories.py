from django.core.management.base import BaseCommand

from store.models import Category

CATEGORIES = [
    ("Rings", "Rings for every occasion."),
    ("Necklaces", "Necklaces and pendants."),
    ("Bracelets", "Bracelets and bangles."),
    ("Sets", "Complete jewelry sets."),
]


class Command(BaseCommand):
    help = "Seed the 4 fixed categories (Rings, Necklaces, Bracelets, Sets)."

    def handle(self, *args, **options):
        created, updated = 0, 0
        for name, description in CATEGORIES:
            obj, was_created = Category.objects.update_or_create(
                name=name, defaults={"description": description}
            )
            created += int(was_created)
            updated += int(not was_created)
        self.stdout.write(
            self.style.SUCCESS(f"Categories seeded: {created} created, {updated} updated.")
        )
