from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from store.urls import admin_panel_urls

urlpatterns = [
    path('django-admin/', admin.site.urls),
    path('api/', include('store.urls')),
] + admin_panel_urls

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
