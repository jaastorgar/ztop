"""
URL configuration for ztop_server project.
"""
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include('juego.urls')),
    path('api/social/', include('social.urls')),
    path('api/tienda/', include('tienda.urls')),
]