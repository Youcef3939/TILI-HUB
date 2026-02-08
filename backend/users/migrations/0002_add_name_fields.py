from django.db import migrations, models

class Migration(migrations.Migration):

    dependencies = [
        ('users', '0001_initial'),  # Make sure this matches your previous migration
    ]

    operations = [
        migrations.AddField(
            model_name='associationaccount',
            name='president_name',
            field=models.CharField(blank=True, help_text="Full name of the association's president", max_length=255, null=True),
        ),
        migrations.AddField(
            model_name='associationaccount',
            name='treasurer_name',
            field=models.CharField(blank=True, help_text="Full name of the association's treasurer", max_length=255, null=True),
        ),
        migrations.AddField(
            model_name='associationaccount',
            name='secretary_name',
            field=models.CharField(blank=True, help_text="Full name of the association's general secretary", max_length=255, null=True),
        ),
    ]