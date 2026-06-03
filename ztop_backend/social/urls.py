from django.urls import path
from . import views

urlpatterns = [
    path('buscar/', views.BuscarUsuariosView.as_view(), name='api_buscar_usuarios'),
    path('notificaciones/', views.MisNotificacionesView.as_view(), name='api_mis_notificaciones'),
    path('chats/', views.MisChatsView.as_view(), name='api_mis_chats'),
    path('solicitud/<int:solicitud_id>/responder/', views.ResponderSolicitudView.as_view(), name='api_responder_solicitud'),
]