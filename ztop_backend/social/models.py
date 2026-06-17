from django.db import models
from juego.models import PerfilUsuario

class SolicitudAmistad(models.Model):
    ESTADOS = [
        ('pendiente', 'Pendiente'),
        ('aceptada', 'Aceptada'),
        ('rechazada', 'Rechazada'),
    ]
    emisor = models.ForeignKey(PerfilUsuario, on_delete=models.CASCADE, related_name='solicitudes_enviadas')
    receptor = models.ForeignKey(PerfilUsuario, on_delete=models.CASCADE, related_name='solicitudes_recibidas')
    estado = models.CharField(max_length=20, choices=ESTADOS, default='pendiente')
    fecha_envio = models.DateTimeField(auto_now_add=True)

    class Meta:
        # Evita que el mismo usuario le envíe 50 solicitudes al mismo amigo
        unique_together = ('emisor', 'receptor') 

    def __str__(self):
        return f"{self.emisor.usuario.username} -> {self.receptor.usuario.username} ({self.estado})"


class GrupoChat(models.Model):
    nombre = models.CharField(max_length=100, blank=True, help_text="Déjalo en blanco si es un chat 1vs1")
    es_grupo = models.BooleanField(default=False)
    miembros = models.ManyToManyField(PerfilUsuario, related_name='chats_participados')
    fecha_creacion = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.nombre if self.es_grupo else f"Chat Privado ({self.id})"


class MensajeChat(models.Model):
    grupo = models.ForeignKey(GrupoChat, on_delete=models.CASCADE, related_name='mensajes')
    autor = models.ForeignKey(PerfilUsuario, on_delete=models.CASCADE, related_name='mensajes_enviados')
    texto = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    
    # Para saber quiénes ya leyeron el mensaje y mostrar el doble check o notificaciones
    leido_por = models.ManyToManyField(PerfilUsuario, related_name='mensajes_leidos', blank=True)

    class Meta:
        ordering = ['timestamp'] # Ordena del más viejo al más nuevo cronológicamente

    def __str__(self):
        return f"{self.autor.usuario.username}: {self.texto[:20]}"


# ==========================================
# 🛡️ NUEVO MODELO: SISTEMA DE CLANES
# ==========================================
class Clan(models.Model):
    nombre = models.CharField(max_length=50, unique=True, help_text="Nombre oficial del Clan")
    tag = models.CharField(max_length=5, unique=True, help_text="Etiqueta corta, ej: [ZTOP]")
    lider = models.ForeignKey(PerfilUsuario, on_delete=models.PROTECT, related_name='clanes_liderados')
    miembros = models.ManyToManyField(PerfilUsuario, related_name='clanes_unidos', blank=True)
    
    # Cada clan tiene su propia sala de guerra conectada a tu sistema de mensajería existente
    chat_sala = models.OneToOneField(GrupoChat, on_delete=models.CASCADE, related_name='clan_asociado', null=True, blank=True)
    
    limite_miembros = models.IntegerField(default=15, help_text="Capacidad máxima de jugadores")
    fecha_creacion = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.tag} {self.nombre}"

    @property
    def puntaje_total(self):
        """
        Calcula dinámicamente el poder del clan.
        Suma el puntaje_total de cada perfil que sea miembro activo.
        """
        return sum(miembro.puntaje_total for miembro in self.miembros.all())