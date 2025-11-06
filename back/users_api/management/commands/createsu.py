from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
import os

class Command(BaseCommand):
    help = "Create default superuser if not exists"

    def handle(self, *args, **kwargs):
        User = get_user_model()
        username = os.environ.get('DEFAULT_SUPERUSER', 'admin')
        password = os.environ.get('DEFAULT_SUPERPASS', 'admin123')
        email = os.environ.get('DEFAULT_SUPEREMAIL', 'admin@example.com')
        if not User.objects.filter(username=username).exists():
            User.objects.create_superuser(username=username, email=email, password=password)
            self.stdout.write(self.style.SUCCESS(f'Superuser created: {username}'))
        else:
            self.stdout.write('Superuser already exists')
