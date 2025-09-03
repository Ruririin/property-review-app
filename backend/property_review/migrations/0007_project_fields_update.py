from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('property_review', '0006_propertyslide_fieldpositions_propertyslide_formdata'),
    ]

    operations = [
        migrations.AddField(
            model_name='project',
            name='multipleLocationsMode',
            field=models.BooleanField(default=False),
        ),
    ]
