# Generated manually to add last_export_time field
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('property_review', '0022_project_exported_at_status_update'),
    ]

    operations = [
        migrations.AddField(
            model_name='project',
            name='last_export_time',
            field=models.BigIntegerField(blank=True, null=True),
        ),
    ]