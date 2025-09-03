from django.db import migrations

class Migration(migrations.Migration):

    dependencies = [
        ('property_review', '0011_alter_project_multiplelocationsmode'),
    ]

    operations = [
        migrations.RunSQL(
            sql="""
                ALTER TABLE projects MODIFY selectedLocationIndex INT NOT NULL DEFAULT 0;
                UPDATE projects SET selectedLocationIndex = 0 WHERE selectedLocationIndex IS NULL;
            """,
            reverse_sql="""
                ALTER TABLE projects MODIFY selectedLocationIndex INT NULL;
            """
        ),
    ]
