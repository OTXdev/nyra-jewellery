from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("store", "0003_remove_sitesettings_facebook"),
    ]

    operations = [
        migrations.AddField(
            model_name="order",
            name="delivery_method",
            field=models.CharField(
                choices=[("home", "Home delivery"), ("office", "Office pickup")],
                default="home",
                max_length=20,
            ),
        ),
        migrations.AlterField(
            model_name="order",
            name="commune",
            field=models.CharField(blank=True, max_length=150),
        ),
        migrations.AlterField(
            model_name="order",
            name="address",
            field=models.TextField(blank=True),
        ),
    ]
