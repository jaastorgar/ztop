from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.db import transaction
from django.db.models import Q

from .models import Clan, GrupoChat, MensajeChat, SolicitudAmistad
from juego.models import PerfilUsuario
from .serializers import (
    ClanSerializer, 
    PerfilUsuarioSerializer, 
    GrupoChatSerializer, 
    SolicitudAmistadSerializer,
    MensajeChatSerializer # 👈 Importamos el serializador de mensajes
)

# ==========================================
# 💬 SISTEMA ORIGINAL (Chats, Historial, Notificaciones y Búsqueda)
# ==========================================

class ListaChatsView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        perfil = request.user.perfil
        # Trae todos los chats donde participa el usuario (1vs1 y Clanes)
        chats = perfil.chats_participados.all().order_by('-fecha_creacion')
        serializer = GrupoChatSerializer(chats, many=True, context={'request': request})
        return Response(serializer.data)

# 🚀 SOLUCIÓN: Vista para cargar el historial de mensajes de un chat específico
class HistorialMensajesView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request, chat_id):
        try:
            # Verificamos que el chat exista y que el usuario pertenezca a él por seguridad
            chat = request.user.perfil.chats_participados.get(id=chat_id)
            mensajes = chat.mensajes.all().order_by('timestamp')
            serializer = MensajeChatSerializer(mensajes, many=True)
            return Response(serializer.data)
        except GrupoChat.DoesNotExist:
            return Response({"error": "Chat no encontrado o no tienes permiso para verlo."}, status=status.HTTP_404_NOT_FOUND)

class ListaNotificacionesView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        perfil = request.user.perfil
        # Trae solo las solicitudes de amistad pendientes
        solicitudes = SolicitudAmistad.objects.filter(receptor=perfil, estado='pendiente').order_by('-fecha_envio')
        serializer = SolicitudAmistadSerializer(solicitudes, many=True)
        return Response(serializer.data)

class BuscarUsuariosView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        query = request.GET.get('q', '').strip()
        if not query:
            return Response([])
        
        # Busca usuarios por nombre, excluyendo al propio usuario que busca
        resultados = PerfilUsuario.objects.filter(
            usuario__username__icontains=query
        ).exclude(usuario=request.user)[:15]
        
        serializer = PerfilUsuarioSerializer(resultados, many=True)
        return Response(serializer.data)

class ResponderSolicitudView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request, solicitud_id):
        try:
            solicitud = SolicitudAmistad.objects.get(id=solicitud_id, receptor=request.user.perfil)
            accion = request.data.get('accion') 
            
            if accion == 'aceptar':
                solicitud.estado = 'aceptada'
                solicitud.save()
                
                # Al aceptar, se crea el chat privado (1vs1)
                chat = GrupoChat.objects.create(es_grupo=False)
                chat.miembros.add(solicitud.emisor, solicitud.receptor)
                
                return Response({"mensaje": "Solicitud aceptada. Chat privado creado."})
                
            elif accion == 'rechazar':
                solicitud.estado = 'rechazada'
                solicitud.save()
                return Response({"mensaje": "Solicitud rechazada."})
                
            else:
                return Response({"error": "Acción no válida."}, status=status.HTTP_400_BAD_REQUEST)
                
        except SolicitudAmistad.DoesNotExist:
            return Response({"error": "Solicitud no encontrada."}, status=status.HTTP_404_NOT_FOUND)


# ==========================================
# 🛡️ SISTEMA DE CLANES
# ==========================================

class RankingClanesView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        clanes = Clan.objects.all()
        clanes_ordenados = sorted(clanes, key=lambda x: x.puntaje_total, reverse=True)
        serializer = ClanSerializer(clanes_ordenados, many=True)
        return Response(serializer.data)

class CrearClanView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):
        perfil = request.user.perfil
        nombre = request.data.get('nombre', '').strip()
        tag = request.data.get('tag', '').strip().upper()

        if not nombre or not tag:
            return Response({"error": "El nombre y el TAG son obligatorios."}, status=status.HTTP_400_BAD_REQUEST)
        if len(tag) > 5:
            return Response({"error": "El TAG no puede tener más de 5 caracteres."}, status=status.HTTP_400_BAD_REQUEST)
        if perfil.clanes_unidos.exists():
            return Response({"error": "Ya perteneces a un clan."}, status=status.HTTP_400_BAD_REQUEST)
        if Clan.objects.filter(nombre__iexact=nombre).exists():
            return Response({"error": "Ese nombre de clan ya está registrado."}, status=status.HTTP_400_BAD_REQUEST)
        if Clan.objects.filter(tag__iexact=tag).exists():
            return Response({"error": "Ese TAG de clan ya está en uso."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            with transaction.atomic():
                chat_sala = GrupoChat.objects.create(nombre=f"Sala de Guerra {nombre}", es_grupo=True)
                chat_sala.miembros.add(perfil)

                clan = Clan.objects.create(nombre=nombre, tag=tag, lider=perfil, chat_sala=chat_sala)
                clan.miembros.add(perfil)

            serializer = ClanSerializer(clan)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({"error": "Ocurrió un error al fundar el clan."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class MiClanView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        perfil = request.user.perfil
        clan = perfil.clanes_unidos.first()

        if not clan:
            return Response({"en_clan": False, "clan": None})

        return Response({
            "en_clan": True,
            "clan": ClanSerializer(clan).data,
            "miembros": PerfilUsuarioSerializer(clan.miembros.all(), many=True).data,
            "chat_id": clan.chat_sala.id if clan.chat_sala else None
        })

class DetalleClanView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request, clan_id):
        try:
            clan = Clan.objects.get(id=clan_id)
            return Response({
                "clan": ClanSerializer(clan).data,
                "miembros": PerfilUsuarioSerializer(clan.miembros.all(), many=True).data
            })
        except Clan.DoesNotExist:
            return Response({"error": "El clan especificado no existe."}, status=status.HTTP_404_NOT_FOUND)

class UnirseClanView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request, clan_id):
        perfil = request.user.perfil
        if perfil.clanes_unidos.exists():
            return Response({"error": "Ya perteneces a un clan actualmente."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            clan = Clan.objects.get(id=clan_id)
            if clan.miembros.count() >= clan.limite_miembros:
                return Response({"error": "El clan ha alcanzado su capacidad máxima."}, status=status.HTTP_400_BAD_REQUEST)

            with transaction.atomic():
                clan.miembros.add(perfil)
                if clan.chat_sala:
                    clan.chat_sala.miembros.add(perfil)

            return Response({"status": "ok", "mensaje": f"¡Te has unido exitosamente al clan [{clan.tag}] {clan.nombre}!"})
        except Clan.DoesNotExist:
            return Response({"error": "El clan no existe."}, status=status.HTTP_404_NOT_FOUND)

class SalirClanView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):
        perfil = request.user.perfil
        clan = perfil.clanes_unidos.first()

        if not clan:
            return Response({"error": "No perteneces a ningún clan."}, status=status.HTTP_400_BAD_REQUEST)
        if clan.lider == perfil:
            return Response({"error": "El líder no puede abandonar el clan."}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            clan.miembros.remove(perfil)
            if clan.chat_sala:
                clan.chat_sala.miembros.remove(perfil)

        return Response({"status": "ok", "mensaje": "Has abandonado el clan correctamente."})