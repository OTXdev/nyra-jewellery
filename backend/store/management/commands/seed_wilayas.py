from django.core.management.base import BaseCommand

from store.models import Wilaya

# The 58 wilayas of Algeria (post-2021 redistricting), with code and name.
# Delivery fees are reasonable defaults in DA and can be edited afterwards
# from the Django admin or the admin API.
WILAYAS = [
    ("01", "Adrar", 1200),
    ("02", "Chlef", 700),
    ("03", "Laghouat", 900),
    ("04", "Oum El Bouaghi", 700),
    ("05", "Batna", 700),
    ("06", "Béjaïa", 600),
    ("07", "Biskra", 800),
    ("08", "Béchar", 1300),
    ("09", "Blida", 500),
    ("10", "Bouira", 600),
    ("11", "Tamanrasset", 1600),
    ("12", "Tébessa", 800),
    ("13", "Tlemcen", 800),
    ("14", "Tiaret", 700),
    ("15", "Tizi Ouzou", 600),
    ("16", "Alger", 400),
    ("17", "Djelfa", 800),
    ("18", "Jijel", 700),
    ("19", "Sétif", 650),
    ("20", "Saïda", 800),
    ("21", "Skikda", 700),
    ("22", "Sidi Bel Abbès", 800),
    ("23", "Annaba", 750),
    ("24", "Guelma", 750),
    ("25", "Constantine", 650),
    ("26", "Médéa", 600),
    ("27", "Mostaganem", 700),
    ("28", "M'Sila", 700),
    ("29", "Mascara", 750),
    ("30", "Ouargla", 1100),
    ("31", "Oran", 700),
    ("32", "El Bayadh", 1000),
    ("33", "Illizi", 1800),
    ("34", "Bordj Bou Arréridj", 650),
    ("35", "Boumerdès", 500),
    ("36", "El Tarf", 800),
    ("37", "Tindouf", 1900),
    ("38", "Tissemsilt", 750),
    ("39", "El Oued", 1100),
    ("40", "Khenchela", 800),
    ("41", "Souk Ahras", 800),
    ("42", "Tipaza", 500),
    ("43", "Mila", 700),
    ("44", "Aïn Defla", 600),
    ("45", "Naâma", 1100),
    ("46", "Aïn Témouchent", 800),
    ("47", "Ghardaïa", 1000),
    ("48", "Relizane", 750),
    ("49", "Timimoun", 1400),
    ("50", "Bordj Badji Mokhtar", 1900),
    ("51", "Ouled Djellal", 900),
    ("52", "Béni Abbès", 1400),
    ("53", "In Salah", 1700),
    ("54", "In Guezzam", 2000),
    ("55", "Touggourt", 1100),
    ("56", "Djanet", 1900),
    ("57", "El M'Ghair", 1100),
    ("58", "El Meniaa", 1300),
]


class Command(BaseCommand):
    help = "Seed the database with the 58 Algerian wilayas and default COD delivery fees."

    def handle(self, *args, **options):
        created, updated = 0, 0
        for code, name, fee in WILAYAS:
            obj, was_created = Wilaya.objects.update_or_create(
                code=code,
                defaults={"name": name, "delivery_fee": fee},
            )
            created += int(was_created)
            updated += int(not was_created)

        self.stdout.write(
            self.style.SUCCESS(f"Wilayas seeded: {created} created, {updated} updated.")
        )
