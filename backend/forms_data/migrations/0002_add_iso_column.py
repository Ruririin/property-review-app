# Generated manually to add ISO column to existing tbl_lro table

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('forms_data', '0001_initial'),
    ]

    operations = [
        migrations.RunSQL(
            "ALTER TABLE tbl_lro ADD COLUMN ISO VARCHAR(255) NULL;",
            reverse_sql="ALTER TABLE tbl_lro DROP COLUMN ISO;"
        ),
    ]