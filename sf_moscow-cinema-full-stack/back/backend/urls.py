from django.contrib import admin
from django.urls import path, include
from django.conf import settings # ADD THIS IMPORT
from django.conf.urls.static import static # ADD THIS IMPORT

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/users/', include('users_api.urls')),
    path('api/tickets/', include('tickets_api.urls')),
]

# NEW: Serve static and media files in development (when DEBUG is True)
if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)