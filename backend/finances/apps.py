from django.apps import AppConfig


class FinancesConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'finances'
    verbose_name = 'Financial Management'

    def ready(self):
        import finances.signals  # Import signals