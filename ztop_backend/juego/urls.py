from django.urls import path
from .views import (
    RegistroUsuarioView,
    LoginUsuarioView,
    CrearSalaView,
    DetalleSalaView,
    UnirseSalaView,
    GuardarRespuestaView,
    ResultadosRondaView,
    PerfilUsuarioDetalleView
)

urlpatterns = [
    # ==========================================
    # AUTENTICACIÓN DE USUARIOS
    # ==========================================
    path('api/auth/registrar/', RegistroUsuarioView.as_view(), name='registrar'),
    path('api/auth/login/', LoginUsuarioView.as_view(), name='login'),
    path('api/auth/perfil/', PerfilUsuarioDetalleView.as_view(), name='perfil_detalle'),
    
    # ==========================================
    # GESTIÓN DE SALAS (LOBBY)
    # ==========================================
    path('api/sala/crear/', CrearSalaView.as_view(), name='crear_sala'),
    path('api/sala/<str:codigo_sala>/', DetalleSalaView.as_view(), name='detalle_sala'),
    path('api/sala/<str:codigo_sala>/unirse/', UnirseSalaView.as_view(), name='unirse_sala'),
    
    # ==========================================
    # GESTIÓN DE RONDAS (JUEGO)
    # ==========================================
    path('api/sala/<str:codigo_sala>/responder/', GuardarRespuestaView.as_view(), name='guardar_respuesta'),
    path('api/sala/<str:codigo_sala>/resultados/', ResultadosRondaView.as_view(), name='resultados_ronda'),
]