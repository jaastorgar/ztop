from django.urls import re_path
from . import consumers  
from social import consumers as social_consumers 

websocket_urlpatterns = [
    re_path(r'ws/juego/(?P<sala_codigo>\w+)/$', consumers.JuegoConsumer.as_asgi()),
    re_path(r'ws/social/$', social_consumers.SocialConsumer.as_asgi()),
]