from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    # Ruta para conectarse a una sala mobile específica usando su código pin
    re_path(r'ws/juego/(?P<sala_codigo>\w+)/$', consumers.JuegoConsumer.as_asgi()),
]