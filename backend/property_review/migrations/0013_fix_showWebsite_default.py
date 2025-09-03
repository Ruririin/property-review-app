from django.db import migrations

class Migration(migrations.Migration):
    dependencies = [
        ('property_review', '0012_add_selected_location_index_default'),
    ]

    operations = [
        migrations.RunSQL(
            sql="""
            ALTER TABLE projects 
            MODIFY showWebsite TINYINT(1) NOT NULL DEFAULT 0;
            UPDATE projects SET showWebsite = 0 WHERE showWebsite IS NULL;
            """,
            reverse_sql="""
            ALTER TABLE projects 
            MODIFY showWebsite TINYINT(1);
            """
        ),
    ]
