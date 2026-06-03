from rest_framework import serializers
from juego.models import PerfilUsuario  # Importamos el perfil desde la app principal
from .models import GrupoChat, MensajeChat, SolicitudAmistad

class PerfilUsuarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = PerfilUsuario
        fields = ['id', 'username', 'avatar_url']

class SolicitudAmistadSerializer(serializers.ModelSerializer):
    # Anidamos el perfil del emisor para mostrar su nombre y avatar en la campanita
    emisor_detalle = PerfilUsuarioSerializer(source='emisor', read_only=True)
    
    class Meta:
        model = SolicitudAmistad
        fields = ['id', 'emisor_detalle', 'estado', 'fecha_envio']

class GrupoChatSerializer(serializers.ModelSerializer):
    ultimo_mensaje = serializers.SerializerMethodField()
    nombre_display = serializers.SerializerMethodField()
    
    class Meta:
        model = GrupoChat
        fields = ['id', 'nombre_display', 'es_grupo', 'ultimo_mensaje']

    # 🚀 Truco: Si es un chat 1vs1, el nombre del chat será el nombre de TU amigo
    def get_nombre_display(self, obj):
        if obj.es_grupo:
            return obj.nombre
            
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            otro_miembro = obj.miembros.exclude(usuario=request.user).first()
            return otro_miembro.username if otro_miembro else "Usuario Desconocido"
        return "Chat Privado"

    def get_ultimo_mensaje(self, obj):
        msg = obj.mensajes.last()
        if msg:
            return {
                "texto": msg.texto, 
                "autor": msg.autor.username, 
                "hora": msg.timestamp.strftime('%H:%M')
            }
        return None