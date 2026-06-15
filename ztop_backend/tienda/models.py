from django.db import models
from juego.models import PerfilUsuario

class ItemCosmetico(models.Model):
    CATEGORIAS = [
        ('bottts', 'Robots (Bottts)'),
        ('pixel-art', 'Pixel Art'),
        ('avataaars', 'Personas (Avataaars)'),
        ('monsters', 'Monstruos'),
    ]
    
    nombre = models.CharField(max_length=50, unique=True)
    seed = models.CharField(max_length=100, help_text="La semilla de DiceBear")
    categoria = models.CharField(max_length=20, choices=CATEGORIAS, default='bottts')
    precio = models.IntegerField(default=100)
    fecha_creacion = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.nombre} ({self.get_categoria_display()}) - ${self.precio}"

class Monedero(models.Model):
    perfil = models.OneToOneField(PerfilUsuario, on_delete=models.CASCADE, related_name='monedero')
    monedas = models.IntegerField(default=0)
    ultima_actualizacion = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Monedero de {self.perfil.username}: {self.monedas} monedas"

class InventarioCosmetico(models.Model):
    perfil = models.OneToOneField(PerfilUsuario, on_delete=models.CASCADE, related_name='inventario')
    items_desbloqueados = models.ManyToManyField(ItemCosmetico, blank=True)

    def __str__(self):
        return f"Inventario de {self.perfil.username}"