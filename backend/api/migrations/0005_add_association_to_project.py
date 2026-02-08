from django.db import migrations

class Migration(migrations.Migration):
    dependencies = [
        ('api', '0002_auto_20250423_2208'),  # Make sure this references your most recent migration
    ]

    operations = [
        migrations.RunSQL(
            "ALTER TABLE api_project ADD COLUMN association_id integer REFERENCES users_associationaccount(id) ON DELETE CASCADE;",
            "ALTER TABLE api_project DROP COLUMN association_id;"
        ),
    ]