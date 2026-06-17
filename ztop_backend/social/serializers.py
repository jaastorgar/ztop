from rest_framework import serializers
from django.utils import timezone
from juego.models import PerfilUsuario
from .models import GrupoChat, MensajeChat, SolicitudAmistad, Clan

class PerfilUsuarioSerializer(serializers.ModelSerializer):
    # Agregamos el Tag del Clan para que el frontend lo muestre (ej: [ZTOP] javito)
    clan_tag = serializers.SerializerMethodField()

    class Meta:
        model = PerfilUsuario
        fields = ['id', 'username', 'avatar_url', 'clan_tag']

    def get_clan_tag(self, obj):
        clan = obj.clanes_unidos.first()
        return f"[{clan.tag}]" if clan else ""

class SolicitudAmistadSerializer(serializers.ModelSerializer):
    emisor_detalle = PerfilUsuarioSerializer(source='emisor', read_only=True)
    
    class Meta:
        model = SolicitudAmistad
        fields = ['id', 'emisor_detalle', 'estado', 'fecha_envio']

# ==========================================
# 💬 SERIALIZADOR DE HISTORIAL DE MENSAJES (NUEVO)
# ==========================================
class MensajeChatSerializer(serializers.ModelSerializer):
    autor = serializers.ReadOnlyField(source='autor.usuario.username')
    clan_tag = serializers.SerializerMethodField()
    hora = serializers.SerializerMethodField()

    class Meta:
        model = MensajeChat
        fields = ['id', 'autor', 'clan_tag', 'texto', 'hora']

    def get_clan_tag(self, obj):
        clan = obj.autor.clanes_unidos.first()
        return f"[{clan.tag}]" if clan else ""

    def get_hora(self, obj):
        return timezone.localtime(obj.timestamp).strftime('%H:%M')

# ==========================================
# 📂 SERIALIZADOR DE GRUPOS/CHATS
# ==========================================
class GrupoChatSerializer(serializers.ModelSerializer):
    ultimo_mensaje = serializers.SerializerMethodField()
    nombre_display = serializers.SerializerMethodField()
    is_clan_chat = serializers.SerializerMethodField()
    
    class Meta:
        model = GrupoChat
        fields = ['id', 'nombre_display', 'es_grupo', 'ultimo_mensaje', 'is_clan_chat']

    def get_nombre_display(self, obj):
        # 1. Si este chat está amarrado a un clan, mostramos el escudo
        if hasattr(obj, 'clan_asociado') and obj.clan_asociado:
            return f"🛡️ Clan {obj.clan_asociado.nombre}"
            
        # 2. Si es un grupo normal
        if obj.es_grupo:
            return obj.nombre
            
        # 3. CHAT PRIVADO 1vs1 ORIGINAL: Excluye al usuario actual y muestra al amigo
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            otro_miembro = obj.miembros.exclude(usuario=request.user).first()
            return otro_miembro.username if otro_miembro else "Usuario Desconocido"
        return "Chat Privado"

    def get_is_clan_chat(self, obj):
        return hasattr(obj, 'clan_asociado') and obj.clan_asociado is not None

    def get_ultimo_mensaje(self, obj):
        msg = obj.mensajes.last()
        if msg:
            return {
                "texto": msg.texto, 
                "autor": msg.autor.username, 
                "hora": timezone.localtime(msg.timestamp).strftime('%H:%M')
            }
        return None

# ==========================================
# 🛡️ SERIALIZADOR DE CLANES
# ==========================================
class ClanSerializer(serializers.ModelSerializer):
    lider_username = serializers.ReadOnlyField(source='lider.usuario.username')
    miembros_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Clan
        fields = ['id', 'nombre', 'tag', 'lider_username', 'miembros_count', 'limite_miembros', 'puntaje_total', 'fecha_creacion']

    def get_miembros_count(self, obj):
        return obj.miembros.count()