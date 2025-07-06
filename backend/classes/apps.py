# classes/apps.py
from django.apps import AppConfig

class ClassesConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'classes'

    # Thêm hàm này để import signals
    def ready(self):
        import classes.signals