from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone

class PerfilUsuario(models.Model):
    usuario = models.OneToOneField(User, on_delete=models.CASCADE, related_name='perfil')
    nombre_completo = models.CharField(max_length=150, blank=True)
    edad = models.PositiveIntegerField(blank=True, null=True)
    fecha_nacimiento = models.DateField(blank=True, null=True)
    email = models.EmailField(blank=True)
    username = models.CharField(max_length=50, unique=True, blank=True)
    avatar_url = models.URLField(max_length=255, blank=True, default="")
    
    # 📊 Estadísticas y Puntaje
    partidas_jugadas = models.PositiveIntegerField(default=0)
    partidas_ganadas = models.PositiveIntegerField(default=0)
    puntaje_total = models.PositiveIntegerField(default=0)

    def __str__(self):
        return f"Perfil de {self.usuario.username} ({self.nombre_completo or 'Sin nombre'})"


class SalaJugador(models.Model):
    """Modelo intermedio para rastrear qué jugadores están en qué sala."""
    sala = models.ForeignKey('Sala', on_delete=models.CASCADE, related_name='miembros')
    jugador = models.ForeignKey(PerfilUsuario, on_delete=models.CASCADE, related_name='membresias')
    fecha_unido = models.DateTimeField(auto_now_add=True)
    listo = models.BooleanField(default=False)  # Útil para botón "¡Estoy listo!"

    class Meta:
        unique_together = ('sala', 'jugador')
        ordering = ['fecha_unido']

    def __str__(self):
        return f"{self.jugador.username} en Sala {self.sala.codigo}"


class Sala(models.Model):
    ESTADOS = [
        ('esperando', 'Esperando Jugadores'),
        ('en_ronda', 'En Ronda Activa'),
        ('cuenta_regresiva', 'Cuenta Regresiva (10s)'),
        ('evaluacion', 'Calculando Puntos'),
        ('terminada', 'Partida Terminada'),
    ]
    
    # 🍻 Opciones de modos de juego
    MODOS = [
        ('clasico', 'Modo Clásico'),
        ('alcoholico', 'Modo Alcohólico'),
    ]
    
    codigo = models.CharField(max_length=6, primary_key=True, unique=True)
    creador = models.ForeignKey(PerfilUsuario, on_delete=models.CASCADE, related_name='salas_creadas')
    estado = models.CharField(max_length=20, choices=ESTADOS, default='esperando')
    
    # 🚀 NUEVO: Definimos el campo modo_juego a nivel de base de datos
    modo_juego = models.CharField(max_length=20, choices=MODOS, default='clasico')
    
    fecha_creacion = models.DateTimeField(auto_now_add=True)

    # ✅ Relación ManyToMany con modelo intermedio explícito
    jugadores = models.ManyToManyField(
        PerfilUsuario,
        through='SalaJugador',
        related_name='salas_participadas'
    )

    def __str__(self):
        return f"Sala {self.codigo} ({self.get_modo_juego_display()}) - {self.get_estado_display()}"


class Ronda(models.Model):
    sala = models.ForeignKey(Sala, on_delete=models.CASCADE, related_name='rondas')
    numero_ronda = models.PositiveIntegerField()
    letra = models.CharField(max_length=1)
    activa = models.BooleanField(default=True)
    fecha_inicio = models.DateTimeField(auto_now_add=True, null=True, blank=True)

    class Meta:
        ordering = ['numero_ronda']

    def __str__(self):
        return f"Sala {self.sala.codigo} - Ronda {self.numero_ronda} (Letra: {self.letra})"


class RespuestaJugador(models.Model):
    ronda = models.ForeignKey(Ronda, on_delete=models.CASCADE, related_name='respuestas')
    jugador = models.ForeignKey(PerfilUsuario, on_delete=models.CASCADE, related_name='respuestas_juego')
    
    nombre = models.CharField(max_length=100, blank=True, default="")
    apellido = models.CharField(max_length=100, blank=True, default="")
    ciudad_pais = models.CharField(max_length=100, blank=True, default="")
    animal = models.CharField(max_length=100, blank=True, default="")
    cosa = models.CharField(max_length=100, blank=True, default="")

    puntos_nombre = models.IntegerField(default=0)
    puntos_apellido = models.IntegerField(default=0)
    puntos_ciudad_pais = models.IntegerField(default=0)
    puntos_animal = models.IntegerField(default=0)
    puntos_cosa = models.IntegerField(default=0)
    total_puntos_ronda = models.IntegerField(default=0)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['ronda', 'jugador'], name='unique_respuesta_por_ronda')
        ]
        ordering = ['-ronda__numero_ronda']

    def __str__(self):
        return f"Respuestas de {self.jugador.usuario.username} - Ronda {self.ronda.numero_ronda}"