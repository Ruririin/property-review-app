from django.db import migrations
from property_review.fields import ValidatedUUIDField
import uuid

class Migration(migrations.Migration):

    dependencies = [
        ('property_review', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='project',
            name='id',
            field=ValidatedUUIDField(default=uuid.uuid4, editable=False, primary_key=True),
        ),
        migrations.AlterField(
            model_name='propertyslide',
            name='id',
            field=ValidatedUUIDField(default=uuid.uuid4, editable=False, primary_key=True),
        ),
        migrations.AlterField(
            model_name='template',
            name='id',
            field=ValidatedUUIDField(default=uuid.uuid4, editable=False, primary_key=True),
        ),
    ]
