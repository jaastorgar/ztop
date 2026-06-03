import json
import asyncio
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.utils import timezone
from .models import GrupoChat, MensajeChat, SolicitudAmistad
from juego.models import PerfilUsuario 

class SocialConsumer(AsyncWebsocketConsumer):
    
    async def connect(self):
        user = self.scope.get("user")
        
        # Rechazamos conexiones de usuarios no autenticados
        if not user or not user.is_authenticated:
            await self.close()
            return

        self.user = user
        self.perfil = await self.obtener_perfil(user)
        
        # 1. 🔔 CANAL PERSONAL: Grupo exclusivo para enviarle notificaciones a ESTE usuario
        self.personal_group = f"social_{self.user.username}"
        await self.channel_layer.group_add(self.personal_group, self.channel_name)

        # 2. 💬 CANALES DE CHAT: Conectamos al usuario a todos los grupos de chat a los que pertenece
        chats_activos = await self.obtener_chats_activos(self.perfil)
        for chat_id in chats_activos:
            await self.channel_layer.group_add(f"chat_{chat_id}", self.channel_name)

        await self.accept()
        print(f"🟢 [SOCIAL] {self.user.username} se ha conectado al ecosistema social.")

    async def disconnect(self, close_code):
        if hasattr(self, 'personal_group'):
            await self.channel_layer.group_discard(self.personal_group, self.channel_name)
        
        if hasattr(self, 'perfil'):
            chats_activos = await self.obtener_chats_activos(self.perfil)
            for chat_id in chats_activos:
                await self.channel_layer.group_discard(f"chat_{chat_id}", self.channel_name)

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
            action = data.get('action')

            # 📨 Ruteador de acciones del frontend
            if action == 'enviar_mensaje':
                await self._handle_enviar_mensaje(data)
            elif action == 'enviar_solicitud':
                await self._handle_enviar_solicitud(data)
                
        except json.JSONDecodeError:
            pass

    # =======================================================
    # 🎛️ MANEJADORES DE ACCIONES (Lógica de Chat y Amigos)
    # =======================================================

    async def _handle_enviar_mensaje(self, data):
        chat_id = data.get('chat_id')
        texto = data.get('texto')

        if not chat_id or not texto: 
            return

        # 1. Guardar mensaje físicamente en PostgreSQL
        mensaje = await self.guardar_mensaje_bd(chat_id, self.perfil, texto)
        if not mensaje: 
            return

        # 2. Disparar el mensaje en tiempo real a todos los miembros de ese chat
        await self.channel_layer.group_send(
            f"chat_{chat_id}",
            {
                'type': 'broadcast_mensaje',
                'chat_id': chat_id,
                'mensaje_id': mensaje.id,
                'autor': self.user.username,
                'texto': texto,
                'hora': mensaje.timestamp.strftime('%H:%M')
            }
        )

    async def _handle_enviar_solicitud(self, data):
        # Esta función manejará cuando alguien busque un username y presione "Agregar"
        target_username = data.get('target_username')
        if not target_username:
            return

        success, mensaje_aviso = await self.crear_solicitud_bd(self.perfil, target_username)
        
        if success:
            # Notificamos en tiempo real al teléfono del usuario receptor para que su campana se ponga en ROJO
            await self.channel_layer.group_send(
                f"social_{target_username}",
                {
                    'type': 'broadcast_notificacion',
                    'tipo': 'nueva_solicitud',
                    'de': self.user.username,
                    'mensaje': 'Te ha enviado una solicitud de amistad.'
                }
            )

    # =======================================================
    # 📡 BROADCASTS (Lo que se envía al Frontend React)
    # =======================================================

    async def broadcast_mensaje(self, event):
        await self.send(text_data=json.dumps({
            'status': 'nuevo_mensaje',
            'chat_id': event['chat_id'],
            'mensaje_id': event['mensaje_id'],
            'autor': event['autor'],
            'texto': event['texto'],
            'hora': event['hora']
        }))

    async def broadcast_notificacion(self, event):
        await self.send(text_data=json.dumps({
            'status': 'nueva_notificacion',
            'tipo': event['tipo'],
            'de': event['de'],
            'mensaje': event['mensaje']
        }))

    # =======================================================
    # 🛠️ HELPERS DE BASE DE DATOS (Asíncronos)
    # =======================================================

    @database_sync_to_async
    def obtener_perfil(self, user):
        return PerfilUsuario.objects.get(usuario=user)

    @database_sync_to_async
    def obtener_chats_activos(self, perfil):
        # Retorna una lista con los IDs de todos los chats a los que pertenece el usuario
        return list(perfil.chats_participados.values_list('id', flat=True))

    @database_sync_to_async
    def guardar_mensaje_bd(self, chat_id, autor_perfil, texto):
        try:
            grupo = GrupoChat.objects.get(id=chat_id, miembros=autor_perfil)
            mensaje = MensajeChat.objects.create(grupo=grupo, autor=autor_perfil, texto=texto)
            return mensaje
        except GrupoChat.DoesNotExist:
            return None

    @database_sync_to_async
    def crear_solicitud_bd(self, emisor_perfil, target_username):
        try:
            receptor_perfil = PerfilUsuario.objects.get(usuario__username=target_username)
            if emisor_perfil == receptor_perfil:
                return False, "No puedes agregarte a ti mismo."
                
            solicitud, created = SolicitudAmistad.objects.get_or_create(emisor=emisor_perfil, receptor=receptor_perfil)
            if created:
                return True, "Solicitud enviada."
            return False, "La solicitud ya existía."
        except PerfilUsuario.DoesNotExist:
            return False, "Usuario no encontrado."