from django.db import migrations, models

class Migration(migrations.Migration):
    dependencies = [
        ('property_review', '0012_add_selected_location_index_default'),
    ]

    operations = [
        migrations.AddField(
            model_name='project',
            name='showWebsite',
            field=models.BooleanField(default=False),
        ),
    ]
