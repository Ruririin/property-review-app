from django.db import migrations, models

class Migration(migrations.Migration):
    dependencies = [
        ('property_review', '0010_alter_project_multiplelocationsmode'),
    ]

    operations = [
        migrations.AlterField(
            model_name='project',
            name='multipleLocationsMode',
            field=models.BooleanField(default=False, db_default=False),
        ),
        # Add a data migration to ensure all existing rows have a value
        migrations.RunSQL(
            sql='UPDATE projects SET multipleLocationsMode = 0 WHERE multipleLocationsMode IS NULL;',
            reverse_sql='',
        ),
    ]
