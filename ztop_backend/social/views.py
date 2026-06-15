from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q
from django.utils import timezone  # 🚀 IMPORTANTE: Para la corrección de la hora
from juego.models import PerfilUsuario
from .models import SolicitudAmistad, GrupoChat, MensajeChat # 🚀 Agregamos MensajeChat
from .serializers import PerfilUsuarioSerializer, SolicitudAmistadSerializer, GrupoChatSerializer

class BuscarUsuariosView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        query = request.GET.get('q', '').strip()
        if not query:
            return Response([])
            
        # Busca usuarios por username, excluyendo al propio usuario que busca
        usuarios = PerfilUsuario.objects.filter(
            username__icontains=query
        ).exclude(usuario=request.user)[:20] # Limitamos a 20 resultados por seguridad
        
        serializer = PerfilUsuarioSerializer(usuarios, many=True)
        return Response(serializer.data)

class MisNotificacionesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        perfil = request.user.perfil
        # Solo obtenemos las solicitudes que nos llegaron y están pendientes
        solicitudes = SolicitudAmistad.objects.filter(receptor=perfil, estado='pendiente')
        serializer = SolicitudAmistadSerializer(solicitudes, many=True)
        return Response(serializer.data)

class MisChatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        perfil = request.user.perfil
        # Traemos todos los chats donde el usuario es miembro
        chats = perfil.chats_participados.all()
        # Pasamos el 'request' al contexto para que el serializador sepa quién está pidiendo la info
        serializer = GrupoChatSerializer(chats, many=True, context={'request': request})
        return Response(serializer.data)

class ResponderSolicitudView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, solicitud_id):
        accion = request.data.get('accion') # Esperamos 'aceptar' o 'rechazar'
        
        try:
            solicitud = SolicitudAmistad.objects.get(
                id=solicitud_id, 
                receptor=request.user.perfil, 
                estado='pendiente'
            )
            
            if accion == 'aceptar':
                solicitud.estado = 'aceptada'
                solicitud.save()
                
                # 🚀 MAGIA: Al aceptar, creamos un chat 1vs1 automáticamente
                chat_1v1 = GrupoChat.objects.create(es_grupo=False)
                chat_1v1.miembros.add(solicitud.emisor, solicitud.receptor)
                
                return Response({"status": "ok", "mensaje": "Amigo agregado y chat creado."})
                
            elif accion == 'rechazar':
                solicitud.estado = 'rechazada'
                solicitud.save()
                return Response({"status": "ok", "mensaje": "Solicitud rechazada."})
                
            return Response({"error": "Acción inválida."}, status=400)
            
        except SolicitudAmistad.DoesNotExist:
            return Response({"error": "Solicitud no encontrada o ya procesada."}, status=404)

# =========================================================================
# 🚀 NUEVO: Vista para cargar el historial de mensajes sin errores 404
# =========================================================================
class HistorialMensajesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, chat_id):
        try:
            # 1. Validamos que el chat existe y que el usuario realmente pertenece a él (Seguridad)
            chat = GrupoChat.objects.get(id=chat_id, miembros=request.user.perfil)
            
            # 2. Buscamos los mensajes de este chat ordenados por fecha
            # Usamos un try/except por si la llave foránea se llama 'grupo' o 'chat' en tu modelo
            try:
                mensajes_bd = MensajeChat.objects.filter(grupo=chat).order_by('timestamp')
            except Exception:
                mensajes_bd = MensajeChat.objects.filter(chat=chat).order_by('timestamp')

            # 3. Empaquetamos los datos y convertimos la hora UTC a tu hora local de Santiago
            data = []
            for msg in mensajes_bd:
                data.append({
                    'id': msg.id,
                    'autor': msg.autor.usuario.username,
                    'texto': msg.texto,
                    'hora': timezone.localtime(msg.timestamp).strftime('%H:%M')
                })
            
            return Response(data)

        except GrupoChat.DoesNotExist:
            return Response({"error": "Chat no encontrado o no tienes acceso."}, status=404)