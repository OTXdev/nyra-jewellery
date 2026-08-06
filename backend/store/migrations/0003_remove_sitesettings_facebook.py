from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("store", "0002_sitesettings"),
    ]

    operations = [
        migrations.RemoveField(
            model_name="sitesettings",
            name="facebook",
        ),
    ]
