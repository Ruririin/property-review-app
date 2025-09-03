from django.db import migrations
import uuid

def forward_func(apps, schema_editor):
    Project = apps.get_model('property_review', 'Project')
    db_alias = schema_editor.connection.alias
    
    # Find all projects that might have numeric-style IDs
    for project in Project.objects.using(db_alias).all():
        try:
            # If the ID looks numeric and it's not already stored as a legacy_id
            if str(project.id).isdigit() and not project.legacy_id:
                old_id = str(project.id)
                project.legacy_id = int(old_id)
                project.id = uuid.uuid4()  # Generate new UUID
                project.save()
        except (ValueError, AttributeError):
            # Skip if there's any error parsing the ID
            continue

def reverse_func(apps, schema_editor):
    # No reverse migration needed - we don't want to convert UUIDs back to numeric IDs
    pass

class Migration(migrations.Migration):
    dependencies = [
        ('property_review', '0003_project_legacy_id_alter_project_id_and_more'),
    ]

    operations = [
        migrations.RunPython(forward_func, reverse_func),
    ]
