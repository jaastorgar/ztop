# ztop_server/middleware.py
import os
import django
from urllib.parse import parse_qs
from channels.auth import AuthMiddlewareStack
from channels.db import database_sync_to_async
from rest_framework.authtoken.models import Token
from django.contrib.auth.models import AnonymousUser

# Aseguramos que Django esté configurado
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ztop_server.settings')
django.setup()

@database_sync_to_async
def get_user(token_key):
    try:
        # Buscamos el token en la base de datos
        token = Token.objects.get(key=token_key)
        return token.user
    except Token.DoesNotExist:
        return AnonymousUser()

class TokenAuthMiddleware:
    def __init__(self, inner):
        self.inner = inner

    async def __call__(self, scope, receive, send):
        # Extraemos el token de la URL (ej: ?token=abc123...)
        query_string = scope.get('query_string', b'').decode('utf-8')
        query_params = parse_qs(query_string)
        token_key = query_params.get('token', [None])[0]

        if token_key:
            # Autenticamos al usuario asíncronamente
            scope['user'] = await get_user(token_key)
        else:
            scope['user'] = AnonymousUser()
            
        # Pasamos el scope al siguiente middleware/consumidor
        return await self.inner(scope, receive, send)