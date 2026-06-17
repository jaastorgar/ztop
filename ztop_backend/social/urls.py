from django.urls import path
from .views import (
    # Vistas Originales
    ListaChatsView,
    HistorialMensajesView, # 👈 SOLUCIÓN: Nueva vista importada
    ListaNotificacionesView,
    BuscarUsuariosView,
    ResponderSolicitudView,
    
    # Vistas Nuevas de Clanes
    RankingClanesView, 
    CrearClanView, 
    MiClanView, 
    DetalleClanView, 
    UnirseClanView, 
    SalirClanView
)

urlpatterns = [
    # ==========================================
    # 💬 RUTAS ORIGINALES (Chats, Historial, Búsqueda y Notificaciones)
    # ==========================================
    path('chats/', ListaChatsView.as_view(), name='lista_chats'),
    path('chats/<int:chat_id>/mensajes/', HistorialMensajesView.as_view(), name='historial_mensajes'),
    path('notificaciones/', ListaNotificacionesView.as_view(), name='lista_notificaciones'),
    path('notificaciones/<int:solicitud_id>/responder/', ResponderSolicitudView.as_view(), name='responder_solicitud'),
    path('buscar/', BuscarUsuariosView.as_view(), name='buscar_usuarios'),

    # ==========================================
    # 🛡️ RUTAS DE CLANES
    # ==========================================
    path('clanes/ranking/', RankingClanesView.as_view(), name='ranking_clanes'),
    path('clanes/crear/', CrearClanView.as_view(), name='crear_clan'),
    path('clanes/mi-clan/', MiClanView.as_view(), name='mi_clan'),
    path('clanes/salir/', SalirClanView.as_view(), name='salir_clan'),
    path('clanes/<int:clan_id>/', DetalleClanView.as_view(), name='detalle_clan'),
    path('clanes/<int:clan_id>/unirse/', UnirseClanView.as_view(), name='unirse_clan'),
]