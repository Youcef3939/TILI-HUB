from django.db import migrations

class Migration(migrations.Migration):
    dependencies = [
        ('api', '0002_auto_20250423_2208'),  # Update this to match your last migration
    ]

    operations = [
        migrations.RunSQL(
            "ALTER TABLE api_member ADD COLUMN association_id integer REFERENCES users_associationaccount(id) ON DELETE CASCADE;",
            "ALTER TABLE api_member DROP COLUMN association_id;"
        ),
    ]