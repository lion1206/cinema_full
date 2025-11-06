from django.contrib import admin
from django.contrib.auth.models import User
from django.contrib.auth.admin import UserAdmin

# Unregister the default User admin and register it with your custom UserAdmin if needed,
# or just register User directly if you don't have custom admin for it here.
# The provided code implies you're just using the default UserAdmin.
admin.site.unregister(User)
admin.site.register(User, UserAdmin)