from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import uuid


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('property_review', '0020_merge_0018_auto_20251013_1144_0019_auto_20251013_1154'),
    ]

    operations = [
        migrations.CreateModel(
            name='ExportedPDF',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('filename', models.CharField(max_length=255)),
                ('project_name', models.CharField(blank=True, max_length=255)),
                ('file_path', models.CharField(max_length=500)),
                ('file_size', models.BigIntegerField(default=0)),
                ('export_date', models.DateTimeField(auto_now_add=True)),
                ('owner', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='exported_pdfs', to=settings.AUTH_USER_MODEL)),
                ('project', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='exported_pdfs', to='property_review.project')),
            ],
            options={
                'db_table': 'exported_pdfs',
                'ordering': ['-export_date'],
            },
        ),
    ]
