from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("store", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="SiteSettings",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                (
                    "phone",
                    models.CharField(
                        blank=True,
                        help_text="Phone number (digits only, e.g. 213555000000)",
                        max_length=50,
                    ),
                ),
                (
                    "phone_display",
                    models.CharField(
                        blank=True,
                        help_text="Formatted phone for display, e.g. +213 555 00 00 00",
                        max_length=50,
                    ),
                ),
                ("email", models.EmailField(blank=True, max_length=254)),
                ("address", models.CharField(blank=True, max_length=200)),
                ("instagram", models.URLField(blank=True)),
                ("facebook", models.URLField(blank=True)),
                ("tiktok", models.URLField(blank=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={
                "verbose_name": "Site Settings",
                "verbose_name_plural": "Site Settings",
            },
        ),
    ]
