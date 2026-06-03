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