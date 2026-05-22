from rest_framework import serializers
from django.contrib.auth.models import User
from .models import PerfilUsuario, Sala, Ronda, RespuestaJugador

# 1. Serializador para el Perfil de Usuario
class PerfilUsuarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = PerfilUsuario
        fields = [
            'id', 'username', 'nombre_completo', 'email', 
            'edad', 'fecha_nacimiento', 'avatar_url', 
            'partidas_jugadas', 'partidas_ganadas'
        ]
        read_only_fields = ['partidas_jugadas', 'partidas_ganadas']


# 2. Serializador para el Registro de Usuarios (User + Perfil)
class RegistroUsuarioSerializer(serializers.ModelSerializer):
    perfil = PerfilUsuarioSerializer()

    class Meta:
        model = User
        fields = ['username', 'password', 'perfil']
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        perfil_data = validated_data.pop('perfil')
        # Crear el usuario nativo de Django con contraseña encriptada
        user = User.objects.create_user(
            username=validated_data['username'],
            password=validated_data['password']
        )
        # Crear el perfil vinculado al usuario
        PerfilUsuario.objects.create(usuario=user, **perfil_data)
        return user


# 3. Serializador para el Envío y Muestra de Respuestas por Ronda
class RespuestaJugadorSerializer(serializers.ModelSerializer):
    # Mostramos el username del perfil del jugador en lugar del ID numérico
    jugador_username = serializers.ReadOnlyField(source='jugador.username')

    class Meta:
        model = RespuestaJugador
        fields = [
            'id', 'ronda', 'jugador_username',
            'nombre', 'apellido', 'ciudad_pais', 'animal', 'cosa',
            'puntos_nombre', 'puntos_apellido', 'puntos_ciudad_pais', 
            'puntos_animal', 'puntos_cosa', 'total_puntos_ronda'
        ]
        # Al crear la respuesta desde la app móvil, los puntos no se envían manualmente
        read_only_fields = [
            'puntos_nombre', 'puntos_apellido', 'puntos_ciudad_pais', 
            'puntos_animal', 'puntos_cosa', 'total_puntos_ronda'
        ]


# 4. Serializador para las Rondas de Juego
class RondaSerializer(serializers.ModelSerializer):
    respuestas = RespuestaJugadorSerializer(many=True, read_only=True)

    class Meta:
        model = Ronda
        fields = ['id', 'numero_ronda', 'letra', 'activa', 'respuestas']


# 5. Serializador para la Gestión de las Salas (Lobby mobile)
class SalaSerializer(serializers.ModelSerializer):
    creador_username = serializers.ReadOnlyField(source='creador.username')
    rondas = RondaSerializer(many=True, read_only=True)

    class Meta:
        model = Sala
        fields = ['codigo', 'creador_username', 'estado', 'fecha_creacion', 'rondas']
        read_only_fields = ['codigo', 'fecha_creacion']