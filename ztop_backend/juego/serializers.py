from rest_framework import serializers
from django.contrib.auth.models import User
from django.db import transaction
from .models import PerfilUsuario, Sala, Ronda, RespuestaJugador

class PerfilUsuarioSerializer(serializers.ModelSerializer):
    # 🚀 SOLUCIÓN: Le enseñamos a Django a buscar el correo en el modelo User original
    email = serializers.EmailField(source='usuario.email', read_only=True)

    class Meta:
        model = PerfilUsuario
        fields = [
            'id', 'username', 'nombre_completo', 'email',
            'edad', 'fecha_nacimiento', 'avatar_url',
            'partidas_jugadas', 'partidas_ganadas', 'puntaje_total'
        ]
        read_only_fields = ['partidas_jugadas', 'partidas_ganadas', 'puntaje_total']

class RegistroUsuarioSerializer(serializers.ModelSerializer):
    perfil = PerfilUsuarioSerializer()
    
    class Meta:
        model = User
        fields = ['username', 'password', 'perfil']
        extra_kwargs = {'password': {'write_only': True}}
    
    def create(self, validated_data):
        perfil_data = validated_data.pop('perfil')
        with transaction.atomic():
            user = User.objects.create_user(
                username=validated_data['username'],
                email=perfil_data.get('email', ''),
                password=validated_data['password']
            )
            # Borramos el email y username del diccionario del perfil porque 
            # ya se guardaron en el modelo User principal
            perfil_data.pop('username', None)
            perfil_data.pop('email', None)
            PerfilUsuario.objects.create(usuario=user, username=user.username, **perfil_data)
        return user

class RespuestaJugadorSerializer(serializers.ModelSerializer):
    jugador_username = serializers.ReadOnlyField(source='jugador.username')
    
    class Meta:
        model = RespuestaJugador
        fields = [
            'id', 'ronda', 'jugador_username',
            'nombre', 'apellido', 'ciudad_pais', 'animal', 'cosa',
            'puntos_nombre', 'puntos_apellido', 'puntos_ciudad_pais', 
            'puntos_animal', 'puntos_cosa', 'total_puntos_ronda'
        ]
        read_only_fields = [
            'puntos_nombre', 'puntos_apellido', 'puntos_ciudad_pais', 
            'puntos_animal', 'puntos_cosa', 'total_puntos_ronda'
        ]

class RondaSerializer(serializers.ModelSerializer):
    respuestas = RespuestaJugadorSerializer(many=True, read_only=True)
    
    class Meta:
        model = Ronda
        fields = ['id', 'numero_ronda', 'letra', 'activa', 'respuestas']

class SalaSerializer(serializers.ModelSerializer):
    creador_username = serializers.ReadOnlyField(source='creador.username')
    jugadores = PerfilUsuarioSerializer(many=True, read_only=True)
    rondas = RondaSerializer(many=True, read_only=True)
    
    class Meta:
        model = Sala
        fields = ['codigo', 'creador_username', 'estado', 'fecha_creacion', 'jugadores', 'rondas']
        read_only_fields = ['codigo', 'fecha_creacion']