from django.db import models
from django.contrib.auth.models import User

class PerfilUsuario(models.Model):
    # Relación uno a uno con el usuario nativo de Django
    usuario = models.OneToOneField(User, on_delete=models.CASCADE, related_name='perfil')
    
    # Campos solicitados por el usuario
    nombre_completo = models.CharField(max_length=150)
    edad = models.PositiveIntegerField()
    fecha_nacimiento = models.DateField()
    email = models.EmailField(unique=True)
    
    # Campos técnicos y estadísticas del juego
    username = models.CharField(max_length=50, unique=True)
    avatar_url = models.CharField(max_length=255, blank=True, default="")
    partidas_jugadas = models.PositiveIntegerField(default=0)
    partidas_ganadas = models.PositiveIntegerField(default=0)

    def __str__(self):
        return f"Perfil de {self.username} ({self.nombre_completo})"


class Sala(models.Model):
    ESTADOS = [
        ('esperando', 'Esperando Jugadores'),
        ('en_ronda', 'En Ronda Activa'),
        ('evaluacion', 'En Votación'),
        ('terminada', 'Partida Terminada'),
    ]
    
    codigo = models.CharField(max_length=6, primary_key=True, unique=True)
    # Ahora apuntamos al PerfilUsuario en lugar del User nativo
    creador = models.ForeignKey(PerfilUsuario, on_delete=models.CASCADE, related_name='salas_creadas')
    estado = models.CharField(max_length=15, choices=ESTADOS, default='esperando')
    fecha_creacion = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Sala {self.codigo} - {self.estado}"


class Ronda(models.Model):
    sala = models.ForeignKey(Sala, on_delete=models.CASCADE, related_name='rondas')
    numero_ronda = models.IntegerField()
    letra = models.CharField(max_length=1)
    activa = models.BooleanField(default=True)

    def __str__(self):
        return f"Sala {self.sala.codigo} - Ronda {self.numero_ronda} (Letra: {self.letra})"


class RespuestaJugador(models.Model):
    ronda = models.ForeignKey(Ronda, on_delete=models.CASCADE, related_name='respuestas')
    # Vinculamos las respuestas directamente al PerfilUsuario del jugador móvil
    jugador = models.ForeignKey(PerfilUsuario, on_delete=models.CASCADE, related_name='respuestas_juego')
    
    # Inputs de texto del juego clásico
    nombre = models.CharField(max_length=100, blank=True, default="")
    apellido = models.CharField(max_length=100, blank=True, default="")
    ciudad_pais = models.CharField(max_length=100, blank=True, default="")
    animal = models.CharField(max_length=100, blank=True, default="")
    cosa = models.CharField(max_length=100, blank=True, default="")
    
    # Almacenamiento de puntos tras la votación
    puntos_nombre = models.IntegerField(default=0)
    puntos_apellido = models.IntegerField(default=0)
    puntos_ciudad_pais = models.IntegerField(default=0)
    puntos_animal = models.IntegerField(default=0)
    puntos_cosa = models.IntegerField(default=0)
    
    total_puntos_ronda = models.IntegerField(default=0)

    class Meta:
        unique_together = ('ronda', 'jugador')

    def __str__(self):
        return f"Respuestas de {self.jugador.username} - Ronda {self.ronda.id}"