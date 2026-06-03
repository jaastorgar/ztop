from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q
from juego.models import PerfilUsuario
from .models import SolicitudAmistad, GrupoChat
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