import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.utils import timezone
from .models import GrupoChat, MensajeChat, SolicitudAmistad
from juego.models import PerfilUsuario 

class SocialConsumer(AsyncWebsocketConsumer):
    
    async def connect(self):
        user = self.scope.get("user")
        if not user or not user.is_authenticated:
            await self.close()
            return

        self.user = user
        self.perfil = await self.obtener_perfil(user)
        
        self.personal_group = f"social_{self.user.username}"
        await self.channel_layer.group_add(self.personal_group, self.channel_name)

        chats_activos = await self.obtener_chats_activos(self.perfil)
        for chat_id in chats_activos:
            await self.channel_layer.group_add(f"chat_{chat_id}", self.channel_name)

        await self.accept()
        print(f"🟢 [SOCIAL] {self.user.username} se ha conectado.")

        await self.notificar_presencia(True)

    async def disconnect(self, close_code):
        if hasattr(self, 'personal_group'):
            await self.notificar_presencia(False)
            await self.channel_layer.group_discard(self.personal_group, self.channel_name)
        
        if hasattr(self, 'perfil'):
            chats_activos = await self.obtener_chats_activos(self.perfil)
            for chat_id in chats_activos:
                await self.channel_layer.group_discard(f"chat_{chat_id}", self.channel_name)

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
            action = data.get('action')

            if action == 'enviar_mensaje':
                await self._handle_enviar_mensaje(data)
            elif action == 'enviar_solicitud':
                await self._handle_enviar_solicitud(data)
            elif action == 'check_online':
                await self.notificar_presencia(True)
            # 🚀 SOLUCIÓN BIDIRECCIONAL: Recibimos la respuesta de cortesía y se la pasamos directo al amigo
            elif action == 'estoy_online_tambien':
                target = data.get('target_username')
                if target:
                    await self.channel_layer.group_send(
                        f"social_{target}",
                        {
                            'type': 'broadcast_estado',
                            'username': self.user.username,
                            'online': True,
                            'is_reply': True # 👈 Marca clave para evitar bucles infinitos
                        }
                    )
        except json.JSONDecodeError:
            pass

    # =======================================================
    # 🎛️ MANEJADORES DE ACCIONES
    # =======================================================

    async def _handle_enviar_mensaje(self, data):
        chat_id = data.get('chat_id')
        texto = data.get('texto')

        if not chat_id or not texto: return

        mensaje = await self.guardar_mensaje_bd(chat_id, self.perfil, texto)
        if not mensaje: return

        # 🚀 SOLUCIÓN 1: Convertimos la hora UTC de la base de datos a tu zona horaria local
        hora_local = timezone.localtime(mensaje.timestamp).strftime('%H:%M')

        await self.channel_layer.group_send(
            f"chat_{chat_id}",
            {
                'type': 'broadcast_mensaje',
                'chat_id': chat_id,
                'mensaje_id': mensaje.id,
                'autor': self.user.username,
                'texto': texto,
                'hora': hora_local # 👈 Usamos la hora corregida
            }
        )

    async def _handle_enviar_solicitud(self, data):
        target_username = data.get('target_username')
        if not target_username: return

        success, mensaje_aviso = await self.crear_solicitud_bd(self.perfil, target_username)
        if success:
            await self.channel_layer.group_send(
                f"social_{target_username}",
                {
                    'type': 'broadcast_notificacion',
                    'tipo': 'nueva_solicitud',
                    'de': self.user.username,
                    'mensaje': 'Te ha enviado una solicitud.'
                }
            )

    # =======================================================
    # 📡 RADAR DE PRESENCIA
    # =======================================================

    @database_sync_to_async
    def obtener_amigos(self):
        amigos = PerfilUsuario.objects.filter(
            chats_participados__in=self.user.perfil.chats_participados.all()
        ).exclude(usuario=self.user).values_list('usuario__username', flat=True)
        return list(set(amigos))

    async def notificar_presencia(self, is_online):
        amigos = await self.obtener_amigos()
        for amigo in amigos:
            await self.channel_layer.group_send(
                f"social_{amigo}",
                {
                    'type': 'broadcast_estado',
                    'username': self.user.username,
                    'online': is_online,
                    'is_reply': False # Saludo original, requiere respuesta
                }
            )

    # =======================================================
    # 📡 BROADCASTS A REACT
    # =======================================================

    async def broadcast_mensaje(self, event):
        await self.send(text_data=json.dumps({
            'status': 'nuevo_mensaje', 'chat_id': event['chat_id'], 'mensaje_id': event['mensaje_id'],
            'autor': event['autor'], 'texto': event['texto'], 'hora': event['hora']
        }))

    async def broadcast_notificacion(self, event):
        await self.send(text_data=json.dumps({
            'status': 'nueva_notificacion', 'tipo': event['tipo'],
            'de': event['de'], 'mensaje': event['mensaje']
        }))

    async def broadcast_estado(self, event):
        await self.send(text_data=json.dumps({
            'status': 'estado_conexion', 
            'username': event['username'], 
            'online': event['online'],
            'is_reply': event.get('is_reply', False)
        }))

    # =======================================================
    # 🛠️ HELPERS DB
    # =======================================================

    @database_sync_to_async
    def obtener_perfil(self, user):
        return PerfilUsuario.objects.get(usuario=user)

    @database_sync_to_async
    def obtener_chats_activos(self, perfil):
        return list(perfil.chats_participados.values_list('id', flat=True))

    @database_sync_to_async
    def guardar_mensaje_bd(self, chat_id, autor_perfil, texto):
        try:
            grupo = GrupoChat.objects.get(id=chat_id, miembros=autor_perfil)
            try:
                mensaje = MensajeChat.objects.create(grupo=grupo, autor=autor_perfil, texto=texto)
            except Exception:
                mensaje = MensajeChat.objects.create(chat=grupo, autor=autor_perfil, texto=texto)
            return mensaje
        except Exception:
            return None

    @database_sync_to_async
    def crear_solicitud_bd(self, emisor_perfil, target_username):
        try:
            receptor_perfil = PerfilUsuario.objects.get(usuario__username=target_username)
            if emisor_perfil == receptor_perfil: return False, "Mismo usuario"
            solicitud, created = SolicitudAmistad.objects.get_or_create(emisor=emisor_perfil, receptor=receptor_perfil)
            return (True, "Enviada") if created else (False, "Ya existía")
        except PerfilUsuario.DoesNotExist:
            return False, "No encontrado"