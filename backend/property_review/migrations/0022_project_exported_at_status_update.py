from django.db import migrations, models


def migrate_editing_to_personal_draft(apps, schema_editor):
    """Update existing projects with status='editing' to 'personal_draft'"""
    Project = apps.get_model('property_review', 'Project')
    updated = Project.objects.filter(status='editing').update(status='personal_draft')
    if updated:
        print(f"  Migrated {updated} projects from 'editing' to 'personal_draft'")


class Migration(migrations.Migration):

    dependencies = [
        ('property_review', '0021_exported_pdfs'),
    ]

    operations = [
        # Add exported_at field
        migrations.AddField(
            model_name='project',
            name='exported_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
        # Change status default
        migrations.AlterField(
            model_name='project',
            name='status',
            field=models.CharField(default='personal_draft', max_length=20),
        ),
        # Data migration: editing -> personal_draft
        migrations.RunPython(migrate_editing_to_personal_draft, migrations.RunPython.noop),
    ]