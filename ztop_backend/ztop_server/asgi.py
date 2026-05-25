import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
import juego.routing
from .middleware import TokenAuthMiddleware  # Importamos nuestro middleware

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ztop_server.settings')

application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    "websocket": TokenAuthMiddleware(
        URLRouter(
            juego.routing.websocket_urlpatterns
        )
    ),
})